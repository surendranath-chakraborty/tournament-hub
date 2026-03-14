const express      = require('express');
const router       = express.Router();
const Registration = require('../models/Registration');
const Tournament   = require('../models/Tournament');
const User         = require('../models/User');
const { protect, playerOnly } = require('../middleware/auth');

// POST /api/registrations  – player registers
router.post('/', protect, playerOnly, async (req, res) => {
  try {
    const { tournamentId, registrationType, teamName, players } = req.body;

    const t = await Tournament.findById(tournamentId);
    if (!t) return res.status(404).json({ message: 'Tournament not found' });

    if (new Date() > new Date(t.registrationDeadline))
      return res.status(400).json({ message: 'Registration deadline has passed' });

    if (['closed', 'cancelled'].includes(t.status))
      return res.status(400).json({ message: 'Tournament is not accepting registrations' });

    // Duplicate check
    const existing = await Registration.findOne({
      tournament: tournamentId,
      user: req.user._id,
      status: { $nin: ['withdrawn', 'removed'] },
    });
    if (existing)
      return res.status(400).json({ message: 'You are already registered for this tournament' });

    const isFull = t.registeredCount >= t.maxSlots;

    const waitlistPosition = isFull
      ? (await Registration.countDocuments({ tournament: tournamentId, status: 'waitlisted' })) + 1
      : null;

    // If free tournament → confirm immediately (unless full → waitlist)
    // If paid tournament → status stays 'pending' until payment verified
    let initialStatus = 'pending';
    if (t.entryFee === 0) {
      initialStatus = isFull ? 'waitlisted' : 'confirmed';
    }

    const reg = await Registration.create({
      tournament: tournamentId,
      user: req.user._id,
      registrationType,
      teamName: teamName || '',
      players:  players  || [],
      status:   initialStatus,
      waitlistPosition,
    });

    // Update tournament counts for free confirmed registrations
    if (t.entryFee === 0 && !isFull) {
      t.registeredCount += 1;
      if (t.registeredCount >= t.maxSlots) t.status = 'full';
      await t.save();
      await User.findByIdAndUpdate(req.user._id, { $inc: { tournamentsPlayed: 1 } });
    } else if (isFull) {
      t.waitlistCount += 1;
      await t.save();
    }

    res.status(201).json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/registrations/my  – player sees their own registrations
router.get('/my', protect, async (req, res) => {
  try {
    const regs = await Registration.find({ user: req.user._id })
      .populate('tournament', 'title sport location startDate endDate status entryFee withdrawalDeadline')
      .sort({ createdAt: -1 });
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/registrations/:id  – player edits team/player details
router.put('/:id', protect, playerOnly, async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    if (reg.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your registration' });

    const t = await Tournament.findById(reg.tournament);
    if (new Date() > new Date(t.editDeadline))
      return res.status(400).json({ message: 'Edit window has closed' });

    const { teamName, players } = req.body;
    if (teamName !== undefined) reg.teamName = teamName;
    if (players)                reg.players  = players;
    await reg.save();
    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/registrations/:id  – player withdraws
router.delete('/:id', protect, playerOnly, async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    if (reg.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your registration' });

    if (['withdrawn', 'removed'].includes(reg.status))
      return res.status(400).json({ message: 'Already withdrawn' });

    const t = await Tournament.findById(reg.tournament);
    const pastDeadline = new Date() > new Date(t.withdrawalDeadline);

    const wasConfirmed = reg.status === 'confirmed';
    reg.status = 'withdrawn';

    if (reg.paymentStatus === 'paid') {
      reg.refundStatus = pastDeadline ? 'none' : 'requested';
    }
    await reg.save();

    if (wasConfirmed) {
      t.registeredCount = Math.max(0, t.registeredCount - 1);

      // Auto-promote next waitlisted
      const next = await Registration.findOne(
        { tournament: t._id, status: 'waitlisted' }
      ).sort({ waitlistPosition: 1 });

      if (next) {
        next.status           = 'confirmed';
        next.waitlistPosition = null;
        await next.save();
        t.registeredCount += 1;
        t.waitlistCount    = Math.max(0, t.waitlistCount - 1);
      }

      if (t.status === 'full') t.status = 'upcoming';
      await t.save();
    }

    res.json({
      message: pastDeadline
        ? 'Withdrawn. No refund (past withdrawal deadline).'
        : 'Withdrawn. Refund will be processed.',
      refundEligible: !pastDeadline,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

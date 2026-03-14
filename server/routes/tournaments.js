const express      = require('express');
const router       = express.Router();
const Tournament   = require('../models/Tournament');
const Registration = require('../models/Registration');
const { protect, hostOnly } = require('../middleware/auth');

// GET /api/tournaments  – browse with optional filters
router.get('/', async (req, res) => {
  try {
    const { sport, city, status, type, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (sport)  filter.sport  = { $regex: sport,  $options: 'i' };
    if (city)   filter['location.city'] = { $regex: city, $options: 'i' };
    if (status) filter.status = status;
    if (type)   filter.type   = type;

    const total = await Tournament.countDocuments(filter);
    const tournaments = await Tournament.find(filter)
      .populate('host', 'name email city')
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      tournaments,
      total,
      pages: Math.ceil(total / limit),
      page: Number(page),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tournaments/host/my  – host's own tournaments
router.get('/host/my', protect, hostOnly, async (req, res) => {
  try {
    const tournaments = await Tournament.find({ host: req.user._id }).sort({ createdAt: -1 });
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tournaments/:id
router.get('/:id', async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id)
      .populate('host', 'name email city phone');
    if (!t) return res.status(404).json({ message: 'Tournament not found' });
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tournaments  – host creates
router.post('/', protect, hostOnly, async (req, res) => {
  try {
    const tournament = await Tournament.create({ ...req.body, host: req.user._id });
    res.status(201).json(tournament);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/tournaments/:id  – host updates
router.put('/:id', protect, hostOnly, async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Tournament not found' });
    if (t.host.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your tournament' });

    const updated = await Tournament.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/tournaments/:id  – host cancels
router.delete('/:id', protect, hostOnly, async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Not found' });
    if (t.host.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your tournament' });
    t.status = 'cancelled';
    await t.save();
    res.json({ message: 'Tournament cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tournaments/:id/registrations  – host sees all entries
router.get('/:id/registrations', protect, hostOnly, async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Not found' });
    if (t.host.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your tournament' });

    const regs = await Registration.find({ tournament: req.params.id })
      .populate('user', 'name email phone city')
      .sort({ createdAt: 1 });
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tournaments/:id/registrations/:regId  – host removes a player
router.delete('/:id/registrations/:regId', protect, hostOnly, async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id);
    if (t.host.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your tournament' });

    const reg = await Registration.findById(req.params.regId);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    const wasConfirmed = reg.status === 'confirmed';
    reg.status        = 'removed';
    reg.removedByHost = true;
    reg.hostNote      = req.body.note || 'Removed by host';
    await reg.save();

    if (wasConfirmed) {
      t.registeredCount = Math.max(0, t.registeredCount - 1);

      // Auto-promote from waitlist
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

    res.json({ message: 'Registration removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

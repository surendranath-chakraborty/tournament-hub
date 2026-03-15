const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Registration = require('../models/Registration');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate a fake but realistic-looking payment/order ID
function genId(prefix) {
  return prefix + '_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

// POST /api/payments/create-order
// Creates a payment order (no third party needed)
router.post('/create-order', protect, async function (req, res) {
  try {
    var registrationId = req.body.registrationId;
    var reg = await Registration.findById(registrationId).populate('tournament');
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    if (reg.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your registration' });

    var orderId = genId('order');
    reg.orderId = orderId;
    await reg.save();

    res.json({
      orderId: orderId,
      amount: reg.tournament.entryFee,
      currency: 'INR',
      tournamentName: reg.tournament.title,
      registrationId: registrationId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/verify
// Confirms the payment after user completes checkout
router.post('/verify', protect, async function (req, res) {
  try {
    var registrationId = req.body.registrationId;
    var orderId = req.body.orderId;
    var cardLast4 = req.body.cardLast4 || '0000';
    var paymentMethod = req.body.paymentMethod || 'card';

    var reg = await Registration.findById(registrationId);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    if (reg.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your registration' });

    // Verify the orderId matches what we issued
    if (reg.orderId !== orderId)
      return res.status(400).json({ message: 'Invalid order. Please try again.' });

    var tournament = await Tournament.findById(reg.tournament);
    var isFull = tournament.registeredCount >= tournament.maxSlots;

    // Generate payment ID
    var paymentId = genId('pay');

    reg.paymentStatus = 'paid';
    reg.paymentId = paymentId;
    reg.amountPaid = tournament.entryFee;
    reg.status = isFull ? 'waitlisted' : 'confirmed';

    if (!isFull) {
      tournament.registeredCount += 1;
      if (tournament.registeredCount >= tournament.maxSlots) tournament.status = 'full';
      await User.findByIdAndUpdate(req.user._id, { $inc: { tournamentsPlayed: 1 } });
    } else {
      reg.waitlistPosition =
        (await Registration.countDocuments({ tournament: reg.tournament, status: 'waitlisted' })) + 1;
      tournament.waitlistCount += 1;
    }

    await User.findByIdAndUpdate(tournament.host, { $inc: { totalRevenue: tournament.entryFee } });
    await reg.save();
    await tournament.save();

    res.json({
      message: 'Payment successful',
      status: reg.status,
      paymentId: paymentId,
      amount: tournament.entryFee,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
const express      = require('express');
const router       = express.Router();
const Razorpay     = require('razorpay');
const crypto       = require('crypto');
const Registration = require('../models/Registration');
const Tournament   = require('../models/Tournament');
const User         = require('../models/User');
const { protect }  = require('../middleware/auth');

const getRazorpay = () =>
  new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// POST /api/payments/create-order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { registrationId } = req.body;
    const reg = await Registration.findById(registrationId).populate('tournament');
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    if (reg.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your registration' });

    const amount = reg.tournament.entryFee * 100; // paise
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `reg_${registrationId}`,
    });

    reg.orderId = order.id;
    await reg.save();

    res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/verify
router.post('/verify', protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registrationId,
    } = req.body;

    // Verify HMAC signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ message: 'Payment verification failed – invalid signature' });

    const reg        = await Registration.findById(registrationId);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    const tournament = await Tournament.findById(reg.tournament);

    const isFull = tournament.registeredCount >= tournament.maxSlots;

    reg.paymentStatus = 'paid';
    reg.paymentId     = razorpay_payment_id;
    reg.amountPaid    = tournament.entryFee;
    reg.status        = isFull ? 'waitlisted' : 'confirmed';

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

    res.json({ message: 'Payment verified ✅', status: reg.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

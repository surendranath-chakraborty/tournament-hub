const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const userPayload = (u, token) => ({
  _id: u._id, name: u.name, email: u.email, role: u.role,
  phone: u.phone, city: u.city,
  tournamentsPlayed: u.tournamentsPlayed,
  tournamentsWon: u.tournamentsWon,
  tournamentsHosted: u.tournamentsHosted,
  totalRevenue: u.totalRevenue,
  token,
});

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('role').isIn(['host', 'player']).withMessage('Role must be host or player'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role, phone, city } = req.body;
    try {
      if (await User.findOne({ email }))
        return res.status(400).json({ message: 'Email already registered' });

      const user = await User.create({ name, email, password, role, phone, city });
      res.status(201).json(userPayload(user, makeToken(user._id)));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.matchPassword(password)))
        return res.status(401).json({ message: 'Invalid email or password' });

      res.json(userPayload(user, makeToken(user._id)));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, phone, city, password } = req.body;
    if (name)     user.name  = name;
    if (phone)    user.phone = phone;
    if (city)     user.city  = city;
    if (password) user.password = password; // pre-save hook re-hashes
    const saved = await user.save();
    res.json(userPayload(saved, makeToken(saved._id)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ── Helpers ───────────────────────────────────────────────────
const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const userPayload = (u, token) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone,
  city: u.city,
  isVerified: u.isVerified,
  trustScore: u.trustScore,
  isSuspended: u.isSuspended,
  isGoogleAuth: u.isGoogleAuth,
  photoURL: u.photoURL,
  tournamentsPlayed: u.tournamentsPlayed,
  tournamentsWon: u.tournamentsWon,
  tournamentsHosted: u.tournamentsHosted,
  totalRevenue: u.totalRevenue,
  token,
});

// ── Strong password validator ─────────────────────────────────
// Min 8 chars, 1 uppercase, 1 number, 1 special char
function isStrongPassword(pwd) {
  if (pwd.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pwd)) return 'Password must have at least 1 uppercase letter';
  if (!/[0-9]/.test(pwd)) return 'Password must have at least 1 number';
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must have at least 1 special character (@#$!%...)';
  return null;
}

// ── Disposable email domains blocklist ───────────────────────
const BLOCKED_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'temp-mail.org', 'throwaway.email',
  'fakeinbox.com', 'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com',
  'grr.la', 'guerrillamail.info', 'spam4.me', 'trashmail.com', 'tempr.email',
  'dispostable.com', 'mailnull.com', 'spamgourmet.com', 'spamgourmet.net',
  'maildrop.cc', 'spamoff.de', 'trashmail.at', 'trashmail.me',
];

function isDisposableEmail(email) {
  var domain = email.split('@')[1].toLowerCase();
  return BLOCKED_DOMAINS.includes(domain);
}

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').isIn(['host', 'player']).withMessage('Role must be host or player'),
    body('phone').optional().isMobilePhone('en-IN').withMessage('Enter valid Indian phone number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    const { name, email, password, role, phone, city } = req.body;

    // Block disposable emails
    if (isDisposableEmail(email))
      return res.status(400).json({ message: 'Disposable email addresses are not allowed. Please use a real email.' });

    // Strong password check
    const pwdError = isStrongPassword(password);
    if (pwdError) return res.status(400).json({ message: pwdError });

    try {
      if (await User.findOne({ email }))
        return res.status(400).json({ message: 'This email is already registered. Please login.' });

      const user = await User.create({ name, email, password, role, phone: phone || '', city: city || '' });
      res.status(201).json(userPayload(user, makeToken(user._id)));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });

      // Generic message — don't reveal if email exists or not
      if (!user || !(await user.matchPassword(password)))
        return res.status(401).json({ message: 'Invalid email or password' });

      if (user.isSuspended)
        return res.status(403).json({ message: 'Account suspended. Contact support.' });

      res.json(userPayload(user, makeToken(user._id)));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ── POST /api/auth/google ─────────────────────────────────────
// Firebase Google Sign-In — frontend sends idToken, we verify & login/register
router.post('/google', async (req, res) => {
  try {
    const { idToken, role } = req.body;
    if (!idToken) return res.status(400).json({ message: 'ID token required' });

    // Verify Firebase ID token
    let decoded;
    try {
      const admin = require('../utils/firebase-admin');
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (firebaseErr) {
      return res.status(401).json({ message: 'Invalid Google token. Please try again.' });
    }

    const { uid, email, name, picture } = decoded;
    if (!email) return res.status(400).json({ message: 'Google account has no email.' });

    // Find existing user or create new one
    let user = await User.findOne({ $or: [{ googleUid: uid }, { email }] });

    if (user) {
      // Update Google info if needed
      if (!user.googleUid) user.googleUid = uid;
      if (!user.photoURL) user.photoURL = picture || '';
      if (!user.isGoogleAuth) user.isGoogleAuth = true;
      user.name = user.name || name;
      await user.save();

      if (user.isSuspended)
        return res.status(403).json({ message: 'Account suspended. Contact support.' });
    } else {
      // New user via Google — role is required for first time
      if (!role || !['host', 'player'].includes(role))
        return res.status(400).json({ message: 'ROLE_REQUIRED' }); // frontend handles this

      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: uid + process.env.JWT_SECRET, // unusable password
        role,
        googleUid: uid,
        photoURL: picture || '',
        isGoogleAuth: true,
        isVerified: true, // Google emails are already verified
      });
    }

    res.json(userPayload(user, makeToken(user._id)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json(userPayload(req.user, makeToken(req.user._id)));
});

// ── PUT /api/auth/profile ─────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, phone, city, password, currentPassword } = req.body;

    if (name) user.name = name.trim();
    if (phone) user.phone = phone;
    if (city) user.city = city;

    if (password) {
      // Require current password for security (unless Google auth)
      if (!user.isGoogleAuth) {
        if (!currentPassword)
          return res.status(400).json({ message: 'Current password is required to set a new password' });
        const match = await user.matchPassword(currentPassword);
        if (!match)
          return res.status(401).json({ message: 'Current password is incorrect' });
      }
      const pwdError = isStrongPassword(password);
      if (pwdError) return res.status(400).json({ message: pwdError });
      user.password = password;
    }

    const saved = await user.save();
    res.json(userPayload(saved, makeToken(saved._id)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
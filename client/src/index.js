require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ── Security Headers ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,       // disabled so React build works
  crossOriginEmbedderPolicy: false,   // needed for Firebase auth
  crossOriginOpenerPolicy: false,     // IMPORTANT: allows Firebase Google popup/redirect
}));

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'https://tournament-hub-d86y.onrender.com',
  ],
  credentials: true,
}));

// ── Body Parser ───────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // block huge payloads

// ── Global Rate Limiter ───────────────────────────────────────
// Max 100 requests per 15 minutes per IP
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Stricter limiter for auth routes — prevent brute force
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts. Please wait 15 minutes.' },
}));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/live', require('./routes/live'));
app.use('/api/users', require('./routes/users'));

// ── Health check (for UptimeRobot) ───────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── Serve React build in production ──────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '../client/build/index.html'))
  );
}

// ── Connect DB + Start ────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Keep-alive ping for Render free tier
const https = require('https');
if (process.env.NODE_ENV === 'production' && process.env.RENDER_URL) {
  setInterval(() => {
    https.get(process.env.RENDER_URL + '/api/health', () => { }).on('error', () => { });
  }, 14 * 60 * 1000);
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/tournaments',   require('./routes/tournaments'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/ai',            require('./routes/ai'));
app.use('/api/users',         require('./routes/users'));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'Tournament Hub API running 🏆' });
});

// ── Serve React build in production ───────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build/index.html'));
  });
}

// ── Connect MongoDB then start server ────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀  Server running → http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌  MongoDB error:', err.message);
    process.exit(1);
  });

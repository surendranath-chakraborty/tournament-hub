const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and attach user to req
const protect = async (req, res, next) => {
  let token;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    token = auth.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized – no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// Only hosts
const hostOnly = (req, res, next) => {
  if (req.user && req.user.role === 'host') return next();
  res.status(403).json({ message: 'Hosts only' });
};

// Only players
const playerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'player') return next();
  res.status(403).json({ message: 'Players only' });
};

module.exports = { protect, hostOnly, playerOnly };

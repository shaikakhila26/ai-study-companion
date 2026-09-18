const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const env = require('../config/env');
const User = require('../models/User');

// Verifies JWT and attaches req.user. This is the single gate for
// "controlled, validated, permission-aware" access mentioned in the PRD --
// every project-scoped route depends on req.user.id being trustworthy.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401);
    throw new Error('Not authenticated: missing token');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    res.status(401);
    throw new Error('Not authenticated: invalid or expired token');
  }

  const user = await User.findById(decoded.sub).select('-passwordHash');
  if (!user) {
    res.status(401);
    throw new Error('Not authenticated: user no longer exists');
  }

  req.user = user;
  next();
});

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  next();
};

module.exports = { protect, requireAdmin };

// =============================================
// middleware/auth.js — JWT Auth Middleware
// =============================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nhamblog_super_secret_2026_!@#';

/**
 * Middleware: verify JWT token from Authorization header
 * Usage: router.post('/route', authMiddleware, handler)
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired — Please login again' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Generate a JWT token for admin
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

module.exports = { authMiddleware, generateToken, JWT_SECRET };

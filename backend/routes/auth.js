// =============================================
// routes/auth.js — Authentication Routes
// POST /api/auth/login         (public)
// GET  /api/auth/verify        (auth required)
// POST /api/auth/change-password (auth required)
// =============================================

const express = require('express');
const bcrypt  = require('bcryptjs');
const router  = express.Router();

const db = require('../data/db');
const { generateToken, authMiddleware } = require('../middleware/auth');

// ---- In-memory login attempt tracker ----
// { ip: { count, lockedUntil } }
const loginAttempts = {};
const MAX_ATTEMPTS   = 5;
const LOCKOUT_MS     = 15 * 60 * 1000; // 15 minutes

function checkLockout(ip) {
  const record = loginAttempts[ip];
  if (!record) return false;
  if (record.lockedUntil && Date.now() < record.lockedUntil) return true;
  // Lockout expired — reset
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    delete loginAttempts[ip];
  }
  return false;
}

function recordFailedAttempt(ip) {
  if (!loginAttempts[ip]) loginAttempts[ip] = { count: 0, lockedUntil: null };
  loginAttempts[ip].count += 1;
  if (loginAttempts[ip].count >= MAX_ATTEMPTS) {
    loginAttempts[ip].lockedUntil = Date.now() + LOCKOUT_MS;
  }
}

function clearAttempts(ip) {
  delete loginAttempts[ip];
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    // Check if IP is locked out
    if (checkLockout(ip)) {
      const record = loginAttempts[ip];
      const remainingMin = Math.ceil((record.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        error: `Quá nhiều lần đăng nhập sai. Thử lại sau ${remainingMin} phút.`,
      });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tài khoản và mật khẩu.' });
    }

    const admin = db.getDoc('admin');

    // Always compare to prevent timing attacks (even if username wrong)
    const dummyHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    const passwordMatch = admin && admin.username === username.trim()
      ? await bcrypt.compare(password, admin.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!admin || admin.username !== username.trim() || !passwordMatch) {
      recordFailedAttempt(ip);
      const attemptsLeft = MAX_ATTEMPTS - (loginAttempts[ip]?.count || 0);
      const msg = attemptsLeft <= 0
        ? `Tài khoản bị khoá 15 phút do đăng nhập sai nhiều lần.`
        : `Tài khoản hoặc mật khẩu không đúng. Còn ${attemptsLeft} lần thử.`;
      return res.status(401).json({ error: msg });
    }

    // Success — clear attempts
    clearAttempts(ip);
    const token = generateToken({ username: admin.username, name: admin.name });
    res.json({
      success: true,
      token,
      user: { username: admin.username, name: admin.name },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau.' });
  }
});

// GET /api/auth/verify
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Cần nhập đủ mật khẩu cũ và mới.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu mới phải ít nhất 8 ký tự.' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu cũ.' });
    }

    const admin = db.getDoc('admin');
    const valid  = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng!' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    db.setDoc('admin', { passwordHash: newHash });
    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
});

// POST /api/auth/logout (optional — token invalidation via client)
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ success: true });
});

module.exports = router;

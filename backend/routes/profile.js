// =============================================
// routes/profile.js — Profile Routes
// GET  /api/profile           — get public profile
// PUT  /api/profile           — update profile (auth)
// POST /api/profile/avatar    — upload avatar (auth)
// POST /api/profile/cv        — upload CV PDF (auth)
// DELETE /api/profile/avatar  — remove avatar (auth)
// DELETE /api/profile/cv      — remove CV (auth)
// =============================================

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

const db = require('../data/db');
const storageFiles = require('../data/storage');
const { authMiddleware } = require('../middleware/auth');
const { UPLOADS_DIR } = require('../config/paths');

// ---- Multer for avatar ----
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(UPLOADS_DIR, 'avatars')),
  filename:    (req, file, cb) => cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`),
});
const uploadAvatar = multer({
  storage: avatarStorage,
  limits:  { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images'));
    cb(null, true);
  },
});

// ---- Multer for CV PDF ----
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(UPLOADS_DIR, 'cv')),
  filename:    (req, file, cb) => cb(null, `cv-${Date.now()}.pdf`),
});
const uploadCv = multer({
  storage: cvStorage,
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF files'));
    cb(null, true);
  },
});

// GET /api/profile — public
router.get('/', async (req, res) => {
  const profile = await db.getDoc('profile');
  res.json(profile);
});

// PUT /api/profile — update text fields (auth)
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name, title, email, phone, location, github, hero, bio, status } = req.body;
    const patch = {};
    Object.entries({ name, title, email, phone, location, github, hero, bio, status }).forEach(([key, value]) => {
      if (value !== undefined) patch[key] = value;
    });
    const updated = await db.setDoc('profile', patch);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/avatar — upload avatar image (auth)
router.post('/avatar', authMiddleware, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const profile = await db.getDoc('profile');
    // Delete old avatar
    await storageFiles.deleteFile(profile.avatarUrl);

    const avatarUrl = await storageFiles.uploadFile(req.file, 'avatars');
    const updated   = await db.setDoc('profile', { avatarUrl });
    res.json({ success: true, avatarUrl: updated.avatarUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/profile/avatar — remove avatar (auth)
router.delete('/avatar', authMiddleware, async (req, res) => {
  try {
    const profile = await db.getDoc('profile');
    await storageFiles.deleteFile(profile.avatarUrl);
    await db.setDoc('profile', { avatarUrl: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/cv — upload CV PDF (auth)
router.post('/cv', authMiddleware, uploadCv.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const profile = await db.getDoc('profile');
    // Delete old CV
    await storageFiles.deleteFile(profile.cvUrl);

    const cvUrl  = await storageFiles.uploadFile(req.file, 'cv');
    const cvName = req.file.originalname;
    const updated = await db.setDoc('profile', { cvUrl, cvName });
    res.json({ success: true, cvUrl: updated.cvUrl, cvName: updated.cvName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/profile/cv — remove CV (auth)
router.delete('/cv', authMiddleware, async (req, res) => {
  try {
    const profile = await db.getDoc('profile');
    await storageFiles.deleteFile(profile.cvUrl);
    await db.setDoc('profile', { cvUrl: null, cvName: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

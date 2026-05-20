// =============================================
// routes/settings.js — Settings Routes
// GET /api/settings        — get settings (public)
// PUT /api/settings        — update settings (auth)
// POST /api/settings/music — upload background music (auth)
// DELETE /api/settings/music — remove music (auth)
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

// ---- Multer for music ----
const musicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOADS_DIR, 'music');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `music-${Date.now()}${ext}`);
  },
});
const uploadMusic = multer({
  storage: musicStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('audio/')) return cb(new Error('Only audio files'));
    cb(null, true);
  },
});

// GET /api/settings (public)
router.get('/', async (req, res) => {
  const settings = await db.getDoc('settings');
  res.json(settings);
});

// PUT /api/settings (auth)
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { maintenance, siteName } = req.body;
    const patch = {};
    if (maintenance !== undefined) patch.maintenance = maintenance;
    if (siteName !== undefined) patch.siteName = siteName;
    const updated = await db.setDoc('settings', patch);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/music (auth)
router.post('/music', authMiddleware, uploadMusic.single('music'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const settings = await db.getDoc('settings');
    await storageFiles.deleteFile(settings.musicUrl);

    const musicUrl = await storageFiles.uploadFile(req.file, 'music');
    const updated  = await db.setDoc('settings', { musicUrl, musicName: req.file.originalname });
    res.json({ success: true, musicUrl: updated.musicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/settings/music (auth)
router.delete('/music', authMiddleware, async (req, res) => {
  try {
    const settings = await db.getDoc('settings');
    await storageFiles.deleteFile(settings.musicUrl);
    await db.setDoc('settings', { musicUrl: null, musicName: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

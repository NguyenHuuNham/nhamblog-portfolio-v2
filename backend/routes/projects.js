// =============================================
// routes/projects.js — Project Routes
// GET    /api/projects          — list all projects
// GET    /api/projects/:id      — get single project
// POST   /api/projects          — create (auth)
// PUT    /api/projects/:id      — update (auth)
// DELETE /api/projects/:id      — delete (auth)
// =============================================

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

const db = require('../data/db');
const { authMiddleware } = require('../middleware/auth');

// ---- File upload config ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../data/uploads/projects');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    cb(null, `project-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  },
});

// GET /api/projects
router.get('/', (req, res) => {
  let projects = db.getAll('projects');
  const { tech, status, featured } = req.query;

  if (tech && tech !== 'all') {
    projects = projects.filter(p => (p.tech || []).includes(tech));
  }
  if (status) {
    projects = projects.filter(p => p.status === status);
  }
  if (featured === 'true') {
    projects = projects.filter(p => p.featured === true);
  }

  // Sort by id
  projects.sort((a, b) => (a.id || 0) - (b.id || 0));
  res.json(projects);
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const project = db.getById('projects', req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// POST /api/projects — create (auth)
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  try {
    const { icon, title, description, techLabels, tech, status, github, demo, featured } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const techArr       = parseJsonOrArray(tech, []);
    const techLabelsArr = typeof techLabels === 'string' && techLabels.includes('[')
      ? JSON.parse(techLabels)
      : (techLabels || '').split(',').map(t => t.trim()).filter(Boolean);

    const imageUrl = req.file ? `/uploads/projects/${req.file.filename}` : null;

    const newProject = db.create('projects', {
      icon:       icon?.trim() || '📱',
      title:      title.trim(),
      description: description.trim(),
      tech:       techArr,
      techLabels: techLabelsArr,
      status:     status || 'completed',
      github:     github?.trim() || null,
      demo:       demo?.trim() || null,
      featured:   featured === 'true' || featured === true,
      imageUrl,
    });

    res.status(201).json(newProject);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id — update (auth)
router.put('/:id', authMiddleware, upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.getById('projects', id);
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    const { icon, title, description, techLabels, tech, status, github, demo, featured } = req.body;

    const techArr       = tech ? parseJsonOrArray(tech, existing.tech) : existing.tech;
    const techLabelsArr = techLabels
      ? (typeof techLabels === 'string' && techLabels.includes('[')
        ? JSON.parse(techLabels)
        : techLabels.split(',').map(t => t.trim()).filter(Boolean))
      : existing.techLabels;

    let imageUrl = existing.imageUrl;
    if (req.file) {
      if (existing.imageUrl) {
        const old = path.join(__dirname, '../data', existing.imageUrl);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      imageUrl = `/uploads/projects/${req.file.filename}`;
    }

    const updated = db.update('projects', id, {
      icon:        icon?.trim()        || existing.icon,
      title:       title?.trim()       || existing.title,
      description: description?.trim() || existing.description,
      tech:        techArr,
      techLabels:  techLabelsArr,
      status:      status              || existing.status,
      github:      github !== undefined ? (github.trim() || null) : existing.github,
      demo:        demo   !== undefined ? (demo.trim()   || null) : existing.demo,
      featured:    featured !== undefined ? (featured === 'true' || featured === true) : existing.featured,
      imageUrl,
    });

    res.json(updated);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id — delete (auth)
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.getById('projects', id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  if (existing.imageUrl) {
    const imgPath = path.join(__dirname, '../data', existing.imageUrl);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  db.remove('projects', id);
  res.json({ success: true });
});

function parseJsonOrArray(val, def) {
  if (!val) return def;
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return def; }
}

module.exports = router;

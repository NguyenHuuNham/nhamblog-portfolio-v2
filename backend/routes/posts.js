// =============================================
// routes/posts.js — Blog Post Routes
// GET    /api/posts          — list all posts
// GET    /api/posts/:id      — get by id or slug
// POST   /api/posts          — create (auth)
// PUT    /api/posts/:id      — update (auth)
// DELETE /api/posts/:id      — delete (auth)
// POST   /api/posts/:id/like     — like post (public)
// POST   /api/posts/:id/comment  — add comment (public)
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
    const dir = path.join(__dirname, '../data/uploads/posts');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `post-${Date.now()}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  },
});

// GET /api/posts — list all posts with optional filter
router.get('/', (req, res) => {
  let posts = db.getAll('posts');
  const { tag, search, limit } = req.query;

  // Filter by tag
  if (tag && tag !== 'all') {
    posts = posts.filter(p => (p.tags || []).includes(tag));
  }

  // Filter by search
  if (search) {
    const q = search.toLowerCase();
    posts = posts.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.summary?.toLowerCase().includes(q)
    );
  }

  // Sort by date desc
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Limit
  if (limit) {
    posts = posts.slice(0, parseInt(limit));
  }

  res.json(posts);
});

// GET /api/posts/:id — get by numeric id or slug
router.get('/:id', (req, res) => {
  const { id } = req.params;
  let post = null;

  if (isNaN(id)) {
    // Try slug
    post = db.getByField('posts', 'slug', id);
  } else {
    post = db.getById('posts', id);
  }

  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// POST /api/posts — create new post (auth required)
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  try {
    const { title, slug, summary, content, date, readTime, tags } = req.body;
    if (!title || !summary) {
      return res.status(400).json({ error: 'Title and summary are required' });
    }

    const tagsArr = typeof tags === 'string'
      ? JSON.parse(tags || '[]')
      : (tags || []);

    const imageUrl = req.file
      ? `/uploads/posts/${req.file.filename}`
      : (req.body.imageUrl || null);

    const newPost = db.create('posts', {
      title:    title.trim(),
      slug:     slug?.trim() || toSlug(title),
      summary:  summary.trim(),
      content:  content?.trim() || '',
      date:     date || new Date().toISOString().slice(0, 10),
      readTime: readTime || '5 phút',
      tags:     tagsArr,
      likes:    0,
      comments: [],
      imageUrl,
    });

    res.status(201).json(newPost);
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/posts/:id — update post (auth required)
router.put('/:id', authMiddleware, upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.getById('posts', id);
    if (!existing) return res.status(404).json({ error: 'Post not found' });

    const { title, slug, summary, content, date, readTime, tags, imageUrl: bodyImageUrl } = req.body;

    const tagsArr = typeof tags === 'string'
      ? JSON.parse(tags || '[]')
      : (tags || existing.tags);

    let imageUrl = existing.imageUrl;
    if (req.file) {
      // Delete old image
      if (existing.imageUrl) {
        const oldPath = path.join(__dirname, '../data', existing.imageUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imageUrl = `/uploads/posts/${req.file.filename}`;
    } else if (bodyImageUrl !== undefined) {
      imageUrl = bodyImageUrl;
    }

    const updated = db.update('posts', id, {
      title:    title?.trim()   || existing.title,
      slug:     slug?.trim()    || existing.slug,
      summary:  summary?.trim() || existing.summary,
      content:  content?.trim() ?? existing.content,
      date:     date            || existing.date,
      readTime: readTime        || existing.readTime,
      tags:     tagsArr,
      imageUrl,
    });

    res.json(updated);
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posts/:id — delete post (auth required)
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = db.getById('posts', id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });

  // Delete image file
  if (existing.imageUrl) {
    const imgPath = path.join(__dirname, '../data', existing.imageUrl);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  db.remove('posts', id);
  res.json({ success: true, message: 'Post deleted' });
});

// POST /api/posts/:id/like — like a post (public)
router.post('/:id/like', (req, res) => {
  const { id } = req.params;
  const post = db.getById('posts', id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const updated = db.update('posts', id, { likes: (post.likes || 0) + 1 });
  res.json({ likes: updated.likes });
});

// POST /api/posts/:id/comment — add comment (public)
router.post('/:id/comment', (req, res) => {
  const { id } = req.params;
  const { name, content } = req.body;

  if (!name?.trim() || !content?.trim()) {
    return res.status(400).json({ error: 'Name and content required' });
  }

  const post = db.getById('posts', id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = {
    id:        Date.now(),
    name:      name.trim(),
    content:   content.trim(),
    createdAt: new Date().toISOString(),
  };

  const comments = [...(post.comments || []), comment];
  db.update('posts', id, { comments });
  res.status(201).json(comment);
});

// ---- Util ----
function toSlug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
}

module.exports = router;

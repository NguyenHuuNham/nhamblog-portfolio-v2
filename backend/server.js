// =============================================
// server.js — Express REST API Backend
// Nhâm Mobile Dev Portfolio
// =============================================

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ---- Ensure data directory exists ----
const DATA_DIR    = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
[DATA_DIR, UPLOADS_DIR,
  path.join(UPLOADS_DIR, 'avatars'),
  path.join(UPLOADS_DIR, 'cv'),
  path.join(UPLOADS_DIR, 'posts'),
  path.join(UPLOADS_DIR, 'projects'),
].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

// ---- Seed default data if not exists ----
require('./data/seed');

// ---- Middleware ----
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (same-origin, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow all localhost/127.0.0.1 regardless of port
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // In production, allow same origin (no CORS needed anyway)
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files publicly (with CORS for PDF/audio)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(UPLOADS_DIR));

// Serve frontend static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// ---- API Routes ----
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/posts',    require('./routes/posts'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/profile',  require('./routes/profile'));
app.use('/api/settings', require('./routes/settings'));

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), version: '1.0.0' });
});

// ---- Catch all — return index.html for client-side routing ----
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ---- Start server ----
app.listen(PORT, () => {
  console.log(`\n✅ Nhâm Blog Backend running at:`);
  console.log(`   🌐 http://localhost:${PORT}`);
  console.log(`   🔑 Admin: http://localhost:${PORT}/admin/login.html`);
  console.log(`   📡 API:   http://localhost:${PORT}/api/health\n`);
});

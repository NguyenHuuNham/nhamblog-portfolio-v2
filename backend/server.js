// =============================================
// server.js — Express REST API Backend
// Nhâm Mobile Dev Portfolio
// Works both locally and on Vercel serverless
// =============================================

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ---- Root of the project (always the parent of /backend) ----
const ROOT_DIR = path.resolve(__dirname, '..');

// ---- On Vercel, uploads go to /tmp (writable); locally use data/uploads ----
const IS_VERCEL   = !!process.env.VERCEL;
const DATA_DIR    = path.join(__dirname, 'data');
const UPLOADS_DIR = IS_VERCEL ? '/tmp/nham-uploads' : path.join(DATA_DIR, 'uploads');

// Ensure upload directories exist (writable on both local and Vercel /tmp)
const uploadSubdirs = ['', 'avatars', 'cv', 'posts', 'projects', 'music'];
uploadSubdirs.forEach(sub => {
  const dir = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});


// ---- Seed default data if not exists ----
require('./data/seed');

// ---- Middleware ----
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API data must always reflect the latest admin changes.
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Serve uploaded files
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
}, express.static(UPLOADS_DIR));

// Serve frontend static files from root directory
app.use(express.static(ROOT_DIR));

// ---- API Routes ----
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/posts',    require('./routes/posts'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/profile',  require('./routes/profile'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/code',     require('./routes/code'));

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), version: '1.0.0', env: IS_VERCEL ? 'vercel' : 'local', cwd: ROOT_DIR });
});

// ---- Catch all — serve HTML pages ----
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Try to serve the specific HTML file first
  const htmlFile = path.join(ROOT_DIR, req.path);
  if (!req.path.includes('.') && fs.existsSync(htmlFile + '.html')) {
    return res.sendFile(htmlFile + '.html');
  }
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});


// ---- Start server (only when running directly, not on Vercel) ----
if (!IS_VERCEL && require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n✅ Nhâm Blog Backend running at:`);
    console.log(`   🌐 http://localhost:${PORT}`);
    console.log(`   🔑 Admin: http://localhost:${PORT}/admin/login.html`);
    console.log(`   📡 API:   http://localhost:${PORT}/api/health\n`);
  });
}

// Export for Vercel serverless
module.exports = app;

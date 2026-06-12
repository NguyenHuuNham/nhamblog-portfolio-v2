// =============================================
// server.js — Express REST API Backend
// Nhâm Mobile Dev Portfolio
// Works both locally and on Vercel serverless
// =============================================

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');
const {
  IS_VERCEL,
  ROOT_DIR,
  DATA_DIR,
  UPLOADS_DIR,
  STORAGE_MODE,
  PERSISTENT_STORAGE_CONFIGURED,
  BUNDLE_DATA_DIR,
  SUPABASE_ENABLED,
} = require('./config/paths');
const storageFiles = require('./data/storage');

const app  = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directories exist
const uploadSubdirs = ['', 'avatars', 'cv', 'posts', 'projects', 'music'];
uploadSubdirs.forEach(sub => {
  const dir = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function copySeedUploads(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(dstDir, { recursive: true });
  fs.readdirSync(srcDir, { withFileTypes: true }).forEach(entry => {
    const src = path.join(srcDir, entry.name);
    const dst = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copySeedUploads(src, dst);
    } else if (!fs.existsSync(dst)) {
      fs.copyFileSync(src, dst);
    }
  });
}

if (!SUPABASE_ENABLED) {
  const bundledUploads = path.join(BUNDLE_DATA_DIR, 'uploads');
  if (path.resolve(UPLOADS_DIR) !== path.resolve(bundledUploads)) {
    copySeedUploads(bundledUploads, UPLOADS_DIR);
  }
}

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

app.use('/api', (req, res, next) => {
  const writesData = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const authOnly = req.path === '/auth/login' || req.path === '/auth/logout';

  if (IS_VERCEL && !PERSISTENT_STORAGE_CONFIGURED && writesData && !authOnly) {
    return res.status(503).json({
      error: 'Production storage is not configured. Add BLOB_READ_WRITE_TOKEN, DATABASE_URL, or Supabase env vars in Vercel Production, then redeploy.',
      storage: STORAGE_MODE,
      action: 'set-production-storage-env',
    });
  }

  return next();
});

// Serve uploaded files from PostgreSQL first when DATABASE_URL is configured.
app.get('/uploads/*', async (req, res, next) => {
  try {
    const pathname = `/uploads/${req.params[0] || ''}`;
    const dbFile = await storageFiles.getDatabaseFile(pathname);
    if (!dbFile) return next();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Content-Type', dbFile.mimeType);
    res.setHeader('Content-Length', dbFile.size || dbFile.data.length);
    return res.send(dbFile.data);
  } catch (err) {
    return next(err);
  }
});

// Serve uploaded files
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
}, express.static(UPLOADS_DIR));

// Serve frontend static files from root directory. Keep HTML/CSS/JS fresh after deploy.
app.use(express.static(ROOT_DIR, {
  etag: false,
  maxAge: 0,
  setHeaders: (res, filePath) => {
    if (/\.(html|css|js|json)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
  },
}));

// ---- API Routes ----
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/posts',    require('./routes/posts'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/profile',  require('./routes/profile'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/code',     require('./routes/code'));

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    version: '1.0.0',
    env: IS_VERCEL ? 'vercel' : 'node',
    storage: STORAGE_MODE,
    persistent: PERSISTENT_STORAGE_CONFIGURED,
    needsStorageSetup: IS_VERCEL && !PERSISTENT_STORAGE_CONFIGURED,
    cwd: ROOT_DIR,
    dataDir: DATA_DIR,
  });
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

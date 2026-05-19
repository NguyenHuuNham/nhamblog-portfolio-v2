// =============================================
// config/paths.js - Shared storage paths
// Local: backend/data + backend/data/uploads
// Render persistent disk: PERSIST_DIR=/var/data
// Vercel fallback: /tmp (not persistent)
// =============================================
const path = require('path');

const IS_VERCEL = !!process.env.VERCEL;
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const BUNDLE_DATA_DIR = path.resolve(__dirname, '..', 'data');
const PERSIST_DIR = process.env.PERSIST_DIR ? path.resolve(process.env.PERSIST_DIR) : null;

const DATA_DIR = PERSIST_DIR
  ? path.join(PERSIST_DIR, 'data')
  : (IS_VERCEL ? '/tmp/nham-data' : BUNDLE_DATA_DIR);

const UPLOADS_DIR = PERSIST_DIR
  ? path.join(PERSIST_DIR, 'uploads')
  : (IS_VERCEL ? '/tmp/nham-uploads' : path.join(BUNDLE_DATA_DIR, 'uploads'));

const STORAGE_MODE = PERSIST_DIR ? 'persistent-disk' : (IS_VERCEL ? 'vercel-tmp' : 'local');

module.exports = {
  IS_VERCEL,
  ROOT_DIR,
  BUNDLE_DATA_DIR,
  PERSIST_DIR,
  DATA_DIR,
  UPLOADS_DIR,
  STORAGE_MODE,
};

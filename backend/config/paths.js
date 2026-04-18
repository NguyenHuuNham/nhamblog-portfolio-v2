// =============================================
// config/paths.js — Shared path config for Vercel + local
// =============================================
const path = require('path');

const IS_VERCEL   = !!process.env.VERCEL;
const UPLOADS_DIR = IS_VERCEL ? '/tmp/nham-uploads' : path.join(__dirname, '../data/uploads');

module.exports = { IS_VERCEL, UPLOADS_DIR };

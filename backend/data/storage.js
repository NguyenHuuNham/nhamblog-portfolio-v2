// =============================================
// data/storage.js - Upload adapter
// Supabase Storage when configured, otherwise local /uploads files.
// =============================================

const fs = require('fs');
const path = require('path');
const {
  STORAGE_MODE,
  SUPABASE_BUCKET,
  SUPABASE_ENABLED,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  UPLOADS_DIR,
} = require('../config/paths');

function publicUrl(objectPath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${objectPath}`;
}

async function uploadFile(file, folder) {
  if (!file) return null;

  const objectPath = `${folder}/${path.basename(file.filename || file.path)}`;
  if (!SUPABASE_ENABLED) return `/uploads/${objectPath}`;

  const bytes = fs.readFileSync(file.path);
  const resp = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': file.mimetype || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: bytes,
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Supabase upload failed: ${text || resp.statusText}`);
  }

  try { fs.unlinkSync(file.path); } catch {}
  return publicUrl(objectPath);
}

async function deleteFile(url) {
  if (!url) return;

  if (!SUPABASE_ENABLED) {
    const pathname = new URL(url, 'http://local.test').pathname;
    if (!pathname.startsWith('/uploads/')) return;
    const localPath = path.join(UPLOADS_DIR, pathname.replace('/uploads/', ''));
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    return;
  }

  const marker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const objectPath = decodeURIComponent(url.slice(idx + marker.length));

  await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/remove`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefixes: [objectPath] }),
  }).catch(() => {});
}

module.exports = {
  uploadFile,
  deleteFile,
  STORAGE_MODE,
};

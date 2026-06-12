// =============================================
// data/storage.js - Upload adapter
// Supabase Storage when configured, otherwise local /uploads files.
// =============================================

const fs = require('fs');
const path = require('path');
const {
  STORAGE_MODE,
  POSTGRES_ENABLED,
  SUPABASE_BUCKET,
  SUPABASE_ENABLED,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  UPLOADS_DIR,
} = require('../config/paths');
const db = require('./db');

function publicUrl(objectPath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${objectPath}`;
}

async function uploadFile(file, folder) {
  if (!file) return null;

  const objectPath = `${folder}/${path.basename(file.filename || file.path)}`;
  const publicPath = `/uploads/${objectPath}`;

  if (POSTGRES_ENABLED) {
    const bytes = fs.readFileSync(file.path);
    await db.postgresQuery(
      `insert into nham_files (path, mime_type, data, size, updated_at)
       values ($1, $2, $3, $4, now())
       on conflict (path)
       do update set mime_type = excluded.mime_type,
                     data = excluded.data,
                     size = excluded.size,
                     updated_at = now()`,
      [publicPath, file.mimetype || 'application/octet-stream', bytes, bytes.length]
    );
    try { fs.unlinkSync(file.path); } catch {}
    return publicPath;
  }

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

  if (POSTGRES_ENABLED) {
    const pathname = new URL(url, 'http://local.test').pathname;
    if (!pathname.startsWith('/uploads/')) return;
    await db.postgresQuery('delete from nham_files where path = $1', [pathname]);
    return;
  }

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

async function getDatabaseFile(urlPath) {
  if (!POSTGRES_ENABLED || !urlPath?.startsWith('/uploads/')) return null;
  const result = await db.postgresQuery(
    'select path, mime_type, data, size, updated_at from nham_files where path = $1 limit 1',
    [urlPath]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    path: row.path,
    mimeType: row.mime_type,
    data: Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data),
    size: Number(row.size || 0),
    updatedAt: row.updated_at,
  };
}

module.exports = {
  uploadFile,
  deleteFile,
  getDatabaseFile,
  STORAGE_MODE,
};

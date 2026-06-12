// =============================================
// data/db.js - Database adapter
// Priority: PostgreSQL (DATABASE_URL) > Supabase > JSON files.
// =============================================

const fs = require('fs');
const path = require('path');
const {
  BUNDLE_DATA_DIR,
  DATA_DIR,
  DATABASE_URL,
  IS_VERCEL,
  POSTGRES_ENABLED,
  STORAGE_MODE,
  SUPABASE_ENABLED,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = require('../config/paths');

const JSON_COLLECTIONS = ['posts', 'projects', 'profile', 'settings', 'admin'];
const DOC_COLLECTIONS = ['profile', 'settings', 'admin'];
const ITEM_COLLECTIONS = ['posts', 'projects'];

const DEFAULT_ADMIN = {
  username: 'admin',
  passwordHash: '$2a$10$QcEAoVtCJemxe5xrqlbsF.MM.2tAqGsWoq9SscPSph3MlLZYPaG2C',
  name: 'Nguyen Huu Nham',
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// When DATA_DIR is outside bundled backend/data, copy committed JSON files once.
// Vercel /tmp is volatile, so refresh it from the bundle on cold starts.
if (!POSTGRES_ENABLED && !SUPABASE_ENABLED && path.resolve(DATA_DIR) !== path.resolve(BUNDLE_DATA_DIR)) {
  JSON_COLLECTIONS.forEach(name => {
    const src = path.join(BUNDLE_DATA_DIR, `${name}.json`);
    const dst = path.join(DATA_DIR, `${name}.json`);
    const shouldRefreshVolatileSeed = IS_VERCEL && STORAGE_MODE === 'vercel-tmp';
    if (fs.existsSync(src) && (shouldRefreshVolatileSeed || !fs.existsSync(dst))) {
      fs.copyFileSync(src, dst);
    }
  });
}

const FILES = Object.fromEntries(
  JSON_COLLECTIONS.map(name => [name, path.join(DATA_DIR, `${name}.json`)])
);

function fallbackFor(name, fallback) {
  if (name === 'admin') return DEFAULT_ADMIN;
  return fallback;
}

function readSeed(name, fallback) {
  const file = path.join(BUNDLE_DATA_DIR, `${name}.json`);
  try {
    return fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, 'utf8'))
      : fallbackFor(name, fallback);
  } catch {
    return fallbackFor(name, fallback);
  }
}

// ---------- JSON fallback ----------
function readJson(name) {
  const file = FILES[name];
  if (!file) throw new Error(`Unknown collection: ${name}`);
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`DB read error [${name}]:`, e.message);
    return null;
  }
}

function writeJson(name, data) {
  const file = FILES[name];
  if (!file) throw new Error(`Unknown collection: ${name}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ---------- PostgreSQL ----------
let pgPool = null;
let pgReadyPromise = null;

function shouldUsePostgresSsl() {
  const raw = DATABASE_URL.toLowerCase();
  if (process.env.DATABASE_SSL === 'false') return false;
  if (process.env.DATABASE_SSL === 'true') return true;
  return raw.includes('sslmode=require') || raw.includes('.render.com');
}

function getPostgresPool() {
  if (!POSTGRES_ENABLED) return null;
  if (!pgPool) {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: shouldUsePostgresSsl() ? { rejectUnauthorized: false } : false,
    });
  }
  return pgPool;
}

async function rawPostgresQuery(text, params = []) {
  const pool = getPostgresPool();
  if (!pool) throw new Error('PostgreSQL is not configured');
  return pool.query(text, params);
}

async function ensurePostgresReady() {
  if (!POSTGRES_ENABLED) return;
  if (!pgReadyPromise) pgReadyPromise = setupPostgres();
  await pgReadyPromise;
}

async function setupPostgres() {
  await rawPostgresQuery(`
    create table if not exists nham_docs (
      collection text primary key,
      data jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    );
  `);
  await rawPostgresQuery(`
    create table if not exists nham_items (
      collection text not null,
      id bigint not null,
      data jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now(),
      primary key (collection, id)
    );
  `);
  await rawPostgresQuery(`
    create table if not exists nham_files (
      path text primary key,
      mime_type text not null,
      data bytea not null,
      size bigint not null,
      updated_at timestamptz not null default now()
    );
  `);

  await seedPostgres();
  await seedPostgresFiles();
}

async function seedPostgres() {
  const existingDocs = await rawPostgresQuery('select collection from nham_docs limit 1');
  if (!existingDocs.rowCount) {
    for (const collection of DOC_COLLECTIONS) {
      await rawPostgresQuery(
        `insert into nham_docs (collection, data, updated_at)
         values ($1, $2::jsonb, now())
         on conflict (collection) do nothing`,
        [collection, JSON.stringify(readSeed(collection, {}))]
      );
    }
  }

  for (const collection of ITEM_COLLECTIONS) {
    const existingItems = await rawPostgresQuery(
      'select id from nham_items where collection = $1 limit 1',
      [collection]
    );
    if (existingItems.rowCount) continue;

    const seed = readSeed(collection, []);
    if (!Array.isArray(seed) || !seed.length) continue;

    for (let index = 0; index < seed.length; index += 1) {
      const item = seed[index];
      const id = Number(item.id) || index + 1;
      await rawPostgresQuery(
        `insert into nham_items (collection, id, data, updated_at)
         values ($1, $2, $3::jsonb, now())
         on conflict (collection, id) do nothing`,
        [collection, id, JSON.stringify({ ...item, id })]
      );
    }
  }
}

function mimeFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
  }[ext] || 'application/octet-stream';
}

function listSeedUploadFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listSeedUploadFiles(fullPath) : [fullPath];
  });
}

async function seedPostgresFiles() {
  const uploadsDir = path.join(BUNDLE_DATA_DIR, 'uploads');
  const files = listSeedUploadFiles(uploadsDir);
  for (const filePath of files) {
    const relativePath = path.relative(uploadsDir, filePath).replace(/\\/g, '/');
    const publicPath = `/uploads/${relativePath}`;
    const bytes = fs.readFileSync(filePath);
    await rawPostgresQuery(
      `insert into nham_files (path, mime_type, data, size, updated_at)
       values ($1, $2, $3, $4, now())
       on conflict (path) do nothing`,
      [publicPath, mimeFromFile(filePath), bytes, bytes.length]
    );
  }
}

async function postgresQuery(text, params = []) {
  await ensurePostgresReady();
  return rawPostgresQuery(text, params);
}

// ---------- Supabase REST ----------
let supabaseSeedPromise = null;

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
  };
}

async function supabaseRequest(endpoint, options = {}) {
  const headers = supabaseHeaders(options.headers || {});
  const resp = await fetch(`${SUPABASE_URL}${endpoint}`, { ...options, headers });
  const text = await resp.text();
  const data = text ? JSON.parse(text) : null;

  if (!resp.ok) {
    const detail = data?.message || data?.error || text || resp.statusText;
    throw new Error(`Supabase ${resp.status}: ${detail}`);
  }

  return data;
}

function encodeEq(value) {
  return encodeURIComponent(String(value));
}

async function upsertRows(table, rows, conflict) {
  return supabaseRequest(`/rest/v1/${table}?on_conflict=${conflict}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  });
}

async function ensureSupabaseSeeded() {
  if (!SUPABASE_ENABLED) return;
  if (!supabaseSeedPromise) supabaseSeedPromise = seedSupabase();
  await supabaseSeedPromise;
}

async function seedSupabase() {
  const existingDocs = await supabaseRequest('/rest/v1/nham_docs?select=collection&limit=1');
  if (!existingDocs.length) {
    await upsertRows('nham_docs', DOC_COLLECTIONS.map(collection => ({
      collection,
      data: readSeed(collection, {}),
      updated_at: new Date().toISOString(),
    })), 'collection');
  }

  for (const collection of ITEM_COLLECTIONS) {
    const existingItems = await supabaseRequest(`/rest/v1/nham_items?collection=eq.${collection}&select=id&limit=1`);
    if (existingItems.length) continue;

    const seed = readSeed(collection, []);
    if (Array.isArray(seed) && seed.length) {
      await upsertRows('nham_items', seed.map((item, index) => ({
        collection,
        id: Number(item.id) || index + 1,
        data: item,
        updated_at: new Date().toISOString(),
      })), 'collection,id');
    }
  }
}

// ---------- Public adapter ----------
async function getAll(name) {
  if (POSTGRES_ENABLED) {
    await ensurePostgresReady();
    const rows = await rawPostgresQuery(
      'select id, data from nham_items where collection = $1 order by id asc',
      [name]
    );
    return rows.rows.map(row => ({ ...(row.data || {}), id: row.data?.id ?? Number(row.id) }));
  }

  if (!SUPABASE_ENABLED) return readJson(name) || [];
  await ensureSupabaseSeeded();
  const rows = await supabaseRequest(`/rest/v1/nham_items?collection=eq.${encodeEq(name)}&select=id,data&order=id.asc`);
  return rows.map(row => ({ ...(row.data || {}), id: row.data?.id ?? row.id }));
}

async function getById(name, id) {
  if (POSTGRES_ENABLED) {
    await ensurePostgresReady();
    const rows = await rawPostgresQuery(
      'select id, data from nham_items where collection = $1 and id = $2 limit 1',
      [name, Number(id)]
    );
    const row = rows.rows[0];
    return row ? { ...(row.data || {}), id: row.data?.id ?? Number(row.id) } : null;
  }

  if (!SUPABASE_ENABLED) {
    return (readJson(name) || []).find(item => String(item.id) === String(id)) || null;
  }
  await ensureSupabaseSeeded();
  const rows = await supabaseRequest(`/rest/v1/nham_items?collection=eq.${encodeEq(name)}&id=eq.${encodeEq(id)}&select=id,data&limit=1`);
  const row = rows[0];
  return row ? { ...(row.data || {}), id: row.data?.id ?? row.id } : null;
}

async function getByField(name, field, value) {
  const rows = await getAll(name);
  return rows.find(item => String(item[field]) === String(value)) || null;
}

async function create(name, data) {
  if (POSTGRES_ENABLED) {
    await ensurePostgresReady();
    const maxResult = await rawPostgresQuery(
      'select coalesce(max(id), 0) as max_id from nham_items where collection = $1',
      [name]
    );
    const nextId = Number(maxResult.rows[0]?.max_id || 0) + 1;
    const newItem = { ...data, id: nextId, createdAt: new Date().toISOString() };
    await rawPostgresQuery(
      `insert into nham_items (collection, id, data, updated_at)
       values ($1, $2, $3::jsonb, now())`,
      [name, nextId, JSON.stringify(newItem)]
    );
    return newItem;
  }

  if (!SUPABASE_ENABLED) {
    const arr = readJson(name) || [];
    const maxId = arr.length ? Math.max(...arr.map(i => Number(i.id) || 0)) : 0;
    const newItem = { ...data, id: maxId + 1, createdAt: new Date().toISOString() };
    arr.unshift(newItem);
    writeJson(name, arr);
    return newItem;
  }

  const arr = await getAll(name);
  const maxId = arr.length ? Math.max(...arr.map(i => Number(i.id) || 0)) : 0;
  const newItem = { ...data, id: maxId + 1, createdAt: new Date().toISOString() };
  await upsertRows('nham_items', [{
    collection: name,
    id: newItem.id,
    data: newItem,
    updated_at: new Date().toISOString(),
  }], 'collection,id');
  return newItem;
}

async function update(name, id, patch) {
  if (POSTGRES_ENABLED) {
    const existing = await getById(name, id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    await rawPostgresQuery(
      `insert into nham_items (collection, id, data, updated_at)
       values ($1, $2, $3::jsonb, now())
       on conflict (collection, id)
       do update set data = excluded.data, updated_at = now()`,
      [name, Number(id), JSON.stringify(updated)]
    );
    return updated;
  }

  if (!SUPABASE_ENABLED) {
    const arr = readJson(name) || [];
    const idx = arr.findIndex(item => String(item.id) === String(id));
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...patch, updatedAt: new Date().toISOString() };
    writeJson(name, arr);
    return arr[idx];
  }

  const existing = await getById(name, id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await upsertRows('nham_items', [{
    collection: name,
    id: Number(id),
    data: updated,
    updated_at: updated.updatedAt,
  }], 'collection,id');
  return updated;
}

async function remove(name, id) {
  if (POSTGRES_ENABLED) {
    await ensurePostgresReady();
    await rawPostgresQuery(
      'delete from nham_items where collection = $1 and id = $2',
      [name, Number(id)]
    );
    return true;
  }

  if (!SUPABASE_ENABLED) {
    const arr = readJson(name) || [];
    const idx = arr.findIndex(item => String(item.id) === String(id));
    if (idx === -1) return false;
    arr.splice(idx, 1);
    writeJson(name, arr);
    return true;
  }

  await ensureSupabaseSeeded();
  await supabaseRequest(`/rest/v1/nham_items?collection=eq.${encodeEq(name)}&id=eq.${encodeEq(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  return true;
}

async function getDoc(name) {
  if (POSTGRES_ENABLED) {
    await ensurePostgresReady();
    const rows = await rawPostgresQuery(
      'select data from nham_docs where collection = $1 limit 1',
      [name]
    );
    return rows.rows[0]?.data || {};
  }

  if (!SUPABASE_ENABLED) return readJson(name) || {};
  await ensureSupabaseSeeded();
  const rows = await supabaseRequest(`/rest/v1/nham_docs?collection=eq.${encodeEq(name)}&select=data&limit=1`);
  return rows[0]?.data || {};
}

async function setDoc(name, data) {
  const current = await getDoc(name);
  const merged = { ...current, ...data, updatedAt: new Date().toISOString() };

  if (POSTGRES_ENABLED) {
    await rawPostgresQuery(
      `insert into nham_docs (collection, data, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (collection)
       do update set data = excluded.data, updated_at = now()`,
      [name, JSON.stringify(merged)]
    );
    return merged;
  }

  if (!SUPABASE_ENABLED) {
    writeJson(name, merged);
    return merged;
  }

  await upsertRows('nham_docs', [{
    collection: name,
    data: merged,
    updated_at: merged.updatedAt,
  }], 'collection');
  return merged;
}

module.exports = {
  getAll,
  getById,
  getByField,
  create,
  update,
  remove,
  getDoc,
  setDoc,
  ensurePostgresReady,
  postgresQuery,
  read: readJson,
  write: writeJson,
  DATA_DIR,
  STORAGE_MODE,
  POSTGRES_ENABLED,
  SUPABASE_ENABLED,
};

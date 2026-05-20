// =============================================
// data/db.js - Database adapter
// Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
// Falls back to JSON files for local/offline development.
// =============================================

const fs = require('fs');
const path = require('path');
const {
  BUNDLE_DATA_DIR,
  DATA_DIR,
  STORAGE_MODE,
  SUPABASE_ENABLED,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = require('../config/paths');

const JSON_COLLECTIONS = ['posts', 'projects', 'profile', 'settings', 'admin'];
const DOC_COLLECTIONS = ['profile', 'settings', 'admin'];
const ITEM_COLLECTIONS = ['posts', 'projects'];

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// When DATA_DIR is outside the bundled backend/data directory, copy the
// committed JSON files once so a fresh persistent disk starts with current data.
if (!SUPABASE_ENABLED && path.resolve(DATA_DIR) !== path.resolve(BUNDLE_DATA_DIR)) {
  JSON_COLLECTIONS.forEach(name => {
    const src = path.join(BUNDLE_DATA_DIR, `${name}.json`);
    const dst = path.join(DATA_DIR, `${name}.json`);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.copyFileSync(src, dst);
    }
  });
}

const FILES = Object.fromEntries(
  JSON_COLLECTIONS.map(name => [name, path.join(DATA_DIR, `${name}.json`)])
);

function readSeed(name, fallback) {
  const file = path.join(BUNDLE_DATA_DIR, `${name}.json`);
  try {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
  } catch {
    return fallback;
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
  if (!SUPABASE_ENABLED) return readJson(name) || [];
  await ensureSupabaseSeeded();
  const rows = await supabaseRequest(`/rest/v1/nham_items?collection=eq.${encodeEq(name)}&select=id,data&order=id.asc`);
  return rows.map(row => ({ ...(row.data || {}), id: row.data?.id ?? row.id }));
}

async function getById(name, id) {
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
  if (!SUPABASE_ENABLED) return readJson(name) || {};
  await ensureSupabaseSeeded();
  const rows = await supabaseRequest(`/rest/v1/nham_docs?collection=eq.${encodeEq(name)}&select=data&limit=1`);
  return rows[0]?.data || {};
}

async function setDoc(name, data) {
  if (!SUPABASE_ENABLED) {
    const current = await getDoc(name);
    const merged = { ...current, ...data, updatedAt: new Date().toISOString() };
    writeJson(name, merged);
    return merged;
  }

  const current = await getDoc(name);
  const merged = { ...current, ...data, updatedAt: new Date().toISOString() };
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
  read: readJson,
  write: writeJson,
  DATA_DIR,
  STORAGE_MODE,
  SUPABASE_ENABLED,
};

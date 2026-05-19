// =============================================
// data/db.js - JSON File Database Helper
// Local: backend/data
// Render persistent disk: PERSIST_DIR/data
// Vercel fallback: /tmp/nham-data (not persistent)
// =============================================

const fs = require('fs');
const path = require('path');
const { BUNDLE_DATA_DIR, DATA_DIR, STORAGE_MODE } = require('../config/paths');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// When DATA_DIR is outside the bundled backend/data directory, copy the
// committed JSON files once so a fresh persistent disk starts with current data.
if (path.resolve(DATA_DIR) !== path.resolve(BUNDLE_DATA_DIR)) {
  ['posts', 'projects', 'profile', 'settings', 'admin'].forEach(name => {
    const src = path.join(BUNDLE_DATA_DIR, `${name}.json`);
    const dst = path.join(DATA_DIR, `${name}.json`);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.copyFileSync(src, dst);
    }
  });
}

const FILES = {
  posts: path.join(DATA_DIR, 'posts.json'),
  projects: path.join(DATA_DIR, 'projects.json'),
  profile: path.join(DATA_DIR, 'profile.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
  admin: path.join(DATA_DIR, 'admin.json'),
};

/** Read a JSON file safely */
function read(name) {
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

/** Write a JSON file safely */
function write(name, data) {
  const file = FILES[name];
  if (!file) throw new Error(`Unknown collection: ${name}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getAll(name) { return read(name) || []; }

function getById(name, id) {
  return getAll(name).find(item => String(item.id) === String(id)) || null;
}

function getByField(name, field, value) {
  return getAll(name).find(item => String(item[field]) === String(value)) || null;
}

function create(name, data) {
  const arr = getAll(name);
  const maxId = arr.length ? Math.max(...arr.map(i => Number(i.id) || 0)) : 0;
  const newItem = { ...data, id: maxId + 1, createdAt: new Date().toISOString() };
  arr.unshift(newItem);
  write(name, arr);
  return newItem;
}

function update(name, id, patch) {
  const arr = getAll(name);
  const idx = arr.findIndex(item => String(item.id) === String(id));
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...patch, updatedAt: new Date().toISOString() };
  write(name, arr);
  return arr[idx];
}

function remove(name, id) {
  const arr = getAll(name);
  const idx = arr.findIndex(item => String(item.id) === String(id));
  if (idx === -1) return false;
  arr.splice(idx, 1);
  write(name, arr);
  return true;
}

function getDoc(name) { return read(name) || {}; }

function setDoc(name, data) {
  const current = getDoc(name);
  const merged = { ...current, ...data, updatedAt: new Date().toISOString() };
  write(name, merged);
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
  read,
  write,
  DATA_DIR,
  STORAGE_MODE,
};

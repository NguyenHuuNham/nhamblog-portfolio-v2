// =============================================
// data/db.js — JSON File Database Helper
// All data stored as JSON files in ./data/
// =============================================

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname);

const FILES = {
  posts:    path.join(DATA_DIR, 'posts.json'),
  projects: path.join(DATA_DIR, 'projects.json'),
  profile:  path.join(DATA_DIR, 'profile.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
  admin:    path.join(DATA_DIR, 'admin.json'),
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
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ========================
// Collection helpers (arrays)
// ========================

/** Get all items from a collection */
function getAll(name) {
  return read(name) || [];
}

/** Get single item by id */
function getById(name, id) {
  const arr = getAll(name);
  return arr.find(item => String(item.id) === String(id)) || null;
}

/** Get single item by field value */
function getByField(name, field, value) {
  const arr = getAll(name);
  return arr.find(item => String(item[field]) === String(value)) || null;
}

/** Create new item (auto-generates id) */
function create(name, data) {
  const arr = getAll(name);
  const maxId = arr.length ? Math.max(...arr.map(i => Number(i.id) || 0)) : 0;
  const newItem = { ...data, id: maxId + 1, createdAt: new Date().toISOString() };
  arr.unshift(newItem); // newest first
  write(name, arr);
  return newItem;
}

/** Update item by id (merge patch) */
function update(name, id, patch) {
  const arr = getAll(name);
  const idx = arr.findIndex(item => String(item.id) === String(id));
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...patch, updatedAt: new Date().toISOString() };
  write(name, arr);
  return arr[idx];
}

/** Delete item by id */
function remove(name, id) {
  const arr = getAll(name);
  const idx = arr.findIndex(item => String(item.id) === String(id));
  if (idx === -1) return false;
  arr.splice(idx, 1);
  write(name, arr);
  return true;
}

// ========================
// Single-doc helpers (profile, settings)
// ========================

/** Get single document */
function getDoc(name) {
  return read(name) || {};
}

/** Set/merge single document */
function setDoc(name, data) {
  const current = getDoc(name);
  const merged   = { ...current, ...data, updatedAt: new Date().toISOString() };
  write(name, merged);
  return merged;
}

module.exports = { getAll, getById, getByField, create, update, remove, getDoc, setDoc, read, write };

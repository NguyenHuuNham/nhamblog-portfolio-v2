// =============================================
// db.js — Database + Storage Service Layer
// Handles Firestore (data) + Firebase Storage (files)
// Falls back to localStorage when Firebase not configured
// =============================================

// ---------- KEYS (localStorage fallback) ----------
const DB_KEYS = {
  posts:    'nhamblog_posts',
  projects: 'nhamblog_projects',
  profile:  'nhamblog_profile',
  settings: 'nhamblog_settings',
};

// ---------- localStorage helpers ----------
const _lsGet = (k, def) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : def; } catch { return def; } };
const _lsSet = (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) { console.error('localStorage full:', e); throw e; } };

// =============================================
// FIRESTORE CRUD
// =============================================

/** Get all documents from a collection */
async function dbGetAll(collection) {
  if (FIREBASE_ENABLED && _db) {
    const snap = await _db.collection(collection).orderBy('_order', 'asc').get().catch(() =>
      _db.collection(collection).get()
    );
    return snap.docs.map(d => ({ id: d.id, _fid: d.id, ...d.data() }));
  }
  // localStorage fallback
  const key = DB_KEYS[collection];
  return key ? _lsGet(key, []) : [];
}

/** Get single document */
async function dbGet(collection, id) {
  if (FIREBASE_ENABLED && _db) {
    const doc = await _db.collection(collection).doc(String(id)).get();
    return doc.exists ? { _fid: doc.id, ...doc.data() } : null;
  }
  const arr = _lsGet(DB_KEYS[collection], []);
  return arr.find(x => String(x.id) === String(id)) || null;
}

/** Create or update a document */
async function dbSet(collection, id, data) {
  const payload = { ...data, _updatedAt: Date.now() };
  if (FIREBASE_ENABLED && _db) {
    await _db.collection(collection).doc(String(id)).set(payload, { merge: true });
    return;
  }
  // localStorage fallback
  const key = DB_KEYS[collection];
  if (!key) return;
  const arr = _lsGet(key, []);
  const idx = arr.findIndex(x => String(x.id) === String(id));
  if (idx !== -1) arr[idx] = { ...arr[idx], ...payload };
  else arr.unshift({ ...payload, id });
  _lsSet(key, arr);
}

/** Delete a document */
async function dbDelete(collection, id) {
  if (FIREBASE_ENABLED && _db) {
    await _db.collection(collection).doc(String(id)).delete();
    return;
  }
  const key = DB_KEYS[collection];
  if (!key) return;
  const arr = _lsGet(key, []).filter(x => String(x.id) !== String(id));
  _lsSet(key, arr);
}

/** Get a single-doc store (profile, settings) */
async function dbGetDoc(collection) {
  if (FIREBASE_ENABLED && _db) {
    const doc = await _db.collection(collection).doc('main').get();
    return doc.exists ? doc.data() : null;
  }
  return _lsGet(DB_KEYS[collection], null);
}

/** Set a single-doc store (profile, settings) */
async function dbSetDoc(collection, data) {
  if (FIREBASE_ENABLED && _db) {
    await _db.collection(collection).doc('main').set(data, { merge: true });
    return;
  }
  _lsSet(DB_KEYS[collection], data);
}

/** Listen to a single-doc store in real-time (returns unsubscribe fn) */
function dbOnDoc(collection, callback) {
  if (FIREBASE_ENABLED && _db) {
    return _db.collection(collection).doc('main').onSnapshot(snap => {
      if (snap.exists) callback(snap.data());
    });
  }
  // No real-time for localStorage — just call once
  callback(_lsGet(DB_KEYS[collection], null));
  return () => {};
}

/** Listen to a collection in real-time */
function dbOnCollection(collection, callback) {
  if (FIREBASE_ENABLED && _db) {
    return _db.collection(collection).onSnapshot(snap => {
      const docs = snap.docs.map(d => ({ _fid: d.id, ...d.data() }));
      callback(docs);
    });
  }
  callback(_lsGet(DB_KEYS[collection], []));
  return () => {};
}

/** Add a value to an array field (e.g. comments) */
async function dbArrayUnion(collection, id, field, value) {
  if (FIREBASE_ENABLED && _db) {
    await _db.collection(collection).doc(String(id)).update({
      [field]: firebase.firestore.FieldValue.arrayUnion(value)
    });
    return;
  }
  const arr  = _lsGet(DB_KEYS[collection], []);
  const item = arr.find(x => String(x.id) === String(id));
  if (item) {
    if (!item[field]) item[field] = [];
    item[field].push(value);
    _lsSet(DB_KEYS[collection], arr);
  }
}

/** Atomic increment a numeric field */
async function dbIncrement(collection, id, field, delta = 1) {
  if (FIREBASE_ENABLED && _db) {
    await _db.collection(collection).doc(String(id)).update({
      [field]: firebase.firestore.FieldValue.increment(delta)
    });
    return;
  }
  const arr  = _lsGet(DB_KEYS[collection], []);
  const item = arr.find(x => String(x.id) === String(id));
  if (item) { item[field] = (item[field] || 0) + delta; _lsSet(DB_KEYS[collection], arr); }
}

// =============================================
// FIREBASE STORAGE — File Upload
// =============================================

/**
 * Upload a File/Blob to Firebase Storage, return download URL.
 * Falls back to base64 data URL when Firebase not configured.
 * @param {string} path  e.g. 'cv/profile.pdf'
 * @param {File}   file
 * @param {function} onProgress  called with 0-100
 */
async function storageUpload(path, file, onProgress) {
  if (FIREBASE_ENABLED && _storage) {
    const ref  = _storage.ref(path);
    const task = ref.put(file);
    return new Promise((resolve, reject) => {
      task.on('state_changed',
        snap => { onProgress && onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)); },
        reject,
        async () => { resolve(await ref.getDownloadURL()); }
      );
    });
  }
  // Fallback: convert to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Get public download URL for a storage path */
async function storageGetUrl(path) {
  if (FIREBASE_ENABLED && _storage) {
    try { return await _storage.ref(path).getDownloadURL(); }
    catch { return null; }
  }
  return null;
}

/** Delete a file from Storage */
async function storageDelete(path) {
  if (FIREBASE_ENABLED && _storage) {
    try { await _storage.ref(path).delete(); } catch {}
  }
}

// =============================================
// SEED default data to Firestore (run once)
// =============================================
async function seedIfEmpty(collection, defaultDocs) {
  if (!FIREBASE_ENABLED || !_db) return;
  const snap = await _db.collection(collection).limit(1).get();
  if (snap.empty) {
    const batch = _db.batch();
    defaultDocs.forEach((doc, i) => {
      const ref = _db.collection(collection).doc(String(doc.id));
      batch.set(ref, { ...doc, _order: i });
    });
    await batch.commit();
    console.log(`✅ Seeded ${defaultDocs.length} docs into '${collection}'`);
  }
}

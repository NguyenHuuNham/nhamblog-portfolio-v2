// =============================================
// api-config.js — REST API Client
// Replaces firebase-config.js + db.js
// All data fetched from Node.js backend
// =============================================

// Auto-detect: if served from port 3000 (backend), use same-origin /api
// If served from another port (Live Server 5500, Vite 5173), proxy to :3000
const API_BASE = (() => {
  const port = window.location.port;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    // If already on port 3000, use same-origin
    if (port === '3000' || port === '') return '/api';
    // Otherwise proxy to backend
    return `${window.location.protocol}//${host}:3000/api`;
  }
  return '/api'; // production: same origin
})();

// =============================================
// AUTH HELPERS
// =============================================

const TOKEN_KEY = 'nhamblog_jwt_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// =============================================
// CORE FETCH HELPER
// =============================================

async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaults = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  };

  // If FormData, remove Content-Type (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete defaults.headers['Content-Type'];
  }

  const resp = await fetch(url, { ...defaults, ...options });

  // Auto logout if unauthorized
  if (resp.status === 401) {
    const data = await resp.json().catch(() => ({}));
    if (data.error?.includes('Token expired') || data.error?.includes('Invalid token')) {
      removeToken();
      if (window.location.pathname.includes('/admin/') && !window.location.pathname.includes('login')) {
        window.location.href = '/admin/login.html';
      }
    }
    throw new Error(data.error || 'Unauthorized');
  }

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  return resp.json();
}

// =============================================
// POSTS API
// =============================================

async function apiGetPosts(options = {}) {
  const params = new URLSearchParams();
  if (options.tag)    params.set('tag', options.tag);
  if (options.search) params.set('search', options.search);
  if (options.limit)  params.set('limit', options.limit);
  const query = params.toString() ? `?${params}` : '';
  return apiFetch(`/posts${query}`);
}

async function apiGetPost(idOrSlug) {
  return apiFetch(`/posts/${idOrSlug}`);
}

async function apiCreatePost(formData) {
  return apiFetch('/posts', { method: 'POST', body: formData });
}

async function apiUpdatePost(id, formData) {
  return apiFetch(`/posts/${id}`, { method: 'PUT', body: formData });
}

async function apiDeletePost(id) {
  return apiFetch(`/posts/${id}`, { method: 'DELETE' });
}

async function apiLikePost(id) {
  return apiFetch(`/posts/${id}/like`, { method: 'POST' });
}

async function apiAddComment(id, name, content) {
  return apiFetch(`/posts/${id}/comment`, {
    method: 'POST',
    body: JSON.stringify({ name, content }),
  });
}

// =============================================
// PROJECTS API
// =============================================

async function apiGetProjects(options = {}) {
  const params = new URLSearchParams();
  if (options.tech)     params.set('tech', options.tech);
  if (options.featured) params.set('featured', 'true');
  const query = params.toString() ? `?${params}` : '';
  return apiFetch(`/projects${query}`);
}

async function apiGetProject(id) {
  return apiFetch(`/projects/${id}`);
}

async function apiCreateProject(formData) {
  return apiFetch('/projects', { method: 'POST', body: formData });
}

async function apiUpdateProject(id, formData) {
  return apiFetch(`/projects/${id}`, { method: 'PUT', body: formData });
}

async function apiDeleteProject(id) {
  return apiFetch(`/projects/${id}`, { method: 'DELETE' });
}

// =============================================
// PROFILE API
// =============================================

async function apiGetProfile() {
  return apiFetch('/profile');
}

async function apiUpdateProfile(data) {
  return apiFetch('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async function apiUploadAvatar(file) {
  const fd = new FormData();
  fd.append('avatar', file);
  return apiFetch('/profile/avatar', { method: 'POST', body: fd });
}

async function apiDeleteAvatar() {
  return apiFetch('/profile/avatar', { method: 'DELETE' });
}

async function apiUploadCV(file) {
  const fd = new FormData();
  fd.append('cv', file);
  return apiFetch('/profile/cv', { method: 'POST', body: fd });
}

async function apiDeleteCV() {
  return apiFetch('/profile/cv', { method: 'DELETE' });
}

// =============================================
// SETTINGS API
// =============================================

async function apiGetSettings() {
  return apiFetch('/settings');
}

async function apiUpdateSettings(data) {
  return apiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async function apiUploadMusic(file) {
  const fd = new FormData();
  fd.append('music', file);
  return apiFetch('/settings/music', { method: 'POST', body: fd });
}

async function apiDeleteMusic() {
  return apiFetch('/settings/music', { method: 'DELETE' });
}

// =============================================
// AUTH API
// =============================================

async function apiLogin(username, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (data.token) setToken(data.token);
  return data;
}

async function apiVerifyToken() {
  try {
    return await apiFetch('/auth/verify');
  } catch {
    return { valid: false };
  }
}

async function apiChangePassword(currentPassword, newPassword) {
  return apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

function apiLogout() {
  removeToken();
}

// =============================================
// COMPAT SHIMS — keeps existing code working
// These replace the Firebase-based db.js functions
// =============================================

// Will be overwritten after loadPublicData()
let POSTS    = [];
let PROJECTS = [];
let PROFILE  = {};
let SETTINGS = { maintenance: false };

async function loadPublicData() {
  try {
    const [profile, settings, posts, projects] = await Promise.all([
      apiGetProfile().catch(() => ({})),
      apiGetSettings().catch(() => ({ maintenance: false })),
      apiGetPosts().catch(() => []),
      apiGetProjects().catch(() => []),
    ]);

    PROFILE  = profile;
    SETTINGS = settings;
    POSTS    = posts;
    PROJECTS = projects;
  } catch (e) {
    console.warn('loadPublicData error:', e);
  }
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { return dateStr || ''; }
}

// Expose on window for compatibility
window.API_BASE    = API_BASE;
window.getToken    = getToken;
window.setToken    = setToken;
window.removeToken = removeToken;
window.authHeaders = authHeaders;
window.apiFetch    = apiFetch;
window.apiLogin    = apiLogin;
window.apiLogout   = apiLogout;
window.apiVerifyToken    = apiVerifyToken;
window.apiChangePassword = apiChangePassword;

window.apiGetPosts    = apiGetPosts;
window.apiGetPost     = apiGetPost;
window.apiCreatePost  = apiCreatePost;
window.apiUpdatePost  = apiUpdatePost;
window.apiDeletePost  = apiDeletePost;
window.apiLikePost    = apiLikePost;
window.apiAddComment  = apiAddComment;

window.apiGetProjects    = apiGetProjects;
window.apiGetProject     = apiGetProject;
window.apiCreateProject  = apiCreateProject;
window.apiUpdateProject  = apiUpdateProject;
window.apiDeleteProject  = apiDeleteProject;

window.apiGetProfile    = apiGetProfile;
window.apiUpdateProfile = apiUpdateProfile;
window.apiUploadAvatar  = apiUploadAvatar;
window.apiDeleteAvatar  = apiDeleteAvatar;
window.apiUploadCV      = apiUploadCV;
window.apiDeleteCV      = apiDeleteCV;

window.apiGetSettings    = apiGetSettings;
window.apiUpdateSettings = apiUpdateSettings;
window.apiUploadMusic    = apiUploadMusic;
window.apiDeleteMusic    = apiDeleteMusic;

window.loadPublicData = loadPublicData;
window.formatDate     = formatDate;

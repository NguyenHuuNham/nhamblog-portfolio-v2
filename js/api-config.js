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

function getApiOrigin() {
  try {
    return new URL(API_BASE, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

function resolveAssetUrl(url) {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  if (url.startsWith('/')) return `${getApiOrigin()}${url}`;
  return url;
}

const DEFAULT_PROFILE = {
  name: 'Nguyễn Hữu Nhâm',
  title: 'Mobile App Developer',
  email: 'nham@email.com',
  phone: '0987.654.321',
  location: 'Hà Nội, Việt Nam',
  github: 'https://github.com/NguyenHuuNham',
  hero: 'Sinh viên IT năm 3 · Mobile App Developer',
  bio: 'Sinh viên IT năm 3 đam mê xây dựng ứng dụng mobile đẹp, mượt và có trải nghiệm gần với native.',
  status: 'Đang tìm kiếm cơ hội thực tập',
  avatar: null,
  avatarUrl: null,
  cvUrl: null,
  cvName: null,
};

const DEFAULT_SETTINGS = {
  maintenance: false,
  musicUrl: null,
};

const DEFAULT_POSTS = [
  {
    id: 1,
    slug: 'flutter-bloc-vs-riverpod',
    title: 'Flutter BLoC vs Riverpod: Chọn gì cho dự án 2026?',
    summary: 'So sánh hai hướng quản lý state phổ biến trong Flutter, kèm gợi ý chọn theo quy mô app.',
    date: '2026-04-08',
    tags: ['flutter', 'dart'],
    readTime: '8 phút đọc',
    likes: 12,
    ratings: { totalScore: 22, count: 5 },
    comments: [],
  },
  {
    id: 2,
    slug: 'react-native-new-architecture',
    title: 'React Native New Architecture: JSI, Fabric và TurboModules',
    summary: 'Những thay đổi đáng chú ý trong kiến trúc mới của React Native và tác động tới app mobile.',
    date: '2026-03-25',
    tags: ['react-native'],
    readTime: '12 phút đọc',
    likes: 8,
    ratings: { totalScore: 18, count: 4 },
    comments: [],
  },
  {
    id: 3,
    slug: 'flutter-animation-tips',
    title: '10 animation tips trong Flutter để app trông xịn hơn',
    summary: 'Các kỹ thuật animation nhỏ nhưng giúp trải nghiệm Flutter mượt và có cảm giác cao cấp hơn.',
    date: '2026-03-10',
    tags: ['flutter', 'tips'],
    readTime: '6 phút đọc',
    likes: 18,
    ratings: { totalScore: 27, count: 6 },
    comments: [],
  },
  {
    id: 4,
    slug: 'kotlin-flow-vs-livedata',
    title: 'Kotlin Flow vs LiveData: Bao giờ dùng cái nào?',
    summary: 'Góc nhìn thực tế khi chọn Flow hoặc LiveData trong Android app hiện đại.',
    date: '2026-02-20',
    tags: ['kotlin'],
    readTime: '10 phút đọc',
    likes: 6,
    ratings: { totalScore: 13, count: 3 },
    comments: [],
  },
];

const DEFAULT_PROJECTS = [
  {
    id: 1,
    icon: '🛍️',
    title: 'ShopeeClone Mobile',
    description: 'Clone giao diện thương mại điện tử bằng Flutter, có giỏ hàng và tìm kiếm sản phẩm.',
    tech: ['flutter', 'dart'],
    techLabels: ['Flutter', 'Dart', 'BLoC'],
    status: 'completed',
    github: 'https://github.com/NguyenHuuNham/shopee-clone',
    featured: true,
  },
  {
    id: 2,
    icon: '💘',
    title: 'TinderClone',
    description: 'Ứng dụng swipe/match với realtime chat, profile cards và animation tương tác.',
    tech: ['flutter', 'dart'],
    techLabels: ['Flutter', 'Firebase'],
    status: 'completed',
    github: 'https://github.com/NguyenHuuNham/tinder-clone',
    featured: true,
  },
  {
    id: 3,
    icon: '🎮',
    title: 'Flappy Bird',
    description: 'Mini game canvas với physics đơn giản, score và game loop mượt.',
    tech: ['flutter', 'dart'],
    techLabels: ['Game', 'Canvas'],
    status: 'completed',
    github: 'https://github.com/NguyenHuuNham/flappy-bird-flutter',
    featured: true,
  },
  {
    id: 4,
    icon: '🤖',
    title: 'Chat AI App',
    description: 'Android app tích hợp AI chat, lịch sử hội thoại và giao diện Jetpack Compose.',
    tech: ['kotlin'],
    techLabels: ['Kotlin', 'Compose'],
    status: 'inprogress',
    github: 'https://github.com/NguyenHuuNham/ai-chat-android',
    featured: false,
  },
];

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

function announcePublicDataChanged() {
  try {
    localStorage.setItem('nhamblog_public_data_changed', String(Date.now()));
  } catch {}
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

  const resp = await fetch(url, { cache: 'no-store', ...defaults, ...options });

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

  const data = await resp.json();
  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !endpoint.startsWith('/auth')) {
    announcePublicDataChanged();
  }
  return data;
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

async function apiRatePost(id, score) {
  return apiFetch(`/posts/${id}/rate`, {
    method: 'POST',
    body: JSON.stringify({ score }),
  });
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
// Data stores — attached to window for global access
window.POSTS    = DEFAULT_POSTS.slice();
window.PROJECTS = DEFAULT_PROJECTS.slice();
window.PROFILE  = { ...DEFAULT_PROFILE };
window.SETTINGS = { ...DEFAULT_SETTINGS };

async function loadPublicData() {
  try {
    const [profile, settings, posts, projects] = await Promise.all([
      apiGetProfile().catch(() => null),
      apiGetSettings().catch(() => null),
      apiGetPosts().catch(() => null),
      apiGetProjects().catch(() => null),
    ]);

    window.PROFILE  = { ...DEFAULT_PROFILE, ...(profile || {}) };
    window.SETTINGS = { ...DEFAULT_SETTINGS, ...(settings || {}) };
    window.POSTS    = Array.isArray(posts) && posts.length ? posts : DEFAULT_POSTS.slice();
    window.PROJECTS = Array.isArray(projects) && projects.length ? projects : DEFAULT_PROJECTS.slice();
  } catch (e) {
    console.warn('loadPublicData error:', e);
    window.PROFILE  = { ...DEFAULT_PROFILE };
    window.SETTINGS = { ...DEFAULT_SETTINGS };
    window.POSTS    = DEFAULT_POSTS.slice();
    window.PROJECTS = DEFAULT_PROJECTS.slice();
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
window.apiRatePost    = apiRatePost;
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
window.resolveAssetUrl = resolveAssetUrl;
window.getApiOrigin = getApiOrigin;
window.formatDate     = formatDate;

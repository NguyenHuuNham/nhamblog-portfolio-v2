// =============================================
// Admin CMS — admin/js/admin.js
// Firebase-powered CRUD for Posts, Projects, Profile
// Falls back to localStorage when Firebase not configured
// =============================================

// ---- Auth Guard ----
const AUTH_KEY = 'nhamblog_admin_auth';
if (sessionStorage.getItem(AUTH_KEY) !== 'true') {
  window.location.replace('./login.html');
}

window.logout = function () {
  sessionStorage.removeItem(AUTH_KEY);
  window.location.href = './login.html';
};

// =============================================
// DEFAULT DATA (used to seed Firestore or localStorage)
// =============================================
const DEFAULT_POSTS = [
  { id: 1, slug: 'flutter-bloc-vs-riverpod', title: 'Flutter BLoC vs Riverpod: Chọn gì cho dự án 2026?', summary: 'So sánh chi tiết hai state management phổ biến nhất trong Flutter ecosystem. Khi nào dùng BLoC, khi nào dùng Riverpod?', content: '', date: '2026-04-08', tags: ['flutter', 'dart'], readTime: '8 phút', likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] },
  { id: 2, slug: 'react-native-new-architecture', title: 'React Native New Architecture — Tất cả những gì bạn cần biết', summary: 'Kiến trúc mới của React Native (JSI, Fabric, TurboModules) đã thay đổi hoàn toàn cách hoạt động của framework.', content: '', date: '2026-03-25', tags: ['react-native'], readTime: '12 phút', likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] },
  { id: 3, slug: 'flutter-animation-tips', title: '10 Animation tips trong Flutter để app trông "xịn" hơn', summary: 'Những kỹ thuật animation đơn giản nhưng hiệu quả để cải thiện UX của ứng dụng Flutter.', content: '', date: '2026-03-10', tags: ['flutter', 'tips'], readTime: '6 phút', likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] },
  { id: 4, slug: 'kotlin-flow-vs-livedata', title: 'Kotlin Flow vs LiveData — Bao giờ dùng cái nào?', summary: 'Hướng dẫn thực tế về sự khác nhau giữa Kotlin Flow và LiveData trong Android development.', content: '', date: '2026-02-20', tags: ['kotlin'], readTime: '10 phút', likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] },
  { id: 5, slug: 'mobile-app-ci-cd', title: 'CI/CD cho Mobile App với GitHub Actions — Hướng dẫn từ A-Z', summary: 'Tự động hóa việc build, test và deploy ứng dụng Flutter/React Native bằng GitHub Actions.', content: '', date: '2026-02-05', tags: ['tips', 'flutter', 'react-native'], readTime: '15 phút', likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] },
  { id: 6, slug: 'flutter-deep-links', title: 'Deep Links trong Flutter — Firebase Dynamic Links hay App Links?', summary: 'Hướng dẫn triển khai deep linking trong Flutter app từ cơ bản đến nâng cao.', content: '', date: '2026-01-18', tags: ['flutter'], readTime: '9 phút', likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] },
];

const DEFAULT_PROJECTS = [
  { id: 1, icon: '🛍️', title: 'ShopeeClone Mobile', description: 'Clone đầy đủ giao diện Shopee bằng Flutter. Tích hợp REST API, giỏ hàng, thanh toán giả lập.', tech: ['flutter'], techLabels: ['Flutter', 'Dart', 'BLoC', 'REST API'], status: 'completed', github: 'https://github.com/nham/shopee-clone', featured: true },
  { id: 2, icon: '💘', title: 'TinderClone', description: 'Ứng dụng hẹn hò với swipe gesture, real-time chat bằng Firebase, push notifications.', tech: ['flutter'], techLabels: ['Flutter', 'Firebase', 'Riverpod', 'Firestore'], status: 'completed', github: 'https://github.com/nham/tinder-clone', featured: true },
  { id: 3, icon: '🎮', title: 'Flappy Bird (Dart)', description: 'Remake trò chơi Flappy Bird bằng thuần Dart + Flutter Canvas.', tech: ['flutter'], techLabels: ['Flutter', 'Dart', 'Canvas API'], status: 'completed', github: 'https://github.com/nham/flappy-bird', featured: true },
  { id: 5, icon: '📝', title: 'Task Manager (React Native)', description: 'Ứng dụng quản lý công việc đa nền tảng với drag & drop và đồng bộ cloud.', tech: ['react-native'], techLabels: ['React Native', 'Redux', 'AsyncStorage'], status: 'completed', github: null, featured: false },
  { id: 6, icon: '🤖', title: 'Chat AI App (Android Native)', description: 'Ứng dụng Android native tích hợp Gemini API, voice-to-text và chat history.', tech: ['kotlin'], techLabels: ['Kotlin', 'Jetpack Compose', 'Gemini API', 'Room'], status: 'inprogress', github: null, featured: false },
];

const DEFAULT_PROFILE = {
  name: 'Nguyễn Hữu Nhâm', title: 'Mobile App Developer',
  email: 'nham@email.com', phone: '0987.654.321',
  location: 'Hà Nội, Việt Nam', github: 'https://github.com/nham',
  hero: 'Sinh viên IT năm 3 · Mobile App Developer',
  bio: 'Xin chào! Tôi là Nguyễn Hữu Nhâm, sinh viên IT năm 3 đam mê mobile development.',
  status: 'Đang tìm kiếm cơ hội thực tập',
  avatar: null, cvUrl: null, cvName: null,
};

// =============================================
// STATE
// =============================================
let posts    = [];
let projects = [];
let profile  = { ...DEFAULT_PROFILE };
let settings = { maintenance: false };

let pendingDelete       = null;
let pendingPostImage    = null;
let pendingProjectImage = null;
let pendingAvatarImage  = null;
let postFilter          = { tag: 'all', q: '' };
let projectFilter       = { tech: 'all', q: '' };

// =============================================
// INIT — Load data & seed if empty
// =============================================
async function initData() {
  try {
    // Seed default data to Firestore
    await seedIfEmpty('posts',    DEFAULT_POSTS);
    await seedIfEmpty('projects', DEFAULT_PROJECTS);

    // Load posts & projects
    posts    = await dbGetAll('posts');
    projects = await dbGetAll('projects');

    // Sort posts newest-first, projects by id
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    projects.sort((a, b) => (a.id || 0) - (b.id || 0));

    // Load profile
    const savedProfile = await dbGetDoc('profile');
    profile = savedProfile ? { ...DEFAULT_PROFILE, ...savedProfile } : { ...DEFAULT_PROFILE };
    if (!FIREBASE_ENABLED) {
      // localStorage fallback: also check old key
      const p2 = _lsGet('nhamblog_profile', null);
      if (p2) profile = { ...DEFAULT_PROFILE, ...p2 };
    }

    // Load settings
    const savedSettings = await dbGetDoc('settings');
    settings = savedSettings || { maintenance: false };
  } catch (e) {
    console.error('initData error:', e);
    // Hard fallback to defaults
    posts    = DEFAULT_POSTS.slice();
    projects = DEFAULT_PROJECTS.slice();
  }

  // Render everything
  renderDashboard();
  renderPosts();
  renderProjects();
  loadProfileForm();
  syncSettingsUI();
}

// =============================================
// THEME
// =============================================
function initTheme() {
  const t = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  applyTheme(t);
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  document.getElementById('themeSwitch')?.classList.toggle('on', t === 'dark');
}

window.toggleThemeSwitch = () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');

document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
  window.toggleThemeSwitch();
});

// Sync theme across tabs
window.addEventListener('storage', e => { if (e.key === 'theme' && e.newValue) applyTheme(e.newValue); });

// =============================================
// CLOCK
// =============================================
function updateClock() {
  const el = document.getElementById('topbarClock');
  if (el) el.textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// =============================================
// SIDEBAR
// =============================================
let sidebarCollapsed = false;

window.toggleSidebar = function () {
  sidebarCollapsed = !sidebarCollapsed;
  document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
  document.getElementById('mainWrapper').classList.toggle('sidebar-collapsed', sidebarCollapsed);
  document.getElementById('sidebarSwitch')?.classList.toggle('on', sidebarCollapsed);
};

function initSidebar() {
  document.getElementById('sidebarCollapseBtn')?.addEventListener('click', window.toggleSidebar);
  document.getElementById('mobileMenuBtn')?.addEventListener('click', () =>
    document.getElementById('sidebar').classList.toggle('open')
  );
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      window.switchTab(btn.dataset.tab);
      document.getElementById('sidebar').classList.remove('open');
    });
  });
}

// =============================================
// TABS
// =============================================
const TAB_LABELS = { dashboard: 'Dashboard', posts: 'Bài viết', projects: 'Dự án', profile: 'Hồ sơ', settings: 'Cài đặt' };

window.switchTab = function (tab) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`panel-${tab}`)?.classList.add('active');
  document.getElementById(`nav-${tab}`)?.classList.add('active');
  const bc = document.getElementById('bcCurrent');
  if (bc) bc.textContent = TAB_LABELS[tab] || tab;
};

// =============================================
// KEYBOARD SHORTCUTS
// =============================================
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'n' || e.key === 'N') { window.switchTab('posts'); setTimeout(window.openPostModal, 100); }
    if (e.key === 'p' || e.key === 'P') { window.switchTab('projects'); setTimeout(window.openProjectModal, 100); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); document.getElementById('globalSearch')?.focus(); }
    if (e.key === 'Escape') { window.closePostModal(); window.closeProjectModal(); window.closeDeleteModal(); }
  });
}

// =============================================
// ANIMATED COUNTER
// =============================================
function animateCount(el, target) {
  if (!el) return;
  let start = null;
  const step = ts => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / 700, 1);
    el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target);
    if (p < 1) requestAnimationFrame(step); else el.textContent = target;
  };
  requestAnimationFrame(step);
}

// =============================================
// DASHBOARD
// =============================================
function renderDashboard() {
  const inprogress = projects.filter(p => p.status === 'inprogress').length;
  const completed  = projects.filter(p => p.status === 'completed').length;
  animateCount(document.getElementById('statPosts'),     posts.length);
  animateCount(document.getElementById('statProjects'),  projects.length);
  animateCount(document.getElementById('statInprogress'), inprogress);
  animateCount(document.getElementById('statCompleted'), completed);
  setEl('badge-posts',    posts.length);
  setEl('badge-projects', projects.length);

  // Tag chart
  const tagChart = document.getElementById('tagChart');
  if (tagChart) {
    const counts = {};
    posts.forEach(p => (p.tags || []).forEach(t => counts[t] = (counts[t] || 0) + 1));
    const max = Math.max(...Object.values(counts), 1);
    const colors = { flutter: 'flutter', 'react-native': 'rn', kotlin: 'kotlin', tips: 'tips' };
    tagChart.innerHTML = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, cnt]) => `
      <div class="chart-row">
        <div class="chart-label-row"><span>${tagLabel(tag)}</span><span>${cnt} bài</span></div>
        <div class="chart-bar-wrap"><div class="chart-bar ${colors[tag] || 'flutter'}" data-width="${(cnt / max * 100).toFixed(0)}"></div></div>
      </div>`).join('');
    setTimeout(() => tagChart.querySelectorAll('.chart-bar').forEach(b => b.style.width = b.dataset.width + '%'), 200);
  }

  // Recent posts
  const rpl = document.getElementById('recentPostsList');
  if (rpl) {
    rpl.innerHTML = posts.slice(0, 5).map(p => `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div class="activity-text">${esc(p.title)}</div>
        <div class="activity-date">${fmtDate(p.date)}</div>
      </div>`).join('') || '<p style="color:var(--text-muted);font-size:0.8rem;padding:0.5rem 0">Chưa có bài viết</p>';
  }

  // Project progress
  const ppl = document.getElementById('projectProgressList');
  if (ppl) {
    ppl.innerHTML = projects.slice(0, 5).map(p => {
      const done = p.status === 'completed';
      return `<div class="progress-item">
        <div class="progress-item-header">
          <span class="progress-item-name">${p.icon || ''} ${esc(p.title)}</span>
          <span class="progress-item-status">${done ? 'Hoàn thành' : 'Đang làm'}</span>
        </div>
        <div class="progress-bar-wrap"><div class="progress-bar ${done ? 'done' : 'wip'}" data-w="${done ? 100 : 45}"></div></div>
      </div>`;
    }).join('');
    setTimeout(() => ppl.querySelectorAll('.progress-bar').forEach(b => b.style.width = b.dataset.w + '%'), 300);
  }
}

// =============================================
// POSTS — Render
// =============================================
function filteredPosts() {
  let arr = posts;
  if (postFilter.tag !== 'all') arr = arr.filter(p => (p.tags || []).includes(postFilter.tag));
  if (postFilter.q) {
    const q = postFilter.q.toLowerCase();
    arr = arr.filter(p => p.title.toLowerCase().includes(q) || (p.summary || '').toLowerCase().includes(q));
  }
  return arr;
}

function renderPosts() {
  const grid    = document.getElementById('postsGrid');
  const countEl = document.getElementById('postsCount');
  if (!grid) return;
  const arr = filteredPosts();
  if (countEl) countEl.textContent = `${arr.length} bài viết`;
  if (arr.length === 0) { grid.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted)">Không tìm thấy bài viết nào 🤔</div>'; return; }
  grid.innerHTML = arr.map(p => {
    const thumb = p.image
      ? `<div class="post-row-thumb"><img src="${p.image}" alt=""/></div>`
      : `<div class="post-row-thumb post-row-thumb-empty"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
    return `<div class="post-row" style="animation:fadeIn 0.3s ease both">
      ${thumb}
      <div class="post-row-content">
        <div class="post-row-title">${esc(p.title)}</div>
        <div class="post-row-tags" style="margin-top:0.3rem">${(p.tags || []).map(t => `<span class="tag-pill ${t}">${tagLabel(t)}</span>`).join('')}</div>
      </div>
      <div class="post-row-date">${fmtDate(p.date)}</div>
      <div class="post-row-date" style="color:var(--text-muted)">${p.readTime || '—'}</div>
      <div class="row-actions">
        <button class="row-btn edit" onclick="editPost('${p.id}')">✏️ Sửa</button>
        <button class="row-btn del"  onclick="promptDelete('post','${p.id}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}

// =============================================
// POSTS — CRUD
// =============================================
window.editPost = function (id) {
  const p = posts.find(x => String(x.id) === String(id));
  if (!p) return;
  setEl('postModalTitle', 'Chỉnh sửa bài viết');
  document.getElementById('post-edit-id').value = id;
  setVal('post-title',   p.title   || '');
  setVal('post-slug',    p.slug    || '');
  setVal('post-summary', p.summary || '');
  setVal('post-content', p.content || '');
  setVal('post-date',    p.date    || today());
  setVal('post-readtime', p.readTime || '');
  document.querySelectorAll('#postTagPicker input').forEach(cb => cb.checked = (p.tags || []).includes(cb.value));
  pendingPostImage = p.image || null;
  showImgPreview('postImagePreview', 'postImagePreviewImg', 'postImagePlaceholder', pendingPostImage);
  window.openPostModal();
};

window.savePost = async function (e) {
  e.preventDefault();
  const btn = e.submitter || document.getElementById('submit-post');
  if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu...'; }

  try {
    const editId  = document.getElementById('post-edit-id').value;
    const title   = getVal('post-title');
    const slug    = getVal('post-slug') || toSlug(title);
    const summary = getVal('post-summary');
    const content = getVal('post-content');
    const date    = getVal('post-date') || today();
    const readTime = getVal('post-readtime') || '5 phút';
    const tags    = [...document.querySelectorAll('#postTagPicker input:checked')].map(c => c.value);

    // Handle image upload if pending File object
    let imageUrl = pendingPostImage || null;
    if (pendingPostImage instanceof File) {
      toast('Đang upload ảnh...', 'info');
      imageUrl = await storageUpload(`images/posts/${editId || Date.now()}`, pendingPostImage,
        pct => { if (btn) btn.textContent = `Upload ${pct}%...`; }
      );
    }

    if (editId) {
      // UPDATE
      const updated = { title, slug, summary, content, date, readTime, tags, image: imageUrl };
      await dbSet('posts', editId, updated);
      const idx = posts.findIndex(p => String(p.id) === String(editId));
      if (idx !== -1) posts[idx] = { ...posts[idx], ...updated };
      toast('✅ Đã cập nhật bài viết!', 'success');
    } else {
      // CREATE
      const newId = posts.length ? Math.max(...posts.map(p => Number(p.id) || 0)) + 1 : 1;
      const newPost = { id: newId, title, slug, summary, content, date, readTime, tags, image: imageUrl, likes: 0, ratings: { totalScore: 0, count: 0 }, comments: [] };
      await dbSet('posts', newId, newPost);
      posts.unshift(newPost);
      toast('✅ Đã thêm bài viết mới!', 'success');
    }

    pendingPostImage = null;
    window.closePostModal();
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderPosts();
    renderDashboard();
  } catch (err) {
    console.error(err);
    toast('❌ Lỗi khi lưu: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Lưu bài viết'; }
  }
};

// =============================================
// PROJECTS — Render
// =============================================
function filteredProjects() {
  let arr = projects;
  if (projectFilter.tech !== 'all') arr = arr.filter(p => (p.tech || []).includes(projectFilter.tech));
  if (projectFilter.q) {
    const q = projectFilter.q.toLowerCase();
    arr = arr.filter(p => p.title.toLowerCase().includes(q));
  }
  return arr;
}

function renderProjects() {
  const grid    = document.getElementById('projectsAdminGrid');
  const countEl = document.getElementById('projectsCount');
  if (!grid) return;
  const arr = filteredProjects();
  if (countEl) countEl.textContent = `${arr.length} dự án`;
  if (arr.length === 0) { grid.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);grid-column:1/-1">Không tìm thấy dự án nào</div>'; return; }
  grid.innerHTML = arr.map(p => {
    const done    = p.status === 'completed';
    const techHTML = (p.techLabels || p.tech || []).slice(0, 3).map(t => `<span class="tag-pill default">${esc(t)}</span>`).join('');
    const cover   = p.image ? `<div class="pac-cover"><img src="${p.image}" alt="${esc(p.title)}"/></div>` : '';
    return `<div class="proj-admin-card" style="animation:fadeIn 0.3s ease both">
      ${cover}
      <div class="pac-body">
        <div class="pac-header">
          <span class="pac-icon">${p.icon || '📱'}</span>
          <div class="pac-actions">
            <button class="row-btn edit" onclick="editProject('${p.id}')">✏️</button>
            <button class="row-btn del"  onclick="promptDelete('project','${p.id}')">🗑</button>
          </div>
        </div>
        <div class="pac-title">${esc(p.title)}</div>
        <div class="pac-desc">${esc(p.description || '')}</div>
        <div class="pac-tags">${techHTML}</div>
        <div class="pac-footer">
          <span class="pac-status ${done ? 'status-done' : 'status-wip'}">${done ? '✓ Hoàn thành' : '⬡ Đang làm'}</span>
          ${p.featured ? '<span class="pac-featured">★ Nổi bật</span>' : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

// =============================================
// PROJECTS — CRUD
// =============================================
window.editProject = function (id) {
  const p = projects.find(x => String(x.id) === String(id));
  if (!p) return;
  setEl('projectModalTitle', 'Chỉnh sửa dự án');
  document.getElementById('project-edit-id').value = id;
  setVal('project-icon',   p.icon        || '');
  setVal('project-title',  p.title       || '');
  setVal('project-desc',   p.description || '');
  setVal('project-tech-labels', (p.techLabels || []).join(', '));
  setVal('project-status', p.status   || 'completed');
  setVal('project-github', p.github   || '');
  document.getElementById('project-featured').checked = !!p.featured;
  document.querySelectorAll('input[name="proj-cat"]').forEach(cb => cb.checked = (p.tech || []).includes(cb.value));
  pendingProjectImage = p.image || null;
  showImgPreview('projectImagePreview', 'projectImagePreviewImg', 'projectImagePlaceholder', pendingProjectImage);
  window.openProjectModal();
};

window.saveProject = async function (e) {
  e.preventDefault();
  const btn = e.submitter || document.getElementById('submit-project');
  if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu...'; }

  try {
    const editId      = document.getElementById('project-edit-id').value;
    const icon        = getVal('project-icon')        || '📱';
    const title       = getVal('project-title');
    const description = getVal('project-desc');
    const techLabels  = getVal('project-tech-labels').split(',').map(t => t.trim()).filter(Boolean);
    const tech        = [...document.querySelectorAll('input[name="proj-cat"]:checked')].map(c => c.value);
    const status      = getVal('project-status');
    const github      = getVal('project-github') || null;
    const featured    = document.getElementById('project-featured').checked;

    let imageUrl = pendingProjectImage || null;
    if (pendingProjectImage instanceof File) {
      toast('Đang upload ảnh...', 'info');
      imageUrl = await storageUpload(`images/projects/${editId || Date.now()}`, pendingProjectImage,
        pct => { if (btn) btn.textContent = `Upload ${pct}%...`; }
      );
    }

    if (editId) {
      const updated = { icon, title, description, techLabels, tech, status, github, featured, image: imageUrl };
      await dbSet('projects', editId, updated);
      const idx = projects.findIndex(p => String(p.id) === String(editId));
      if (idx !== -1) projects[idx] = { ...projects[idx], ...updated };
      toast('✅ Đã cập nhật dự án!', 'success');
    } else {
      const newId  = projects.length ? Math.max(...projects.map(p => Number(p.id) || 0)) + 1 : 1;
      const newProj = { id: newId, icon, title, description, techLabels, tech, status, github, featured, image: imageUrl, demo: null };
      await dbSet('projects', newId, newProj);
      projects.push(newProj);
      toast('✅ Đã thêm dự án mới!', 'success');
    }

    pendingProjectImage = null;
    window.closeProjectModal();
    renderProjects();
    renderDashboard();
  } catch (err) {
    console.error(err);
    toast('❌ Lỗi khi lưu: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Lưu dự án'; }
  }
};

// =============================================
// DELETE
// =============================================
window.promptDelete = function (type, id) {
  const item = type === 'post' ? posts.find(p => String(p.id) === String(id)) : projects.find(p => String(p.id) === String(id));
  if (!item) return;
  pendingDelete = { type, id };
  setEl('deleteMsg', `Bạn có chắc muốn xóa "${item.title}"?`);
  openModal('deleteBackdrop', 'deleteModal');
};

window.closeDeleteModal = () => { pendingDelete = null; closeModal('deleteBackdrop', 'deleteModal'); };

window.confirmDelete = async function () {
  if (!pendingDelete) return;
  try {
    if (pendingDelete.type === 'post') {
      await dbDelete('posts', pendingDelete.id);
      posts = posts.filter(p => String(p.id) !== String(pendingDelete.id));
      renderPosts();
      toast('🗑️ Đã xóa bài viết!', 'error');
    } else {
      await dbDelete('projects', pendingDelete.id);
      projects = projects.filter(p => String(p.id) !== String(pendingDelete.id));
      renderProjects();
      toast('🗑️ Đã xóa dự án!', 'error');
    }
    renderDashboard();
    window.closeDeleteModal();
  } catch (err) {
    toast('❌ Lỗi khi xóa: ' + err.message, 'error');
  }
};

// =============================================
// PROFILE
// =============================================
function loadProfileForm() {
  const p = profile;
  setVal('prof-name',     p.name     || '');
  setVal('prof-title',    p.title    || '');
  setVal('prof-email',    p.email    || '');
  setVal('prof-phone',    p.phone    || '');
  setVal('prof-location', p.location || '');
  setVal('prof-github',   p.github   || '');
  setVal('prof-hero',     p.hero     || '');
  setVal('prof-bio',      p.bio      || '');
  setVal('prof-status',   p.status   || '');

  // Avatar
  pendingAvatarImage = p.avatarUrl || p.avatar || null;
  showImgPreview('avatarImagePreview', 'avatarImagePreviewImg', 'avatarImagePlaceholder', pendingAvatarImage);
  setEl('avatar-name-display',  p.name   || '');
  setEl('avatar-title-display', p.title  || '');
  setEl('status-text-display',  p.status || '');
  const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'NH';
  setEl('avatar-initials', initials);
  const avatarImg = document.getElementById('avatar-image');
  const avatarIni = document.getElementById('avatar-initials');
  if (pendingAvatarImage) {
    if (avatarImg) { avatarImg.src = pendingAvatarImage; avatarImg.style.display = 'block'; }
    if (avatarIni) avatarIni.style.display = 'none';
  } else {
    if (avatarImg) avatarImg.style.display = 'none';
    if (avatarIni) avatarIni.style.display = 'block';
  }
  const gl = document.getElementById('avatar-github-link');
  if (gl) gl.href = p.github || '#';

  // CV status
  const hasCv = !!(p.cvUrl);
  document.getElementById('cv-status-label').style.display = hasCv ? 'block' : 'none';
  document.getElementById('remove-cv-btn').style.display   = hasCv ? 'block' : 'none';
  if (hasCv) {
    document.getElementById('cv-status-label').textContent = `✅ CV đã upload: ${p.cvName || 'profile.pdf'} (Nhấn "Lưu" để cập nhật)`;
  }
  document.getElementById('cv-file-input').value = '';
}

window.saveProfile = async function (e) {
  if (e) e.preventDefault();
  const btn = document.getElementById('save-profile-topbtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu...'; }

  try {
    let avatarUrl = profile.avatarUrl || profile.avatar || null;
    // Upload avatar if new file selected
    if (pendingAvatarImage instanceof File) {
      toast('Đang upload ảnh đại diện...', 'info');
      avatarUrl = await storageUpload('images/avatar', pendingAvatarImage,
        pct => { if (btn) btn.textContent = `Upload avatar ${pct}%...`; }
      );
    } else if (typeof pendingAvatarImage === 'string' && pendingAvatarImage) {
      avatarUrl = pendingAvatarImage;
    } else if (pendingAvatarImage === null) {
      avatarUrl = null;
    }

    // CV handled separately by its own listener
    const newProfile = {
      name:      getVal('prof-name'),
      title:     getVal('prof-title'),
      email:     getVal('prof-email'),
      phone:     getVal('prof-phone'),
      location:  getVal('prof-location'),
      github:    getVal('prof-github'),
      hero:      getVal('prof-hero'),
      bio:       getVal('prof-bio'),
      status:    getVal('prof-status'),
      avatarUrl: avatarUrl,
      avatar:    avatarUrl, // compat
      cvUrl:     profile.cvUrl   || null,
      cvName:    profile.cvName  || null,
    };

    await dbSetDoc('profile', newProfile);
    profile = newProfile;
    loadProfileForm();
    toast('✅ Đã lưu hồ sơ!', 'success');
  } catch (err) {
    console.error(err);
    toast('❌ Lỗi khi lưu hồ sơ: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Lưu thay đổi'; }
  }
};

// CV Upload
function initCvUpload() {
  const input = document.getElementById('cv-file-input');
  if (!input) return;

  input.addEventListener('change', async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 5) { toast(`File CV quá lớn (${sizeMB.toFixed(1)}MB). Vui lòng chọn PDF nhỏ hơn 5MB.`, 'error'); input.value = ''; return; }

    const statusEl = document.getElementById('cv-status-label');
    const removeBtn = document.getElementById('remove-cv-btn');
    statusEl.style.display = 'block';
    statusEl.textContent = '⏳ Đang upload CV...';

    try {
      const url = await storageUpload('cv/profile.pdf', file, pct => {
        statusEl.textContent = `⏳ Đang upload CV... ${pct}%`;
      });

      // Save URL to profile immediately
      profile.cvUrl  = url;
      profile.cvName = file.name;
      await dbSetDoc('profile', profile);

      statusEl.textContent = `✅ CV đã upload thành công: ${file.name}`;
      removeBtn.style.display = 'block';
      toast('✅ CV đã được lưu và sẽ hiển thị trên website!', 'success');
    } catch (err) {
      console.error(err);
      statusEl.textContent = '❌ Upload thất bại!';
      statusEl.style.display = 'block';
      toast('❌ Lỗi upload CV: ' + err.message, 'error');
      input.value = '';
    }
  });
}

window.removeCVFile = async function () {
  try {
    await storageDelete('cv/profile.pdf');
    profile.cvUrl  = null;
    profile.cvName = null;
    await dbSetDoc('profile', profile);
    document.getElementById('cv-status-label').style.display = 'none';
    document.getElementById('remove-cv-btn').style.display   = 'none';
    document.getElementById('cv-file-input').value = '';
    toast('Đã gỡ CV!', 'info');
  } catch (err) {
    toast('Lỗi khi xóa CV: ' + err.message, 'error');
  }
};

// Profile live preview
function initProfileLivePreview() {
  ['prof-name', 'prof-title', 'prof-status'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      setEl('avatar-name-display',  getVal('prof-name'));
      setEl('avatar-title-display', getVal('prof-title'));
      setEl('status-text-display',  getVal('prof-status'));
    });
  });
}

// =============================================
// SETTINGS
// =============================================
function syncSettingsUI() {
  document.getElementById('maintenanceSwitch')?.classList.toggle('on', !!settings.maintenance);
  document.getElementById('themeSwitch')?.classList.toggle('on', document.documentElement.getAttribute('data-theme') === 'dark');
  // Music
  if (settings.bgMusicUrl || settings.bgMusic) {
    document.getElementById('musicFilePlaceholder')?.classList.add('hidden');
    const prev = document.getElementById('musicFilePreview');
    if (prev) {
      prev.classList.remove('hidden');
      const nm = settings.bgMusicName || settings.bgMusic?.name || 'Nhạc nền';
      const nmEl = document.getElementById('musicFileName');
      if (nmEl) nmEl.textContent = nm;
    }
  }
}

window.toggleMaintenance = async function () {
  settings.maintenance = !settings.maintenance;
  await dbSetDoc('settings', settings);
  document.getElementById('maintenanceSwitch')?.classList.toggle('on', settings.maintenance);
  toast(settings.maintenance ? 'Đã BẬT chế độ bảo trì!' : 'Đã TẮT chế độ bảo trì.', 'success');
};

window.handleMusicUpload = async function (event) {
  const file = event.target.files[0];
  if (!file) return;
  const sizeMB = file.size / 1024 / 1024;
  if (sizeMB > 10) { toast(`File nhạc quá lớn (${sizeMB.toFixed(1)}MB). Vui lòng chọn file nhỏ hơn 10MB.`, 'error'); event.target.value = ''; return; }

  const placeholder = document.getElementById('musicFilePlaceholder');
  const preview     = document.getElementById('musicFilePreview');
  const nameEl      = document.getElementById('musicFileName');

  try {
    toast('Đang upload nhạc...', 'info');
    const url = await storageUpload('music/background', file, pct => {
      if (nameEl) nameEl.textContent = `Uploading... ${pct}%`;
    });

    settings.bgMusicUrl  = url;
    settings.bgMusicName = file.name;
    // Keep legacy base64 for localStorage fallback
    if (!FIREBASE_ENABLED) {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsDataURL(file); });
      settings.bgMusic = { name: file.name, data: b64 };
    }
    await dbSetDoc('settings', settings);

    if (nameEl) nameEl.textContent = file.name;
    placeholder?.classList.add('hidden');
    preview?.classList.remove('hidden');
    toast('✅ Đã upload nhạc nền!', 'success');
  } catch (err) {
    toast('❌ Lỗi upload nhạc: ' + err.message, 'error');
    event.target.value = '';
  }
};

window.removeMusicFile = async function (event) {
  if (event) event.stopPropagation();
  try {
    await storageDelete('music/background');
  } catch {}
  delete settings.bgMusicUrl;
  delete settings.bgMusicName;
  delete settings.bgMusic;
  await dbSetDoc('settings', settings);
  document.getElementById('music-file-input').value = '';
  document.getElementById('musicFilePlaceholder')?.classList.remove('hidden');
  document.getElementById('musicFilePreview')?.classList.add('hidden');
  toast('Đã gỡ nhạc nền!', 'success');
};

window.resetAllData = async function () {
  if (!confirm('Reset toàn bộ dữ liệu về mặc định?')) return;
  try {
    // Delete all docs and re-seed
    if (FIREBASE_ENABLED && _db) {
      const batch = _db.batch();
      const pSnap = await _db.collection('posts').get();
      pSnap.docs.forEach(d => batch.delete(d.ref));
      const prSnap = await _db.collection('projects').get();
      prSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await seedIfEmpty('posts',    DEFAULT_POSTS);
      await seedIfEmpty('projects', DEFAULT_PROJECTS);
    } else {
      localStorage.removeItem('nhamblog_posts');
      localStorage.removeItem('nhamblog_projects');
      localStorage.removeItem('nhamblog_profile');
    }
    posts    = DEFAULT_POSTS.slice();
    projects = DEFAULT_PROJECTS.slice();
    profile  = { ...DEFAULT_PROFILE };
    renderPosts(); renderProjects(); renderDashboard(); loadProfileForm();
    toast('🔄 Đã reset về mặc định!', 'info');
  } catch (err) {
    toast('❌ Lỗi reset: ' + err.message, 'error');
  }
};

// =============================================
// MODALS
// =============================================
function openModal(backdropId, modalId) {
  document.getElementById(backdropId)?.classList.add('open');
  const m = document.getElementById(modalId);
  if (m) { m.style.display = 'block'; requestAnimationFrame(() => m.classList.add('open')); }
}
function closeModal(backdropId, modalId) {
  document.getElementById(backdropId)?.classList.remove('open');
  const m = document.getElementById(modalId);
  if (m) { m.classList.remove('open'); setTimeout(() => m.style.display = 'none', 250); }
}

window.openPostModal = function () {
  if (!document.getElementById('post-edit-id').value) {
    document.getElementById('postForm').reset();
    setEl('postModalTitle', 'Thêm bài viết mới');
    setVal('post-date', today());
    pendingPostImage = null;
    showImgPreview('postImagePreview', 'postImagePreviewImg', 'postImagePlaceholder', null);
  }
  openModal('postBackdrop', 'postModal');
};
window.closePostModal = function () {
  document.getElementById('post-edit-id').value = '';
  pendingPostImage = null;
  closeModal('postBackdrop', 'postModal');
};
window.openProjectModal = function () {
  if (!document.getElementById('project-edit-id').value) {
    document.getElementById('projectForm').reset();
    setEl('projectModalTitle', 'Thêm dự án mới');
    setVal('project-icon', '📱');
    pendingProjectImage = null;
    showImgPreview('projectImagePreview', 'projectImagePreviewImg', 'projectImagePlaceholder', null);
  }
  openModal('projectBackdrop', 'projectModal');
};
window.closeProjectModal = function () {
  document.getElementById('project-edit-id').value = '';
  pendingProjectImage = null;
  closeModal('projectBackdrop', 'projectModal');
};

// =============================================
// IMAGE UPLOAD ZONES
// =============================================
function compressImage(file, maxW = 800, quality = 0.75) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxW) { h = (maxW / w) * h; w = maxW; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => res(blob), 'image/webp', quality);
      };
      img.onerror = rej;
      img.src = e.target.result;
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function initImageZone(zoneId, inputId, placeholderId, previewId, previewImgId, setPending) {
  const zone   = document.getElementById(zoneId);
  const input  = document.getElementById(inputId);
  if (!zone || !input) return;

  async function handleFile(file) {
    if (!file.type.startsWith('image/')) { toast('⚠️ Chỉ chấp nhận file ảnh!', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('⚠️ Ảnh quá lớn (>5MB)!', 'error'); return; }
    try {
      const blob   = await compressImage(file);
      const objUrl = URL.createObjectURL(blob);
      setPending(blob); // store Blob — will be uploaded on save
      document.getElementById(previewImgId).src = objUrl;
      document.getElementById(placeholderId)?.classList.add('hidden');
      document.getElementById(previewId)?.classList.remove('hidden');
    } catch { toast('⚠️ Không thể đọc ảnh!', 'error'); }
  }

  zone.addEventListener('click',     e => { if (e.target.closest('.image-remove-btn')) return; input.click(); });
  input.addEventListener('change',   () => { if (input.files[0]) handleFile(input.files[0]); });
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop',      e => { e.preventDefault(); zone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
}

function showImgPreview(previewId, imgId, placeholderId, src) {
  const preview = document.getElementById(previewId);
  const img     = document.getElementById(imgId);
  const placeholder = document.getElementById(placeholderId);
  if (src) { if (img) img.src = src; preview?.classList.remove('hidden'); placeholder?.classList.add('hidden'); }
  else      { if (img) img.src = ''; preview?.classList.add('hidden');    placeholder?.classList.remove('hidden'); }
}

window.removePostImage    = () => { pendingPostImage    = null; showImgPreview('postImagePreview',    'postImagePreviewImg',    'postImagePlaceholder',    null); document.getElementById('post-image-input').value    = ''; };
window.removeProjectImage = () => { pendingProjectImage = null; showImgPreview('projectImagePreview', 'projectImagePreviewImg', 'projectImagePlaceholder', null); document.getElementById('project-image-input').value = ''; };
window.removeAvatarImage  = () => { pendingAvatarImage  = null; showImgPreview('avatarImagePreview',  'avatarImagePreviewImg',  'avatarImagePlaceholder',  null); document.getElementById('avatar-image-input').value  = ''; };

// =============================================
// FILTERS & SEARCH
// =============================================
function initFilters() {
  document.querySelectorAll('#postFilterChips .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#postFilterChips .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      postFilter.tag = btn.dataset.tag;
      renderPosts();
    });
  });
  let pt;
  document.getElementById('postSearchInput')?.addEventListener('input', e => { clearTimeout(pt); pt = setTimeout(() => { postFilter.q = e.target.value; renderPosts(); }, 250); });

  document.querySelectorAll('#projectFilterChips .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#projectFilterChips .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      projectFilter.tech = btn.dataset.tech;
      renderProjects();
    });
  });
  let prjt;
  document.getElementById('projectSearchInput')?.addEventListener('input', e => { clearTimeout(prjt); prjt = setTimeout(() => { projectFilter.q = e.target.value; renderProjects(); }, 250); });

  // Global search
  document.getElementById('globalSearch')?.addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    if (posts.some(p => p.title.toLowerCase().includes(q))) { window.switchTab('posts'); postFilter.q = q; renderPosts(); }
  });

  // Auto-slug
  document.getElementById('post-title')?.addEventListener('input', e => {
    const slugEl = document.getElementById('post-slug');
    if (!slugEl.dataset.manual) slugEl.value = toSlug(e.target.value);
  });
  document.getElementById('post-slug')?.addEventListener('input', e => { e.target.dataset.manual = e.target.value ? '1' : ''; });
}

// =============================================
// TOAST
// =============================================
function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const div = document.createElement('div');
  div.className = `toast-item ${type}`;
  div.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(div);
  setTimeout(() => { div.classList.add('out'); setTimeout(() => div.remove(), 300); }, 4000);
}

// =============================================
// UTILS
// =============================================
function setEl(id, val)  { const e = document.getElementById(id); if (e) e.textContent = val; }
function setVal(id, val) { const e = document.getElementById(id); if (e) e.value = val || ''; }
function getVal(id)      { return document.getElementById(id)?.value?.trim() || ''; }
function esc(s)          { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function fmtDate(d)      { try { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return d || ''; } }
function today()         { return new Date().toISOString().slice(0, 10); }
function toSlug(s)       { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'); }
function tagLabel(t)     { return { flutter: 'Flutter', 'react-native': 'React Native', kotlin: 'Kotlin', swift: 'Swift', dart: 'Dart', tips: 'Tips & Tricks' }[t] || t; }

// localStorage helper for settings
function _lsGet(k, def)  { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : def; } catch { return def; } }

// FadeIn animation
document.head.appendChild(Object.assign(document.createElement('style'), {
  textContent: `@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`
}));

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initSidebar();
  initKeyboard();
  initFilters();
  initProfileLivePreview();
  initCvUpload();
  setInterval(updateClock, 1000);
  updateClock();

  // Init image upload zones
  initImageZone('postImageZone',    'post-image-input',    'postImagePlaceholder', 'postImagePreview',    'postImagePreviewImg',    b => { pendingPostImage    = b; });
  initImageZone('projectImageZone', 'project-image-input', 'projectImagePlaceholder', 'projectImagePreview', 'projectImagePreviewImg', b => { pendingProjectImage = b; });
  initImageZone('avatarImageZone',  'avatar-image-input',  'avatarImagePlaceholder',  'avatarImagePreview',  'avatarImagePreviewImg',  b => { pendingAvatarImage  = b; });

  // Theme toggle button
  document.getElementById('themeToggleBtn')?.addEventListener('click', window.toggleThemeSwitch);
  document.getElementById('postForm')?.addEventListener('submit',    window.savePost);
  document.getElementById('profileForm')?.addEventListener('submit', window.saveProfile);

  // Load all data (async)
  await initData();

  // Show Firebase connection status
  if (FIREBASE_ENABLED) {
    toast(`🔥 Đã kết nối Firebase — dữ liệu real-time!`, 'success');
  } else {
    toast(`💾 Chạy offline (localStorage). Điền Firebase config vào js/firebase-config.js để bật real-time.`, 'info');
  }
});

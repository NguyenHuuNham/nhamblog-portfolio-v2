// =============================================
// admin-api.js — Admin Panel Logic with REST API
// Replaces the old localStorage-based admin.js
// =============================================

// =============================================
// STATE
// =============================================
let posts    = [];
let projects = [];
let profile  = {};
let settings = {};
let pendingDelete = null; // { type, id }

// =============================================
// AUTH GUARD — redirect if no valid token
// =============================================
async function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = './login.html';
    return false;
  }
  const result = await apiVerifyToken();
  if (!result.valid) {
    apiLogout();
    window.location.href = './login.html';
    return false;
  }
  // Show username
  const userEl = document.getElementById('sidebarUser');
  if (userEl && result.user) userEl.textContent = result.user.name || result.user.username;
  return true;
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  const ok = await checkAuth();
  if (!ok) return;

  initTheme();
  initSidebar();
  initClock();
  initSearch();
  initKeyboard();
  initAutoSlug();

  await loadAllData();
  renderDashboard();
  renderPostsGrid();
  renderProjectsGrid();
  renderProfileForm();
  renderSettingsForm();
  renderComments();
  fetchCodeFiles();
});

async function loadAllData() {
  try {
    [posts, projects, profile, settings] = await Promise.all([
      apiGetPosts().catch(() => []),
      apiGetProjects().catch(() => []),
      apiGetProfile().catch(() => ({})),
      apiGetSettings().catch(() => ({})),
    ]);
  } catch (e) {
    showToast('⚠️ Không tải được dữ liệu: ' + e.message, 'error');
  }
}

// =============================================
// THEME
// =============================================
function initTheme() {
  const saved = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeSwitchUI();

  document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const cur  = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeSwitchUI();
}

function updateThemeSwitchUI() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const themeSwitch = document.getElementById('themeSwitch');
  themeSwitch?.classList.toggle('active', isDark);
  themeSwitch?.classList.toggle('on', isDark);
}

window.toggleThemeSwitch = toggleTheme;

// =============================================
// SIDEBAR
// =============================================
function initSidebar() {
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  document.getElementById('sidebarCollapseBtn')?.addEventListener('click', () => {
    const sidebar    = document.getElementById('sidebar');
    const wrapper    = document.getElementById('mainWrapper');
    const collapsed  = sidebar?.classList.toggle('collapsed');
    wrapper?.classList.toggle('sidebar-collapsed', collapsed);
    const sidebarSwitch = document.getElementById('sidebarSwitch');
    sidebarSwitch?.classList.toggle('active', collapsed);
    sidebarSwitch?.classList.toggle('on', collapsed);
  });
}

window.toggleSidebar = function() {
  const sidebar   = document.getElementById('sidebar');
  const wrapper   = document.getElementById('mainWrapper');
  const collapsed = sidebar?.classList.toggle('collapsed');
  wrapper?.classList.toggle('sidebar-collapsed', collapsed);
  const sidebarSwitch = document.getElementById('sidebarSwitch');
  sidebarSwitch?.classList.toggle('active', collapsed);
  sidebarSwitch?.classList.toggle('on', collapsed);
};

// =============================================
// CLOCK
// =============================================
function initClock() {
  const el = document.getElementById('topbarClock');
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };
  tick();
  setInterval(tick, 60000);
}

// =============================================
// TABS
// =============================================
function switchTab(tabName) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));

  document.getElementById(`panel-${tabName}`)?.classList.add('active');
  document.getElementById(`nav-${tabName}`)?.classList.add('active');
  document.getElementById('bcCurrent').textContent =
    { 
      dashboard: 'Dashboard', 
      posts: 'Bài viết', 
      projects: 'Dự án', 
      comments: 'Bình luận',
      profile: 'Hồ sơ', 
      'edit-interface': 'Sửa giao diện', 
      'edit-functionality': 'Sửa chức năng',
      settings: 'Cài đặt' 
    }[tabName] || tabName;

  if (tabName === 'comments') renderComments();
}

window.switchTab = switchTab;

// =============================================
// TOAST
// =============================================
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

window.showToast = showToast;

// =============================================
// LOGOUT
// =============================================
window.logout = function() {
  apiLogout();
  window.location.href = './login.html';
};

// =============================================
// DASHBOARD
// =============================================
function renderDashboard() {
  const inprogress = projects.filter(p => p.status === 'inprogress').length;
  const completed  = projects.filter(p => p.status === 'completed').length;
  const commentsCount = posts.reduce((sum, post) => sum + (post.comments || []).length, 0);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('statPosts',     posts.length);
  set('statProjects',  projects.length);
  set('statInprogress', inprogress);
  set('statCompleted',  completed);
  set('badge-posts',    posts.length);
  set('badge-projects', projects.length);
  set('badge-comments', commentsCount);

  // Recent posts list
  const recentEl = document.getElementById('recentPostsList');
  if (recentEl) {
    recentEl.innerHTML = posts.slice(0, 5).map(p => `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">${escHtml(p.title)}</div>
          <div class="activity-meta">${formatDate(p.date)} · ${(p.tags||[]).join(', ')}</div>
        </div>
      </div>
    `).join('') || '<p style="color:var(--text-muted);font-size:0.875rem;padding:1rem;">Chưa có bài viết nào.</p>';
  }

  // Projects progress
  const projEl = document.getElementById('projectProgressList');
  if (projEl) {
    projEl.innerHTML = projects.slice(0, 5).map(p => `
      <div class="activity-item">
        <div class="activity-dot" style="background:${p.status === 'completed' ? 'var(--green)' : 'var(--amber, #f59e0b)'}"></div>
        <div class="activity-content">
          <div class="activity-title">${p.icon || ''} ${escHtml(p.title)}</div>
          <div class="activity-meta">${p.status === 'completed' ? '✓ Hoàn thành' : '⟳ Đang làm'}</div>
        </div>
      </div>
    `).join('') || '<p style="color:var(--text-muted);font-size:0.875rem;padding:1rem;">Chưa có dự án nào.</p>';
  }

  // Tag chart
  renderTagChart();
}

function renderTagChart() {
  const el = document.getElementById('tagChart');
  if (!el) return;
  const freq = {};
  posts.forEach(p => (p.tags || []).forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
  const tags = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max  = tags[0]?.[1] || 1;

  const tagMeta = {
    flutter:       { label: 'Flutter',       color: '#06b6d4' },
    'react-native':{ label: 'React Native',  color: '#a78bfa' },
    kotlin:        { label: 'Kotlin',        color: '#f97316' },
    swift:         { label: 'Swift',         color: '#f43f5e' },
    dart:          { label: 'Dart',          color: '#22d3ee' },
    tips:          { label: 'Tips',          color: '#4ade80' },
  };

  el.innerHTML = tags.map(([tag, count]) => {
    const meta = tagMeta[tag] || { label: tag, color: '#7c6dfa' };
    const pct  = Math.max(10, Math.round(count / max * 100));
    return `
      <div class="tag-bar-item">
        <div class="tag-bar-label">
          <span class="tag-bar-name">${meta.label}</span>
          <span class="tag-bar-count">${count}</span>
        </div>
        <div class="tag-bar-track">
          <div class="tag-bar-fill" style="width:${pct}%;background:${meta.color}"></div>
        </div>
      </div>
    `;
  }).join('') || '<p style="color:var(--text-muted);font-size:0.875rem;">Chưa có dữ liệu.</p>';
}

// =============================================
// POSTS GRID
// =============================================
function renderPostsGrid(searchQuery = '', filterTag = 'all') {
  const grid    = document.getElementById('postsGrid');
  const countEl = document.getElementById('postsCount');
  if (!grid) return;

  let filtered = posts;
  if (filterTag !== 'all') filtered = filtered.filter(p => (p.tags||[]).includes(filterTag));
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => p.title?.toLowerCase().includes(q) || p.summary?.toLowerCase().includes(q));
  }

  if (countEl) countEl.textContent = `${filtered.length} bài viết`;

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">Không tìm thấy bài viết nào</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const tagsHtml = (p.tags||[]).map(t => `<span class="tp-tag ${t}" style="font-size:0.7rem;padding:2px 8px;">${tagLabel(t)}</span>`).join('');
    return `
      <div class="post-card-admin">
        ${p.imageUrl ? `<div class="post-card-img" style="background:url('${resolveAssetUrl(p.imageUrl)}') center/cover no-repeat"></div>` : ''}
        <div class="post-card-body">
          <div class="post-card-tags">${tagsHtml}</div>
          <div class="post-card-title">${escHtml(p.title)}</div>
          <div class="post-card-summary">${escHtml(p.summary || '')}</div>
          <div class="post-card-meta">
            <span>${formatDate(p.date)}</span>
            <span>${p.readTime || ''}</span>
            <span>❤️ ${p.likes || 0}</span>
            <span>💬 ${(p.comments||[]).length}</span>
          </div>
        </div>
        <div class="post-card-actions">
          <button class="btn btn-ghost btn-sm" onclick="editPost(${p.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
            Sửa
          </button>
          <button class="btn btn-danger-sm" onclick="confirmDeletePost(${p.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            Xóa
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// =============================================
// POST MODAL
// =============================================
window.openPostModal = function() {
  const editId = document.getElementById('post-edit-id');
  if (!editId.value) {
    document.getElementById('postForm')?.reset();
    document.getElementById('postModalTitle').textContent = 'Thêm bài viết mới';
    document.getElementById('post-date').value = new Date().toISOString().slice(0, 10);
    removePostImage();
  }
  openModal('postBackdrop', 'postModal');
};

window.closePostModal = function() {
  document.getElementById('post-edit-id').value = '';
  closeModal('postBackdrop', 'postModal');
};

window.editPost = function(id) {
  const post = posts.find(p => p.id == id);
  if (!post) return;
  document.getElementById('postModalTitle').textContent = 'Sửa bài viết';
  document.getElementById('post-edit-id').value = post.id;
  document.getElementById('post-title').value   = post.title   || '';
  document.getElementById('post-slug').value    = post.slug    || '';
  document.getElementById('post-summary').value = post.summary || '';
  document.getElementById('post-content').value = post.content || '';
  document.getElementById('post-date').value    = post.date    || '';
  document.getElementById('post-readtime').value = post.readTime || '';

  document.querySelectorAll('#postTagPicker input[type="checkbox"]').forEach(cb => {
    cb.checked = (post.tags || []).includes(cb.value);
  });

  // Show existing image
  if (post.imageUrl) {
    showPostImagePreview(resolveAssetUrl(post.imageUrl));
  } else {
    removePostImage();
  }

  openModal('postBackdrop', 'postModal');
};

window.savePost = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-post');
  btn.disabled = true;
  btn.textContent = 'Đang lưu...';

  try {
    const editId   = document.getElementById('post-edit-id').value;
    const title    = document.getElementById('post-title').value.trim();
    const slug     = document.getElementById('post-slug').value.trim();
    const summary  = document.getElementById('post-summary').value.trim();
    const content  = document.getElementById('post-content').value.trim();
    const date     = document.getElementById('post-date').value;
    const readTime = document.getElementById('post-readtime').value.trim();
    const tags     = [...document.querySelectorAll('#postTagPicker input:checked')].map(c => c.value);
    const imgFile  = document.getElementById('post-image-input')?.files[0];

    const fd = new FormData();
    fd.append('title',    title);
    fd.append('slug',     slug || toSlug(title));
    fd.append('summary',  summary);
    fd.append('content',  content);
    fd.append('date',     date);
    fd.append('readTime', readTime || '5 phút');
    fd.append('tags',     JSON.stringify(tags));
    if (imgFile) fd.append('image', imgFile);

    let saved;
    if (editId) {
      saved = await apiUpdatePost(editId, fd);
      posts = posts.map(p => p.id == editId ? saved : p);
      showToast('✅ Đã cập nhật bài viết!');
    } else {
      saved = await apiCreatePost(fd);
      posts.unshift(saved);
      showToast('✅ Đã thêm bài viết mới!');
    }

    document.getElementById('badge-posts').textContent = posts.length;
    closePostModal();
    renderPostsGrid();
    renderDashboard();
    renderComments();
  } catch (err) {
    showToast('❌ Lỗi: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Lưu bài viết`;
  }
};

window.confirmDeletePost = function(id) {
  const post = posts.find(p => p.id == id);
  if (!post) return;
  pendingDelete = { type: 'post', id };
  document.getElementById('deleteMsg').textContent = `Bạn có chắc muốn xóa bài viết "${post.title}"?`;
  openModal('deleteBackdrop', 'deleteModal');
};

// ---- Post image upload ----
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('post-image-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) showPostImagePreview(URL.createObjectURL(file));
  });
  // Drag & drop
  const zone = document.getElementById('postImageZone');
  zone?.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
  zone?.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
  zone?.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      document.getElementById('post-image-input').files = dt.files;
      showPostImagePreview(URL.createObjectURL(file));
    }
  });
});

function showPostImagePreview(src) {
  document.getElementById('postImagePlaceholder')?.classList.add('hidden');
  document.getElementById('postImagePreview')?.classList.remove('hidden');
  const img = document.getElementById('postImagePreviewImg');
  if (img) img.src = src;
}

window.removePostImage = function() {
  document.getElementById('postImagePlaceholder')?.classList.remove('hidden');
  document.getElementById('postImagePreview')?.classList.add('hidden');
  const input = document.getElementById('post-image-input');
  if (input) input.value = '';
};

// =============================================
// PROJECTS GRID
// =============================================
function renderProjectsGrid(searchQuery = '', filterTech = 'all') {
  const grid    = document.getElementById('projectsAdminGrid');
  const countEl = document.getElementById('projectsCount');
  if (!grid) return;

  let filtered = projects;
  if (filterTech !== 'all') filtered = filtered.filter(p => (p.tech||[]).includes(filterTech));
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => p.title?.toLowerCase().includes(q));
  }

  if (countEl) countEl.textContent = `${filtered.length} dự án`;

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">Không tìm thấy dự án nào</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const statusBadge = p.status === 'completed'
      ? `<span style="color:var(--green);font-size:0.75rem;">✓ Hoàn thành</span>`
      : `<span style="color:#f59e0b;font-size:0.75rem;">⟳ Đang làm</span>`;
    const featuredBadge = p.featured
      ? `<span style="color:#facc15;font-size:0.75rem;">★ Nổi bật</span>`
      : '';
    const techHtml = (p.techLabels||p.tech||[]).slice(0,3)
      .map(t => `<span style="background:rgba(124,109,250,0.15);color:var(--accent2);font-size:0.7rem;padding:2px 7px;border-radius:4px;">${t}</span>`).join('');

    return `
      <div class="post-card-admin">
        ${p.imageUrl ? `<div class="post-card-img" style="background:url('${resolveAssetUrl(p.imageUrl)}') center/cover no-repeat;font-size:2rem;display:flex;align-items:center;justify-content:center;"></div>` : `<div class="post-card-img" style="display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:rgba(124,109,250,0.1);">${p.icon||'📱'}</div>`}
        <div class="post-card-body">
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem;">${statusBadge}${featuredBadge}</div>
          <div class="post-card-title">${p.icon||''} ${escHtml(p.title)}</div>
          <div class="post-card-summary">${escHtml(p.description||'')}</div>
          <div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-top:0.5rem;">${techHtml}</div>
        </div>
        <div class="post-card-actions">
          <button class="btn btn-ghost btn-sm" onclick="editProject(${p.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
            Sửa
          </button>
          <button class="btn btn-danger-sm" onclick="confirmDeleteProject(${p.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            Xóa
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// =============================================
// PROJECT MODAL
// =============================================
window.openProjectModal = function() {
  const editId = document.getElementById('project-edit-id');
  if (!editId.value) {
    document.getElementById('projectForm')?.reset();
    document.getElementById('projectModalTitle').textContent = 'Thêm dự án mới';
    removeProjectImage();
  }
  openModal('projectBackdrop', 'projectModal');
};

window.closeProjectModal = function() {
  document.getElementById('project-edit-id').value = '';
  closeModal('projectBackdrop', 'projectModal');
};

window.editProject = function(id) {
  const proj = projects.find(p => p.id == id);
  if (!proj) return;
  document.getElementById('projectModalTitle').textContent = 'Sửa dự án';
  document.getElementById('project-edit-id').value = proj.id;
  document.getElementById('project-icon').value    = proj.icon        || '';
  document.getElementById('project-title').value   = proj.title       || '';
  document.getElementById('project-desc').value    = proj.description || '';
  document.getElementById('project-tech-labels').value = (proj.techLabels || []).join(', ');
  document.getElementById('project-status').value  = proj.status || 'completed';
  document.getElementById('project-github').value  = proj.github || '';
  document.getElementById('project-featured').checked = !!proj.featured;

  document.querySelectorAll('input[name="proj-cat"]').forEach(cb => {
    cb.checked = (proj.tech || []).includes(cb.value);
  });

  if (proj.imageUrl) {
    showProjectImagePreview(resolveAssetUrl(proj.imageUrl));
  } else {
    removeProjectImage();
  }

  openModal('projectBackdrop', 'projectModal');
};

window.saveProject = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-project');
  btn.disabled = true;
  btn.textContent = 'Đang lưu...';

  try {
    const editId     = document.getElementById('project-edit-id').value;
    const icon       = document.getElementById('project-icon').value.trim() || '📱';
    const title      = document.getElementById('project-title').value.trim();
    const description = document.getElementById('project-desc').value.trim();
    const techLabels = document.getElementById('project-tech-labels').value;
    const tech       = [...document.querySelectorAll('input[name="proj-cat"]:checked')].map(c => c.value);
    const status     = document.getElementById('project-status').value;
    const github     = document.getElementById('project-github').value.trim();
    const featured   = document.getElementById('project-featured').checked;
    const imgFile    = document.getElementById('project-image-input')?.files[0];

    const fd = new FormData();
    fd.append('icon', icon);
    fd.append('title', title);
    fd.append('description', description);
    fd.append('techLabels', techLabels);
    fd.append('tech', JSON.stringify(tech));
    fd.append('status', status);
    fd.append('github', github);
    fd.append('featured', featured);
    if (imgFile) fd.append('image', imgFile);

    let saved;
    if (editId) {
      saved = await apiUpdateProject(editId, fd);
      projects = projects.map(p => p.id == editId ? saved : p);
      showToast('✅ Đã cập nhật dự án!');
    } else {
      saved = await apiCreateProject(fd);
      projects.push(saved);
      showToast('✅ Đã thêm dự án mới!');
    }

    document.getElementById('badge-projects').textContent = projects.length;
    closeProjectModal();
    renderProjectsGrid();
    renderDashboard();
  } catch (err) {
    showToast('❌ Lỗi: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Lưu dự án`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('project-image-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) showProjectImagePreview(URL.createObjectURL(file));
  });
});

function showProjectImagePreview(src) {
  document.getElementById('projectImagePlaceholder')?.classList.add('hidden');
  document.getElementById('projectImagePreview')?.classList.remove('hidden');
  const img = document.getElementById('projectImagePreviewImg');
  if (img) img.src = src;
}

window.removeProjectImage = function() {
  document.getElementById('projectImagePlaceholder')?.classList.remove('hidden');
  document.getElementById('projectImagePreview')?.classList.add('hidden');
  const input = document.getElementById('project-image-input');
  if (input) input.value = '';
};

window.confirmDeleteProject = function(id) {
  const proj = projects.find(p => p.id == id);
  if (!proj) return;
  pendingDelete = { type: 'project', id };
  document.getElementById('deleteMsg').textContent = `Bạn có chắc muốn xóa dự án "${proj.title}"?`;
  openModal('deleteBackdrop', 'deleteModal');
};

// =============================================
// DELETE CONFIRM
// =============================================
window.confirmDelete = async function() {
  if (!pendingDelete) return;
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.textContent = 'Đang xóa...';

  try {
    if (pendingDelete.type === 'post') {
      await apiDeletePost(pendingDelete.id);
      posts = posts.filter(p => p.id != pendingDelete.id);
      showToast('🗑️ Đã xóa bài viết!', 'info');
      renderPostsGrid();
      renderComments();
    } else {
      await apiDeleteProject(pendingDelete.id);
      projects = projects.filter(p => p.id != pendingDelete.id);
      showToast('🗑️ Đã xóa dự án!', 'info');
      renderProjectsGrid();
    }
    renderDashboard();
    closeDeleteModal();
  } catch (err) {
    showToast('❌ Xóa thất bại: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Xóa';
    pendingDelete = null;
  }
};

window.closeDeleteModal = function() {
  pendingDelete = null;
  closeModal('deleteBackdrop', 'deleteModal');
};

// =============================================
// PROFILE
// =============================================
function renderProfileForm() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('prof-name',     profile.name);
  set('prof-title',    profile.title);
  set('prof-email',    profile.email);
  set('prof-phone',    profile.phone);
  set('prof-location', profile.location);
  set('prof-github',   profile.github);
  set('prof-hero',     profile.hero);
  set('prof-status',   profile.status);
  set('prof-bio',      profile.bio);

  // Avatar preview
  if (profile.avatarUrl) {
    const img = document.getElementById('avatar-image');
    if (img) { img.src = resolveAssetUrl(profile.avatarUrl); img.style.display = 'block'; }
    document.getElementById('avatar-initials')?.style.setProperty('display', 'none');
    showAvatarPreview(resolveAssetUrl(profile.avatarUrl));
  }

  // CV status
  if (profile.cvUrl) {
    document.getElementById('cv-status-label')?.style.setProperty('display', 'block');
    document.getElementById('remove-cv-btn')?.style.setProperty('display', 'inline-flex');
  }

  // Display name/title in sidebar preview
  const nameEl  = document.getElementById('avatar-name-display');
  const titleEl = document.getElementById('avatar-title-display');
  if (nameEl)  nameEl.textContent  = profile.name  || '';
  if (titleEl) titleEl.textContent = profile.title || '';
}

window.saveProfile = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('save-profile-topbtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu...'; }

  try {
    const data = {
      name:     document.getElementById('prof-name')?.value.trim(),
      title:    document.getElementById('prof-title')?.value.trim(),
      email:    document.getElementById('prof-email')?.value.trim(),
      phone:    document.getElementById('prof-phone')?.value.trim(),
      location: document.getElementById('prof-location')?.value.trim(),
      github:   document.getElementById('prof-github')?.value.trim(),
      hero:     document.getElementById('prof-hero')?.value.trim(),
      status:   document.getElementById('prof-status')?.value.trim(),
      bio:      document.getElementById('prof-bio')?.value.trim(),
    };

    // Handle CV upload
    const cvFile = document.getElementById('cv-file-input')?.files[0];
    if (cvFile) {
      const result = await apiUploadCV(cvFile);
      profile.cvUrl  = result.cvUrl;
      profile.cvName = result.cvName;
      document.getElementById('cv-status-label')?.style.setProperty('display', 'block');
      document.getElementById('remove-cv-btn')?.style.setProperty('display', 'inline-flex');
    }

    profile = await apiUpdateProfile(data);
    showToast('✅ Đã lưu hồ sơ!');
  } catch (err) {
    showToast('❌ Lỗi: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Lưu thay đổi'; }
  }
};

// Avatar upload zone
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('avatarFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) showAvatarPreview(URL.createObjectURL(file));
  });
});

function showAvatarPreview(src) {
  const img = document.getElementById('avatar-image');
  if (img) { img.src = src; img.style.display = 'block'; }
  document.getElementById('avatar-initials')?.style.setProperty('display', 'none');
}

window.removeAvatarImage = async function() {
  try {
    await apiDeleteAvatar();
    profile.avatarUrl = null;
    // Reset avatar circle về initials
    const img = document.getElementById('avatar-image');
    if (img) img.style.display = 'none';
    const initials = document.getElementById('avatar-initials');
    if (initials) initials.style.display = '';
    showToast('✅ Đã xóa ảnh đại diện');
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  }
};

// Handler mới cho avatar click-to-upload (gắn với avatarFileInput)
window.handleAvatarUpload = async function(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('❌ Ảnh quá lớn (tối đa 5MB)', 'error'); return; }

  // Preview ngay
  const previewSrc = URL.createObjectURL(file);
  const img = document.getElementById('avatar-image');
  if (img) { img.src = previewSrc; img.style.display = 'block'; }
  document.getElementById('avatar-initials')?.style.setProperty('display', 'none');

  // Upload lên server
  try {
    showToast('⏳ Đang upload ảnh...');
    const result = await apiUploadAvatar(file);
    profile.avatarUrl = result.avatarUrl;
    showToast('✅ Đã cập nhật ảnh đại diện!');
  } catch (err) {
    showToast('❌ Upload thất bại: ' + err.message, 'error');
  }
};

// Hover effect cho avatar wrapper
document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('.avatar-wrapper[onclick]');
  const overlay = document.getElementById('avatar-overlay');
  if (wrapper && overlay) {
    wrapper.addEventListener('mouseenter', () => overlay.style.opacity = '1');
    wrapper.addEventListener('mouseleave', () => overlay.style.opacity = '0');
  }
});


window.removeCVFile = async function() {
  try {
    await apiDeleteCV();
    profile.cvUrl = null;
    document.getElementById('cv-status-label')?.style.setProperty('display', 'none');
    document.getElementById('remove-cv-btn')?.style.setProperty('display', 'none');
    showToast('✅ Đã xóa CV');
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  }
};

// =============================================
// SETTINGS
// =============================================
function renderSettingsForm() {
  const mainSwitch = document.getElementById('maintenanceSwitch');
  if (mainSwitch) {
    mainSwitch.classList.toggle('active', !!settings.maintenance);
    mainSwitch.classList.toggle('on', !!settings.maintenance);
  }

  // Music status — backend stores as 'musicUrl'
  if (settings.musicUrl) {
    const name = settings.musicName || 'Nhạc nền đã upload';
    const el = document.getElementById('musicFileName');
    if (el) el.textContent = name;
    document.getElementById('musicFilePlaceholder')?.classList.add('hidden');
    document.getElementById('musicFilePreview')?.classList.remove('hidden');
  } else {
    document.getElementById('musicFilePlaceholder')?.classList.remove('hidden');
    document.getElementById('musicFilePreview')?.classList.add('hidden');
  }
}

window.toggleMaintenance = async function() {
  try {
    const newVal = !settings.maintenance;
    settings = await apiUpdateSettings({ maintenance: newVal });
    const maintenanceSwitch = document.getElementById('maintenanceSwitch');
    maintenanceSwitch?.classList.toggle('active', newVal);
    maintenanceSwitch?.classList.toggle('on', newVal);
    showToast(newVal ? '🔒 Đã bật chế độ bảo trì' : '✅ Đã tắt chế độ bảo trì');
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  }
};

window.handleMusicUpload = async function(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const result = await apiUploadMusic(file);
    settings.musicUrl  = result.musicUrl;
    document.getElementById('musicFileName').textContent = file.name;
    document.getElementById('musicFilePlaceholder')?.classList.add('hidden');
    document.getElementById('musicFilePreview')?.classList.remove('hidden');
    showToast('✅ Đã upload nhạc nền!');
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  }
};

window.removeMusicFile = async function(e) {
  e.stopPropagation();
  try {
    await apiDeleteMusic();
    settings.musicUrl = null;
    document.getElementById('musicFilePlaceholder')?.classList.remove('hidden');
    document.getElementById('musicFilePreview')?.classList.add('hidden');
    document.getElementById('music-file-input').value = '';
    showToast('✅ Đã xóa nhạc nền');
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  }
};

window.resetAllData = async function() {
  if (!confirm('⚠️ Xoá toàn bộ dữ liệu và khôi phục dữ liệu mẫu? Hành động này không thể hoàn tác!')) return;
  showToast('⚠️ Chức năng này không khả dụng khi dùng REST API backend. Hãy xóa file data/*.json và khởi động lại server.', 'info');
};

// =============================================
// SEARCH
// =============================================
function initSearch() {
  let timer;
  document.getElementById('postSearchInput')?.addEventListener('input', (e) => {
    clearTimeout(timer);
    const activeTag = document.querySelector('#postFilterChips .filter-tab.active, #postFilterChips .chip.active')?.dataset.tag || 'all';
    timer = setTimeout(() => renderPostsGrid(e.target.value, activeTag), 300);
  });

  document.getElementById('projectSearchInput')?.addEventListener('input', (e) => {
    clearTimeout(timer);
    const activeTech = document.querySelector('#projectFilterChips .filter-tab.active, #projectFilterChips .chip.active')?.dataset.tech || 'all';
    timer = setTimeout(() => renderProjectsGrid(e.target.value, activeTech), 300);
  });

  // Post filter chips
  document.getElementById('postFilterChips')?.querySelectorAll('.filter-tab, .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#postFilterChips .filter-tab, #postFilterChips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderPostsGrid(document.getElementById('postSearchInput')?.value || '', chip.dataset.tag);
    });
  });

  // Project filter chips
  document.getElementById('projectFilterChips')?.querySelectorAll('.filter-tab, .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#projectFilterChips .filter-tab, #projectFilterChips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderProjectsGrid(document.getElementById('projectSearchInput')?.value || '', chip.dataset.tech);
    });
  });

  // Global sidebar search
  document.getElementById('globalSearch')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    if (!q) return;
    const found = posts.find(p => p.title.toLowerCase().includes(q));
    if (found) {
      switchTab('posts');
      document.getElementById('postSearchInput').value = q;
      renderPostsGrid(q);
    }
  });
}

// =============================================
// KEYBOARD SHORTCUTS
// =============================================
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.key === 'n' || e.key === 'N') { switchTab('posts'); setTimeout(openPostModal, 100); }
    if (e.key === 'p' || e.key === 'P') { switchTab('projects'); setTimeout(openProjectModal, 100); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('globalSearch')?.focus();
    }
    if (e.key === 'Escape') {
      closePostModal();
      closeProjectModal();
      closeDeleteModal();
    }
  });
}

// =============================================
// AUTO SLUG
// =============================================
function initAutoSlug() {
  document.getElementById('post-title')?.addEventListener('input', (e) => {
    const slugField = document.getElementById('post-slug');
    if (!slugField.dataset.manual) {
      slugField.value = toSlug(e.target.value);
    }
  });
  document.getElementById('post-slug')?.addEventListener('input', (e) => {
    e.target.dataset.manual = e.target.value ? '1' : '';
  });
}

// =============================================
// MODAL HELPERS
// =============================================
function openModal(backdropId, modalId) {
  document.getElementById(backdropId)?.classList.add('active');
  document.getElementById(modalId)?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(backdropId, modalId) {
  document.getElementById(backdropId)?.classList.remove('active');
  document.getElementById(modalId)?.classList.remove('active');
  document.body.style.overflow = '';
}

// =============================================
// UTILS
// =============================================
function toSlug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tagLabel(tag) {
  const map = { flutter: 'Flutter', 'react-native': 'React Native', kotlin: 'Kotlin', swift: 'Swift', dart: 'Dart', tips: 'Tips' };
  return map[tag] || tag;
}

// =============================================
// CHANGE PASSWORD
// =============================================
window.changePassword = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('change-pw-btn');
  const currentPw = document.getElementById('current-pw')?.value?.trim();
  const newPw     = document.getElementById('new-pw')?.value?.trim();
  const confirmPw = document.getElementById('confirm-pw')?.value?.trim();

  if (!currentPw || !newPw || !confirmPw) {
    showToast('⚠️ Vui lòng nhập đầy đủ các trường!', 'error');
    return;
  }
  if (newPw !== confirmPw) {
    showToast('❌ Mật khẩu xác nhận không khớp!', 'error');
    return;
  }
  if (newPw.length < 8) {
    showToast('❌ Mật khẩu mới phải ít nhất 8 ký tự!', 'error');
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Đang xử lý...'; }
  try {
    await apiChangePassword(currentPw, newPw);
    showToast('✅ Đổi mật khẩu thành công! Lần đăng nhập tiếp theo dùng mật khẩu mới.', 'success');
    document.getElementById('change-pw-form')?.reset();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Đổi mật khẩu'; }
  }
};

// =============================================
// COMMENTS MANAGEMENT
// =============================================
function renderComments() {
  const container = document.getElementById('commentsContainer');
  if (!container) return;

  // Collect all comments from all posts
  const allComments = [];
  posts.forEach(post => {
    (post.comments || []).forEach(c => {
      allComments.push({ ...c, postId: post.id, postTitle: post.title });
    });
  });

  // Sort newest first
  allComments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const countEl = document.getElementById('commentsCount');
  if (countEl) countEl.textContent = `${allComments.length} bình luận`;
  const badgeEl = document.getElementById('badge-comments');
  if (badgeEl) badgeEl.textContent = allComments.length;

  if (allComments.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text-muted)">Chưa có bình luận nào 💬</div>`;
    return;
  }

  container.innerHTML = allComments.map(c => `
    <div class="comment-admin-item" id="comment-${c.postId}-${c.id || c.createdAt}">
      <div class="comment-admin-header">
        <div class="comment-admin-meta">
          <span class="comment-author">👤 <strong>${escHtml(c.name || 'Ẩn danh')}</strong></span>
          <span class="comment-post-ref">→ <em>${escHtml(c.postTitle)}</em></span>
          <span class="comment-time" style="color:var(--text-muted);font-size:0.78rem">${c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN') : ''}</span>
        </div>
        <button class="btn btn-danger-sm" onclick="deleteComment(${c.postId}, '${c.id || c.createdAt}')">🗑️ Xóa</button>
      </div>
      <div class="comment-admin-content">${escHtml(c.content)}</div>
    </div>
  `).join('');
}

window.deleteComment = async function(postId, commentId) {
  if (!confirm('Xóa bình luận này?')) return;
  try {
    // Delete via API
    await apiFetch(`/posts/${postId}/comment/${commentId}`, { method: 'DELETE' });
    // Update local state
    const post = posts.find(p => p.id == postId);
    if (post) {
      post.comments = (post.comments || []).filter(c => String(c.id || c.createdAt) !== String(commentId));
    }
    renderComments();
    renderDashboard();
    showToast('🗑️ Đã xóa bình luận!', 'info');
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  }
};


function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr || ''; }
}

// =============================================
// CODE EDITOR (Categorized: Interface & Functionality)
// =============================================
let currentInterfaceFile = '';
let currentFunctionalityFile = '';

// Fetch files for both categories
async function fetchCodeFiles() {
  try {
    const res = await apiFetch('/code/list');
    
    // Populate Interface files
    const interfaceSelect = document.getElementById('interfaceFileSelect');
    if (interfaceSelect && res.categories && res.categories.interface) {
      interfaceSelect.innerHTML = '<option value="">-- Chọn file giao diện cần sửa --</option>' + 
        res.categories.interface.map(f => `<option value="${f}">${f}</option>`).join('');
    } else if (interfaceSelect && res.files) {
      // Fallback for older API
      const interfaceFiles = res.files.filter(f => 
        f.endsWith('.html') || f.endsWith('.css')
      );
      interfaceSelect.innerHTML = '<option value="">-- Chọn file giao diện cần sửa --</option>' + 
        interfaceFiles.map(f => `<option value="${f}">${f}</option>`).join('');
    }
    
    // Populate Functionality files
    const functionalitySelect = document.getElementById('functionalityFileSelect');
    if (functionalitySelect && res.categories && res.categories.functionality) {
      functionalitySelect.innerHTML = '<option value="">-- Chọn file chức năng cần sửa --</option>' + 
        res.categories.functionality.map(f => `<option value="${f}">${f}</option>`).join('');
    } else if (functionalitySelect && res.files) {
      // Fallback for older API
      const functionalityFiles = res.files.filter(f => f.endsWith('.js'));
      functionalitySelect.innerHTML = '<option value="">-- Chọn file chức năng cần sửa --</option>' + 
        functionalityFiles.map(f => `<option value="${f}">${f}</option>`).join('');
    }
  } catch (err) {
    console.error('Lỗi lấy danh sách file:', err);
  }
}

// Load file for a specific category
window.loadCodeEditorFile = async function(category) {
  if (category === 'interface') {
    const select = document.getElementById('interfaceFileSelect');
    const textarea = document.getElementById('interfaceEditorTextarea');
    const loader = document.getElementById('interfaceEditorLoading');
    const file = select.value;
    
    if (!file) {
      textarea.value = '';
      currentInterfaceFile = '';
      return;
    }

    try {
      loader.classList.remove('hidden');
      const res = await apiFetch(`/code?file=${encodeURIComponent(file)}`);
      textarea.value = res.content || '';
      currentInterfaceFile = file;
    } catch (err) {
      showToast('❌ Không thể tải file: ' + err.message, 'error');
      textarea.value = '';
      select.value = '';
      currentInterfaceFile = '';
    } finally {
      loader.classList.add('hidden');
    }
  } else if (category === 'functionality') {
    const select = document.getElementById('functionalityFileSelect');
    const textarea = document.getElementById('functionalityEditorTextarea');
    const loader = document.getElementById('functionalityEditorLoading');
    const file = select.value;
    
    if (!file) {
      textarea.value = '';
      currentFunctionalityFile = '';
      return;
    }

    try {
      loader.classList.remove('hidden');
      const res = await apiFetch(`/code?file=${encodeURIComponent(file)}`);
      textarea.value = res.content || '';
      currentFunctionalityFile = file;
    } catch (err) {
      showToast('❌ Không thể tải file: ' + err.message, 'error');
      textarea.value = '';
      select.value = '';
      currentFunctionalityFile = '';
    } finally {
      loader.classList.add('hidden');
    }
  }
};

// Save file for a specific category
window.saveCodeEditor = async function(category) {
  let currentFile, textarea, btn, loader;
  
  if (category === 'interface') {
    currentFile = currentInterfaceFile;
    textarea = document.getElementById('interfaceEditorTextarea');
    btn = document.getElementById('btn-save-interface');
    loader = document.getElementById('interfaceEditorLoading');
  } else if (category === 'functionality') {
    currentFile = currentFunctionalityFile;
    textarea = document.getElementById('functionalityEditorTextarea');
    btn = document.getElementById('btn-save-functionality');
    loader = document.getElementById('functionalityEditorLoading');
  }
  
  if (!currentFile) {
    showToast('⚠️ Vui lòng chọn một file để lưu!', 'error');
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu...'; }
  loader.classList.remove('hidden');

  try {
    await apiFetch('/code', {
      method: 'PUT',
      body: JSON.stringify({
        file: currentFile,
        content: textarea.value
      })
    });
    showToast('✅ Đã lưu file thành công!', 'success');
  } catch (err) {
    showToast('❌ Lỗi khi lưu: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Lưu thay đổi`;
    }
    loader.classList.add('hidden');
  }
};

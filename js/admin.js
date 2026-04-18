const DEFAULT_POSTS = POSTS;
const DEFAULT_PROJECTS = PROJECTS;
// =============================================
// admin.js — Admin Panel Logic
// CRUD for Posts, Projects, Profile
// Data stored in localStorage
// =============================================



// ---- Storage Keys ----
const KEYS = {
  posts: 'nhamblog_posts',
  projects: 'nhamblog_projects',
  profile: 'nhamblog_profile',
};

// ---- Default Profile ----
const DEFAULT_PROFILE = {
  name: 'Nguyễn Hữu Nhậm',
  title: 'Mobile App Developer',
  email: 'nham@email.com',
  location: 'Hà Nội, Việt Nam',
  github: 'https://github.com/nham',
  hero: 'Sinh viên IT năm 3 · Mobile App Developer',
  bio: 'Xin chào! Tôi là Nguyễn Hữu Nhậm, một sinh viên IT năm 3 với đam mê cháy bỏng về phát triển ứng dụng mobile.',
  status: 'Đang tìm kiếm cơ hội thực tập',
};

// ---- Load / Save helpers ----
function loadData(key, defaults) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaults;
  } catch { return defaults; }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ---- Init state ----
let posts = loadData(KEYS.posts, DEFAULT_POSTS);
let projects = loadData(KEYS.projects, DEFAULT_PROJECTS);
let profile = loadData(KEYS.profile, DEFAULT_PROFILE);

// ---- Delete state ----
let pendingDelete = null; // { type: 'post'|'project', id }

// =============================================
// THEME
// =============================================
function initTheme() {
  const saved = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', saved);

  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// =============================================
// TABS
// =============================================
function switchTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`panel-${tabName}`)?.classList.add('active');
  document.getElementById(`tab-${tabName}`)?.classList.add('active');
}

window.switchTab = switchTab;

function initTabs() {
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

// =============================================
// TOAST
// =============================================
let toastTimer = null;

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

window.showToast = showToast;

// =============================================
// MOBILE SIDEBAR
// =============================================
function initMobileSidebar() {
  const btn = document.getElementById('adminHamburger');
  const sidebar = document.getElementById('adminSidebar');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', () => sidebar.classList.toggle('open'));
  sidebar.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', () => sidebar.classList.remove('open'));
  });
}

// =============================================
// DASHBOARD
// =============================================
function renderDashboard() {
  const inprogress = projects.filter(p => p.status === 'inprogress').length;
  const completed = projects.filter(p => p.status === 'completed').length;

  el('dash-posts-count', posts.length);
  el('dash-projects-count', projects.length);
  el('dash-inprogress-count', inprogress);
  el('dash-completed-count', completed);
  el('posts-count-badge', posts.length);
  el('projects-count-badge', projects.length);

  const container = document.getElementById('dash-recent-posts');
  if (container) {
    container.innerHTML = posts.slice(0, 5).map(p => `
      <div class="dash-post-row">
        <span class="dash-post-title">${escHtml(p.title)}</span>
        <span class="dash-post-date">${formatDate(p.date)}</span>
      </div>
    `).join('') || '<p style="color:var(--text-muted);font-size:0.875rem;">Chưa có bài viết nào.</p>';
  }
}

function el(id, text) {
  const e = document.getElementById(id);
  if (e) e.textContent = text;
}

// =============================================
// POSTS TABLE
// =============================================
function renderPostsTable(searchQuery = '') {
  const tbody = document.getElementById('postsTableBody');
  const countEl = document.getElementById('posts-table-count');
  if (!tbody) return;

  let filtered = posts;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.summary?.toLowerCase().includes(q)
    );
  }

  countEl.textContent = `${filtered.length} bài viết`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">Không tìm thấy bài viết nào</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const tagHTML = (p.tags || []).map(t => `<span class="tag ${t}">${tagLabel(t)}</span>`).join('');
    return `
      <tr>
        <td><span class="table-title">${escHtml(p.title)}</span></td>
        <td><div class="table-tags">${tagHTML}</div></td>
        <td><time datetime="${p.date}">${formatDate(p.date)}</time></td>
        <td>${p.readTime || '—'}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" onclick="editPost(${p.id})">✏️ Sửa</button>
            <button class="action-btn delete" onclick="deletePost(${p.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.editPost = function(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;
  document.getElementById('postModalTitle').textContent = 'Sửa bài viết';
  document.getElementById('post-edit-id').value = id;
  document.getElementById('post-title').value = post.title || '';
  document.getElementById('post-slug').value = post.slug || '';
  document.getElementById('post-summary').value = post.summary || '';
  document.getElementById('post-date').value = post.date || '';
  document.getElementById('post-readtime').value = post.readTime || '';

  // Reset checkboxes
  document.querySelectorAll('#postTagSelector input[type="checkbox"]').forEach(cb => {
    cb.checked = (post.tags || []).includes(cb.value);
  });
  openPostModal();
};

window.deletePost = function(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;
  pendingDelete = { type: 'post', id };
  document.getElementById('deleteModalMsg').textContent = `Bạn có chắc muốn xóa bài viết "${post.title}" không?`;
  openDeleteModal();
};

window.savePost = function(e) {
  e.preventDefault();
  const editId = document.getElementById('post-edit-id').value;
  const title = document.getElementById('post-title').value.trim();
  const slug = document.getElementById('post-slug').value.trim() || toSlug(title);
  const summary = document.getElementById('post-summary').value.trim();
  const date = document.getElementById('post-date').value || new Date().toISOString().slice(0, 10);
  const readTime = document.getElementById('post-readtime').value.trim() || '5 phút';
  const tags = [...document.querySelectorAll('#postTagSelector input:checked')].map(c => c.value);

  if (editId) {
    const idx = posts.findIndex(p => p.id == editId);
    if (idx !== -1) {
      posts[idx] = { ...posts[idx], title, slug, summary, date, readTime, tags };
      showToast('✅ Đã cập nhật bài viết!', 'success');
    }
  } else {
    const newId = posts.length ? Math.max(...posts.map(p => p.id)) + 1 : 1;
    posts.unshift({ id: newId, title, slug, summary, date, readTime, tags });
    showToast('✅ Đã thêm bài viết mới!', 'success');
  }

  saveData(KEYS.posts, posts);
  closePostModal();
  renderPostsTable();
  renderDashboard();
};

// =============================================
// PROJECTS TABLE
// =============================================
function renderProjectsTable(searchQuery = '') {
  const tbody = document.getElementById('projectsTableBody');
  const countEl = document.getElementById('projects-table-count');
  if (!tbody) return;

  let filtered = projects;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = projects.filter(p => p.title.toLowerCase().includes(q));
  }

  countEl.textContent = `${filtered.length} dự án`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">Không tìm thấy dự án nào</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const statusBadge = p.status === 'completed'
      ? `<span class="project-status status-completed">✓ Hoàn thành</span>`
      : `<span class="project-status status-inprogress">⬡ Đang làm</span>`;
    const featuredBadge = p.featured
      ? `<span class="featured-badge featured-yes">★ Nổi bật</span>`
      : `<span class="featured-badge featured-no">—</span>`;
    const techHTML = (p.techLabels || p.tech || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('');

    return `
      <tr>
        <td><span class="table-title">${p.icon || ''} ${escHtml(p.title)}</span></td>
        <td><div class="table-tags">${techHTML}</div></td>
        <td>${statusBadge}</td>
        <td>${featuredBadge}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" onclick="editProject(${p.id})">✏️ Sửa</button>
            <button class="action-btn delete" onclick="deleteProject(${p.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.editProject = function(id) {
  const proj = projects.find(p => p.id === id);
  if (!proj) return;
  document.getElementById('projectModalTitle').textContent = 'Sửa dự án';
  document.getElementById('project-edit-id').value = id;
  document.getElementById('project-icon').value = proj.icon || '';
  document.getElementById('project-title').value = proj.title || '';
  document.getElementById('project-desc').value = proj.description || '';
  document.getElementById('project-tech-labels').value = (proj.techLabels || []).join(', ');
  document.getElementById('project-status').value = proj.status || 'completed';
  document.getElementById('project-github').value = proj.github || '';
  document.getElementById('project-featured').checked = !!proj.featured;

  document.querySelectorAll('input[name="proj-tech"]').forEach(cb => {
    cb.checked = (proj.tech || []).includes(cb.value);
  });
  openProjectModal();
};

window.deleteProject = function(id) {
  const proj = projects.find(p => p.id === id);
  if (!proj) return;
  pendingDelete = { type: 'project', id };
  document.getElementById('deleteModalMsg').textContent = `Bạn có chắc muốn xóa dự án "${proj.title}" không?`;
  openDeleteModal();
};

window.saveProject = function(e) {
  e.preventDefault();
  const editId = document.getElementById('project-edit-id').value;
  const icon = document.getElementById('project-icon').value.trim() || '📱';
  const title = document.getElementById('project-title').value.trim();
  const description = document.getElementById('project-desc').value.trim();
  const techLabels = document.getElementById('project-tech-labels').value.split(',').map(t => t.trim()).filter(Boolean);
  const tech = [...document.querySelectorAll('input[name="proj-tech"]:checked')].map(c => c.value);
  const status = document.getElementById('project-status').value;
  const github = document.getElementById('project-github').value.trim();
  const featured = document.getElementById('project-featured').checked;

  if (editId) {
    const idx = projects.findIndex(p => p.id == editId);
    if (idx !== -1) {
      projects[idx] = { ...projects[idx], icon, title, description, techLabels, tech, status, github, featured };
      showToast('✅ Đã cập nhật dự án!', 'success');
    }
  } else {
    const newId = projects.length ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    projects.push({ id: newId, icon, title, description, techLabels, tech, status, github, featured, demo: null });
    showToast('✅ Đã thêm dự án mới!', 'success');
  }

  saveData(KEYS.projects, projects);
  closeProjectModal();
  renderProjectsTable();
  renderDashboard();
};

// =============================================
// PROFILE
// =============================================
window.loadProfile = function() {
  document.getElementById('prof-name').value = profile.name || '';
  document.getElementById('prof-title').value = profile.title || '';
  document.getElementById('prof-email').value = profile.email || '';
  document.getElementById('prof-location').value = profile.location || '';
  document.getElementById('prof-github').value = profile.github || '';
  document.getElementById('prof-hero').value = profile.hero || '';
  document.getElementById('prof-bio').value = profile.bio || '';
  document.getElementById('prof-status').value = profile.status || '';
};

window.saveProfile = function(e) {
  e.preventDefault();
  profile = {
    name: document.getElementById('prof-name').value.trim(),
    title: document.getElementById('prof-title').value.trim(),
    email: document.getElementById('prof-email').value.trim(),
    location: document.getElementById('prof-location').value.trim(),
    github: document.getElementById('prof-github').value.trim(),
    hero: document.getElementById('prof-hero').value.trim(),
    bio: document.getElementById('prof-bio').value.trim(),
    status: document.getElementById('prof-status').value.trim(),
  };
  saveData(KEYS.profile, profile);
  showToast('✅ Đã lưu thông tin cá nhân!', 'success');
};

// =============================================
// MODALS
// =============================================
function openModal(overlayId, modalId) {
  document.getElementById(overlayId)?.classList.add('open');
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    requestAnimationFrame(() => modal.classList.add('open'));
  }
}

function closeModal(overlayId, modalId) {
  document.getElementById(overlayId)?.classList.remove('open');
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => { modal.style.display = 'none'; }, 200);
  }
}

window.openPostModal = function() {
  // Reset form if new
  const editId = document.getElementById('post-edit-id');
  if (!editId.value) {
    document.getElementById('postForm').reset();
    document.getElementById('postModalTitle').textContent = 'Thêm bài viết mới';
    document.getElementById('post-date').value = new Date().toISOString().slice(0, 10);
  }
  openModal('postModalOverlay', 'postModal');
};

window.closePostModal = function() {
  document.getElementById('post-edit-id').value = '';
  closeModal('postModalOverlay', 'postModal');
};

window.openProjectModal = function() {
  const editId = document.getElementById('project-edit-id');
  if (!editId.value) {
    document.getElementById('projectForm').reset();
    document.getElementById('projectModalTitle').textContent = 'Thêm dự án mới';
  }
  openModal('projectModalOverlay', 'projectModal');
};

window.closeProjectModal = function() {
  document.getElementById('project-edit-id').value = '';
  closeModal('projectModalOverlay', 'projectModal');
};

function openDeleteModal() {
  openModal('deleteModalOverlay', 'deleteModal');
}

window.closeDeleteModal = function() {
  pendingDelete = null;
  closeModal('deleteModalOverlay', 'deleteModal');
};

window.confirmDelete = function() {
  if (!pendingDelete) return;
  if (pendingDelete.type === 'post') {
    posts = posts.filter(p => p.id !== pendingDelete.id);
    saveData(KEYS.posts, posts);
    renderPostsTable();
    showToast('🗑️ Đã xóa bài viết!', 'error');
  } else {
    projects = projects.filter(p => p.id !== pendingDelete.id);
    saveData(KEYS.projects, projects);
    renderProjectsTable();
    showToast('🗑️ Đã xóa dự án!', 'error');
  }
  renderDashboard();
  closeDeleteModal();
};

// =============================================
// SEARCH
// =============================================
function initSearch() {
  let timer;
  document.getElementById('adminPostSearch')?.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => renderPostsTable(e.target.value), 300);
  });

  document.getElementById('adminProjectSearch')?.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => renderProjectsTable(e.target.value), 300);
  });
}

// =============================================
// Auto-slug
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('post-title')?.addEventListener('input', (e) => {
    const slugField = document.getElementById('post-slug');
    if (!slugField.dataset.manual) {
      slugField.value = toSlug(e.target.value);
    }
  });

  document.getElementById('post-slug')?.addEventListener('input', (e) => {
    e.target.dataset.manual = e.target.value ? '1' : '';
  });
});

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
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tagLabel(tag) {
  const map = { 'flutter': 'Flutter', 'react-native': 'React Native', 'kotlin': 'Kotlin', 'swift': 'Swift', 'dart': 'Dart', 'tips': 'Tips' };
  return map[tag] || tag;
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initMobileSidebar();
  initSearch();
  loadProfile();
  renderDashboard();
  renderPostsTable();
  renderProjectsTable();
});

// =============================================
// blog.js — Blog listing page
// =============================================

let currentTag    = 'all';
let currentSearch = '';

function renderBlogPosts() {
  const container = document.getElementById('blogPostList');
  const noResults = document.getElementById('noResults');
  const loading   = document.getElementById('blogLoading');
  if (!container) return;

  let filtered = window.POSTS || [];
  if (currentTag !== 'all')  filtered = filtered.filter(p => (p.tags||[]).includes(currentTag));
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.summary||'').toLowerCase().includes(q) ||
      (p.tags||[]).some(t => t.includes(q))
    );
  }

  if (loading) loading.style.display = 'none';

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (noResults) noResults.style.display = 'block';
  } else {
    if (noResults) noResults.style.display = 'none';
    container.innerHTML = filtered.map(p => buildPostItem(p)).join('');
  }

  if (typeof initScrollAnimations === 'function') requestAnimationFrame(initScrollAnimations);
}

window.setupBlogPage = async function() {
  initTheme();

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  // Show loading
  const loading = document.getElementById('blogLoading');
  if (loading) loading.style.display = 'block';

  // Load data
  await loadPublicData();
  renderBlogPosts();

  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    if (searchInput.dataset.boundSearch !== '1') {
      searchInput.dataset.boundSearch = '1';
    let timer;
    searchInput.addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => { currentSearch = e.target.value; renderBlogPosts(); }, 300);
    });
    }
  }

  // Tag filters
  document.querySelectorAll('#filterTags .filter-btn').forEach(btn => {
    if (btn.dataset.boundFilter === '1') return;
    btn.dataset.boundFilter = '1';
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filterTags .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTag = btn.dataset.tag;
      renderBlogPosts();
    });
  });
};

document.addEventListener('DOMContentLoaded', window.setupBlogPage);

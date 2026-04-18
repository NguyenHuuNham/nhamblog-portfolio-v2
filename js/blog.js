// =============================================
// blog.js — Blog listing page
// =============================================

let currentTag    = 'all';
let currentSearch = '';

function renderBlogPosts() {
  const container = document.getElementById('blogPostList');
  const noResults = document.getElementById('noResults');
  if (!container) return;

  let filtered = POSTS;
  if (currentTag !== 'all')  filtered = filtered.filter(p => (p.tags||[]).includes(currentTag));
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || (p.summary||'').toLowerCase().includes(q) || (p.tags||[]).some(t => t.includes(q)));
  }

  if (filtered.length === 0) { container.innerHTML = ''; noResults?.classList.remove('hidden'); }
  else { noResults?.classList.add('hidden'); container.innerHTML = filtered.map(p => buildPostItem(p)).join(''); }
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  const nav = document.getElementById('navbar');
  if (nav) { const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20); window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }

  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));

  // Load data
  await loadPublicData();
  renderBlogPosts();

  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => { currentSearch = e.target.value; renderBlogPosts(); }, 300); });
  }

  // Tag filters
  document.querySelectorAll('#filterTags .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filterTags .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTag = btn.dataset.tag;
      renderBlogPosts();
    });
  });
});

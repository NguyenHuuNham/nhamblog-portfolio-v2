// =============================================
// projects.js — Projects page
// =============================================

let currentTech = 'all';

function renderProjectsPage() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  const filtered = (window.PROJECTS || []).filter(p => currentTech === 'all' || (p.tech||[]).includes(currentTech));
  grid.innerHTML = filtered.length
    ? filtered.map(p => buildProjectCard(p)).join('')
    : `<div class="empty-state app-empty-state">
        <div class="empty-state-icon">◇</div>
        <h3>Chưa có dự án phù hợp</h3>
        <p>Thử chọn bộ lọc khác hoặc quay lại mục tất cả.</p>
      </div>`;
  if (typeof initScrollAnimations === 'function') requestAnimationFrame(initScrollAnimations);
}

window.setupProjectsPage = async function() {
  initTheme();

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  const nav = document.getElementById('navbar');
  if (nav) { const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20); window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }

  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));

  // Load data
  const projects = window.PROJECTS || [];
  const grid = document.getElementById('projectsGrid');
  
  if (projects.length === 0 && grid) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-muted);">Đang tải dự án...</div>';
    await loadPublicData();
  }
  
  renderProjectsPage();

  // Filter buttons
  document.querySelectorAll('.filter-bar .filter-btn').forEach(btn => {
    if (btn.dataset.boundFilter === '1') return;
    btn.dataset.boundFilter = '1';
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTech = btn.dataset.tech;
      renderProjectsPage();
    });
  });
};

document.addEventListener('DOMContentLoaded', window.setupProjectsPage);

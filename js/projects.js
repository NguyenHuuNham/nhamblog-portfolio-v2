// =============================================
// projects.js — Projects page
// =============================================

let currentTech = 'all';

function renderProjectsPage() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  const filtered = currentTech === 'all' ? PROJECTS : PROJECTS.filter(p => (p.tech||[]).includes(currentTech));
  grid.innerHTML = filtered.map(p => buildProjectCard(p)).join('');
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
  renderProjectsPage();

  // Filter buttons
  document.querySelectorAll('.projects-filter .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.projects-filter .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTech = btn.dataset.tech;
      renderProjectsPage();
    });
  });
});

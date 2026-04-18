// =============================================
// main.js — Shared utilities for public pages
// Theme, Nav, Music, Render helpers, Profile UI, CV viewer
// =============================================

// ============ THEME (no-flicker already set by inline script in <head>) ============
function initTheme() {
  const saved      = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme      = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// Sync theme change across open tabs
window.addEventListener('storage', e => {
  if (e.key === 'theme' && e.newValue) {
    document.documentElement.setAttribute('data-theme', e.newValue);
  }
});

// ============ BACKGROUND MUSIC ============
let globalAudio    = null;
let isMusicPlaying = false;

async function initMusicPlayer() {
  try {
    // Load settings from API
    const settingsData = SETTINGS || await apiGetSettings().catch(() => null);

    // Backend stores music URL as 'musicUrl' (relative path like /uploads/music-xxx.mp3)
    const musicUrl  = settingsData?.musicUrl  || null;
    const musicSrc  = musicUrl ? (musicUrl.startsWith('http') ? musicUrl : musicUrl) : null;

    if (!musicSrc) return;

    if (window.__bgAudioInstance) { window.__bgAudioInstance.pause(); window.__bgAudioInstance.src = ''; }
    globalAudio       = new Audio(musicSrc);
    globalAudio.loop  = true;
    globalAudio.volume = 0.5;
    window.__bgAudioInstance = globalAudio;

    document.querySelectorAll('.music-toggle').forEach(btn => {
      btn.classList.remove('hidden');
      btn.removeEventListener('click', toggleMusic);
      btn.addEventListener('click', toggleMusic);
    });

    const shouldPlay   = sessionStorage.getItem('music_playing') === 'true';
    const resumeTime   = parseFloat(sessionStorage.getItem('music_time') || '0');
    const hasPrompted  = sessionStorage.getItem('nhamblog_music_prompted');

    if (shouldPlay) {
      const tryPlay = () => {
        globalAudio.currentTime = resumeTime;
        globalAudio.play().then(() => { isMusicPlaying = true; updateMusicIcons(); })
          .catch(() => { sessionStorage.setItem('music_playing', 'false'); isMusicPlaying = false; updateMusicIcons(); });
      };
      if (globalAudio.readyState >= 1) tryPlay();
      else globalAudio.addEventListener('loadedmetadata', tryPlay, { once: true });
    } else if (!hasPrompted) {
      showMusicPrompt();
    }

    window.addEventListener('beforeunload', () => {
      if (globalAudio) {
        sessionStorage.setItem('music_playing', isMusicPlaying ? 'true' : 'false');
        sessionStorage.setItem('music_time', globalAudio.currentTime);
      }
    });
  } catch (e) { console.warn('Music player error:', e); }
}

function updateMusicIcons() {
  document.querySelectorAll('.music-toggle').forEach(btn => {
    btn.querySelector('.icon-music-on')?.classList.toggle('hidden', !isMusicPlaying);
    btn.querySelector('.icon-music-off')?.classList.toggle('hidden',  isMusicPlaying);
    btn.classList.toggle('playing', isMusicPlaying);
  });
}

function toggleMusic() {
  if (!globalAudio) return;
  if (isMusicPlaying) { globalAudio.pause(); isMusicPlaying = false; sessionStorage.setItem('music_playing', 'false'); }
  else { globalAudio.play().then(() => { isMusicPlaying = true; sessionStorage.setItem('music_playing', 'true'); updateMusicIcons(); }).catch(() => {}); isMusicPlaying = true; }
  updateMusicIcons();
}

function showMusicPrompt() {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, { position:'fixed', inset:'0', zIndex:'9999999', background:'rgba(8,8,16,0.8)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', opacity:'0', animation:'fadeIn 0.4s ease forwards' });
  overlay.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border);padding:2.5rem 2rem;border-radius:var(--radius-lg);text-align:center;max-width:400px;width:90%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);transform:translateY(20px);animation:slideUp 0.4s 0.1s ease forwards;opacity:0;">
      <div style="font-size:4rem;margin-bottom:1rem">🎧🧸</div>
      <h3 style="font-size:1.5rem;color:var(--text);margin-bottom:0.75rem;font-weight:800;">Trải nghiệm tuyệt vời hơn?</h3>
      <p style="color:var(--text2);line-height:1.6;margin-bottom:2rem;">Bạn có muốn bật một chút nhạc nền lofi chill chill không? ✨</p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button id="btn-music-yes" style="background:linear-gradient(135deg,var(--accent),var(--accent3));color:#fff;border:none;padding:12px;border-radius:100px;font-weight:600;font-size:1rem;cursor:pointer;">Có, bật nhạc nhé! 🎵</button>
        <button id="btn-music-no"  style="background:transparent;color:var(--text2);border:1px solid var(--border);padding:12px;border-radius:100px;font-weight:600;font-size:1rem;cursor:pointer;">Hãy để lần sau 🤫</button>
      </div>
      <style>@keyframes fadeIn{to{opacity:1}}@keyframes slideUp{to{opacity:1;transform:translateY(0)}}</style>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#btn-music-yes').addEventListener('click', () => { sessionStorage.setItem('nhamblog_music_prompted','true'); overlay.remove(); if (!isMusicPlaying) toggleMusic(); });
  overlay.querySelector('#btn-music-no').addEventListener('click',  () => { sessionStorage.setItem('nhamblog_music_prompted','true'); overlay.remove(); });
}

// ============ NAV SCROLL ============
function initNavScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ============ HAMBURGER ============
function initHamburger() {
  const btn   = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;
  btn.addEventListener('click', () => { const open = links.classList.toggle('open'); btn.setAttribute('aria-expanded', open); });
  links.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => links.classList.remove('open')));
  document.addEventListener('click', e => { if (!btn.contains(e.target) && !links.contains(e.target)) links.classList.remove('open'); });
}

// ============ SCROLL ANIMATIONS ============
function initScrollAnimations() {
  const els = document.querySelectorAll('.project-card, .post-item, .section-header, .hero-stats');
  if (!els.length) return;
  els.forEach((el, i) => { el.style.opacity = '0'; el.style.transform = 'translateY(22px)'; el.style.transition = `opacity 0.55s ease ${i * 0.04}s, transform 0.55s ease ${i * 0.04}s`; });
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.style.opacity = '1'; en.target.style.transform = 'none'; obs.unobserve(en.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}

// ============ ADMIN LINK ============
function initAdminLink() {
  if (sessionStorage.getItem('nhamblog_admin_auth') !== 'true') return;
  const navLinks = document.getElementById('navLinks');
  if (!navLinks || navLinks.querySelector('.nav-link-admin')) return;
  const a = document.createElement('a');
  a.href = '/admin/'; a.className = 'nav-link nav-link-admin'; a.textContent = '⚙ Admin';
  navLinks.appendChild(a);
}

// ============ PARTICLES ============
function initParticles() {
  const canvas = document.getElementById('particlesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });
  const particles = Array.from({ length: 50 }, () => ({ x: Math.random()*w, y: Math.random()*h, r: Math.random()*2+0.5, dx: (Math.random()-0.5)*0.5, dy: (Math.random()-0.5)*0.5, o: Math.random()*0.5+0.1 }));
  (function draw() {
    ctx.clearRect(0,0,w,h);
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    particles.forEach(p => { p.x+=p.dx; p.y+=p.dy; if(p.x<0||p.x>w)p.dx=-p.dx; if(p.y<0||p.y>h)p.dy=-p.dy; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=isLight?`rgba(91,79,220,${p.o})`:`rgba(255,255,255,${p.o})`; ctx.fill(); });
    requestAnimationFrame(draw);
  })();
}

// ============ TERMINAL HACKER MODE ============
function initTerminalMode() {
  const html = `<div id="hacker-terminal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:999999;font-family:monospace;color:#22c55e;padding:2rem;overflow-y:auto;backdrop-filter:blur(5px);">
    <div style="max-width:800px;margin:0 auto;">
      <h2 style="color:#22c55e;margin-bottom:1rem;font-size:1.5rem;text-shadow:0 0 10px #22c55e;">NHAM_OS v1.0 [Terminal Mode]</h2>
      <p style="color:#a3e635;margin-bottom:1.5rem;">Type 'help' to see commands. Press 'Esc' to close.</p>
      <div id="term-output" style="margin-bottom:1rem;line-height:1.6;white-space:pre-wrap;font-size:1.05rem;"></div>
      <div style="display:flex;align-items:center;font-size:1.1rem;margin-bottom:3rem;">
        <span style="color:#3b82f6;margin-right:0.75rem;font-weight:bold;">guest@nham-server:~$</span>
        <input type="text" id="term-input" style="background:transparent;border:none;color:#facc15;font-family:monospace;font-size:1.1rem;flex:1;outline:none;" autocomplete="off" spellcheck="false">
      </div>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  const terminal   = document.getElementById('hacker-terminal');
  const termInput  = document.getElementById('term-input');
  const termOutput = document.getElementById('term-output');
  const print = (text, color='#22c55e') => { termOutput.innerHTML += `<div style="color:${color};margin-bottom:0.5rem;">${text}</div>`; };
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === '\\') { e.preventDefault(); terminal.classList.toggle('hidden'); if (!terminal.classList.contains('hidden')) setTimeout(() => termInput.focus(), 100); }
    if (e.key === 'Escape' && !terminal.classList.contains('hidden')) terminal.classList.add('hidden');
  });
  termInput.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const cmd = termInput.value.trim().toLowerCase(); termInput.value = ''; if (!cmd) return;
    print(`> ${cmd}`, '#facc15');
    const cmds = { help: () => print('Commands: help | whoami | game | clear | exit'), whoami: () => print(`${PROFILE.name} — ${PROFILE.title}\n"Code with logic, design with magic."`), game: () => { print('Launching Flappy Bird...', '#3b82f6'); setTimeout(() => window.location.href='./flappy.html', 500); }, clear: () => { termOutput.innerHTML=''; }, exit: () => terminal.classList.add('hidden'), sudo: () => print('Access Denied ;)', '#ef4444') };
    (cmds[cmd] || (() => print(`Command not found: ${cmd}`, '#ef4444')))();
    terminal.scrollTop = terminal.scrollHeight;
  });
}

// ============ RENDER HELPERS ============
function buildPostItem(post) {
  const tagHTML  = (post.tags || []).map(t => `<span class="tag ${t}">${tagLabel(t)}</span>`).join('');
  const imageHTML = post.image ? `<div class="post-item-cover"><img src="${post.image}" alt="${post.title}" loading="lazy"/></div>` : '';
  return `<article class="post-item ${post.image ? 'has-cover' : ''}" role="article" tabindex="0" data-tags="${(post.tags||[]).join(',')}" onclick="window.location.href='./post.html?id=${post.id}'" onkeydown="if(event.key==='Enter')window.location.href='./post.html?id=${post.id}'">
    ${imageHTML}
    <div class="post-item-body">
      <div class="post-item-header"><h3 class="post-item-title">${post.title}</h3><time class="post-item-date" datetime="${post.date}">${formatDate(post.date)}</time></div>
      <p class="post-item-summary">${post.summary}</p>
      <div class="post-item-tags">${tagHTML}<span class="tag" style="color:var(--text3);background:none;border-color:transparent">⏱ ${post.readTime}</span></div>
    </div>
  </article>`;
}

function buildProjectCard(project) {
  const techHTML    = (project.techLabels || []).map(t => `<span class="tag">${t}</span>`).join('');
  const statusClass = project.status === 'completed' ? 'status-completed' : 'status-inprogress';
  const statusLabel = project.status === 'completed' ? '✓ Hoàn thành' : '⬡ Đang làm';
  const tech        = (project.tech || []).join(',');
  const githubBtn   = project.github ? `<a href="${project.github}" class="project-link-btn" target="_blank" rel="noopener" onclick="event.stopPropagation()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg></a>` : '';
  const playWebBtn  = project.id === 3 ? `<button class="project-link-btn" style="background:#fbbf24;color:#000;border:none;padding:4px 10px;font-weight:700;font-size:0.75rem;border-radius:100px;cursor:pointer;" onclick="event.stopPropagation();window.location.href='./flappy.html'">🎮 Chơi thử</button>` : '';
  const coverHTML   = project.image ? `<div class="project-card-cover"><img src="${project.image}" alt="${project.title}" loading="lazy"/></div>` : '';
  return `<div class="project-card ${project.image?'has-cover':''}" data-tech="${tech}">
    ${coverHTML}
    <div class="project-card-body">
      <div class="project-card-header"><span class="project-icon" role="img">${project.icon}</span><div class="project-links">${playWebBtn}${githubBtn}</div></div>
      <h3 class="project-title">${project.title}</h3>
      <p class="project-desc">${project.description}</p>
      <div class="project-tech-stack">${techHTML}</div>
      <span class="project-status ${statusClass}">${statusLabel}</span>
    </div>
  </div>`;
}

function tagLabel(t) { return { flutter:'Flutter','react-native':'React Native',kotlin:'Kotlin',swift:'Swift',dart:'Dart',tips:'Tips & Tricks' }[t] || t; }

// ============ PROFILE UI ============
function updateProfileUI() {
  if (!PROFILE) return;

  // Homepage
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) { const lastName = PROFILE.name.split(' ').pop(); heroTitle.innerHTML = `👋 Xin chào, tôi là <span class="highlight">${lastName}</span>`; }
  const heroSub = document.querySelector('.hero-subtitle'); if (heroSub) heroSub.textContent = PROFILE.hero;
  const heroDesc = document.querySelector('.hero-desc');    if (heroDesc) heroDesc.textContent = PROFILE.bio;

  // About page
  const nameEl   = document.querySelector('.about-name');  if (nameEl)  nameEl.textContent  = PROFILE.name;
  const roleEl   = document.querySelector('.about-role');  if (roleEl)  roleEl.textContent  = PROFILE.title;
  const statusSp = document.querySelectorAll('.avatar-status span'); if (statusSp.length > 1) statusSp[1].textContent = PROFILE.status;
  const phoneEl  = document.getElementById('about-phone');    if (phoneEl)    { phoneEl.textContent    = PROFILE.phone;    phoneEl.href    = `tel:${PROFILE.phone}`; }
  const emailEl  = document.getElementById('about-email');    if (emailEl)    { emailEl.textContent    = PROFILE.email;    emailEl.href    = `mailto:${PROFILE.email}`; }
  const locEl    = document.getElementById('about-location'); if (locEl)      locEl.textContent      = PROFILE.location;
  const ghText   = document.getElementById('about-github-text'); if (ghText) { ghText.textContent = PROFILE.github.replace(/^https?:\/\//, ''); ghText.href = PROFILE.github; }
  const bioEl    = document.querySelector('.about-bio');      if (bioEl)      bioEl.innerHTML        = `<p>${PROFILE.bio}</p>`;
  const ghBtn    = document.getElementById('about-github');   if (ghBtn)      ghBtn.href             = PROFILE.github;

  // Avatar
  const avatarSrc = PROFILE.avatarUrl || PROFILE.avatar || null;
  const avatarImg = document.getElementById('about-avatar-image');
  const avatarIni = document.getElementById('about-avatar-initials');
  if (avatarSrc) {
    if (avatarImg) { avatarImg.src = avatarSrc; avatarImg.style.display = 'block'; }
    if (avatarIni) avatarIni.style.display = 'none';
  } else {
    if (avatarImg) avatarImg.style.display = 'none';
    if (avatarIni) { const ini = PROFILE.name ? PROFILE.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'NH'; avatarIni.textContent = ini; avatarIni.style.display = 'flex'; }
  }

  // CV viewer
  initCvViewerModal();
}

// ============ CV VIEWER MODAL ============
function initCvViewerModal() {
  const cvLinks = document.querySelectorAll('#nav-cv-link');
  if (!cvLinks.length) return;

  let cvModal = document.getElementById('cv-viewer-modal');
  let currentBlobUrl = null;

  if (!cvModal) {
    cvModal = document.createElement('div');
    cvModal.id = 'cv-viewer-modal';
    cvModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:none;align-items:center;justify-content:center;backdrop-filter:blur(5px);';
    cvModal.innerHTML = `
      <div style="width:100vw;height:100vh;background:var(--card);display:flex;flex-direction:column;overflow:hidden;">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--bg);border-bottom:1px solid var(--border);gap:10px;">
          <h3 style="margin:0;font-size:clamp(0.9rem,4vw,1.1rem);color:var(--text);display:flex;align-items:center;gap:6px;font-weight:600;">
            <svg style="flex-shrink:0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Hồ sơ năng lực (CV)
          </h3>
          <div style="display:flex;gap:8px;align-items:center;">
            <a id="cv-download-btn" href="#" download="CV.pdf" style="display:flex;align-items:center;padding:6px 12px;border-radius:6px;background:var(--accent-dim);color:var(--accent2);text-decoration:none;font-size:0.85rem;font-weight:600;transition:transform 0.2s;">Tải về PDF</a>
            <button id="cv-close-btn" style="background:transparent;border:none;color:var(--text2);cursor:pointer;padding:4px;display:flex;align-items:center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div style="flex:1;background:#e5e7eb;position:relative;">
          <iframe id="cv-iframe" style="width:100%;height:100%;border:none;" src=""></iframe>
        </div>
      </div>`;
    document.body.appendChild(cvModal);

    const closeCV = () => {
      document.getElementById('cv-iframe').src = '';
      if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }
      cvModal.style.display = 'none';
    };
    document.getElementById('cv-close-btn').addEventListener('click', closeCV);
    cvModal.addEventListener('click', e => { if (e.target === cvModal) closeCV(); });
  }

  const openCV = async () => {
    // Use cvUrl from profile — backend stores as relative path like /uploads/cv/cv-xxx.pdf
    const cvUrl  = PROFILE.cvUrl  || null;

    if (!cvUrl) { alert('Chưa có CV nào được cập nhật! Vui lòng quay lại sau.'); return; }

    if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }

    // Build absolute URL if relative
    const iframeSrc = cvUrl.startsWith('http') ? cvUrl : cvUrl;

    document.getElementById('cv-iframe').src = iframeSrc;
    const dlBtn = document.getElementById('cv-download-btn');
    dlBtn.href     = iframeSrc;
    dlBtn.download = `CV_${(PROFILE.name||'Profile').replace(/\s+/g,'_')}.pdf`;
    cvModal.style.display = 'flex';
  };

  cvLinks.forEach(link => link.addEventListener('click', e => { e.preventDefault(); openCV(); }));
}

// ============ HOMEPAGE RENDER ============
function initHomepage() {
  const postList      = document.getElementById('postList');
  const projectsGrid  = document.getElementById('featuredProjectsGrid');
  if (postList)     postList.innerHTML     = POSTS.slice(0, 5).map(p => buildPostItem(p)).join('');
  if (projectsGrid) projectsGrid.innerHTML = PROJECTS.filter(p => p.featured).map(p => buildProjectCard(p)).join('');
}

// ============ MAINTENANCE CHECK ============
function checkMaintenance() {
  if (!SETTINGS.maintenance) return false;
  document.body.innerHTML = `
    <div style="position:fixed;inset:0;background:#080810;color:#fff;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;z-index:999999;flex-direction:column;text-align:center;padding:2rem;">
      <div style="font-size:5rem;margin-bottom:10px;animation:wobble 2s infinite">🛠️🦦</div>
      <h1 style="font-size:3rem;margin-bottom:1rem;background:linear-gradient(135deg,#6366f1,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900">Dev đang đi uống trà đá!</h1>
      <p style="font-size:1.15rem;color:#8888bb;max-width:550px;line-height:1.7;">Trang web bị đóng băng tạm thời để admin lau dọn server. Hẹn bạn quay lại sau! 🧋</p>
      <div style="margin-top:2rem;width:40px;height:40px;border:4px solid rgba(99,102,241,0.2);border-top:4px solid #6366f1;border-radius:50%;animation:spin 1s linear infinite"></div>
      <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes wobble{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}</style>
      <a href="/admin/login.html" style="position:absolute;bottom:20px;color:#44445a;text-decoration:none;font-size:0.8rem;">Admin Login</a>
    </div>`;
  return true;
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Set theme immediately (in case inline script wasn't there)
  initTheme();

  // 2. Load data from Firebase/localStorage
  await loadPublicData();

  // 3. Check maintenance
  if (checkMaintenance()) return;

  // 4. Init UI
  initNavScroll();
  initHamburger();
  initHomepage();
  updateProfileUI();
  initAdminLink();
  initTerminalMode();
  initParticles();
  await initMusicPlayer();

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  requestAnimationFrame(() => setTimeout(initScrollAnimations, 100));
});

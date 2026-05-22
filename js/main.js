// =============================================
// main.js — Shared utilities for public pages
// Theme, Nav, Music, Render helpers, Profile UI, CV viewer
// =============================================

// ============ THEME (no-flicker already set by inline script in <head>) ============
function initTheme() {
  const saved       = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme       = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcons();
}

function updateThemeIcons() {
  // CSS handles the animation and visibility based on data-theme attribute
  document.querySelectorAll('.icon-moon, .icon-sun').forEach(el => el.style.display = '');
}

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcons();
}

// Sync theme change across open tabs
window.addEventListener('storage', e => {
  if (e.key === 'theme' && e.newValue) {
    document.documentElement.setAttribute('data-theme', e.newValue);
    updateThemeIcons();
  }
});

// ============ BACKGROUND MUSIC ============
let globalAudio    = null;
let isMusicPlaying = false;
let maintenanceActive = false;
let publicDataSyncStarted = false;
let publicDataRefreshInFlight = null;

async function initMusicPlayer() {
  try {
    // Load settings from API
    const settingsData = SETTINGS || await apiGetSettings().catch(() => null);

    // Backend stores music URL as 'musicUrl' (relative path like /uploads/music-xxx.mp3)
    const musicUrl  = settingsData?.musicUrl  || null;
    const musicSrc  = resolveAssetUrl(musicUrl);

    if (!musicSrc) return;

    if (window.__bgAudioInstance) { window.__bgAudioInstance.pause(); window.__bgAudioInstance.src = ''; }
    globalAudio       = new Audio(musicSrc);
    globalAudio.loop  = true;
    globalAudio.volume = 0.5;
    window.__bgAudioInstance = globalAudio;

    const musicBox = document.getElementById('musicToggle');
    if (musicBox) {
      musicBox.removeEventListener('click', toggleMusic);
      musicBox.addEventListener('click', toggleMusic);
    }

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
  const musicBox = document.getElementById('musicToggle');
  if (musicBox) {
    musicBox.classList.toggle('playing', isMusicPlaying);
    const infoP = musicBox.querySelector('.music-info p');
    if (infoP) infoP.textContent = isMusicPlaying ? 'Đang phát...' : 'Nhấp để phát';
  }
}

function toggleMusic() {
  if (!globalAudio) return;
  if (isMusicPlaying) { globalAudio.pause(); isMusicPlaying = false; sessionStorage.setItem('music_playing', 'false'); }
  else { globalAudio.play().then(() => { isMusicPlaying = true; sessionStorage.setItem('music_playing', 'true'); updateMusicIcons(); }).catch(() => {}); isMusicPlaying = true; }
  updateMusicIcons();
}

function showMusicPrompt() {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, { position:'fixed', inset:'0', zIndex:'9999999', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.25s ease forwards' });
  overlay.innerHTML = `
    <div style="background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:2.25rem 2rem;text-align:center;max-width:360px;width:90%;position:relative;animation:slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;">
      <div style="position:absolute;top:0;left:15%;right:15%;height:1px;background:linear-gradient(90deg,transparent,#e8ff8b,transparent);border-radius:0 0 100px 100px;"></div>
      <div style="font-size:2.5rem;margin-bottom:1rem">🎧</div>
      <h3 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.25rem;color:#f5f5f5;margin-bottom:0.5rem;font-weight:800;letter-spacing:-0.03em;">Bật nhạc nền không?</h3>
      <p style="color:#737373;line-height:1.65;margin-bottom:1.75rem;font-size:0.85rem;">Lofi chill chill để coding thêm phê hơn ✨</p>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button id="btn-music-yes" style="background:#e8ff8b;color:#0a0a0a;border:none;padding:11px;border-radius:8px;font-weight:700;font-size:0.9rem;cursor:pointer;transition:all 0.15s;font-family:'Plus Jakarta Sans',sans-serif;">Có, bật nhạc nhé! 🎵</button>
        <button id="btn-music-no" style="background:transparent;color:#737373;border:1px solid rgba(255,255,255,0.08);padding:11px;border-radius:8px;font-weight:500;font-size:0.85rem;cursor:pointer;font-family:'JetBrains Mono',monospace;">Thôi lần sau vậy</button>
      </div>
      <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}</style>
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

function initActiveNav() {
  const current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-item').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop().toLowerCase() || 'index.html';
    const isPost = current === 'post.html' && href === 'blog.html';
    link.classList.toggle('active', href === current || isPost);
  });
}

function initBackToTop() {
  let btn = document.getElementById('backToTop');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'backToTop';
    btn.className = 'back-to-top';
    btn.type = 'button';
    btn.title = 'Lên đầu trang';
    btn.setAttribute('aria-label', 'Lên đầu trang');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(btn);
  }

  const sync = () => btn.classList.toggle('visible', window.scrollY > 520);
  if (!window.__backToTopBound) {
    window.__backToTopBound = true;
    window.addEventListener('scroll', sync, { passive: true });
  }
  sync();
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
  const selector = [
    '.glass-panel',
    '.page-header',
    '.filter-bar',
    '.blog-search-wrap',
    '.blog-card',
    '.app-item',
    '.mini-post-row',
    '.mini-app-item',
    '.comment-form-wrap',
    '.comment-item-card',
    '.about-sidebar',
    '.about-content'
  ].join(',');
  const els = document.querySelectorAll(selector);
  if (!els.length) return;

  els.forEach((el, i) => {
    el.classList.add('scroll-reveal');
    el.style.setProperty('--reveal-delay', `${Math.min(i, 10) * 45}ms`);
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-visible');
      obs.unobserve(en.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -64px 0px' });

  els.forEach(el => {
    if (!el.classList.contains('is-visible')) obs.observe(el);
  });

  initKineticScrollEffects();
}

function initKineticScrollEffects() {
  const root = document.documentElement;
  const lightMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(max-width: 900px)').matches;

  const update = () => {
    const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    root.style.setProperty('--page-scroll-progress', progress.toFixed(4));
    if (lightMotion) return;

    document.querySelectorAll('.glass-panel.is-visible, .blog-card.is-visible, .app-item.is-visible').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -80 || rect.top > window.innerHeight + 80) return;

      const centerOffset = ((rect.top + rect.height / 2) - window.innerHeight / 2) / window.innerHeight;
      const lift = Math.max(-18, Math.min(18, centerOffset * -16));
      const tilt = Math.max(-1.4, Math.min(1.4, centerOffset * -1.2));
      el.style.setProperty('--scroll-shift', `${lift.toFixed(2)}px`);
      el.style.setProperty('--scroll-tilt', `${tilt.toFixed(2)}deg`);
    });
  };

  if (window.__kineticScrollBound) {
    update();
    return;
  }

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  };

  window.__kineticScrollBound = true;
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  requestUpdate();
}

// ============ SECRET ADMIN LOGIN MODAL ============
function initAdminLink() {
  // --- Build modal HTML (once) ---
  if (!document.getElementById('secretAdminModal')) {
    const modal = document.createElement('div');
    modal.id = 'secretAdminModal';
    modal.innerHTML = `
      <div class="sam-overlay" id="samOverlay"></div>
      <div class="sam-box" id="samBox">
        <div class="sam-icon">🔐</div>
        <h2 class="sam-title">Đăng nhập quản trị</h2>
        <p class="sam-sub">Chỉ dành cho admin của trang</p>
        <form class="sam-form" id="samForm" autocomplete="off">
          <div class="sam-field">
            <label class="sam-label">Tài khoản</label>
            <input id="samUser" type="text" class="sam-input" placeholder="Nhập username..." autocomplete="off"/>
          </div>
          <div class="sam-field">
            <label class="sam-label">Mật khẩu</label>
            <div class="sam-pw-wrap">
              <input id="samPass" type="password" class="sam-input" placeholder="Nhập mật khẩu..." autocomplete="off"/>
              <button type="button" class="sam-eye" id="samEye" tabindex="-1">
                <svg id="samEyeIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <div class="sam-error hidden" id="samError"></div>
          <button type="submit" class="sam-btn" id="samSubmit">
            <span id="samBtnText">Đăng nhập</span>
            <span id="samBtnLoader" class="hidden">⏳</span>
          </button>
        </form>
        <button class="sam-close" id="samClose" aria-label="Đóng">✕</button>
      </div>`;
    document.body.appendChild(modal);

    // --- Toggle password visibility ---
    const samEye  = document.getElementById('samEye');
    const samPass = document.getElementById('samPass');
    samEye.addEventListener('click', () => {
      const show = samPass.type === 'password';
      samPass.type = show ? 'text' : 'password';
      samEye.querySelector('svg').style.opacity = show ? '1' : '0.4';
    });

    // --- Close modal ---
    const closeModal = () => {
      modal.classList.remove('sam-visible');
      document.getElementById('samUser').value = '';
      document.getElementById('samPass').value = '';
      document.getElementById('samError').classList.add('hidden');
    };
    document.getElementById('samClose').addEventListener('click', closeModal);
    document.getElementById('samOverlay').addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // --- Login form submit ---
    document.getElementById('samForm').addEventListener('submit', async e => {
      e.preventDefault();
      const username = document.getElementById('samUser').value.trim();
      const password = document.getElementById('samPass').value;
      const errEl    = document.getElementById('samError');
      const btnText  = document.getElementById('samBtnText');
      const btnLoad  = document.getElementById('samBtnLoader');
      const submitBtn = document.getElementById('samSubmit');

      errEl.classList.add('hidden');
      btnText.classList.add('hidden'); btnLoad.classList.remove('hidden');
      submitBtn.disabled = true;

      try {
        const res  = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem('nhamblog_jwt_token', data.token);
          // Small success animation
          document.getElementById('samBox').style.transform = 'scale(0.96)';
          setTimeout(() => { window.location.href = '/admin/'; }, 350);
        } else {
          errEl.textContent = data.error || 'Tài khoản hoặc mật khẩu không đúng.';
          errEl.classList.remove('hidden');
          document.getElementById('samBox').classList.add('sam-shake');
          setTimeout(() => document.getElementById('samBox').classList.remove('sam-shake'), 500);
        }
      } catch (err) {
        errEl.textContent = 'Không kết nối được server. Thử lại sau.';
        errEl.classList.remove('hidden');
      } finally {
        btnText.classList.remove('hidden'); btnLoad.classList.add('hidden');
        submitBtn.disabled = false;
      }
    });
  }

  // --- Logo click: KHÔNG navigate, 1 click → mở modal admin ---
  const logo = document.getElementById('navLogo');
  if (logo && !logo.dataset.adminBound) {
    logo.dataset.adminBound = '1';
    let clickCount = 0;
    let clickTimer = null;
    logo.addEventListener('click', e => {
      e.preventDefault(); // Luôn chặn navigate
      clickCount++;
      clearTimeout(clickTimer);
      if (clickCount >= 3) {
        // Đủ 3 lần → mở modal admin
        clickCount = 0;
        document.getElementById('secretAdminModal').classList.add('sam-visible');
        setTimeout(() => document.getElementById('samUser').focus(), 250);
      } else {
        // Chưa đủ → reset sau 1.5s
        clickTimer = setTimeout(() => { clickCount = 0; }, 1500);
      }
    });
  }
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
  // Tag colors
  const tagClass = { flutter:'flutter', 'react-native':'react-native', kotlin:'kotlin', swift:'swift', tips:'tips' };
  const tagsHtml = (post.tags||[]).map(t => `<span class="blog-tag ${tagClass[t]||'default'}">${tagLabel(t)}</span>`).join('');

  // Thumbnail
  const imgSrc = resolveAssetUrl(post.imageUrl || post.image || null);
  const thumbHtml = imgSrc
    ? `<div class="blog-card-thumb"><img src="${imgSrc}" alt="${post.title}" loading="lazy"/></div>`
    : `<div class="blog-card-thumb"><div class="blog-card-thumb-placeholder">${getPostEmoji(post.tags)}</div></div>`;

  const dateStr = (post.date||'').substring(0,10).replace(/-/g,'/');
  const likes    = post.likes    || 0;
  const comments = (post.comments||[]).length;
  const readTime = post.readTime || '5 phút đọc';

  return `
  <a class="blog-card" href="./post.html?id=${post.id}" data-tags="${(post.tags||[]).join(',')}">
    ${thumbHtml}
    <div class="blog-card-body">
      <div class="blog-card-tags">${tagsHtml}</div>
      <div class="blog-card-title">${post.title}</div>
      <div class="blog-card-summary">${post.summary || ''}</div>
      <div class="blog-card-footer">
        <span class="blog-card-date">📅 ${dateStr}</span>
        <div class="blog-card-stats">
          <span class="blog-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            ${likes}
          </span>
          <span class="blog-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            ${comments}
          </span>
          <span class="blog-stat" style="color:var(--text-muted);">⏱ ${readTime}</span>
        </div>
      </div>
    </div>
  </a>`;
}

// Pick an emoji based on the post's tags
function getPostEmoji(tags) {
  const map = { flutter:'📱', 'react-native':'⚛️', kotlin:'🤖', swift:'🍎', tips:'💡', dart:'🎯' };
  for (const t of (tags||[])) { if (map[t]) return map[t]; }
  return '📝';
}

function buildProjectCard(project) {
  const coverHTML = project.image ? `<img src="${project.image}" alt="${project.title}" loading="lazy"/>` : `<span>${project.icon}</span>`;
  const techLabel = project.techLabels && project.techLabels.length > 0 ? project.techLabels[0] : '';
  
  let onclick = '';
  if (project.id === 3) onclick = `onclick="window.location.href='./flappy.html'"`;
  else if (project.github) onclick = `onclick="window.open('${project.github}', '_blank')"`

  return `
  <div class="app-item" ${onclick}>
    <div class="app-icon-wrapper">${coverHTML}</div>
    <div class="app-info">
      <div class="app-name">${project.title}</div>
      <div class="app-tech">${techLabel}</div>
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
  const avatarSrc = resolveAssetUrl(PROFILE.avatarUrl || PROFILE.avatar || null);
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
    const iframeSrc = resolveAssetUrl(cvUrl);

    document.getElementById('cv-iframe').src = iframeSrc;
    const dlBtn = document.getElementById('cv-download-btn');
    dlBtn.href     = iframeSrc;
    dlBtn.download = `CV_${(PROFILE.name||'Profile').replace(/\s+/g,'_')}.pdf`;
    cvModal.style.display = 'flex';
  };

  cvLinks.forEach(link => {
    if (link.dataset.cvBound === '1') return;
    link.dataset.cvBound = '1';
    link.addEventListener('click', e => { e.preventDefault(); openCV(); });
  });
}

// ============ HOMEPAGE RENDER ============
function buildMiniPostRow(post) {
  return `<a class="mini-post-row" href="./post.html?id=${post.id}">
    <span class="mini-post-date">${post.date.substring(0,10).replace(/-/g,'/')}</span>
    <span class="mini-post-title">${post.title}</span>
    <span class="mini-post-arrow">→</span>
  </a>`;
}

function buildMiniProjectCard(project) {
  const projectImage = resolveAssetUrl(project.imageUrl || project.image || null);
  const icon = projectImage
    ? `<img src="${projectImage}" alt="${project.title}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">`
    : `<span>${project.icon || '📱'}</span>`;
  const tech = project.techLabels && project.techLabels.length > 0 ? project.techLabels[0] : '';
  let onclick = '';
  if (project.id === 3) onclick = `onclick="window.location.href='./flappy.html'"`;
  else if (project.github) onclick = `onclick="window.open('${project.github}','_blank')"`;
  return `<div class="mini-app-item" ${onclick}>
    <div class="mini-app-icon">${icon}</div>
    <div class="mini-app-name">${project.title}</div>
    <div class="mini-app-tech">${tech}</div>
  </div>`;
}

function initHomepage() {
  const postList = document.getElementById('postList');
  const projectsGrid = document.getElementById('featuredProjectsGrid');
  if (postList) {
    const posts = POSTS.slice(0, 4);
    postList.innerHTML = posts.length ? posts.map(p => buildMiniPostRow(p)).join('') : '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:1rem;">Chưa có bài viết nào.</p>';
  }
  if (projectsGrid) {
    const featured = PROJECTS.filter(p => p.featured);
    const items = featured.length ? featured : PROJECTS.slice(0, 4);
    projectsGrid.innerHTML = items.length ? items.map(p => buildMiniProjectCard(p)).join('') : '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:1rem;grid-column:1/-1;">Chưa có dự án nào.</p>';
  }
}

// ============ LIVE PUBLIC DATA SYNC ============
async function refreshPublicData(reason = 'poll') {
  if (publicDataRefreshInFlight) return publicDataRefreshInFlight;

  publicDataRefreshInFlight = (async () => {
    await loadPublicData();

    if (checkMaintenance()) return;

    updateProfileUI();
    initHomepage();

    if (typeof renderBlogPosts === 'function' && document.getElementById('blogPostList')) {
      renderBlogPosts();
    }
    if (typeof renderProjectsPage === 'function' && document.getElementById('projectsGrid')) {
      renderProjectsPage();
    }

    window.dispatchEvent(new CustomEvent('nhamblog:data-updated', { detail: { reason } }));
  })().catch(err => {
    console.warn('Public data refresh failed:', err);
  }).finally(() => {
    publicDataRefreshInFlight = null;
  });

  return publicDataRefreshInFlight;
}

function startPublicDataSync() {
  if (publicDataSyncStarted) return;
  publicDataSyncStarted = true;

  window.addEventListener('focus', () => refreshPublicData('focus'));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshPublicData('visible');
  });
  window.addEventListener('storage', e => {
    if (e.key === 'nhamblog_public_data_changed') refreshPublicData('admin-change');
  });

  setInterval(() => {
    if (!document.hidden) refreshPublicData('interval');
  }, 12000);
}

// ============ MAINTENANCE CHECK ============
function checkMaintenance() {
  if (!SETTINGS.maintenance) {
    if (maintenanceActive) window.location.reload();
    return false;
  }
  if (maintenanceActive) return true;
  maintenanceActive = true;
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
  startPublicDataSync();

  // 3. Check maintenance
  if (checkMaintenance()) return;

  // 4. Init UI
  initNavScroll();
  initActiveNav();
  initHamburger();
  initHomepage();
  updateProfileUI();
  initAdminLink();
  initTerminalMode();
  initParticles();
  initBackToTop();
  await initMusicPlayer();

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  initPJAX();

  requestAnimationFrame(() => setTimeout(initScrollAnimations, 100));
});

// ============ SPA NAVIGATION (PJAX) ============
function initPJAX() {
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    
    const url = new URL(link.href, window.location.origin);
    // Only intercept internal navigation
    if (url.origin !== window.location.origin) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    // Ignore admin and game links
    if (url.pathname.startsWith('/admin') || url.pathname.includes('flappy.html')) return;
    // post.html needs full page load (scripts won't execute via PJAX)
    if (url.pathname.includes('post.html')) return;
    // Ignore hash links on the same page
    if (url.pathname === window.location.pathname && url.hash) return;
    // Ignore API calls or uploads
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return;

    e.preventDefault();
    const targetPath = url.pathname + url.search;
    
    if (targetPath === window.location.pathname + window.location.search) {
      if (url.hash) window.location.hash = url.hash;
      return;
    }

    try {
      document.body.style.transition = 'opacity 0.2s';
      document.body.style.opacity = '0.7';

      const res = await fetch(targetPath);
      const htmlText = await res.text();
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');

      document.title = doc.title;

      const oldTopbar = document.querySelector('.topbar-wrapper');
      const newTopbar = doc.querySelector('.topbar-wrapper');
      if (oldTopbar && newTopbar) oldTopbar.innerHTML = newTopbar.innerHTML;

      const oldContainer = document.querySelector('.container');
      const newContainer = doc.querySelector('.container');
      if (oldContainer && newContainer) {
        oldContainer.innerHTML = newContainer.innerHTML;
        oldContainer.className = newContainer.className;
      }

      window.history.pushState({}, '', targetPath);
      window.scrollTo(0, 0);

      reinitPage(targetPath);
      
    } catch (err) {
      console.error('PJAX error:', err);
      window.location.href = targetPath; // Fallback
    } finally {
      document.body.style.opacity = '1';
    }
  });

  window.addEventListener('popstate', async () => {
    const targetPath = window.location.pathname + window.location.search;
    // post.html needs full page load
    if (targetPath.includes('post.html')) {
      window.location.reload();
      return;
    }
    try {
      document.body.style.opacity = '0.7';
      const res = await fetch(targetPath);
      const htmlText = await res.text();
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');

      document.title = doc.title;
      
      const oldTopbar = document.querySelector('.topbar-wrapper');
      const newTopbar = doc.querySelector('.topbar-wrapper');
      if (oldTopbar && newTopbar) oldTopbar.innerHTML = newTopbar.innerHTML;

      const oldContainer = document.querySelector('.container');
      const newContainer = doc.querySelector('.container');
      if (oldContainer && newContainer) {
        oldContainer.innerHTML = newContainer.innerHTML;
        oldContainer.className = newContainer.className;
      }
      
      reinitPage(targetPath);
    } catch (err) {
      window.location.reload();
    } finally {
      document.body.style.opacity = '1';
    }
  });
}


function reinitPage(path) {
  // Common
  updateProfileUI();
  initTheme();
  initActiveNav();
  initBackToTop();
  initScrollAnimations();
  
  // Re-bind music toggle because the DOM was replaced!
  const musicBox = document.getElementById('musicToggle');
  if (musicBox) {
    musicBox.removeEventListener('click', toggleMusic);
    musicBox.addEventListener('click', toggleMusic);
    updateMusicIcons();
  }

  // Re-bind theme toggle!
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.removeEventListener('click', toggleTheme);
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Page Specific
  if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
    initHomepage();
    initAdminLink(); 
    if (!document.getElementById('hacker-terminal')) initTerminalMode();
  } else if (path.includes('projects.html')) {
    if (typeof window.setupProjectsPage === 'function') {
      window.setupProjectsPage();
    } else {
      loadScript('./js/projects.js').then(() => { if(window.setupProjectsPage) window.setupProjectsPage(); });
    }
  } else if (path.includes('blog.html')) {
    if (typeof window.setupBlogPage === 'function') {
      window.setupBlogPage();
    } else {
      loadScript('./js/blog.js').then(() => { if(window.setupBlogPage) window.setupBlogPage(); });
    }
  } else if (path.includes('post.html')) {
    if (typeof window.setupPostPage === 'function') {
      window.setupPostPage();
    } else {
      loadScript('./js/post.js').then(() => { if(window.setupPostPage) window.setupPostPage(); });
    }
  }
}

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

// ============ NAV ALWAYS ON TOP ============
// Di chuyển topbar xuống cuối DOM — element cuối trong stacking context
// luôn paint trên cùng, bất kể backdrop-filter hay filter animation của glass panels
function pinNavOnTop() {
  const topbar = document.querySelector('.topbar-wrapper');
  if (!topbar) return;
  // Move to end of body so it's painted LAST (always on top in same stacking context)
  document.body.appendChild(topbar);
  // Nuclear z-index
  topbar.style.zIndex = '2147483647';
}

// Run immediately + after any dynamic content loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', pinNavOnTop);
} else {
  pinNavOnTop();
}

// =============================================
// bg-canvas.js - Scroll-reactive galaxy backdrop
// Stars, aurora ribbons, scroll warp, mouse gravity
// =============================================

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  canvas.id = 'bgCanvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: '-1',
    pointerEvents: 'none',
    display: 'block'
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  const mouse = { x: -9999, y: -9999 };
  const scroll = {
    y: window.scrollY || 0,
    easedY: window.scrollY || 0,
    velocity: 0,
    targetVelocity: 0,
    progress: 0,
    dir: 1,
    flash: 0,
    lastTime: performance.now(),
    lastRipple: 0
  };

  let W = 0;
  let H = 0;
  let dpr = 1;
  let stars = [];
  let shooters = [];
  let ripples = [];
  let frameCount = 0;
  let isLight = false;

  const STAR_COUNT = reduceMotion ? 150 : 340;
  const MAX_SHOOTERS = reduceMotion ? 1 : 3;
  const TWINKLE_SPEED = reduceMotion ? 0.006 : 0.012;

  const NEBULAE = [
    { x: 0.15, y: 0.18, r: 0.34, h: 202, s: 82, l: 48, a: 0.2, drift: 0.55 },
    { x: 0.78, y: 0.34, r: 0.3, h: 266, s: 76, l: 54, a: 0.17, drift: 0.75 },
    { x: 0.48, y: 0.82, r: 0.28, h: 168, s: 70, l: 43, a: 0.13, drift: 0.45 },
    { x: 0.9, y: 0.8, r: 0.2, h: 318, s: 66, l: 48, a: 0.1, drift: 0.9 }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function wrap(value, size) {
    return ((value % size) + size) % size;
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initStars();
    updateScrollState(true);
  }

  function initStars() {
    stars = Array.from({ length: STAR_COUNT }, () => createStar());
  }

  function createStar() {
    const depth = 0.25 + Math.random() * 1.75;
    const sizeSeed = Math.random();
    return {
      baseX: Math.random() * W,
      baseY: Math.random() * H,
      offsetX: 0,
      offsetY: 0,
      vx: 0,
      vy: 0,
      depth,
      size: 0.35 + sizeSeed * 1.9 * depth,
      baseAlpha: 0.25 + Math.random() * 0.75,
      alpha: 0,
      phase: Math.random() * Math.PI * 2,
      speed: TWINKLE_SPEED * (0.45 + Math.random()),
      drift: 8 + Math.random() * 24,
      hue: [0, 32, 190, 210, 238, 276][Math.floor(Math.random() * 6)],
      sat: Math.random() < 0.5 ? 0 : 48 + Math.random() * 32
    };
  }

  function updateScrollState(force) {
    const now = performance.now();
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const dy = force ? 0 : y - scroll.y;
    const dt = Math.max(16, now - scroll.lastTime);
    const velocity = (dy / dt) * 16.67;

    scroll.y = y;
    scroll.lastTime = now;
    scroll.dir = dy >= 0 ? 1 : -1;
    scroll.progress = clamp(y / maxScroll, 0, 1);

    if (!force) {
      scroll.targetVelocity = clamp(velocity * 1.8, -54, 54);
      scroll.flash = clamp(scroll.flash + Math.min(Math.abs(dy) / 700, 0.45), 0, 1);

      if (!reduceMotion && Math.abs(dy) > 42 && now - scroll.lastRipple > 140) {
        scroll.lastRipple = now;
        ripples.push({
          x: mouse.x > 0 && mouse.x < W ? mouse.x : W * (0.34 + Math.random() * 0.32),
          y: H * (0.24 + scroll.progress * 0.52),
          r: 12,
          alpha: 0.22,
          hue: scroll.dir > 0 ? 198 : 268
        });
        if (ripples.length > 5) ripples.shift();
      }
    }
  }

  function drawBackdrop() {
    ctx.clearRect(0, 0, W, H);

    if (isLight) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, 'rgba(255,255,255,0.0)');
      g.addColorStop(0.48, `rgba(125, 92, 255, ${0.05 + scroll.flash * 0.04})`);
      g.addColorStop(1, 'rgba(56, 189, 248, 0.07)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      return;
    }

    const shift = scroll.progress * 16;
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, `hsl(${226 + shift} 64% 4%)`);
    bg.addColorStop(0.55, `hsl(${236 + shift} 58% ${5 + scroll.flash * 2}%)`);
    bg.addColorStop(1, `hsl(${258 + shift} 62% 7%)`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  function drawNebulae() {
    ctx.save();
    ctx.globalCompositeOperation = isLight ? 'multiply' : 'screen';

    NEBULAE.forEach((n, i) => {
      const pulse = Math.sin(frameCount * 0.006 + i * 1.7) * 0.5 + 0.5;
      const speedPush = clamp(Math.abs(scroll.velocity) / 42, 0, 1);
      const x = n.x * W + Math.sin(scroll.easedY * 0.0014 * n.drift + i) * 54 * n.drift;
      const y = n.y * H + Math.cos(scroll.easedY * 0.001 * n.drift + i) * 46 * n.drift;
      const radius = n.r * Math.min(W, H) * (1 + pulse * 0.08 + speedPush * 0.12);
      const hue = n.h + scroll.progress * 42 + speedPush * 18;
      const alpha = n.a + scroll.flash * 0.08;
      const lightBoost = isLight ? 0.42 : 1;

      const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grd.addColorStop(0, `hsla(${hue}, ${n.s}%, ${isLight ? 64 : n.l}%, ${alpha * lightBoost})`);
      grd.addColorStop(0.48, `hsla(${hue + 18}, ${n.s}%, ${isLight ? 72 : n.l * 0.72}%, ${alpha * 0.45 * lightBoost})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    });

    ctx.restore();
  }

  function drawAuroraRibbon() {
    if (reduceMotion) return;

    const speed = clamp(Math.abs(scroll.velocity) / 44, 0, 1);
    const centerY = H * (0.18 + scroll.progress * 0.62);
    const wave = 24 + speed * 42;
    const hueA = isLight ? 196 : 188;
    const hueB = isLight ? 268 : 252;

    ctx.save();
    ctx.globalCompositeOperation = isLight ? 'multiply' : 'screen';
    ctx.lineCap = 'round';

    for (let band = 0; band < 3; band++) {
      const offset = (band - 1) * (16 + speed * 8);
      const alpha = (isLight ? 0.08 : 0.16) + speed * (isLight ? 0.05 : 0.12);
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, `hsla(${hueA}, 92%, ${isLight ? 46 : 64}%, 0)`);
      grad.addColorStop(0.28, `hsla(${hueA}, 92%, ${isLight ? 46 : 64}%, ${alpha})`);
      grad.addColorStop(0.68, `hsla(${hueB}, 86%, ${isLight ? 52 : 68}%, ${alpha})`);
      grad.addColorStop(1, `hsla(${hueB}, 86%, ${isLight ? 52 : 68}%, 0)`);

      ctx.beginPath();
      for (let x = -80; x <= W + 80; x += 32) {
        const y = centerY + offset
          + Math.sin(x * 0.006 + frameCount * 0.016 + band) * wave
          + Math.cos(x * 0.012 - scroll.easedY * 0.003) * wave * 0.35;
        if (x === -80) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2 + band * 1.4 + speed * 4;
      ctx.shadowBlur = isLight ? 0 : 18 + speed * 24;
      ctx.shadowColor = `hsla(${hueA}, 90%, 64%, ${alpha})`;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawStars() {
    const speed = clamp(Math.abs(scroll.velocity) / 46, 0, 1);
    const direction = scroll.velocity >= 0 ? 1 : -1;

    stars.forEach((s, index) => {
      s.phase += s.speed * (1 + speed * 1.8);
      s.alpha = s.baseAlpha * (0.48 + 0.52 * Math.sin(s.phase));

      const parallaxY = scroll.easedY * (0.018 + s.depth * 0.1);
      const driftX = Math.sin(scroll.easedY * 0.0009 * s.depth + s.phase) * s.drift;
      const drawX = wrap(s.baseX + driftX + s.offsetX, W);
      const drawY = wrap(s.baseY + s.offsetY + parallaxY, H + 36) - 18;

      const dx = drawX - mouse.x;
      const dy = drawY - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (!reduceMotion && dist > 0 && dist < 110) {
        const force = (110 - dist) / 110;
        s.vx += (dx / dist) * force * 0.65;
        s.vy += (dy / dist) * force * 0.65;
      }

      s.vx *= 0.9;
      s.vy *= 0.9;
      s.offsetX = s.offsetX * 0.984 + s.vx;
      s.offsetY = s.offsetY * 0.984 + s.vy;

      const alpha = clamp(s.alpha + speed * 0.18, 0, 1);
      const color = s.sat > 0
        ? `hsla(${s.hue + scroll.progress * 24}, ${s.sat}%, ${isLight ? 58 : 88}%, ${alpha})`
        : `rgba(${isLight ? '70,85,135' : '255,255,255'}, ${alpha})`;

      if (!reduceMotion && speed > 0.05 && index % 2 === 0) {
        const streak = (10 + speed * 84) * s.depth;
        const tailY = drawY - direction * streak;
        const grd = ctx.createLinearGradient(drawX, tailY, drawX, drawY);
        grd.addColorStop(0, 'transparent');
        grd.addColorStop(1, s.sat > 0
          ? `hsla(${s.hue + 20}, ${s.sat}%, ${isLight ? 48 : 82}%, ${0.08 + speed * 0.3})`
          : `rgba(${isLight ? '78,99,170' : '210,238,255'}, ${0.07 + speed * 0.32})`);
        ctx.beginPath();
        ctx.moveTo(drawX, tailY);
        ctx.lineTo(drawX, drawY);
        ctx.strokeStyle = grd;
        ctx.lineWidth = Math.max(0.5, s.size * 0.45);
        ctx.stroke();
      }

      if (s.size > 1.7) {
        const g = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, s.size * (4 + speed * 2));
        g.addColorStop(0, color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(drawX, drawY, s.size * (4 + speed * 2), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(drawX, drawY, s.size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  function spawnShooter() {
    if (shooters.length >= MAX_SHOOTERS) return;
    const angle = (-20 + Math.random() * 36) * Math.PI / 180;
    const speed = 8 + Math.random() * 10 + Math.abs(scroll.velocity) * 0.08;
    shooters.push({
      x: Math.random() * W * 0.72,
      y: Math.random() * H * 0.42,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 1.1,
      len: 80 + Math.random() * 120,
      alpha: 1,
      fade: 0.012 + Math.random() * 0.012
    });
  }

  function drawShooters() {
    shooters = shooters.filter(s => s.alpha > 0);
    shooters.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= s.fade;

      const tail = {
        x: s.x - s.vx * s.len / 10,
        y: s.y - s.vy * s.len / 10
      };
      const grd = ctx.createLinearGradient(tail.x, tail.y, s.x, s.y);
      grd.addColorStop(0, 'transparent');
      grd.addColorStop(1, `rgba(${isLight ? '82, 101, 180' : '225, 242, 255'}, ${s.alpha})`);

      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = grd;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });
  }

  function drawRipples() {
    if (!ripples.length) return;

    ctx.save();
    ctx.globalCompositeOperation = isLight ? 'multiply' : 'screen';
    ripples = ripples.filter(r => r.alpha > 0.01);
    ripples.forEach(r => {
      r.r += 5.5;
      r.alpha *= 0.9;

      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${r.hue}, 90%, ${isLight ? 44 : 68}%, ${r.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawCursorGlow() {
    const activeMouse = mouse.x >= 0 && mouse.x <= W && mouse.y >= 0 && mouse.y <= H;
    const x = activeMouse ? mouse.x : W * (0.35 + scroll.progress * 0.3);
    const y = activeMouse ? mouse.y : H * (0.32 + scroll.progress * 0.28);
    const radius = 170 + scroll.flash * 130;
    const alpha = isLight ? 0.08 : 0.12;

    const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grd.addColorStop(0, `rgba(${isLight ? '88, 112, 240' : '120, 184, 255'}, ${alpha + scroll.flash * 0.05})`);
    grd.addColorStop(0.55, `rgba(${isLight ? '55, 189, 248' : '94, 120, 255'}, ${alpha * 0.35})`);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  function tickMotion() {
    scroll.easedY += (scroll.y - scroll.easedY) * (reduceMotion ? 0.05 : 0.075);
    scroll.velocity += (scroll.targetVelocity - scroll.velocity) * 0.16;
    scroll.targetVelocity *= 0.88;
    scroll.flash *= 0.91;
  }

  function loop() {
    tickMotion();
    drawBackdrop();
    drawNebulae();
    drawAuroraRibbon();
    drawCursorGlow();
    drawStars();
    drawShooters();
    drawRipples();

    frameCount++;
    if (!reduceMotion && frameCount % 220 === 0 && Math.random() < 0.72) spawnShooter();

    requestAnimationFrame(loop);
  }

  function syncTheme() {
    isLight = document.documentElement.getAttribute('data-theme') === 'light';
    canvas.style.opacity = isLight ? '0.95' : '1';
  }

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  window.addEventListener('scroll', () => updateScrollState(false), { passive: true });
  window.addEventListener('resize', resize);

  new MutationObserver(syncTheme)
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  resize();
  syncTheme();
  loop();
})();

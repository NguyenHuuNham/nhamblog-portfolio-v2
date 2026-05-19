// =============================================
// post.js — Single post detail page
// Anonymous like, rating, comment features
// =============================================

let postId;
let currentPost;

// Avatar gradient palettes
const AVATAR_GRADIENTS = [
  ['#7a00ff', '#00d4ff'],
  ['#ff3366', '#ff8c00'],
  ['#00c853', '#00d4ff'],
  ['#ff6b35', '#f7c948'],
  ['#a855f7', '#3b82f6'],
  ['#ec4899', '#8b5cf6'],
];

function getPostId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function timeAgo(dateStr) {
  try {
    const now  = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000); // seconds
    if (diff < 60)    return 'vừa xong';
    if (diff < 3600)  return `${Math.floor(diff/60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff/3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff/86400)} ngày trước`;
    return formatDate(dateStr);
  } catch { return formatDate(dateStr); }
}

function getAvatarStyle(name) {
  const idx = (name || 'A').charCodeAt(0) % AVATAR_GRADIENTS.length;
  const [a, b] = AVATAR_GRADIENTS[idx];
  return `background: linear-gradient(135deg, ${a}, ${b});`;
}

function getAvatarInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getLocalCommentsKey() {
  return `local_comments_post_${postId}`;
}

function getLocalComments() {
  try {
    return JSON.parse(localStorage.getItem(getLocalCommentsKey()) || '[]');
  } catch {
    return [];
  }
}

function saveLocalComment(comment) {
  const comments = getLocalComments();
  comments.push(comment);
  localStorage.setItem(getLocalCommentsKey(), JSON.stringify(comments));
}

// Generate a sample placeholder article content
function getPlaceholderContent(post) {
  const tag = (post.tags || [])[0] || 'mobile';
  const tagMap = {
    flutter: { icon: '📱', tech: 'Flutter', lang: 'Dart' },
    'react-native': { icon: '⚛️', tech: 'React Native', lang: 'JavaScript' },
    kotlin: { icon: '🤖', tech: 'Kotlin', lang: 'Kotlin' },
    swift: { icon: '🍎', tech: 'Swift', lang: 'Swift' },
    tips: { icon: '💡', tech: 'Development', lang: 'Code' },
  };
  const t = tagMap[tag] || { icon: '📝', tech: 'Mobile', lang: 'Code' };

  return `
    <div style="background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.2);border-radius:12px;padding:1rem 1.25rem;margin-bottom:2rem;display:flex;align-items:center;gap:0.75rem;">
      <span style="font-size:1.4rem;">${t.icon}</span>
      <span style="color:var(--text-muted);font-size:0.9rem;">Bài viết này chưa có nội dung chi tiết — Admin có thể cập nhật trong trang Quản trị. Dưới đây là nội dung mẫu để minh hoạ giao diện.</span>
    </div>

    <h2>Giới thiệu</h2>
    <p>${post.summary || `Bài viết về ${t.tech} với nhiều kiến thức thú vị dành cho các developer.`}</p>
    <p>Trong bài viết này, chúng ta sẽ cùng khám phá những khái niệm quan trọng và các best practices khi phát triển ứng dụng với <strong>${t.tech}</strong>. Dù bạn là người mới bắt đầu hay đã có kinh nghiệm, bài viết này sẽ mang lại nhiều giá trị thực tiễn.</p>

    <h2>Nội dung chính</h2>
    <p>Một trong những điều quan trọng nhất khi học ${t.tech} là hiểu rõ <strong>kiến trúc tổng thể</strong> của framework. Điều này giúp bạn đưa ra quyết định thiết kế đúng đắn ngay từ đầu, tránh phải refactor tốn kém về sau.</p>

    <ul>
      <li>Hiểu rõ vòng đời (lifecycle) của component/widget</li>
      <li>Quản lý state hiệu quả với các pattern phổ biến</li>
      <li>Tối ưu hoá performance từ sớm</li>
      <li>Viết code sạch, dễ đọc, dễ maintain</li>
      <li>Test tự động để đảm bảo chất lượng</li>
    </ul>

    <h2>Code ví dụ</h2>
    <p>Dưới đây là một đoạn code minh hoạ cơ bản bằng <strong>${t.lang}</strong>:</p>

    <div style="background:#0d0d1a;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1.5rem;margin:1.5rem 0;font-family:'JetBrains Mono',monospace;font-size:0.88rem;line-height:1.7;overflow-x:auto;">
      <div style="color:#8a8f98;margin-bottom:0.75rem;font-size:0.78rem;text-transform:uppercase;letter-spacing:1px;">${t.lang}</div>
      <div style="color:#54c5f8;">// Ví dụ đơn giản với ${t.tech}</div>
      <div style="color:#a97bff;">class</div> <div style="display:inline;color:#fbbf24;">MyScreen</div> <span style="color:#f0f0f5;">{</span>
      <br><span style="color:#a97bff;padding-left:1.5rem;">  void</span> <span style="color:#00d4ff;">init</span><span style="color:#f0f0f5;">()</span> <span style="color:#f0f0f5;">{</span>
      <br><span style="color:#8a8f98;padding-left:3rem;">  // TODO: Thêm logic ở đây</span>
      <br><span style="color:#f0f0f5;padding-left:1.5rem;">  }</span>
      <br><span style="color:#f0f0f5;">}</span>
    </div>

    <h2>Kết luận</h2>
    <p>Hy vọng bài viết này đã giúp bạn hiểu thêm về ${t.tech}. Nếu bạn có bất kỳ câu hỏi nào, hãy để lại bình luận bên dưới — mình sẽ cố gắng trả lời sớm nhất có thể! 🚀</p>
    <p>Đừng quên <strong>like</strong> nếu bài viết hữu ích và <strong>chia sẻ</strong> cho bạn bè cùng học nhé!</p>
  `;
}

function renderPost() {
  const root = document.getElementById('postRenderZone');
  if (!root) return;
  
  if (!currentPost) {
    root.innerHTML = `
      <div class="container" style="padding-top:80px; text-align:center;">
        <div class="glass-panel" style="padding:4rem; max-width:500px; margin:0 auto;">
          <h1 style="font-size:4rem; margin-bottom:1rem;">🥲</h1>
          <h2 style="margin-bottom:1.5rem;">Không tìm thấy bài viết này</h2>
          <p style="color:var(--text-muted); margin-bottom:2rem;">Có thể bài viết đã bị xóa hoặc đường dẫn không chính xác.</p>
          <a href="./blog.html" class="cta-btn">← Quay lại Blog</a>
        </div>
      </div>`;
    return;
  }

  if (!currentPost.likes)    currentPost.likes    = 0;
  if (!currentPost.comments) currentPost.comments = [];
  if (!currentPost.ratings)  currentPost.ratings  = { count: 0, totalScore: 0 };

  const tagClass = { flutter:'flutter', 'react-native':'react-native', kotlin:'kotlin', swift:'swift', tips:'tips' };
  const tagsHtml = (currentPost.tags||[]).map(t =>
    `<span class="blog-tag ${tagClass[t]||'default'}" style="font-size:0.8rem;padding:0.3rem 0.9rem;">${tagLabel(t)}</span>`
  ).join('');

  const imgSrc      = currentPost.imageUrl || currentPost.image || null;
  const imgHtml     = imgSrc
    ? `<div class="post-detail-cover"><img src="${imgSrc}" alt="${currentPost.title}"></div>`
    : '';
  // Parse content: Markdown → HTML (using marked.js if available)
  function parseContent(raw) {
    if (!raw || !raw.trim()) return null;
    if (typeof marked !== 'undefined') {
      try {
        marked.setOptions({ breaks: true, gfm: true });
        return marked.parse(raw);
      } catch(e) { /* fallback below */ }
    }
    // Fallback: simple Markdown → HTML for headings, bold, code
    return raw
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|p|u|o])/gm, '')
      .replace(/^(.+)$/gm, (l) => l.startsWith('<') ? l : `<p>${l}</p>`);
  }

  const rawContent  = currentPost.content?.trim() || '';
  const parsedContent = parseContent(rawContent);
  const contentHtml = parsedContent || getPlaceholderContent(currentPost);

  const avgRating  = currentPost.ratings.count > 0
    ? (currentPost.ratings.totalScore / currentPost.ratings.count).toFixed(1)
    : '—';

  root.innerHTML = `
    <!-- Hero (flat, inside root .container) -->
    <div style="padding:2.5rem 0 2rem;text-align:center;border-bottom:1px solid var(--glass-border);margin-bottom:2.5rem;">
      <div style="display:flex;justify-content:center;gap:0.5rem;margin-bottom:1.25rem;flex-wrap:wrap;">${tagsHtml}</div>
      <h1 style="font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;line-height:1.2;max-width:860px;margin:0 auto 1.25rem;color:var(--text-main);font-family:var(--font-display);">${currentPost.title}</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:1.5rem;color:var(--text-muted);font-size:0.88rem;flex-wrap:wrap;">
        <span>📅 ${formatDate(currentPost.date)}</span>
        <span>⏱ ${currentPost.readTime || '5 phút đọc'}</span>
        <span>👤 Nhâm Dev</span>
        <span>❤️ <span id="headerLikeCount">${currentPost.likes}</span> lượt thích</span>
      </div>
    </div>

    <!-- Cover image -->
    ${imgHtml}

    <!-- Article content -->
    <div class="post-detail-content">${contentHtml}</div>

    <!-- Divider -->
    <div style="height:1px;background:var(--glass-border);margin:3rem 0;"></div>

    <!-- Actions row -->
    <div style="display:flex;align-items:center;justify-content:center;gap:1.5rem;flex-wrap:wrap;margin-bottom:3.5rem;">
      <button class="like-btn-main" id="likeBtn">
        <svg id="likeHeart" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span id="likeCount">${currentPost.likes} Thích</span>
      </button>

      <div style="display:flex;align-items:center;gap:0.8rem;padding:0.7rem 1.4rem;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:100px;">
        <span style="font-weight:600;color:var(--text-muted);font-size:0.9rem;">Đánh giá:</span>
        <div id="starRating" style="display:flex;gap:4px;cursor:pointer;">
          ${[1,2,3,4,5].map(v => `<svg data-val="${v}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" style="transition:all 0.2s;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`).join('')}
        </div>
        <span id="ratingInfo" style="font-size:0.82rem;color:var(--text-muted);font-family:var(--font-mono);">${avgRating} (${currentPost.ratings.count} lượt)</span>
      </div>

      <button onclick="navigator.clipboard.writeText(window.location.href).then(()=>showToast('Đã copy link! 🔗'))" style="display:flex;align-items:center;gap:0.5rem;padding:0.7rem 1.4rem;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:100px;color:var(--text-muted);font-size:0.9rem;font-weight:600;transition:all 0.3s;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Chia sẻ
      </button>
    </div>

    <!-- Comments -->
    <div style="max-width:760px;margin:0 auto 4rem;">
      <h3 style="font-size:1.5rem;font-weight:800;margin-bottom:2rem;display:flex;align-items:center;gap:0.75rem;font-family:var(--font-display);">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        Bình luận <span style="color:var(--accent);font-size:1rem;font-weight:600;">(<span id="cmCount">${currentPost.comments.length}</span>)</span>
      </h3>

      <div class="comment-form-wrap">
        <div class="comment-form-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Để lại bình luận của bạn
        </div>
        <textarea class="comment-textarea" id="commentText" placeholder="Nhập bình luận... (không cần đăng nhập)"></textarea>
        <div class="comment-form-footer">
          <div class="comment-anon-badge">👤 Bình luận ẩn danh — tên tự sinh ngẫu nhiên</div>
          <button class="comment-submit-btn" id="commentSubmitBtn" onclick="submitComment()">Gửi bình luận ✉️</button>
        </div>
      </div>

      <div id="commentList" style="display:flex;flex-direction:column;gap:1rem;"></div>
    </div>

    <!-- Toast -->
    <div id="toast" style="position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(20px);background:#1a1a2e;border:1px solid var(--glass-border);padding:0.75rem 1.5rem;border-radius:100px;font-size:0.9rem;font-weight:600;opacity:0;transition:all 0.3s;z-index:9999;pointer-events:none;backdrop-filter:blur(12px);"></div>`;

  document.title = currentPost.title + ' — Nhâm Mobile Dev';

  const content = document.querySelector('.post-detail-content');
  if (content) content.style.cssText = 'max-width:760px;margin:0 auto 3rem;font-size:1.08rem;line-height:1.85;color:var(--text-main);';

  if (imgHtml) {
    const cover = document.querySelector('.post-detail-cover');
    if (cover) cover.style.cssText = 'max-width:860px;margin:0 auto 3rem;border-radius:var(--r-lg);overflow:hidden;aspect-ratio:2/1;border:1px solid var(--glass-border);box-shadow:0 20px 50px rgba(0,0,0,0.4);';
    const coverImg = cover?.querySelector('img');
    if (coverImg) coverImg.style.cssText = 'width:100%;height:100%;object-fit:cover;';
  }

  initInteractions();
  renderComments();
}

function initInteractions() {
  const likeBtn      = document.getElementById('likeBtn');
  const likeCountEl  = document.getElementById('likeCount');
  const headerCount  = document.getElementById('headerLikeCount');
  const likedKey     = 'liked_post_' + postId;

  if (localStorage.getItem(likedKey)) {
    likeBtn.classList.add('liked');
  }

  likeBtn.addEventListener('click', async () => {
    if (localStorage.getItem(likedKey)) {
      showToast('Bạn đã thích bài này rồi! ❤️');
      return;
    }
    localStorage.setItem(likedKey, 'true');
    likeBtn.classList.add('liked');
    currentPost.likes = (currentPost.likes || 0) + 1;
    const newCount = currentPost.likes;
    likeCountEl.textContent = newCount + ' Thích';
    if (headerCount) headerCount.textContent = newCount;

    // Heart pop animation
    const heart = document.getElementById('likeHeart');
    if (heart) { heart.classList.add('heart-pop'); setTimeout(() => heart.classList.remove('heart-pop'), 400); }

    showToast('Cảm ơn bạn đã thích! ❤️');
    try { await apiLikePost(postId); } catch (err) { console.error('Like error:', err); }
  });

  // Star rating
  const stars    = document.querySelectorAll('#starRating svg');
  const ratingEl = document.getElementById('ratingInfo');
  const ratedKey = 'rated_post_' + postId;

  const savedRating = parseInt(localStorage.getItem(ratedKey) || '0');
  if (savedRating) {
    stars.forEach(s => { if (parseInt(s.dataset.val) <= savedRating) s.setAttribute('fill', '#fbbf24'); });
  }

  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      if (localStorage.getItem(ratedKey)) return;
      const v = parseInt(star.dataset.val);
      stars.forEach(s => s.setAttribute('fill', parseInt(s.dataset.val) <= v ? '#fbbf24' : 'none'));
    });
    star.addEventListener('mouseleave', () => {
      if (localStorage.getItem(ratedKey)) return;
      const saved = parseInt(localStorage.getItem(ratedKey) || '0');
      stars.forEach(s => s.setAttribute('fill', parseInt(s.dataset.val) <= saved ? '#fbbf24' : 'none'));
    });
    star.addEventListener('click', async () => {
      if (localStorage.getItem(ratedKey)) { showToast('Bạn đã đánh giá rồi! ⭐'); return; }
      const val = parseInt(star.dataset.val);
      localStorage.setItem(ratedKey, val);
      stars.forEach(s => s.setAttribute('fill', parseInt(s.dataset.val) <= val ? '#fbbf24' : 'none'));

      // Optimistic UI update
      const newCount = (currentPost.ratings.count || 0) + 1;
      const newScore = (currentPost.ratings.totalScore || 0) + val;
      currentPost.ratings = { count: newCount, totalScore: newScore };
      if (ratingEl) ratingEl.textContent = `${(newScore/newCount).toFixed(1)} (${newCount} lượt)`;
      showToast(`Đã đánh giá ${val} sao! ⭐`);

      // Save to backend
      try {
        const res = await apiRatePost(postId, val);
        // Update with real server data
        if (res && res.ratings) {
          currentPost.ratings = res.ratings;
          const avg = (res.ratings.totalScore / res.ratings.count).toFixed(1);
          if (ratingEl) ratingEl.textContent = `${avg} (${res.ratings.count} lượt)`;
        }
      } catch (err) {
        console.error('Rating error:', err);
      }
    });
  });
}

window.submitComment = async function() {
  const textEl = document.getElementById('commentText');
  const btn    = document.getElementById('commentSubmitBtn');
  const text   = textEl?.value?.trim();
  if (!text) { showToast('Vui lòng nhập nội dung bình luận! ✏️'); return; }

  btn.disabled = true;
  btn.textContent = 'Đang gửi... ⏳';

  try {
    // name is optional — backend auto-assigns anonymous name
    const comment = await apiAddComment(postId, '', text);
    currentPost.comments.push(comment);
    const cmCount = document.getElementById('cmCount');
    if (cmCount) cmCount.textContent = currentPost.comments.length;
    textEl.value = '';
    renderComments();
    showToast('Bình luận đã được gửi! 🎉');
    // Scroll to comment list
    document.getElementById('commentList')?.scrollIntoView({ behavior:'smooth', block:'start' });
  } catch (err) {
    const fallbackComment = {
      id: `local-${Date.now()}`,
      name: 'Bạn đọc ẩn danh',
      content: text,
      createdAt: new Date().toISOString(),
      localOnly: true,
    };
    saveLocalComment(fallbackComment);
    currentPost.comments.push(fallbackComment);
    const cmCount = document.getElementById('cmCount');
    if (cmCount) cmCount.textContent = currentPost.comments.length;
    textEl.value = '';
    renderComments();
    showToast('Đã lưu bình luận trên máy. Khi backend chạy lại bạn có thể gửi tiếp.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Gửi bình luận ✉️';
  }
};

function renderComments() {
  const container = document.getElementById('commentList');
  if (!container) return;

  if (!currentPost.comments || currentPost.comments.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;color:var(--text-muted);">
        <div style="font-size:2.5rem;margin-bottom:0.75rem;">💬</div>
        <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
      </div>`;
    return;
  }

  // Show newest first
  const sorted = [...currentPost.comments].reverse();
  container.innerHTML = sorted.map((c, i) => {
    const name     = c.name || c.author || 'Ẩn danh';
    const content  = c.content || c.text || '';
    const dateStr  = c.createdAt || c.date || new Date().toISOString();
    const initials = getAvatarInitials(name);
    const avatarStyle = getAvatarStyle(name);
    const delay = (i * 0.05).toFixed(2);

    return `
    <div class="comment-item-card" style="animation-delay:${delay}s;">
      <div class="comment-avatar-circle" style="${avatarStyle}">${initials}</div>
      <div class="comment-body-wrap">
        <div class="comment-meta-row">
          <span class="comment-author-name">${name}</span>
          <span class="comment-time">${timeAgo(dateStr)}</span>
          ${c.localOnly ? '<span class="comment-time" style="color:var(--accent);">đã lưu cục bộ</span>' : ''}
        </div>
        <div class="comment-content-text">${escapeHtml(content)}</div>
      </div>
    </div>`;
  }).join('');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2800);
}

window.setupPostPage = async function() {
  initTheme();
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  postId = getPostId();
  if (!postId) {
    const root = document.getElementById('postRenderZone');
    if (root) root.innerHTML = `
      <div style="text-align:center;padding:8rem 1rem;">
        <h1 style="font-size:3rem;margin-bottom:1rem;">🥲</h1>
        <p>Không tìm thấy bài viết.</p>
        <a href="./blog.html" style="color:var(--accent);">← Quay lại Blog</a>
      </div>`;
    return;
  }

  // Always fetch the latest post data directly from API (to get real likes/comments)
  try {
    currentPost = await apiGetPost(postId);
  } catch (err) {
    console.error('Fetch post error:', err);
    // Fallback: try from cached POSTS list
    await loadPublicData();
    currentPost = (window.POSTS || []).find(p => String(p.id) === String(postId)) || null;
  }

  // Auto-sync: if user had rated before fix was deployed, resend to server
  if (currentPost) {
    currentPost.comments = [
      ...((currentPost.comments || [])),
      ...getLocalComments(),
    ];

    const ratedKey  = 'rated_post_' + postId;
    const savedVal  = parseInt(localStorage.getItem(ratedKey) || '0');
    const srvCount  = (currentPost.ratings || {}).count || 0;

    if (savedVal >= 1 && savedVal <= 5 && srvCount === 0) {
      // Server still has 0 ratings but user had saved a local rating → sync it
      try {
        const res = await apiRatePost(postId, savedVal);
        if (res && res.ratings) currentPost.ratings = res.ratings;
      } catch (e) { /* silent */ }
    }
  }

  renderPost();
};

document.addEventListener('DOMContentLoaded', window.setupPostPage);

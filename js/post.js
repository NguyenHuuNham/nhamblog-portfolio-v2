// =============================================
// post.js — Single post detail page
// Likes, ratings, comments stored in Firestore
// =============================================

let postId;
let currentPost;

function getPostId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderPost() {
  const root = document.getElementById('postRenderZone');
  if (!currentPost) {
    root.innerHTML = `<div class="not-found"><h1>🥲</h1><p>Không tìm thấy bài viết này. Có thể nó đã bị xóa.</p><br><a href="./blog.html" class="btn">Quay lại Trang Blog</a></div>`;
    return;
  }

  if (!currentPost.likes)    currentPost.likes    = 0;
  if (!currentPost.comments) currentPost.comments = [];
  if (!currentPost.ratings)  currentPost.ratings  = { count: 0, totalScore: 0 };

  const tagsHtml   = (currentPost.tags||[]).map(t => `<span class="post-detail-tag">${t}</span>`).join('');
  const imgHtml    = currentPost.image ? `<div class="post-detail-cover"><img src="${currentPost.image}" alt=""></div>` : '';
  const contentHtml = currentPost.content || `<p style="font-size:1.15rem;color:var(--text);line-height:1.8;">${currentPost.summary}</p><br><p style="color:var(--text3);font-style:italic;">Bài viết này chưa có nội dung chi tiết. Vui lòng cập nhật trong trang Admin!</p>`;
  const avgRating  = currentPost.ratings.count > 0 ? (currentPost.ratings.totalScore / currentPost.ratings.count).toFixed(1) : 0;

  root.innerHTML = `
    <header class="post-hero">
      <div class="container">
        <div>${tagsHtml}</div>
        <h1 class="post-detail-title">${currentPost.title}</h1>
        <div class="post-detail-meta">
          <span>📅 ${formatDate(currentPost.date)}</span>
          <span>⏱ ${currentPost.readTime || '5 phút'}</span>
          <span>👨‍💻 Tác giả: Admin</span>
        </div>
      </div>
    </header>
    <div class="container" style="padding-top:3rem;">
      ${imgHtml}
      <div class="post-detail-content">${contentHtml}</div>
      <div class="post-actions">
        <button class="action-btn" id="likeBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <span id="likeCount">${currentPost.likes} Thích</span>
        </button>
        <div class="rating-wrap">
          <span style="font-weight:600;color:var(--text);">Đánh giá:</span>
          <div class="stars" id="starRating">
            ${[1,2,3,4,5].map(v => `<svg data-val="${v}" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`).join('')}
          </div>
          <span class="rating-info" id="ratingInfo">${avgRating} (${currentPost.ratings.count} lượt)</span>
        </div>
      </div>
      <div class="comments-section">
        <h3 class="comments-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          Bình luận (<span id="cmCount">${currentPost.comments.length}</span>)
        </h3>
        <form class="comment-form" id="commentForm">
          <textarea class="comment-input" id="commentText" placeholder="Để lại bình luận ẩn danh của bạn..." required></textarea>
          <div style="text-align:right"><button type="submit" class="comment-submit">Gửi bình luận</button></div>
        </form>
        <div class="comment-list" id="commentList"></div>
      </div>
    </div>`;

  document.title = currentPost.title + ' — Nhâm Mobile Dev';
  initInteractions();
  renderComments();
}

function initInteractions() {
  const likeBtn   = document.getElementById('likeBtn');
  const likeCount = document.getElementById('likeCount');
  const likedKey  = 'liked_post_' + postId;
  if (sessionStorage.getItem(likedKey)) likeBtn.classList.add('liked');

  likeBtn.addEventListener('click', async () => {
    const alreadyLiked = sessionStorage.getItem(likedKey);
    const delta = alreadyLiked ? -1 : 1;
    if (alreadyLiked) { sessionStorage.removeItem(likedKey); likeBtn.classList.remove('liked'); }
    else              { sessionStorage.setItem(likedKey,'true'); likeBtn.classList.add('liked'); }
    currentPost.likes = Math.max(0, (currentPost.likes || 0) + delta);
    likeCount.textContent = currentPost.likes + ' Thích';
    try { await dbSet('posts', postId, { likes: currentPost.likes }); } catch {}
  });

  const stars     = document.querySelectorAll('#starRating svg');
  const ratingInfo = document.getElementById('ratingInfo');
  const ratedKey   = 'rated_post_' + postId;
  if (sessionStorage.getItem(ratedKey)) {
    const v = parseInt(sessionStorage.getItem(ratedKey));
    stars.forEach(s => { if (parseInt(s.dataset.val) <= v) s.classList.add('active'); });
  }
  stars.forEach(star => {
    star.addEventListener('click', async () => {
      if (sessionStorage.getItem(ratedKey)) return alert('Bạn đã đánh giá bài viết này rồi!');
      const val = parseInt(star.dataset.val);
      sessionStorage.setItem(ratedKey, val.toString());
      stars.forEach(s => { if (parseInt(s.dataset.val) <= val) s.classList.add('active'); });
      const newScore = (currentPost.ratings.totalScore || 0) + val;
      const newCount = (currentPost.ratings.count || 0) + 1;
      currentPost.ratings = { totalScore: newScore, count: newCount };
      ratingInfo.textContent = (newScore / newCount).toFixed(1) + ` (${newCount} lượt)`;
      try { await dbSet('posts', postId, { ratings: currentPost.ratings }); } catch {}
    });
  });

  document.getElementById('commentForm').addEventListener('submit', async e => {
    e.preventDefault();
    const text = document.getElementById('commentText').value.trim();
    if (!text) return;
    const comment = { author: 'Người dùng ẩn danh', text, date: new Date().toISOString() };
    currentPost.comments.push(comment);
    document.getElementById('cmCount').textContent = currentPost.comments.length;
    document.getElementById('commentText').value = '';
    renderComments();
    try { await dbArrayUnion('posts', postId, 'comments', comment); } catch {}
  });
}

function renderComments() {
  const container = document.getElementById('commentList');
  if (!container) return;
  if (!currentPost.comments || currentPost.comments.length === 0) {
    container.innerHTML = '<p style="color:var(--text3);font-style:italic;">Chưa có bình luận nào. Hãy là người đầu tiên!</p>';
    return;
  }
  container.innerHTML = [...currentPost.comments].reverse().map(c => `
    <div class="comment-item">
      <div class="comment-avatar">😎</div>
      <div class="comment-body">
        <div class="comment-header"><span class="comment-author">${c.author}</span><span class="comment-date">${formatDate(c.date)}</span></div>
        <div class="comment-text">${c.text}</div>
      </div>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  postId = getPostId();
  if (!postId) { document.getElementById('postRenderZone').innerHTML = '<div class="not-found"><h1>🥲</h1><p>Không tìm thấy bài viết.</p><a href="./blog.html" class="btn">Quay lại</a></div>'; return; }

  // Load data
  await loadPublicData();

  // Find post
  currentPost = POSTS.find(p => String(p.id) === String(postId)) || null;
  // If not in cache, try direct DB fetch (for real-time data)
  if (!currentPost) {
    try { currentPost = await dbGet('posts', postId); } catch {}
  }
  renderPost();
});

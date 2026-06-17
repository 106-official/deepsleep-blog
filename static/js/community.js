const API_BASE = 'https://community-deepsleep.vercel.app/api';

function getToken() { return localStorage.getItem('community_token'); }
function setToken(t) { localStorage.setItem('community_token', t); }
function clearToken() { localStorage.removeItem('community_token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('community_user') || 'null'); } catch { return null; }
}
function setUser(u) { localStorage.setItem('community_user', JSON.stringify(u)); }
function clearUser() { localStorage.removeItem('community_user'); }

function getDefaultAvatar(name) {
  const initial = (name || '?').charAt(0).toUpperCase();
  return 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
    '<circle cx="40" cy="40" r="40" fill="#ddd"/>' +
    '<text x="40" y="52" text-anchor="middle" fill="#999" font-size="30" font-family="sans-serif">' + initial + '</text></svg>'
  );
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok && data.error) throw new Error(data.error);
    return data;
  } catch (e) {
    if (e.message.includes('未登录') || e.message.includes('过期')) {
      clearToken(); clearUser(); location.reload();
    }
    throw e;
  }
}

function showError(el, msg) {
  el.textContent = msg; el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}
function showSuccess(el, msg) {
  el.textContent = msg; el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
}

// Auth: Register
async function handleRegister(e) {
  e.preventDefault();
  const errEl = document.getElementById('reg-error');
  const succEl = document.getElementById('reg-success');
  errEl.style.display = 'none'; succEl.style.display = 'none';
  try {
    const data = await api('/register', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        displayName: document.getElementById('reg-name').value
      })
    });
    setToken(data.token); setUser(data.user);
    showSuccess(succEl, '注册成功！正在跳转...');
    setTimeout(() => location.reload(), 1200);
  } catch (e) { showError(errEl, e.message); }
}

// Auth: Login
async function handleLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('login-error');
  const succEl = document.getElementById('login-success');
  errEl.style.display = 'none'; succEl.style.display = 'none';
  try {
    const data = await api('/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      })
    });
    setToken(data.token); setUser(data.user);
    showSuccess(succEl, '登录成功！正在跳转...');
    setTimeout(() => location.reload(), 1000);
  } catch (e) { showError(errEl, e.message); }
}

// Logout
function logout() { clearToken(); clearUser(); location.reload(); }

// Load Posts
let currentPage = 1;
const POSTS_PER_PAGE = 10;

async function loadPosts(page = 1, category = '') {
  currentPage = page;
  const container = document.getElementById('posts-list');
  if (!container) return;

  container.innerHTML = '<div class="loading">加载中</div>';
  try {
    const data = await api(`/posts?page=${page}&limit=${POSTS_PER_PAGE}&category=${category}`);
    if (!data.posts || data.posts.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><p>还没有帖子，来发第一篇吧！</p></div>`;
      renderPagination(0, page);
      return;
    }

    container.innerHTML = data.posts.map(p => `
      <div class="post-card">
        <div class="post-card-header">
          <div>
            <div class="post-author">
              <img class="post-avatar" src="${p.authorAvatar || getDefaultAvatar(p.authorName)}" alt="">
              <span class="post-author-name">${escHtml(p.authorName)}</span>
            </div>
            <div class="post-time">${formatTime(p.createdAt)}</div>
          </div>
          ${p.category ? `<span class="post-category">${escHtml(p.category)}</span>` : ''}
        </div>
        <div class="post-title">${escHtml(p.title)}</div>
        <div class="post-content">${escHtml(p.contentFull.length > 500 ? p.contentFull.substring(0, 500) + '...' : p.contentFull)}</div>
        <div class="post-meta">
          <span>👁 ${p.viewCount}</span>
          <span>❤️ ${p.likeCount}</span>
          <span>💬 ${p.commentCount}</span>
        </div>
      </div>
    `).join('');

    renderPagination(data.pagination.total, page);
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><p>加载失败: ${e.message}</p></div>`;
  }
}

function renderPagination(total, current) {
  const el = document.getElementById('pagination');
  if (!el) return;
  const totalPages = Math.ceil(total / POSTS_PER_PAGE);
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = '';
  if (current > 1) html += `<button onclick="loadPosts(${current-1}, currentCategory())">上一页</button>`;
  for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) {
    html += `<button class="${i === current ? 'active' : ''}" onclick="loadPosts(${i}, currentCategory())">${i}</button>`;
  }
  if (current < totalPages) html += `<button onclick="loadPosts(${current+1}, currentCategory())">下一页</button>`;
  el.innerHTML = html;
}

function currentCategory() {
  const sel = document.getElementById('category-filter');
  return sel ? sel.value : '';
}

// Create Post
async function createPost(e) {
  e.preventDefault();
  const errEl = document.getElementById('post-error');
  const succEl = document.getElementById('post-success');
  errEl.style.display = 'none'; succEl.style.display = 'none';

  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();
  const category = document.getElementById('post-category')?.value || 'general';

  if (!title || !content) { showError(errEl, '标题和内容不能为空'); return; }

  try {
    await api('/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content, category })
    });
    showSuccess(succEl, '发布成功！');
    document.getElementById('post-title').value = '';
    document.getElementById('post-content').value = '';
    loadPosts(1, category);
  } catch (e) { showError(errEl, e.message); }
}

// Update Profile
async function updateProfile(e) {
  e.preventDefault();
  const errEl = document.getElementById('profile-error');
  const succEl = document.getElementById('profile-success');
  errEl.style.display = 'none'; succEl.style.display = 'none';

  const displayName = document.getElementById('profile-name')?.value?.trim();
  const avatarUrl = document.getElementById('profile-avatar')?.value?.trim();
  const bio = document.getElementById('profile-bio')?.value?.trim();

  try {
    await api('/me', {
      method: 'PUT',
      body: JSON.stringify({ displayName, avatarUrl, bio })
    });

    const user = getUser();
    if (displayName) user.displayName = displayName;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (bio !== undefined) user.bio = bio;
    setUser(user);

    showSuccess(succEl, '资料更新成功！');
    updateHeaderUI();
  } catch (e) { showError(errEl, e.message); }
}

// UI Helpers
function updateHeaderUI() {
  const headerUser = document.getElementById('header-user');
  if (!headerUser) return;
  const user = getUser();
  if (user) {
    headerUser.innerHTML = `
      <img class="user-avatar" src="${user.avatarUrl || getDefaultAvatar(user.displayName)}" alt="">
      <span class="user-name">${escHtml(user.displayName)}</span>
      <button class="c-btn c-btn-secondary" style="padding:6px 14px;font-size:0.82rem" onclick="logout()">退出</button>
    `;
  }
}

function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML.replace(/\n/g, '<br>');
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  return d.toLocaleDateString('zh-CN');
}

// Tab switching
function switchTab(tabName) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.querySelector(`.auth-tab[data-tab="${tabName}"]`)?.classList.add('active');
  document.querySelector(`.auth-form#${tabName}`)?.classList.add('active');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderUI();
  const postsList = document.getElementById('posts-list');
  if (postsList) loadPosts(1);

  // Bind forms
  const regForm = document.getElementById('reg-form');
  if (regForm) regForm.addEventListener('submit', handleRegister);

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const postForm = document.getElementById('post-form');
  if (postForm) postForm.addEventListener('submit', createPost);

  const profileForm = document.getElementById('profile-form');
  if (profileForm) profileForm.addEventListener('submit', updateProfile);

  // Category filter
  const catFilter = document.getElementById('category-filter');
  if (catFilter) catFilter.addEventListener('change', () => loadPosts(1, catFilter.value));

  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
});

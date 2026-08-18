/**
 * SQLite 实现（本地开发）。使用 better-sqlite3。
 * 同步 API 用 Promise 包一层，与 mysql 驱动保持一致的异步接口。
 */
const path = require('path');

let db;
try {
  const Database = require('better-sqlite3');
  const file = process.env.SQLITE_PATH || path.join(__dirname, '..', 'community.db');
  db = new Database(file);
  db.pragma('journal_mode = WAL');
} catch (e) {
  // 仅在生产用 mysql 时可能不装 better-sqlite3；本地未安装则明确报错。
  if ((process.env.DB_TYPE || 'sqlite').toLowerCase() === 'sqlite') {
    console.error('[db_sqlite] 加载 better-sqlite3 失败，请先 npm install：', e.message);
    throw e;
  }
  // mysql 模式下静默跳过
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name  TEXT NOT NULL,
      avatar_url    TEXT,
      bio           TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS posts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      title        TEXT NOT NULL,
      content      TEXT NOT NULL,
      category     TEXT NOT NULL DEFAULT 'general',
      view_count   INTEGER NOT NULL DEFAULT 0,
      like_count   INTEGER NOT NULL DEFAULT 0,
      comment_count INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
  `);
  return Promise.resolve();
}

function rowToUser(r) {
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    passwordHash: r.password_hash,
    displayName: r.display_name,
    avatarUrl: r.avatar_url || null,
    bio: r.bio || null,
    createdAt: r.created_at,
  };
}

function createUser({ email, passwordHash, displayName }) {
  const info = db
    .prepare('INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)')
    .run(email.toLowerCase().trim(), passwordHash, displayName);
  return Promise.resolve(getUserById(info.lastInsertRowid));
}

function getUserByEmail(email) {
  const r = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  return Promise.resolve(rowToUser(r));
}

function getUserById(id) {
  const r = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return Promise.resolve(rowToUser(r));
}

function updateUser(id, { displayName, avatarUrl, bio }) {
  const cur = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!cur) return Promise.resolve(null);
  const nextName = displayName !== undefined ? displayName : cur.display_name;
  const nextAvatar = avatarUrl !== undefined ? avatarUrl : cur.avatar_url;
  const nextBio = bio !== undefined ? bio : cur.bio;
  db.prepare(
    'UPDATE users SET display_name = ?, avatar_url = ?, bio = ? WHERE id = ?'
  ).run(nextName, nextAvatar, nextBio, id);
  return Promise.resolve(getUserById(id));
}

function createPost({ userId, title, content, category }) {
  const info = db
    .prepare(
      'INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)'
    )
    .run(userId, title, content, category || 'general');
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(info.lastInsertRowid);
  return Promise.resolve(postRow(post));
}

function postRow(p) {
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    contentFull: p.content,
    category: p.category,
    authorName: '',
    authorAvatar: null,
    authorId: p.user_id,
    createdAt: p.created_at,
    viewCount: p.view_count,
    likeCount: p.like_count,
    commentCount: p.comment_count,
  };
}

function listPosts({ page = 1, limit = 10, category = '' } = {}) {
  const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * (parseInt(limit, 10) || 10);
  const lim = parseInt(limit, 10) || 10;
  const cat = (category || '').toString();

  const where = cat ? 'WHERE p.category = ?' : '';
  const params = cat ? [cat] : [];

  const total = db.prepare(`SELECT COUNT(*) AS c FROM posts p ${where}`).get(...params).c;

  const rows = db
    .prepare(
      `SELECT p.id, p.title, p.content AS contentFull, p.category, p.created_at,
              p.view_count, p.like_count, p.comment_count,
              u.display_name AS authorName, u.avatar_url AS authorAvatar
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, lim, offset);

  const posts = rows.map((r) => ({
    id: r.id,
    title: r.title,
    contentFull: r.contentFull,
    category: r.category,
    authorName: r.authorName,
    authorAvatar: r.authorAvatar || null,
    createdAt: r.created_at,
    viewCount: r.view_count,
    likeCount: r.like_count,
    commentCount: r.comment_count,
  }));

  return Promise.resolve({ posts, total });
}

module.exports = {
  initDb,
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  createPost,
  listPosts,
};

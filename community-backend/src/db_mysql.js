/**
 * MySQL 实现（生产环境，腾讯云 SCF + TencentDB for MySQL）。使用 mysql2/promise。
 * 连接信息来自环境变量：MYSQL_HOST / MYSQL_PORT / MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'deepsleep',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT PRIMARY KEY AUTO_INCREMENT,
      email         VARCHAR(191) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name  VARCHAR(50) NOT NULL,
      avatar_url    TEXT,
      bio           VARCHAR(500),
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id            INT PRIMARY KEY AUTO_INCREMENT,
      user_id      INT NOT NULL,
      title         VARCHAR(255) NOT NULL,
      content       TEXT NOT NULL,
      category      VARCHAR(32) NOT NULL DEFAULT 'general',
      view_count    INT NOT NULL DEFAULT 0,
      like_count    INT NOT NULL DEFAULT 0,
      comment_count INT NOT NULL DEFAULT 0,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_created (created_at),
      KEY idx_category (category),
      KEY idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
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

async function createUser({ email, passwordHash, displayName }) {
  const [res] = await pool.query(
    'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
    [email.toLowerCase().trim(), passwordHash, displayName]
  );
  return getUserById(res.insertId);
}

async function getUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  return rowToUser(rows[0]);
}

async function getUserById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rowToUser(rows[0]);
}

async function updateUser(id, { displayName, avatarUrl, bio }) {
  const cur = await getUserById(id);
  if (!cur) return null;
  const nextName = displayName !== undefined ? displayName : cur.displayName;
  const nextAvatar = avatarUrl !== undefined ? avatarUrl : cur.avatarUrl;
  const nextBio = bio !== undefined ? bio : cur.bio;
  await pool.query(
    'UPDATE users SET display_name = ?, avatar_url = ?, bio = ? WHERE id = ?',
    [nextName, nextAvatar, nextBio, id]
  );
  return getUserById(id);
}

async function createPost({ userId, title, content, category }) {
  const [res] = await pool.query(
    'INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)',
    [userId, title, content, category || 'general']
  );
  const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [res.insertId]);
  return postRow(rows[0]);
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

async function listPosts({ page = 1, limit = 10, category = '' } = {}) {
  const lim = parseInt(limit, 10) || 10;
  const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * lim;
  const cat = (category || '').toString();

  const where = cat ? 'WHERE p.category = ?' : '';
  const whereParams = cat ? [cat] : [];

  const [countRows] = await pool.query(`SELECT COUNT(*) AS c FROM posts p ${where}`, whereParams);
  const total = countRows[0].c;

  const [rows] = await pool.query(
    `SELECT p.id, p.title, p.content AS contentFull, p.category, p.created_at,
            p.view_count, p.like_count, p.comment_count,
            u.display_name AS authorName, u.avatar_url AS authorAvatar
     FROM posts p
     JOIN users u ON u.id = p.user_id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...whereParams, lim, offset]
  );

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

  return { posts, total };
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

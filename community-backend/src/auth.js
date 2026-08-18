const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'deepsleep-community-dev-secret-change-me';
const TOKEN_TTL = '30d'; // 登录态有效期 30 天

function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Express 鉴权中间件：从 Authorization: Bearer <token> 中取出用户 id。
 * 成功则 req.userId 可用；失败抛出 401。
 */
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const decoded = verifyToken(m[1]);
    req.userId = decoded.uid;
    next();
  } catch (e) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

module.exports = {
  JWT_SECRET,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  authMiddleware,
};

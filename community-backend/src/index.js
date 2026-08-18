const express = require('express');
const cors = require('cors');
const db = require('./db');
const auth = require('./auth');

const app = express();

// 允许跨域：前端部署在 GitHub Pages，后端在腾讯云 SCF，属于跨域请求。
// 使用 Bearer Token 鉴权（非 Cookie），因此 * 即可，无需 credentials。
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ---------- LLM 代理（立信村学习 RPG / Grill me 用） ----------
// provider-agnostic：对接 OpenAI 兼容的 /v1/chat/completions，可用 LLM_BASE_URL 切换
// DeepSeek / 通义(兼容模式) / 智谱 / OpenAI。密钥仅在后端环境变量，绝不进前端。
// 默认走 DeepSeek（deepseek-chat）；如用其它服务商，改 LLM_BASE_URL / LLM_MODEL 即可。
// 未配置 LLM_API_KEY 时返回 mock 标记，前端据此降级为内置 Demo。
// 注意：本路由放在 ensureDb 中间件之前，故不依赖数据库，可独立运行。
app.post('/api/llm/chat', async (req, res) => {
  try {
    const { messages, model: reqModel } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages 必填且为数组' });
    const apiKey = process.env.LLM_API_KEY;
    const baseUrl = (process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, '');
    const model = reqModel || process.env.LLM_MODEL || 'deepseek-chat';
    if (!apiKey) {
      return res.json({ mock: true, reply: '(mock) 后端未配置 LLM_API_KEY，前端已降级为内置 Demo。' });
    }
    const r = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({ model, messages, temperature: 0.8 }),
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: 'LLM 调用失败：' + t.slice(0, 300) });
    }
    const j = await r.json();
    const reply = j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : '';
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: 'LLM 代理错误：' + e.message });
  }
});

// 数据库初始化只需执行一次（SCF 冷启动/本地启动各一次）。
let dbReady = null;
function ensureDb() {
  if (!dbReady) dbReady = db.initDb().catch((e) => { dbReady = null; throw e; });
  return dbReady;
}
app.use((req, res, next) => {
  ensureDb().then(() => next()).catch((e) => {
    res.status(500).json({ error: '数据库未就绪：' + e.message });
  });
});

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl || null,
    bio: u.bio || null,
  };
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// ---------- 健康检查 ----------
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// ---------- 注册 ----------
app.post('/register', async (req, res) => {
  try {
    const email = (req.body.email || '').trim();
    const password = req.body.password || '';
    const displayName = (req.body.displayName || '').trim();

    if (!isEmail(email)) return res.status(400).json({ error: '邮箱格式不正确' });
    if (password.length < 6) return res.status(400).json({ error: '密码至少 6 位' });
    if (!displayName) return res.status(400).json({ error: '昵称不能为空' });

    const exist = await db.getUserByEmail(email);
    if (exist) return res.status(409).json({ error: '该邮箱已注册，请直接登录' });

    const passwordHash = await auth.hashPassword(password);
    const user = await db.createUser({ email, passwordHash, displayName });
    const token = auth.signToken({ uid: user.id, email: user.email });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: '注册失败：' + e.message });
  }
});

// ---------- 登录 ----------
app.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim();
    const password = req.body.password || '';

    if (!email || !password) return res.status(400).json({ error: '请输入邮箱和密码' });

    const user = await db.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: '邮箱或密码错误' });

    const ok = await auth.verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: '邮箱或密码错误' });

    const token = auth.signToken({ uid: user.id, email: user.email });
    res.json({ token, user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: '登录失败：' + e.message });
  }
});

// ---------- 帖子列表 ----------
app.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const category = (req.query.category || '').toString();
    const { posts, total } = await db.listPosts({ page, limit, category });
    res.json({ posts, pagination: { total, page, limit } });
  } catch (e) {
    res.status(500).json({ error: '加载帖子失败：' + e.message });
  }
});

// ---------- 发帖（需登录） ----------
app.post('/posts', auth.authMiddleware, async (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    const content = (req.body.content || '').trim();
    const category = (req.body.category || 'general').toString();

    if (!title) return res.status(400).json({ error: '标题不能为空' });
    if (!content) return res.status(400).json({ error: '内容不能为空' });

    const post = await db.createPost({ userId: req.userId, title, content, category });
    res.status(201).json({ success: true, post });
  } catch (e) {
    res.status(500).json({ error: '发布失败：' + e.message });
  }
});

// ---------- 我的资料（需登录） ----------
app.get('/me', auth.authMiddleware, async (req, res) => {
  try {
    const user = await db.getUserById(req.userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ success: true, user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: '加载资料失败：' + e.message });
  }
});

// ---------- 更新资料（需登录） ----------
app.put('/me', auth.authMiddleware, async (req, res) => {
  try {
    const { displayName, avatarUrl, bio } = req.body || {};
    const updated = await db.updateUser(req.userId, { displayName, avatarUrl, bio });
    if (!updated) return res.status(404).json({ error: '用户不存在' });
    res.json({ success: true, user: publicUser(updated) });
  } catch (e) {
    res.status(500).json({ error: '更新失败：' + e.message });
  }
});

module.exports = app;

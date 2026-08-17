# 社区系统旧版后端 (community-deepsleep) — Vercel 废弃版

> **状态**: ⚠️ 已废弃,仅保留备用。当前版本为腾讯云 SCF,见 `docs/community/README.md`。

## 基本信息

| 属性 | 值 |
|------|-----|
| **项目目录** | `c:\Users\26516\Desktop\n8n\community-deepsleep` |
| **部署** | Vercel CLI (`vercel --prod`,未推送到 GitHub) |
| **端点** | https://community-deepsleep.vercel.app |
| **数据库** | Neon PostgreSQL |

## 废弃原因

2026-07-30 实测:Vercel 域名在国内手机端/校园网完全不可达(curl 无代理超时 Exit 28),导致社区功能(注册/登录/发帖)全部超时挂起。与立信 LLM API 迁移前完全相同的问题。已迁移至腾讯云 SCF。

## 文件结构

```
community-deepsleep/
├── api/
│   ├── db.js         # Neon PostgreSQL 连接池
│   ├── auth.js       # JWT 认证中间件
│   ├── register.js   # POST /api/register
│   ├── login.js      # POST /api/login
│   ├── me.js         # GET/PUT /api/me
│   ├── posts.js      # GET/POST /api/posts
│   └── init.js       # GET /api/init
├── vercel.json
└── package.json
```

API 接口与 SCF 版一致(见 `docs/community/README.md` 的接口表)。环境变量:`DATABASE_URL` + `JWT_SECRET`。

## 如需重新启用

```bash
cd community-deepsleep
vercel --prod --yes   # 重新部署到 Vercel
```

> 注意:前端 `community.js` 的 `API_BASE` 需同步改回 Vercel 端点。当前不建议,除非 Vercel 网络问题已解决。

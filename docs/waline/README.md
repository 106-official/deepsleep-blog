# DeepSleep 评论系统 (waline-deepsleep)

DeepSleep Blog 的自托管 Waline 评论系统,部署在 Vercel,数据存储于 Neon PostgreSQL。

> 原 README 为 Vercel 官方模板默认内容,2026-08-14 起定制化,文档统一托管在 `docs/waline/README.md`。

## 基本信息

| 属性 | 值 |
|------|-----|
| **项目目录** | `c:\Users\26516\Desktop\n8n\waline-deepsleep` (独立 Git 仓库) |
| **部署** | Vercel Serverless Functions |
| **URL** | https://waline-deepsleep.vercel.app |
| **管理后台** | https://waline-deepsleep.vercel.app/ui (初始化: /ui/setup) |
| **数据库** | Neon PostgreSQL (与社区系统共享) |
| **前端资源** | 已本地化 (`blog-static/static/js/waline.umd.min.js` + `static/css/waline.css`,避免 CDN 被 ORB 阻止) |

## 核心文件

| 文件 | 说明 |
|------|------|
| `index.cjs` | Waline 入口(`require('@waline/vercel')`) |
| `api/lixin-ask.js` | 立信 LLM 问答接口(SSE 流式转发,限速) |
| `vercel.json` | Vercel 构建/路由配置 |
| `waline.pgsql` | PostgreSQL 表结构初始化脚本 |
| `robots.txt` | 爬虫规则 |

## 环境变量 (Vercel)

Neon 集成自动配置:`POSTGRES_HOST` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DATABASE` / `POSTGRES_URL` / `DATABASE_URL` 等。

其他变量:

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `SITE_URL` | `https://deepsleep.fun` | 博客域名 |
| `SECURE_DOMAINS` | `deepsleep.fun,waline-deepsleep.vercel.app` | 安全域名 |
| `JWT_TOKEN` | (加密) | JWT 密钥 |
| `COMMENT_AUDIT` | `false` | 评论审核开关 |

## 本地开发

```bash
cd waline-deepsleep
npm install
vercel dev          # 本地调试 (需要 Vercel CLI + Neon 环境变量)
```

## 部署

```bash
vercel --prod       # 推送生产环境
```

## 数据流

```
用户访问文章 → 加载本地 Waline JS/CSS → Waline.init()
    → API 请求 waline-deepsleep.vercel.app/api/comment
    → Vercel Function 处理 → 查询/写入 Neon PostgreSQL
    → 返回 JSON → 前端渲染评论
```

## 表结构

由 `waline.pgsql` 初始化:`wl_comment`(评论)、`wl_counter`(页面计数)、`wl_users`(用户)。

---

详细配置见 `docs/blog/PROJECT_DOCUMENTATION.md` 第 6 章(评论系统详解)。

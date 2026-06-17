# DeepSleep Blog - 项目技术文档

> **最后更新**: 2026-06-12
> **版本**: v4.0
> **状态**: ✅ 生产就绪 | 🎉 评论系统正常运行 (Neon PostgreSQL)

---

## 📖 目录

1. [项目概述](#-项目概述)
2. [技术架构](#-技术架构)
3. [目录结构](#-目录结构)
4. [核心配置](#-核心配置)
5. [部署环境](#-部署环境)
6. [评论系统详解](#-评论系统详解)
7. [注意事项](#-注意事项)
8. [快速开始](#-快速开始)
9. [故障排查](#-故障排查)
10. [安全与备份](#-安全与备份)
11. [Bug Fix Q&A](#-bug-fix-qa)

---

## 🎯 项目概述

| 属性 | 值 |
|------|-----|
| **项目名称** | DeepSleep Blog |
| **类型** | 个人博客（静态站点） |
| **域名** | https://deepsleep.fun |
| **语言** | 中文（zh-CN） |
| **GitHub** | https://github.com/106-official/deepsleep-blog |

### 功能特性

- 📝 文章发布与管理（Markdown 格式）
- 💬 Waline 评论系统（Neon PostgreSQL + Vercel Serverless）✅
- 🔍 全文搜索（Fuse.js）
- 📱 响应式设计 + 暗色/亮色主题切换
- 🏷️ 标签与分类系统
- ⚡ 零 CDN 依赖（Waline 前端资源完全本地化）

---

## 🏗️ 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────┐
│                    用户浏览器                         │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────────┐
│              GitHub Pages (CDN)                      │
│         https://deepsleep.fun                        │
│    • Hugo 生成的静态 HTML/CSS/JS                    │
│    • 本地化 Waline 资源 (零 CDN 依赖)              │
└──────────────────┬──────────────────────────────────┘
                   │ API 调用
                   ▼
┌─────────────────────────────────────────────────────┐
│   Waline Backend (Vercel Serverless)                │
│      https://waline-deepsleep.vercel.app            │
│    • 评论 CRUD / 用户认证 / 管理后台 (/ui)         │
│    • @waline/vercel 框架                            │
└──────────────────┬──────────────────────────────────┘
                   │ PostgreSQL (SSL)
                   ▼
┌─────────────────────────────────────────────────────┐
│        Neon PostgreSQL (Serverless)                 │
│     Project: wild-sky-70139158                      │
│     Region: US East (aws-us-east-1)                 │
│    • wl_comment (评论)                              │
│    • wl_counter (计数)                              │
│    • wl_users (用户)                                │
└─────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 用途 | 费用 |
|------|------|------|------|
| **前端** | Hugo Extended + PaperMod | 静态站点生成 | 免费 |
| **前端** | Waline Client v3.15.0 (UMD 本地化) | 评论 UI | 免费 |
| **后端** | Vercel Serverless (Hobby) | Waline 评论后端 | 免费 |
| **数据库** | Neon PostgreSQL (Free) | 评论数据存储 | 免费 |
| **托管** | GitHub Pages | 静态站点 CDN | 免费 |
| **CI/CD** | GitHub Actions | 自动部署 | 免费 |

### 关键技术决策

| 决策点 | 选择 | 原因 |
|--------|------|------|
| Waline 前端资源 | 完全本地化 (UMD) | 避免 ORB 安全策略阻止 CDN |
| 数据库 | Neon PostgreSQL | Supabase Supavisor 兼容性问题，Neon 通过 Vercel 集成更稳定 |
| 连接方式 | Pooled Connection | Serverless 环境必须使用连接池 |
| SSL | sslmode=require | Neon 强制要求 SSL 连接 |

---

## 📁 目录结构

```
blog-static/
├── .github/workflows/deploy.yml     # GitHub Actions 自动部署
├── content/
│   ├── posts/                       # 博客文章
│   │   ├── 1.md                     # 竞赛一览
│   │   ├── hello-world.md
│   │   └── welcome.md
│   ├── about.md                     # 关于页面
│   └── forum.md                     # 论坛页面
├── layouts/partials/
│   ├── comments.html                # ⭐ Waline 评论组件
│   ├── extend_footer.html           # 自定义页脚
│   └── extended_head.html           # 自定义头部 (字体/CSS)
├── static/
│   ├── css/
│   │   ├── custom.css               # 自定义样式
│   │   └── waline.css               # Waline 样式 (22KB)
│   ├── js/
│   │   └── waline.umd.min.js        # Waline JS (256KB, 必须完整)
│   └── CNAME                        # 自定义域名
├── themes/PaperMod/                 # 主题 (Git 子模块)
├── hugo.toml                        # ⭐ Hugo 主配置
└── PROJECT_DOCUMENTATION.md         # 本文档

waline-deepsleep/                    # Waline 后端 (独立项目)
├── index.cjs                        # Vercel 入口
├── package/                         # Waline 源码
├── vercel.json                      # Vercel 配置
└── waline.pgsql                     # PostgreSQL 表结构初始化脚本
```

---

## ⚙️ 核心配置

### Hugo 配置 (hugo.toml)

关键配置项：

```toml
baseURL = "https://deepsleep.fun/"
languageCode = "zh-CN"
title = "DeepSleep Blog"
theme = ["PaperMod"]

[params]
  comments = true
  [params.waline]
    serverURL = "https://waline-deepsleep.vercel.app"
    lang = "zh-CN"
    requiredMeta = ["nick", "email"]
    wordLimit = [0, 500]
    pageSize = 10
```

### Waline 后端 (index.cjs)

```javascript
const Application = require('@waline/vercel');
module.exports = Application({ plugins: [] });
```

---

## 🌐 部署环境

### Vercel 环境变量 (waline-deepsleep 项目)

Neon 集成自动配置的变量（Production/Preview/Development）：

| 变量名 | 值 (示例) | 说明 |
|--------|-----------|------|
| `POSTGRES_HOST` | `ep-falling-thunder-atcgsx0w-pooler.c-9.us-east-1.aws.neon.tech` | Neon Pooled 连接 |
| `POSTGRES_USER` | `neondb_owner` | 数据库用户 |
| `POSTGRES_PASSWORD` | `npg_****` | 数据库密码 (敏感) |
| `POSTGRES_DATABASE` | `neondb` | 数据库名 |
| `POSTGRES_URL` | `postgresql://neondb_owner:...sslmode=require` | 完整连接串 |
| `DATABASE_URL` | 同上 (Pooler) | Prisma/ORM 用 |
| `DATABASE_URL_UNPOOLED` | `postgresql://...c-9.us-east-1...sslmode=require` | 直连 (非池化) |
| `PGHOST` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` | 同上 | PG 标准变量 |

其他变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `SITE_URL` | `https://deepsleep.fun` | 博客域名 |
| `SECURE_DOMAINS` | `deepsleep.fun,waline-deepsleep.vercel.app` | 安全域名 |
| `ALLOWED_DOMAINS` | `*` | 允许的域名 |
| `JWT_TOKEN` | (加密) | JWT 密钥 |
| `COMMENT_AUDIT` | `false` | 评论审核开关 |

### Neon 数据库

| 属性 | 值 |
|------|-----|
| **项目 ID** | `wild-sky-70139158` |
| **资源名** | `neon-indigo-desert` |
| **区域** | AWS US East 1 |
| **数据库** | `neondb` |
| **用户** | `neondb_owner` |
| **Dashboard** | https://console.neon.tech/ |

### 数据库表结构

由 `waline.pgsql` 初始化，三张表：

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `wl_comment` | 评论数据 | id, user_id, comment, nick, mail, url, pid, rid, status, like, ua, ip |
| `wl_counter` | 页面计数 | id, url, time, reaction0-8 |
| `wl_users` | 用户信息 | id, display_name, email, password, type, avatar, github, qq 等 |

---

## 💬 评论系统详解

### 数据流

```
用户访问文章 → 加载本地 Waline JS/CSS → 初始化 Waline.init()
    → API 请求 waline-deepsleep.vercel.app/api/comment
    → Vercel Function 处理 → 查询/写入 Neon PostgreSQL
    → 返回 JSON → 前端渲染评论
```

### Waline 适配器环境变量检测逻辑

Waline 通过 `PG_DB || POSTGRES_DATABASE` 判断使用 PostgreSQL：

```javascript
// adapter.js 中的关键逻辑
if (PG_DB || POSTGRES_DATABASE) {
  type = 'postgresql';  // 自动选择 PostgreSQL 适配器
}

// SSL 自动检测
ssl: POSTGRES_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : null
```

Neon 集成配置的 `POSTGRES_URL` 包含 `sslmode=require`，SSL 自动启用。

### 管理后台

- 初始化: https://waline-deepsleep.vercel.app/ui/setup
- 管理: https://waline-deepsleep.vercel.app/ui

---

## ⚠️ 注意事项

### 数据库相关

1. **Neon Free Tier 限制**:
   - 计算时间: 每月 300 Active Compute Hours
   - 存储: 10 GiB
   - 分支: 10 个
   - **自动挂起**: 数据库在 5 分钟无活动后会挂起 (Suspend-on-idle)
   - 挂起后首次请求会有冷启动延迟 (~1-2 秒)

2. **连接方式**:
   - **必须使用 Pooled Connection** (`-pooler.` 地址) 用于 Vercel Serverless
   - Unpooled 连接仅用于直接管理操作 (如导入表结构)
   - Vercel Serverless 每次请求创建新连接，不使用连接池会导致连接耗尽

3. **SSL**:
   - Neon 强制要求 SSL 连接
   - Waline 适配器通过 `POSTGRES_URL` 中的 `sslmode=require` 自动启用
   - 连接配置: `{ rejectUnauthorized: false }`

4. **表结构**:
   - 部署新 Waline 实例时，**必须先导入 `waline.pgsql` 初始化表**
   - 仅配置环境变量不够，数据库不会自动创建表
   - 初始化脚本: `waline-deepsleep/waline.pgsql`

### 前端相关

5. **Waline JS 文件完整性**:
   - `static/js/waline.umd.min.js` 必须约 256KB (262,241 bytes)
   - 如果文件只有 18KB，说明下载了损坏版本，需重新下载
   - 验证: `(Get-Item "static/js/waline.umd.min.js").Length`

6. **Waline 版本更新**:
   - 前端资源为本地化，不会自动更新
   - 更新需手动下载新版本 CSS/JS 并替换

7. **SECURE_DOMAINS 配置**:
   - 必须包含博客域名和 Waline 后端域名
   - 否则 API 请求会被 403 拒绝

### 部署相关

8. **Vercel 环境变量修改后需重新部署**:
   - 修改环境变量后，必须 Redeploy 才能生效
   - 可通过 `vercel --prod` 命令行触发

9. **Neon 集成管理**:
   - 通过 `vercel integration ls` 查看集成状态
   - 通过 Vercel Dashboard → Integrations 管理 Neon 连接

10. **Supabase 已弃用**:
    - 之前使用的 Supabase PostgreSQL 因 Supavisor 兼容性问题已弃用
    - 所有 Supabase 相关环境变量 (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) 可安全删除
    - 旧连接格式 (`aws-0-ap-southeast-1.pooler.supabase.com`) 已不再使用

---

## 🚀 快速开始

### 本地开发

```bash
cd blog-static
git submodule update --init --recursive
hugo server -D
# 访问 http://localhost:1313
```

### 发布文章

```bash
# 创建文章
hugo new posts/my-post.md

# 编辑后推送
git add .
git commit -m "feat: add new post"
git push origin main
# GitHub Actions 自动构建部署 (~3 分钟)
```

### Waline 后端部署

```bash
cd waline-deepsleep
vercel --prod
```

---

## 🐛 故障排查

### 速查表

| 问题现象 | 可能原因 | 解决方案 |
|---------|---------|---------|
| 评论区不显示 | Front Matter 缺少 `comments: true` | 文章 md 添加 |
| Waline is not defined | JS 文件损坏 (仅18KB) | 重新下载完整版 (256KB) |
| API 返回 500 | 数据库连接失败 | 检查 POSTGRES_* 变量 |
| API 返回 403 | SECURE_DOMAINS 未配置 | 添加博客域名 |
| 评论提交后无数据 | 数据库缺少表 | 导入 waline.pgsql |
| 首次请求慢 | Neon 冷启动 | 正常现象，后续请求快 |
| ENOIDENTIFIER | Supavisor 租户识别失败 | 已迁移到 Neon，不再使用 Supabase |

### 验证评论 API

```powershell
# 读取评论
$headers = @{ Referer = "https://deepsleep.fun" }
Invoke-RestMethod -Uri "https://waline-deepsleep.vercel.app/api/comment?type=preview&path=/test" -Headers $headers

# 提交评论
$body = @{ nick = "Test"; mail = "test@test.com"; comment = "Hello"; url = "/test" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://waline-deepsleep.vercel.app/api/comment" -Method Post -Headers $headers -Body $body -ContentType "application/json"
```

### 验证数据库连接

```bash
# 使用 Node.js + pg 包
node -e "
const {Client} = require('pg');
const c = new Client({connectionString: 'postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require'});
c.connect().then(() => c.query('SELECT count(*) FROM wl_comment')).then(r => console.log(r.rows)).finally(() => c.end());
"
```

---

## 🔒 安全与备份

### 安全要点

- ❌ 绝不提交密码/密钥到 Git
- ✅ Vercel 环境变量标记为 Sensitive
- ✅ Neon 强制 SSL 连接
- ✅ SECURE_DOMAINS 限制来源

### 备份策略

| 数据 | 方式 | 频率 |
|------|------|------|
| 网站源码 | Git (GitHub) | 每次 commit |
| 评论数据 | Neon 自动备份 | 持续 |
| 环境变量 | Vercel 部署历史 | 每次部署 |

### 手动备份数据库

```bash
# 使用 pg_dump (需安装 PostgreSQL 客户端)
pg_dump "postgresql://neondb_owner:PASSWORD@ep-xxx.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require" > backup.sql
```

---

## 📌 快速参考

### 关键 URL

| 服务 | URL |
|------|-----|
| 博客 | https://deepsleep.fun |
| Waline 后端 | https://waline-deepsleep.vercel.app |
| Waline 管理 | https://waline-deepsleep.vercel.app/ui |
| Neon Dashboard | https://console.neon.tech/ |
| Vercel Dashboard | https://vercel.com/dashboard |
| GitHub 仓库 | https://github.com/106-official/deepsleep-blog |

### 关键文件

| 文件 | 位置 | 说明 |
|------|------|------|
| 评论组件 | `blog-static/layouts/partials/comments.html` | Waline 前端 |
| Waline JS | `blog-static/static/js/waline.umd.min.js` | 256KB, 必须完整 |
| Waline CSS | `blog-static/static/css/waline.css` | 22KB |
| Hugo 配置 | `blog-static/hugo.toml` | 主配置 |
| Waline 入口 | `waline-deepsleep/index.cjs` | 后端入口 |
| 表结构 | `waline-deepsleep/waline.pgsql` | 数据库初始化 |
| 适配器配置 | `waline-deepsleep/package/src/config/adapter.js` | 数据库连接逻辑 |

---

## 📝 更新日志

### v4.0 (2026-06-12) - 数据库迁移至 Neon

- ✅ 从 Supabase PostgreSQL 迁移到 Neon PostgreSQL
- ✅ 通过 Vercel Neon 集成自动配置环境变量
- ✅ 导入 waline.pgsql 初始化表结构
- ✅ 验证评论读写功能正常
- ✅ 清理 Supabase 相关过时文档
- ✅ 重构项目文档，补充注意事项

### v3.0 (2026-06-02) - 评论系统修复

- ✅ 修复 Waline JS 文件损坏问题
- ✅ 本地化 Waline 前端资源 (零 CDN 依赖)
- ✅ 修复 Supabase Supavisor 连接问题
- ✅ 导入数据库表结构

### v1.0 (2026-05-31) - 初始版本

- ✅ Hugo + PaperMod 博客搭建
- ✅ Waline 评论系统集成
- ✅ GitHub Actions 自动部署

---

*文档结束 | 最后更新: 2026-06-12 | 版本: v4.0 | 状态: ✅ 生产就绪*

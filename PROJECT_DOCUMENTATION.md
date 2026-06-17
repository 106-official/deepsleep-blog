# DeepSleep Blog - 项目技术文档

> **最后更新**: 2026-06-17
> **版本**: v5.1
> **状态**: ✅ 生产就绪 | 🎉 评论系统正常运行 (Neon PostgreSQL) | 💬 社区系统已上线

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
- 💬 **社区论坛系统**（用户注册/登录 + 发帖）✅ v5.1 新增
- 🔍 全文搜索（Fuse.js）
- 🏷️ 标签与分类系统
- 📦 资源分享板块（独立分区）
- 👤 个人技能展示页
- 📚 归档与搜索页面
- 📱 响应式设计 + 暗色/亮色主题切换
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
│    • 社区前端 (community.css + community.js)        │
└──────┬──────────────────┬─────────────────────────┘
       │ API 调用           │ API 调用
       ▼                   ▼
┌──────────────────┐ ┌──────────────────────────────────┐
│  Waline Backend   │ │   Community Backend (Vercel)      │
│  (Vercel)         │ │   https://community-deepsleep     │
│                  │ │   .vercel.app                     │
│ • 评论 CRUD       │ │ • /api/register 用户注册          │
│ • 用户认证        │ │ • /api/login 登录                │
│ • 管理后台 (/ui)  │ │ • /api/me 个人资料              │
│                  │ │ • /api/posts 帖子 CRUD            │
└────────┬─────────┘ └──────────────┬─────────────────┘
         │                            │
         └────────────┬───────────────┘
                      │ PostgreSQL (SSL)
                      ▼
┌─────────────────────────────────────────────────────┐
│        Neon PostgreSQL (Serverless)                 │
│     Project: wild-sky-70139158                      │
│     Region: US East (aws-us-east-1)                 │
│                                                      │
│  Waline 表:          Community 表:                   │
│  • wl_comment (评论)  • community_users (社区用户)    │
│  • wl_counter (计数)  • community_posts (帖子)        │
│  • wl_users (用户)                                    │
└─────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 用途 | 费用 |
|------|------|------|------|
| **前端** | Hugo Extended + PaperMod | 静态站点生成 | 免费 |
| **前端** | Waline Client v3.15.0 (UMD 本地化) | 评论 UI | 免费 |
| **前端** | 原生 JS (community.js) | 社区交互逻辑 | 免费 |
| **后端** | Vercel Serverless (Hobby) | Waline 评论后端 | 免费 |
| **后端** | Vercel Serverless + Node.js (Express) | 社区系统 API | 免费 |
| **数据库** | Neon PostgreSQL (Free) | 评论 + 社区数据存储 | 免费 |
| **认证** | JWT (jsonwebtoken) | 社区用户认证 | 免费 |
| **加密** | bcryptjs | 密码哈希 | 免费 |
| **托管** | GitHub Pages | 静态站点 CDN | 免费 |
| **CI/CD** | GitHub Actions | 自动部署 | 免费 |

### 关键技术决策

| 决策点 | 选择 | 原因 |
|--------|------|------|
| Waline 前端资源 | 完全本地化 (UMD) | 避免 ORB 安全策略阻止 CDN |
| 数据库 | Neon PostgreSQL | Supabase Supavisor 兼容性问题，Neon 通过 Vercel 集成更稳定 |
| 连接方式 | Pooled Connection | Serverless 环境必须使用连接池 |
| SSL | sslmode=require | Neon 强制要求 SSL 连接 |
| 社区认证方式 | JWT Token (7天有效期) | 无状态，适合 Serverless，无需 Session 存储 |
| 社区注册方式 | 邮箱+密码（非手机号） | 无需短信服务，降低成本和复杂度 |
| 社区页面渲染 | Hugo 布局模板（非 Markdown 内嵌 HTML） | 避免 Goldmark 转义 HTML 标签为代码块 |
| CSS 优先级策略 | `!important` + 内联 `style.display` | 解决 PaperMod 全局样式覆盖社区组件的问题 |

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
│   ├── me.md                        # 个人技能展示页
│   ├── community.md                 # ⭐ 社区论坛页 (layout: community)
│   ├── archives.md                  # 归档页面 (layout: archives)
│   ├── search.md                    # 搜索页面 (layout: search)
│   ├── forum.md                     # 论坛页面
│   └── resources/                   # 资源分享板块
│       └── _index.md                # 板块首页
├── layouts/
│   ├── partials/
│   │   ├── comments.html            # Waline 评论组件
│   │   ├── extend_footer.html       # 自定义页脚
│   │   └── extended_head.html       # 自定义头部 (字体/CSS)
│   └── _default/
│       └── community.html           # ⭐ 社区布局模板 (Hugo 原生 HTML)
├── static/
│   ├── css/
│   │   ├── custom.css               # 自定义样式
│   │   ├── waline.css               # Waline 样式 (22KB)
│   │   └── community.css            # ⭐ 社区样式 (含夜间模式)
│   ├── js/
│   │   ├── waline.umd.min.js        # Waline JS (256KB, 必须完整)
│   │   └── community.js             # ⭐ 社区交互逻辑 (认证/发帖/列表)
│   └── CNAME                        # 自定义域名
├── themes/PaperMod/                 # 主题 (Git 子模块)
├── hugo.toml                        # Hugo 主配置
└── PROJECT_DOCUMENTATION.md         # 本文档

waline-deepsleep/                    # Waline 后端 (独立项目，Vercel 部署)
├── index.cjs                        # Vercel 入口
├── package/                         # Waline 源码
├── vercel.json                      # Vercel 配置
└── waline.pgsql                     # PostgreSQL 表结构初始化脚本

community-deepsleep/                 # ⭐ 社区后端 (独立项目，Vercel 部署) v5.1 新增
├── api/
│   ├── db.js                        # 数据库连接与初始化
│   ├── auth.js                      # JWT 认证中间件
│   ├── register.js                  # 用户注册 API
│   ├── login.js                     # 用户登录 API
│   ├── me.js                        # 个人资料 API (GET/PUT)
│   ├── posts.js                     # 帖子 CRUD API (GET/POST)
│   └── init.js                      # 数据库表初始化 API
├── package.json                     # 依赖配置 (pg, bcryptjs, jsonwebtoken)
└── vercel.json                      # Vercel Serverless 配置
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

**Waline 表**（由 `waline.pgsql` 初始化）：

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `wl_comment` | 评论数据 | id, user_id, comment, nick, mail, url, pid, rid, status, like, ua, ip |
| `wl_counter` | 页面计数 | id, url, time, reaction0-8 |
| `wl_users` | 用户信息 | id, display_name, email, password, type, avatar, github, qq 等 |

**Community 表**（v5.1 新增，由社区后端自动初始化）：

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `community_users` | 社区用户 | id, email, password_hash, display_name, avatar_url, bio, role |
| `community_posts` | 社区帖子 | id, user_id, title, content, category, status, view_count, like_count |

### Vercel 环境变量 (community-deepsleep 项目) v5.1 新增

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | Neon PostgreSQL 连接串 (同 Waline 项目) | 共享同一数据库实例 |
| `JWT_SECRET` | JWT 签名密钥 | 用于生成/验证用户 Token |

### Community API 接口

| 方法 | 路径 | 功能 | 认证 |
|------|------|------|------|
| POST | `/api/register` | 用户注册（邮箱+密码+昵称） | 否 |
| POST | `/api/login` | 用户登录（返回 JWT） | 否 |
| GET | `/api/me` | 获取当前用户信息 | ✅ Bearer Token |
| PUT | `/api/me` | 更新个人资料（昵称/头像/简介） | ✅ Bearer Token |
| GET | `/api/posts` | 获取帖子列表（分页+分类筛选） | 否 |
| POST | `/api/posts` | 发布新帖子 | ✅ Bearer Token |

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
| **社区后端** | **https://community-deepsleep.vercel.app** |
| **社区页面** | **https://deepsleep.fun/community/** |
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
| ⭐ 社区布局模板 | `blog-static/layouts/_default/community.html` | 社区页面 HTML |
| ⭐ 社区样式 | `blog-static/static/css/community.css` | 社区 UI + 夜间模式 |
| ⭐ 社区交互逻辑 | `blog-static/static/js/community.js` | 认证/发帖/列表 |
| ⭐ 社区内容页 | `blog-static/content/community.md` | 声明 layout: community |
| ⭐ 社区后端 API | `community-deepsleep/api/` | 全部 API 端点 |

---

## 📚 Bug Fix Q&A

### Bug Fix 1: 归档/搜索页面为空 (2026-06-12)

**❓ Problem**: 导航菜单中的「归档」和「搜索」页面打开后内容为空

**Symptoms**:
- 访问 `/archives/` 和 `/search/` 页面无任何文章列表或搜索框
- 页面只显示空白，没有报错

---

### 🔍 Root Cause Analysis

**Technical Root Cause**:
PaperMod 主题需要对应的内容文件（`.md`）来触发布局模板渲染。虽然 `hugo.toml` 中配置了导航菜单链接到 `/archives/` 和 `/search/`，但 `content/` 目录下缺少对应的文件：
- 缺少 `content/archives.md`（声明 `layout: archives`）
- 缺少 `content/search.md`（声明 `layout: search`）

没有这些文件，Hugo 不知道使用哪个模板，导致输出空页面。

---

### ✅ Solution

1. **创建归档页面**: [`content/archives.md`](content/archives.md)
   ```yaml
   ---
   title: "归档"
   layout: "archives"
   summary: "archives"
   ---
   ```

2. **创建搜索页面**: [`content/search.md`](content/search.md)
   ```yaml
   ---
   title: "搜索"
   layout: "search"
   placeholder: "输入关键词搜索..."
   ---
   ```

3. **修复 .gitignore**: 将 `resources/` 改为 `/resources/`，避免误忽略 `content/resources/` 目录

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `content/archives.md` | 新建 |
| `content/search.md` | 新建 |
| `.gitignore` | `resources/` → `/resources/` |

---

### 🧪 Verification

- ✅ 本地构建生成 36 个页面（+2）
- ✅ `public/archives/index.html` 包含 `archive-year-header` 和 3 篇文章
- ✅ `public/search/index.html` 包含 `searchInput`
- ✅ `public/index.json` 搜索索引包含所有文章
- ✅ 线上验证返回 200 且内容正确

**💡 Prevention**: PaperMod 特殊页面（archives/search）必须手动创建 content 文件，仅靠菜单配置不够。

---

### Bug Fix 2: 关于/我页面显示原始 Front Matter 代码 (2026-06-12)

**❓ Problem**: 「关于」和「我」页面的标题区域显示原始 YAML 代码

**Symptoms**:
- 标题显示为 `title: "关于我" date: 2026-06-12 layout: single`
- 而非正常的页面标题

---

### 🔍 Root Cause Analysis

**Technical Root Cause**:
Hugo 的 Front Matter 必须用三个短横线 `---` 作为分隔符。两个文件的分隔符写错了：

| 位置 | 错误写法 | 正确写法 |
|------|---------|---------|
| 开头 | `***` | `---` |
| 结尾 | `--------------` | `---` |

Hugo 无法识别错误的分隔符，将整个 YAML 头部当作正文内容原样输出。

---

### ✅ Solution

修正 [`content/about.md`](content/about.md) 和 [`content/me.md`](content/me.md) 的 Front Matter 分隔符为标准格式 `---`。

**💡 Prevention**: Hugo Front Matter 格式严格固定——必须是且只能是三个短横线 `---`，前后各一行。

---

### Bug Fix 3: Waline 评论系统夜间模式不生效 (2026-06-12)

**❓ Problem**: 博客切换夜间模式后，评论组件仍显示白色背景

**Symptoms**:
- 评论输入框、评论卡片在夜间模式下保持白底黑字
- 与博客整体暗色风格不协调

---

### 🔍 Root Cause Analysis

**Technical Root Cause**:
虽然 Waline 配置中已有 `dark: 'html[data-theme="dark"]'`，但缺少两处关键样式：

1. **自定义样式缺失**: [`comments.html`](layouts/partials/comments.html) 中没有 `[data-theme="dark"]` 选择器的样式覆盖
2. **Waline CSS 变量缺失**: [`waline.css`](static/css/waline.css) 中没有定义夜间模式的 CSS 变量

PaperMod 切换夜间模式时会在 `<html>` 添加 `data-theme="dark"` 属性，但 Waline 组件的背景、边框、文字颜色没有被覆盖。

---

### ✅ Solution

1. **comments.html 新增夜间模式样式覆盖**:
   - 评论容器背景: `#ffffff` → `#181818`
   - 输入框背景/文字: 白色 → `#222` / `#e0e0e0`
   - 评论卡片背景: `#fafafa` → `#222`
   - 标题/提示文字: 深色 → 浅灰

2. **waline.css 新增夜间模式变量**:
   ```css
   [data-theme="dark"]{
     --waline-color:#ccc;--waline-bg-color:#1e1e1e;
     --waline-bg-color-light:#2a2a2a;--waline-border-color:#444;
     ...
   }
   ```

**💡 Prevention**: 添加自定义组件时需同时考虑日间/夜间两种主题的样式适配。

---

### Bug Fix 4: Git 推送 GitHub 持续失败 (2026-06-12)

**❓ Problem**: `git push origin main` 反复超时或连接重置

**Error Messages**:
```
fatal: unable to access 'https://github.com/...': Failed to connect to github.com port 443 after 21074 ms
fatal: unable to access 'https://github.com/...': Recv failure: Connection was reset
```

---

### 🔍 Root Cause Analysis

**Technical Root Cause**:
1. 用户网络环境需要代理才能访问 GitHub 443 端口
2. Git 未配置代理设置，直连 GitHub 超时
3. 系统代理端口为 `127.0.0.1:65532`（通过注册表确认），但 git 未使用

**Discovery Method**:
```powershell
Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
# ProxyEnable: 1, ProxyServer: http://127.0.0.1:65532
```

---

### ✅ Solution

配置 Git 全局代理指向系统代理端口：

```bash
git config --global http.proxy http://127.0.0.1:65532
git config --global https.proxy http://127.0.0.1:65532
```

**💡 Prevention**: 在需要代理的网络环境下，首次使用 Git 前应检查并配置代理。可通过 `git config --global --list | grep proxy` 验证当前配置。

---

### Bug Fix 5: 社区页面 HTML 被当作代码显示 (2026-06-17)

**❓ Problem**: 社区页面 (`/community/`) 的注册/登录表单 HTML 标签被当作纯文本显示

**Symptoms**:
- 页面显示原始 HTML 代码：`<div id="login-error" class="c-error"></div>`
- 注册/登录表单无法渲染，只看到标签文本

---

### 🔍 Root Cause Analysis

**Technical Root Cause**:
Hugo 的 Goldmark Markdown 渲染器将 `.md` 文件中的原始 HTML 标签包裹在 `<pre><code>` 中并转义 `<>` 为 `&lt;&gt;`。即使配置了 `unsafe = true`，某些复杂 HTML 结构仍会被错误处理。

**Discovery Method**:
- 用户截图反馈页面显示原始 HTML 代码
- 本地构建输出确认存在 `<pre><code>` 包裹

---

### ✅ Solution

将所有 HTML 从 `.md` 文件移至 **Hugo 布局模板**：

1. **简化 content 文件**: [`content/community.md`](content/community.md) 只保留 Front Matter + `layout: community`
2. **创建布局模板**: [`layouts/_default/community.html`](layouts/_default/community.html) — 所有 HTML 放在 `{{ define "main" }}` 块中
3. 模板中的 HTML 被 Hugo **原样输出**，不会被转义或包裹在代码块中

**💡 Prevention**: 当 Hugo 页面需要大量自定义 HTML 时（如表单、交互组件），应使用布局模板而非 Markdown 内嵌 HTML。

---

### Bug Fix 6: 社区登录/注册表单不显示 (2026-06-17)

**❓ Problem**: 社区页面的「登录」和「注册」Tab 切换后，表单输入框消失不可见

**Symptoms**:
- Tab 切换正常（高亮变化），但下方表单区域空白
- 登录表单默认也不显示

---

### 🔍 Root Cause Analysis

**Technical Root Cause**:
PaperMod 主题的全局 CSS 样式优先级高于社区组件的 `.auth-form { display: none }` / `.auth-form.active { display: block }`，导致 `display` 属性被覆盖，表单始终隐藏。

---

### ✅ Solution

三重保障策略：

1. **CSS `!important`**: [community.css](static/css/community.css) 中添加 `!important`
   ```css
   .auth-form { display: none !important; }
   .auth-form.active { display: block !important; }
   ```

2. **内联初始样式**: 登录表单添加 `style="display:block"` 确保默认可见

3. **JS 双重切换**: [community.js](static/js/community.js) 的 `switchTab()` 同时操作 `classList` 和内联 `style.display`
   ```javascript
   f.style.display = 'none';          // 隐藏所有
   targetForm.style.display = 'block'; // 显示目标
   ```

同时修复了注册表单的重复 `id` 属性（`id="reg-form"` 和 `id="register"` 冲突）。

**💡 Prevention**: 在 PaperMod 等主题中嵌入自定义组件时，CSS 需使用 `!important` 或更高优先级选择器来覆盖主题全局样式。

---

## 📝 更新日志

### v5.1 (2026-06-17) - 社区论坛系统上线

**新增功能**:
- ✅ **社区论坛系统** — 用户注册/登录 + 发帖 + 帖子列表
- ✅ **社区后端** (community-deepsleep) — Express + Neon PostgreSQL，部署在 Vercel
- ✅ **用户认证** — 邮箱+密码注册，JWT Token 认证（7天有效期）
- ✅ **个人资料** — 头像、昵称、简介编辑
- ✅ **帖子系统** — 发布/列表/分页/分类筛选（日常交流/技术分享/资源分享/问题求助）
- ✅ **夜间模式** — 社区组件完整适配暗色主题
- ✅ **资源板块** — 4 篇资源帖（Adobe 全家桶、Stata19 MP、Amos 29、Stata OLS 遍历）
- ✅ **个人技能页** (`/me/`) — Stata/SPSS/Amos 等技能展示
- ✅ **归档/搜索页面** — 修复为空问题

**Bug 修复**:
- ✅ 修复社区页面 HTML 被当作代码显示（改用 Hugo 布局模板）
- ✅ 修复社区登录/注册表单不显示（CSS `!important` + 内联样式双重保障）

**技术决策记录**:
- 选择邮箱注册而非手机号（无需短信服务）
- 使用布局模板而非 Markdown 内嵌 HTML（避免 Goldmark 转义）
- CSS `!important` 策略对抗 PaperMod 全局样式覆盖

### v5.0 (2026-06-12) - 功能扩展与问题修复

**新增功能**:
- ✅ 归档页面 (`/archives/`) — 按年份/月份分组展示文章
- ✅ 搜索页面 (`/search/`) — Fuse.js 全文模糊搜索
- ✅ 资源板块 (`/resources/`) — 资源分享分区，含 4 篇资源帖
- ✅ 个人技能页 (`/me/`) — Stata/SPSS/Amos 等技能展示
- ✅ Waline 评论系统夜间模式适配

**Bug 修复**:
- ✅ 修复归档/搜索页面为空（缺少 content 文件）
- ✅ 修复关于/我页面显示原始 Front Matter（分隔符错误）
- ✅ 修复 .gitignore 误忽略 `content/resources/` 目录
- ✅ 配置 Git 代理解决 GitHub 推送超时

**文档更新**:
- ✅ 新增 Bug Fix Q&A 章节（4 条记录）
- ✅ 更新目录结构、注意事项

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

*文档结束 | 最后更新: 2026-06-17 | 版本: v5.1 | 状态: ✅ 生产就绪*

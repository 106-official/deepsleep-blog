# DeepSleep Blog - 项目技术文档

> **最后更新**: 2026-07-30
> **版本**: v5.4
> **状态**: ✅ 生产就绪 | 评论系统正常运行 (Neon PostgreSQL) | 💬 社区系统已上线 | 👤 全局个人中心 | 📝 文章板块整合 | 🧹 停用项目资料已清理

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
- 👤 **全局个人中心**（导航栏个人按钮 + Modal 弹窗）✅ v5.2 新增
- 📝 **文章板块整合**（社区帖子与博客文章混合展示）✅ v5.2 新增
- 🖼️ **作者信息显示**（帖子/文章卡片显示头像+名称）✅ v5.2 新增
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
│  ┌─────────────────────────────────────────────┐   │
│  │ 导航栏: [菜单项...] [👤 个人按钮] (全局)     │   │
│  └─────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────────┐
│              GitHub Pages (CDN)                      │
│         https://deepsleep.fun                        │
│    • Hugo 生成的静态 HTML/CSS/JS                    │
│    • 本地化 Waline 资源 (零 CDN 依赖)              │
│    • 社区前端 (community.css + community.js)        │
│    • 全局个人中心弹窗 (extend_footer.html)          │
│    • 文章列表页 (/posts/) 整合社区帖子             │
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
│                  │ │ ✅ CORS: 代码级跨域配置            │
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

📝 文章板块数据流:
/posts/ 页面 → 加载社区帖子 (API) + 博客文章 (Hugo)
         → 混合展示在统一网格布局中
         → 每个卡片显示作者头像+名称
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
| **CORS 配置** | **代码级响应头** (v5.2) | **vercel.json Headers 对 Serverless Functions 不生效** |
| **全局个人中心** | **Modal 弹窗 + 全局注入** (v5.2) | **所有页面可访问，无需重复实现** |
| **文章板块整合** | **API 动态加载 + Hugo 静态混合** (v5.2) | **社区帖子与博客文章统一展示，提升用户体验** |

---

## 📁 目录结构

```
blog-static/
├── .github/workflows/deploy.yml     # GitHub Actions 自动部署
├── content/
│   ├── posts/                       # 博客文章
│   │   ├── _index.md               # ⭐ 文章列表页 (layout: posts) v5.2 新增
│   │   ├── 1.md                     # 竞赛一览
│   │   ├── hello-world.md
│   │   └── welcome.md
│   ├── about.md                     # 关于页面
│   ├── me.md                        # 个人技能展示页
│   ├── community.md                 # 社区论坛页 (layout: community)
│   ├── archives.md                  # 归档页面 (layout: archives)
│   ├── search.md                    # 搜索页面 (layout: search)
│   └── resources/                   # 资源分享板块
│       └── _index.md                # 板块首页
├── layouts/
│   ├── partials/
│   │   ├── comments.html            # Waline 评论组件
│   │   ├── extend_footer.html       # ⭐ 全局功能（个人弹窗 + JS）v5.2 更新
│   │   └── extended_head.html       # ⭐ 全局样式（个人按钮 + 弹窗样式）v5.2 更新
│   └── _default/
│       ├── community.html           # 社区布局模板
│       └── posts.html              # ⭐ 文章列表布局模板 v5.2 新增
├── static/
│   ├── css/
│   │   ├── custom.css               # 自定义样式
│   │   ├── waline.css               # Waline 样式 (22KB)
│   │   └── community.css            # 社区样式 (含夜间模式 + 个人按钮)
│   ├── js/
│   │   ├── waline.umd.min.js        # Waline JS (256KB, 必须完整)
│   │   └── community.js             # ⭐ 社区交互逻辑 + 全局个人中心函数 v5.2 更新
│   └── CNAME                        # 自定义域名
├── themes/PaperMod/                 # 主题 (Git 子模块)
├── hugo.toml                        # Hugo 主配置 (已移除论坛菜单)
└── PROJECT_DOCUMENTATION.md         # 本文档

waline-deepsleep/                    # Waline 后端 (独立项目，Vercel 部署)
├── index.cjs                        # Vercel 入口
├── package/                         # Waline 源码
├── vercel.json                      # Vercel 配置
└── waline.pgsql                     # PostgreSQL 表结构初始化脚本

community-deepsleep/                 # 社区后端 (独立项目，Vercel 部署) v5.1 新增
├── api/
│   ├── db.js                        # 数据库连接与初始化
│   ├── auth.js                      # JWT 认证中间件
│   ├── register.js                  # 用户注册 API ✅ CORS 已添加
│   ├── login.js                     # 用户登录 API ✅ CORS 已添加
│   ├── me.js                        # 个人资料 API (GET/PUT) ✅ CORS 已添加
│   ├── posts.js                     # 帖子 CRUD API (GET/POST) ✅ CORS 已添加
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

### CORS 跨域相关 (v5.2 重要)

11. **CORS 配置必须使用代码级响应头**:
    - ❌ `vercel.json` 中的 Headers 配置对 Serverless Functions **不生效**
    - ✅ 必须在每个 API 路由文件中手动设置 CORS 头：
      ```javascript
      function setCorsHeaders(req, res) {
        res.setHeader('Access-Control-Allow-Origin', 'https://deepsleep.fun');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
      }
      
      module.exports = async (req, res) => {
        setCorsHeaders(req, res);
        
        if (req.method === 'OPTIONS') {
          return res.status(200).end();  // 处理预检请求
        }
        
        // ... 正常业务逻辑
      };
      ```

12. **浏览器 "Failed to fetch" 错误排查**:
    - 检查 1: 确认 API 路由已添加 CORS 头（见第11条）
    - 检查 2: 使用浏览器 DevTools → Network 标签查看 OPTIONS/POST 请求状态
    - 检查 3: 确认响应头包含 `Access-Control-Allow-Origin: https://deepsleep.fun`
    - 检查 4: 如果仍失败，检查 Vercel 函数是否正确部署（`vercel --prod`）

13. **全局组件注入注意事项** (v5.2):
    - `extend_footer.html` 中通过 JS 动态创建 DOM 元素时，必须等待 DOMContentLoaded 事件
    - 全局函数（如 `toggleGlobalProfile`）必须挂载到 `window` 对象才能在 HTML onclick 中调用
    - 社区 JS (`community.js`) 必须在全局脚本之前加载（因为依赖 `getUser()`、`api()` 等函数）

14. **论坛版块已移除** (v5.2):
    - `content/forum.md` 文件已删除
    - `hugo.toml` 中论坛菜单配置已移除
    - 如需恢复，需重新创建文件并添加菜单项

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
| **文章板块** (v5.2) | **https://deepsleep.fun/posts/** |
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
| 社区布局模板 | `blog-static/layouts/_default/community.html` | 社区页面 HTML |
| **文章列表模板** (v5.2) | **`blog-static/layouts/_default/posts.html`** | **文章+帖子混合展示** |
| 社区样式 | `blog-static/static/css/community.css` | 社区 UI + 夜间模式 + 个人按钮 |
| 社区交互逻辑 | `blog-static/static/js/community.js` | 认证/发帖/列表 + 全局个人中心 |
| 社区内容页 | `blog-static/content/community.md` | 声明 layout: community |
| **全局头部** (v5.2) | **`blog-static/layouts/partials/extended_head.html`** | **全局样式 + 个人弹窗样式** |
| **全局页脚** (v5.2) | **`blog-static/layouts/partials/extend_footer.html`** | **个人弹窗 HTML + 全局JS** |
| 社区后端 API | `community-deepsleep/api/` | 全部 API 端点（含 CORS） |

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

### Bug Fix 7: 社区注册 API "Failed to fetch" CORS 错误 (2026-06-17)

**❓ Problem**: 社区页面注册/登录功能报错 "Failed to fetch"

**Symptoms**:
- 浏览器控制台显示: `net::ERR_FAILED https://community-deepsleep.vercel.app/api/register`
- Network 标签显示 OPTIONS 预检请求失败
- 命令行 curl 测试 API 正常返回数据

**Environment Context**:
- Date: 2026-06-17
- Affected Component: Community Backend (Vercel Serverless Functions)
- Error Log: `CORS policy blocked: No 'Access-Control-Allow-Origin' header`

---

### 🔍 Root Cause Analysis

**Technical Root Cause**:
1. **vercel.json Headers 配置对 Serverless Functions 不生效**: Vercel 的 `headers` 配置仅适用于静态资源和边缘函数，不适用于 Serverless Functions (API Routes)
2. **缺少代码级 CORS 头**: 所有 API 路由文件 (`register.js`, `login.js`, `posts.js`, `me.js`) 未手动设置 CORS 响应头
3. **浏览器同源策略阻止**: 前端 (`deepsleep.fun`) 与后端 (`community-deepsleep.vercel.app`) 跨域请求被浏览器拦截

**Discovery Method**:
- 使用 Browser Agent 进行实际浏览器测试
- DevTools Network 标签确认 OPTIONS 请求无 CORS 头
- 对比命令行测试（成功）与浏览器请求（失败）的差异

**Why It Failed**:
```
Browser → OPTIONS /api/register → Vercel Function
         ↓
Response 缺少 Access-Control-Allow-Origin 头
         ↓
浏览器拦截请求 → "Failed to fetch"
```

---

### ✅ Solution: 代码级 CORS 实现

**Fix Applied**: 在所有 4 个 API 路由文件中添加 CORS 中间件

1. **创建通用 CORS 函数**:
   ```javascript
   function setCorsHeaders(req, res) {
     res.setHeader('Access-Control-Allow-Origin', 'https://deepsleep.fun');
     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
     res.setHeader('Access-Control-Allow-Credentials', 'true');
     res.setHeader('Access-Control-Max-Age', '86400');
   }
   ```

2. **在每个路由文件开头调用**:
   ```javascript
   module.exports = async (req, res) => {
     setCorsHeaders(req, res);
     
     if (req.method === 'OPTIONS') {
       return res.status(200).end();  // 处理预检请求
     }
     
     // ... 正常业务逻辑
   };
   ```

3. **修改的文件**:
   - [`api/register.js`](../community-deepsleep/api/register.js): 用户注册 API
   - [`api/login.js`](../community-deepsleep/api/login.js): 用户登录 API
   - [`api/posts.js`](../community-deepsleep/api/posts.js): 帖子 CRUD API
   - [`api/me.js`](../community-deepsleep/api/me.js): 个人资料 API

4. **保留 vercel.json 配置作为备份**（虽不生效但无害）

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `community-deepsleep/api/register.js` | 添加 setCorsHeaders() + OPTIONS 处理 |
| `community-deepsleep/api/login.js` | 添加 setCorsHeaders() + OPTIONS 处理 |
| `community-deepsleep/api/posts.js` | 添加 setCorsHeaders() + OPTIONS 处理 |
| `community-deepsleep/api/me.js` | 添加 setCorsHeaders() + OPTIONS 处理 |

---

### 🧪 Verification

**Test Results**:
- ✅ Browser DevTools Network: OPTIONS 返回 200，包含完整 CORS 头
- ✅ POST /api/register 成功返回用户数据和 JWT Token
- ✅ 注册功能在浏览器中正常工作
- ✅ 登录、发帖、个人资料功能均正常

**Evidence**:
```bash
# CORS 头验证通过
Access-Control-Allow-Origin: https://deepsleep.fun ✅
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS ✅
Access-Control-Allow-Credentials: true ✅

# API 功能验证
Status: 200 OK
Response: {"success":true,"user":{...},"token":"eyJ..."} ✅
```

**💡 Prevention**: 
- Vercel Serverless Functions 必须使用代码级 CORS 配置，不要依赖 vercel.json Headers
- 新增 API 路由时必须立即添加 CORS 支持
- 使用浏览器 DevTools 验证跨域配置，不要仅依赖命令行测试

---

### Bug Fix 8: 社区表单 ID 与 data-tab 不匹配导致切换失败 (2026-06-17)

**❓ Problem**: 社区页面点击"注册"Tab 后表单消失

**Symptoms**:
- Tab 切换高亮正常变化
- 但下方表单区域空白（注册表单不显示）
- 登录表单因内联样式 `display:block` 兜底可显示

**Environment Context**:
- Date: 2026-06-17
- Affected Component: community.html + community.js

---

### 🔍 Root Cause Analysis

**Technical Root Cause**:
HTML 表单 ID 与 JavaScript 选择器使用的值不一致：

| 元素 | HTML ID | JS 查找值 | 结果 |
|------|---------|-----------|------|
| 登录表单 | `login-form` | `login` | ⚠️ 靠内联样式兜底 |
| 注册表单 | `reg-form` | `register` | ❌ 完全不匹配 |

```javascript
// community.js 第248行
const targetForm = document.querySelector(`.auth-form#${tabName}`);
// 点击"注册"时 tabName = "register"
// 实际查找 .auth-form#register → 找不到（真实ID是 reg-form）
```

---

### ✅ Solution: 统一命名规范

**Fix Applied**:

1. **修改 HTML 表单 ID** ([`layouts/_default/community.html`](layouts/_default/community.html)):
   ```html
   <!-- 旧 -->
   <form id="login-form" ...>
   <form id="reg-form" ...>
   
   <!-- 新 -->
   <form id="login" ...>
   <form id="register" ...>
   ```

2. **更新 JS 绑定** ([`static/js/community.js`](static/js/community.js)):
   ```javascript
   // 旧
   const regForm = document.getElementById('reg-form');
   const loginForm = document.getElementById('login-form');
   
   // 新
   const regForm = document.getElementById('register');
   const loginForm = document.getElementById('login');
   ```

**💡 Prevention**: 
当使用 `data-tab` 属性驱动 UI 切换时，确保：
- Tab 的 `data-tab` 值 = 目标元素的 `id`
- 命名风格保持一致（避免缩写如 `reg` vs `register`）

---

### Bug Fix 9: community.js 重复加载导致 API_BASE 重复声明 (2026-07-07)

**❓ Problem**: 社区页面注册/登录显示 "Failed to fetch"

**Symptoms**:
- 点击注册或登录按钮后显示 "Failed to fetch" 错误
- 后端 API 和 CORS 配置均正常（OPTIONS 200 + POST 200）
- 前端 JS 代码逻辑正确

**Environment Context**:
- Date: 2026-07-07
- Affected Component: community.html + extend_footer.html + extended_head.html
- Browser: Chrome/Edge DevTools Console

---

### 🔍 Root Cause Analysis（通过浏览器 DevTools 排查）

**浏览器控制台错误**:
```
[error] SyntaxError: Identifier 'API_BASE' has already been declared
[info] SCRIPT: https://deepsleep.fun/js/community.js?v=5.2
[info] SCRIPT: https://deepsleep.fun/js/community.js
[error] ReferenceError: getUser is not defined
```

**Technical Root Cause**:
`community.js` 被加载了**两次**，导致 `const API_BASE` 重复声明 → 整个 JS 脚本崩溃 → 所有函数（`getUser`、`api`、`handleRegister` 等）未定义 → 点击注册时 `fetch` 无法执行 → **"Failed to fetch"**

**两个加载来源**:

| 来源 | 文件 | 加载方式 |
|------|------|---------|
| 来源 1 | `layouts/_default/community.html` | `<script src="/js/community.js?v=5.2"></script>` |
| 来源 2 | `layouts/partials/extend_footer.html` | `<script src="{{ "js/community.js" \| relURL }}"></script>` |

**触发条件**:
社区页面同时渲染了 `community.html` 模板和全局 `partials`（`extended_head.html` + `extend_footer.html`），导致 JS 和 CSS 各被加载两次。

```mermaid
flowchart TD
    A[浏览器访问 /community/] --> B[Hugo 渲染 community.html]
    B --> C[加载 community.js?v=5.2]
    B --> D[渲染全局 partials]
    D --> E[extended_head.html 加载 community.css]
    D --> F[extend_footer.html 加载 community.js]
    C --> G[const API_BASE = ...]
    F --> H[const API_BASE = ... ← 重复声明!]
    G --> I[SyntaxError!]
    H --> I
    I --> J[JS 脚本崩溃]
    J --> K[getUser/api 等函数未定义]
    K --> L[点击注册 → fetch 失败]
    L --> M["Failed to fetch"]
    
    style I fill:#fee,stroke:#f66
    style M fill:#fcc,stroke:#f00
```

---

### ✅ Solution: 移除 community.html 中的重复加载

**Fix Applied**:

从 `layouts/_default/community.html` 中移除重复的 `<link>` 和 `<script>` 标签，因为全局 partials 已经负责加载：

```diff
 {{ define "main" }}
-<link rel="stylesheet" href="/css/community.css?v=5.2">
-<script src="/js/community.js?v=5.2"></script>
+<!-- community.css 和 community.js 已通过全局 partials 加载，此处不再重复引入 -->
 
 <div class="community-container">
```

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `layouts/_default/community.html` | 移除重复的 `<link>` 和 `<script>` 标签 |

---

###  Verification

**Test Results**:
- ✅ 浏览器 DevTools Console: 无 `SyntaxError` 错误
- ✅ 浏览器 DevTools Network: `community.js` 仅加载 1 次
- ✅ 后端 API 正常响应（OPTIONS 200 + POST 200）
- ✅ 注册/登录功能正常工作

**💡 Prevention**: 
- 模板文件中不要重复引入已由全局 partials 加载的资源
- 使用浏览器 DevTools Console 检查 JS 错误，不要仅依赖后端 API 测试
- 修改模板后务必用浏览器实际访问验证

---

## 📝 更新日志

### v5.4 (2026-07-30) - 项目清理与文档统一

- ✅ 统一 DeepSleep 当前文档版本为 v5.4
- ✅ 移除已停用的 SleepTown 移动端项目文档，保留网页端 SleepTown 文档
- ✅ 清理本地 Dify、ComfyUI、SleepTownApp 与 PaperReader 资料及失效入口

### v5.3 (2026-07-07) - JS 重复加载修复

**Bug 修复**:
- ✅ 修复 community.js 重复加载导致 API_BASE 重复声明 → "Failed to fetch"（移除 community.html 中的重复 script/link 标签）

### v5.2 (2026-06-17) - 社区论坛系统上线

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

*文档结束 | 最后更新: 2026-07-30 | 版本: v5.4 | 状态: ✅ 生产就绪*

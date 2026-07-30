# DeepSleep Blog - 项目技术文档

> **最后更新**: 2026-07-31
> **版本**: v5.10
> **状态**: ✅ 生产就绪 | 评论系统正常运行 (Neon PostgreSQL) | 💬 社区系统已上线 | 👤 全局个人中心 | 📝 文章板块整合 (learn 风格 sidebar) | 🌗 主题切换圆形扩散动画 | 🐟 SleepTown 首页 sidebar 改造 | 🎮 交互式自我介绍 (/play/me/)

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
- 👤 **全局个人中心**（导航栏"个人"菜单项 → /profile/ 独立页面）✅ v5.2 新增 · v5.8 改为原生 menu 项
- 📝 **文章板块整合**（社区帖子与博客文章混合展示，learn 风格 sidebar）✅ v5.2 / v5.5 改造
- 🖼️ **作者信息显示**（帖子/文章卡片显示头像+名称）✅ v5.2 新增
- 🔍 全文搜索（Fuse.js）
- 🏷️ 标签与分类系统
- 📦 资源分享板块（独立分区，learn 风格 sidebar）✅ v5.5 改造
- 👤 关于我
- 📚 归档与搜索页面
- 📱 响应式设计 + 暗色/亮色主题切换
- 🌗 **主题切换圆形扩散动画**（View Transitions API，以按钮为圆心双向扩散）✅ v5.6 新增
- 🔤 **字体大小调节**（Aa 按钮 + 5 档弹窗 80%-120% + localStorage 持久化）✅ v5.7 新增
- 🏫 **lixin sidebar 改造 + LLM 对话主页化**（双层 Tab → learn 风格 sidebar，悬浮弹窗 → 主内容区默认全屏对话视图）✅ v5.8 新增
- 🐟 **SleepTown 首页 sidebar 改造**（花哨彩色卡片 → learn 风格 sidebar + 简洁模式按钮 + 10 种鱼角色图鉴 + 规则 modal 弹窗）✅ v5.9 新增
- ⚡ 零 CDN 依赖（Waline 前端资源完全本地化）
- 🎮 **交互式自我介绍**（`/play/me/` 滚动叙事 + 数据可视化 + 打字机流式）✅ v5.10 新增

---

## 🏗️ 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────┐
│                    用户浏览器                         │
│  ┌─────────────────────────────────────────────┐   │
│  │ 导航栏: [文章][资源][学习][我][个人][社区][娱乐] [🌗][Aa]  │   │
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
| **文章列表页 sidebar** | **learn 同款设计** (v5.5) | **CSS 变量/Playfair Display 字体/移动端抽屉复用，视觉一致性** |
| **资源列表页 sidebar** | **learn 同款设计** (v5.5) | **资源卡片网格 + 标签 + 快速导航，视觉一致** |
| **SleepTown 关卡页 sidebar** | **learn 同款设计** (v5.5 / SleepTown v2.2.2.0) | **左章节列表 + 右关卡详情卡片，10 关扩展** |
| **主题切换动画** | **View Transitions API + clip-path 圆形扩散** (v5.6) | **以按钮为圆心双向自适应扩散，不破坏原生降级路径** ⭐ |
| **字体大小调节** | **CSS 变量 --font-scale + rem 缩放** (v5.7) | **Aa 按钮弹窗 5 档 80%-120%，localStorage 持久化，body 用 1rem !important 覆盖 custom.css 的 16px** ⭐ |
| **lixin sidebar 改造** | **双层 Tab → learn 风格 sidebar + LLM 对话主页化** (v5.8) | **悬浮弹窗 → 主内容区默认全屏 flex 视图，sidebar 含精简 Hero + 导航组（立信问答/校内 10 项/校外 2 项），视图切换不丢失对话状态** ⭐ 新增 |
| **SleepTown 首页 sidebar 改造** | **花哨彩色卡片 → learn 风格 sidebar + 鱼图鉴** (v5.9) | **原 mode-cards 双卡片 + 表情过多 → sidebar 导航 + 3 个简洁垂直按钮 + 10 种鱼角色图鉴（按阵营分组）+ 规则 modal 弹窗** ⭐ 新增 |
### 🎨 Sidebar 设计模式（learn 风格，v5.5 统一）

DeepSleep 博客的 5 个板块复用同一套 learn 风格 sidebar 设计模式，保证视觉与交互一致性：

| 板块 | 模板文件 | CSS 前缀 | 主题色 | Sidebar 内容 |
|------|---------|---------|--------|-------------|
| 学习路径 | `layouts/_default/learn.html` | `learn-` | 金色 `#D4AF37` | 章节列表（按 cert+weight） |
| 文章与动态 | `layouts/_default/posts.html` | `posts-` | 金色 `#D4AF37` | 所有文章 + 标签 + 快速导航 |
| 资源分享 | `layouts/_default/resources.html` | `resources-` | 金色 `#D4AF37` | 所有资源 + 标签 + 快速导航 |
| SleepTown 关卡 | `layouts/_default/sleeptown.html` | `stagemode-` | 橙金 `#f39c12` | 章节关卡列表（2 章 10 关） |
| SleepTown 首页 | `layouts/_default/sleeptown.html` | `stagemode-` | 橙金 `#f39c12` | 游戏模式 + 10 种鱼图鉴（按阵营分组）+ 游戏规则 modal |

**统一设计规范**：
- **布局**：`display: grid; grid-template-columns: <sidebar-width> 1fr`，sidebar 宽度 300px，主内容 max-width 1100-1440px
- **字体**：标题用 `Playfair Display, Georgia, serif`；正文用 `Inter, -apple-system, sans-serif`；编号用 `SF Mono, Consolas, monospace`
- **CSS 变量**：定义在 `:root`（非板块根元素），因移动端 sidebar `position: fixed` 后脱离父子树
- **突破 PaperMod 约束**：`.main:has(.<prefix>-page) { max-width: 100% !important; }` 突破 768px 限制
- **移动端抽屉**（≤1024px）：汉堡按钮 + 遮罩 + ESC 关闭 + 点击链接后关闭 + `transform: translateX(-100%)` 滑入
- **暗色模式**：`[data-theme="dark"]` 覆盖 `--<prefix>-*` 变量（不嵌套板块根元素）
- **active 高亮**：`linear-gradient(90deg, rgba(gold,0.12), transparent)` + 左边框主题色
- **grid item 防 overflow**：主内容区加 `min-width: 0`

### 🌗 主题切换圆形扩散动画（View Transitions API，v5.6 新增）

DeepSleep 博客的主题切换按钮（`#theme-toggle`）点击时，新主题以按钮为圆心向外圆形扩散覆盖旧主题，灵感来源于 [algo.itcharge.cn](https://algo.itcharge.cn)。

**技术实现**：
- **API**：`document.startViewTransition()` + `::view-transition-new(root)` 伪元素 + `clipPath` Web Animations API
- **拦截策略**：在 `extend_footer.html` 用**捕获阶段** `addEventListener('click', fn, true)` 拦截 PaperMod 原生 click（`footer.html:96` 在 bubbling 阶段绑定），`stopImmediatePropagation()` 阻止原生逻辑，自行用 `startViewTransition` 包裹主题切换
- **圆心计算**：`toggle.getBoundingClientRect()` 取按钮中心 `x/y`
- **半径计算**：`Math.hypot(max(x, W-x), max(y, H-y))` 覆盖到屏幕最远角
- **双向自适应**：亮→暗 用 `circle(0) → circle(R)`（黑幕从按钮合拢覆盖全屏）；暗→亮 用 `clipPath.reverse()`（光明绽放）
- **动画参数**：600ms `cubic-bezier(0.4, 0, 0.2, 1)`
- **CSS 层级**：`::view-transition-new(root) { z-index: 9999 }` 确保新主题在上层

**降级路径**（不破坏原生）：
- 浏览器不支持 `document.startViewTransition` → 不拦截，走 PaperMod 原生瞬间切换
- 用户设置 `prefers-reduced-motion: reduce` → 不拦截，走原生
- `transition.ready` Promise reject → 主题已在回调中切换，仅动画跳过

**关键文件**：
| 文件 | 作用 |
|------|------|
| `layouts/partials/extend_footer.html` | 捕获阶段拦截 + startViewTransition + clipPath 动画 |
| `layouts/partials/extended_head.html` | `::view-transition-*` CSS（禁用默认 cross-fade、设置层级、reduced-motion 降级） |

**浏览器兼容性**：Chrome/Edge 111+、Safari 18+、Opera 99+ 原生支持；Firefox 暂不支持，自动降级为瞬间切换。

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
│   ├── me.md                        # 关于我
│   ├── community.md                 # 社区论坛页 (layout: community)
│   ├── archives.md                  # 归档页面 (layout: archives)
│   ├── search.md                    # 搜索页面 (layout: search)
│   └── resources/                   # 资源分享板块 (layout: resources) v5.5
│       └── _index.md                # 板块首页
├── layouts/
│   ├── partials/
│   │   ├── comments.html            # Waline 评论组件
│   │   ├── extend_footer.html       # ⭐ 全局功能（个人弹窗 + JS）v5.2 更新
│   │   └── extend_head.html          # ⭐ 全局样式（个人按钮 + 弹窗样式）v5.2 更新；v5.8 修正文件名（extended_head.html 未被 PaperMod 加载）
│   └── _default/
│       ├── community.html           # 社区布局模板
│       ├── posts.html              # ⭐ 文章列表模板 (learn 风格 sidebar) v5.5 改造
│       ├── resources.html           # ⭐ 资源列表模板 (learn 风格 sidebar) v5.5 新增
│       ├── play.html                # 娱乐中心模板 (Playfair Display 标题 + 紧凑卡片) v5.6
│       ├── me-game.html            # ⭐ 交互式自我介绍模板 (5 section + 打字机流式) v5.10 新增
│       └── sleeptown.html          # ⭐ SleepTown 游戏模板 (含关卡模式 sidebar) v2.2.2.0
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
- Affected Component: community.html + extend_footer.html + extend_head.html
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

## 📚 Bug Fix Q&A: extend_head.html 文件名拼写错误导致 head CSS 全部失效 (2026-07-31)

### ❓ Problem: Aa 字体调节按钮显示异常（Aa80%90%100%110%120%）且点击无响应

**Symptoms**:
- 部署后 Aa 字体调节按钮在浏览器中渲染为"Aa80%90%100%110%120%"（所有 5 个档位按钮 + Aa 挤在一行可见）
- 点击 Aa 按钮切换 `.open` 类后视觉上无任何变化（弹窗本应隐藏/显示）
- 主题切换圆形扩散动画的 CSS 装饰（`::view-transition-new(root)` z-index 层级）缺失，仅 JS 动画生效
- v5.2 起累积的个人按钮/弹窗 CSS 也未生效（依赖 `static/css/custom.css` 兜底才未暴露）

**Environment Context**:
- Date: 2026-07-31
- Affected Component: `layouts/partials/extended_head.html`（错误文件名）→ `layouts/partials/extend_head.html`（正确文件名）
- Browser: Chrome/Edge/Firefox 所有浏览器均受影响
- 影响版本：v5.2 → v5.8（自首次创建该文件起一直存在）

---

### 🔍 Root Cause Analysis

**Technical Root Cause**:
PaperMod 主题的 `themes/PaperMod/layouts/_partials/head.html:186` 引用扩展 partial 的代码是：
```go
{{- partial "extend_head.html" . -}}
```
但项目从 v5.2 起创建的文件名是 `layouts/partials/extended_head.html`（带 ed 过去分词），与 PaperMod 引用的 `extend_head.html`（动词原形）不匹配。

Hugo 的 partial 查找是精确匹配文件名，找不到 `extend_head.html` 就静默跳过（不报错），导致该文件中累积的所有 CSS 从未注入到 `<head>` 中。

**Discovery Method**:
- `git status` 发现 `extended_head.html` 一直存在且被提交
- 检查 `public/index.html` 的 `<head>` 段长度仅 2818 字节，且不包含 `font-scale`/`font-toggle`/`font-popup`/`view-transition` 任何 CSS 规则
- `Select-String` 检查 PaperMod `head.html` partial 引用，发现引用的是 `extend_head.html`（不带 ed）
- 对比项目实际文件名 `extended_head.html`（带 ed），确认文件名拼写错误

**Why It Failed**:
- JS 在 `extend_footer.html` 中（文件名正确匹配 PaperMod 的 `extend_footer.html` 引用），所以 JS 一直生效
- HTML 元素由 JS 动态注入（如 `.font-toggle-wrap`），所以 DOM 结构正常渲染
- 但 CSS 在 `extended_head.html` 中（文件名不匹配），从未被加载
- `.font-popup` 缺失 `visibility:hidden` 和 `position:absolute`，导致 5 个档位按钮一直可见且挤在 Aa 旁
- 切换 `.open` 类时没有 CSS 响应这个状态变化，所以视觉上无效果 → "点击无响应"

---

### ✅ Solution: 修正文件名（git mv 保留历史）

**Fix Applied**:
1. **Step 1**: 用 `git mv` 重命名文件（保留 git 历史）
   ```powershell
   git mv layouts/partials/extended_head.html layouts/partials/extend_head.html
   ```
   - Before: `layouts/partials/extended_head.html`（带 ed，PaperMod 不识别）
   - After: `layouts/partials/extend_head.html`（不带 ed，匹配 PaperMod 引用）

2. **Step 2**: 重新 build 验证
   ```powershell
   hugo --minify --gc
   ```
   - 验证 `public/index.html` 的 `<head>` 段长度从 2818 字节增长到 6953 字节
   - 确认包含 `font-scale`/`font-toggle`/`font-popup`/`view-transition`/`custom.css` 全部 CSS

3. **Step 3**: 同步更新项目文档中所有提到 `extended_head.html` 的位置（共 9 处）

**Files Modified**:
- [`layouts/partials/extend_head.html`](layouts/partials/extend_head.html): 由 `extended_head.html` 重命名而来，内容未变
- [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md): 9 处文件名引用更新 + 新增本 Q&A 条目 + v5.8 章节追加 Bug Fix 说明
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md): 1 处文件名引用更新

**Configuration Changes**:
| Variable | Old Value | New Value | Location |
|----------|-----------|-----------|----------|
| Partial 文件名 | `extended_head.html` | `extend_head.html` | `layouts/partials/` |

---

### 🧪 Verification

**Test Results**:
- ✅ `hugo --minify --gc` 构建成功（225 页，0 错误）
- ✅ `public/index.html` `<head>` 段长度从 2818 字节增长到 6953 字节
- ✅ `<head>` 中包含 `--font-scale` CSS 变量定义
- ✅ `<head>` 中包含 `.font-toggle` / `.font-popup` / `.font-scale-btn` 选择器规则
- ✅ `<head>` 中包含 `::view-transition-new(root)` 伪元素规则
- ✅ `<head>` 中引用 `/css/custom.css` 和 `/css/community.css`
- ✅ `hugo server` 启动正常，无模板查找错误

**Evidence**:
- PowerShell 验证输出：
  ```
  Has font-scale: True
  Has font-toggle: True
  Has font-popup: True
  Has view-transition: True
  Has custom.css: True
  ```

**Rollback Plan**:
如需回滚，只需 `git mv layouts/partials/extend_head.html layouts/partials/extended_head.html` 即可恢复到错误状态（不推荐）。

---

### 💡 Prevention & Best Practices

**To Prevent Recurrence**:
1. **PaperMod 扩展点文件名规范**：扩展 partial 必须用动词原形 `extend_head.html` / `extend_footer.html`，不要用过去分词 `extended_*.html`
2. **新建 partial 后必须验证加载**：用 `Select-String -Path public/index.html -Pattern "<关键 CSS 选择器>"` 确认 CSS 实际渲染到 HTML 中
3. **本地 build 后浏览器实测**：`hugo server` 后访问页面，用 DevTools Elements 面板检查元素样式是否生效
4. **JS 与 CSS 同源原则**：若 JS 注入 DOM 元素并依赖 CSS 控制可见性，JS 和 CSS 必须放在都生效的 partial 中（都用 `extend_*.html` 或都用 `extend_*.html`）

**Monitoring Recommendations**:
- 每次 hugo build 后抽查 `public/index.html` 的 `<head>` 段长度（应稳定在 6KB+）
- CI 部署后用 `curl https://deepsleep.fun/ | grep "font-popup"` 验证关键 CSS 在线生效

**Related Documentation**:
- v5.6 主题切换圆形扩散动画章节（`::view-transition-*` CSS 现已生效）
- v5.7 字体大小调节功能章节（`.font-toggle`/`.font-popup` CSS 现已生效）

---

### 📊 Impact Summary

| Metric | Value |
|--------|-------|
| **Severity** | 🔴 Critical（影响多个版本累积的 CSS） |
| **Downtime** | 无（功能降级运行，非完全不可用） |
| **Users Affected** | 100% 访客（自 v5.2 起） |
| **Time to Fix** | ~30 分钟（含根因分析） |
| **Complexity** | Low（一行 `git mv`）但 High（根因定位需要理解 Hugo partial 查找机制） |

---

**🎓 Key Learnings**:
> PaperMod 主题的扩展点文件名是 `extend_head.html` / `extend_footer.html`（动词原形），不是 `extended_head.html` / `extended_footer.html`（过去分词）。Hugo partial 查找是精确匹配文件名且静默失败（不报错），所以拼写错误的 partial 文件会被默默忽略，CSS/JS 看似"配置正确"实则从未加载。诊断这类问题的金标准是检查 `public/<page>.html` 渲染后的实际内容，而非只看源文件。

**🔗 Related Issues**:
- v5.2 全局个人按钮/弹窗样式（受影响但 custom.css 兜底）
- v5.6 主题切换圆形扩散动画 CSS（受影响，JS 生效但 CSS 缺失）
- v5.7 字体大小调节功能 CSS（受影响，本次 bug 报告的直接触发点）

---

## 📝 更新日志

### v5.10 (2026-07-31) - 交互式自我介绍页面

**新增功能**:
- ✅ **交互式自我介绍** (`/play/me/`)：滚动叙事 + 数据可视化，5 个 section
  - Hero：头像 + 姓名 + 标语（打字机流式）+ 滚动提示
  - Timeline：5 个里程碑（垂直时间轴，左右交替，节点滚动点亮）
  - Skills：6 项技能进度条 + 百分比数字滚动计数
  - Works：4 个作品卡片（hover 上浮，描述打字机流式）
  - Contact：Email/GitHub/Blog 真实 + 微信/QQ 占位
- ✅ **前端打字机模拟 SSE 流式**：叙事段落（Hero 标语/Timeline 描述/Works 描述）逐字显示 + 光标 `▌` 闪烁，~30ms/字
- ✅ **IntersectionObserver 滚动动画**：section 进入视口 15% 触发骨架淡入 + 上移，延迟 600ms 启动打字机
- ✅ **降级路径**：prefers-reduced-motion 直接显示全文 / 旧浏览器跳过观察 / JS 禁用文本预写在 DOM 仍可见
- ✅ **娱乐中心入口**：`/play/` 新增「关于我」游戏卡片

**技术实现**:
- 纯前端零第三方依赖（HTML + CSS + JS 自包含单文件模板）
- CSS 变量 `--me-*` 定义在 `:root`（遵循项目硬约束）
- `.main:has(.me-game-page)` 突破 PaperMod 768px 限制
- 暗色模式 `[data-theme="dark"]` 覆盖变量
- 打字机：文本预写 HTML → JS 存入 `data-text` 清空 → `setInterval` 逐字 append
- 数字滚动：`requestAnimationFrame` ease-out cubic，1.5s
- 占位统一用 `【】` 标记 + HTML 注释，方便后续替换

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `content/play/me.md` | 新增：front matter 声明 layout: me-game |
| `layouts/_default/me-game.html` | 新增：自包含模板（5 section HTML + CSS + JS） |
| `layouts/_default/play.html` | 修改：.games-grid 新增「关于我」卡片 |
| `PROJECT_CONTEXT.md` | 版本号 v5.9→v5.10、功能清单、版本演进表、技术决策表 |
| `PROJECT_DOCUMENTATION.md` | 版本号、功能特性、目录结构、更新日志 v5.10 条目 |

**设计文档**：`docs/superpowers/specs/2026-07-31-play-me-interactive-intro-design.md`

**双入口并存**：旧 `/me/`（content/me.md）保留不动，菜单「我」仍指 `/me/`；`/play/me/` 仅从娱乐中心进入。

---

### v5.8 (2026-07-31) - lixin 页面 sidebar 改造 + LLM 对话主页化

**改造背景**:
- lixin 是 v5.5 sidebar 统一后唯一还用双层 Tab 布局的板块
- LLM 对话原为悬浮按钮+弹窗，用户希望变成主页界面直接对话

**改造内容**:
- ✅ **双层 Tab → learn 风格 sidebar**：校内/校外 Tab 改成 sidebar 导航组（校内 10 项 + 校外 2 项）
- ✅ **Hero 区精简后移到 sidebar 顶部**：黑底+金光+校名+分割线+校训（删除英文名节省 300px 宽度）
- ✅ **LLM 对话主页化**：悬浮弹窗 → 主内容区默认全屏 flex 视图
  - `.lx-view-chat.active` 用 `display:flex; flex-direction:column; height:calc(100vh - 3rem)`
  - messages `flex:1; min-height:0; overflow-y:auto` 实现内部滚动
  - header/suggest/input 固定，input 固定底部
- ✅ **双视图切换**：sidebar 有"💬 立信问答"导航项（默认 active）；点击避雷指南项切换到内容视图
- ✅ **视图切换不丢失对话状态**：两个视图始终在 DOM 中，仅靠 `.active` 切 `display`；messages 不重建，历史消息完整保留
- ✅ **使用说明保留**：放在内容视图底部（避雷指南内容下方）
- ✅ **移动端抽屉**：≤1024px 汉堡按钮 + 遮罩 + ESC 关闭 + 选中后自动关闭

**视觉微调（同日追加 - 对话视图去边框 + 圆形↑箭头按钮）**:
- ✅ **删除对话视图边框**：`.lx-view-chat.active` 移除 `border`/`box-shadow`/`border-radius`/`overflow:hidden`，背景改 `transparent`，让 LLM 对话区直接融入 lixin 主界面（不再是一个独立卡片）
- ✅ **header/suggest/messages/input-row 全部去独立背景**：背景统一 `transparent`，仅靠分隔线 `border-bottom/border-top` 划分区块，视觉上与主界面融为一体
- ✅ **发送按钮改为圆形 ↑ 箭头**：
  - HTML：文字"发送"改为 SVG ↑ 箭头图标（`<svg class="lx-send-icon">`）
  - 形状：`width:38px; height:38px; border-radius:50%`（圆形单图标按钮）
  - **默认（disabled / 空输入）**：`background: var(--lx-text-muted)` 灰色 + `color: rgba(255,255,255,0.7)` 灰白色箭头 + `opacity:0.55`
  - **可发送状态（`:not(:disabled)`）**：`background:#ffffff` 白色 + `color: var(--lx-text)` 深色箭头 + 轻阴影；暗色模式下背景 `#e8e8e8`、箭头 `#1a1a1a`
  - hover 时 `transform: translateY(-1px)` 微浮起反馈
- ✅ **JS 同步按钮可用状态**：新增 `updateSendBtn()` 函数，发送中→disabled；否则依 input 内容 trim 后是否非空决定；初始按钮 `disabled` 属性 + input 监听器调用 `updateSendBtn()`，发送完成（`.finally`）也调用 `updateSendBtn()` 避免空 input 时按钮变白

**视觉微调（同日追加 2 - 对齐修复 + 隐藏 footer）**:
- ✅ **发送按钮与输入框对齐**：`.lx-chat-input-row` 改 `align-items: center`（原 flex-end 导致按钮偏下）；输入框 padding 从 `0.6rem` 调到 `0.5rem` + 显式 `line-height: 1.4`，使单行高度 ≈ 38px 与按钮高度精确匹配
- ✅ **隐藏 lixin 页面 footer 黑块**：`content/lixin/index.md` front matter 新增 `hideFooter: true`，利用 PaperMod 原生参数隐藏 `<footer class="footer">`（© 2026 DeepSleep Blog · Powered by Hugo & PaperMod）。`extend_footer.html`（全局 JS）在 `hideFooter` 判断块外，故 LLM/主题切换/字体调节等 JS 不受影响

**视觉微调（同日追加 3 - 个人按钮并入导航菜单）**:
- ✅ **删除独立"👤 个人"按钮**：原 `extend_footer.html` 的 `initGlobalProfile()` JS 动态注入 `.global-profile-btn` 到 `#menu` 之后的方案废弃（v5.2 临时方案）；同时清理 `extend_head.html` 中对应的 `.global-profile-btn` CSS（约 23 行）
- ✅ **"个人"作为原生 menu 项**：`hugo.toml` 新增 `[[menu.main]] identifier="profile" name="个人" url="/profile/" weight=60`，放在最末位（娱乐 50 之后）
- ✅ **导航菜单最终顺序**：文章(10) → 资源(20) → 学习(25) → 我(30) → 社区(40) → 娱乐(50) → **个人(60)**
- ✅ **去掉表情**：原按钮 `innerHTML = '👤 个人'`，原生 menu 项 `name = "个人"` 无表情
- **收益**：减少一次 JS DOM 注入；导航项样式由 PaperMod 原生 `.nav` 统一管理（active 高亮、移动端折叠等自动生效）；与其他 menu 项视觉一致

**视觉微调（同日追加 4 - 个人菜单置右 + 暗色模式导航白色修复）**:
- ✅ **个人菜单挪到最右**：`hugo.toml` profile `weight` 32 → 60，放在娱乐(50) 之后成为最后一个菜单项
- ✅ **修复暗色模式导航栏白色问题**：根因是 `static/css/custom.css:40` 硬编码 `body { background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%); }` 白色渐变背景 + `color: var(--color-text-primary)` (#2d2d2d 深色文字)，且**没有任何 `[data-theme="dark"]` 覆盖**
  - **首页（`<body class="list">`）**：PaperMod 的 `.list { background: var(--theme); }` 优先级 (0,1,0) > `body` (0,0,1)，能正常覆盖白色渐变 ✓
  - **普通页面（`<body id="top">` 无 .list，如 /lixin/、/me/）**：PaperMod `.list` 选择器不匹配，custom.css 白色渐变**在暗色模式下仍然生效** → 整页（含导航栏区域）背景白色 + 文字深色 ✗
  - **修复**：`extend_head.html` 新增 `[data-theme="dark"] body { background: var(--theme) !important; color: var(--primary) !important; }`，选择器优先级 (0,1,1) > `body` (0,0,1)，覆盖 custom.css 硬编码值；复用 PaperMod 的 `--theme`（暗色 rgb(29,30,32)）和 `--primary`（暗色 rgb(218,218,219)）变量自动切换
  - **验证**：浏览器实测 lixin 页面暗色模式下 body 背景 = rgb(29,30,32) 深色 ✓，菜单文字 = rgb(218,218,219) 浅色 ✓

**视觉微调（同日追加 5 - 移动端 sidebar 汉堡按钮让位）**:
- ✅ **问题**：移动端（≤1024px）5 个 sidebar 页面（lixin/learn/posts/resources/sleeptown）的汉堡按钮 `position: fixed; top:14px; left:14px; z-index:200; width:42px` 挡住了 PaperMod 顶部 logo（"DeepSleep Blog"），导致首页按钮被遮挡无法点击
- ✅ **根因**：所有 sidebar 模板的汉堡按钮都用 fixed 定位在左上角（占左侧 14+42=56px），而 PaperMod 的 `.header-nav > .logo` 也在左上角（padding-left:24px），两者坐标重叠
- ✅ **修复**：`extend_head.html` 新增全局 CSS，移动端时用 `:has()` 选择器匹配有汉堡按钮的页面，给 `.header-nav` 加 `padding-left: 60px` 让 logo 往右移避开汉堡按钮区域
  ```css
  @media (max-width: 1024px) {
    body:has(.lx-menu-toggle, .learn-menu-toggle, .posts-menu-toggle, .resources-menu-toggle, .stagemode-menu-toggle) .header-nav {
      padding-left: 60px;
    }
  }
  ```
  - `:has()` 选择器兼容性（2026 年）：Chrome 105+、Safari 15.4+、Firefox 121+ 广泛支持
  - 只在有汉堡按钮的 sidebar 页面生效，首页/社区/娱乐等无 sidebar 页面不受影响
- ✅ **验证**：浏览器实测移动端 lixin 页面 logo.left=60 ≥ menuToggle.right=54，无重叠 ✓；首页 paddingLeft=14px（默认值）不受影响 ✓

### v5.9 (2026-07-31) - SleepTown 首页 sidebar 改造 + 鱼图鉴
**改造动机**：原 SleepTown 首页 mode-cards 双卡片设计"花销过多"（彩色渐变卡片 + 大量表情图标 + 4 项 features 列表 + 独立快速开始区 + 折叠规则区含 10 种鱼角色介绍），视觉与博客其他 sidebar 板块（learn/posts/resources）不一致。

**改造内容**：
- ✅ **删除原花哨元素**：
  - 删除 `.mode-cards` 两个彩色渐变卡片（freemode-card 绿色 / stagemode-card 橙色）
  - 删除 `.mode-features` 4 项 features 列表 + 表情图标
  - 删除 `.mode-description` 介绍段落
  - 删除 `.quick-start-section` 独立快速开始区
  - 删除 `.rules-preview` 折叠规则区（含 10 种鱼 `.role-card-setup`）
  - 删除对应 CSS 约 305 行（`.mode-selection` / `.selection-container` / `.mode-cards` / `.mode-card` / `.freemode-btn` / `.stagemode-btn` / `.quick-start-section` / `.rules-preview` / `.role-card-setup` / `.toggle-rules-btn` 等）
- ✅ **新增 sidebar 布局**（复用 `.stagemode-` CSS 前缀）：
  - 5 个导航分组：游戏模式（3 项）/ 豪鱼阵营（5 项）/ 中立阵营（3 项）/ 坏鱼阵营（2 项）/ 其他（1 项规则）
  - 10 种鱼角色按阵营归类：豪鱼(摆烂D/侦探D/法官D/八卦鱼/梦游D)、中立(法师D/恶作剧D/虎鲸)、坏鱼(邪恶D/殉道D)
  - sidebar header 含 logo + 版本号（v2.2.2.0 · 第2章"殉道士"）
- ✅ **主内容区双视图切换**：
  - 视图1（默认 active）：模式选择视图，含 hero 标题 + 3 个垂直堆叠简洁按钮（自由/关卡/快速开始）
  - 视图2（隐藏）：鱼角色详情视图，含角色 icon+名+阵营徽章+能力描述 + 返回按钮
- ✅ **JS 函数**：
  - `switchFishRole(roleId)`：切换到鱼详情视图，渲染角色信息，更新 sidebar active，移动端自动关闭 sidebar
  - `backToModes()`：返回模式选择视图，重置 sidebar active 到默认（自由模式）
  - `openRulesModal()` / `closeRulesModal()`：游戏规则 modal 弹窗开关，锁定 body 滚动
  - `FISH_ROLES` 常量：10 种鱼的数据对象（name/faction/icon/badge/desc）
  - `openStagemodeSidebarHome()` / `closeStagemodeSidebarHome()`：首页 sidebar 抽屉开关（独立于关卡模式的 `closeStagemodeSidebar`）
  - `initStagemodeDrawerHome()` IIFE：首页抽屉事件绑定（toggle/overlay/ESC）
  - `backToModeSelection()` 修改：返回首页时调用 `backToModes()` 重置视图
- ✅ **游戏规则 modal 弹窗**：
  - `#rules-modal` 全屏 overlay + 居中 content 卡片
  - 含原 rules-section-setup 内容（伪装机制 / 白天问询 / 流放 / 夜晚 / 胜利条件）
  - 关闭方式：点击 × 按钮 / 点击 overlay / 点击 ESC
  - 锁定 body overflow 防止背景滚动
- ✅ **模式按钮垂直堆叠**：`.home-mode-buttons { flex-direction: column; gap: 0.8rem; max-width: 320px; margin: 2rem auto }`，3 个按钮居中显示
  - 自由/关卡模式：白底 + 左边框橙色 + hover translateX(2px)
  - 快速开始：橙色渐变背景 + 白字
- ✅ **鱼详情卡片设计**：
  - `.fish-detail-card`：白底卡片 + 圆角 + 阴影
  - `.fish-detail-header`：icon(2rem) + 名(Playfair Display 1.5rem) + NEW 徽章 + 阵营徽章（faction-good/neutral/evil 三色）
  - `.fish-detail-body`：能力描述（保留 `<strong>` 加粗）
  - 阵营徽章暗色模式适配（rgba 透明背景 + 浅色文字）

**新 HTML 结构**：
```
#mode-selection.stagemode-page.stagemode-home.active
├── .stagemode-menu-toggle (移动端汉堡)
├── .stagemode-overlay
├── aside#stagemode-sidebar-home
│   ├── .stagemode-sidebar-header (logo + version)
│   └── nav.stagemode-nav (5 groups)
└── main.stagemode-home-main
    ├── section#home-view-modes.home-view.active
    │   ├── .home-hero (h1 + subtitle)
    │   ├── .home-mode-buttons (3 个垂直按钮)
    │   └── .home-tip
    └── section#home-view-fish.home-view
        ├── .fish-detail-card (header + body)
        └── .back-to-modes-btn

#rules-modal.rules-modal (独立 modal)
├── .rules-modal-overlay
└── .rules-modal-content
    ├── .rules-modal-close (×)
    ├── .rules-modal-title
    └── 5 个 .rules-section-setup (伪装/白天/流放/夜晚/胜利)
```

**验证**：浏览器实测全部功能正常 ✓
- 首页结构：sidebar + 主区 + 5 个导航组 + 3 个模式按钮 ✓
- 鱼角色切换：点击 sidebar → 显示详情（icon+名+阵营+描述）✓
- 返回按钮：正常返回模式视图 ✓
- 规则弹窗：打开/关闭/ESC/overlay 点击 ✓
- 模式按钮：自由模式按钮 → 进入 freemode-setup 配置界面 ✓
- 视觉效果：简洁深色风格，无原花哨彩色卡片 + 表情过多 ✓

**视觉微调（同日追加 5 - footer 全宽 + 主题感知背景修复）**:
- 🐛 **问题**：`© 2026 DeepSleep Blog · Powered by Hugo & PaperMod` 页脚模块渲染异常，两个症状：
  1. **白天模式仍然是黑色**：页脚背景在 light/dark 模式下都是黑色
  2. **长度不够（模块两端和到屏幕有空白）**：页脚宽度仅 768px 居中显示，两侧大量留白
- 🔍 **根因分析**：
  - **黑底根因**：`static/css/custom.css:599` 的 `.footer { background: linear-gradient(135deg, #2d2d2d, #1a1a1a); }` 硬编码深色渐变，**无 `[data-theme="dark"]` 覆盖**，导致 light 模式下也强制黑底（与 v5.8 追加 4 的 body 白底问题同源——custom.css 早期硬编码颜色未做主题适配）。v5.8 追加 2 的临时方案是给 lixin 页加 `hideFooter: true` 直接隐藏，但其他页面仍暴露问题
  - **宽度根因**：PaperMod `themes/PaperMod/assets/css/common/footer.css:8` 设 `max-width: calc(var(--main-width) + var(--gap) * 2)` = `720px + 48px` = **768px** + `margin: auto` 居中，custom.css 此前未覆盖该 `max-width`，故页脚被限制在 768px 宽度
- ✅ **修复**（`static/css/custom.css` 页脚段重写）：
  - **全宽**：`.footer { max-width: 100% !important; }` 覆盖 PaperMod 的 768px 限制，使页脚延伸至屏幕两侧（`margin: auto` 在 max-width:100% 下等效 0 边距，自然全宽）
  - **白天模式浅色背景**：`.footer { background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%) !important; color: var(--color-text-secondary) !important; }`
  - **暗色模式深色背景**：新增 `[data-theme="dark"] .footer { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%) !important; color: var(--secondary) !important; }`
  - **链接颜色主题感知**：白天用 `--color-accent-dark`(#B8960C 深金，浅底高对比)；暗色用 `--color-accent-light`(#F4E5B2 浅金，深底高对比)
  - **金色顶边框保留**：`border-top: 4px solid var(--color-accent)` 在两种模式下都可见（金色对白底/黑底均有对比度）
- 📊 **效果**：页脚现在全宽显示，白天模式白底深字+深金链接，暗色模式黑底浅字+浅金链接，与整体主题协调
- 💡 **教训**：custom.css 早期为 `.footer` / `body` 等全局元素硬编码颜色（#2d2d2d、#fafafa 渐变）未配套 `[data-theme="dark"]` 覆盖，是 v5.8 追加 4 / 追加 5 两轮 bug 的共同根因；后续全局元素配色应直接复用 PaperMod 主题变量（`var(--theme)`/`var(--primary)`/`var(--secondary)`）而非硬编码

**视觉一致性微调（同日追加 6 - SleepTown 关卡模式界面优化，不升版本）**:
- 🎨 **动机**：关卡模式 sidebar 每个关卡名前都有表情（🔍🎭😴🎉⚖️💤📰🔪💀），关卡卡片也有 🎯/🎮 表情 + ⭐ 难度星，配合原橙金按钮（#f39c12）整体偏幼稚；与博客其他板块（learn/posts/resources）沉稳风格不一致
- ✅ **删除侧边栏关卡名表情**：第1章 8 关 + 第2章 2 关的 `.stagemode-nav-text` 前表情全部移除；分组标题 `.stagemode-nav-group-icon`（📖/💀）移除
- ✅ **难度星改文字**：`.stagemode-nav-diff` 由 `⭐`/`⭐⭐` 改为 `入门`/`简单`/`中等` 文字标签；`stageDetails.difficulty` 字段同步去 `⭐` 前缀
- ✅ **关卡卡片去表情**：`selectStage()` 渲染中 `${detail.highlight}` 去 `🎯` 前缀、开始按钮去 `🎮`、`statsHTML` 移除 `.stagemode-stat-icon`（仅保留 `.stagemode-stat-label` 显示 `s.text`）
- ✅ **按钮配色沉稳化**：`:root` 主题变量 `--stagemode-gold` 由橙金 `#f39c12` → 深海蓝 `#2c5282`、`--stagemode-gold-light` `#ffe0b3` → `#5a8bbf`、`--stagemode-gold-dark` `#e67e22` → `#1e3a5f`；联动更新 `.new-badge` 渐变、`.stagemode-card-highlight` 背景、`[data-theme="dark"] .stagemode-stat` 背景/边框
- 📋 **范围**：仅 `layouts/_default/sleeptown.html` 一个文件（80 行变更，39 增 41 删），不升版本号
- 💡 **教训**：硬编码 `rgba(243,156,18,...)` 散落在多处的暗色模式覆盖，统一改用 `var(--stagemode-gold*)` 后未来调色只需改 `:root` 三行

**新 HTML 结构**:
```
.lx-page (grid: 300px 1fr)
  ├─ .lx-menu-toggle (移动端汉堡，≤1024px 显示)
  ├─ .lx-overlay (移动端遮罩)
  ├─ aside.lx-sidebar
  │   ├─ .lx-sidebar-header (精简 Hero：黑底+金光+校名+分割线+校训)
  │   └─ nav.lx-nav
  │       ├─ 智能助手组：💬 立信问答 (data-view="chat", 默认 active)
  │       ├─ 🏫 校内组：10 个导航项 (data-view="content", data-parent="campus", data-idx=0-9)
  │       └─ 💼 校外组：2 个导航项 (data-view="content", data-parent="offcampus", data-idx=0-1)
  └─ main.lx-main
      ├─ section.lx-view.lx-view-chat.active (LLM 对话，默认显示)
      │   ├─ .lx-chat-header (标题"立信避雷助手"，无关闭按钮)
      │   ├─ .lx-chat-suggest (3 个推荐问题 chips)
      │   ├─ .lx-chat-messages (flex:1 可滚动，历史消息)
      │   └─ .lx-chat-input-row (输入框 + 发送按钮，固定底部)
      └─ section.lx-view.lx-view-content (避雷指南，默认隐藏)
          ├─ .lx-content-body (12 个 .lx-subcontent，靠 data-parent+data-idx 切换显示)
          └─ .lx-notice (使用说明，保留原样)

#lx-context (隐藏 JSON，保留，LLM 上下文数据)
```

**技术实现**:
- **删除**：`.lx-hero`（移入 sidebar）、`.lx-topbar`/`.lx-tab-top`（双层 Tab）、`.lx-subtabs`、`.lx-chat-fab`（悬浮按钮）、`.lx-chat-close`（关闭按钮）、`.lx-section` 包裹层
- **保留**：`#lx-context`、所有 `.lx-subcontent` 排版样式、`.lx-notice` 使用说明、LLM 逻辑（API_URL/send/SSE/renderMarkdown/AbortController/loading 计时器）
- **LLM 逻辑改造**：删除 `openWindow()`/`closeWindow()` 和 fab/closeBtn 事件绑定；DOM ID（`lx-chat-messages`/`lx-chat-input`/`lx-chat-send`/`lx-chat-suggest`）不变，`send()`/`appendMsg()`/`renderMarkdown()` 函数体不改
- **CSS 变量**：新增 `--lx-sidebar-width: 300px`/`--lx-main-max: 1440px`/`--lx-sidebar-bg`/`--lx-sidebar-border`，定义在 `:root`
- **PaperMod 突破**：`.main:has(.lx-page)` 突破 768px
- **视图切换核心**：`switchView(link)` 依据 `data-view` 切换 `.active`；非 chat 视图额外用 `data-parent` + `data-idx` 匹配 `.lx-subcontent` 显示对应内容
- **移动端抽屉**：≤1024px 汉堡按钮 + 遮罩 + `transform: translateX(-100%)` 滑入 + ESC 关闭 + 选中后 `setTimeout(closeSidebar, 100)`

**关键挑战与解决**:
| 挑战 | 解决 |
|------|------|
| LLM 对话占满主内容区高度 | `.lx-view-chat.active` flex 列 + `height: calc(100vh - 3rem)`，messages `flex:1; min-height:0; overflow-y:auto` |
| 视图切换不丢失对话状态 | 两个视图始终在 DOM 中，仅靠 `.active` 切 `display`；messages 不重建，历史消息完整保留 |
| 对话视图 vs 内容视图滚动行为不同 | 对话：固定高度+内部滚动；内容：`display:block` 正常流式，整页滚动；sidebar `position:sticky` 两种模式都正常 |

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `layouts/_default/lixin.html` | 完全重写（1286 行 → sidebar 布局 + LLM 对话主页化） |
| `PROJECT_CONTEXT.md` | 版本号 v5.7→v5.8、功能清单、版本演进表、技术决策表 |
| `PROJECT_DOCUMENTATION.md` | 版本号、功能特性、技术决策表、更新日志 v5.8 条目 |

**v5.5 sidebar 统一完成**：至此 learn/posts/resources/SleepTown/lixin 5 个板块全部统一为 learn 风格 sidebar 设计。

**Bug Fix - extend_head.html 文件名修正**：
- 🐛 **问题**：Aa 字体调节按钮在浏览器中显示为"Aa80%90%100%110%120%"且点击无响应
- 🔍 **根因**：项目自 v5.2 起一直使用文件名 `layouts/partials/extended_head.html`（带 ed），但 PaperMod 主题的 `themes/PaperMod/layouts/_partials/head.html:186` 引用的是 `extend_head.html`（不带 ed）。文件名不匹配导致 partial 查找失败，**所有累积在 `extended_head.html` 中的 CSS 从未加载**（包括 v5.6 主题切换动画的 `::view-transition-*` CSS、v5.7 字体调节的 `.font-toggle`/`.font-popup`/`.font-scale-btn` 样式、以及更早的个人按钮/弹窗样式）。
- ✅ **修复**：`git mv layouts/partials/extended_head.html layouts/partials/extend_head.html` 修正文件名
- 📊 **影响范围**：
  - v5.6 主题切换圆形扩散动画：JS 生效（在 `extend_footer.html`），但 CSS 装饰（`::view-transition-new(root)` z-index）缺失 → 现在完整生效
  - v5.7 字体调节：JS 注入按钮生效，但 CSS 缺失导致弹窗一直可见 + 5 档按钮挤在 Aa 旁 + 切换 `.open` 无视觉效果 → 现在完整生效
  - v5.2 个人按钮/弹窗样式：之前依赖 `static/css/custom.css` 兜底，现 `extend_head.html` 内的样式也生效
- 🔎 **验证**：`hugo --minify --gc` 后 `public/index.html` head 段从 2818 字节增长到 6953 字节，包含 `font-scale`/`font-toggle`/`font-popup`/`view-transition` 全部 CSS 规则
- 💡 **教训**：PaperMod 主题的扩展点文件名是 `extend_head.html` / `extend_footer.html`（动词原形），不是 `extended_head.html` / `extended_footer.html`（过去分词）；项目里 `extend_footer.html` 一直正确，但 `extended_head.html` 从 v5.2 起就拼错了

---

### v5.7 (2026-07-31) - 字体大小调节功能

**新增功能**:
- ✅ **字体大小调节按钮**：header `.logo-switches` 中 `#theme-toggle` 之后注入"Aa"按钮
- ✅ **5 档弹窗**：点击弹出小面板，含 80%/90%/100%/110%/120% 五档
- ✅ **localStorage 持久化**：键名 `pref-font-scale`，刷新后保持
- ✅ **首屏防闪烁**：IIFE 顶部立即 `applyScale(saved)`，不等 DOMContentLoaded
- ✅ **重复注入防护**：`if (document.querySelector('.font-toggle-wrap')) return`（社区页历史 Bug 防御）
- ✅ **关闭逻辑**：点击档位后自动关闭 + 点击外部关闭 + ESC 关闭

**技术实现**:
- **CSS 变量 `--font-scale`**（定义在 `:root`，符合项目硬约束）：`html { font-size: calc(100% * var(--font-scale, 1)) }`
- **关键覆盖**：`body { font-size: 1rem !important }` 覆盖 `static/css/custom.css:42` 的 `body { font-size: 16px }`（px 硬编码会导致正文不跟随缩放）
- **1rem 自动跟随**：1rem = html 的 font-size（已含 --font-scale），无需重复乘 scale
- **布局稳定性**：sidebar 宽度用 px（`--learn-sidebar-width: 300px`）、header 高度用 px，不受 font-size 影响 —— 只缩放文字内容，不破坏布局骨架
- **弹窗样式**：背景用 `var(--theme)`、边框用 `var(--border)` 自动随 `[data-theme]` 切换；active 高亮用金色 `#D4AF37`
- **与主题切换动画隔离**：字体按钮是独立元素，不触发 `#theme-toggle` 的 View Transitions 监听器；两个 localStorage 键（`pref-theme` vs `pref-font-scale`）互不冲突

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `layouts/partials/extended_head.html` | 追加 CSS：`--font-scale` 变量、html/body font-size、`.font-toggle`/`.font-popup`/`.font-scale-btn` 样式 |
| `layouts/partials/extend_footer.html` | 追加 JS：`initFontToggle()` IIFE（按钮注入 + 持久化 + 5 档弹窗 + 关闭逻辑） |
| `PROJECT_CONTEXT.md` | 版本号 v5.6→v5.7、功能清单、版本演进表、技术决策表 |
| `PROJECT_DOCUMENTATION.md` | 版本号、功能特性、技术决策表、更新日志 v5.7 条目 |

---

### v5.6 (2026-07-30) - 主题切换圆形扩散动画

**新增功能**:
- ✅ **主题切换按钮圆形扩散动画**：点击 `#theme-toggle` 时，新主题以按钮为圆心向外圆形扩散覆盖旧主题
- ✅ 双向自适应：亮→暗 用黑幕从按钮合拢覆盖全屏；暗→亮 用反向光明绽放
- ✅ 600ms `cubic-bezier(0.4, 0, 0.2, 1)` 缓动
- ✅ 灵感来源于 [algo.itcharge.cn](https://algo.itcharge.cn)

**技术实现**:
- 使用 View Transitions API（`document.startViewTransition()`）+ `::view-transition-new(root)` 伪元素 + `clipPath` Web Animations API
- **捕获阶段拦截**：`addEventListener('click', fn, true)` 拦截 PaperMod 原生 click（`footer.html:96` 在 bubbling 阶段绑定），`stopImmediatePropagation()` 阻止原生逻辑
- **圆心和半径**：`toggle.getBoundingClientRect()` 取按钮中心；半径 `Math.hypot(max(x, W-x), max(y, H-y))` 覆盖到屏幕最远角
- **不破坏原生降级路径**：不支持 `startViewTransition` / `prefers-reduced-motion: reduce` → 不拦截，走 PaperMod 原生瞬间切换
- **CSS 层级**：`::view-transition-new(root) { z-index: 9999 }` 确保新主题在上层；禁用默认 cross-fade 动画

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `layouts/partials/extend_footer.html` | 追加捕获阶段拦截脚本 + startViewTransition + clipPath 动画 |
| `layouts/partials/extend_head.html` | 追加 `::view-transition-*` CSS（禁用默认 cross-fade、设置层级、reduced-motion 降级）（v5.8 修正文件名同步） |
| `PROJECT_CONTEXT.md` | 版本号 v5.5→v5.6、功能清单新增、版本演进表、技术决策表 |
| `PROJECT_DOCUMENTATION.md` | 版本号、功能特性、技术决策表、新增动画说明章节、更新日志 |

**视觉一致性微调（同日追加）**:
- 娱乐中心 `/play/` (`play.html`)：删除标题/卡片表情（🎮/🐟/🎲）、标题改用 Playfair Display、卡片 padding/字号/radius 全面收紧
- SleepTown 模式选择页 (`sleeptown.html`)：删除 `🐟`/`🎮`/`🏆`/`⚡`/`🚀` 表情、两个主标题 + 模式卡片 h2 + 快速开始 h3 改用 Playfair Display、`.mode-btn`/`.quick-start-btn` padding 14px→9px / font-size 1.1rem→0.92rem / radius 12px→9px、删除 `.mode-icon` CSS 规则
- **目标**：与文章/资源/学习路径/SleepTown 关卡页的视觉语言统一（Playfair Display 标题 + 紧凑按钮 + 无多余表情）
- 关卡页内的角色介绍、规则、配置等 h3 标题表情（🐟/🎭/🏆 等）属游戏内容保留不动

**浏览器兼容性**：Chrome/Edge 111+、Safari 18+、Opera 99+ 原生支持；Firefox 暂不支持，自动降级为瞬间切换无动画。

---

### v5.5 (2026-07-30) - 文章列表页 learn 风格改造

**UI 改造**:
- ✅ 文章列表页 (`/posts/`) 改造为 learn 风格「左固定 sidebar + 右主内容」grid 布局
- ✅ Sidebar 含三组导航：所有文章（按时间倒序）/ 标签 / 快速导航
- ✅ 复用 learn 视觉语言：金色 CSS 变量、Playfair Display 字体、nav-link 样式
- ✅ 移动端（≤1024px）抽屉化 sidebar：汉堡按钮 + 遮罩 + ESC 关闭 + 点击链接后关闭
- ✅ 保留现有搜索栏、社区帖子卡片加载、博客文章卡片网格逻辑
- ✅ **资源分享页 (`/resources/`) 改造为 learn 风格 sidebar 布局**（同 posts 设计语言）
- ✅ 资源卡片网格：日期/类型/标题/摘要/标签/查看详情
- ✅ **SleepTown 关卡模式 (`/play/sleeptown/`) 改造为 learn 风格 sidebar 布局**（SleepTown v2.2.2.0）
- ✅ SleepTown 关卡扩展至 10 关（第1章 8 关 + 第2章 2 关），右主内容动态渲染选中关卡详情卡片
- ✅ **文章页 UI 微调**：移除主标题「📝」表情、移除搜索框放大镜图标（简化视觉）

**技术决策**:
- CSS 变量定义在 `:root`（移动端 sidebar `position: fixed` 后脱离父子树，需提升到根）
- `.main:has(.posts-page)` / `.main:has(.resources-page)` / `.main:has(.stagemode-page)` 突破 PaperMod `.main` 768px max-width 约束（同 learn）
- 社区帖子 fetch 加 15s AbortController 超时保护（防止网络故障永久挂起）
- 暗色模式用 `[data-theme="dark"]` 覆盖 `--posts-*` / `--resources-*` / `--stagemode-*` 变量
- 资源页 `_index.md` 声明 `layout: resources` 触发自定义模板
- SleepTown 关卡模式新增 `stageDetails` 数据对象（UI 展示用）与 `stageConfigs`（游戏逻辑用）分离
- SleepTown `selectStage()` 动态渲染右主内容，`showStageMode()` 默认选中 1-1 关

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `layouts/_default/posts.html` | 重写为 learn 风格布局；移除标题表情与搜索图标 |
| `layouts/_default/resources.html` | 新建：learn 风格资源列表模板 |
| `content/resources/_index.md` | 添加 `layout: resources` 声明 |
| `layouts/_default/sleeptown.html` | 关卡模式改造为 learn 风格 sidebar 布局（SleepTown v2.2.2.0） |
| `docs/SleepTown-项目文档.md` | SleepTown 文档同步至 v2.2.2.0 |
| `PROJECT_CONTEXT.md` | 版本号 v5.4→v5.5、文件索引、技术决策表 |
| `PROJECT_DOCUMENTATION.md` | 版本号、目录结构、更新日志、技术决策表 |

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
- ✅ **资源板块** — 5 篇资源帖（Adobe 全家桶、Stata19 MP、Amos 29、Stata OLS 遍历、Wireshark）
- ✅ **关于我** (`/me/`) — 个人介绍页
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
- ✅ 关于我 (`/me/`) — 个人介绍页
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

*文档结束 | 最后更新: 2026-07-31 | 版本: v5.7 | 状态: ✅ 生产就绪*

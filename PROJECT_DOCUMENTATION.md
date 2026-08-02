# DeepSleep Blog - 项目技术文档

> **最后更新**: 2026-08-03
> **版本**: v5.15
> **状态**: ✅ 生产就绪 | 评论系统正常运行 (Neon PostgreSQL) | 💬 社区系统已上线 | 👤 全局个人中心 | 📝 文章板块整合 (learn 风格 sidebar) | 🌗 主题切换圆形扩散动画 | 🐟 SleepTown 首页 sidebar 改造 | 🎮 交互式自我介绍 (/play/me/) | 🃏 CardArena 卡牌对战 (/play/cardarena/) | 👑 CardArena 苏丹宫廷风卡牌样式 | ⚔️ CardArena 极繁深化 | 🎴 CardArena 对战页去框化+二维布局 | 🃏 CardArena 每角色独立卡池系统

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
- 🎮 **交互式自我介绍**（`/play/me/` 滚动叙事 + 数据可视化 + 打字机流式）✅ v5.9 新增
- 🃏 **CardArena 卡牌对战**（`/play/cardarena/` 8 角色选 6 + 独立卡组 + 6 关键词 + 基础 AI，模块化 JS 架构 data/engine/ai/ui 四文件）✅ v5.10 新增
- 👑 **CardArena 苏丹宫廷风卡牌样式**（参考《苏丹的游戏》：黑金暗夜/浅金羊皮纸双主题随博客切换，四品级 × 八角星徽 + 四角卷草纹 + 圆形宝石费用 + 品级缎带；极繁主义装饰：放射光芒暗纹/双线角花/数值宝石框/英文品级缎带）✅ v5.12 新增
- ⚔️ **CardArena 极繁深化**（舞台四角纹章 + 珠串边线 + 分区面板金珠内框 + 三层八珠光环徽章；随从卡 112×150 统一长方形极繁样式；出战区英文宫衔 + 八角星水印；战斗特效系统：伤害飘字/受击闪光/冲击波/死亡化灰烬/换人 3D 幽灵卡翻飞/召唤翻转入场/抽牌 3D 翻入，引擎零改动、UI 状态快照对比驱动；八角星徽彩色渐变 SVG 立体化 23 元素渐变+描边+宝石珠+高光明暗两套；四角纹章四方向旋转贴合；移动端 ≤640px 横向滚动优化 + 装饰弱化）✅ v5.13 新增
- 📚 **CPA 阶段B 习题整合**（六科 92 章「## 7. 同步练习」整合《必刷550题》1500+ 题 + 09 历年真题板块 2013-2025 × 6 科 78 页全文真题）✅ v5.11 新增

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
| **CardArena 模块化架构** | **data/engine/ai/ui 四文件拆分** (v5.10) | **纯前端回合制卡牌游戏，engine 为纯状态机不碰 DOM，ui 全权负责渲染与交互，ai 复用 engine `_internal` 只读接口，data 集中配置可自定义角色卡牌（区别于 SleepTown 单文件模板）** ⭐ 新增 |
| **CPA 习题整合（阶段B）** | **550题进章节同步练习 + 真题单开 09 板块** (v5.11) | **六科 92 章补「## 7. 同步练习」（题目 + `**练习答案**`，不标注来源）；2013-2025 真题全文结构化 78 页；learn.html 嵌套 section 自动展开改 `strings.HasPrefix`（eq 对 09-exams 年份子页失效）；KaTeX 按需动态加载（检测 `$` 分隔符才加载，`%` 转义 `\%`）** ⭐ 新增 |
| **CardArena 苏丹宫廷风卡牌** | **黑金暗夜/浅金羊皮纸双主题随博客切换** (v5.12) | **参考《苏丹的游戏》四品级系统（金/银/铜/石按战力/费用映射）；八角星徽用 CSS mask + SVG 绘制随品级变色；四角卷草纹 L 形角饰；圆形径向高光费用宝石；品级缎带 + 攻血金线分隔；`--ca-tier-*` 品级变量在 :root 定义、`[data-theme="dark"]` 覆写实现双主题；8 角色新增宫衔 title（宫廷侍卫长/大殿法官等）增强宫廷代入感** ⭐ 新增 |
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
│   └── play/                        # 游戏板块
│       ├── me.md                    # 交互式自我介绍页声明 (layout: me-game) v5.9
│       └── cardarena.md             # CardArena 页声明 (layout: cardarena) v5.10 新增
│   └── learn/cpa/09-exams/           # ⭐ CPA 历年真题板块 (2013-2025 × 6 科 = 78 页全文真题) v5.11 新增
├── layouts/
│   ├── partials/
│   │   ├── comments.html            # Waline 评论组件
│   │   ├── extend_footer.html       # ⭐ 全局功能（个人弹窗 + JS）v5.2 更新
│   │   └── extend_head.html          # ⭐ 全局样式（个人按钮 + 弹窗样式）v5.2 更新；v5.8 修正文件名（extended_head.html 未被 PaperMod 加载）
│   └── _default/
│       ├── community.html           # 社区布局模板
│       ├── learn.html              # ⭐ 学习板块模板 (CPA/ACCA sidebar，v5.11 嵌套 section HasPrefix 自动展开 + KaTeX 动态加载)
│       ├── posts.html              # ⭐ 文章列表模板 (learn 风格 sidebar) v5.5 改造
│       ├── resources.html           # ⭐ 资源列表模板 (learn 风格 sidebar) v5.5 新增
│       ├── play.html                # 娱乐中心模板 (Playfair Display 标题 + 紧凑卡片) v5.6
│       ├── me-game.html            # ⭐ 交互式自我介绍模板 (5 section + 打字机流式) v5.9 新增
│       ├── cardarena.html          # ⭐ CardArena 游戏模板 (固定加载顺序 data→engine→ai→ui) v5.10 新增
│       └── sleeptown.html          # ⭐ SleepTown 游戏模板 (含关卡模式 sidebar) v2.2.2.0
├── static/
│   ├── css/
│   │   ├── custom.css               # 自定义样式
│   │   ├── waline.css               # Waline 样式 (22KB)
│   │   ├── community.css            # 社区样式 (含夜间模式 + 个人按钮)
│   │   └── cardarena.css            # CardArena 样式 (苏丹宫廷风极繁 + 彩色星徽 + 移动端优化, 1855 行) v5.10 新增
│   ├── js/
│   │   ├── waline.umd.min.js        # Waline JS (256KB, 必须完整)
│   │   ├── community.js             # ⭐ 社区交互逻辑 + 全局个人中心函数 v5.2 更新
│   │   ├── cardarena-data.js       # CardArena 数据层 (GAME_CONFIG/ROLE_POOL/CARDS) v5.10 新增
│   │   ├── cardarena-engine.js     # CardArena 引擎 (纯状态机, window.CardArena API) v5.10 新增
│   │   ├── cardarena-ai.js         # CardArena AI (贪心三阶段: 出牌/攻击/换人) v5.10 新增
│   │   └── cardarena-ui.js         # CardArena UI (DOM 渲染 + 事件委托 + 选目标高亮) v5.10 新增
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

## 📚 Bug Fix Q&A: CardArena 抽牌效果不生效（2026-08-02）

### ❓ Problem: 抽两张牌的卡牌不生效，使用后没有多两张牌

**Symptoms**:
- 「抽牌术」/「占卜」等抽牌法术打出后，手牌数量没有明显增加
- 预言家（r3，被动每回合多抽 1 张）游玩时最明显——手牌极易顶满，抽牌法术完全失效
- 中后期所有抽牌效果全部失效（牌库抽空）

**Environment Context**:
- Date: 2026-08-02
- Affected Component: CardArena 卡牌对战（`/play/cardarena/`）· 数值配置
- 相关文件：`static/js/cardarena-data.js` / `static/js/cardarena-engine.js` / `static/js/cardarena-ai.js`

---

### 🔍 Root Cause Analysis

**Technical Root Cause**:
两个数值配置问题叠加导致抽牌效果「看着像 bug」：
1. **手牌上限仅 5**（`GAME_CONFIG.handLimit: 5`）：手牌满 5 张时打出抽 2 张法术，流程为「打出扣 1 张 → 抽 2 张」→ 第 2 张被 `drawCards` 的 `hand.length >= handLimit` 拦截，净增 0 张。预言家被动每回合多抽 1，两回合内必然顶满 5 张。
2. **牌库仅 6 张**（每角色 6 种卡各 1 份）：起手抽 3 + 每回合抽 1，第 3 回合牌库即抽空；`drawCards` 遇到 `deck.length === 0` 直接 break，此后所有抽牌（含亡语抽牌/被动）永久失效。

**Discovery Method**:
- 用户实测反馈 → 静态代码审查 `playCard` → `applyEffect('draw')` → `drawCards` 全链路
- 浏览器控制台直接操作引擎状态复现：满手牌时抽牌法术净增 0 张

**Why It Failed**:
引擎逻辑本身正确（`playCard` 先 splice 再 `applyEffect` 抽牌），失败在**数值边界**：手牌上限太紧 + 牌库太小，正常对局中必然触发拦截条件，使抽牌法术退化为无效牌。

---

### ✅ Solution: 提高手牌上限至 7 + 牌库翻倍至 12 张

**Fix Applied**:
1. **手牌上限 5 → 7**（`cardarena-data.js` `GAME_CONFIG.handLimit`）：预留抽牌空间，手牌 6 张以下打出抽 2 张都能完整抽进
   - Before: `handLimit: 5`
   - After: `handLimit: 7`
2. **牌库每张牌 2 份（6 → 12 张）**（`cardarena-engine.js` `buildDeck` + `cardarena-ai.js` `buildDeckAI`）：两处组牌逻辑同步 `deck.push(card.id, card.id)`，避免抽牌效果提前因牌库耗尽失效

**Files Modified**:
- [`cardarena-data.js`](file:///c:/Users/26516/Desktop/n8n/blog-static/static/js/cardarena-data.js): `handLimit: 5 → 7`
- [`cardarena-engine.js`](file:///c:/Users/26516/Desktop/n8n/blog-static/static/js/cardarena-engine.js): `buildDeck` 每张牌 push 2 份
- [`cardarena-ai.js`](file:///c:/Users/26516/Desktop/n8n/blog-static/static/js/cardarena-ai.js): `buildDeckAI` 每张牌 push 2 份（与引擎保持一致）

---

### 🧪 Verification

**Test Results**（浏览器子代理实测，http://localhost:1315/play/cardarena/）:
- ✅ 配置检查：`GAME_CONFIG.handLimit = 7`
- ✅ 开局牌库：牌库 + 手牌合计 12 张（修复前 6 张），每张卡均出现 2 次
- ✅ 手牌 3 张时打「抽牌术」：3 → 4（打 1 抽 2 净 +1，抽牌正常触发）
- ✅ 手牌 6 张时打「抽牌术」：6 → 7（新上限 7 下完整抽进 2 张，不再被卡）
- ✅ 无引擎 JS 错误

**Rollback Plan**:
如需回滚：`handLimit` 改回 5，`deck.push(card.id, card.id)` 改回 `deck.push(card.id)`（引擎与 AI 两处）。

---

### 💡 Prevention & Best Practices

**To Prevent Recurrence**:
1. 新增抽牌类效果前，先核对 `handLimit` 与牌库规模：抽牌价值 = 可抽牌数 × 牌库剩余量，两者任一过小都会让抽牌退化为无效牌
2. 引擎 `drawCards` 的边界分支（牌库空/手牌满）改动需在 `cardarena-engine.js` 与 `cardarena-ai.js` **两处同步**（AI 直接操作 side 状态对象）

**Related Documentation**:
- v5.13 更新日志（CardArena 极繁深化章节）
- CardArena 设计文档：`docs/superpowers/specs/2026-08-02-cardarena-sultan-card-design.md`

---

### 📊 Impact Summary

| Metric | Value |
|--------|-------|
| **Severity** | 🟡 High（核心玩法数值问题，非崩溃） |
| **Downtime** | 无 |
| **Users Affected** | 使用抽牌卡/预言家的玩家 |
| **Time to Fix** | ~20 分钟（含验证） |
| **Complexity** | Low（3 处数值/循环改动） |

---

**🎓 Key Learnings**:
> 抽牌类效果「不生效」不一定是逻辑 bug，先检查数值边界（手牌上限 + 牌库规模）。引擎与 AI 两套组牌逻辑必须同步修改，否则 AI 与玩家体验不一致。

**🔗 Related Issues**:
- v5.13 迭代中修复的 `analyzeFx` 两个致命 Bug（同为浏览器实测发现）

---

## 📝 更新日志

### v5.12 (2026-08-02) - CardArena 苏丹宫廷风卡牌样式

**新增功能**:
- ✅ **苏丹宫廷风卡牌视觉体系**（参考《苏丹的游戏》）
  - 卡面双主题随博客切换：深色 = 黑金暗夜（黑底渐变 + 鎏金双线 + 金色光晕数值），浅色 = 浅金羊皮纸（羊皮纸渐变 + 深金描边 + 朱砂卡名）
  - **四品级系统**：黄金/白银/青铜/岩石，品级决定整卡描边色与数值光色（法术按费用、随从按战力映射）
  - **八角星徽**：中央阿拉伯几何纹样，CSS `mask-image` + SVG 绘制（双方形旋转 45° 叠加 + 中心圆 + 四向小圆 + 中心菱形），随品级变色
  - **四角卷草纹角饰**：L 形金线四角装饰，随品级变色
  - **圆形费用宝石**：左上角径向高光圆球，外圈光晕 + 投影
  - **品级缎带**：卡顶居中小字（0.42em 宽字距）+ 渐隐金线分隔；攻血区底部金线分隔 + 大号数值
- ✅ **角色宫衔**：8 个角色新增 `title` 宫衔（宫廷侍卫长/大殿法官/宫廷占星师/夜巡统领/军械监制/禁军教头/瞭望塔主/密探之首），选人卡与出战英雄展示

**技术变更**:
- `cardarena.css`：`.ca-card` 重构为 flex 纵向布局（156×190px）；`--ca-tier-gold/silver/bronze/stone` 品级变量在 `:root` 定义、`[data-theme="dark"]` 覆写实现双主题；八角星徽 mask 复用单一 SVG data-URI；移动端 128px 适配
- `cardarena-ui.js`：`buildHandBar` 生成新 DOM（四角卷草纹 × 4 + 品级缎带 + 圆形费用宝石 + 八角星徽区 + 攻血区）；`cardTier()` 品级映射保留
- `cardarena-data.js`：ROLE_POOL 8 角色新增 `title` 宫衔字段

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `static/css/cardarena.css` | 修改：卡牌样式重构为苏丹宫廷风双主题 |
| `static/js/cardarena-ui.js` | 修改：手牌卡 DOM 结构 + 品级缎带 + 八角星徽 |
| `static/js/cardarena-data.js` | 修改：8 角色新增宫衔 title |
| `docs/superpowers/specs/2026-08-02-cardarena-sultan-card-design.md` | 新增：设计文档（v3 定稿：黑金暗夜 × 八角星徽，随主题变色） |
| `PROJECT_CONTEXT.md` | 版本号 v5.11→v5.12、功能清单、版本演进表 |
| `PROJECT_DOCUMENTATION.md` | 版本号、功能特性、技术决策表、更新日志 v5.12 条目 |

**验证**：`hugo --gc` 350 页无 error；浏览器实测明/暗双主题手牌卡全部元素（费用宝石/品级缎带/八角星徽/四角角饰/攻血值）正常，无布局溢出、无 JS 报错。

### v5.12 补充（同日追加）- 角色选卡界面升级：苏丹宫廷风卡牌 + 翻转闪光特效

**新增功能**:
- ✅ **角色选卡卡牌化**（renderSetup 重构）：8 张角色卡由简单方框升级为与手牌卡同款苏丹宫廷风卡面
  - 双主题随博客切换：深色 = 黑金暗夜，浅色 = 浅金羊皮纸
  - 宫衔缎带（宫廷侍卫长/大殿法官等）置顶 + 渐隐金线
  - 中央八角星徽（CSS mask）+ 角色名首字（守/仲/预…）徽记
  - 底部金线分隔 ❤ 生命 / ⚔ 攻击 数值 + 被动描述
  - 品级按战力（maxHealth+attack）映射：≥23 金 / ≥20 银 / ≥18 铜 / 其余石
- ✅ **翻转选卡闪光特效**：
  - 双面 3D 卡（`.ca-role-inner` preserve-3d + `.ca-role-face` backface-visibility）：
    - 正面 = 角色信息；背面 = 鎏金「已出战」印版（八角星 + 角色名 + 已出战字样）
    - `.selected` 触发 `rotateY(180deg)` 0.55s 过渡
  - 点击瞬间 `.flipping` 类（650ms）触发双动画：
    - `ca-role-flip-bounce`：90° 翻转 + 1.06 放大回弹（cubic-bezier 过冲）
    - `ca-role-shine-sweep`：金色斜向闪光层扫过卡面（skewX -18° + translateX -160%→340%）
  - 取消选择同样播放反向翻转 + 闪光；超 6 张拦截保护保留

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `static/css/cardarena.css` | 修改：角色卡卡面样式（正/背面）+ 翻转/闪光 keyframes + 品级变量 |
| `static/js/cardarena-ui.js` | 修改：renderSetup 新 DOM、roleTier() 品级映射、toggleRole 动画触发 |

**验证**：`hugo --gc` 350 页无 error；浏览器实测明/暗双主题 8 角色卡元素齐全、翻转选卡动画流畅（帧采样 transform 连续变化、animationstart/end 双向触发）、计数 0-6/6 与按钮禁用联动正确、无溢出/重叠/JS 报错。

### v5.12 补充（同日追加 2）- CardArena 极繁主义卡牌升级（去汉字 + 英文宫衔 + 丝滑翻转）

**新增功能**（对应需求：①中央徽记无汉字 ②翻面无跳帧 ③顶部英文 ④极繁主义）:
- ✅ **中央徽记去汉字化**：删除角色名首字徽记（守/仲/预…），改为**纯几何三层八角星组** — 外星 86px（mask 双正方形叠加）+ 内星 52px（旋转 22.5° 交叠）+ 中心宝石 14px（菱形高光渐变），徽记区 `innerText` 为空、零中文
- ✅ **宫衔缎带英文化**：8 角色新增 `titleEn` 字段（ROYAL GUARD / GRAND JUDGE / COURT ASTROLOGER / NIGHT WARDEN / ARSENAL MASTER / DRILLMASTER / TOWER WARDEN / SPYMASTER），Playfair Display 大写 + 0.42em 宽字距 + 两侧菱形点缀；**手牌卡品级缎带同步英文化**（GOLD/SILVER/BRONZE/STONE）
- ✅ **极繁主义装饰体系**（角色卡 + 手牌卡统一）：
  - 放射光芒暗纹：`conic-gradient` 12 段交替金色射线（角色卡 5% 透明度、手牌卡 4%）
  - 双层内框：1px 品级金线 + 6px 细线（inset box-shadow）
  - 四角双线角花：20px 角饰 + `::before` 内嵌 8px 旋转菱形
  - 顶饰金线：`ca-role-topline` 双线分段 + 中心实心菱形
  - 数值宝石框：`ca-role-stat` 菱形边框 + 虚线内框（z-index:-1 靠父级 stacking context 隔离）
  - 背面「ON DUTY」英文印版：八角星徽绝对定位 top:42% + 角色名 68% + 印版 78%
  - 费用宝石放射星芒：conic-gradient 齿状底 + `::before` 外圈星芒环（mask 环形渐隐）
- ✅ **翻面跳帧修复**：完全移除 `ca-role-flip-bounce` transform 动画（90°+1.06 放大回弹与 transition 双写 transform 导致跳帧），翻转仅由 `.ca-role-inner` transition（0.65s `cubic-bezier(0.22,1,0.36,1)`）驱动；闪光层动画保留在 `.ca-role-shine::after`（translateX 不与 transform 属性冲突）
- ✅ **浅色主题缎带对比度修复**：亮色（如银 #cfd6e2）叠浅金纸对比度仅 1.01:1 → 浅色主题下 `color: var(--ca-tier-color)` + `text-shadow: none`（深银灰蓝 #808fa8，2.74:1）

**技术变更**:
- `cardarena.css`：新增 `.ca-role-topline/.ca-role-star-outer/.ca-role-star-inner/.ca-role-gem/.ca-role-stat-*` 系列；`.ca-role-back` 改绝对定位叠放；`.ca-card-cost::before` 星芒环；删除 flip-bounce keyframes；`.ca-role-band` 字体 Cinzel → Playfair Display（Google Fonts 未加载，改用全站已加载字体）
- `cardarena-ui.js`：`renderSetup` 删除 `ca-role-initial` 首字徽记 → 三层星徽组；缎带改 `role.titleEn`；背面 `ON DUTY` 印版；手牌卡 tierNames 改英文；`.flipping` 类 remove→reflow→add 重放闪光
- `cardarena-data.js`：ROLE_POOL 8 角色新增 `titleEn` 字段

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `static/css/cardarena.css` | 修改：极繁装饰体系 + 翻转跳帧修复 + 字体替换 + 浅色缎带对比度 |
| `static/js/cardarena-ui.js` | 修改：纯几何徽记 + 英文缎带 + ON DUTY + 英文品级 |
| `static/js/cardarena-data.js` | 修改：8 角色新增 titleEn |
| `PROJECT_CONTEXT.md` | 功能清单、文件索引、版本演进表 v5.12 条目补充 |
| `PROJECT_DOCUMENTATION.md` | 功能特性、更新日志 v5.12 追加记录 |

**验证**：`hugo --gc` 350 页无 error；浏览器四重验证（DOM/计算样式/逐帧采样/截图）— rAF 帧采样确认旋转角单调递减、每帧 8-10°、无跳帧闪烁；明/暗双主题角色卡（英文缎带/纯几何星徽/放射暗纹/宝石框）与手牌卡（星芒费用宝石/英文品级缎带）全部正常，无溢出、无 JS 报错。

### v5.13 (2026-08-02) - CardArena 极繁深化：界面繁化 + 战斗特效 + 随从卡

**新增功能**（对应需求：①进一步繁化徽章/界面/背景 ②对战界面卡牌 UI 同步繁化 + 攻击伤害特效 + 角色/随从死亡化灰烬 + 换人/出战新角色时从角色牌区翻开翻转移动到出战角色区（立体感）③随从卡繁化 + 统一卡牌长方形大小）:

- ✅ **界面繁化**（舞台/分区面板/徽章三层光环）
  - `.ca-stage` 舞台外框：四角纹章（SVG mask 非十进制编码，background 上色随主题变色）+ 边线珠串（repeating-linear-gradient）
  - 分区面板（角色牌区/战场/手牌/战斗日志）inset 细线内框 + 四角金珠；战场放射光芒暗纹背景
  - 徽章三层光环：旋转八珠光环（`.ca-*-halo` 55s 旋转）+ 双虚线圆环（`.ca-*-ring`），尺寸分级：角色 124px / 手牌 100px / 随从 74px
- ✅ **随从卡全新极繁样式**：112×150 统一长方形（与角色/手牌卡比例一致），conic 放射暗纹 + 品级缎带（英文 GOLD/SILVER/BRONZE/STONE）+ 八角星徽记区 + 菱形宝石数值框（双层菱形）+ 关键词金线分隔 + 五层框阴影 + hover 上浮
- ✅ **出战区繁化**：`.ca-hero::after` 内框 + 四角金珠 + `.ca-hero-en` 英文宫衔（Playfair + 0.42em 字距 + 左右渐隐金线）+ `.ca-hero-star` 八角星水印
- ✅ **战斗特效系统**（引擎零改动，UI 状态快照对比驱动；`renderAll` 对比 `prevState` 深拷贝快照检测变化，特效元素 fixed 定位挂载 `document.body`，AI 回合同一宏任务多次 `renderAll` 不清特效，`setTimeout` 定时清理）

| 变化 | 特效 |
|---|---|
| hero/minion 掉血 | 红色伤害飘字 `.ca-fx-dmg` + 受击白闪 `.ca-hit` + 金色冲击波 `.ca-fx-impact` + 攻击者前倾 `.ca-lunge`（仅玩家操作，`pendingAction` 提供） |
| health 上升 | 绿色治疗飘字 `.ca-fx-heal` |
| minion 从战场消失 | 22 粒金棕灰烬上飘旋转 `.ca-ash` + 烟尘 `.ca-ash-puff`（位置用 `captureRects` 预捕获旧 rect） |
| 换人 `activeIndex` 变化 | `.ca-ghost` 3D 幽灵卡从角色牌区翻飞向出战区（WAAPI `element.animate` rotateY 0→180 + 位移）→ 落地 14 粒金尘 `.ca-spark` + `.ca-hero-enter` 下压抬升 |
| 新随从入场 | `.ca-minion-enter` 翻转立起入场 |

- ✅ **随从关键词中文化**：taunt→嘲讽 / charge→冲锋 / deathrattle→亡语 / divine_shield→圣盾 / windfury→风怒 / poison→剧毒（`KW_ZH` 映射 + `kwText()`）

**技术变更**:
- `cardarena.css`：三个 SVG mask 变量（`--ca-mask-corner` 四角纹章 / `--ca-mask-halo` 八珠光环 / `--ca-mask-star` 八角星）；特效元素全部 fixed 定位；追加至 1698 行
- `cardarena-ui.js`：新增 `snapshot/captureRects/analyzeFx/applyFx` 特效引擎 + `pendingAction` 记录玩家操作（出牌/攻击/换人）；`playFloating/playAshes/playGhostSwap/burstSparks` 特效函数；`buildRosterBar` 换人 chip 用 IIFE 闭包记录 pendingAction
- `cardarena-ai.js`：英雄攻击改实时取 `engine.validAttackTargets(side)`（修复攻击已死目标）

**修复的 Bug**（浏览器子代理实测发现）:
1. **致命**：`analyzeFx` 读引擎不存在的 `s[sn].minions` 字段（引擎用 `board`）→ 二次渲染 TypeError 冻结 UI → 改读 `(ns.board || [])`
2. **致命**：`analyzeFx` 读不存在的 `ns.hero`（引擎 side 只有 `roster[activeIndex]`）→ 换人/英雄受击/英雄死亡特效分支永不执行 → 改 `ns.roster[ns.activeIndex]`
3. AI 英雄攻击预计算目标中已被随从击杀的目标 → 日志"攻击 undefined" → 改实时取存活合法目标

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `layouts/_default/cardarena.html` | 修改：`.ca-stage` 包裹层 + `.ca-header-ornament` 标题装饰条带 |
| `static/css/cardarena.css` | 修改：界面繁化 + 随从卡极繁样式 + 战斗特效系统（追加至 1698 行） |
| `static/js/cardarena-ui.js` | 修改：装饰挂载 + 特效引擎 + 关键词中文化 |
| `static/js/cardarena-ai.js` | 修改：英雄攻击实时取目标 |
| `PROJECT_CONTEXT.md` | 功能清单、文件索引、版本演进表 v5.13 |
| `PROJECT_DOCUMENTATION.md` | 功能特性、更新日志 v5.13 条目 |

**验证**：`hugo --gc` 350 页 0 error；浏览器子代理三轮实测 — 对局推进到第 7 回合无 JS 错误；召唤翻转入场、伤害飘字+灰烬、受击闪光、治疗飘字、换人 3D 幽灵卡翻飞 + 落地 hero-enter 全部确认触发；随从关键词中文化正常。

---

### v5.13 补充（同日追加）- 抽牌特效 + 八角星徽彩色立体化 + 四角纹章旋转 + 移动端优化

**新增功能 / 修复**:

- ✅ **抽牌特效**（commit `cc482dd`）：获取手牌时幻影牌从界面右侧 3D 翻入手牌区（双面卡牌：正面金边+GOLD缎带+八角星徽 / 背面 ON DUTY 印版；`perspective(700px) rotateY(120°→0°)` 卡背朝外翻至正面；多张纵向错落成扇形 + 落地金尘 + 金色拖尾光带）。触发场景：回合开始抽 1 / 预言家被动多抽 1 / 打出抽牌术占卜 / 亡语抽牌。`snapSide` 快照新增 `hand` 字段，`gainedCards()` 按卡牌 id 计数值对比精确计算「净新增」牌数
- 🐛 **修复：抽牌效果不生效**（commit `1872933`）：根因是数值配置边界——手牌上限仅 5（满手牌打「抽牌术」先扣 1 再抽 2，第 2 张被上限卡住净增 0）+ 牌库仅 6 张（第 3 回合抽空后所有抽牌永久失效）。修复：`handLimit: 5→7`、`buildDeck`/`buildDeckAI` 每张牌 2 份（6→12 张）
- ✅ **八角星徽彩色立体化**：根因是 CSS `mask-image` 只看 alpha 通道，所有填充元素叠成一团黑色实心轮廓，填同一色后必然平面单色（叠再多元素也看不出层次）。改为彩色渐变 SVG `--ca-bg-star`（明暗两套，`background-image` 直填非 mask）：线性渐变填充外层八角星 + 深金描边 + 8 半透明放射光芒 + 旋转 22.5° 描边方块 + 双圆环（外浅内深）+ 径向渐变中心宝石菱形 + 4 颗径向渐变大珠（球体感）+ 4 颗对角小珠 + 核心高光小菱形（共 23 元素）。7 处星徽全部升级（角色卡外星/内星、手牌卡、随从卡、出战水印、幽灵卡、抽牌幻影牌）；角色卡三层叠加（彩色外星 86px + 亮金高光内星 52px 旋转 22.5° opacity 0.35 + 中心宝石）
- ✅ **四角纹章旋转贴合**：根因是四个角用同一 mask 图案复制粘贴（只有左上角方向正确，其他三个开放边朝错方向）。修复：拆成 4 个旋转方向变量 `--ca-mask-corner-tl/tr/bl/br`（SVG 内 `transform='rotate(0/90/270/180 36 36)'`），开放边各自朝向角外（tl 开口右下 / tr 开口左下 / bl 开口右上 / br 开口左上）
- ✅ **抽牌特效落点精准 + 显眼度提升**：根因是飞入终点用固定坐标偏移，与屏幕大小/换行无关性差。修复：`playDrawFx(targets)` 改为接收每张抽到牌的 DOMRect 数组，每张幻影牌飞到对应手牌几何中心（`handCards[length-1-k].getBoundingClientRect()`），与屏幕大小无关；尺寸 68×96→84×118 + 双层 drop-shadow 光晕（16px+36px）+ 拖尾光带 150→190px 加粗 + 落地金尘 5→8 粒
- ✅ **移动端优化（≤640px）**：根因是 v5.13 极繁样式定义在原 `@media`（1095 行）之后，同 specificity 后定义胜出，覆盖了移动端规则（随从卡 112×150 强行撑满窄屏、手牌 7 张换行挤占垂直空间、光环纹章堆叠拥挤）。修复：文件末尾追加全面 `@media (max-width: 640px)` 块（优先级最高），核心策略——手牌/角色牌/随从区改**横向滚动**（`flex-wrap: nowrap; overflow-x: auto`，不换行挤占垂直空间）；卡牌尺寸缩小（手牌 128→104 / 随从 112→78）；光环 halo 弱化（124/100/74px → 80/64/50px + opacity 0.3）/ 圆环 ring 弱化；舞台四角纹章/分区面板内框/标题装饰条带**隐藏**（视觉拥挤主因）；间距全局压缩 8px→4-5px；角色选卡 2 列网格（minmax 190→140px）

**技术变更**:
- `cardarena.css`：新增 `--ca-bg-star` 彩色渐变 SVG 变量（浅色/深色两套）+ `--ca-mask-corner-tl/tr/bl/br` 四方向纹章变量；7 处星徽从 `mask+background` 改为 `background-image: var(--ca-bg-star)`；末尾追加移动端 `@media (max-width: 640px)` 块（1795-1855 行）；文件增至 1855 行
- `cardarena-ui.js`：`playDrawFx` 改为接收 DOMRect 数组；`snapSide` 新增 `hand` 字段；`gainedCards()` 净新增牌数计算
- `cardarena-data.js`：`handLimit: 5→7`
- `cardarena-engine.js`：`buildDeck` 每张牌 2 份（6→12 张）
- `cardarena-ai.js`：`buildDeckAI` 同步每张牌 2 份

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `static/css/cardarena.css` | 八角星徽彩色 SVG + 四角纹章旋转 + 抽牌幻影牌样式 + 移动端 @media 块（1698→1855 行） |
| `static/js/cardarena-ui.js` | 抽牌特效落点精准 + snapSide.hand + gainedCards() |
| `static/js/cardarena-data.js` | handLimit 5→7 |
| `static/js/cardarena-engine.js` | buildDeck 牌库翻倍 |
| `static/js/cardarena-ai.js` | buildDeckAI 牌库翻倍 |
| `PROJECT_DOCUMENTATION.md` | 更新日志 v5.13 补充条目 |
| `PROJECT_CONTEXT.md` | 版本演进表 v5.13 补充 |

**验证**：`hugo --gc` 350 页 0 error；移动端 375px 视口手牌/角色牌/随从区横向滚动正常，卡牌缩小可读，装饰弱化不再拥挤。

---

### v5.14 (2026-08-03) - CardArena 对战页面去框化重构（月圆之夜×游戏王融合）

**背景**：v5.13 极繁深化后出现三个问题——①角色卡统一 3/4 大小后部分文字被遮挡；②舞台四角纹章 z-index:3 + opacity:0.9 严重遮挡「开始对战」按钮和「已选 X/6」显示；③随从区/角色卡/手牌区/日志区全部是「框中框」（border + inset box-shadow + ::before 内框 + 四角金珠），视觉拥挤、缺乏沉浸感。

**新增功能 / 修复**:

- ✅ **角色卡构图修复**（统一 3/4 卡面零溢出）—— 全链路压缩字号与间距：
  | 元素 | 原值 | 新值 | 说明 |
  |------|------|------|------|
  | `.ca-role-band`（英文宫衔缎带） | 0.62rem / padding 9px 6px | 0.5rem / 6px 4px | 字号大幅缩小，letter-spacing 0.42→0.32em |
  | `.ca-role-art`（徽记区） | min-height 80px / margin 8px | min-height 56px / margin 5px | 压缩中央徽记区高度 |
  | `.ca-role-star-outer/inner` | 86px / 52px | 64px / 40px | 八角星等比缩小匹配徽记区 |
  | `.ca-setup-role-name` | 1.12rem / margin 2px | 1rem / margin 1px | 角色名缩小 |
  | `.ca-setup-role-intro` | 0.72rem / line-height 1.45 | 0.66rem / line-height 1.32 | 简介压缩避免双行溢出 |
  | `.ca-role-stat`（数值框） | 0.8rem / padding 5px 14px | 0.72rem / padding 4px 12px | ❤⚔ 数值框缩小 |
  | `.ca-setup-role-passive` | 0.68rem / margin 8px | 0.62rem / margin 5px | 被动文案压缩 |
  | `.ca-role-face` padding | 12px 11px 10px | 10px 10px 8px | 卡面内边距收紧 |
  - 移动端同步等比缩小（星徽 50/30px、徽记 44px、缎带 0.42rem 等）

- ✅ **四角纹章移至背景层**（不遮挡开始按钮和已选显示）：
  - `.ca-stage::before`：`z-index: 3→0`、`opacity: 0.9→0.12`（深色 0.10）、`mask-size: 88px→64px`（纹章缩小更贴角）
  - `.ca-stage::after`（珠串边线）：`z-index: 3→0`、`opacity: 0.4→0.18`
  - 新增 `.ca-stage > * { position: relative; z-index: 1; }` 确保标题与 app 内容在纹章之上
  - `#ca-start`（开始按钮）+ `#ca-count`（已选计数）加半透明底板 + `z-index: 2` 双保险，背景纹章之上清晰可读
  - `#ca-count` 改 `display: inline-block` + 胶囊圆角 + 半透明背景

- ✅ **分区去框化**（月圆之夜无框沉浸 + 游戏王战场分区融合）—— 移除所有容器框，仅卡牌本身保留卡牌感：
  | 区域 | 原样式（框） | 新样式（去框） |
  |------|------|------|
  | `.ca-roster`（角色牌区） | border + inset shadow + 渐变背景 | transparent / 无框，chips 自由浮动，仅标签分隔线 |
  | `.ca-board`（随从区） | border + ::before 内框 + 四角金珠 | 无框 + 半透明战场底色：敌方 `.ca-board-enemy` 暗红渐变、我方 `.ca-board-player` 金绿渐变，border-radius 8px |
  | `.ca-hand`（手牌区） | border + inset shadow | 无框 + 半透明金底渐变，border-radius 8px |
  | `.ca-log`（日志区） | border + inset shadow | 无框 + 仅上下分隔金线（border-top/bottom），透明背景 |
  | `.ca-hero`（出战角色） | border + inset shadow + ::after 内框金珠 | 无框 + 半透明状态面板渐变 + 顶金线，overflow:visible 保留光环 |
  - `.ca-card`（手牌卡）和 `.ca-minion`（随从卡）**不动**——卡牌本身保留极繁卡牌感，仅容器去框
  - `targetable` 高亮 outline 保留（功能性指示，非装饰框）

**设计思路**（月圆之夜 × 游戏王融合）:
- **月圆之夜**：无边框沉浸式，卡牌浮于纹理化背景之上，靠背景色微差与留白区分区域
- **游戏王**：清晰的战场分区（敌我对峙），半透明面板承载角色状态
- 融合后：容器去框 + 底色微差区分敌我战场 + 卡牌保留卡牌感 + 四角纹章纯背景水印 + 交互元素半透明底板确保可读

**技术变更**:
- `cardarena.css`：角色卡 8 处字号/间距压缩；`.ca-stage::before/::after` z-index+opacity+mask-size 调整 + `.ca-stage > *` 层级规则；roster/board/hand/log/hero 移除 border+inset box-shadow+::before/::after 内框金珠；新增 `.ca-board-enemy/.ca-board-player` 敌我底色区分；`#ca-start/#ca-count` 半透明底板；移动端同步调整

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `static/css/cardarena.css` | 角色卡构图修复 + 四角纹章背景层化 + 分区去框化（唯一改动文件，纯 CSS） |
| `PROJECT_CONTEXT.md` | 版本号 v5.13→v5.14、功能清单 v5.14 条目、版本演进表 v5.14 |
| `PROJECT_DOCUMENTATION.md` | 版本号 v5.13→v5.14、更新日志 v5.14 条目 |

**验证**：`hugo` 构建无 error；角色卡 3/4 卡面文字零溢出；四角纹章降为背景水印不遮挡按钮/计数；对战页 roster/board/hand/log/hero 无框化，敌我随从区底色微差区分，卡牌保留卡牌感。

---

### v5.14 补充（同日追加）- 对战页二维战场布局重构

**背景**：v5.14 去框化后，所有区域仍是垂直堆叠的「整宽长条」（`.ca-layout` flex-direction:column），角色牌区/随从区/日志区/手牌区视觉单调。需引入二维布局打破长条感。

**重构方案**（纯 CSS Grid，DOM 零改动）:

- ✅ **`.ca-layout` flex-column → CSS Grid**：用 `grid-template-areas` 重排子元素，不受 DOM 顺序限制
  - 移动端（<900px）：单列堆叠，顺序与 DOM 一致（roster-enemy→zone-enemy→log→zone-player→roster-player→hand→actions）
  - 桌面端（≥900px）：双列 `minmax(0,1fr) 210px`，主战场在左、日志侧栏在右
    ```
    "roster-enemy  roster-enemy"
    "zone-enemy    log"          ← 日志跨 zone-enemy/zone-player 两行
    "zone-player   log"
    "roster-player roster-player"
    "hand          hand"
    "actions       actions"
    ```
- ✅ **日志侧栏化**：日志不再占整行长条，改为右侧侧栏跨越两个 zone 行；左侧金线分隔 + 半透明面板底 + 内部 `flex:1; overflow-y:auto` 滚动（日志多时不撑高战场）
- ✅ **zone 内部 flex-column → flex-row**（游戏王对峙风）：英雄面板与随从战场并排
  - `.ca-zone .ca-hero { flex: 0 0 172px }` 固定窄面板
  - `.ca-zone .ca-board { flex: 1; min-width: 0 }` 战场填充剩余
  - DOM 顺序天然形成镜像：zone-enemy = hero|board（敌方英雄在左）、zone-player = board|hero（我方英雄在右）→ 对角线对峙
- ✅ **窄英雄面板适配**（172px）：内容居中（text-align:center）、英文宫衔去左右渐隐金线（::before/::after display:none）、八角星水印改居中淡显（opacity 0.07）、法力宝石居中、角色名 1.15→1.02rem
- ✅ **移动端保持原序**：<900px 回退单列堆叠，zone 仍 flex-column（英雄/随从上下堆叠），不影响小屏体验

**设计要点**:
- roster/hand/actions 保持整宽（chips 与卡牌天然横排，整宽合理）
- 仅中间核心战场（zone×2 + log）二维化，打破「全长条」单调
- 日志侧栏让主战场连续（敌方 zone 与我方 zone 纵向相邻，不被日志隔开），强化上下对峙感
- 英雄|随从并排让每个 zone 从「纵向长条」变「横向战场面板」

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `static/css/cardarena.css` | `.ca-layout` flex→grid + grid-template-areas；桌面 @media(≥900px) 双列+日志侧栏+zone flex-row+窄英雄面板适配（纯 CSS，唯一改动文件） |
| `PROJECT_CONTEXT.md` | 功能清单 v5.14 补充条目、版本演进表 v5.14 补充 |
| `PROJECT_DOCUMENTATION.md` | 更新日志 v5.14 补充条目 |

**验证**：CSS 大括号配平；本地 hugo 构建错误仅来自预存的未跟踪 scratch 文件（`_jscheck.js` 等，非本次改动，不入库不影响 GitHub Actions 生产构建）；布局逻辑：桌面双列 + 日志侧栏 + 英雄|随从并排，移动单列堆叠。

---

### v5.15 (2026-08-03) - CardArena 每角色独立卡池系统 + 选卡屏大屏适配

**背景**：原引擎 `side.deck` 是单一牌库，每次换人(`swapRole`)/阵亡切换(`checkRoleDeath`)都 `buildDeck()` 重建 → 切回原角色时卡池被重置为满 12 张，无法体现「卡池消耗」策略。用户需求：每角色独立卡池，记录剩余张数，换人不重置；战斗中可点击查看剩余可抽卡牌；卡池空则无法抽牌。另需选卡屏大屏适配（防上下滚动）。

**新增功能 / 修复**:

- ✅ **引擎：每角色独立卡池**（`cardarena-engine.js`）—— 核心改造：
  | 函数 | 原逻辑 | 新逻辑 |
  |------|--------|--------|
  | `makeSide` | role 无 deck，side.deck=[] | 每角色 `deck: buildDeck(roleId)`（12 张），`side.deck = roles[0].deck`（引用当前出战角色卡池） |
  | `start` | `side.deck = buildDeck(activeRole.id)` 重建 | 删除重建，直接 `drawCards`（makeSide 已构建） |
  | `swapRole` | `side.deck = buildDeck(role.id)` 重建 | `side.deck = role.deck`（切换引用，保留剩余张数） |
  | `checkRoleDeath` | `side.deck = buildDeck(activeRole.id)` 重建 | `side.deck = activeRole(side).deck`（切换引用） |
  - 关键机制：`side.deck` 是引用（指向 `role.deck` 数组），`drawCards` 的 `pop()` 直接消耗该角色的卡池数组；换人只换引用不重建 → 切回原角色延续上次剩余张数
  - 卡池为空时 `drawCards` 已有 `if (side.deck.length === 0) break` 逻辑，天然支持「空池无法抽牌」

- ✅ **UI：三处卡池展示**（`cardarena-ui.js`）：
  1. **roster chip 金色宝石徽章**：每角色 chip 加 `.ca-roster-chip-pool` 显示剩余数（空池加 `.empty` 变灰红）；玩家方存活角色徽章可点击 → `showPoolModal`（`stopPropagation` 防触发换人）
  2. **hero 面板卡池指示器**：玩家方 hero 加 `.ca-hero-pool`「卡池 X/12」可点击胶囊（`stopPropagation` 防触发英雄选攻击者）→ `showPoolModal`
  3. **showPoolModal 苏丹风弹窗**：点击查看指定角色剩余可抽卡牌
     - 按 cardId 聚合计数（同牌多张显示 ×N 徽章）
     - 每张：费用宝石 + 品级缎带(tierEn) + 名称 + 攻/血或法术 + 描述 + 数量徽章
     - 品级色复用 `.ca-card-tier-gold/silver/bronze/stone`（`--ca-tier-color`）
     - 空池显示「卡池已空」；点击遮罩或关闭按钮关闭

- ✅ **CSS：卡池元素苏丹主题**（`cardarena.css`）：
  - `.ca-roster-chip-pool`：金色宝石胶囊（gold-light→gold 渐变 + gold-dark 描边），空池灰红
  - `.ca-hero-pool`：金色缎带胶囊（hover brightness+translateY 微动），空池灰红
  - `.ca-pool-overlay/modal/grid/card`：羊皮纸面板（pattern + 双层金描边 inset shadow + 暗色主题适配）、品级色卡牌、费用宝石、数量红徽章
  - 弹窗 `position:fixed; z-index:1000` 覆盖全屏，`max-height:86vh; overflow-y:auto` 滚动

- ✅ **选卡屏大屏适配**：`.ca-setup-grid` `minmax(190px)→minmax(150px)` + `max-width:680px` 居中 + gap 16→12px → 卡片从 220px 缩至 170px，2 行高度 602→466px，防大屏上下滚动

**技术要点**:
- `buildDeck` 是函数声明（hoisted），可在 `makeSide` 中调用（虽定义在其后）
- `side.deck` 引用机制：JS 对象引用传递，`pop()` 修改原数组，换人只换引用 → 每角色卡池状态独立保留
- `stopPropagation` 解决 pool 按钮点击冒泡触发 attacker-selectable（英雄）/ swappable（chip）的冲突
- 敌方 chip 也显示卡池数（不可点击），增加策略信息；玩家方可点击查看任意存活角色卡池

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `static/js/cardarena-engine.js` | makeSide 每角色 deck + side.deck 引用；start/swapRole/checkRoleDeath 改引用不重建 |
| `static/js/cardarena-ui.js` | buildRosterBar 加卡池徽章；buildHeroView 加卡池指示器；新增 showPoolModal 弹窗 |
| `static/css/cardarena.css` | .ca-setup-grid 大屏适配；.ca-roster-chip-pool/.ca-hero-pool 徽章指示器；.ca-pool-* 弹窗苏丹主题 |
| `PROJECT_CONTEXT.md` | 版本号 v5.14→v5.15、功能清单 v5.15、版本演进表 v5.15 |
| `PROJECT_DOCUMENTATION.md` | 版本号 v5.14→v5.15、更新日志 v5.15 条目 |

**验证**：`node --check` 三个 JS 文件语法 OK；CSS 大括号配平（423/423）；`hugo --destination public_test` EXIT 0（移除预存 scratch 文件后）；卡池逻辑：start 抽 3 → 首角色 9 张，换人切角色 B（12→抽 3=9），切回 A 仍 9 张（不重置），抽牌持续消耗至 0 则无法再抽。

---

### v5.11 (2026-08-01) - CPA 阶段B 习题整合（历年真题板块 + 550题同步练习）

**新增功能**:
- ✅ **09 历年真题板块** (`/learn/cpa/09-exams/`)：2013-2025 共 13 年 × 6 科 = 78 页全文真题
  - 每页结构：`## 一、单项选择题 / 二、多项选择题 / 三、简答题 / 四、综合题`（按科目题型）+ `**参考答案与解析**`
  - 真题源：`1、CPA注册会计师（历年真题）（2013-2025）` 143 个 PDF（`docs/cpa-source/extract_exams.py` 提取）
  - 位于 08 综合阶段之后（weight: 9），侧边栏自动展开年份子页
- ✅ **550 题同步练习整合**：六科 92 章补「## 7. 同步练习」小节（1500+ 题，不标注来源）
  - 题源：`8、CPA注册会计师（必刷550题）` 6 个 PDF（`docs/cpa-source/split_550.py` 按章切分）
  - 章节映射表：`docs/cpa-source/chapter_map_550.json`（审计编号错位/财管 19→15 章合并/税法 10-14 错位已人工梳理）
  - 会计 1-7、16-29 章 550 原书缺答案 → 练习答案段标注"可参考09历年真题板块"

**技术变更**:
- `learn.html` 侧边栏嵌套 section 自动展开：`eq $.CurrentSection.RelPermalink .RelPermalink` → `or (eq ...) (strings.HasPrefix ...)`（09-exams 年份子页属于嵌套 section，eq 失效）
- `extend_footer.html` + `extend_head.html`：KaTeX 按需动态加载（检测 `.md-content` 含 `$` 分隔符才加载 CSS/JS，`%` 转义 `\%`，jsdelivr 主源 + bootcdn 备用）
- `docs/cpa-source/` 提取脚本与映射表入库；`textbooks/ exams/ exercises/ past-papers/` 中间文本加入 `.gitignore`
- 六科章节结构升级为**七段式**（原六段 + 第 7 段「## 7. 同步练习」）

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `content/learn/cpa/09-exams/` | 新增：真题板块（_index + 13 年份 × 6 科 = 79 个 md） |
| `content/learn/cpa/02-accounting/` ~ `07-tax-law/` | 修改：92 章追加「## 7. 同步练习」 |
| `content/learn/cpa/_index.md` | 修改：新增 09-exams 条目 |
| `layouts/_default/learn.html` | 修改：嵌套 section HasPrefix 自动展开 |
| `layouts/partials/extend_head.html` | 修改：KaTeX CSS 静态引入 |
| `layouts/partials/extend_footer.html` | 修改：KaTeX 按需动态加载 IIFE |
| `docs/cpa-source/` | 新增：提取脚本 + chapter_map_550.json（中间文本已 gitignore） |
| `static/js/community.js` | 修改：API_BASE 迁移腾讯云 SCF（遗留改动） |
| `PROJECT_CONTEXT.md` | 版本号 v5.10→v5.11、功能清单、文件索引、技术决策表 |
| `PROJECT_DOCUMENTATION.md` | 版本号、功能特性、目录结构、技术决策表、更新日志 v5.11 条目 |

**验证**：`hugo --gc` 350 页无 error；`docs/cpa-source/check_sync_exercises.py` 全科同步练习小节校验通过（无重复/无缺失）。

**Commit**: `637dd42`（215 files, +73248 / -1593）

---

### v5.10 (2026-08-01) - CardArena 多角色轮换卡牌对战

**新增功能**:
- ✅ **CardArena 卡牌对战** (`/play/cardarena/`)：双方各选 6 个角色轮流出战（玩家从 8 角色池选 6，AI 随机 6），一方 6 角色全灭判负
- ✅ 每角色独立专属卡组（6 张，含 1-2 张专属特殊卡）+ 独立法力（上限 5，首回合 3，回合结束回复 2，主动换人回满）
- ✅ 随从战场（上限 4）+ 6 关键词（嘲讽/冲锋/亡语/圣盾/剧毒/风怒）
- ✅ 主动换人消耗整个回合；被动换人（角色阵亡）后当回合可继续行动
- ✅ 手牌上限 5，起手 3 张每回合抽 1
- ✅ 基础贪心 AI（出牌 → 攻击 → 换人三阶段）
- ✅ 娱乐中心入口：`/play/` 新增 CardArena 游戏卡片

**架构（模块化，区别于 SleepTown 单文件模板）**:
| 文件 | 职责 |
|------|------|
| `static/js/cardarena-data.js` | 数据驱动层（GAME_CONFIG/ROLE_POOL/CARDS），用户可自行修改 |
| `static/js/cardarena-engine.js` | 纯状态机引擎（回合/出牌/战斗/关键词/换人/胜负），不碰 DOM |
| `static/js/cardarena-ai.js` | AI 三阶段贪心决策 |
| `static/js/cardarena-ui.js` | DOM 渲染与交互（事件委托 + 选目标高亮） |
| `static/css/cardarena.css` | 极简几何风样式，`--cardarena-*` 定义在 `:root` |
| `layouts/_default/cardarena.html` | 页面模板（固定加载顺序 data→engine→ai→ui） |
| `content/play/cardarena.md` | 内容声明（front matter 声明 layout: cardarena） |

**数据流**: ui 点击 → engine API（playCard/selectAttacker/chooseTarget/swapRole/endTurn）→ engine 更新状态 → emit update/log/phase/gameover 事件 → ui 重渲染

**关键设计**:
- 视觉硬约束：无 emoji、无粗体、无卡片式按钮、冷色系几何风
- `.main:has(.cardarena-page)` 突破 PaperMod 768px 约束
- 法术/被动/亡语统一 effect.kind 枚举（damage/heal/draw/buff/summon/board_clear）
- 随从带 `side` 引用，死亡结算/亡语按所属方触发
- AI 直接操作 side 状态对象，复用 engine `_internal` 接口

**已知 Bug 修复记录**:
- ✅ 出牌双重触发：手牌独立监听与事件委托重复绑定 → 统一改为事件委托处理（`data-hand-index`）
- ✅ 玩家候场条缺失：`renderAll` 遗漏 `buildRosterBar(player)` → 补齐玩家角色条渲染
- ✅ 无法攻击敌方角色：UI 传入的 `{kind:'hero', side:'enemy'}`（side 为字符串）与 `{kind:'minion', uid}`（缺 side）未被 combat 解析为真实 side 对象，`dealDamage` 访问 `target.side.roster` 抛 TypeError → 新增 `resolveSide()` 统一解析字符串/缺失 side，并在 combat 中为英雄攻击者补 side 引用（已浏览器实测：敌方英雄高亮 → 点击 → 血量 20→18，无报错）
- ✅ 随从不反击/毒杀失效：`summonMinion` 创建的随从对象缺少 `kind: 'minion'` 标记，combat 反击/毒杀分支依赖 kind 判断而静默跳过 → 随从对象补充 `kind: 'minion'`
- ✅ 己方治疗/增益卡不生效：`getValidTargets` 在 pendingSpell 时一律用 `state.enemy` 查找目标，`ally_*` 目标列表为空且 UI 硬编码高亮敌方 → 引擎按 `eff.target` 前缀（enemy_*/ally_*）选择目标方，UI 按目标 `side` 高亮对应方、点击时用元素 `data-side` 构造目标（浏览器实测：治疗术高亮己方英雄、点击后血量 10→13）
- ✅ 胜利/失败结算不弹出（卡死）：击杀敌方最后一人时 `emit('gameover')` 已渲染结算 overlay，随后 `combat` 尾部 `emit('update')` 触发 `renderAll` 清空 `app.innerHTML` 把 overlay 抹掉 → `renderAll` 开头对 `phase === 'gameover'` 直接 return，保留结算界面（浏览器实测：6 连斩后"胜利"弹窗稳定保留）

**Files Modified**:
| 文件 | 变更 |
|------|------|
| `static/js/cardarena-data.js` | 新增：数据层 |
| `static/js/cardarena-engine.js` | 新增：引擎 |
| `static/js/cardarena-ai.js` | 新增：AI |
| `static/js/cardarena-ui.js` | 新增：UI |
| `static/css/cardarena.css` | 新增：样式 |
| `layouts/_default/cardarena.html` | 新增：页面模板 |
| `content/play/cardarena.md` | 新增：内容声明 |
| `layouts/_default/play.html` | 修改：games-grid 新增入口卡片 |
| `PROJECT_CONTEXT.md` | 版本号 v5.9→v5.10、功能清单、文件索引、版本演进表 |
| `PROJECT_DOCUMENTATION.md` | 版本号、功能特性、目录结构、技术决策表、更新日志 v5.10 条目 |

**设计文档**：`docs/superpowers/specs/2026-08-01-cardarena-design.md`

---

### v5.9 (2026-07-31) - 交互式自我介绍页面

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
| `PROJECT_CONTEXT.md` | 版本号 v5.8→v5.9、功能清单、版本演进表、技术决策表 |
| `PROJECT_DOCUMENTATION.md` | 版本号、功能特性、目录结构、更新日志 v5.9 条目 |

**设计文档**：`docs/superpowers/specs/2026-07-31-play-me-interactive-intro-design.md`

**双入口并存**：旧 `/me/`（content/me.md）保留不动，菜单「我」仍指 `/me/`；`/play/me/` 仅从娱乐中心进入。

---

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

*文档结束 | 最后更新: 2026-08-02 | 版本: v5.12 | 状态: ✅ 生产就绪*

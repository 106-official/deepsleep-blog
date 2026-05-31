# DeepSleep Blog - 项目技术文档

> **最后更新**: 2026-05-31  
> **版本**: v1.0  
> **作者**: AI Assistant (Trae IDE)  
> **状态**: ✅ 生产就绪

---

## 📖 目录

1. [项目概述](#-项目概述)
2. [技术架构](#-技术架构)
3. [目录结构](#-目录结构)
4. [核心配置](#-核心配置)
5. [部署环境](#-部署环境)
6. [评论系统详解](#-评论系统详解)
7. [快速开始](#-快速开始)
8. [日常维护](#-日常维护)
9. [故障排查](#-故障排查)
10. [扩展开发](#-扩展开发)
11. [安全与备份](#-安全与备份)
12. [联系方式](#-联系方式)

---

## 🎯 项目概述

### 基本信息

| 属性 | 值 |
|------|-----|
| **项目名称** | DeepSleep Blog |
| **类型** | 个人博客（静态站点） |
| **域名** | https://deepsleep.fun |
| **语言** | 中文（zh-CN） |
| **许可证** | MIT |
| **GitHub** | https://github.com/106-official/deepsleep-blog |

### 功能特性

#### 核心功能
- 📝 文章发布与管理（Markdown 格式）
- 💬 Waline 评论系统（支持注册/登录、Markdown、表情包）
- 🔍 全文搜索（Fuse.js）
- 📱 响应式设计（移动端适配）
- 🌓 暗色/亮色主题切换
- 🏷️ 标签与分类系统
- 📚 文章归档页
- 👤 关于页面

#### 特色功能
- ⚡ 极速加载（静态站点 + CDN）
- 🔐 评论系统（Waline + Supabase）
- 🎨 自定义金色主题 (#D4AF37)
- 📊 SEO 优化（Open Graph, Schema.org）
- 🔄 CI/CD 自动部署（GitHub Actions）

---

## 🏗️ 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────┐
│                    用户浏览器                         │
│              (Chrome / Firefox / Safari)             │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────────┐
│              GitHub Pages (CDN)                      │
│         https://deepsleep.fun                        │
│    • Hugo 生成的静态 HTML/CSS/JS                    │
│    • 全球 CDN 分发                                 │
│    • 自动 HTTPS                                    │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌───────────────┐    ┌─────────────────┐
│   Waline API  │    │   静态资源 CDN   │
│  (Vercel)     │    │  (jsDelivr)      │
│               │    │                 │
│ • 评论 CRUD    │    │ • waline.js     │
│ • 用户认证     │    │ • waline.css    │
│ • 管理后台     │    │ • emoji 图片    │
└───────┬───────┘    └─────────────────┘
        │
        ▼
┌─────────────────┐
│   Supabase DB   │
│  (PostgreSQL)   │
│                 │
│ • wl_comment    │
│ • wl_counter    │
│ • wl_user       │
└─────────────────┘
```

### 技术栈详情

#### 前端层

| 技术 | 版本 | 用途 |
|------|------|------|
| **Hugo** | 0.162+ | 静态站点生成器 |
| **PaperMod** | Latest | 博客主题（Git 子模块） |
| **HTML5/CSS3** | - | 页面结构与样式 |
| **JavaScript** | ES6+ | 交互逻辑（Waline 初始化） |
| **Fuse.js** | Latest | 客户端全文搜索 |

#### 后端服务

| 服务 | 平台 | 用途 | 费用 |
|------|------|------|------|
| **Waline** | Vercel | 评论系统后端 | 免费 (Hobby) |
| **Supabase** | Supabase Cloud | PostgreSQL 数据库 | 免费 (Free Tier) |
| **GitHub Pages** | GitHub | 静态站点托管 | 免费 |
| **jsDelivr** | jsDelivr | CDN 加速 | 免费 |

#### 开发工具

| 工具 | 用途 |
|------|------|
| **Git** | 版本控制 |
| **GitHub Actions** | CI/CD 自动部署 |
| **VS Code / Trae IDE** | 代码编辑器 |
| **Browser DevTools** | 调试与测试 |

---

## 📁 目录结构

```
blog-static/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自动部署配置
│
├── archetypes/                  # Hugo 内容原型（Front Matter 模板）
│   └── default.md
│
├── content/                     # 网站内容（Markdown 文章）
│   ├── posts/                   # 博客文章
│   │   ├── hello-world.md       # 示例文章
│   │   └── ...                  # 其他文章
│   ├── forum/                   # 论坛内容（可选）
│   └── about.md                 # 关于页面
│
├── layouts/                     # Hugo 模板覆盖（自定义）
│   └── partials/
│       ├── comments.html        # ⭐ Waline 评论组件（关键文件）
│       └── extend_footer.html   # 页脚扩展
│
├── static/                      # 静态资源（直接复制到输出）
│   ├── css/
│   │   └── custom.css           # 自定义样式
│   ├── images/                  # 图片资源
│   └── favicon.ico              # 站点图标
│
├── themes/                      # Hugo 主题（Git 子模块）
│   └── PaperMod/                # PaperMod 主题源码
│
├── .gitignore                   # Git 忽略规则
├── .gitmodules                  # Git 子模块配置
├── hugo.toml                    # ⭐ Hugo 主配置文件（关键文件）
├── vercel.json                  # Vercel 部署配置（备用）
├── README.md                    # 项目说明
├── WALINE配置指南.md            # Waline 配置参考
└── TWIKOO配置指南.md            # Twikoo 配置参考（已废弃）
```

---

## ⚙️ 核心配置

### 1. Hugo 主配置 ([hugo.toml](hugo.toml))

```toml
baseURL = "https://deepsleep.fun/"
languageCode = "zh-CN"
title = "DeepSleep Blog"
theme = ["PaperMod"]

[params]
  # 主题设置
  defaultTheme = "auto"          # auto/light/dark
  themeColor = "#D4AF37"         # 金色主题色
  
  # 首页信息
  [params.homeInfoParams]
    Title = "🌙 DeepSleep Blog"
    Content = """
      <p style='font-size: 1.1em; line-height: 1.8;'>
      👋 欢迎来到我的个人博客空间<br><br>
      
      这里记录<span style='color: #D4AF37; font-weight: bold;'>技术探索</span>与<span style='color: #888; font-weight: bold;'>生活感悟</span><br><br>
      
      <em>用文字留住时光，用代码构建未来</em>
      </p>
    """

  # 社交链接
  [[params.socialIcons]]
    name = "github"
    url = "https://github.com/106-official"

  # 功能开关
  ShowReadingTime = true         # 显示阅读时间
  ShowShareButtons = true        # 显示分享按钮
  ShowPostNavLinks = true        # 显示文章导航
  ShowBreadCrumbs = true         # 显示面包屑导航
  ShowCodeCopyButtons = true     # 代码复制按钮

  # ====== ⭐ 评论系统配置 ======
  comments = true                 # 启用评论功能

  [params.waline]
    serverURL = "https://waline-deepsleep.vercel.app"  # Waline 后端地址
    lang = "zh-CN"                # 语言
    emoji = ["https://cdn.jsdelivr.net/npm/@waline/emojis@1.1.0/bilibili"]  # 表情包
    requiredMeta = ["nick", "email"]  # 必填字段
    wordLimit = [0, 500]          # 字数限制 [最小, 最大]
    pageSize = 10                 # 每页评论数
    placeholder = "欢迎发表你的看法~ 支持Markdown语法 ✨"

# 导航菜单
[[menu.main]]
  identifier = "posts"
  name = "📝 文章"
  url = "/posts/"
  weight = 10

[[menu.main]]
  identifier = "archives"
  name = "📚 归档"
  url = "/archives/"
  weight = 20

[[menu.main]]
  identifier = "search"
  name = "🔍 搜索"
  url = "/search/"
  weight = 30

[[menu.main]]
  identifier = "about"
  name = "👤 关于"
  url = "/about/"
  weight = 40

# Markdown 渲染
[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true              # 允许原始 HTML

  [markup.highlight]
    noClasses = false
    anchorLineNos = true
    codeFences = true
    guessSyntax = true
    lineNos = true
    style = "monokai"            # 代码高亮主题
```

### 2. Waline 评论组件 ([layouts/partials/comments.html](layouts/partials/comments.html))

**位置**: `layouts/partials/comments.html`  
**作用**: 在每篇文章底部渲染 Waline 评论框

**关键代码段**:

```html
{{- /* 条件渲染：仅文章页显示 */ -}}
{{- if or (.Param "comments") (.Site.Params.comments) | default false -}}
  {{- if .IsPage -}}

    <div class="post-footer-comments">
      <h2 id="comments">💬 发表评论</h2>
      
      <!-- Waline 容器 -->
      <div id="waline"></div>

      <!-- 加载 Waline CSS & JS -->
      <link href="https://cdn.jsdelivr.net/npm/@waline/client@v3/dist/waline.css" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/@waline/client@v3/dist/waline.js" defer></script>
      
      <!-- 初始化脚本（使用 defer + DOMContentLoaded） -->
      <script defer>
        document.addEventListener('DOMContentLoaded', function() {
          Waline({
            el: '#waline',
            serverURL: '{{ .Site.Params.waline.serverURL }}',
            path: '{{ .RelPermalink }}',
            // ... 其他配置
          });
          
          console.log('[Waline] 初始化成功');
        });
      </script>
      
      <!-- 自定义样式 -->
      <style>
        #waline { /* 金色主题样式 */ }
      </style>
    </div>
  {{- end -}}
{{- end -}}
```

**⚠️ 重要注意事项**:
1. 必须使用 `defer` 属性确保 JS 加载顺序
2. 数组参数必须添加 `| jsonify` 过滤器
3. 使用 `DOMContentLoaded` 事件包装初始化代码

### 3. GitHub Actions 部置 ([.github/workflows/deploy.yml](.github/workflows/deploy.yml))

```yaml
name: Deploy Hugo Site to GitHub Pages

on:
  push:
    branches:
      - main              # 推送到 main 时触发
  workflow_dispatch:       # 手动触发

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: true  # 拉取 PaperMod 子模块
          fetch-depth: 0

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: '0.122.0'

      - name: Build
        run: hugo --minify --gc

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
          publish_branch: gh-pages   # 部署到 gh-pages 分支
```

---

## 🌐 部署环境

### 1. Waline 后端 (Vercel)

**项目信息：**
- **项目名**: waline-deepsleep
- **URL**: https://waline-deepsleep.vercel.app
- **仓库**: https://github.com/106-official/waline-deepsleep
- **框架**: @waline/vercel (Vercel Serverless Functions)

**环境变量（Production）：**

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `POSTGRES_HOST` | `djvsltsjzcuvcxfsrmdt.pooler.supabase.co` | Supabase Pooler 地址 |
| `POSTGRES_PORT` | `6543` | Pooler 端口 |
| `POSTGRES_USER` | `postgres.djvsltsjzcuvcxfsrmdt` | 数据库用户（带项目 ID）|
| `POSTGRES_PASSWORD` | `4EN39Il86M8Y99gj` | ⚠️ 数据库密码（敏感）|
| `POSTGRES_DATABASE` | `postgres` | 数据库名称 |
| `SITE_URL` | `https://deepsleep.fun` | 博客域名 |
| `ALLOWED_DOMAINS` | `*` | 允许的域名（测试用）|
| `COMMENT_AUDIT` | `false` | 是否开启审核 |

**管理后台：**
- 设置: https://waline-deepsleep.vercel.app/ui/setup
- 管理: https://waline-deepsleep.vercel.app/ui

---

### 2. Supabase 数据库

**项目信息：**
- **项目名**: deepsleep-blog-db
- **Project ID**: djvsltsjzcuvcxfsrmdt
- **区域**: Southeast Asia (Singapore)
- **实例**: t4g.nano (Free Tier)
- **Dashboard**: https://supabase.com/dashboard/project/djvsltsjzcuvcxfsrmdt

**连接方式：**
```bash
# Transaction Pooler（推荐用于 Serverless）
postgresql://postgres.djvsltsjzcuvcxfsrmdt:PASSWORD@djvsltsjzcuvcxfsrmdt.pooler.supabase.co:6543/postgres

# Direct Connection（不推荐，IPv6 问题）
postgresql://postgres:PASSWORD@db.djvsltsjzcuvcxfsrmdt.supabase.co:5432/postgres
```

**数据库表（由 Waline 自动创建）：**

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `wl_comment` | 评论数据 | id, user_id, comment, ip, ua, ... |
| `wl_counter` | 页面访问计数 | path, time, ... |
| `wl_user` | 用户信息 | display_name, email, password, type, ... |

---

### 3. GitHub Pages (前端托管)

- **自定义域名**: deepsleep.fun
- **DNS 配置**: CNAME → [username].github.io
- **HTTPS**: 自动启用（通过 Let's Encrypt）
- **CDN**: GitHub 全球 CDN
- **缓存策略**: 由 Hugo 控制（静态资源哈希命名）

---

## 💬 评论系统详解

### Waline vs Twikoo 对比

| 特性 | Waline (当前) | Twikoo (旧版) |
|------|---------------|---------------|
| **数据库支持** | PostgreSQL, MySQL, LeanCloud, MongoDB | 仅 MongoDB |
| **部署平台** | Vercel, Docker, Node.js | Vercel, Docker, 云函数 |
| **管理后台** | ✅ 内置 (/ui) | ❌ 无 |
| **用户系统** | ✅ 注册/登录 | ✅ 匿名/登录 |
| **邮件通知** | ✅ 支持 | ✅ 支持 |
| **emoji** | ✅ 可自定义 | ✅ 内置 |
| **我们的选择原因** | ✅ 兼容 Supabase PostgreSQL | ❌ MongoDB Atlas 配置困难 |

### Waline 工作流程

```
用户访问文章页
    ↓
浏览器加载 comments.html
    ↓
加载 waline.js (defer)
    ↓
DOM 加载完成 (DOMContentLoaded)
    ↓
调用 Waline.init()
    ↓
向 waline-deepsleep.vercel.app 发送请求
    ↓
Vercel Function 处理请求
    ↓
查询/写入 Supabase PostgreSQL
    ↓
返回 JSON 数据
    ↓
前端渲染评论列表/提交成功提示
```

### 常见操作

#### 查看所有评论
访问 Supabase Dashboard → Table Editor → `wl_comment` 表

#### 删除不当评论
方法 1: 访问 `/ui` 管理后台删除  
方法 2: 直接在 Supabase Table Editor 中删除行

#### 导出评论数据
Supabase Dashboard → Database → Backups → Export

#### 重置管理员密码
访问 `/ui/setup` 重新设置

---

## 🚀 快速开始

### 环境准备

**必需软件：**
1. **Git** - 版本控制
   ```bash
   # Windows: 下载安装 https://git-scm.com
   # 验证安装:
   git --version
   ```

2. **Hugo Extended** - 静态站点生成器
   ```bash
   # Windows (Chocolatey):
   choco install hugo-extended
   
   # 或手动下载:
   # https://github.com/gohugoio/hugo/releases
   # 选择 hugo_0.xx.x_windows-amd64.zip
   
   # 验证安装:
   hugo version
   ```

3. **VS Code / Trae IDE** - 代码编辑器（推荐插件：Hugo Language Support）

---

### 本地开发

#### 1. 克隆项目

```bash
git clone https://github.com/106-official/deepsleep-blog.git
cd blog-static

# 初始化子模块（PaperMod 主题）
git submodule update --init --recursive
```

#### 2. 启动本地服务器

```bash
# 开发模式（热重载）
hugo server -D

# 指定端口
hugo server -D -p 1313

# 绑定到所有网络接口（局域网访问）
hugo server -D --bind 0.0.0.0
```

**访问**: http://localhost:1313

#### 3. 创建新文章

```bash
# 方法 A: 手动创建
mkdir content/posts/my-new-post
touch content/posts/my-new-post/index.md

# 方法 B: 使用 Hugo 命令（需配置 archetypes）
hugo new posts/my-new-post.md
```

**文章 Front Matter 模板**:

```markdown
---
title: "我的新文章标题"
date: 2026-05-31T15:00:00+08:00
draft: false
tags: ["标签1", "标签2"]
categories: ["分类"]
summary: "文章摘要（显示在列表页）"
comments: true  # 启用评论
cover:
  image: "images/cover.jpg"
  alt: "封面图片描述"
  caption: "图片说明"
---

# 文章正文开始

这里是 Markdown 格式的文章内容...

支持 **粗体**、*斜体*、`代码`、[链接](url)

## 二级标题

### 三级标题

\`\`\`python
print("Hello, DeepSleep!")
\`\`\`
```

#### 4. 预览与调试

```bash
# 构建生产版本（到 public/ 目录）
hugo --minify --gc

# 本地预览构建结果
hugo server --renderToDisk -D
```

---

### 发布流程

#### 方式 A: Git Push 自动部署（推荐）

```bash
# 1. 添加所有更改
git add .

# 2. 提交（遵循 Conventional Commits 规范）
git commit -m("feat: add new post about xxx")

# 3. 推送到 main 分支触发自动部署
git push origin main

# 4. 监控部署状态
# 访问: https://github.com/106-official/deepsleep-blog/actions
# 等待绿色 success ✓
```

**预期时间线：**
- Git push: ~10 秒
- GitHub Actions 构建: ~2 分钟
- GitHub Pages 部署: ~1 分钟
- CDN 刷新: ~5 分钟
- **总计: ~10 分钟后全球可访问**

#### 方式 B: 手动触发部署

1. 访问 https://github.com/106-official/deepsleep-blog/actions
2. 点击 "Run workflow"
3. 选择分支: main
4. 点击 "Run workflow"

---

## 🔧 日常维护

### 定期更新依赖

#### 更新 Hugo 主题（PaperMod）

```bash
cd themes/PaperMod
git pull origin main
cd ../..

# 提交更新
git add themes/Papermod
git commit -m("chore: update PaperMod theme to latest")
git push origin main
```

#### 更新 Hugo 版本

1. 编辑 `.github/workflows/deploy.yml`
2. 修改 `hugo-version` 为最新版本号
3. 提交并推送

**当前版本**: Hugo 0.122.0+ (Extended)

---

### 性能优化

#### 图片优化

```bash
# 安装工具
# pip install pillow (Python)
# 或使用在线工具: tinypng.com, squoosh.app

# 推荐:
# - 格式: WebP (比 JPEG 小 30-50%)
# - 尺寸: 最大宽度 1200px
# - 压缩质量: 80-85%
```

#### 资源压缩

Hugo 已内置：
- `--minify`: 压缩 HTML/CSS/JS
- `--gc`: 清除未使用的资源
- 自动生成哈希文件名（缓存友好）

---

### 数据备份

#### Supabase 自动备份（免费）

Supabase Free Plan 提供：
- 每日自动备份（保留 7 天）
- 点对点恢复（PITR）- 最近 7 天内任意时间点

**手动备份步骤：**
1. 访问 Supabase Dashboard
2. Settings → Database
3. 找到 "Backups" 部分
4. 点击 "Download latest backup"

#### 导出评论数据

```sql
-- 在 Supabase SQL Editor 中执行
SELECT * FROM wl_comment INTO OUTFILE '/tmp/comments_backup.csv'
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

或使用 GUI：Table Editor → 右键表名 → Export

---

## 🐛 故障排查

### 常见问题速查表

| 问题现象 | 可能原因 | 解决方案 |
|---------|---------|---------|
| **评论区不显示** | Front Matter 缺少 `comments: true` | 在文章 md 文件中添加 |
| **评论加载失败** | Waline 后端 500 错误 | 检查 Vercel 日志和环境变量 |
| **评论提交失败 403** | ALLOWED_DOMAINS 未配置 | 添加 `ALLOWED_DOMAINS=*` |
| **评论提交失败 500** | 数据库连接失败 | 检查 POSTGRES_* 变量是否正确 |
| **样式错乱** | CSS 未加载 | 检查 CDN 连接（jsDelivr）|
| **暗色模式异常** | 主题配置错误 | 检查 `defaultTheme` 设置 |
| **搜索不工作** | Fuse.js 未加载 | 检查 `fuseOpts` 配置 |
| **部署失败** | Hugo 构建错误 | 查看 GitHub Actions 日志 |

---

### 详细排查流程

#### 问题 1: 评论区完全不显示

**检查清单：**

1. **确认 Front Matter 配置**
   ```markdown
   ---
   title: "文章标题"
   comments: true  # ← 必须有这一行！
   ---
   ```

2. **确认 Hugo 配置**
   ```toml
   # hugo.toml
   [params]
     comments = true  # ← 全局开关
   ```

3. **确认模板文件存在**
   ```
   layouts/partials/comments.html  # ← 必须存在
   ```

4. **检查浏览器控制台（F12）**
   - 查找红色错误信息
   - 检查 Network 标签是否有失败的请求

---

#### 问题 2: Waline 初始化失败

**错误消息**: `[Waline] 初始化失败: ReferenceError: Waline is not defined`

**原因**: JavaScript 加载时序错误

**解决方案**:
1. 打开 `layouts/partials/comments.html`
2. 确认 `<script>` 标签有 `defer` 属性
3. 确认初始化代码在 `DOMContentLoaded` 事件中
4. 强制刷新浏览器（Ctrl+Shift+R）

**正确的代码结构**:
```html
<script src="...waline.js" defer></script>
<script defer>
  document.addEventListener('DOMContentLoaded', function() {
    Waline({...});
  });
</script>
```

---

#### 问题 3: Waline API 返回 500 错误

**排查步骤**：

1. **检查 Vercel 函数日志**
   - 访问 Vercel Dashboard → Deployments → Functions → Logs
   - 查找错误堆栈跟踪

2. **验证环境变量**
   - POSTGRES_HOST 是否使用 Pooler 地址（不是 db.xxx）
   - POSTGRES_PORT 是否为 6543（不是 5432）
   - POSTGRES_USER 是否带项目 ID 后缀

3. **测试数据库连接**
   - 访问 Supabase Dashboard
   - SQL Editor 中执行: `SELECT version();`
   - 如果成功，说明数据库正常

4. **常见修复**:
   ```bash
   # 重新部署 Waline 后端
   # Vercel Dashboard → Deployments → 最新部署 → Redeploy
   ```

---

#### 问题 4: 评论提交返回 403 Forbidden

**原因**: CORS 或域名白名单限制

**解决方案**:

1. **检查 Vercel 环境变量**
   ```
   ALLOWED_DOMAINS=*  # 允许所有域名（开发阶段）
   
   # 生产环境建议:
   ALLOWED_DOMAINS=deepsleep.fun,waline-deepsleep.vercel.app
   ```

2. **重新部署 Waline**
   - 修改环境变量后必须重新部署才生效

3. **验证修复**
   ```bash
   curl -I https://waline-deepsleep.vercel.app/api/comment?path=/test
   # 应该返回 HTTP/2 200
   ```

---

#### 问题 5: GitHub Actions 构建失败

**常见原因及解决：**

1. **子模块拉取失败**
   ```yaml
   # 确保 deploy.yml 中有:
   - uses: actions/checkout@v4
     with:
       submodules: recursive
   ```

2. **Hugo 版本不兼容**
   - 更新 `deploy.yml` 中的 `hugo-version`
   - 或降级到稳定版本

3. **Markdown 语法错误**
   - 本地运行 `hugo --minify` 检查
   - 特别注意 YAML Front Matter 的缩进

4. **查看详细日志**
   - GitHub Actions → 点击失败的 run → 展开 Build 步骤
   - 复制错误信息搜索解决方案

---

## 🔨 扩展开发

### 添加新页面

#### 示例：添加"友链"页面

1. **创建内容文件**

```markdown
<!-- content/links.md -->
---
title: "友情链接"
layout: "single"
comments: false
---
```

2. **添加导航菜单**

```toml
# hugo.toml
[[menu.main]]
  identifier = "links"
  name = "🔗 友链"
  url = "/links/"
  weight = 50
```

3. **创建自定义模板（可选）**

```html
<!-- layouts/links/single.html -->
{{ define "main"}}
<div class="links-container">
  <!-- 你的友链 HTML -->
</div>
{{ end }}
```

---

### 自定义评论样式

**编辑文件**: `layouts/partials/comments.html` 的 `<style>` 部分

**示例：修改主题色**

```css
/* 将金色改为蓝色 */
#waline .wl-btn-primary {
  background: linear-gradient(135deg, #4A90E2, #357ABD) !important;
}

#waline .wl-nick {
  color: #4A90E2 !important;
}

#waline .wl-avatar {
  border: 3px solid #4A90E2 !important;
}
```

---

### 添加 Google Analytics

1. **获取 GA4 跟踪 ID** (G-XXXXXXXXXX)

2. **修改 hugo.toml**

```toml
[params.analytics]
  google = "G-XXXXXXXXXX"
```

3. **PaperMod 主题会自动集成 GA**

---

### 集成其他服务

#### Disqus 备份评论系统（可选）

如果 Waline 不可用，可以快速切换到 Disqus：

```toml
# hugo.toml
[services.disqus]
  shortname = 'your-disqus-shortname'
```

#### Umami 自分析（隐私友好）

```html
<!-- layouts/partials/extend_head.html -->
<script defer src="https://umami.is/script.js" data-website-id="xxx"></script>
```

---

## 🔒 安全与备份

### 安全最佳实践

#### 1. 密码与密钥管理

**⚠️ 绝对不要提交到 Git：**
- Supabase 数据库密码 (`POSTGRES_PASSWORD`)
- Waline Master Key (`LEAN_MASTER_KEY`)
- JWT Secret (`JWT_TOKEN`)
- SMTP 密码

**存储位置：**
- Vercel Environment Variables（标记为 Sensitive）
- Supabase Dashboard（加密存储）
- 本地密码管理器（Bitwarden, 1Password）

---

#### 2. 域名与网络安全

- ✅ 强制 HTTPS（GitHub Pages 自动启用）
- ✅ DNSSEC 启用（域名注册商处配置）
- ✅ 安全头（由 GitHub Pages 处理）
- ⚠️ 定期更换密码（建议 90 天）
- ⚠️ 监控异常登录（GitHub/Supabase/Vercel）

---

#### 3. 评论内容安全

**Waline 已内置：**
- XSS 过滤（防跨站脚本攻击）
- IP 黑名单
- 敏感词过滤（可配置）
- 评论审核机制（COMMENT_AUDIT=true）

**额外建议：**
- 定期检查评论内容
- 及时处理垃圾评论
- 配置 Akismet 反垃圾（可选）

---

### 备份策略

#### 自动备份（已配置）

| 数据 | 备份方式 | 频率 | 保留期 |
|------|---------|------|--------|
| **网站源码** | Git (GitHub) | 每次 commit | 永久 |
| **构建产物** | GitHub Pages (gh-pages 分支) | 每次部署 | 永久 |
| **评论数据** | Supabase 自动备份 | 每日 | 7 天 |
| **Waline 配置** | Vercel 部署历史 | 每次部署 | 有限 |

#### 手动备份（推荐每月一次）

**完整备份清单：**

1. **导出 Supabase 数据库**
   - Dashboard → Database → Backups → Download

2. **导出 Vercel 环境变量**
   - Settings → Environment Variables → 截图保存

3. **归档 Git 仓库**
   ```bash
   git archive --format=tar.gz -o deepsleep-blog-backup-$(date +%Y%m%d).tar.gz main
   ```

4. **记录重要凭证**（加密存储）
   - 数据库密码
   - API Keys
   - 域名 DNS 配置

---

## 📞 联系方式与技术支持

### 官方文档

| 项目 | 文档地址 |
|------|---------|
| **Hugo** | https://gohugo.io/documentation/ |
| **PaperMod** | https://github.com/adityatelange/hugo-PaperMod/wiki |
| **Waline** | https://waline.js.org/guide/get-started.html |
| **Supabase** | https://supabase.com/docs |
| **Vercel** | https://vercel.com/docs |

---

### 常用命令速查卡

```bash
# === 本地开发 ===
hugo server -D                          # 启动开发服务器
hugo server -D -p 1313                  # 指定端口
hugo --minify                           # 生产构建

# === Git 操作 ===
git status                              # 查看状态
git add .                               # 添加所有更改
git commit -m("type: description")      # 提交（遵循规范）
git push origin main                    # 推送并触发部署
git submodule update --init --recursive # 更新子模块

# === 诊断命令 ===
hugo check                              # 检查配置错误
hugo list all                           # 列出所有页面
curl -I https://deepsleep.fun           # 检查 HTTP 头
```

---

### 紧急联系

**如果遇到无法解决的问题：**

1. **查看 GitHub Issues**
   - https://github.com/106-official/deepsleep-blog/issues
   - 搜索类似问题的解决方案

2. **社区求助**
   - Hugo Discourse Forum: https://discourse.gohugo.io/
   - Waline GitHub Discussions: https://github.com/walinejs/waline/discussions
   - Supabase Discord: https://discord.supabase.com/

3. **AI 辅助**
   - 使用 Trae IDE 的 AI Assistant
   - 或其他 AI 编程助手（Cursor, Copilot 等）

---

## 📝 更新日志

### v1.0 (2026-05-31) - 初始版本

#### 新增功能
- ✅ 从零搭建 DeepSleep 博客
- ✅ 集成 PaperMod 主题（金色定制）
- ✅ 部署 Waline 评论系统（Supabase + Vercel）
- ✅ 配置 GitHub Actions 自动部署
- ✅ 实现响应式设计与暗色模式
- ✅ 添加全文搜索功能

#### 技术决策
- 选择 Waline 而非 Twikoo（PostgreSQL > MongoDB）
- 使用 Supabase Transaction Pooler（解决 IPv4/IPv6 兼容性）
- 采用 jsDelivr CDN（加速静态资源加载）

#### 已知限制
- 评论系统依赖第三方服务（Vercel + Supabase）
- Free Tier 有使用配额限制
- 未配置邮件通知功能（可选增强）

---

## 🎓 学习资源

### 推荐教程

1. **Hugo 入门**
   - 官方 Quick Start: https://gohugo.io/getting-started/quick-start/
   - 视频教程: YouTube 搜索 "Hugo tutorial 2024"

2. **Waline 集成**
   - 官方文档: https://waline.js.org/guide/get-started.html
   - Vercel 部署示例: https://vercel.com/new/clone?repository-url=https://github.com/walinejs/waline/tree/main/example

3. **Supabase 入门**
   - 官方教程: https://supabase.com/docs/guides/getting-started
   - PostgreSQL 基础: https://www.postgresql.org/docs/

---

## 📄 许可证

本项目采用 **MIT 许可证** 开源。

```
MIT License

Copyright (c) 2026 DeepSleep Blog

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 致谢

- **Hugo 团队** - 出色的静态站点生成器
- **Aditya Telange** - PaperMod 主题作者
- **Waline 团队** - 优秀的评论系统
- **Supabase** - 免费的 PostgreSQL 即服务平台
- **Vercel** - 优秀的前端部署平台
- **GitHub** - 代码托管与 CI/CD

---

**🎉 感谢您使用 DeepSleep Blog！如有任何问题或建议，欢迎提 Issue 或 PR！**

---

*文档结束 | 最后更新: 2026-05-31 | 版本: v1.0*

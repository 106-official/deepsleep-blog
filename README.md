# 🌙 DeepSleep Blog - Hugo 静态博客

> **完全免费 · 无需信用卡 · 无休眠问题**  
> **域名**: https://deepsleep.fun
> **技术栈**: Hugo + GitHub Pages + PaperMod 主题
> **DeepSleep 项目版本**: v5.4

## ✨ 特点

- 💰 **零成本**：GitHub Pages 免费托管，100GB 带宽/月
- 🔒 **安全隐私**：无需信用卡、手机号或实名认证
- ⚡ **极速访问**：全球 CDN 加速，加载时间 < 1秒
- 📱 **响应式设计**：完美支持 PC/平板/手机
- ✍️ **Markdown 写作**：简洁高效，专注内容
- 🎨 **主题美观**：PaperMod 现代化主题
- 🔄 **自动部署**：Git 推送即上线（GitHub Actions）
- 📊 **SEO 友好**：纯静态 HTML，搜索引擎友好

---

## 🚀 快速开始

### 前置要求

- [Git](https://git-scm.com/) - 版本控制
- [Hugo Extended](https://gohugo.io/getting-started/quick-start/) (v0.139.0+) - 静态站点生成器
- [VS Code](https://code.visualstudio.com/) (推荐) - 代码编辑器

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/deepsleep-blog.git
cd deepsleep-blog
```

#### 2. 初始化子模块（下载主题）

```bash
# 初始化 Hugo 模块
hugo mod init github.com/你的用户名/deepsleep-blog

# 下载 PaperMod 主题
hugo mod get github.com/adityatelange/hugo-PaperMod
```

#### 3. 本地预览

```bash
hugo server -D
```

访问 http://localhost:1313 查看效果。

---

## 📁 项目结构

```
blog-static/
├── .github/
│   └── workflows/
│       ├── deploy.yml              # GitHub Pages 自动部署
│       └── cloudflare-deploy.yml    # Cloudflare Pages 备选方案
├── content/
│   ├── posts/                      # 博客文章
│   │   └── welcome.md             # 示例文章
│   └── about.md                   # 关于页面
├── static/                        # 静态资源（图片、CSS等）
├── themes/                        # Hugo 模块缓存
├── hugo.toml                      # 站点配置文件
├── 无信用卡免费部署指南.md          # 详细部署教程（必读！）
└── README.md                      # 本文件
```

---

## ✍️ 写作指南

### 创建新文章

```bash
hugo new posts/my-new-post.md
```

编辑生成的文件 `content/posts/my-new-post.md`：

```markdown
---
title: "文章标题"
date: 2026-05-30T12:00:00+08:00
draft: false        # 设为 true 则不发布
summary: "文章摘要"
tags: ["标签1", "标签2"]
categories: ["分类"]
---

# 正文开始

使用 Markdown 语法撰写内容...

## 二级标题

### 三级标题

- 列表项
- 列表项

1. 有序列表
2. 有序列表

**粗体文字**

*斜体文字*

`行内代码`

```python
# 代码块
def hello():
    print("Hello, DeepSleep!")
```

> 引用块文字

![图片描述](图片URL)

[链接文字](链接地址)
```

### 本地预览与调试

```bash
# 启动开发服务器（热重载）
hugo server -D

# 指定端口
hugo server -D -p 1314

# 构建到 public 目录（用于检查生产版本）
hugo --minify --gc

# 清理后重新构建
hugo --cleanDestinationDir
```

访问 http://localhost:1313 实时预览。

### 发布到线上

```bash
# 1. 提交更改
git add .
git commit -m "Add new post: my-new-post"

# 2. 推送到 GitHub
git push origin main

# 3. 自动部署！（约 1-2 分钟后生效）
```

---

## 🎨 自定义配置

### 修改站点信息

编辑 `hugo.toml`:

```toml
baseURL: 'https://deepsleep.fun/'
languageCode: 'zh-CN'
title: 'DeepSleep Blog'           # 博客标题
theme: ['PaperMod']               # 使用的主题

params:
  homeInfoParams:
    Title: "🌙 DeepSleep Blog"    # 首页大标题
    Content: >                    # 首页简介
      欢迎来到我的个人博客！
      
      这里记录技术探索和生活感悟。
  
  # 社交媒体链接
  socialIcons:
    - name: github
      url: "https://github.com/你的用户名"
    - name: email
      url: "mailto:your@email.com"
  
  # 功能开关
  ShowReadingTime: true           # 显示阅读时间
  ShowShareButtons: true          # 显示分享按钮
  ShowPostNavLinks: true          # 显示上下篇导航
```

### 配置导航菜单

```toml
menu:
  main:
    - identifier: posts
      name: 文章
      url: /posts/
      weight: 10
    - identifier: tags
      name: 标签
      url: /tags/
      weight: 20
    - identifier: categories
      name: 分类
      url: /categories/
      weight: 30
    - identifier: archives
      name: 归档
      url: /archives/
      weight: 40
    - identifier: search
      name: 搜索
      url: /search/
      weight: 50
    - identifier: about
      name: 关于
      url: /about/
      weight: 60
```

### 更换颜色模式

PaperMod 支持深色/浅色/自动切换：

```toml
params:
  defaultTheme: auto              # dark | light | auto
  themeColor: "#434648"          # 主题色
```

---

## 🌐 部署到 GitHub Pages

### 自动部署（已配置）

项目已包含 `.github/workflows/deploy.yml`，推送到 `main` 分支会自动触发构建和部署。

### 手动步骤

1. **创建 GitHub 仓库**
   - 访问 https://github.com/new
   - Repository name: `deepsleep-blog`
   - 选择 Public（私有仓库需要付费才能用 Pages）

2. **启用 GitHub Pages**
   - Settings → Pages → Source: Deploy from branch (main)

3. **绑定自定义域名**
   - Settings → Pages → Custom domain: `deepsleep.fun`
   - 勾选 Enforce HTTPS

4. **配置 DNS 解析**
   - 在腾讯云添加 CNAME 记录指向 `<username>.github.io.`

详见 **[无信用卡免费部署指南.md](./无信用卡免费部署指南.md)** 第四章。

---

## 🔧 高级功能

### 评论系统（Giscus）

基于 GitHub Discussions，无需后端：

1. 访问 https://giscus.app/
2. 配置仓库和 Discussion 分类
3. 复制生成的 `<script>` 代码
4. 创建 `layouts/partials/comments.html` 并粘贴

### Google Analytics 统计

1. 注册 https://analytics.google.com/ （免费）
2. 获取跟踪 ID (`G-XXXXXXXXXX`)
3. 在 `hugo.toml` 中添加：

```toml
params:
  analytics:
    google:
      SiteVerificationTag: "G-XXXXXXXXXX"
```

### SEO 优化

Hugo 已内置：
- ✅ Sitemap.xml（自动生成）
- ✅ Robots.txt（自动生成）
- ✅ Open Graph 标签
- ✅ Twitter Cards
- ✅ RSS Feed
- ✅ 结构化数据

手动提交到搜索引擎：
- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)

### 图片优化建议

- 使用 WebP 格式（体积更小）
- 压缩工具：TinyPNG, Squoosh, ImageOptim
- 使用图床：GitHub, Imgur, SM.MS
- 或存放在 `static/images/` 目录

---

## 📚 常用命令速查

| 操作 | 命令 |
|------|------|
| **本地开发** | `hugo server -D` |
| **新建文章** | `hugo new posts/title.md` |
| **构建生产** | `hugo --minify --gc` |
| **清理构建** | `hugo --cleanDestinationDir` |
| **发布新文章** | `git add . && git commit -m "" && git push` |
| **更新主题** | `hugo mod get -u github.com/adityatelange/hugo-PaperMod` |
| **预览草稿** | `hugo server -D -F` |
| **查看版本** | `hugo version` |
| **列出草稿** | `hugo list drafts` |
| **显示帮助** | `hugo help` |

---

## 🔄 迁移指南

### 从 WordPress 导出

使用工具转换：
- [Jekyll Exporter](https://github.com/jekyll/jekyll-export) (WordPress 插件)
- 转换为 Markdown 后放入 `content/posts/`

### 从 Ghost 导出

Ghost 可以导出 JSON 格式，使用脚本转换为 Markdown。

### 导出到其他平台

所有文章都是标准 Markdown，可导入：
- Ghost, WordPress, Medium, Substack 等

---

## 🐛 故障排查

### 问题：本地预览空白或报错

```bash
# 清理缓存重新构建
hugo --cleanDestinationDir
rm -rf public resources

# 检查主题是否下载成功
ls themes/PaperMod
```

### 问题：GitHub Actions 部署失败

1. 查看日志：仓库 → Actions → 最新运行 → 详情
2. 常见原因：
   - Hugo 版本不匹配（修改 `deploy.yml` 中的版本号）
   - Markdown 语法错误（检查 front matter 格式）
   - 主题模块未初始化（确保已执行 `hugo mod init` 和 `hugo mod get`）

### 问题：自定义域名无法访问

1. 检查 DNS 是否生效：https://dnschecker.org/?query=deepsleep.fun&type=CNAME
2. 等待传播（最多 24 小时）
3. 清除本地 DNS 缓存：`ipconfig /flushdns` (Windows)
4. 检查 GitHub Pages 设置中域名是否正确

### 问题：HTTPS 证书错误

- 等待 Let's Encrypt 签发证书（通常 1 小时内）
- 在 GitHub Pages Settings 中确认 "Enforce HTTPS" 已勾选

---

## 📈 性能优化建议

### 1. 启用资源压缩（已默认开启）

Hugo 的 `--minify` 参数会自动压缩 HTML/CSS/JS。

### 2. 图片懒加载

在 `hugo.toml` 中添加：

```toml
params:
  assets:
    disableFingerprinting: false
    favicon: "<link / abs url>"
    favicon16x16: "<link / abs url>"
    favicon32x32: "<link / abs url>"
    apple_touch_icon: "<link / abs url>"
    safari_pinned_tab: "<link / abs url>"
```

### 3. 使用 WebP 图片

```markdown
![description](image.webp)
```

### 4. 启用 Gzip/Brotli（CDN 层面处理）

GitHub Pages 和 Cloudflare Pages 默认启用压缩传输。

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 👥 致谢

感谢以下开源项目：
- [Hugo](https://gohugo.io/) - 强大的静态站点生成器
- [PaperMod](https://adityatelange.github.io/hugo-PaperMod/) - 精美的博客主题
- [GitHub Pages](https://pages.github.com/) - 免费托管服务
- [Cloudflare Pages](https://pages.cloudflare.com/) - 快速 CDN 分发

---

## ⭐ 支持项目

如果这个模板对你有帮助，欢迎：

- ⭐ Star 这个仓库
- 🍴 Fork 并定制你自己的版本
- 📝 分享给朋友
- 💬 在评论区留言反馈

---

**最后更新**: 2026-07-30
**DeepSleep 项目版本**: v5.4
**工具版本**: Hugo v0.139.0 + PaperMod v7.x
**部署状态**: ✅ Production Ready  

🎉 **享受创作的乐趣吧！**

# DeepSleep Blog - Hugo 静态博客

> **域名**: https://deepsleep.fun
> **GitHub**: https://github.com/106-official/deepsleep-blog
> **技术栈**: Hugo + GitHub Pages + PaperMod 主题
> **DeepSleep 项目版本**: v5.17
> **最后更新**: 2026-08-14

---

## ✨ 项目特点

- **零成本部署**: GitHub Pages 免费托管 + GitHub Actions 自动构建,推送即上线
- **评论系统**: Waline 自托管(Vercel + Neon PostgreSQL,国内可直连)
- **社区论坛**: 用户注册/登录 + 发帖(腾讯云 SCF 后端)
- **学习板块**: CPA / ACCA / 网络协议教程(learn 风格 sidebar,支持 KaTeX)
- **娱乐中心**: SleepTown(渔港推理)、CardArena(苏丹宫廷卡牌对战)、交互式自我介绍
- **响应式 + 明暗主题**: 移动端适配,主题切换圆形扩散动画,字体大小调节
- **SEO 友好**: 纯静态 HTML + sitemap + RSS

---

## 🏗️ 系统架构(3 个独立部署单元)

| 单元 | 位置 | 部署 | URL |
|------|------|------|-----|
| 前端博客 | `blog-static/` | GitHub Actions → GitHub Pages | https://deepsleep.fun |
| 评论系统 | `waline-deepsleep/` | Vercel Serverless | https://waline-deepsleep.vercel.app |
| 社区后端 | `scf-community-deepsleep/` | 腾讯云 SCF | `1437998910-loiqxuadw0.ap-shanghai.tencentscf.com` |

共享 **Neon PostgreSQL** 数据库。

---

## 🚀 快速开始

### 前置要求

- [Git](https://git-scm.com/)
- [Hugo Extended](https://gohugo.io/getting-started/quick-start/) (v0.139.0+)

### 本地预览

```bash
cd blog-static
hugo server -D
```

访问 http://localhost:1313 查看效果。

### 新建文章

```bash
hugo new posts/my-new-post.md
```

编辑 `content/posts/my-new-post.md` 的 front matter 与正文,提交推送即上线:

```bash
git add .
git commit -m "Add new post: my-new-post"
git push origin main    # GitHub Actions 约 1-2 分钟后自动部署
```

---

## 📁 内容板块

| 板块 | 路径 | 说明 |
|------|------|------|
| 文章 | `/posts/` | 博客文章,learn 风格 sidebar |
| 学习 | `/learn/` | CPA / ACCA / 网络协议教程(30 个协议,KaTeX 公式) |
| 娱乐 | `/play/` | SleepTown / CardArena / 交互式自我介绍(/play/me/) |
| 社区 | `/community/` | 论坛(注册/登录/发帖,4 种分类) |
| 资源 | `/resources/` | 资源分享板块 |
| 个人 | `/profile/` | 个人资料页(头像上传/简介) |
| 关于 | `/me/`、`/about/` | 关于我(旧版 /me/ 保留) |

---

## 🎨 自定义配置

### 站点信息 (`hugo.toml`)

```toml
baseURL: 'https://deepsleep.fun/'
languageCode: 'zh-CN'
title: 'DeepSleep Blog'
theme: ['PaperMod']
```

### 导航菜单

`hugo.toml` 的 `menu.main` 配置,当前顺序:文章 → 资源 → 学习 → 我 → 社区 → 娱乐 → 个人。

### 主题与字体

- 明暗双主题(PaperMod 内置,`defaultTheme: auto`)
- 金色设计语言用于娱乐中心/交互式自我介绍(CSS 变量定义在 `:root`)

---

## 📚 常用命令速查

| 操作 | 命令 |
|------|------|
| 本地开发 | `hugo server -D` |
| 新建文章 | `hugo new posts/title.md` |
| 构建生产 | `hugo --minify --gc` |
| 清理构建 | `hugo --cleanDestinationDir` |
| 发布 | `git add . && git commit -m "" && git push origin main` |

---

## 📖 详细文档

- **项目上下文(快速上手)**: `docs/blog/PROJECT_CONTEXT.md`
- **项目技术文档(完整)**: `docs/blog/PROJECT_DOCUMENTATION.md`
- **板块文档**: `docs/blog/sections/`(CardArena / CPA / SleepTown / learn)
- **设计文档**: `docs/superpowers/`(plans + specs)
- **评论系统**: `docs/waline/README.md`
- **社区系统**: `docs/community/README.md`
- **立信 LLM API**: `docs/scf-lixin-ask/README.md`
- **远程控制服务**: `docs/remote-control/README.md`

> 注:以上文档统一托管在 n8n 工作区 `docs/` 目录(2026-08-14 起整合,不再随博客仓库存放)。

---

## 🐛 故障排查(摘要)

- **部署失败**: 查看 https://github.com/106-official/deepsleep-blog/actions 的构建日志
- **评论异常**: 检查 `waline-deepsleep.vercel.app` 与 Neon 数据库状态
- **社区异常**: 检查 SCF 函数与数据库连接(详见 PROJECT_DOCUMENTATION.md 第 7 章)

完整排查流程见 `docs/blog/PROJECT_DOCUMENTATION.md`。

> 多设备 / 并行推送(两个设备同账号 + 工作区并行会话)导致冲突的处置,见 `docs/COLLABORATION.md`。

---

**最后更新**: 2026-08-14
**DeepSleep 项目版本**: v5.17
**部署状态**: Production

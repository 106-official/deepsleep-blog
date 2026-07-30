# DeepSleep Blog 项目上下文 - 快速上手指南

> **生成时间**: 2026-07-30
> **当前版本**: v5.8
> **最后更新**: 2026-07-30

---

## 📌 项目基本信息

| 属性 | 值 |
|------|-----|
| **项目名称** | DeepSleep Blog (个人博客) |
| **域名** | https://deepsleep.fun |
| **GitHub 主仓库** | https://github.com/106-official/deepsleep-blog |
| **本地路径** | `c:\Users\26516\Desktop\n8n\blog-static` |
| **技术栈** | Hugo 静态站点 + PaperMod 主题 + Vercel Serverless |
| **数据库** | Neon PostgreSQL (Serverless) |

---

## 🏗️ 系统架构（3个独立部署单元）

### 1️⃣ 前端博客 (blog-static) — GitHub Pages
- **位置**: `c:\Users\26516\Desktop\n8n\blog-static`
- **部署**: GitHub Actions 自动构建 → GitHub Pages
- **域名**: https://deepsleep.fun
- **功能**: 博客文章、社区前端、全局个人中心、文章板块

### 2️⃣ 评论系统后端 (waline-deepsleep) — Vercel
- **位置**: `c:\Users\26516\Desktop\n8n\waline-deepsleep` (独立 Git 仓库)
- **部署**: Vercel Serverless Functions
- **URL**: https://waline-deepsleep.vercel.app
- **管理后台**: https://waline-deepsleep.vercel.app/ui
- **功能**: Waline 评论 CRUD、用户认证

### 3️⃣ 社区系统后端 (community-deepsleep) — Vercel ⭐ v5.1 新增
- **位置**: `c:\Users\26516\Desktop\n8n\community-deepsleep` (独立目录，未推送到 GitHub)
- **部署**: Vercel CLI (`vercel --prod`)
- **URL**: https://community-deepsleep.vercel.app
- **功能**: 用户注册/登录、个人资料、帖子 CRUD
- **认证方式**: JWT Token (7天有效期)
- **CORS 配置**: ✅ 代码级响应头（重要！）

---

## 🎯 当前核心功能清单 (v5.8)

### 已实现功能

#### 📝 内容展示
- [x] 博客文章系统 (Hugo Markdown)
- [x] 文章板块 (/posts/) — 整合社区帖子与博客文章，learn 风格 sidebar ⭐ v5.5
- [x] 作者信息显示 — 头像(28x28px)+名称+时间 ⭐ v5.2
- [x] 归档页面 (/archives/)
- [x] 搜索页面 (/search/) — Fuse.js 全文搜索
- [x] 资源分享板块 (/resources/) — learn 风格 sidebar ⭐ v5.5
- [x] 关于我 (/me/)
- [x] 关于页面 (/about/)

#### 💬 交互功能
- [x] Waline 评论系统 (Neon PostgreSQL)
- [x] 社区论坛系统 (/community/) ⭐ v5.1
  - 用户注册/登录 (邮箱+密码)
  - JWT Token 认证
  - 发布帖子 (4种分类: 日常交流/技术分享/资源分享/问题求助)
  - 帖子列表/分页/筛选
- [x] 独立个人资料页面 ⭐ v5.2.1
  - 导航栏右侧"👤 个人"按钮 (所有页面可见)
  - 独立页面 /profile/ (替代 Modal 弹窗) ⭐ v5.2.1 新增
  - 头像图片上传 (支持 JPG/PNG/GIF/WebP, Base64 编码) ⭐ v5.2.1 新增
  - 用户信息展示 (昵称/头像/邮箱/简介)
  - 智能错误处理 (自动识别异常并引导重新登录) ⭐ v5.2.1 新增
  - 未登录显示友好提示并引导登录
- [x] 主题切换圆形扩散动画 (View Transitions API) ⭐ v5.6
- [x] 字体大小调节 (5 档 80%-120%，localStorage 持久化) ⭐ v5.7
- [x] lixin 页面 sidebar 改造 + LLM 对话主页化 (v5.5 sidebar 统一完成) ⭐ v5.8
  - 双层 Tab → learn 风格 sidebar（校内 10 项 + 校外 2 项导航组）
  - LLM 对话从悬浮弹窗改为主内容区默认全屏 flex 视图
  - 对话视图去边框融入主界面（移除 border/shadow/radius，背景 transparent）
  - 发送按钮改圆形 ↑ 箭头：默认灰色 → 可发送时白色（暗色模式 #e8e8e8）
  - JS updateSendBtn() 同步按钮可用状态（空 input / 发送中 → disabled 灰色）
  - 修复 extend_head.html 文件名拼写错误（v5.2 起累积的 head CSS 全部失效，Aa 按钮显示为 "Aa80%90%100%110%120%"）
  - 发送按钮与输入框对齐（align-items:center + 输入框单行高度≈38px 匹配按钮）
  - 隐藏 lixin 页面 footer 黑块（hideFooter: true，保留全局 JS）
  - 删除独立"👤 个人"按钮，改为原生 menu 项（hugo.toml 配置 weight=60 置于最右），删除 extend_footer.html 的 initGlobalProfile JS + extend_head.html 的 .global-profile-btn CSS；导航菜单顺序：文章→资源→学习→我→社区→娱乐→个人
  - 修复暗色模式导航栏白色问题：custom.css body 硬编码白色渐变 + 深色文字无暗色覆盖，普通页面（非 .list）暗色模式下仍白色；extend_head.html 新增 [data-theme="dark"] body 覆盖，复用 PaperMod --theme/--primary 变量
  - 点击切换按钮时以按钮为圆心圆形扩散变色
  - 双向自适应：亮→暗黑幕合拢 / 暗→亮光明绽放
  - 600ms cubic-bezier 缓动
  - 不支持 View Transitions API / prefers-reduced-motion 自动降级为原生瞬间切换

#### 🎨 UI/UX
- [x] 响应式设计 (移动端适配)
- [x] 暗色/亮色主题切换 (PaperMod 内置)
- [x] 自定义样式 (custom.css, community.css)

---

## 📁 关键文件索引

### 前端核心文件 (blog-static)

```
blog-static/
├── hugo.toml                          # Hugo 主配置 (菜单/参数)
├── content/
│   ├── posts/_index.md                # ⭐ 文章列表页声明 (layout: posts) v5.2
│   ├── profile.md                     # ⭐ 个人资料页声明 (layout: profile) v5.2.1 新增
│   ├── community.md                   # 社区页声明 (layout: community)
│   ├── archives.md                    # 归档页
│   ├── search.md                      # 搜索页
│   └── me.md                          # 关于我
├── layouts/
│   ├── partials/
│   │   ├── comments.html              # Waline 评论组件
│   │   ├── extend_head.html          # ⭐ 全局头部 (字体/CSS/表单样式) v5.2.1 更新；v5.8 修正文件名（原 extended_head.html 未被 PaperMod 加载）
│   │   └── extend_footer.html         # ⭐ 全局页脚 (个人按钮注入+JS) v5.2.1 简化
│   └── _default/
│       ├── community.html             # 社区布局模板 (纯 HTML, 无 Markdown)
│       ├── posts.html                # ⭐ 文章列表模板 (learn 风格 sidebar) v5.5
│       ├── resources.html            # ⭐ 资源列表模板 (learn 风格 sidebar) v5.5 新增
│       ├── play.html                  # 娱乐中心模板 (Playfair Display 标题 + 紧凑卡片) v5.6
│       ├── sleeptown.html            # ⭐ SleepTown 游戏模板 (含关卡模式 sidebar) v2.2.2.0
│       └── profile.html              # ⭐ 个人资料页面模板 (独立页面) v5.2.1 新增
└── static/
    ├── css/
    │   ├── custom.css                 # 自定义样式
    │   ├── waline.css                 # Waline 样式 (22KB, 本地化)
    │   └── community.css             # 社区样式 (含夜间模式+个人按钮)
    └── js/
        ├── waline.umd.min.js          # Waline JS (256KB, 必须完整)
        └── community.js              # ⭐ 社区交互 + API错误拦截 v5.2.1 更新
```

### 后端 API 文件 (community-deepsleep)

```
community-deepsleep/api/
├── db.js                              # 数据库连接池 (Neon PostgreSQL)
├── auth.js                            # JWT 认证中间件
├── register.js                        # POST /api/register ✅ CORS已添加
├── login.js                           # POST /api/login ✅ CORS已添加
├── me.js                              # GET/PUT /api/me ✅ CORS已添加
├── posts.js                           # GET/POST /api/posts ✅ CORS已添加
└── init.js                            # GET /api/init (初始化表结构)
```

---

## 🔧 技术配置要点

### 数据库连接 (Neon PostgreSQL)
```bash
# 连接串格式 (已在 Vercel 环境变量中配置)
postgresql://neondb_owner:<password>@ep-falling-thunder-atcgsx0w-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# 关键点:
- 使用 Pooled Connection (pooler)
- 强制 SSL (sslmode=require)
- channel_binding=require (安全选项)
```

### Vercel 环境变量 (community-deepsleep)
| 变量名 | 值 | 用途 |
|--------|-----|------|
| `DATABASE_URL` | Neon 连接串 | PostgreSQL 连接 |
| `JWT_SECRET` | `community-deepsleep-jwt-secret-key-2026-secure` | JWT 签名密钥 |

### CORS 配置 (⚠️ 重要!)
```javascript
// ❌ 错误做法: vercel.json Headers 配置对 Serverless Functions 不生效!
// ✅ 正确做法: 在每个 API 路由文件中手动设置:

function setCorsHeaders(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://deepsleep.fun');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

module.exports = async (req, res) => {
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();  // 处理预检请求
  }
  
  // ... 业务逻辑
};
```

---

## 🚨 已知问题 & 解决方案 (Bug Fix 汇总)

### Bug 1: Waline 评论不显示 (v5.0)
- **原因**: ORB 安全策略阻止 CDN 加载
- **解决**: 完全本地化 Waline 资源 (JS/CSS 放入 static/)

### Bug 2: Supabase ENOIDENTIFIER (v5.0)
- **原因**: Supavisor 无法提取租户 ID
- **解决**: 迁移到 Neon PostgreSQL (通过 Vercel 集成)

### Bug 3: 社区 HTML 被当作代码渲染 (v5.1)
- **原因**: Hugo Goldmark 转义 HTML
- **解决**: 改用 Hugo 布局模板 (layouts/_default/community.html)

### Bug 4: 登录/注册表单不显示 (v5.1)
- **原因**: PaperMod CSS 覆盖 display 属性
- **解决**: CSS `!important` + 内联 style.display + JS 双重切换

### Bug 5: 表单 ID 不匹配导致切换失败 (v5.1→v5.2)
- **原因**: HTML ID (`reg-form`) ≠ JS 查找值 (`register`)
- **解决**: 统一命名为 `login` / `register`

### Bug 6: "Failed to fetch" CORS 错误 (v5.2)
- **原因**: vercel.json Headers 对 Serverless 不生效
- **解决**: 所有 API 路由添加代码级 CORS 头 (setCorsHeaders)

### Bug 7: 个人资料页面 "用户不存在" 错误 (v5.2.1)
- **原因**: 
  - localStorage 残留过期 Token 或数据库用户记录被删除
  - community.js api() 函数只拦截"未登录/过期"，未处理"用户不存在"
  - profile.html 缺少对认证异常的友好处理
- **现象**: 页面显示"加载失败: 用户不存在"技术性错误，表单空白无法使用
- **解决方案**:
  - ✅ 更新 community.js api() 函数：扩展错误拦截范围（增加"用户不存在"/"不存在"）
  - ✅ 重构 profile.html 错误处理：多层防御机制（认证异常→网络故障→其他错误）
  - ✅ 自动清理无效数据：检测到异常时自动 clearToken() + clearUser()
  - ✅ 友好 UI 引导：显示"⚠️ 账户异常"提示 + "🔄 重新登录"按钮
  - ✅ 移除 location.reload()：避免无限循环，改为静态提示 UI

---

## 🛠️ 开发工作流

### 日常修改流程
```bash
# 1. 修改代码 (任意文件)
# 2. 提交并推送 (仅 blog-static 需要 Git)
cd c:\Users\26516\Desktop\n8n\blog-static
git add .
git commit -m "feat: 描述你的修改"
git push origin main

# 3. GitHub Actions 自动部署 (约 2-3 分钟)
# 访问: https://github.com/106-official/deepsleep-blog/actions
```

### 社区后端部署流程
```bash
# 1. 修改 API 代码
cd c:\Users\26516\Desktop\n8n\community-deepsleep

# 2. 直接部署到 Vercel (无需 Git)
vercel --prod --yes

# 3. 验证部署
curl https://community-deepsleep.vercel.app/api/posts?limit=1
```

### Git 代理配置 (网络问题)
```bash
# 如果遇到网络超时，检查代理设置
git config --global http.proxy http://127.0.0.1:65532
git config --global https.proxy http://127.0.0.1:65532
```

---

## 📊 项目演进历史

| 版本 | 日期 | 主要变更 |
|------|------|---------|
| **v5.0** | 2026-06-02 | 初始上线，Waline 评论系统 (Neon) |
| **v5.1** | 2026-06-17 | 社区论坛系统 (注册/登录/发帖) |
| **v5.2** | 2026-06-17 | 全局个人中心 + 文章板块整合 + CORS修复 |
| **v5.2.1** | 2026-06-20 | 独立个人资料页面 + 图片上传 + 错误处理优化 |
| **v5.3** | 2026-07-07 | 修复 JavaScript 重复加载问题 |
| **v5.4** | 2026-07-30 | 清理停用项目资料并统一 DeepSleep 文档版本 |
| **v5.5** | 2026-07-30 | 文章/资源/SleepTown 关卡页统一改造为 learn 风格 sidebar + 移动端抽屉 |
| **v5.6** | 2026-07-30 | 主题切换圆形扩散动画 (View Transitions API) + 娱乐中心/SleepTown 模式选择页视觉统一（Playfair Display 标题、删表情、紧凑按钮） |
| **v5.7** | 2026-07-31 | 字体大小调节功能（Aa 按钮 + 5 档弹窗 + localStorage 持久化，CSS 变量 --font-scale 控制 rem 缩放） |
| **v5.8** | 2026-07-31 | lixin 页面 sidebar 改造（双层 Tab → learn 风格 sidebar）+ LLM 对话主页化（悬浮弹窗 → 主内容区默认全屏视图）+ 对话视图去边框融入主界面 + 发送按钮改圆形↑箭头（灰→白状态切换）+ 修复 extend_head.html 文件名拼写错误（v5.2 起累积 head CSS 全部失效）+ footer 全宽+主题感知背景修复（覆盖 PaperMod 768px 限制消除两侧留白，白天模式黑底→浅色渐变，链接颜色随主题切换） |

---

## 🎯 下一步可能的需求方向

基于当前架构，可扩展的功能：
- [ ] 帖子详情页 (点击卡片查看完整内容)
- [ ] 评论系统 (帖子评论功能)
- [ ] 点赞/收藏功能
- [ ] 用户主页 (查看某用户发布的所有帖子)
- [x] 图片上传服务 ⭐ v5.2.1 已完成（个人头像上传，Base64 编码存储）
- [ ] 管理员后台 (审核/删除不当内容)
- [ ] 邮件通知 (新回复/点赞提醒)
- [ ] SEO 优化 (meta tags, sitemap)

---

## 📚 参考文档

- **完整项目文档**: `blog-static/PROJECT_DOCUMENTATION.md` (1200+ 行)
- **Bug Fix Q&A**: 第 11 章节 (9 条详细记录)
- **注意事项**: 第 7 章节 (14 条关键提醒)
- **API 接口文档**: PROJECT_DOCUMENTATION.md 第 276-285 行

---

## 💡 快速诊断命令

```bash
# 检查前端部署状态
curl -I https://deepsleep.fun

# 测试评论 API
curl https://waline-deepsleep.vercel.app/api/article?url=/posts/hello-world/

# 测试社区 API (需带 Origin 头模拟浏览器)
curl -H "Origin: https://deepsleep.fun" https://community-deepsleep.vercel.app/api/posts?limit=1

# 检查 GitHub Actions 构建状态
gh run list --repo 106-official/deepsleep-blog --limit 3

# 检查 Vercel 部署日志
vercel logs community-deepsleep
```

---

## ❓ 常见问题 FAQ

**Q: 为什么社区后端没有推送到 GitHub?**
A: 因为创建 GitHub 仓库失败，改用 Vercel CLI 直接部署。代码在本地 Git 仓库中。

**Q: 如何测试 CORS 是否正常?**
A: 使用浏览器 DevTools → Network 标签，检查 OPTIONS/POST 请求的响应头是否包含 `Access-Control-Allow-Origin: https://deepsleep.fun`

**Q: 论坛版块去哪了?**
A: v5.2 已删除 (content/forum.md)，如需恢复需重新创建文件并添加 hugo.toml 菜单配置。

**Q: 全局个人按钮在哪里注入的?**
A: 通过 `extend_footer.html` 中的 JavaScript 动态创建 DOM 元素并插入到导航栏后面。

**Q: 为什么从 Modal 弹窗改为独立页面?**
A: v5.2.1 重构为独立页面 `/profile/` 以提供更好的用户体验（完整信息展示 + 图片上传功能 + 智能错误处理）。

**Q: 个人资料页面的图片上传如何工作?**
A: 使用 FileReader API 将本地图片转换为 Base64 编码，通过 PUT /api/me 接口存储到数据库 community_users.avatar_url 字段。支持 JPG/PNG/GIF/WebP 格式，限制 2MB。

**Q: 遇到"用户不存在"错误怎么办?**
A: 系统会自动清除无效的 Token 和用户数据，并显示"⚠️ 账户异常"提示引导重新登录。这是前后端数据不一致时的保护机制（v5.2.1 新增）。

---

## 🎓 关键技术决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| Waline 前端资源 | 本地化 UMD | 避免 CDN 被 ORB 阻止 |
| 数据库 | Neon PostgreSQL | Supabase 兼容性问题 |
| 社区认证 | JWT Token | 无状态，适合 Serverless |
| 社区页面渲染 | Hugo 布局模板 | 避免 Goldmark 转义 HTML |
| CSS 优先级 | !important + 内联样式 | 对抗 PaperMod 全局覆盖 |
| CORS 配置 | 代码级响应头 | vercel.json Headers 不生效 |
| 全局组件 | JS 动态注入 | 所有页面复用，无需重复实现 |
| 文章板块 | API + Hugo 混合 | 动态数据 + 静态性能兼顾 |
| **文章列表页 sidebar** | **learn 同款设计（v5.5）** | **CSS 变量/字体/抽屉复用，视觉一致性** ⭐ 新增 |
| **资源列表页 sidebar** | **learn 同款设计（v5.5）** | **资源卡片网格 + 标签 + 快速导航，视觉一致** ⭐ 新增 |
| **SleepTown 关卡页 sidebar** | **learn 同款设计（v5.5 / SleepTown v2.2.2.0）** | **左章节列表 + 右关卡详情卡片，10 关扩展** ⭐ 新增 |
| **主题切换动画** | **View Transitions API + clip-path 圆形扩散（v5.6）** | **以按钮为圆心双向自适应扩散，不破坏原生降级路径** ⭐ |
| **字体大小调节** | **CSS 变量 --font-scale + rem 缩放（v5.7）** | **Aa 按钮弹窗 5 档 80%-120%，localStorage 持久化，body 用 1rem !important 覆盖 custom.css 的 16px** ⭐ 新增 |
| 个人资料页 | 独立页面 (v5.2.1) | 完整信息展示 + 图片上传 + 更好的错误处理 ⭐ 新增 |
| 图片上传方式 | Base64 编码存储 | 无需额外文件存储服务，简化架构 ⭐ 新增 |
| 错误处理策略 | 多层防御机制 | API层拦截 + 页面层友好提示 + 自动清理脏数据 ⭐ 新增 |

---

**📌 使用说明**:
将此提示词复制粘贴给新的 AI 助手，即可快速了解项目全貌。建议配合 `PROJECT_DOCUMENTATION.md` 详细文档一起使用。

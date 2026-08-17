# Spec: /play/me/ 交互式自我介绍页面

## 背景

DeepSleep 博客（deepsleep.fun）现有的「关于我」页面 `/me/`（`content/me.md`）是 PaperMod 默认 `single` 布局的占位文档，仅含联系方式，正文待完善，缺乏个人展示力。用户希望把「我」做成一个**交互介绍式游戏**，作为娱乐中心 `/play/` 下的新入口 `/play/me/`，通过滚动叙事 + 数据可视化展现个人经历、技能、作品。

本设计基于 brainstorming 流程，经 4 轮澄清提问后确定的方案 A（轻量交互式简历）。

## 需求决策（brainstorming 结论）

| 维度 | 决策 | 理由 |
|------|------|------|
| 游戏形态 | 滚动叙事 + 数据可视化 | 信息密度高，适合展示经历与成就，移动端友好 |
| 内容结构 | 混合式（Hero → 时间轴 → 技能 → 作品 → 联系） | 信息最完整，叙事节奏清晰 |
| 内容填充 | 纯占位框架（所有个人信息用 `【】` 标记） | 用户后续自己填，先搭好交互骨架 |
| 路由处理 | 双入口并存（旧 `/me/` 保留，`/play/me/` 从娱乐中心进入） | 不破坏现有导航，`/play/me/` 作为游戏化版本独立入口 |
| 方案选择 | 方案 A（轻量交互式简历） | 复用项目设计语言、零新依赖、符合 minimal edits、可平滑升级 |
| 叙事显示方式 | 预写文本 + 前端打字机模拟 SSE 流式逐字显示 | 纯前端无后端依赖，与占位框架一致；故事性段落逐字流式有「AI 讲故事」沉浸感，数据点直接显示避免烦人 |

## 设计

### 1. 路由与文件结构

**新增文件**：

| 文件 | 用途 |
|------|------|
| `blog-static/content/play/me.md` | 声明 `layout: "me-game"`，front matter 含 title/description |
| `blog-static/layouts/_default/me-game.html` | 游戏化介绍模板（HTML + 内联 `<style>` + 内联 `<script>`，自包含单文件） |

**修改文件**：

| 文件 | 变更 |
|------|------|
| `blog-static/layouts/_default/play.html` | `.games-grid` 新增「关于我」卡片（SleepTown 卡片之后、「更多游戏」占位之前） |
| `blog-static/PROJECT_CONTEXT.md` | 版本号 v5.8→v5.9、功能清单、版本演进表、文件索引、技术决策表 |
| `blog-static/PROJECT_DOCUMENTATION.md` | 版本号、功能特性、目录结构、更新日志 v5.9 条目、技术决策表 |

**不动文件**：

| 文件 | 原因 |
|------|------|
| `blog-static/content/me.md` | 旧 `/me/` 保留，双入口并存 |
| `blog-static/hugo.toml` | 菜单「我」仍指 `/me/`，无改动 |

**路由**：`https://deepsleep.fun/play/me/`，仅从 `/play/` 娱乐中心「关于我」卡片点击进入。

### 2. 页面结构（5 个 section，纵向滚动）

```
.me-game-page（max-width 1100px 居中，突破 PaperMod 768px）
├── section.me-hero          # 首屏：头像 + 姓名 + 标语 + 滚动提示
├── section.me-timeline      # 成长轨迹：垂直时间轴（节点 + 卡片左右交替）
├── section.me-skills        # 技能矩阵：进度条网格（名称 + 条 + 百分比）
├── section.me-works         # 作品与项目：卡片墙（封面 + 标题 + 描述 + 标签）
└── section.me-contact       # 联系我：联系卡片网格（图标 + 标签 + 值/链接）
```

每段之间用金色细分隔线 + 章节序号装饰（`01 / 05` 形式）做视觉切分。

#### 2.1 Hero 首屏

- 圆形头像占位（金色描边，加载失败显示金色首字母圆）
- 大字号姓名（Playfair Display）
- 一句话标语（斜体，弱化色）
- 底部滚动提示 `↓`（上下浮动动画，滚动后淡出）

#### 2.2 Timeline 成长轨迹

- 垂直时间轴（中央金色竖线，桌面端节点左右交替，移动端统一左对齐）
- 4-5 个里程碑卡片：年份徽章 + 标题 + 描述
- 节点滚动到视口时点亮（金色调圈 + 微缩放）

#### 2.3 Skills 技能矩阵

- 网格布局（桌面 2 列，移动 1 列）
- 6-8 项技能：标签 + 进度条 + 百分比数字
- 进度条滚动触发宽度动画（`0 → var(--level)`，1.2s）
- 百分比数字滚动计数（`requestAnimationFrame`，0→目标值，1.5s）

#### 2.4 Works 作品与项目

- 卡片网格（桌面 3 列，平板 2 列，移动 1 列）
- 4 个作品卡片：封面占位图 + 标题 + 描述 + 标签 + 链接
- 复用 `play.html` `.game-card` 风格（圆角 12px + 阴影 + hover 上浮 4px）

#### 2.5 Contact 联系我

- 卡片网格（桌面 3 列，移动 1 列）
- 联系项：图标 + 标签 + 值/链接
- Email / GitHub / Blog 用已知真实值（`2651699459@QQ.COM` / `106-official` / `deepsleep.fun`），其余占位

### 3. 滚动交互与动画机制

| 元素 | 触发条件 | 动画效果 |
|------|---------|---------|
| 各 section 结构骨架 | `IntersectionObserver` 进入视口 15% | 淡入 + 上移 20px，`0.6s cubic-bezier(0.4,0,0.2,1)` |
| **叙事文本段落** | **所属 section 进入视口后** | **打字机逐字显示（模拟 SSE 流式），~30ms/字，配光标 `▌` 闪烁** |
| 技能进度条 | 进入视口 | `width: 0 → var(--level)`，`1.2s ease-out` |
| 数字统计 | 进入视口 | `requestAnimationFrame` 0→目标值，1.5s |
| 时间轴节点 | 进入视口 | 金色圆圈点亮 + 微缩放（`scale(1.15)`） |
| Hero 滚动提示 | 首屏 + 滚动 | `↓` 上下浮动（`2s ease-in-out infinite`）；滚动超过 100px 淡出 |

#### 3.1 打字机流式效果（模拟 SSE）

**适用范围**（仅叙事性段落文本，数据/标签直接显示）：

| Section | 打字机适用 | 直接显示 |
|---------|-----------|---------|
| Hero | 一句话标语 | 姓名、头像 |
| Timeline | 每个里程碑的描述段落 | 年份、标题 |
| Skills | （无，技能名是标签） | 技能名称、数值、进度条 |
| Works | 每个作品的描述段落 | 标题、标签、链接 |
| Contact | （无，联系方式是数据） | 图标、标签、值/链接 |

**设计原则**：故事性文本逐字流式（有"AI 讲故事"的沉浸感），数据点直接显示（避免读数字烦人）。

**实现机制**：
- 叙事文本预写在 HTML 中（占位 `【】`），JS 启动时把文本存入 `data-text` 属性，清空可见内容
- section 进入视口（IntersectionObserver 触发）后，启动该 section 内的打字机队列
- 用 `setInterval` 每 ~30ms append 一个字符到 `textContent`，末尾跟随闪烁光标 `▌`
- 打字完成后光标淡出，该段落保持完整文本
- 多个叙事段落按顺序排队打字（同 section 内串行，不同 section 各自独立）
- 离开视口不重新打字（已完成的保持，未启动的等下次进入视口）

**核心实现**：
- 单个 `IntersectionObserver` 实例，`threshold: 0.15`，观察所有 `[data-animate]` 元素和 section
- 进入视口加 `.in-view` 类，触发 CSS `transition`（骨架淡入）
- 骨架淡入后（~600ms 延迟）启动该 section 的打字机队列
- 数字滚动用 JS `requestAnimationFrame` 缓动到目标值

**降级路径**：
- `prefers-reduced-motion: reduce` → 所有元素默认可见（无 `opacity:0` 初始态），叙事文本直接显示全文，无打字机动画
- 不支持 `IntersectionObserver` 的旧浏览器 → 同样直接显示所有内容（feature detect 后跳过观察与打字机）
- JS 被禁用 → 叙事文本应能在 `<noscript>` 或默认 HTML 中可见（文本预写在 DOM，JS 只是清空后再逐字填充；若 JS 不执行，文本保持原样可见）

### 4. 占位数据规范

所有占位统一用 `【】` 中文方括号标记，HTML 注释标注字段名，方便后续全局查找替换：

```html
<!-- 占位：替换为真实姓名 -->
<h1 class="me-hero-name">【姓名/昵称】</h1>

<!-- 占位：替换为里程碑年份 -->
<span class="me-timeline-year">【年份】</span>
```

**占位清单**（实现默认数量，用户后续填内容时可增删）：

| Section | 默认数量 | 字段 |
|---------|---------|------|
| Hero | 3 项 | 头像图、姓名、一句话标语 |
| Timeline | 5 个里程碑 | 年份 + 标题 + 描述 |
| Skills | 6 项 | 名称 + 等级（0-100%） |
| Works | 4 个卡片 | 标题 + 描述 + 标签 + 链接 |
| Contact | 3 真实 + 2 占位 = 5 项 | Email/GitHub/Blog 真实 + 微信/QQ 占位 |

**占位样式**：`【】` 文本用斜体 + 弱化色（`var(--me-text-muted)`），不破坏布局，视觉上提示「待填写」。

### 5. 视觉与样式（复用现有设计语言）

| 属性 | 值 | 来源 |
|------|-----|------|
| 标题字体 | `'Playfair Display', Georgia, serif` | 同 play/sleeptown |
| 正文字体 | `Inter, -apple-system, sans-serif` | 同项目全局 |
| 主色 | `#D4AF37` 金色 | 同娱乐中心 |
| CSS 变量前缀 | `--me-*` | 遵循项目板块前缀规范 |
| 变量定义位置 | `:root` | 遵循项目硬约束（移动端 fixed 元素继承） |
| 暗色模式 | `[data-theme="dark"]` 覆盖 `--me-*` | 不嵌套板块根元素 |
| 卡片风格 | 圆角 12px + 阴影 + hover translateY(-4px) | 复用 play.html `.game-card` |
| 章节标题 | Playfair Display + 金色短下划线装饰 | 同娱乐中心风格 |

**关键 CSS 约束**（遵循项目踩坑教训）：
```css
/* 突破 PaperMod 768px 限制 */
.main:has(.me-game-page) {
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* CSS 变量必须在 :root（非 .me-game-page）*/
:root {
  --me-gold: #D4AF37;
  --me-gold-light: #F4E5B2;
  --me-gold-dark: #B8960C;
  --me-bg: #fafafa;
  --me-surface: #ffffff;
  --me-text: #2d2d2d;
  --me-text-secondary: #666;
  --me-text-muted: #999;
  --me-border: #e8e8e8;
  --me-radius: 12px;
  --me-main-max: 1100px;
}

[data-theme="dark"] {
  --me-bg: #1a1a1a;
  --me-surface: #242424;
  --me-text: #e0e0e0;
  --me-text-secondary: #aaa;
  --me-text-muted: #777;
  --me-border: #333;
}

/* grid item 防 overflow */
.me-game-page { min-width: 0; }
```

### 6. 错误处理与边界

| 场景 | 处理 |
|------|------|
| 头像图片加载失败 | `<img onerror>` 隐藏 img，显示金色首字母占位圆（CSS `::before`） |
| 占位字段未填 | `【】` 文本样式化（斜体 + 弱化色），不破坏布局 |
| 空列表（section 无数据） | CSS `:empty` 隐藏整 section（或 JS 判断后加 `.hidden`） |
| 旧浏览器无 `IntersectionObserver` | feature detect，跳过观察直接显示所有内容 |
| `prefers-reduced-motion: reduce` | 所有 `[data-animate]` 元素默认可见，无 `opacity:0` 初始态 |

### 7. 导航集成

`play.html` 的 `.games-grid` 新增卡片，插入位置在 SleepTown 卡片之后、「更多游戏」占位之前：

```html
<a href="/play/me/" class="game-card">
  <h2>关于我</h2>
  <p>交互式自我介绍</p>
  <span class="game-tag">叙事</span>
</a>
```

样式完全复用现有 `.game-card`（金色 hover 边框 + 上浮），无需新增 CSS。

### 8. 验证方法

**构建验证**：
```powershell
cd c:\Users\26516\Desktop\n8n\blog-static
hugo --gc
# 期望：无 ERROR，pages 数 +1（新增 /play/me/）
```

**功能验证清单**：
- [ ] `/play/me/` 页面渲染正常，5 个 section 顺序正确
- [ ] 滚动各 section 骨架入场动画触发（淡入 + 上移）
- [ ] **叙事文本打字机流式显示**（Hero 标语、Timeline 里程碑描述、Works 作品描述逐字出现 + 光标 `▌` 闪烁）
- [ ] **打字机串行队列**（同 section 内多段落按顺序打字，不同 section 各自独立）
- [ ] **离开视口不重新打字**（已完成的保持，未启动的等下次进入视口）
- [ ] 技能进度条滚动触发宽度动画
- [ ] 数字百分比滚动计数动画
- [ ] 时间轴节点滚动点亮
- [ ] Hero 滚动提示 `↓` 浮动 + 滚动后淡出
- [ ] 暗色模式切换配色协调（`[data-theme="dark"]` 覆盖变量）
- [ ] 移动端 ≤768px：单列、时间轴左对齐、卡片网格 1 列
- [ ] `/play/` 娱乐中心「关于我」卡片可点击跳转 `/play/me/`
- [ ] `prefers-reduced-motion` 降级正常（无动画、叙事文本直接显示全文）
- [ ] **JS 禁用时叙事文本仍可见**（文本预写在 DOM，noscript fallback）
- [ ] 旧 `/me/` 仍可访问（菜单「我」不变）
- [ ] 头像加载失败显示金色首字母占位

**部署验证**：GitHub Actions 自动部署后访问 `https://deepsleep.fun/play/me/`。

## 技术约束

遵循项目硬约束（来自 `project_memory.md`）：
- Git 推送走代理 `http://127.0.0.1:65532`
- Hugo layout 模板用 `{{ define "main" }}` 重写模式
- Front Matter 用标准 `---` 分隔符
- CSS 变量定义在 `:root`（非板块根元素）
- `.main:has(.<prefix>-page)` 突破 PaperMod 768px 限制
- 暗色模式用 `[data-theme="dark"]`（不嵌套板块根元素）
- HTML 内联在 layout 模板中（避免 Goldmark 转义）
- `min-width: 0` 加在 grid item 防溢出

## 非目标（YAGNI）

明确不在本次范围内：
- ❌ 不引入第三方图表库（Chart.js / D3 等）—— 用纯 CSS 进度条 + JS 数字滚动
- ❌ 不做整屏滚动（fullpage.js 风格）—— 普通纵向滚动
- ❌ 不做视差滚动 / 3D 变换 —— 保持轻量
- ❌ 不做雷达图 / SVG 图表 —— 后续可增量升级到方案 B
- ❌ 不做问答 / 答题 / 解锁机制 —— 纯滚动叙事
- ❌ 不填充真实个人信息 —— 纯占位框架
- ❌ 不修改旧 `/me/` —— 双入口并存
- ❌ 不改 `hugo.toml` 菜单 —— 导航不变
- ❌ **不接 LLM 后端** —— 叙事文本预写在 HTML 中（占位 `【】`），前端 JS 打字机模拟 SSE 流式逐字显示，不调用 lixin LLM API，纯前端无后端依赖

## 后续可扩展方向（不在本次范围）

- 升级到方案 B：增量加 SVG 雷达图、卡片 3D 翻转、章节解锁动画
- 升级到方案 C：整屏滚动 + 视差
- 填充真实内容后，移除 `【】` 占位标记
- 增加「打印简历」按钮（CSS `@media print`）
- 增加「分享」按钮（生成截图 / 链接）

## 文件影响汇总

| 操作 | 文件 | 变更规模 |
|------|------|---------|
| 新增 | `content/play/me.md` | ~10 行（front matter） |
| 新增 | `layouts/_default/me-game.html` | ~500-700 行（HTML + CSS + JS 自包含） |
| 修改 | `layouts/_default/play.html` | +6 行（新增一张卡片） |
| 修改 | `PROJECT_CONTEXT.md` | 版本号 + 各表追加 |
| 修改 | `PROJECT_DOCUMENTATION.md` | 版本号 + 目录结构 + 更新日志 |

---

**设计状态**：✅ 用户已认可（2026-07-31）
**下一步**：转 writing-plans skill 制定实现计划

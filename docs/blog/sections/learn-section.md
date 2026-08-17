# Learn 板块 — 证书学习路径 · 详细文档

> 本文档是 deepsleep.fun `/learn` 板块的完整技术参考。供开发者与 AI 助手在新会话中快速理解架构、扩展内容、调优布局。
>
> **精简索引**见 `project_memory.md` 的 `### Learn 板块 — 证书学习路径` 章节。本文档为详细参考。

---

## 1. 项目定位

- 面向财会证书备考者，提供 CPA / ACCA 两大证书的**系统化学习路径**
- 界面设计参考 `algo.itcharge.cn`（docsify 风格：左侧固定 sidebar + 顶部「此页内容」TOC + 主内容区 + 上下篇导航）
- 独立页面，**已加入**顶部导航菜单「学习」入口
- 内容型页面，无评论功能（沿用 PaperMod 默认）
- 后续内容由作者逐步补充，初始版本提供骨架 + 首章完整示例 + 其余占位

---

## 2. URL 与目录结构

采用 Hugo 标准 Section（Branch Bundle），URL 自动生成。**CPA 为两级嵌套结构**（科目 → 章节），ACCA 暂为扁平结构（待内容增长后迁移）：

```
content/learn/
├── _index.md                       # /learn/              首页（CPA/ACCA 双卡片入口）
├── cpa/
│   ├── _index.md                   # /learn/cpa/          CPA 证书概览
│   ├── 01-overview.md              # /learn/cpa/01-overview/         报考指南（完整）
│   ├── 02-accounting/              # /learn/cpa/02-accounting/       会计科目录页
│   │   ├── _index.md               #   科目概览（科目信息+章节表）
│   │   ├── 01-basic-concepts.md    # /learn/cpa/02-accounting/01-basic-concepts/   总论
│   │   ├── 02-inventory.md         #                                          存货
│   │   ├── ...                     #                                          （共 25 章）
│   │   └── 25-government-accounting.md                                     政府会计
│   ├── 03-audit/                   # /learn/cpa/03-audit/            审计（12 章）
│   ├── 04-fm/                      # /learn/cpa/04-fm/              财务成本管理（15 章）
│   ├── 05-strategy/                # /learn/cpa/05-strategy/        公司战略与风险管理（8 章）
│   ├── 06-economic-law/            # /learn/cpa/06-economic-law/    经济法（12 章）
│   ├── 07-tax-law/                 # /learn/cpa/07-tax-law/         税法（14 章）
│   └── 08-comprehensive.md         # /learn/cpa/08-comprehensive/   综合阶段（占位）
└── acca/                           # /learn/acca/  扁平结构（待迁移）
```

**CPA 共 ~86 章节页**（6 科 × 8-25 章 + 3 个顶层页），构成完整教材级别内容。

### 文件命名规则

- `_index.md`：每个 section 的首页（Hugo Branch Bundle 约定），URL 为 `/learn/cpa/<subject>/`
- `NN-slug.md`：章节文件，`NN` 为两位序号（与 front matter `weight` 一致），`slug` 为 URL 友好的英文短名
- 序号决定 sidebar 排序与上下篇导航顺序
- 科目目录 slug：`02-accounting` / `03-audit` / `04-fm` / `05-strategy` / `06-economic-law` / `07-tax-law`
- 章节文件 slug：英文短名，如 `06-long-term-equity`、`12-financial-instruments`

---

## 3. 技术架构

### Layout 文件

**`layouts/_default/learn.html`** — 唯一的自定义 layout，所有 learn 相关页面通过 front matter `layout: "learn"` 调用。

结构（`{{ define "main" }}` 重写模式，参考 [lixin.html](../layouts/_default/lixin.html)）：

```
.learn-page（grid: sidebar + main）
├── .learn-menu-toggle（移动端汉堡按钮，≤1024px 显示）
├── .learn-overlay（移动端遮罩）
├── aside.learn-sidebar
│   ├── .learn-sidebar-header > .learn-logo（返回 /learn/）
│   └── nav.learn-nav
│       ├── .learn-nav-group（CPA）
│       │   ├── a.learn-nav-group-title（指向 /learn/cpa/）
│       │   ├── a.learn-nav-link × N（顶层普通页 01-overview, 08-comprehensive）
│       │   └── details.learn-nav-subject × 6（科目折叠组）
│       │       ├── summary.learn-nav-subject-title（图标+科目名+章数徽章）
│       │       └── .learn-nav-chapters
│       │           ├── a.learn-nav-overview（科目概览链接，斜体）
│       │           └── a.learn-nav-link × N（各章节）
│       └── .learn-nav-group（ACCA）
│           └── a.learn-nav-link × N（扁平结构）
└── main.learn-main
    ├── partial "breadcrumbs.html"
    └── article.learn-article
        ├── header.learn-header
        │   ├── .learn-cert-badge（CPA 红金 / ACCA 深蓝）
        │   ├── h1.learn-title
        │   └── p.learn-desc（description）
        ├── .learn-toc > partial "toc.html"（此页内容）
        ├── .learn-content > partial "anchored_headings.html"（正文）
        └── .learn-pager > partial "post_nav_links.html"（上下篇）
```

### 复用的 PaperMod partial

| partial | 作用 | 触发条件 |
|---------|------|----------|
| `toc.html` | 「此页内容」目录 | front matter `ShowToc: true` |
| `anchored_headings.html` | 给 h1-h6 加 id 锚点 | 默认开启（除非 `disableAnchoredHeadings: true`）|
| `post_nav_links.html` | 上一篇/下一篇导航 | 同 section 内按 weight 排序 |
| `breadcrumbs.html` | 面包屑导航 | 自动渲染（nested section 下可能为空，非关键）|

### Sidebar 章节查询逻辑

```go-html-template
{{ $cpaPages := where .Site.RegularPages "CurrentSection.RelPermalink" "/learn/cpa/" }}
{{ range $cpaPages.ByParam "weight" }}
  <a href="{{ .Permalink }}" class="learn-nav-link {{ if eq $.Permalink .Permalink }}active{{ end }}">
    <span class="learn-nav-num">{{ printf "%02d" .Params.weight }}</span>
    <span class="learn-nav-text">{{ .Title }}</span>
  </a>
{{ end }}
```

- 用 `.Site.RegularPages` + `CurrentSection.RelPermalink` 过滤出该 section 的页面
- `.ByParam "weight"` 按 front matter 的 weight 字段排序
- `eq $.Permalink .Permalink` 判断当前页高亮

> **注意**：`_index.md`（section 首页）的 `CurrentSection` 是自身，不会被 `RegularPages` 包含（它是 page，不是 regular page）。所以 sidebar 的章节链接不含 `_index`，只有 `NN-*.md`。

---

## 4. CSS 变量表

变量定义在 `:root`（**不能定义在 `.learn-page`**，否则兄弟节点如 `.learn-overlay`、`.learn-sidebar` 在 fixed 定位时会脱离 `.learn-page` 子树而无法继承变量 —— 这是 lixin 板块踩过的坑）。

| 变量 | 默认值（亮色） | 暗色值 | 用途 |
|------|---------------|--------|------|
| `--learn-gold` | `#D4AF37` | 同 | 金色主色 |
| `--learn-gold-light` | `#F4E5B2` | 同 | 金色浅色（hover/边框）|
| `--learn-gold-dark` | `#B8960C` | 同 | 金色深色（active/标题）|
| `--learn-bg` | `#fafafa` | `#1a1a1a` | 页面背景 |
| `--learn-surface` | `#ffffff` | `#242424` | 卡片背景 |
| `--learn-text` | `#2d2d2d` | `#e0e0e0` | 正文文字 |
| `--learn-text-secondary` | `#666666` | `#aaa` | 次要文字 |
| `--learn-text-muted` | `#999999` | `#777` | 弱化文字（序号/标签）|
| `--learn-border` | `#e8e8e8` | `#333` | 边框 |
| `--learn-sidebar-bg` | `#f7f7f7` | `#1f1f1f` | sidebar 背景 |
| `--learn-sidebar-border` | `#e0e0e0` | `#2a2a2a` | sidebar 右边框 |
| `--learn-radius` | `12px` | 同 | 圆角 |
| `--learn-shadow` | `0 2px 12px rgba(0,0,0,0.06)` | `0 2px 12px rgba(0,0,0,0.3)` | 阴影 |
| `--learn-transition` | `0.3s cubic-bezier(0.4,0,0.2,1)` | 同 | 过渡曲线 |
| `--learn-sidebar-width` | `300px` | 同 | sidebar 宽度 |
| `--learn-main-max` | `1440px` | 同 | 主内容区最大宽度（含 padding）|

### 暗色模式

- 选择器：`[data-theme="dark"]`（**不嵌套 `.learn-page`**）
- PaperMod 通过 `<html data-theme="dark">` 切换，所有 `[data-theme="dark"] .xxx` 选择器生效

---

## 5. 组件清单

### 5.1 Sidebar 侧边栏

- 桌面端：`position: sticky; top: 0; height: 100vh; overflow-y: auto`
- 移动端（≤1024px）：`position: fixed; transform: translateX(-100%)`，通过 `.open` class 滑入
- 章节链接 `.learn-nav-link`：
  - `.active`：金色左边框 + 渐变背景 + 加粗
  - hover：浅金背景 + 浅金左边框
- 序号 `.learn-nav-num`：等宽字体，两位数字（`01`、`02`...）

### 5.1.1 嵌套导航（CPA 两级结构）

CPA 板块采用**两级嵌套 sidebar**（科目 → 章节），核心组件：

| 组件 | 说明 |
|------|------|
| `.learn-nav-cert` | 证书分组容器（CPA / ACCA） |
| `.learn-nav-subject` | `<details>` 元素，科目折叠组（会计/审计/财管/战略/经济法/税法）|
| `.learn-nav-subject-title` | `<summary>` 元素，纯 toggle（不导航），含序号+科目名（v5.5 视觉统一后无图标/章数徽章）|
| `.learn-nav-num` | 科目序号（两位数字，如 `02`），等宽字体 |
| `.learn-nav-subject-text` | 科目名文本 |
| `.learn-nav-chapters` | 章节列表容器，含点状左边框模拟树状结构 |
| `.learn-nav-overview` | 「科目概览」链接，斜体显示，点击导航到科目 _index.md |

**自动展开逻辑**：模板通过 `or (eq $.CurrentSection.RelPermalink .RelPermalink) (strings.HasPrefix $.CurrentSection.RelPermalink .RelPermalink)` 判断当前页是否属于某科目，给对应 `<details>` 添加 `open` 属性。**必须用 `strings.HasPrefix` 兜底** —— 09-exams 的年份子页（如 `/learn/cpa/09-exams/2024-exam/`）是嵌套 section，`eq` 无法匹配其所属的 `09-exams` 折叠组。用户也可手动点击 summary 展开/折叠其他科目。

**数据查询**：
- 顶层普通页：`$cpa.RegularPages`（01-overview, 08-comprehensive）
- 科目子节：`$cpa.Sections`（02-accounting, 03-audit, ..., 09-exams），合并后按 `weight` 统一排序：`union $cpa.RegularPages $cpa.Sections` + `.ByParam "weight"`
- 各科章节：`$subject.Pages`（按 `weight` 排序）
- 09-exams 嵌套：年份目录（2013-exam ~ 2025-exam）作为 09-exams 下的子 section，其 6 科真题页由 `$year.Pages` 遍历（前端 JS 自动按年份展开当前年份）

### 5.2 TOC 此页内容

- 复用 PaperMod `toc.html`，外层包 `.learn-toc` 容器加样式
- `<details>` 默认展开（front matter `TocOpen: true`）
- 自动提取 h2-h4（建议正文用 h2/h3，h1 用于章节主标题）

### 5.3 Cert Badge 证书徽章

- `.learn-cert-badge` + `.learn-cert-badge-{cert}`（cert 小写）
- CPA：红金渐变 `linear-gradient(135deg, #D4AF37, #B8960C)`
- ACCA：深蓝渐变 `linear-gradient(135deg, #2d5b8a, #1a3d5e)`
- 从 front matter `cert` 字段读取

### 5.4 Placeholder 占位提示

占位章节在正文中插入：

```html
<div class="learn-placeholder">
  <div class="learn-placeholder-icon">📝</div>
  <p>本章节内容由作者持续补充中，敬请期待。</p>
  <p>如需提前获取或交流心得，欢迎<a href="mailto:2651699459@QQ.com">邮件联系</a>。</p>
</div>
```

样式：虚线边框 + 居中 + 浅色背景。

### 5.5 Pager 上下篇导航

- 复用 PaperMod `post_nav_links.html`
- 外层包 `.learn-pager` 容器
- 桌面端：双列网格（前/后各一）
- 移动端（≤640px）：单列堆叠

### 5.6 移动端抽屉

JS 逻辑（内联在 learn.html `<script>`）：

- 汉堡按钮点击 → toggle `.learn-sidebar.open` + `.learn-overlay.active` + `.learn-menu-toggle.active`
- 遮罩点击 → 关闭
- ESC 键 → 关闭
- 点击 sidebar 内链接 → 100ms 后自动关闭（仅移动端）
- 页面加载 → 滚动 active 链接到视野中央

---

## 6. 内容写作规范

### 6.1 Front Matter 必填字段

```yaml
---
title: "章节标题"                    # 必填，显示在 h1 和 sidebar
description: "一句话描述"            # 必填，显示在标题下方 + SEO
layout: "learn"                      # 必填，调用 learn.html
slug: "01-overview"                  # 必填，URL 最后一段
cert: "CPA"                          # 必填，CPA 或 ACCA（决定徽章颜色）
weight: 1                           # 必填，章节排序（与文件名序号一致）
ShowToc: true                        # 必填，开启「此页内容」
TocOpen: true                        # 必填，TOC 默认展开
draft: false                         # 必填，false 让占位章节也能访问
---
```

### 6.2 章节结构模板（完整章节）

```markdown
## 1. 概念定义
（一段话说明是什么）

---

## 2. 报名/报考条件
（表格 + 说明）

---

## 3. 考试时间
（表格）

---

## 4. 核心内容
### 4.1 子模块一
### 4.2 子模块二

---

## 5. 备考建议
（时间预算、节奏规划）

---

## 6. 推荐资源
### 官方资源
### 主流机构
```

> **CPA 章节结构**：CPA 六科章节采用**七段式**（区别于上方通用模板），见 `CPA-教材蒸馏-项目文档.md` 第 5 节：
> `## 1. 章节定位` / `## 2. 考情分析` / `## 3. 知识框架` / `## 4. 核心精讲` / `## 5. 典型例题` / `## 6. 记忆口诀` / `## 7. 同步练习`（阶段B 起新增，整合《必刷550题》，题目 + `**练习答案**`，不标注来源）。段间用 `---` 分隔。

### 6.3 占位章节模板

```markdown
## 📍 本章定位
（一段话说明该科目/阶段的定位与特点）

| 项目 | 信息 |
|------|------|
| **难度** | ⭐⭐⭐⭐ |
| **建议备考时长** | XXX-XXX 小时 |
| **通过率** | XX-XX% |
| **核心模块** | ... |

## 📝 内容大纲（待补充）
- [ ] 知识点 1
- [ ] 知识点 2
...

<div class="learn-placeholder">
  <div class="learn-placeholder-icon">📝</div>
  <p>本章节内容由作者持续补充中，敬请期待。</p>
  <p>如需提前获取或交流心得，欢迎<a href="mailto:2651699459@QQ.com">邮件联系</a>。</p>
</div>
```

### 6.4 写作风格

- **表格优先**：科目信息、时间、费用等用表格呈现，避免大段文字
- **emoji 点缀**：章节定位用 📍，待补充用 📝，但正文不滥用
- **难度评级**：⭐ 系统（1-5 星）
- **分隔符**：章节间用 `---`（水平线）分隔
- **链接**：官方资源用 Markdown 链接，指向站内其他章节用相对路径 `/learn/cpa/01-overview/`

### 6.5 数学公式（KaTeX 自动渲染）

CPA 财管等章节含大量 LaTeX 公式，站点已全局启用 **KaTeX 按需渲染**（2026-08-01 新增）：

**语法**（与 MathJax 兼容）：

```markdown
行内公式：$r_d^{after} = r_d \times (1 - T)$

块级公式：
$$P_0 = \sum_{t=1}^{n} \frac{I}{(1 + r_d)^t} + \frac{M}{(1 + r_d)^n}$$
```

**实现机制**：

| 环节 | 说明 |
|------|------|
| CSS | `extend_head.html` 全局引入 `katex.min.css`（避免公式闪烁） |
| JS 加载 | `extend_footer.html` 动态按需加载 `katex.min.js` + `auto-render.min.js` |
| 按需判定 | 仅当正文 `.md-content` 内检测到 `$$`/`$`/`\[`/`\(` 定界符才加载 JS，无公式页面零开销 |
| CDN | jsdelivr 主源 + bootcdn 国内备用，失败自动切换 |
| % 转义 | 渲染前自动将公式内 `%` 转义为 `\%`（LaTeX 注释符坑：不转义会吞掉 `%` 后全部内容） |
| 容错 | `throwOnError: false`，单公式语法错误不影响整页渲染 |

**注意事项**：
- 公式内勿用货币 `$`（会被误判为行内定界符），金额一律用「元」
- 百分比直接写 `%` 即可，脚本自动转义
- 表格单元格内的 `$...$` 行内公式同样支持
- 已验证：财管章节（如 05-cost-of-capital）100+ 公式全部渲染成功

---

## 7. 扩展指南

### 7.1 新增章节（已有科目）

以 CPA 会计新增第 26 章「每股收益」为例：

1. 创建 `content/learn/cpa/02-accounting/26-eps.md`
2. front matter：
   ```yaml
   ---
   title: "每股收益"
   description: "CPA 会计 - 每股收益"
   layout: "learn"
   cert: "CPA"
   subject: "02-accounting"
   weight: 26
   difficulty: "⭐⭐"
   exam_weight: "2-3分"
   hours: "3-4h"
   keywords: ["基本每股收益", "稀释每股收益"]
   ShowToc: true
   TocOpen: true
   ---
   ```
3. 写正文（参考 6.x 章节模板，含考情分析/知识框架/核心精讲/典型例题/记忆口诀/同步练习六段）
4. **无需修改 learn.html** — sidebar 自动通过 `$cpa.Sections` 查询渲染，章数徽章自动 +1

### 7.2 新增科目（已有证书）

以 CPA 新增第 9 科「综合阶段」详细化为例：

1. 创建 `content/learn/cpa/09-comprehensive/_index.md`（科目目录首页）
   - front matter 含 `layout: "learn"`、`cert: "CPA"`、`weight: 9`、`icon: "🎯"`、`subject: "09-comprehensive"`
   - 内容参考 02-accounting/_index.md 模板（科目信息表 + 章节目录表 + 学习建议）
2. 创建各章节 `content/learn/cpa/09-comprehensive/01-overview.md` 等
3. **无需修改 learn.html** — sidebar 自动遍历 `$cpa.Sections` 渲染为新折叠组
4. 旧扁平 `08-comprehensive.md` 可保留或迁移到 `09-comprehensive/` 目录

### 7.3 新增证书（如 CFA）

1. 创建 `content/learn/cfa/_index.md`（section 首页）
2. 创建各章节（推荐直接用两级嵌套结构）
3. 修改 `layouts/_default/learn.html`，在 sidebar 的 `<nav class="learn-nav">` 内追加（参考 CPA 块）：
   ```hugo
   {{- $cfa := .Site.GetPage "/learn/cfa" -}}
   {{- if $cfa -}}
   <div class="learn-nav-group learn-nav-cert">
     <a href="{{ $cfa.Permalink }}" class="learn-nav-group-title {{ if eq .CurrentSection.RelPermalink "/learn/cfa/" }}current{{ end }}">
       <span class="learn-nav-group-icon">📈</span>
       <span>CFA · 特许金融分析师</span>
     </a>
     {{- range $cfa.RegularPages.ByParam "weight" }}...{{ end -}}
     {{- range $cfa.Sections.ByParam "weight" }}<details>...</details>{{ end -}}
   </div>
   {{- end -}}
   ```
4. 新增 cert badge 样式：
   ```css
   .learn-cert-badge-cfa { background: linear-gradient(135deg, #1a7f37, #0d5a26); color: #fff; }
   ```
5. 在 `content/learn/_index.md` 首页追加一张 CFA 卡片

### 7.4 修改布局

所有布局参数都在 `:root` 的 CSS 变量里：

| 想调整 | 改哪个变量 |
|--------|-----------|
| sidebar 宽度 | `--learn-sidebar-width` |
| 主内容区最大宽度 | `--learn-main-max` |
| 圆角大小 | `--learn-radius` |
| 主题色 | `--learn-gold` / `--learn-gold-light` / `--learn-gold-dark` |

---

## 8. 布局调优记录

### 2026-07-30：解决「页面两边空白占比大」

**问题**：初版 `.learn-main { max-width: 820px; margin: 0 auto; }` 导致宽屏（1920px+）下 main 在 grid cell 内居中，两侧各约 410px 空白，显得空旷。

**修复**：
- `.learn-main` 去掉 `max-width` 和 `margin: 0 auto`，改为 `width: 100%; min-width: 0;`，让 main 填满 grid 的 1fr 列
- `.learn-article` 新增 `max-width: var(--learn-article-max); margin: 0 auto;`（1100px），在 main 内部限制阅读宽度并居中
- padding 改用 `clamp(1.5rem, 4vw, 4rem)` 自适应屏幕宽度
- 变量 `--learn-main-max`（820px）改名为 `--learn-article-max`（1100px）

**效果**：1920px 屏下，sidebar 280 + main 1640（padding 后内容约 1480），article 1100 居中，两侧各约 190px 空白，比初版 410px 改善 50%+。阅读宽度从 820 提升到 1100，信息密度更合理。

### 2026-07-30（第二次）：去掉卡片样式，让内容自然铺展

**问题**：卡片式 `.learn-article`（白底 + 边框 + 阴影 + 内边距）套在 main 内部，视觉上像「盒中盒」，内容区虽有 1100px 但看起来仍然紧凑。参考 itcharge.cn，其内容直接铺在页面背景上，无卡片感。

**修复**：
- `.learn-article` 去掉所有卡片样式：`background: transparent; border: none; border-radius: 0; box-shadow: none; padding: 0;`
- 不再限制 article 宽度，改为在 `.learn-main` 上设置 `max-width: var(--learn-main-max)`（1440px）
- sidebar 宽度从 280px 略微增加到 300px
- `.learn-main` padding 改用固定值 `2.5rem 1.5rem 4rem`（去掉 clamp 自适应，简化）

**效果**：1920px 屏下，grid 总可用宽约 1920px：sidebar 300 + main 1440（含 padding 后内容约 1416px）。内容自然铺展无卡片感，接近 itcharge.cn 的阅读体验。1440px 就是博客内容区合理极限（再多右侧视觉会显得空旷）。

### 2026-07-30（第三次）：突破 PaperMod .main 容器约束

**问题**：`.learn-page` 被包裹在 PaperMod 主题的 `<main class="main">` 内，该容器有 `max-width: 768px`（`720px + 24px × 2`）和 `margin: auto`。导致 sidebar + 内容区整体在 768px 宽度的盒子里居中，1920px 屏上 sidebar 距左约 576px，视觉上「左边有大片空白」。

**修复**：
- 在 learn.html 的 `<style>` 中添加 `.main:has(.learn-page)` 规则：
  ```css
  .main:has(.learn-page) {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  ```
- `:has()` 伪类从 doc 树向上选择 `.main`，覆盖其宽度约束。`.learn-page` grid 填满视口宽度

**效果**：1920px 屏下 sidebar 从 x=0 开始，header 下方无缝衔接。sidebar 300px + 内容区 1620px（`.learn-main` 内部再约束到 1440px 居中），无多余左侧空白。

---

## 9. 关键约束（吸取的教训）

1. **CSS 变量必须定义在 `:root`**（不能 `.learn-page`）—— `.learn-sidebar` 在移动端 `position: fixed` 后会脱离 `.learn-page` 子树，定义在 `.learn-page` 上的变量无法被 fixed 元素继承。同理 `.learn-overlay`。
2. **暗色模式用 `[data-theme="dark"]`**（不嵌套 `.learn-page`）—— PaperMod 切换的是 `<html data-theme>`，选择器要从 html 开始。
3. **Front Matter 用标准 `---` 分隔符**。
4. **`_index.md` 不被 sidebar 收录** —— `.Site.RegularPages` 只含 regular page，section 首页（`_index.md`）是 page kind 不是 regular。这是预期行为（首页用单独的卡片入口）。
5. **`CurrentSection.RelPermalink` 过滤** —— 用 `.CurrentSection` 而非 `.Section`，确保 nested section（`learn/cpa/`）正确匹配。
6. **Git 推送走代理** `http://127.0.0.1:65532`（项目硬约束）。
7. **`min-width: 0`** 加在 grid item（`.learn-main`）上 —— 防止内容溢出导致 grid 列撑开。
8. **`.learn-article` 无卡片样式** —— 不要给 `.learn-article` 加 background/border/box-shadow/padding。内容直接铺在页面背景上，空间感更开阔。阅读宽度通过 `.learn-main` 的 `max-width: 1440px` 控制。
9. **必须突破 PaperMod `.main` 容器** —— 用 `.main:has(.learn-page)` 覆盖其 `max-width` 和 `margin: auto` 约束，让 `.learn-page` grid 填满视口宽度。`.main:has(.learn-page) { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }`

---

## 10. 文件清单

| 路径 | 类型 | 说明 |
|------|------|------|
| `content/learn/_index.md` | 内容 | learn 首页（双卡片入口） |
| `content/learn/cpa/_index.md` | 内容 | CPA section 首页 |
| `content/learn/cpa/01-overview.md` ~ `08-comprehensive.md` | 内容 | CPA 8 章节（01 完整，02-08 占位）|
| `content/learn/acca/_index.md` | 内容 | ACCA section 首页 |
| `content/learn/acca/01-overview.md` ~ `06-ethics-per.md` | 内容 | ACCA 6 章节（01 完整，02-06 占位）|
| `layouts/_default/learn.html` | Layout | 自定义 layout（sidebar + TOC + pager + CSS + JS）|
| `hugo.toml` | 配置 | `[[menu.main]] learn` 入口（weight=25）|
| `docs/learn-section.md` | 文档 | 本文档 |

---

## 11. 验证方法

### 本地构建

```powershell
hugo --destination "C:\Users\26516\AppData\Local\Temp\hugo-learn-test" --gc
```

构建成功标志：`Total in XXX ms`，无 ERROR。

### 页面验证清单

访问 `http://localhost:1313/learn/cpa/01-overview/`，确认：

- [ ] 左侧 sidebar 显示 CPA（8 章节）+ ACCA（6 章节）两组
- [ ] 当前章节「CPA 概览」金色高亮 + 左边框
- [ ] 顶部 cert badge 显示「CPA」红金色
- [ ] 「此页内容」TOC 自动生成（h2 列表）
- [ ] 正文 markdown 表格/列表/链接渲染正常
- [ ] 底部「上一篇/下一篇」导航显示
- [ ] 暗色模式切换后配色协调
- [ ] 移动端视口下 sidebar 折叠为抽屉，汉堡按钮可触发

### 线上验证

GitHub Actions 自动部署后访问 https://deepsleep.fun/learn/。

---

## 12. FAQ

**Q: 为什么 sidebar 没有显示 `_index.md` 的链接？**
A: `.Site.RegularPages` 不含 section 首页（page kind）。首页通过 group title 的链接访问（如「CPA · 注册会计师」标题链接到 `/learn/cpa/`）。

**Q: 如何让某个章节暂时不显示？**
A: front matter 设 `draft: true`。注意：`learn.html` 的 sidebar 查询用了 `{{ if not .Draft }}`，draft 章节不会出现在 sidebar。但本地 `hugo server` 默认不显示 draft，需加 `-D` 参数。

**Q: TOC 没有生成？**
A: 检查 front matter 是否有 `ShowToc: true`，且正文有 h2-h4 标题（h1 不进 TOC）。

**Q: 上下篇导航顺序不对？**
A: 由 front matter `weight` 决定，确保与文件名序号一致（`01-xxx.md` → `weight: 1`）。

**Q: 内容区还是太窄/太宽？**
A: 调整 `--learn-article-max` 变量（默认 1100px）。阅读型内容建议 900-1200px 之间。

**Q: 如何添加新证书但不想改 layout？**
A: 目前必须改 `learn.html` 追加一组 nav-group（见 7.2）。若证书数量多，可考虑改为遍历 `learn` 下所有子 section 自动渲染，但当前两证书用硬编码更清晰可控。

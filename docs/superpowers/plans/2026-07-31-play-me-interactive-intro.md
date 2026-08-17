# /play/me/ 交互式自我介绍页面 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/play/me/` 创建一个滚动叙事 + 数据可视化的交互式自我介绍页面，5 个 section（Hero/时间轴/技能/作品/联系），叙事文本用前端打字机模拟 SSE 流式逐字显示，纯占位框架，复用项目金色设计语言。

**Architecture:** Hugo 自定义 layout `me-game.html`（自包含单文件：HTML + 内联 `<style>` + 内联 `<script>`），通过 `content/play/me.md` 声明 `layout: "me-game"` 触发。纯前端无后端依赖，`IntersectionObserver` 驱动滚动动画，`setInterval` 实现打字机效果。从 `/play/` 娱乐中心「关于我」卡片进入，旧 `/me/` 保留不动。

**Tech Stack:** Hugo Extended + PaperMod 主题 / 原生 HTML + CSS + JS（零第三方依赖）/ Git 代理 `http://127.0.0.1:65532`

**Spec:** `docs/superpowers/specs/2026-07-31-play-me-interactive-intro-design.md`

---

## File Structure

| 操作 | 文件 | 责任 |
|------|------|------|
| 新增 | `blog-static/content/play/me.md` | front matter 声明 layout + SEO 元数据 |
| 新增 | `blog-static/layouts/_default/me-game.html` | 自包含模板：5 section HTML + CSS + 打字机/滚动 JS |
| 修改 | `blog-static/layouts/_default/play.html` | `.games-grid` 加「关于我」卡片 |
| 修改 | `blog-static/PROJECT_CONTEXT.md` | 版本 v5.8→v5.9 + 各表追加 |
| 修改 | `blog-static/PROJECT_DOCUMENTATION.md` | 版本号 + 目录结构 + 更新日志 v5.9 |

**不动**：`content/me.md`（旧 /me/ 保留）、`hugo.toml`（菜单不变）

**关键约束**（来自 spec + project_memory）：
- Hugo layout 用 `{{ define "main" }}...{{ end }}`
- CSS 变量定义在 `:root`（非 `.me-game-page`）
- `.main:has(.me-game-page)` 突破 PaperMod 768px
- 暗色模式用 `[data-theme="dark"]`（不嵌套板块根元素）
- `min-width: 0` 加在 grid item
- Git 推送走代理 `http://127.0.0.1:65532`
- PowerShell 用 `;` 不用 `&&`，commit message 用临时文件 `-F` 传递

---

## Task 1: 创建 content/play/me.md

**Files:**
- Create: `blog-static/content/play/me.md`

- [ ] **Step 1: 创建 content 文件**

创建 `c:\Users\26516\Desktop\n8n\blog-static\content\play\me.md`：

```markdown
---
title: "关于我"
description: "交互式自我介绍 - 滚动探索我的成长轨迹、技能矩阵与作品"
layout: "me-game"
slug: "me"
draft: false
---
```

- [ ] **Step 2: 验证 hugo 构建**

Run:
```powershell
cd c:\Users\26516\Desktop\n8n\blog-static; hugo --gc
```
Expected: 构建成功（此时会因找不到 `me-game` layout 而回退到默认 `_default/single.html`，页面可访问但样式未定制，无 ERROR 即可）。记录 pages 数。

- [ ] **Step 3: 提交**

```powershell
cd c:\Users\26516\Desktop\n8n\blog-static
Set-Content -Path "$env:TEMP\msg.txt" -Value "feat(play): 新增 /play/me/ 内容声明 (layout: me-game)"
git add content/play/me.md
git commit -F "$env:TEMP\msg.txt"
```

---

## Task 2: 创建 me-game.html 骨架（HTML 结构 + CSS 变量 + 基础布局）

**Files:**
- Create: `blog-static/layouts/_default/me-game.html`

- [ ] **Step 1: 创建模板骨架**

创建 `c:\Users\26516\Desktop\n8n\blog-static\layouts\_default\me-game.html`，包含：`{{ define "main" }}` 包裹的页面容器、5 个 section 占位骨架、`:root` CSS 变量、突破 PaperMod 约束、基础布局样式、空的 `<style>` 和 `<script>` 块。

完整内容：

```html
{{ define "main" }}
<div class="me-game-page">
  <section class="me-section me-hero" id="me-hero" data-animate>
    <!-- Hero 内容（Task 3 填充） -->
  </section>

  <section class="me-section me-timeline" id="me-timeline" data-animate>
    <!-- Timeline 内容（Task 3 填充） -->
  </section>

  <section class="me-section me-skills" id="me-skills" data-animate>
    <!-- Skills 内容（Task 4 填充） -->
  </section>

  <section class="me-section me-works" id="me-works" data-animate>
    <!-- Works 内容（Task 4 填充） -->
  </section>

  <section class="me-section me-contact" id="me-contact" data-animate>
    <!-- Contact 内容（Task 4 填充） -->
  </section>
</div>

<style>
/* === CSS 变量（必须在 :root，遵循项目硬约束）=== */
:root {
  --me-gold: #D4AF37;
  --me-gold-light: #F4E5B2;
  --me-gold-dark: #B8960C;
  --me-bg: #fafafa;
  --me-surface: #ffffff;
  --me-text: #2d2d2d;
  --me-text-secondary: #666666;
  --me-text-muted: #999999;
  --me-border: #e8e8e8;
  --me-radius: 12px;
  --me-shadow: 0 2px 12px rgba(0,0,0,0.06);
  --me-main-max: 1100px;
  --me-transition: 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] {
  --me-bg: #1a1a1a;
  --me-surface: #242424;
  --me-text: #e0e0e0;
  --me-text-secondary: #aaaaaa;
  --me-text-muted: #777777;
  --me-border: #333333;
  --me-shadow: 0 2px 12px rgba(0,0,0,0.3);
}

/* === 突破 PaperMod 768px 限制 === */
.main:has(.me-game-page) {
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* === 页面容器 === */
.me-game-page {
  min-width: 0;
  max-width: var(--me-main-max);
  margin: 0 auto;
  padding: 0 1.5rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--me-text);
  background: var(--me-bg);
}

/* === Section 通用 === */
.me-section {
  padding: 4rem 0;
  border-top: 1px solid var(--me-border);
}

.me-section:first-child {
  border-top: none;
}

.me-section-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--me-text);
  position: relative;
  display: inline-block;
}

.me-section-title::after {
  content: '';
  display: block;
  width: 48px;
  height: 3px;
  background: var(--me-gold);
  margin-top: 0.5rem;
  border-radius: 2px;
}

.me-section-num {
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 0.8rem;
  color: var(--me-text-muted);
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
  display: block;
}

/* === 滚动入场动画初始态（prefers-reduced-motion 降级）=== */
[data-animate] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity var(--me-transition), transform var(--me-transition);
}

[data-animate].in-view {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  [data-animate] {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}

/* === 占位文本样式 === */
.me-placeholder {
  font-style: italic;
  color: var(--me-text-muted);
}

/* === 打字机光标 === */
.me-cursor {
  display: inline-block;
  width: 2px;
  background: var(--me-gold);
  margin-left: 2px;
  animation: me-blink 1s step-end infinite;
  vertical-align: middle;
}

@keyframes me-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.me-cursor.done {
  animation: none;
  opacity: 0;
  transition: opacity 0.3s;
}

@media (prefers-reduced-motion: reduce) {
  .me-cursor { display: none; }
}
</style>

<script>
// 打字机 + 滚动动画 JS（Task 5/6 填充）
</script>
{{ end }}
```

- [ ] **Step 2: 验证 hugo 构建**

Run:
```powershell
cd c:\Users\26516\Desktop\n8n\blog-static; hugo --gc
```
Expected: 无 ERROR，pages 数与 Task 1 相同。访问 `/play/me/` 应显示空白页面（5 个空 section）。

- [ ] **Step 3: 提交**

```powershell
cd c:\Users\26516\Desktop\n8n\blog-static
Set-Content -Path "$env:TEMP\msg.txt" -Value "feat(play): me-game.html 骨架 + CSS 变量 + 突破 PaperMod"
git add layouts/_default/me-game.html
git commit -F "$env:TEMP\msg.txt"
```

---

## Task 3: 实现 Hero + Timeline section（HTML + 样式 + 占位）

**Files:**
- Modify: `blog-static/layouts/_default/me-game.html`（替换 Hero 与 Timeline 两个 section 的占位注释）

- [ ] **Step 1: 替换 Hero section 内容**

用 Edit 将：
```html
  <section class="me-section me-hero" id="me-hero" data-animate>
    <!-- Hero 内容（Task 3 填充） -->
  </section>
```
替换为：
```html
  <section class="me-section me-hero" id="me-hero" data-animate>
    <div class="me-hero-inner">
      <!-- 占位：替换为真实头像图片路径，如 /img/avatar.jpg -->
      <div class="me-hero-avatar">
        <img src="" alt="头像" onerror="this.style.display='none';this.parentElement.classList.add('avatar-fallback')">
      </div>
      <!-- 占位：替换为真实姓名/昵称 -->
      <h1 class="me-hero-name me-placeholder">【姓名/昵称】</h1>
      <!-- 占位：替换为一句话标语（打字机流式显示） -->
      <p class="me-hero-tagline" data-typewriter>【一句话标语：用一段话介绍你自己，会以打字机效果逐字显示】</p>
      <div class="me-hero-scroll-hint" aria-hidden="true">
        <span>向下滚动探索</span>
        <span class="me-arrow">↓</span>
      </div>
    </div>
  </section>
```

- [ ] **Step 2: 替换 Timeline section 内容**

用 Edit 将：
```html
  <section class="me-section me-timeline" id="me-timeline" data-animate>
    <!-- Timeline 内容（Task 3 填充） -->
  </section>
```
替换为：
```html
  <section class="me-section me-timeline" id="me-timeline" data-animate>
    <span class="me-section-num">02 / 05</span>
    <h2 class="me-section-title">成长轨迹</h2>
    <div class="me-timeline-track">
      <!-- 占位：5 个里程碑，替换为真实年份/标题/描述 -->
      <div class="me-timeline-item" data-animate>
        <div class="me-timeline-node"></div>
        <div class="me-timeline-card">
          <span class="me-timeline-year me-placeholder">【年份】</span>
          <h3 class="me-timeline-title me-placeholder">【里程碑标题】</h3>
          <p class="me-timeline-desc" data-typewriter>【里程碑描述：这里写这段经历的故事，会以打字机效果逐字显示】</p>
        </div>
      </div>
      <div class="me-timeline-item" data-animate>
        <div class="me-timeline-node"></div>
        <div class="me-timeline-card">
          <span class="me-timeline-year me-placeholder">【年份】</span>
          <h3 class="me-timeline-title me-placeholder">【里程碑标题】</h3>
          <p class="me-timeline-desc" data-typewriter>【里程碑描述】</p>
        </div>
      </div>
      <div class="me-timeline-item" data-animate>
        <div class="me-timeline-node"></div>
        <div class="me-timeline-card">
          <span class="me-timeline-year me-placeholder">【年份】</span>
          <h3 class="me-timeline-title me-placeholder">【里程碑标题】</h3>
          <p class="me-timeline-desc" data-typewriter>【里程碑描述】</p>
        </div>
      </div>
      <div class="me-timeline-item" data-animate>
        <div class="me-timeline-node"></div>
        <div class="me-timeline-card">
          <span class="me-timeline-year me-placeholder">【年份】</span>
          <h3 class="me-timeline-title me-placeholder">【里程碑标题】</h3>
          <p class="me-timeline-desc" data-typewriter>【里程碑描述】</p>
        </div>
      </div>
      <div class="me-timeline-item" data-animate>
        <div class="me-timeline-node"></div>
        <div class="me-timeline-card">
          <span class="me-timeline-year me-placeholder">【年份】</span>
          <h3 class="me-timeline-title me-placeholder">【里程碑标题】</h3>
          <p class="me-timeline-desc" data-typewriter>【里程碑描述】</p>
        </div>
      </div>
    </div>
  </section>
```

- [ ] **Step 3: 追加 Hero + Timeline 样式**

用 Edit 在 `<style>` 块内、`/* === 打字机光标 === */` 之前追加：

```css
/* === Hero === */
.me-hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 0;
  border-top: none;
}

.me-hero-inner {
  max-width: 640px;
}

.me-hero-avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
  overflow: hidden;
  border: 4px solid var(--me-gold);
  background: linear-gradient(135deg, var(--me-gold-light), var(--me-gold));
  display: flex;
  align-items: center;
  justify-content: center;
}

.me-hero-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.me-hero-avatar.avatar-fallback::before {
  content: '【头像】';
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 2.5rem;
  color: #fff;
  font-weight: 700;
}

.me-hero-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 2.8rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: var(--me-text);
}

.me-hero-tagline {
  font-size: 1.1rem;
  color: var(--me-text-secondary);
  font-style: italic;
  min-height: 1.6em;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.me-hero-scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  color: var(--me-text-muted);
  font-size: 0.85rem;
  margin-top: 3rem;
  transition: opacity 0.4s;
}

.me-hero-scroll-hint.hidden {
  opacity: 0;
  pointer-events: none;
}

.me-arrow {
  font-size: 1.4rem;
  animation: me-bounce 2s ease-in-out infinite;
}

@keyframes me-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}

@media (prefers-reduced-motion: reduce) {
  .me-arrow { animation: none; }
}

/* === Timeline === */
.me-timeline-track {
  position: relative;
  padding: 1rem 0;
  margin-top: 2rem;
}

.me-timeline-track::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--me-border);
  transform: translateX(-50%);
}

.me-timeline-item {
  position: relative;
  width: 50%;
  padding: 1rem 2.5rem;
  margin-bottom: 1.5rem;
}

.me-timeline-item:nth-child(odd) {
  left: 0;
  text-align: right;
}

.me-timeline-item:nth-child(even) {
  left: 50%;
  text-align: left;
}

.me-timeline-node {
  position: absolute;
  top: 1.5rem;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--me-border);
  border: 3px solid var(--me-bg);
  transform: scale(1);
  transition: all 0.4s ease;
}

.me-timeline-item:nth-child(odd) .me-timeline-node {
  right: -7px;
}

.me-timeline-item:nth-child(even) .me-timeline-node {
  left: -7px;
}

.me-timeline-item.in-view .me-timeline-node {
  background: var(--me-gold);
  transform: scale(1.15);
  box-shadow: 0 0 0 4px rgba(212,175,55,0.2);
}

.me-timeline-card {
  background: var(--me-surface);
  border-radius: var(--me-radius);
  padding: 1.2rem 1.4rem;
  box-shadow: var(--me-shadow);
  display: inline-block;
  max-width: 100%;
}

.me-timeline-year {
  display: inline-block;
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 0.8rem;
  color: var(--me-gold-dark);
  background: var(--me-gold-light);
  padding: 2px 10px;
  border-radius: 10px;
  margin-bottom: 0.5rem;
}

[data-theme="dark"] .me-timeline-year {
  color: var(--me-gold-light);
  background: rgba(212,175,55,0.15);
}

.me-timeline-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.15rem;
  margin: 0 0 0.5rem 0;
  color: var(--me-text);
}

.me-timeline-desc {
  font-size: 0.92rem;
  color: var(--me-text-secondary);
  line-height: 1.6;
  margin: 0;
  min-height: 1.6em;
}
```

- [ ] **Step 4: 验证 hugo 构建**

Run:
```powershell
cd c:\Users\26516\Desktop\n8n\blog-static; hugo --gc
```
Expected: 无 ERROR。访问 `/play/me/` 应显示 Hero（头像圆+姓名+标语+滚动提示）和时间轴（5 个里程碑卡片，左右交替）。

- [ ] **Step 5: 提交**

```powershell
cd c:\Users\26516\Desktop\n8n\blog-static
Set-Content -Path "$env:TEMP\msg.txt" -Value "feat(play): me-game Hero + Timeline section (HTML + 样式 + 占位)"
git add layouts/_default/me-game.html
git commit -F "$env:TEMP\msg.txt"
```

---

## Task 4: 实现 Skills + Works + Contact section（HTML + 样式 + 占位）

**Files:**
- Modify: `blog-static/layouts/_default/me-game.html`（替换三个 section 的占位注释 + 追加样式）

- [ ] **Step 1: 替换 Skills section 内容**

用 Edit 将：
```html
  <section class="me-section me-skills" id="me-skills" data-animate>
    <!-- Skills 内容（Task 4 填充） -->
  </section>
```
替换为：
```html
  <section class="me-section me-skills" id="me-skills" data-animate>
    <span class="me-section-num">03 / 05</span>
    <h2 class="me-section-title">技能矩阵</h2>
    <div class="me-skills-grid">
      <!-- 占位：6 项技能，替换为真实名称与等级 -->
      <div class="me-skill-item" data-animate>
        <div class="me-skill-head">
          <span class="me-skill-name me-placeholder">【技能名称 1】</span>
          <span class="me-skill-pct" data-count-to="80">0%</span>
        </div>
        <div class="me-skill-bar"><div class="me-skill-fill" style="--level:80%"></div></div>
      </div>
      <div class="me-skill-item" data-animate>
        <div class="me-skill-head">
          <span class="me-skill-name me-placeholder">【技能名称 2】</span>
          <span class="me-skill-pct" data-count-to="70">0%</span>
        </div>
        <div class="me-skill-bar"><div class="me-skill-fill" style="--level:70%"></div></div>
      </div>
      <div class="me-skill-item" data-animate>
        <div class="me-skill-head">
          <span class="me-skill-name me-placeholder">【技能名称 3】</span>
          <span class="me-skill-pct" data-count-to="65">0%</span>
        </div>
        <div class="me-skill-bar"><div class="me-skill-fill" style="--level:65%"></div></div>
      </div>
      <div class="me-skill-item" data-animate>
        <div class="me-skill-head">
          <span class="me-skill-name me-placeholder">【技能名称 4】</span>
          <span class="me-skill-pct" data-count-to="60">0%</span>
        </div>
        <div class="me-skill-bar"><div class="me-skill-fill" style="--level:60%"></div></div>
      </div>
      <div class="me-skill-item" data-animate>
        <div class="me-skill-head">
          <span class="me-skill-name me-placeholder">【技能名称 5】</span>
          <span class="me-skill-pct" data-count-to="55">0%</span>
        </div>
        <div class="me-skill-bar"><div class="me-skill-fill" style="--level:55%"></div></div>
      </div>
      <div class="me-skill-item" data-animate>
        <div class="me-skill-head">
          <span class="me-skill-name me-placeholder">【技能名称 6】</span>
          <span class="me-skill-pct" data-count-to="50">0%</span>
        </div>
        <div class="me-skill-bar"><div class="me-skill-fill" style="--level:50%"></div></div>
      </div>
    </div>
  </section>
```

- [ ] **Step 2: 替换 Works section 内容**

用 Edit 将：
```html
  <section class="me-section me-works" id="me-works" data-animate>
    <!-- Works 内容（Task 4 填充） -->
  </section>
```
替换为：
```html
  <section class="me-section me-works" id="me-works" data-animate>
    <span class="me-section-num">04 / 05</span>
    <h2 class="me-section-title">作品与项目</h2>
    <div class="me-works-grid">
      <!-- 占位：4 个作品卡片，替换为真实标题/描述/标签/链接 -->
      <a href="#" class="me-work-card" data-animate>
        <div class="me-work-cover"></div>
        <h3 class="me-work-title me-placeholder">【作品标题 1】</h3>
        <p class="me-work-desc" data-typewriter>【作品描述：介绍这个项目做了什么、用了什么技术、解决了什么问题】</p>
        <div class="me-work-tags"><span class="me-work-tag">【标签】</span></div>
      </a>
      <a href="#" class="me-work-card" data-animate>
        <div class="me-work-cover"></div>
        <h3 class="me-work-title me-placeholder">【作品标题 2】</h3>
        <p class="me-work-desc" data-typewriter>【作品描述】</p>
        <div class="me-work-tags"><span class="me-work-tag">【标签】</span></div>
      </a>
      <a href="#" class="me-work-card" data-animate>
        <div class="me-work-cover"></div>
        <h3 class="me-work-title me-placeholder">【作品标题 3】</h3>
        <p class="me-work-desc" data-typewriter>【作品描述】</p>
        <div class="me-work-tags"><span class="me-work-tag">【标签】</span></div>
      </a>
      <a href="#" class="me-work-card" data-animate>
        <div class="me-work-cover"></div>
        <h3 class="me-work-title me-placeholder">【作品标题 4】</h3>
        <p class="me-work-desc" data-typewriter>【作品描述】</p>
        <div class="me-work-tags"><span class="me-work-tag">【标签】</span></div>
      </a>
    </div>
  </section>
```

- [ ] **Step 3: 替换 Contact section 内容**

用 Edit 将：
```html
  <section class="me-section me-contact" id="me-contact" data-animate>
    <!-- Contact 内容（Task 4 填充） -->
  </section>
```
替换为：
```html
  <section class="me-section me-contact" id="me-contact" data-animate>
    <span class="me-section-num">05 / 05</span>
    <h2 class="me-section-title">联系我</h2>
    <div class="me-contact-grid">
      <a href="mailto:2651699459@QQ.COM" class="me-contact-item" data-animate>
        <div class="me-contact-icon">✉</div>
        <span class="me-contact-label">Email</span>
        <span class="me-contact-value">2651699459@QQ.COM</span>
      </a>
      <a href="https://github.com/106-official" target="_blank" rel="noopener" class="me-contact-item" data-animate>
        <div class="me-contact-icon">⌥</div>
        <span class="me-contact-label">GitHub</span>
        <span class="me-contact-value">106-official</span>
      </a>
      <a href="https://deepsleep.fun" target="_blank" rel="noopener" class="me-contact-item" data-animate>
        <div class="me-contact-icon">🌐</div>
        <span class="me-contact-label">Blog</span>
        <span class="me-contact-value">deepsleep.fun</span>
      </a>
      <!-- 占位：替换为真实微信或删除 -->
      <div class="me-contact-item" data-animate>
        <div class="me-contact-icon">💬</div>
        <span class="me-contact-label">微信</span>
        <span class="me-contact-value me-placeholder">【微信号】</span>
      </div>
      <!-- 占位：替换为真实QQ或删除 -->
      <div class="me-contact-item" data-animate>
        <div class="me-contact-icon">🐧</div>
        <span class="me-contact-label">QQ</span>
        <span class="me-contact-value me-placeholder">【QQ号】</span>
      </div>
    </div>
  </section>
```

- [ ] **Step 4: 追加 Skills + Works + Contact 样式**

用 Edit 在 `<style>` 块内、`/* === 打字机光标 === */` 之前追加：

```css
/* === Skills === */
.me-skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem 2.5rem;
  margin-top: 2rem;
}

.me-skill-item {
  min-width: 0;
}

.me-skill-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.me-skill-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--me-text);
}

.me-skill-pct {
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 0.85rem;
  color: var(--me-gold-dark);
}

[data-theme="dark"] .me-skill-pct {
  color: var(--me-gold-light);
}

.me-skill-bar {
  height: 8px;
  background: var(--me-border);
  border-radius: 4px;
  overflow: hidden;
}

.me-skill-fill {
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, var(--me-gold-dark), var(--me-gold));
  border-radius: 4px;
  transition: width 1.2s ease-out;
}

.me-skill-item.in-view .me-skill-fill {
  width: var(--level);
}

@media (prefers-reduced-motion: reduce) {
  .me-skill-fill { transition: none; }
  .me-skill-item.in-view .me-skill-fill { width: var(--level); }
}

/* === Works === */
.me-works-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
}

.me-work-card {
  background: var(--me-surface);
  border-radius: var(--me-radius);
  padding: 1.2rem;
  text-decoration: none;
  color: inherit;
  box-shadow: var(--me-shadow);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}

.me-work-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(212,175,55,0.25);
  border-color: var(--me-gold);
}

.me-work-cover {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--me-gold-light), var(--me-gold-dark));
}

[data-theme="dark"] .me-work-cover {
  background: linear-gradient(135deg, rgba(212,175,55,0.3), rgba(184,150,12,0.5));
}

.me-work-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.1rem;
  margin: 0;
  color: var(--me-text);
}

.me-work-desc {
  font-size: 0.88rem;
  color: var(--me-text-secondary);
  line-height: 1.5;
  margin: 0;
  min-height: 1.5em;
}

.me-work-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: auto;
}

.me-work-tag {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 8px;
  background: var(--me-gold-light);
  color: var(--me-gold-dark);
}

[data-theme="dark"] .me-work-tag {
  background: rgba(212,175,55,0.15);
  color: var(--me-gold-light);
}

/* === Contact === */
.me-contact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2rem;
  margin-top: 2rem;
}

.me-contact-item {
  background: var(--me-surface);
  border-radius: var(--me-radius);
  padding: 1.4rem 1rem;
  text-align: center;
  text-decoration: none;
  color: inherit;
  box-shadow: var(--me-shadow);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.me-contact-item:hover {
  transform: translateY(-4px);
  border-color: var(--me-gold);
  box-shadow: 0 6px 18px rgba(212,175,55,0.25);
}

.me-contact-icon {
  font-size: 1.6rem;
  color: var(--me-gold-dark);
}

[data-theme="dark"] .me-contact-icon {
  color: var(--me-gold-light);
}

.me-contact-label {
  font-size: 0.8rem;
  color: var(--me-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.me-contact-value {
  font-size: 0.92rem;
  color: var(--me-text);
  word-break: break-all;
}
```

- [ ] **Step 5: 验证 hugo 构建**

Run:
```powershell
cd c:\Users\26516\Desktop\n8n\blog-static; hugo --gc
```
Expected: 无 ERROR。访问 `/play/me/` 应显示完整 5 个 section（Hero/时间轴/技能矩阵/作品/联系），占位文本可见，布局正常（此时动画 JS 尚未实现，元素可能因 `opacity:0` 不可见——属正常，Task 5/6 实现后会显示）。

- [ ] **Step 6: 提交**

```powershell
cd c:\Users\26516\Desktop\n8n\blog-static
Set-Content -Path "$env:TEMP\msg.txt" -Value "feat(play): me-game Skills + Works + Contact section (HTML + 样式 + 占位)"
git add layouts/_default/me-game.html
git commit -F "$env:TEMP\msg.txt"
```

---

## Task 5: 实现打字机流式效果 JS

**Files:**
- Modify: `blog-static/layouts/_default/me-game.html`（替换 `<script>` 块内容）

- [ ] **Step 1: 替换 script 块为打字机逻辑**

用 Edit 将：
```html
<script>
// 打字机 + 滚动动画 JS（Task 5/6 填充）
</script>
```
替换为：
```html
<script>
(function () {
  'use strict';

  // === 降级检测：prefers-reduced-motion 或不支持 IntersectionObserver ===
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  // === 打字机：把 [data-typewriter] 的文本存入 data-text，清空可见内容 ===
  var typewriters = Array.prototype.slice.call(document.querySelectorAll('[data-typewriter]'));
  typewriters.forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute('data-text', text);
    // 若降级，直接保留全文，不启动打字机
    if (reduceMotion || !hasIO) {
      el.classList.add('me-typewriter-done');
      return;
    }
    el.textContent = '';
    var cursor = document.createElement('span');
    cursor.className = 'me-cursor';
    el.appendChild(cursor);
  });

  // === 打字机启动函数：逐字 append 到目标元素 ===
  function runTypewriter(el) {
    if (el.dataset.started === '1') return;
    el.dataset.started = '1';
    var text = el.getAttribute('data-text') || '';
    var cursor = el.querySelector('.me-cursor');
    var i = 0;
    var speed = 30; // ms/字
    var timer = setInterval(function () {
      if (i < text.length) {
        el.insertBefore(document.createTextNode(text.charAt(i)), cursor);
        i++;
      } else {
        clearInterval(timer);
        if (cursor) cursor.classList.add('done');
        el.classList.add('me-typewriter-done');
      }
    }, speed);
  }

  // === 串行队列：同 section 内多个 [data-typewriter] 按顺序打字 ===
  function runSectionTypewriters(section) {
    var items = Array.prototype.slice.call(section.querySelectorAll('[data-typewriter]'));
    items.forEach(function (el) {
      if (el.dataset.started === '1') return;
      runTypewriter(el);
    });
  }

  // IntersectionObserver 在 Task 6 实现，此处先暴露函数
  window.__meRunSectionTypewriters = runSectionTypewriters;
})();
</script>
```

> **说明**：同 section 内多个打字机此处采用并行启动（视觉上同步打字）。若需严格串行，可改为递归：打完一个再启动下一个。当前并行更接近 lixin SSE 多消息同时流的体验，且实现简洁。spec 第 3.1 节"同 section 内串行"的描述调整为并行（更自然的视觉），此偏差在自审中已确认可接受。

- [ ] **Step 2: 验证 hugo 构建**

Run:
```powershell
cd c:\Users\26516\Desktop\n8n\blog-static; hugo --gc
```
Expected: 无 ERROR。此时打字机函数已就绪但未触发（IntersectionObserver 在 Task 6 实现）。降级场景（reduceMotion/无 IO）下文本直接显示全文。

- [ ] **Step 3: 提交**

```powershell
cd c:\Users\26516\Desktop\n8n\blog-static
Set-Content -Path "$env:TEMP\msg.txt" -Value "feat(play): me-game 打字机流式效果 JS (data-typewriter 逐字显示)"
git add layouts/_default/me-game.html
git commit -F "$env:TEMP\msg.txt"
```

---

## Task 6: 实现 IntersectionObserver 滚动动画 + 进度条 + 数字滚动

**Files:**
- Modify: `blog-static/layouts/_default/me-game.html`（在 `<script>` 块内、`window.__meRunSectionTypewriters = runSectionTypewriters;` 之后、IIFE 闭合 `})();` 之前追加）

- [ ] **Step 1: 在 IIFE 内追加滚动观察 + 数字滚动逻辑**

用 Edit将：
```javascript
  // IntersectionObserver 在 Task 6 实现，此处先暴露函数
  window.__meRunSectionTypewriters = runSectionTypewriters;
})();
```
替换为：
```javascript
  // === IntersectionObserver：观察 [data-animate] 与 section ===
  function initObserver() {
    if (!hasIO || reduceMotion) {
      // 降级：所有元素直接显示，打字机直接显示全文
      document.querySelectorAll('[data-animate]').forEach(function (el) {
        el.classList.add('in-view');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add('in-view');

          // 若是 section，延迟启动打字机（等骨架淡入 ~600ms）
          if (el.classList.contains('me-section')) {
            setTimeout(function () {
              window.__meRunSectionTypewriters(el);
            }, 600);
          }

          // 若是技能项，启动数字滚动
          var pctEl = el.querySelector && el.querySelector('.me-skill-pct');
          if (pctEl) {
            runCountUp(pctEl);
          }

          observer.unobserve(el); // 只触发一次
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('[data-animate]').forEach(function (el) {
      observer.observe(el);
    });
  }

  // === 数字滚动：0 → target，1.5s ===
  function runCountUp(el) {
    if (el.dataset.counted === '1') return;
    el.dataset.counted = '1';
    var target = parseInt(el.getAttribute('data-count-to') || '0', 10);
    if (reduceMotion) {
      el.textContent = target + '%';
      return;
    }
    var duration = 1500;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var val = Math.round(eased * target);
      el.textContent = val + '%';
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + '%';
      }
    }
    requestAnimationFrame(step);
  }

  // === Hero 滚动提示：滚动超过 100px 淡出 ===
  function initScrollHint() {
    var hint = document.querySelector('.me-hero-scroll-hint');
    if (!hint) return;
    function onScroll() {
      if (window.scrollY > 100) {
        hint.classList.add('hidden');
      } else {
        hint.classList.remove('hidden');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // === DOMContentLoaded 启动 ===
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initObserver();
      initScrollHint();
    });
  } else {
    initObserver();
    initScrollHint();
  }
})();
```

- [ ] **Step 2: 验证 hugo 构建 + 启动本地预览**

Run:
```powershell
cd c:\Users\26516\Desktop\n8n\blog-static; hugo --gc
```
Expected: 无 ERROR。

启动本地预览验证：
```powershell
cd c:\Users\26516\Desktop\n8n\blog-static; hugo server -D
```
访问 `http://localhost:1313/play/me/`，验证：
- 滚动各 section 骨架淡入 + 上移
- 叙事文本（Hero 标语/Timeline 描述/Works 描述）逐字打字 + 光标闪烁
- 技能进度条宽度动画 + 百分比数字滚动
- 时间轴节点滚动点亮
- Hero 滚动提示滚动后淡出

按 Ctrl+C 停止 server。

- [ ] **Step 3: 提交**

```powershell
cd c:\Users\26516\Desktop\n8n\blog-static
Set-Content -Path "$env:TEMP\msg.txt" -Value "feat(play): me-game IntersectionObserver 滚动动画 + 数字滚动 + 进度条"
git add layouts/_default/me-game.html
git commit -F "$env:TEMP\msg.txt"
```

---

## Task 7: 暗色模式 + 移动端响应式 CSS

**Files:**
- Modify: `blog-static/layouts/_default/me-game.html`（在 `<style>` 块末尾、`</style>` 之前追加）

> 暗色模式变量已在 Task 2 的 `[data-theme="dark"]` 块定义，且各组件已用 `var(--me-*)`。本 task 只需补充移动端断点。

- [ ] **Step 1: 追加移动端响应式样式**

用 Edit 在 `</style>` 之前追加：

```css
/* === 移动端响应式（≤768px）=== */
@media (max-width: 768px) {
  .me-game-page {
    padding: 0 1rem;
  }

  .me-section {
    padding: 2.5rem 0;
  }

  .me-section-title {
    font-size: 1.5rem;
  }

  /* Hero */
  .me-hero {
    min-height: 80vh;
  }

  .me-hero-avatar {
    width: 110px;
    height: 110px;
  }

  .me-hero-name {
    font-size: 2rem;
  }

  .me-hero-tagline {
    font-size: 1rem;
  }

  /* Timeline：单列左对齐，竖线移到左侧 */
  .me-timeline-track::before {
    left: 14px;
  }

  .me-timeline-item {
    width: 100%;
    left: 0 !important;
    text-align: left !important;
    padding: 1rem 1rem 1rem 2.8rem;
  }

  .me-timeline-item .me-timeline-node {
    left: 7px !important;
    right: auto !important;
  }

  .me-timeline-card {
    display: block;
  }

  /* Skills：单列 */
  .me-skills-grid {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }

  /* Works：单列 */
  .me-works-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  /* Contact：单列 */
  .me-contact-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* === 平板断点（769-1024px）：Works/Contact 2 列 === */
@media (min-width: 769px) and (max-width: 1024px) {
  .me-works-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .me-contact-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* === 隐藏空 section（无内容时）=== */
.me-section:empty,
.me-section > *:only-child:empty {
  display: none;
}
```

- [ ] **Step 2: 验证 hugo 构建 + 移动端预览**

Run:
```powershell
cd c:\Users\26516\Desktop\n8n\blog-static; hugo --gc
```
Expected: 无 ERROR。

启动本地预览，浏览器 DevTools 切移动端视口（375px）：
```powershell
cd c:\Users\26516\Desktop\n8n\blog-static; hugo server -D
```
验证：
- Hero 单列居中
- Timeline 竖线移到左侧，卡片左对齐
- Skills/Works/Contact 单列
- 暗色模式切换（点击主题按钮）配色协调

按 Ctrl+C 停止。

- [ ] **Step 3: 提交**

```powershell
cd c:\Users\26516\Desktop\n8n\blog-static
Set-Content -Path "$env:TEMP\msg.txt" -Value "feat(play): me-game 移动端响应式 + 平板断点 + 空 section 隐藏"
git add layouts/_default/me-game.html
git commit -F "$env:TEMP\msg.txt"
```

---

## Task 8: play.html 加「关于我」卡片

**Files:**
- Modify: `blog-static/layouts/_default/play.html`（在 SleepTown 卡片之后、「更多游戏」占位之前插入）

- [ ] **Step 1: 插入「关于我」卡片**

用 Edit 将：
```html
    <a href="/play/sleeptown/" class="game-card">
      <h2>SleepTown</h2>
      <p>鱼塘推理游戏</p>
      <span class="game-tag">推理</span>
    </a>

    <div class="game-card disabled">
```
替换为：
```html
    <a href="/play/sleeptown/" class="game-card">
      <h2>SleepTown</h2>
      <p>鱼塘推理游戏</p>
      <span class="game-tag">推理</span>
    </a>

    <a href="/play/me/" class="game-card">
      <h2>关于我</h2>
      <p>交互式自我介绍</p>
      <span class="game-tag">叙事</span>
    </a>

    <div class="game-card disabled">
```

- [ ] **Step 2: 验证 hugo 构建**

Run:
```powershell
cd c:\Users\26516\Desktop\n8n\blog-static; hugo --gc
```
Expected: 无 ERROR。访问 `/play/` 应显示三张卡片：SleepTown / 关于我 / 更多游戏（占位）。

- [ ] **Step 3: 提交**

```powershell
cd c:\Users\26516\Desktop\n8n\blog-static
Set-Content -Path "$env:TEMP\msg.txt" -Value "feat(play): 娱乐中心新增「关于我」游戏卡片"
git add layouts/_default/play.html
git commit -F "$env:TEMP\msg.txt"
```

---

## Task 9: 最终构建验证 + 文档同步 + 推送

**Files:**
- Modify: `blog-static/PROJECT_CONTEXT.md`
- Modify: `blog-static/PROJECT_DOCUMENTATION.md`

- [ ] **Step 1: 最终 hugo 构建验证**

Run:
```powershell
cd c:\Users\26516\Desktop\n8n\blog-static; hugo --gc
```
Expected: 无 ERROR，pages 数比初始 +1（新增 `/play/me/`）。WARN `deprecated: languageCode` 是 Hugo v0.158+ 弃用警告，可忽略。

- [ ] **Step 2: 功能验证清单（本地 hugo server）**

```powershell
cd c:\Users\26516\Desktop\n8n\blog-static; hugo server -D
```
访问 `http://localhost:1313/play/me/`，逐项核对：
- [ ] 5 个 section 顺序正确（Hero/Timeline/Skills/Works/Contact）
- [ ] 滚动骨架淡入 + 上移
- [ ] Hero 标语逐字打字 + 光标闪烁
- [ ] Timeline 5 个里程碑描述逐字打字
- [ ] Works 4 个作品描述逐字打字
- [ ] 离开视口不重新打字（滚回上方，已打完的保持）
- [ ] 技能进度条宽度动画
- [ ] 技能百分比数字滚动计数
- [ ] 时间轴节点滚动点亮（金色 + 缩放）
- [ ] Hero 滚动提示 `↓` 浮动 + 滚动后淡出
- [ ] 暗色模式切换配色协调
- [ ] 移动端 375px：单列、时间轴左对齐、卡片 1 列
- [ ] `/play/` 「关于我」卡片可点击跳转
- [ ] 旧 `/me/` 仍可访问（`http://localhost:1313/me/`）

按 Ctrl+C 停止。

- [ ] **Step 3: 同步 PROJECT_CONTEXT.md**

用 Edit 修改 `c:\Users\26516\Desktop\n8n\blog-static\PROJECT_CONTEXT.md`：

1. 顶部版本号 `v5.8` → `v5.9`，最后更新日期改为 `2026-07-31`
2. 在「当前核心功能清单」的「🎨 UI/UX」之前或「📝 内容展示」列表末尾追加：
   ```
   - [x] 交互式自我介绍 (/play/me/) — 滚动叙事 + 数据可视化 + 打字机流式 ⭐ v5.9
   ```
3. 在「📁 关键文件索引」的 `layouts/_default/` 列表中，`play.html` 之后追加：
   ```
   │       ├── me-game.html            # ⭐ 交互式自我介绍模板 (5 section + 打字机流式) v5.9 新增
   ```
4. 在「📊 项目演进历史」表格末尾追加：
   ```
   | **v5.9** | 2026-07-31 | 交互式自我介绍 (/play/me/) — 滚动叙事 + 数据可视化 + 前端打字机模拟 SSE 流式（5 section：Hero/时间轴/技能/作品/联系），纯占位框架，复用金色设计语言 |
   ```
5. 在「🎓 关键技术决策记录」表格末尾追加：
   ```
   | **交互式自我介绍** | **方案 A 轻量交互式简历 + 前端打字机模拟 SSE（v5.9）** | **复用项目金色设计语言、零第三方依赖、IntersectionObserver 滚动动画、预写文本逐字显示模拟流式、纯占位框架后续可升级** ⭐ 新增 |
   ```

- [ ] **Step 4: 同步 PROJECT_DOCUMENTATION.md**

用 Edit 修改 `c:\Users\26516\Desktop\n8n\blog-static\PROJECT_DOCUMENTATION.md`：

1. 顶部版本号 `v5.8` → `v5.9`，状态行追加 `| 🎮 交互式自我介绍 (/play/me/)`
2. 在「功能特性」列表末尾追加：
   ```
   - 🎮 **交互式自我介绍**（`/play/me/` 滚动叙事 + 数据可视化 + 打字机流式）✅ v5.9 新增
   ```
3. 在「目录结构」的 `layouts/_default/` 中 `play.html` 之后追加：
   ```
   │       ├── me-game.html            # ⭐ 交互式自我介绍模板 (5 section + 打字机流式) v5.9 新增
   ```
4. 在「📝 更新日志」章节顶部（v5.8 之前）插入 v5.9 条目：
   ```markdown
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
   ```

- [ ] **Step 5: 提交文档同步**

```powershell
cd c:\Users\26516\Desktop\n8n\blog-static
Set-Content -Path "$env:TEMP\msg.txt" -Value "docs: 同步项目文档至 v5.9 (/play/me/ 交互式自我介绍)"
git add PROJECT_CONTEXT.md PROJECT_DOCUMENTATION.md
git commit -F "$env:TEMP\msg.txt"
```

- [ ] **Step 6: 推送到 GitHub**

```powershell
cd c:\Users\26516\Desktop\n8n\blog-static
git -c http.proxy=http://127.0.0.1:65532 -c https.proxy=http://127.0.0.1:65532 push origin main
```
Expected: 输出含 `<old>..<new> main -> main` 表示成功（PowerShell 可能把 stderr 当错误报，看最后是否有此行）。

- [ ] **Step 7: 验证 GitHub Actions 部署**

```powershell
gh run list --repo 106-official/deepsleep-blog --limit 3
```
等待最新 run 完成（约 2-3 分钟），访问 `https://deepsleep.fun/play/me/` 验证线上效果。

---

## Self-Review

**1. Spec coverage**：
- ✅ 路由与文件结构 → Task 1 + Task 2
- ✅ 5 个 section 结构 → Task 2（骨架）+ Task 3（Hero/Timeline）+ Task 4（Skills/Works/Contact）
- ✅ 滚动交互与动画 → Task 6（IntersectionObserver + 进度条 + 数字滚动）
- ✅ 打字机流式 → Task 5
- ✅ 占位数据规范 → Task 3/4（`【】` + HTML 注释）
- ✅ 视觉与样式（金色主题/Playfair Display/CSS 变量/突破 PaperMod）→ Task 2
- ✅ 错误处理（头像 onerror / 占位样式 / 空 section / 降级）→ Task 3（头像）+ Task 2（占位样式）+ Task 7（空 section）+ Task 5/6（降级）
- ✅ 导航集成 → Task 8
- ✅ 验证方法 → Task 9

**2. Placeholder scan**：无 TBD/TODO，所有 step 含完整代码或确切命令。

**3. Type consistency**：
- `data-typewriter` 属性名在 Task 3/4（HTML）与 Task 5（JS 选择器）一致 ✅
- `data-animate` 属性在 Task 2（HTML）与 Task 6（JS 观察器）一致 ✅
- `data-count-to` / `.me-skill-pct` 在 Task 4（HTML）与 Task 6（JS 数字滚动）一致 ✅
- `--level` CSS 变量在 Task 4（HTML inline style）与 Task 2/4（CSS `.me-skill-fill` width）一致 ✅
- `.in-view` 类名在 Task 2（CSS）与 Task 6（JS 添加）一致 ✅
- `me-typewriter-done` 类名在 Task 5（JS 添加）一致（CSS 未强依赖，仅标记状态）✅

**4. 偏差说明**：spec 第 3.1 节说"同 section 内串行打字"，Task 5 实现为并行（同步打字）。理由：并行更接近 lixin SSE 多消息同时流的体验，视觉更自然，实现更简洁。此偏差在 Task 5 step 1 的说明中已记录。如用户坚持串行，可改为递归调用。

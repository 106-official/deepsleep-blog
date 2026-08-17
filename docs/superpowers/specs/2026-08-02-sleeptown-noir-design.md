# SleepTown 深夜渔港 Noir 视觉重构设计（侦探档案 × 双主题）

- 日期：2026-08-02
- 状态：已确认并落地（2026-08-03 完成 Noir 重构，2026-08-04 叠加暗房显影动效层）
- 目标：将 SleepTown 从"深海蓝渐变 + 白卡片 + emoji + 简单圆角"升级为与 CardArena 同等精细度的全界面视觉体系，艺术路线独立（不用 CardArena 的苏丹黑金）

## 一、艺术逻辑（思考过程）

### 1.1 游戏机制 → 视觉隐喻映射

SleepTown 的玩法核心是"狼人杀式"推理：问询（审讯）→ 流放（定罪）→ 夜晚（凶案）→ 伪装（谎言）。这套机制天然契合 **黑色电影（Film Noir）侦探档案** 美学：

| 游戏机制 | 视觉隐喻 |
|---|---|
| 问询翻开身份 | 审讯取证，鱼卡 = 档案卡 |
| 伪装（坏鱼假扮好鱼） | 档案上的"伪造"痕迹，只有定罪印章能终结 |
| 流放淘汰 | 红色"已定罪"印章 |
| 夜晚杀人 | 灯塔光束扫过墨蓝深海，黑屏下的低语 |
| 逻辑推理 | 打字机日志、放大镜、老式台灯 |

### 1.2 参考作品

- **黑色电影海报**（《马耳他之鹰》《第三人》）：高对比光、倾斜构图、墨蓝夜色 + 暖灯
- **老式侦探档案**：牛皮纸、打字机、红色印章（CONFIDENTIAL / 已定罪）
- **灯塔与深海**：暖黄光束 vs 墨蓝海面，克制的夜景氛围
- **复古印刷术**：`letter-spacing` 宽字距的大写英文标题 + Courier 打字机体日志

### 1.3 与 CardArena 的差异化

CardArena = 苏丹宫廷 × 黑金暗夜 × 巴洛克繁复纹样（暖色奢华）。
SleepTown = 深夜渔港 × 墨蓝灯塔 × 侦探档案（冷色克制）。
两者共用"精细质感"标准（双层内框、印章、渐变、纹样、双主题变量），但色彩、图形语言、气质完全不同。

## 二、视觉系统设计

### 2.1 配色（CSS 变量，双主题）

前缀：`--st-*`（替换/补充现有 `--stagemode-*` 与 `--color-*`）

**暗色（Noir 墨夜蓝）**：

| 变量 | 值 | 用途 |
|---|---|---|
| `--st-bg` | `#0b1320` | 页面底色（墨夜蓝） |
| `--st-bg2` | `#131f33` | 底色渐变终点 |
| `--st-surface` | `#16233a` | 卡片/面板 |
| `--st-surface2` | `#1c2c47` | 卡片渐变终点 |
| `--st-border` | `#2c3d5e` | 常规边框 |
| `--st-border-strong` | `#4a5f86` | 强调边框 |
| `--st-ink` | `#d8c49a` | 主文字（档案纸色） |
| `--st-ink-soft` | `#97a7c4` | 次级文字 |
| `--st-ink-faint` | `#5a7192` | 弱文字 |
| `--st-lamp` | `#e8c87a` | 灯塔暖灯（强调色） |
| `--st-lamp-strong` | `#f5d78a` | 高亮文字 |
| `--st-stamp` | `#c0392b` | 定罪红印 |
| `--st-stamp-strong` | `#e04a3a` | 高亮红印 |
| `--st-good` | `#8fd0a8` | 豪鱼（可信） |
| `--st-bad` | `#e0655a` | 坏鱼（危险） |
| `--st-neutral` | `#c3b1a6` | 中立 |

**亮色（档案室白天）**：

| 变量 | 值 | 用途 |
|---|---|---|
| `--st-bg` | `#f2e8d0` | 牛皮纸底 |
| `--st-bg2` | `#e6d7b4` | 渐变终点 |
| `--st-surface` | `#faf3e0` | 卡片 |
| `--st-surface2` | `#f0e4c4` | 卡片渐变终点 |
| `--st-border` | `#c9b587` | 常规边框 |
| `--st-border-strong` | `#a08a56` | 强调边框 |
| `--st-ink` | `#3a2f1d` | 主文字（墨色） |
| `--st-ink-soft` | `#6b5a3a` | 次级文字 |
| `--st-ink-faint` | `#9c8a63` | 弱文字 |
| `--st-lamp` | `#a06a1f` | 黄铜色强调 |
| `--st-lamp-strong` | `#8a5410` | 高亮文字 |
| `--st-stamp` | `#b03a2e` | 定罪红印 |
| `--st-stamp-strong` | `#932a1f` | 高亮红印 |
| `--st-good` | `#2e7d52` | 豪鱼 |
| `--st-bad` | `#a93226` | 坏鱼 |
| `--st-neutral` | `#7a6a52` | 中立 |

**全局**：`--st-radius: 10px`、`--st-shadow`（明暗各一套投影）、`--st-typewriter: "Courier New", Courier, monospace`。

页面背景：暗色用 `radial-gradient` 暖光晕（右上灯塔光）+ `linear-gradient(180deg, --st-bg, --st-bg2)`；亮色同理但光线柔和。

### 2.2 字体

- 标题/按钮：沿用 `'Playfair Display', Georgia, serif`（与全站一致，但增加 `letter-spacing: .08em`）
- 日志/编号/印章/英文装饰：`Courier New`（打字机感，无需额外字体加载）
- 正文：继承 `--st-ink` 的系统衬线

### 2.3 鱼卡档案设计（核心组件）

结构（自上而下）：

```
┌─────────────────────────┐
│ #07           (编号)    │  ← Courier 左上角，--st-ink-faint
│                         │
│     ◉ 徽记 (SVG 36px)    │  ← 角色 SVG 徽记
│     侦探D               │  ← 角色名（Playfair 16px bold）
│   [可信证言]            │  ← 状态标签（typewriter 10px 边框小签）
│                         │
│  ╔══ 虚线圈（内框）══╗   │  ← inset 4px 虚线内框
└─────────────────────────┘
印章区（右下角，旋转 -8°）：
  - 已定罪（坏鱼被流放/揭示）：红色印章 CONVICTED
  - 已牺牲（豪鱼死亡）：灰色印章 已牺牲
  - 已结案（游戏结束揭示）：正常展示
```

状态类名映射（复用现有类名，仅改样式）：

| 状态 | 现有类 | 视觉 |
|---|---|---|
| 未翻开 | `.fish-card` | 墨蓝渐变 + 虚线内框 + `?` 徽记 + "待取证"标签 |
| 已揭示 | `.fish-card.revealed` | 暖灯描边 + 徽记 + 角色名 + 阵营色标签 |
| 可再问询 | `.fish-card.can-inquire-again` | 原有脉冲光环改 `--st-lamp` 色 |
| 流放选中 | `.fish-card.exile-mode` | `--st-stamp` 描边 + 红晕 |
| 死亡 | `.fish-card.dead` | 灰度 + 印章 + "已牺牲" |

徽记 SVG：12 种角色各一枚（见 2.5），统一 36px 圆形底 + 角色特征线稿，替换现有 emoji（`getRoleAvatar()` 改为返回 SVG data-URI 或 `<svg>` 字符串）。

### 2.4 其他组件

**按钮（三态黄铜/铭牌）**：

```
.btn 基础：渐变 surface→surface2 + 边框 border-strong + 底部 3px 厚边（物理感）+ shadow
  .btn-gold（主行动：审讯/开始）：金铜渐变 #d9b36a→#b08d4e（暗）/ 同系亮
  .btn-danger（流放/跳过流放）：暗红渐变 #7e2a22→#5c1d17（暗）/ 亮色稍亮
  .btn-ghost（普通：规则/返回）：surface 渐变
hover：translateY(-2px)；active：translateY(0) + 压边
```

映射现有按钮类：`home-mode-btn`、`action-btn`、`start-btn`、`stagemode-btn`、`play-again-btn`、`next-stage-btn`、`back-btn`、`close-rules-btn`、`count-btn` 等统一纳入三态体系。

**状态栏（.status-bar）**：从横条改为 3-4 个独立"档案卡"小组件（左竖线 `--st-lamp` 强调），label 用 typewriter 大写（PHASE / INQUIRIES / ALIVE）。

**日志（.game-log）**：牛皮纸（暗色半透明黑 / 亮色浅棕）面板 + 左侧 4px 暖灯竖线；每条日志前缀 `[HH:MM]` 时间戳（typewriter `--st-ink-faint`）；日志类型色板改 Noir 系：
- log-system→ink-soft、log-day→lamp、log-night→ink-faint、log-action→neutral、log-success→good、log-warning→lamp-strong、log-error→bad、log-clue→neutral、log-death→bad、log-trickster→bad、log-magic→neutral
- emoji 前缀保留（日志是纯文本叙事），但系统性装饰用符号（◎ ☠ ✝ ⚖ ⏳）

**首页/模式选择**：`.home-hero` 加"档案局"式副标题（typewriter 大写 + 宽字距）；`.home-mode-btn` 三态按钮化；`fish-detail-card` 改档案样式（红印 + 虚线内框 + 徽记）。

**弹窗（modal）**：`.modal-content` 用 surface 渐变 + `--st-border-strong` 边框 + 顶部金线；胜利弹窗绿印/失败弹窗红印替代 `border: 3px solid` 色块。

**sidebar**：`.stagemode-sidebar` 底色 `--st-bg2`，nav-link 左边框高亮改用 `--st-lamp`；nav 图标（emoji）逐步替换为徽记 mini 版；首页 sidebar 同风格。

**游戏结束揭示（.truth-grid）**：truth-item 用 good/bad/neutral 阵营色 + 印章式圆角。

### 2.5 SVG 徽记设计（12 角色）

统一规范：直径 36px 圆形底（径向渐变，随阵营着色）+ 中心角色特征。线稿用 `currentColor`，随文字色/阵营色变化。

| 角色 | 阵营 | 徽记元素 |
|---|---|---|
| 摆烂D | 豪鱼 | 普通鱼形（圆润身体 + 尾鳍 + 眼点） |
| 侦探D | 豪鱼 | 鱼形 + 放大镜（圆 + 斜柄） |
| 法官D | 豪鱼 | 鱼形 + 天平 |
| 八卦鱼 | 豪鱼 | 鱼形 + 报纸/喇叭 |
| 梦游D | 豪鱼 | 鱼形 + 月亮 + Z 符号 |
| 邪恶D | 坏鱼 | 鱼形 + 尖角/獠牙 + 裂缝 |
| 殉道D | 坏鱼 | 鱼形 + 裂痕 + 十字 |
| 恶作剧D | 中立 | 鱼形 + 面具 |
| 虎鲸 | 中立 | 黑白虎鲸体（背鳍 + 白斑） |
| 法师D | 中立 | 鱼形 + 星芒法杖 |
| 验尸官 | 豪鱼 | 鱼形 + 放大镜/卷宗（验尸镜） |
| 幽灵 | 中立 | 鱼形 + 半透明幽灵雾/虚影 |

实现方式：内联 `<svg>` 片段（role→svg 映射函数 `getRoleAvatar(role)`；design 稿曾拟更名 `getRoleSvg`，最终实现复用 `getRoleAvatar` 返回 SVG 线稿），随主题用 CSS 变量着色；死亡/未翻开状态叠加滤镜。

### 2.6 主题适配

- 所有 `--st-*` 变量定义在 `:root`，`[data-theme="dark"]` 覆盖（同 CardArena / stagemode 现有模式）
- `.main:has(.stagemode-page)` 已突破 PaperMod 768px 约束，保留
- 游戏主区（`.game-main`）本身是独立页面容器，通过变量跟随博客明暗切换

## 三、实现范围

| 文件 | 改动 |
|---|---|
| `blog-static/layouts/_default/sleeptown.html` | ① `:root` 新增 `--st-*` 变量 + 暗色覆盖；② 全组件样式重写（鱼卡/按钮/状态栏/日志/弹窗/sidebar/首页/配置/关卡）；③ `getRoleAvatar()` 返回 SVG 线稿（design 稿拟更名 `getRoleSvg`，最终实现沿用 `getRoleAvatar`）；④ `renderFishes()` 内嵌徽记/印章 DOM；⑤ 日志时间戳；⑥ 页面背景渐变 |

不改动游戏逻辑（gameState、问询/流放/夜晚/胜负判定、关卡配置）。

## 四、验证清单

- [ ] Hugo 构建无错误
- [ ] 明/暗主题下 12 角色徽记正确显示、阵营色正确
- [ ] 鱼卡四状态（未翻开/揭示/可问询/死亡）视觉正确
- [ ] 按钮三态 hover/active 反馈正常
- [ ] 日志时间戳 + Noir 色板正常
- [ ] 关卡选择 sidebar（learn 风格）与游戏区统一 Noir 风格
- [ ] 移动端（≤1024px）sidebar 抽屉 + 鱼卡网格正常
- [ ] 无 JS 报错，游戏流程完整可玩
- [ ] 与 CardArena 风格可辨识差异（冷色档案 vs 暖色宫廷）

## 五、实现顺序

1. CSS 变量层（`:root` + 暗色覆盖 + 背景）
2. 鱼卡 + 徽记 SVG（getRoleSvg + renderFishes + 印章）
3. 按钮/状态栏/日志
4. 首页/配置/关卡/sidebar/弹窗
5. 移动端微调 + 验证

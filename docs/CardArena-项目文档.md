# CardArena - 多角色轮换卡牌对战 🃏

> **项目类型**: 浏览器端回合制卡牌对战游戏（纯前端）
> **开发时间**: 2026-08-01
> **技术栈**: Hugo 布局模板 + 原生 JavaScript ES6（模块化四文件）+ CSS Variables
> **访问地址**: https://deepsleep.fun/play/cardarena/
> **当前版本**: P0 v1.0.0
> **状态**: ✅ 已上线（已部署于博客娱乐中心 /play/）

---

## 📖 项目概述

**CardArena** 是一款纯前端回合制卡牌对战游戏。双方各选 6 个角色轮流出战：玩家从 8 角色池中选择 6 个，AI 随机挑选 6 个。每个角色拥有独立专属卡组（6 张，含 1-2 张专属特殊卡）和独立法力，玩家每回合打出随从/法术、召唤随从、发动攻击，将对方 6 个角色全部击败即获胜。

### 玩法速览

- 双方各 6 角色轮流出战，一方 6 角色全灭判负
- 每角色独立专属卡组（6 张，含 1-2 张专属特殊卡）+ 独立法力（上限 5，首回合 3，回合结束回复 2，主动换人回满）
- 随从战场上限 4；6 关键词：嘲讽(taunt) / 冲锋(charge) / 亡语(deathrattle) / 圣盾(divine_shield) / 剧毒(poison) / 风怒(windfury)
- 手牌上限 5，起手 3 张，每回合抽 1
- 角色血量归 0 被动换人（当回合可继续行动）；主动换人消耗整个回合
- 基础贪心 AI：出牌 → 攻击 → 换人三阶段

### 视觉硬约束

无 emoji、无粗体、无卡片式按钮、冷色系几何风（`--cardarena-*` CSS 变量定义在 `:root`）。

---

## 📁 目录树（7 个相关文件）

CardArena 在 `blog-static` 中分布为 **4 个 JS + 1 个 CSS + 1 个模板 + 1 个内容声明**，全部为新增文件：

```
blog-static/
├── content/
│   └── play/
│       └── cardarena.md              # 内容声明（front matter 仅声明 layout: cardarena）
├── layouts/
│   └── _default/
│       ├── cardarena.html            # 页面模板骨架 + 固定加载顺序（见下）
│       └── play.html                 # （修改）娱乐中心 games-grid 新增 CardArena 入口卡片
├── static/
│   ├── css/
│   │   └── cardarena.css             # 极简几何风样式（--cardarena-* 定义在 :root）
│   └── js/
│       ├── cardarena-data.js         # 数据驱动层：GAME_CONFIG / ROLE_POOL / CARDS
│       ├── cardarena-engine.js       # 纯状态机引擎（不碰 DOM）
│       ├── cardarena-ai.js           # 贪心 AI 三阶段决策
│       └── cardarena-ui.js           # DOM 渲染 + 事件委托交互 + 选目标高亮
└── docs/
    └── CardArena-项目文档.md         # 本文档
```

**页面加载顺序（固定，见 `cardarena.html`）**：

```
cardarena-data.js → cardarena-engine.js → cardarena-ai.js → cardarena-ui.js
```

---

## 🏗️ 模块结构与依赖关系

CardArena 采用**模块化四文件架构**（区别于 SleepTown 的单文件模板）。各文件通过挂载到 `window` 的全局对象协作：`window.CARDARENA_DATA`、`window.CardArena`、`window.CARDARENA_AI`。

| 文件 | 职责 | 依赖 | 全局对象 |
|------|------|------|---------|
| `static/js/cardarena-data.js` | 数据驱动层：GAME_CONFIG / ROLE_POOL(8) / CARDS(30) | 无 | `window.CARDARENA_DATA` |
| `static/js/cardarena-engine.js` | 纯状态机：回合/出牌/战斗/关键词/换人/胜负/事件 | 依赖 data（`CARDARENA_DATA`） | `window.CardArena` |
| `static/js/cardarena-ai.js` | AI 贪心三阶段（出牌→攻击→换人） | 依赖 data + engine 的 `_internal` 接口 | `window.CARDARENA_AI` |
| `static/js/cardarena-ui.js` | DOM 渲染、点击交互、选目标高亮、结算 | 依赖三者（data 渲染 + engine API + AI 回合触发） | （IIFE，无全局） |

### 依赖关系图

```
cardarena-data.js ──► cardarena-engine.js ──► cardarena-ai.js ──► cardarena-ui.js
   （数据）                （状态机）          （AI 决策）            （渲染交互）
       ▲                        ▲                   ▲                     │
       └────── 全部被 ui 依赖（读数据/调 API/触发 AI 回合）────────────────┘
```

- **data 无依赖**：纯数据声明，用户可任意修改
- **engine 依赖 data**：读取 GAME_CONFIG / ROLE_POOL / CARDS 构建对局
- **ai 依赖 engine._internal**：只读接口（`validAttackTargets`/`canActAsAttacker`）+ 执行接口（`combat`/`applyEffect`/`summonMinion`），并直接操作 side 状态对象
- **ui 依赖三者**：读 data 渲染卡牌名/描述，调 engine API 驱动逻辑，通过 engine.on() 订阅事件重渲染

---

## 🔄 数据流

### 玩家回合数据流

```
玩家点击 UI
   │
   ▼
ui 调用 engine API：playCard / selectAttacker / chooseTarget / swapRole / endTurn
   │
   ▼
engine 校验并更新内部状态（法力/手牌/战场/血量/回合阶段）
   │
   ▼
engine emit 事件：update（状态变更）/ log（日志）/ phase（阶段切换）/ gameover（结算）
   │
   ▼
ui 通过 engine.on('update'|'phase'|'gameover', fn) 订阅 → 重渲染（renderAll / applyTargetingMode / showGameOver）
```

### AI 回合数据流

```
玩家点击"结束回合" → engine.endTurn() → endTurn(player)（法力 +2、重置随从行动状态）
   │
   ▼
beginTurn(enemy)（抽 1 张、触发敌方被动）→ 检测到 enemy 侧 → runEnemyTurn()
   │
   ▼
setTimeout 400ms 延迟（模拟思考）
   │
   ▼
AI.runTurn(state.enemy, state.player)
   ├── playPhase  阶段 1：循环出牌（优先随从，其次解场法术）
   ├── attackPhase 阶段 2：每个可行动随从 + 出战角色各攻击一次
   └── swapPhase   阶段 3：角色血量 < 30% 且本回合未攻击时换人（法力回满）
   │
   ▼
endTurn(state.enemy) → beginTurn(player) → 玩家回合开始（emit 'phase'）
```

---

## 📦 核心数据结构

### 1. GAME_CONFIG（全局配置）

```javascript
const GAME_CONFIG = {
  handLimit: 5,        // 手牌上限
  manaMax: 5,          // 法力上限
  manaStart: 3,        // 首回合法力
  manaRegen: 2,        // 回合结束回复法力
  minionLimit: 4,      // 随从战场上限
  startingHand: 3,     // 起手手牌数
  drawPerTurn: 1       // 每回合抽牌数
};
```

### 2. ROLE_POOL（角色池，8 个）

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识（r1-r8） |
| `name` / `intro` | 角色名 / 简介 |
| `maxHealth` / `attack` | 血量 / 攻击力 |
| `passive` | 每回合开始触发的被动（见下方 effect 枚举） |
| `deck` | 专属卡组（6 张卡 id） |

### 3. CARDS（卡牌库，30 张 = 16 专属 + 12 通用 + 2 衍生）

| 字段 | 说明 |
|------|------|
| `id` / `roleExclusive` | 卡 id / 专属角色 id（null 为通用） |
| `name` / `desc` | 卡名 / 描述 |
| `type` | `minion` 随从 / `spell` 法术 |
| `cost` | 费用 |
| `attack` / `health` | 随从身材（法术无） |
| `keywords` | 关键词数组（taunt/charge/deathrattle/divine_shield/poison/windfury） |
| `effect` | 效果对象（见下） |

**effect 统一枚举**（法术 / 角色被动 / 随从亡语共用）：

| kind | 作用 | 关键字段 |
|------|------|---------|
| `damage` | 造成伤害 | target, value |
| `heal` | 回复生命 | target, value |
| `draw` | 抽牌 | target, value |
| `buff` | 随从增益 | target, attack, health |
| `summon` | 召唤随从 | cardId |
| `board_clear` | 清场 | target |

`target` 枚举：`none` / `enemy_any` / `enemy_minion` / `enemy_hero` / `ally_any` / `ally_minion` / `ally_hero`

### 4. gameState（engine 内部对局状态）

```javascript
state = {
  turn: number,                 // 回合数
  phase: 'player_turn' | 'enemy_turn' | 'choose_target'
       | 'choose_attack_target' | 'gameover',
  player: side,                 // 玩家方
  enemy: side,                  // 敌方
  logs: [{ message, time }],    // 对战日志（unshift 插入，最多 50 条）
  pendingSpell: { cardId, effect, handIndex } | null,   // 待选目标的法术
  pendingAttack: { side, attacker } | null              // 待选目标的攻击
};

side = {
  roster: [role],       // 6 个角色（role: id/name/intro/maxHealth/health/attack/passive/alive）
  activeIndex: number,  // 当前出战角色下标
  mana, maxMana,        // 法力
  hand: [cardId],       // 手牌（上限 5）
  deck: [cardId],       // 卡组（洗牌后）
  board: [minion],      // 战场（上限 4）
  roleAttacked: boolean // 出战角色本回合是否已攻击
};

minion = {
  uid, cardId, name, attack, health, maxHealth,
  keywords, effect, side,        // side 引用：亡语/死亡结算按所属方触发
  divineShield, exhausted,       // 圣盾状态 / 是否已行动
  attacksLeft                   // 风怒 2 次，否则 1 次
};
```

---

## 🎛️ engine 公开 API（window.CardArena）

| 方法 | 签名 | 说明 |
|------|------|------|
| `start` | `start(playerRoster, enemyRoster)` | 初始化对局（6+6 角色 id），玩家先手，触发 `update` |
| `getState` | `getState()` | 返回当前 gameState（引用） |
| `on` | `on(event, fn)` | 订阅事件：`update` / `log` / `phase` / `gameover` |
| `playCard` | `playCard(handIndex)` | 打出玩家手牌第 handIndex 张；随从直接召唤，法术进入 `choose_target` 或立即生效，返回是否成功 |
| `chooseTarget` | `chooseTarget(target)` | 提交法术/攻击目标（`{kind:'hero',side}` 或 `{kind:'minion',uid}`） |
| `selectAttacker` | `selectAttacker(attacker)` | 选择攻击者（`{kind:'hero'}` 或 `{kind:'minion',uid}`），进入 `choose_attack_target` |
| `getValidTargets` | `getValidTargets()` | 返回当前合法目标列表（UI 高亮用；嘲讽限制在此生效） |
| `getPlayableHandIndices` | `getPlayableHandIndices()` | 返回费用足够可打出的手牌索引数组 |
| `swapRole` | `swapRole(roleIndex)` | 主动换人：法力回满、换卡组、抽 3 张，消耗整个回合 |
| `endTurn` | `endTurn()` | 结束玩家回合（法力 +2、重置随从，进入 AI 回合） |
| `_internal` | — | AI 专用：`opposite` / `canActAsAttacker` / `validAttackTargets` / `combat` / `applyEffect` / `summonMinion` / `getCard` |

> `chooseTarget` 同时服务法术选目标和攻击选目标两个阶段（通过 `pendingSpell` / `pendingAttack` 区分）。

---

## 🛠️ 自定义角色与卡牌

所有游戏内容集中在 `static/js/cardarena-data.js`，修改后无需改动 engine / ai / ui。

### 1. 新增角色

在 `ROLE_POOL` 追加对象：

```javascript
{ id: 'r9', name: '新角色', intro: '一句话简介', maxHealth: 18, attack: 2,
  passive: { type: 'draw', target: 'none', value: 1 },      // 可省略为 null
  deck: ['c19', 'c20', 'g-m1', 'g-m4', 'g-m7', 'g-s1'] }    // 6 张卡 id
```

- `id` 需唯一且与专属卡 `roleExclusive` 对应
- `deck` 引用 `CARDS` 中已有的卡 id（通用卡 `g-*` + 自己的专属卡）

### 2. 新增卡牌

在 `CARDS` 追加对象：

```javascript
// 随从
{ id: 'c19', roleExclusive: 'r9', name: '新随从', type: 'minion', cost: 3,
  attack: 3, health: 4, keywords: ['taunt'], effect: null, desc: '嘲讽' }

// 法术
{ id: 'c20', roleExclusive: 'r9', name: '新法术', type: 'spell', cost: 2,
  effect: { kind: 'damage', target: 'enemy_minion', value: 3 }, desc: '对敌方随从造成 3 点伤害' }
```

- 专属卡必须设置 `roleExclusive` 为对应角色 id；通用卡设为 `null`
- `effect.kind` 仅支持枚举：`damage` / `heal` / `draw` / `buff` / `summon` / `board_clear`
- 新增关键词需确保在 CSS 中无强制依赖（关键词渲染为纯文本，无需额外样式）

### 3. 调整数值

修改 `GAME_CONFIG` 即可（手牌上限 / 法力上限 / 初始法力 / 回复 / 战场上限 / 起手 / 每回合抽牌）。

---

## ⚠️ 已知限制（P0）

1. **单机 vs AI**：无多人对战
2. **无持久化**：刷新页面丢失对局进度（每局从选人开始）
3. **无主动技能**：角色仅被动（passive），主动技能字段预留未启用
4. **AI 为贪心策略**：出牌/攻击/换人按简单评分决策，无复杂战术与预判

---

## 📝 更新日志

### v1.0.0 (2026-08-01) - P0 核心对战

**新增功能**:
- ✅ 8 角色选 6 轮换出战 + 独立卡组 + 独立法力
- ✅ 随从战场（上限 4）+ 6 关键词
- ✅ 出牌/法术选目标/攻击/主动换人/结束回合完整交互
- ✅ 被动换人（阵亡自动上阵）与胜负结算
- ✅ 基础贪心 AI（出牌 → 攻击 → 换人）
- ✅ 娱乐中心入口（/play/）

**架构**:
- 模块化四文件（data/engine/ai/ui）+ CSS 变量，区别于 SleepTown 单文件
- engine 纯状态机不碰 DOM，ui 全权渲染与交互

**已知 Bug 修复**:
- 出牌双重触发（手牌独立监听与事件委托重复绑定 → 统一事件委托）
- 玩家候场条缺失（renderAll 遗漏 buildRosterBar(player) → 补齐）

---

*文档最后更新: 2026-08-01*
*文档版本: P0 v1.0.0*
*维护者: AI Assistant*

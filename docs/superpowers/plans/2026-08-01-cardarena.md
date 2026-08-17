# CardArena 多角色轮换卡牌对战 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 DeepSleep 博客实现 P0 可玩的 CardArena：双方各 6 角色轮换出战的回合制卡牌对战（随从战场 + 6 关键词 + 基础 AI）。

**Architecture:** Hugo 布局模板 + 模块化原生 JS（data/engine/ai/ui 四文件按固定顺序加载）+ CSS 变量。engine 为纯状态机不碰 DOM，ui 负责全部 DOM 与交互，ai 通过 engine 只读接口决策并调用 engine API。所有角色/卡牌数据集中在 data 文件，用户可自行配置。

**Tech Stack:** Hugo Extended + PaperMod（博客）、原生 JavaScript ES6（无框架）、CSS Variables。验证方式为 `hugo --minify --gc` 构建 + `node --check` 语法检查 + 浏览器手动测试。

**Spec:** `docs/superpowers/specs/2026-08-01-cardarena-design.md`

---

## 文件结构

| 文件 | 职责 | 动作 |
|------|------|------|
| `blog-static/static/js/cardarena-data.js` | GAME_CONFIG / ROLE_POOL(8) / CARDS(30) | 新建 |
| `blog-static/static/js/cardarena-engine.js` | 状态机、回合、出牌、战斗、关键词、换人、胜负、事件 | 新建 |
| `blog-static/static/js/cardarena-ai.js` | AI 三阶段决策（出牌/攻击/换人） | 新建 |
| `blog-static/static/js/cardarena-ui.js` | DOM 渲染、点击交互、选目标、日志 | 新建 |
| `blog-static/static/css/cardarena.css` | 极简几何风样式（`--cardarena-*` 在 `:root`） | 新建 |
| `blog-static/layouts/_default/cardarena.html` | 页面模板骨架 + 固定加载顺序 | 新建 |
| `blog-static/content/play/cardarena.md` | front matter 声明 layout | 新建 |
| `blog-static/layouts/_default/play.html` | 娱乐中心新增游戏卡片 | 修改 |

**加载顺序（固定）**: `cardarena-data.js → cardarena-engine.js → cardarena-ai.js → cardarena-ui.js`

**视觉硬约束**（全计划生效）: 无 emoji、无粗体（不用 bold/strong/`<b>`）、无卡片式按钮、冷色系几何风。字体：标题 `Playfair Display, Georgia, serif`，正文 `Inter, -apple-system, sans-serif`（学习路径同款）。

**提交命令前提**: 所有 git 命令在 `blog-static/` 目录下执行，且需走代理（记忆：`http://127.0.0.1:65532`，已配置于 blog-static 仓库，无需额外操作）。

---

### Task 1: 数据层 cardarena-data.js

**Files:**
- Create: `blog-static/static/js/cardarena-data.js`

- [ ] **Step 1: 创建数据文件**

```javascript
// cardarena-data.js — CardArena 数据驱动层（用户可自行修改本文件自定义角色与卡牌）
window.CARDARENA_DATA = (function () {
  'use strict';

  // 全局配置
  const GAME_CONFIG = {
    handLimit: 5,
    manaMax: 5,
    manaStart: 3,
    manaRegen: 2,
    minionLimit: 4,
    startingHand: 3,
    drawPerTurn: 1
  };

  // 角色池（8 个，玩家选 6，AI 随机 6）
  const ROLE_POOL = [
    { id: 'r1', name: '守序者', intro: '沉稳的防线，每回合恢复少量生命', maxHealth: 20, attack: 2,
      passive: { type: 'heal', target: 'ally_hero', value: 1 },
      deck: ['c1', 'c2', 'g-m1', 'g-m2', 'g-m5', 'g-s1'] },
    { id: 'r2', name: '仲裁者', intro: '以攻代守，己方随从获得额外攻击', maxHealth: 18, attack: 3,
      passive: { type: 'buff', target: 'ally_minion', attack: 1 },
      deck: ['c3', 'c4', 'g-m1', 'g-m3', 'g-m4', 'g-s1'] },
    { id: 'r3', name: '预言家', intro: '洞悉先机，每回合多抽一张牌', maxHealth: 18, attack: 1,
      passive: { type: 'draw', target: 'none', value: 1 },
      deck: ['c5', 'c6', 'g-m1', 'g-m4', 'g-m7', 'g-s3'] },
    { id: 'r4', name: '守夜人', intro: '坚实的壁垒，随从获得额外生命', maxHealth: 22, attack: 2,
      passive: { type: 'buff', target: 'ally_minion', health: 1 },
      deck: ['c7', 'c8', 'g-m2', 'g-m5', 'g-m7', 'g-s2'] },
    { id: 'r5', name: '爆破手', intro: '高攻脆弱，每回合灼烧敌方随从', maxHealth: 16, attack: 4,
      passive: { type: 'damage', target: 'enemy_minion', value: 1 },
      deck: ['c9', 'c10', 'g-m1', 'g-m3', 'g-m6', 'g-s4'] },
    { id: 'r6', name: '召集者', intro: '源源不断，每回合召唤小兵', maxHealth: 20, attack: 1,
      passive: { type: 'summon', target: 'none', cardId: 'c17' },
      deck: ['c11', 'c12', 'g-m1', 'g-m4', 'g-m7', 'g-s3'] },
    { id: 'r7', name: '守望者', intro: '远程压制，每回合灼烧敌方角色', maxHealth: 20, attack: 3,
      passive: { type: 'damage', target: 'enemy_hero', value: 1 },
      deck: ['c13', 'c14', 'g-m2', 'g-m5', 'g-m8', 'g-s2'] },
    { id: 'r8', name: '影行者', intro: '攻血双修的刺客，随从全面强化', maxHealth: 16, attack: 3,
      passive: { type: 'buff', target: 'ally_minion', attack: 1, health: 1 },
      deck: ['c15', 'c16', 'g-m1', 'g-m6', 'g-m7', 'g-s4'] }
  ];

  // 卡牌库（30 张：16 专属 + 12 通用 + 2 衍生）
  // type: minion 随从 / spell 法术
  // effect.target: none / enemy_any / enemy_minion / enemy_hero / ally_any / ally_minion / ally_hero
  const CARDS = [
    // ===== 通用随从 =====
    { id: 'g-m1', roleExclusive: null, name: '斥候', type: 'minion', cost: 1, attack: 1, health: 1, keywords: [], effect: null, desc: '1/1 基础随从' },
    { id: 'g-m2', roleExclusive: null, name: '卫兵', type: 'minion', cost: 2, attack: 2, health: 2, keywords: ['taunt'], effect: null, desc: '嘲讽' },
    { id: 'g-m3', roleExclusive: null, name: '突击兵', type: 'minion', cost: 2, attack: 2, health: 1, keywords: ['charge'], effect: null, desc: '冲锋' },
    { id: 'g-m4', roleExclusive: null, name: '剑士', type: 'minion', cost: 3, attack: 3, health: 3, keywords: [], effect: null, desc: '3/3 标准身材' },
    { id: 'g-m5', roleExclusive: null, name: '铁卫', type: 'minion', cost: 3, attack: 2, health: 4, keywords: ['taunt'], effect: null, desc: '嘲讽' },
    { id: 'g-m6', roleExclusive: null, name: '狂战士', type: 'minion', cost: 3, attack: 4, health: 2, keywords: ['charge'], effect: null, desc: '冲锋' },
    { id: 'g-m7', roleExclusive: null, name: '医师', type: 'minion', cost: 2, attack: 1, health: 3, keywords: ['deathrattle'], effect: { kind: 'heal', target: 'ally_hero', value: 2 }, desc: '亡语：己方角色回复 2 点生命' },
    { id: 'g-m8', roleExclusive: null, name: '巨兽', type: 'minion', cost: 5, attack: 5, health: 5, keywords: [], effect: null, desc: '5/5 大型随从' },

    // ===== 通用法术 =====
    { id: 'g-s1', roleExclusive: null, name: '火弹', type: 'spell', cost: 1, effect: { kind: 'damage', target: 'enemy_any', value: 2 }, desc: '对任意敌方目标造成 2 点伤害' },
    { id: 'g-s2', roleExclusive: null, name: '治疗术', type: 'spell', cost: 2, effect: { kind: 'heal', target: 'ally_any', value: 3 }, desc: '为己方任意目标回复 3 点生命' },
    { id: 'g-s3', roleExclusive: null, name: '抽牌术', type: 'spell', cost: 1, effect: { kind: 'draw', target: 'none', value: 2 }, desc: '抽 2 张牌' },
    { id: 'g-s4', roleExclusive: null, name: '强化', type: 'spell', cost: 2, effect: { kind: 'buff', target: 'ally_minion', attack: 2, health: 2 }, desc: '己方随从获得 +2/+2' },

    // ===== 专属卡（每角色 2 张）=====
    { id: 'c1', roleExclusive: 'r1', name: '圣盾卫士', type: 'minion', cost: 2, attack: 2, health: 2, keywords: ['divine_shield'], effect: null, desc: '圣盾' },
    { id: 'c2', roleExclusive: 'r1', name: '坚守', type: 'spell', cost: 1, effect: { kind: 'heal', target: 'ally_any', value: 3 }, desc: '为己方任意目标回复 3 点生命' },
    { id: 'c3', roleExclusive: 'r2', name: '裁决官', type: 'minion', cost: 3, attack: 3, health: 3, keywords: ['taunt'], effect: null, desc: '嘲讽' },
    { id: 'c4', roleExclusive: 'r2', name: '审判', type: 'spell', cost: 2, effect: { kind: 'damage', target: 'enemy_minion', value: 3 }, desc: '对敌方随从造成 3 点伤害' },
    { id: 'c5', roleExclusive: 'r3', name: '洞察者', type: 'minion', cost: 2, attack: 1, health: 2, keywords: ['deathrattle'], effect: { kind: 'draw', target: 'none', value: 1 }, desc: '亡语：抽 1 张牌' },
    { id: 'c6', roleExclusive: 'r3', name: '占卜', type: 'spell', cost: 1, effect: { kind: 'draw', target: 'none', value: 2 }, desc: '抽 2 张牌' },
    { id: 'c7', roleExclusive: 'r4', name: '守夜守卫', type: 'minion', cost: 3, attack: 3, health: 4, keywords: ['taunt'], effect: null, desc: '嘲讽' },
    { id: 'c8', roleExclusive: 'r4', name: '夜巡', type: 'spell', cost: 2, effect: { kind: 'buff', target: 'ally_minion', health: 2 }, desc: '己方随从获得 +2 生命' },
    { id: 'c9', roleExclusive: 'r5', name: '爆破者', type: 'minion', cost: 3, attack: 4, health: 1, keywords: ['charge'], effect: null, desc: '冲锋' },
    { id: 'c10', roleExclusive: 'r5', name: '爆破弹', type: 'spell', cost: 2, effect: { kind: 'damage', target: 'enemy_hero', value: 3 }, desc: '对敌方出战角色造成 3 点伤害' },
    { id: 'c11', roleExclusive: 'r6', name: '募兵官', type: 'minion', cost: 2, attack: 2, health: 3, keywords: ['deathrattle'], effect: { kind: 'summon', target: 'none', cardId: 'c17' }, desc: '亡语：召唤一只 1/1 小兵' },
    { id: 'c12', roleExclusive: 'r6', name: '征兵令', type: 'spell', cost: 2, effect: { kind: 'summon', target: 'none', cardId: 'c18' }, desc: '召唤一只 2/2 见习兵' },
    { id: 'c13', roleExclusive: 'r7', name: '守望塔', type: 'minion', cost: 4, attack: 0, health: 6, keywords: ['taunt'], effect: null, desc: '嘲讽' },
    { id: 'c14', roleExclusive: 'r7', name: '警戒', type: 'spell', cost: 2, effect: { kind: 'heal', target: 'ally_hero', value: 4 }, desc: '己方出战角色回复 4 点生命' },
    { id: 'c15', roleExclusive: 'r8', name: '暗影刺客', type: 'minion', cost: 3, attack: 3, health: 2, keywords: ['windfury'], effect: null, desc: '风怒' },
    { id: 'c16', roleExclusive: 'r8', name: '影袭', type: 'spell', cost: 2, effect: { kind: 'damage', target: 'enemy_minion', value: 4 }, desc: '对敌方随从造成 4 点伤害' },

    // ===== 衍生随从（仅供 summon 效果使用，不进入卡组）=====
    { id: 'c17', roleExclusive: null, name: '小兵', type: 'minion', cost: 0, attack: 1, health: 1, keywords: [], effect: null, desc: '1/1 小兵' },
    { id: 'c18', roleExclusive: null, name: '见习兵', type: 'minion', cost: 0, attack: 2, health: 2, keywords: [], effect: null, desc: '2/2 见习兵' }
  ];

  return { GAME_CONFIG: GAME_CONFIG, ROLE_POOL: ROLE_POOL, CARDS: CARDS };
})();
```

- [ ] **Step 2: 验证语法**

Run: `node --check static/js/cardarena-data.js`
Expected: 无输出（exit 0）

- [ ] **Step 3: 提交**

```bash
git add static/js/cardarena-data.js
git commit -m "feat(cardarena): 数据层 - 角色池与卡牌定义"
```

### Task 2: 引擎 cardarena-engine.js（前半：状态与核心逻辑）

**Files:**
- Create: `blog-static/static/js/cardarena-engine.js`

- [ ] **Step 1: 创建引擎文件（前半部分，本块）**

```javascript
// cardarena-engine.js — CardArena 游戏引擎（纯状态机，不操作 DOM）
(function () {
  'use strict';
  var DATA = window.CARDARENA_DATA;
  var CONFIG = DATA.GAME_CONFIG;

  var state = null;          // 当前对局状态
  var listeners = { update: [], log: [], gameover: [], phase: [] };

  function emit(name, payload) {
    listeners[name].forEach(function (fn) { fn(payload); });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function makeSide(roster) {
    var roles = roster.map(function (roleId) {
      var def = DATA.ROLE_POOL.find(function (r) { return r.id === roleId; });
      return {
        id: def.id, name: def.name, intro: def.intro,
        maxHealth: def.maxHealth, health: def.maxHealth,
        attack: def.attack, passive: def.passive || null, alive: true
      };
    });
    return {
      roster: roles,
      activeIndex: 0,
      mana: CONFIG.manaStart,
      maxMana: CONFIG.manaMax,
      hand: [],
      deck: [],
      board: [],
      roleAttacked: false
    };
  }

  function activeRole(side) { return side.roster[side.activeIndex]; }

  function nextAliveIndex(side) {
    var start = side.activeIndex;
    for (var step = 1; step <= side.roster.length; step++) {
      var idx = (start + step) % side.roster.length;
      if (side.roster[idx].alive) return idx;
    }
    return -1;
  }

  function sideDefeated(side) {
    return !side.roster.some(function (r) { return r.alive; });
  }

  function buildDeck(roleId) {
    var def = DATA.ROLE_POOL.find(function (r) { return r.id === roleId; });
    var deck = [];
    def.deck.forEach(function (cid) {
      var card = DATA.CARDS.find(function (c) { return c.id === cid; });
      if (card) deck.push(card.id);
    });
    return shuffle(deck);
  }

  function drawCards(side, n) {
    for (var i = 0; i < n; i++) {
      if (side.deck.length === 0) break;               // 牌库抽空：不再抽
      if (side.hand.length >= CONFIG.handLimit) break; // 手牌满：新抽的弃掉
      side.hand.push(side.deck.pop());
    }
  }

  function findTarget(side, targetType) {
    var targets = [];
    if (targetType === 'enemy_any' || targetType === 'enemy_minion') {
      targets = side.board.filter(function (m) { return m.health > 0; });
      if (targetType === 'enemy_any') {
        targets = targets.concat([{ kind: 'hero', side: side }]);
      }
    } else if (targetType === 'enemy_hero') {
      targets = [{ kind: 'hero', side: side }];
    } else if (targetType === 'ally_any' || targetType === 'ally_minion') {
      targets = side.board.filter(function (m) { return m.health > 0; });
      if (targetType === 'ally_any') {
        targets = targets.concat([{ kind: 'hero', side: side }]);
      }
    } else if (targetType === 'ally_hero') {
      targets = [{ kind: 'hero', side: side }];
    }
    return targets;
  }

  function pickRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function opposite(side) { return side === state.player ? state.enemy : state.player; }

  function hasKeyword(minion, kw) {
    return minion.keywords && minion.keywords.indexOf(kw) !== -1;
  }

  function addLog(message) {
    state.logs.unshift({ message: message, time: new Date().toLocaleTimeString('zh-CN', { hour12: false }) });
    if (state.logs.length > 50) state.logs.pop();
    emit('log', null);
  }

  function summonMinion(side, cardId) {
    if (side.board.filter(function (m) { return m.health > 0; }).length >= CONFIG.minionLimit) return;
    var def = DATA.CARDS.find(function (c) { return c.id === cardId; });
    if (!def) return;
    side.board.push({
      uid: 'm' + Math.random().toString(36).slice(2, 8),
      cardId: def.id, name: def.name,
      attack: def.attack, health: def.health, maxHealth: def.health,
      keywords: (def.keywords || []).slice(),
      effect: def.effect || null,
      side: side,                          // 随从所属方（player/enemy 对象引用）
      divineShield: (def.keywords || []).indexOf('divine_shield') !== -1,
      exhausted: (def.keywords || []).indexOf('charge') === -1,
      attacksLeft: (def.keywords || []).indexOf('windfury') !== -1 ? 2 : 1
    });
    addLog('召唤了 ' + def.name);
    emit('update', null);
  }

  function cleanupBoard(side) {
    side.board = side.board.filter(function (m) { return m.health > 0; });
  }

  function healTarget(target, amount) {
    if (target.kind === 'hero') {
      var role = target.side.roster[target.side.activeIndex];
      role.health = Math.min(role.maxHealth, role.health + amount);
    } else {
      target.health = Math.min(target.maxHealth, target.health + amount);
    }
    emit('update', null);
  }

  function dealDamage(attackerSide, target, amount) {
    if (target.kind === 'hero') {
      var role = target.side.roster[target.side.activeIndex];
      role.health -= amount;
      addLog((target.side === state.player ? '我方角色' : '敌方角色') + '受到 ' + amount + ' 点伤害');
      checkRoleDeath(target.side);
    } else {
      var minion = target;
      if (minion.divineShield) {
        minion.divineShield = false;
        addLog(minion.name + ' 的圣盾被击破');
        return;
      }
      minion.health -= amount;
      if (minion.health <= 0) {
        addLog(minion.name + ' 被消灭');
        if (hasKeyword(minion, 'deathrattle')) applyEffect(minion.effect, minion.side, null);
        cleanupBoard(minion.side);
      }
    }
    emit('update', null);
  }

  function checkRoleDeath(side) {
    var role = activeRole(side);
    if (role.health > 0) return;
    addLog(role.name + ' 阵亡');
    role.alive = false;
    if (sideDefeated(side)) {
      state.phase = 'gameover';
      emit('gameover', { winner: side === state.player ? 'enemy' : 'player' });
      return;
    }
    var next = nextAliveIndex(side);
    if (next === -1) {
      state.phase = 'gameover';
      emit('gameover', { winner: side === state.player ? 'enemy' : 'player' });
      return;
    }
    side.activeIndex = next;
    side.roleAttacked = false;
    side.hand = [];
    side.deck = buildDeck(activeRole(side).id);
    drawCards(side, CONFIG.startingHand);
    side.mana = CONFIG.manaMax;
    addLog(activeRole(side).name + ' 上场');
    emit('update', null);
  }
```

- [ ] **Step 2: 追加引擎文件（后半部分）**

```javascript
  function applyEffect(effect, ownerSide, target) {
    if (!effect) return;
    var kind = effect.kind || effect.type;   // 兼容卡牌 effect(kind) 与角色被动(type)
    var enemy = opposite(ownerSide);
    switch (kind) {
      case 'damage': {
        var t = target || pickRandom(findTarget(enemy, effect.target));
        if (t) {
          if (t.kind === 'hero') { dealDamage(ownerSide, { kind: 'hero', side: enemy }, effect.value); }
          else { dealDamage(ownerSide, enemy.board.find(function (m) { return m.uid === t.uid; }) || t, effect.value); }
        }
        break;
      }
      case 'heal': {
        var t2 = target || pickRandom(findTarget(ownerSide, effect.target));
        if (t2) {
          if (t2.kind === 'hero') { healTarget({ kind: 'hero', side: ownerSide }, effect.value); }
          else { healTarget(ownerSide.board.find(function (m) { return m.uid === t2.uid; }) || t2, effect.value); }
        }
        break;
      }
      case 'draw': {
        drawCards(ownerSide, effect.value);
        break;
      }
      case 'buff': {
        var t3 = target || pickRandom(findTarget(ownerSide, effect.target));
        var minion = t3 && t3.kind === 'minion'
          ? (ownerSide.board.find(function (m) { return m.uid === t3.uid; }) || t3)
          : null;
        if (minion) {
          minion.attack += (effect.attack || 0);
          minion.health += (effect.health || 0);
          minion.maxHealth += (effect.health || 0);
          addLog(minion.name + ' 获得 +' + (effect.attack || 0) + '/+' + (effect.health || 0));
        }
        break;
      }
      case 'summon': {
        summonMinion(ownerSide, effect.cardId);
        break;
      }
      case 'board_clear': {
        enemy.board.forEach(function (m) {
          m.health = 0;
          if (hasKeyword(m, 'deathrattle')) applyEffect(m.effect, m.side, null);
        });
        cleanupBoard(enemy);
        break;
      }
      default: break;
    }
    emit('update', null);
  }

  // 随从/角色主动攻击：attacker 打 target，双方结算
  function combat(attackerSide, attacker, target) {
    // 将 {kind:'minion', side, uid} 引用解析为实际随从对象
    var realTarget = target;
    if (target.kind === 'minion' && !target.health) {
      realTarget = target.side.board.find(function (m) { return m.uid === target.uid; }) || target;
    }
    var aAtk = attacker.attack;
    if (attacker.kind === 'minion') {
      attacker.attacksLeft = (attacker.attacksLeft || 1) - 1;
      if (attacker.attacksLeft <= 0) attacker.exhausted = true;
    } else {
      attackerSide.roleAttacked = true;
    }
    addLog((attacker.kind === 'hero' ? activeRole(attackerSide).name : attacker.name)
      + ' 攻击 ' + (realTarget.kind === 'hero' ? activeRole(realTarget.side).name : realTarget.name));

    // 攻击者伤害目标
    dealDamage(attackerSide, realTarget, aAtk);
    if (hasKeyword(attacker, 'poison') && realTarget.kind === 'minion' && realTarget.health > 0) {
      realTarget.health = 0;
      addLog(realTarget.name + ' 被剧毒击杀');
      if (hasKeyword(realTarget, 'deathrattle')) applyEffect(realTarget.effect, realTarget.side, null);
      cleanupBoard(realTarget.side);
    }
    // 目标反击（若目标是存活且可攻击的随从）
    if (realTarget.kind === 'minion' && realTarget.health > 0 && realTarget.attack > 0) {
      dealDamage(realTarget.side, attacker, realTarget.attack);
      if (hasKeyword(realTarget, 'poison') && attacker.kind === 'minion' && attacker.health > 0) {
        attacker.health = 0;
        addLog(attacker.name + ' 被剧毒反击击杀');
        if (hasKeyword(attacker, 'deathrattle')) applyEffect(attacker.effect, attacker.side, null);
        cleanupBoard(attacker.side);
      }
    }
    if (attacker.kind === 'minion' && attacker.health <= 0) cleanupBoard(attacker.side);
    emit('update', null);
  }

  function validAttackTargets(attackerSide) {
    var enemy = opposite(attackerSide);
    var taunts = enemy.board.filter(function (m) { return m.health > 0 && hasKeyword(m, 'taunt'); });
    if (taunts.length > 0) {
      return taunts.map(function (m) { return { kind: 'minion', side: enemy, uid: m.uid }; });
    }
    var all = enemy.board.filter(function (m) { return m.health > 0; })
      .map(function (m) { return { kind: 'minion', side: enemy, uid: m.uid }; });
    all.push({ kind: 'hero', side: enemy });
    return all;
  }

  function canActAsAttacker(side, attacker) {
    if (attacker.kind === 'minion') {
      return !attacker.exhausted && attacker.attack > 0;
    }
    return !side.roleAttacked && activeRole(side).attack > 0;
  }

  function beginTurn(side) {
    state.turn = state.turn + 1;
    state.phase = side === state.player ? 'player_turn' : 'enemy_turn';
    drawCards(side, CONFIG.drawPerTurn);
    var role = activeRole(side);
    if (role.passive) applyEffect(role.passive, side, null);
    emit('phase', side === state.player ? 'player_turn' : 'enemy_turn');
    if (side === state.enemy) runEnemyTurn();
  }

  function endTurn(side) {
    side.mana = Math.min(side.maxMana, side.mana + CONFIG.manaRegen);   // 回合结束时回复 manaRegen
    side.roleAttacked = false;
    side.board.forEach(function (m) {
      m.exhausted = false;
      m.attacksLeft = hasKeyword(m, 'windfury') ? 2 : 1;
    });
    beginTurn(opposite(side));
  }

  function runEnemyTurn() {
    var ai = window.CARDARENA_AI;
    setTimeout(function () {
      if (ai) ai.runTurn(state.enemy, state.player);
      endTurn(state.enemy);
    }, 400);
  }
```

- [ ] **Step 3: 追加引擎文件（公开 API 部分）**

```javascript
  // ===== 公开 API =====
  window.CardArena = {
    start: function (playerRoster, enemyRoster) {
      state = {
        turn: 0,
        player: makeSide(playerRoster),
        enemy: makeSide(enemyRoster),
        logs: []
      };
      state.player.deck = buildDeck(activeRole(state.player).id);
      drawCards(state.player, CONFIG.startingHand);
      state.player.mana = CONFIG.manaStart;
      state.enemy.deck = buildDeck(activeRole(state.enemy).id);
      drawCards(state.enemy, CONFIG.startingHand);
      state.enemy.mana = CONFIG.manaStart;
      addLog('对局开始：玩家先手');
      emit('update', null);
      beginTurn(state.player);
    },

    getState: function () { return state; },

    on: function (event, fn) {
      if (listeners[event]) listeners[event].push(fn);
    },

    // 打出手中第 handIndex 张牌
    playCard: function (handIndex) {
      if (state.phase === 'gameover') return false;
      var hand = state.player.hand;
      if (handIndex < 0 || handIndex >= hand.length) return false;
      var card = DATA.CARDS.find(function (c) { return c.id === hand[handIndex]; });
      if (!card) return false;
      if (state.player.mana < card.cost) return false;
      if (card.type === 'minion') {
        if (state.player.board.filter(function (m) { return m.health > 0; }).length >= CONFIG.minionLimit) return false;
        state.player.mana -= card.cost;
        state.player.hand.splice(handIndex, 1);
        summonMinion(state.player, card.id);
        return true;
      }
      var eff = card.effect;
      if (eff && eff.target !== 'none') {
        state.pendingSpell = { cardId: card.id, effect: eff, handIndex: handIndex };
        emit('phase', 'choose_target');
        return true;
      }
      state.player.mana -= card.cost;
      state.player.hand.splice(handIndex, 1);
      applyEffect(eff, state.player, null);
      return true;
    },

    // 选择法术/攻击目标
    chooseTarget: function (target) {
      if (state.pendingSpell) {
        var ps = state.pendingSpell;
        state.pendingSpell = null;
        state.player.mana -= DATA.CARDS.find(function (c) { return c.id === ps.cardId; }).cost;
        state.player.hand.splice(ps.handIndex, 1);
        applyEffect(ps.effect, state.player, target);
        emit('phase', 'player_turn');
        return true;
      }
      if (state.pendingAttack) {
        var pa = state.pendingAttack;
        state.pendingAttack = null;
        combat(pa.side, pa.attacker, target);
        emit('phase', 'player_turn');
        return true;
      }
      return false;
    },

    // 选择攻击者
    selectAttacker: function (attacker) {
      if (state.phase === 'gameover') return false;
      var minion = null;
      if (attacker.kind === 'minion') {
        minion = state.player.board.find(function (m) { return m.uid === attacker.uid; });
        if (!minion || !canActAsAttacker(state.player, minion)) return false;
      } else {
        if (!canActAsAttacker(state.player, { kind: 'hero' })) return false;
      }
      state.pendingAttack = { side: state.player, attacker: attacker.kind === 'minion' ? minion : { kind: 'hero', attack: activeRole(state.player).attack } };
      emit('phase', 'choose_attack_target');
      return true;
    },

    getValidTargets: function () {
      if (state.pendingSpell) {
        var eff = state.pendingSpell.effect;
        var enemy = state.enemy;
        var targets = findTarget(enemy, eff.target);
        return targets.map(function (t) {
          return t.kind === 'hero' ? { kind: 'hero', side: 'enemy' } : { kind: 'minion', uid: t.uid };
        });
      }
      if (state.pendingAttack) {
        return validAttackTargets(state.player).map(function (t) {
          return t.kind === 'hero' ? { kind: 'hero', side: 'enemy' } : { kind: 'minion', uid: t.uid };
        });
      }
      return [];
    },

    getPlayableHandIndices: function () {
      var out = [];
      var hand = state.player.hand;
      for (var i = 0; i < hand.length; i++) {
        var card = DATA.CARDS.find(function (c) { return c.id === hand[i]; });
        if (card && card.cost <= state.player.mana) out.push(i);
      }
      return out;
    },

    // 主动换人（消耗整个回合）
    swapRole: function (roleIndex) {
      if (state.phase === 'gameover') return false;
      var role = state.player.roster[roleIndex];
      if (!role || !role.alive || roleIndex === state.player.activeIndex) return false;
      state.player.activeIndex = roleIndex;
      state.player.roleAttacked = false;
      state.player.hand = [];
      state.player.deck = buildDeck(role.id);
      drawCards(state.player, CONFIG.startingHand);
      state.player.mana = CONFIG.manaMax;
      addLog('主动换人：' + role.name + ' 上场（法力回满）');
      emit('update', null);
      endTurn(state.player);   // 消耗整个回合
      return true;
    },

    endTurn: function () {
      if (state.phase === 'gameover') return false;
      endTurn(state.player);
      return true;
    },

    // 供 AI 使用的只读与执行接口
    _internal: {
      opposite: opposite,
      canActAsAttacker: canActAsAttacker,
      validAttackTargets: validAttackTargets,
      combat: combat,
      applyEffect: applyEffect,
      summonMinion: summonMinion,
      getCard: function (id) { return DATA.CARDS.find(function (c) { return c.id === id; }); }
    }
  };
})();
```

- [ ] **Step 4: 验证语法**

Run: `node --check static/js/cardarena-engine.js`
Expected: 无输出（exit 0）

- [ ] **Step 5: 提交**

```bash
git add static/js/cardarena-engine.js
git commit -m "feat(cardarena): 引擎 - 回合/出牌/战斗/关键词/换人/胜负"
```

### Task 3: AI cardarena-ai.js

**Files:**
- Create: `blog-static/static/js/cardarena-ai.js`

- [ ] **Step 1: 创建 AI 文件**

```javascript
// cardarena-ai.js — CardArena 基础 AI（贪心策略）
// 注意：AI 直接操作 side 状态对象（与 engine 共享引用），并复用 engine 的 _internal 接口
(function () {
  'use strict';
  var DATA = window.CARDARENA_DATA;

  function getCard(cardId) {
    return DATA.CARDS.find(function (c) { return c.id === cardId; });
  }

  function aliveBoard(side) {
    return side.board.filter(function (m) { return m.health > 0; });
  }

  function enemyMinions(enemy) {
    return aliveBoard(enemy);
  }

  // 阶段1：出牌。循环直到法力不足或无可打出牌
  function playPhase(side, enemy) {
    var engine = window.CardArena._internal;
    for (var guard = 0; guard < 20; guard++) {
      var handIndex = chooseCard(side, enemy);
      if (handIndex === -1) return;
      var card = getCard(side.hand[handIndex]);
      if (!card || card.cost > side.mana) return;

      if (card.type === 'minion') {
        if (aliveBoard(side).length >= window.CARDARENA_DATA.GAME_CONFIG.minionLimit) return;
        side.mana -= card.cost;
        side.hand.splice(handIndex, 1);
        engine.summonMinion(side, card.id);
        continue;
      }

      // 法术
      var eff = card.effect;
      if (!eff) { side.mana -= card.cost; side.hand.splice(handIndex, 1); continue; }
      if (eff.target === 'none') {
        side.mana -= card.cost;
        side.hand.splice(handIndex, 1);
        engine.applyEffect(eff, side, null);
        continue;
      }
      // 需要目标：damage 打敌方随从，heal 打己方角色
      var target = chooseSpellTarget(eff, side, enemy);
      if (!target) continue; // 无合适目标则跳过该牌
      side.mana -= card.cost;
      side.hand.splice(handIndex, 1);
      engine.applyEffect(eff, side, target);
    }
  }

  // 从手牌中选一张值得打出的牌（优先随从，其次解场法术）
  function chooseCard(side, enemy) {
    var hand = side.hand;
    for (var i = 0; i < hand.length; i++) {
      var card = getCard(hand[i]);
      if (card && card.type === 'minion' && card.cost <= side.mana) return i;
    }
    // 伤害法术：能击杀敌方随从优先
    var best = -1;
    var bestScore = 0;
    for (var j = 0; j < hand.length; j++) {
      var c2 = getCard(hand[j]);
      if (!c2 || c2.type !== 'spell' || c2.cost > side.mana || !c2.effect) continue;
      if (c2.effect.kind === 'damage') {
        var killable = enemyMinions(enemy).filter(function (m) { return m.health <= c2.effect.value; });
        var score = killable.length > 0 ? 100 + killable[0].attack : 10;
        if (score > bestScore) { bestScore = score; best = j; }
      } else if (c2.effect.kind === 'summon') {
        if (aliveBoard(side).length < window.CARDARENA_DATA.GAME_CONFIG.minionLimit) return j;
      }
    }
    return best;
  }

  function chooseSpellTarget(eff, side, enemy) {
    if (eff.kind === 'damage') {
      var minions = enemyMinions(enemy);
      var killable = minions.filter(function (m) { return m.health <= eff.value; });
      var pool = killable.length > 0 ? killable : minions;
      if (pool.length > 0) {
        pool.sort(function (a, b) { return b.attack - a.attack; });
        return { kind: 'minion', uid: pool[0].uid };
      }
      if (eff.target === 'enemy_hero') return { kind: 'hero', side: 'enemy' };
      return null;
    }
    if (eff.kind === 'heal') {
      var hero = side.roster[side.activeIndex];
      if (hero.health <= hero.maxHealth - eff.value) return { kind: 'hero', side: 'self' };
      return null;
    }
    if (eff.kind === 'buff') {
      var mine = aliveBoard(side);
      if (mine.length > 0) {
        mine.sort(function (a, b) { return b.attack - a.attack; });
        return { kind: 'minion', uid: mine[0].uid };
      }
      return null;
    }
    return null;
  }

  // 阶段2：攻击。每个可攻击的随从/角色执行一次攻击
  function attackPhase(side, enemy) {
    var engine = window.CardArena._internal;
    // 为每个目标附加实际随从引用（供血量/攻击决策使用）
    var targets = engine.validAttackTargets(side).map(function (t) {
      if (t.kind === 'hero') return t;
      var m = enemy.board.find(function (x) { return x.uid === t.uid; });
      return { kind: 'minion', side: t.side, uid: t.uid, minion: m };
    });
    // 随从依次攻击
    aliveBoard(side).slice().forEach(function (m) {
      if (!engine.canActAsAttacker(side, m)) return;
      var t = pickTargetForMinion(m, targets);
      if (t) engine.combat(side, m, t);
    });
    // 出战角色攻击
    var hero = side.roster[side.activeIndex];
    if (hero.attack > 0 && !side.roleAttacked) {
      var ht = targets[targets.length - 1]; // 最后一个元素是 hero
      if (ht) engine.combat(side, { kind: 'hero', attack: hero.attack }, ht);
    }
  }

  function pickTargetForMinion(minion, targets) {
    // 优先攻击能击杀的目标（attack >= 目标血量），其次高攻目标
    var withInfo = targets.map(function (t) {
      if (t.kind === 'hero') return { t: t, attack: 0, health: Infinity };
      return { t: t, attack: t.minion ? t.minion.attack : 0, health: t.minion ? t.minion.health : Infinity };
    });
    var killable = withInfo.filter(function (x) { return x.t.kind === 'minion' && x.health <= minion.attack; });
    var pool = killable.length > 0 ? killable : withInfo;
    return pool[pool.length - 1].t;
  }

  // 阶段3：主动换人。当前角色血量低且本回合尚未攻击时换人
  function swapPhase(side) {
    var hero = side.roster[side.activeIndex];
    if (hero.health > hero.maxHealth * 0.3) return;
    var best = -1;
    for (var i = 0; i < side.roster.length; i++) {
      var r = side.roster[i];
      if (!r.alive || i === side.activeIndex) continue;
      if (best === -1 || r.health > side.roster[best].health) best = i;
    }
    if (best === -1) return;
    side.activeIndex = best;
    side.roleAttacked = false;
    side.hand = [];
    side.deck = buildDeckAI(side.roster[best].id);
    for (var d = 0; d < window.CARDARENA_DATA.GAME_CONFIG.startingHand; d++) {
      if (side.deck.length > 0) side.hand.push(side.deck.pop());
    }
    side.mana = window.CARDARENA_DATA.GAME_CONFIG.manaMax;
  }

  function buildDeckAI(roleId) {
    var def = DATA.ROLE_POOL.find(function (r) { return r.id === roleId; });
    var deck = [];
    def.deck.forEach(function (cid) {
      var card = getCard(cid);
      if (card) deck.push(card.id);
    });
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    return deck;
  }

  window.CARDARENA_AI = {
    runTurn: function (side, enemy) {
      playPhase(side, enemy);
      attackPhase(side, enemy);
      swapPhase(side);
    }
  };
})();
```

- [ ] **Step 2: 验证语法**

Run: `node --check static/js/cardarena-ai.js`
Expected: 无输出（exit 0）

- [ ] **Step 3: 提交**

```bash
git add static/js/cardarena-ai.js
git commit -m "feat(cardarena): AI - 出牌/攻击/换人贪心策略"
```

### Task 4: UI cardarena-ui.js（前半：开始界面与渲染）

**Files:**
- Create: `blog-static/static/js/cardarena-ui.js`

- [ ] **Step 1: 创建 UI 文件（前半部分）**

```javascript
// cardarena-ui.js — CardArena 界面渲染与交互
(function () {
  'use strict';
  var DATA = window.CARDARENA_DATA;
  var CONFIG = DATA.GAME_CONFIG;
  var app = null;
  var chosenRoles = [];       // 玩家选择的 6 个角色 id

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function cardName(cardId) {
    var c = DATA.CARDS.find(function (x) { return x.id === cardId; });
    return c ? c.name : cardId;
  }

  // ===== 开始界面：选择 6 个角色 =====
  function renderSetup() {
    app.innerHTML = '';
    var box = el('div', 'ca-setup');
    var title = el('h2', 'ca-setup-title', '选择出战角色');
    var sub = el('p', 'ca-setup-sub', '从 8 个角色中选择 6 个出战，AI 将随机挑选 6 个');
    box.appendChild(title);
    box.appendChild(sub);

    var grid = el('div', 'ca-setup-grid');
    DATA.ROLE_POOL.forEach(function (role) {
      var card = el('button', 'ca-setup-role');
      card.dataset.role = role.id;
      var name = el('div', 'ca-setup-role-name', role.name);
      var stat = el('div', 'ca-setup-role-stat', role.maxHealth + ' 生命 · ' + role.attack + ' 攻击');
      var intro = el('div', 'ca-setup-role-intro', role.intro);
      var passive = el('div', 'ca-setup-role-passive', '被动: ' + (role.passive ? describePassive(role.passive) : '无'));
      card.appendChild(name);
      card.appendChild(stat);
      card.appendChild(intro);
      card.appendChild(passive);
      card.addEventListener('click', function () { toggleRole(role.id); });
      grid.appendChild(card);
    });
    box.appendChild(grid);

    var startBtn = el('button', 'ca-btn ca-btn-primary', '开始对战');
    startBtn.id = 'ca-start';
    startBtn.disabled = true;
    startBtn.addEventListener('click', startGame);
    box.appendChild(startBtn);

    var hint = el('p', 'ca-setup-hint', '已选 0 / 6');
    hint.id = 'ca-count';
    box.appendChild(hint);
    app.appendChild(box);
  }

  function describePassive(p) {
    var parts = [];
    if (p.type === 'heal') parts.push('回复 ' + p.value + ' 点生命');
    if (p.type === 'draw') parts.push('抽 ' + p.value + ' 张牌');
    if (p.type === 'damage') parts.push('造成 ' + p.value + ' 点伤害');
    if (p.type === 'buff') parts.push('随从 +' + (p.attack || 0) + '/+' + (p.health || 0));
    if (p.type === 'summon') parts.push('召唤随从');
    return parts.join('，') || '无';
  }

  function toggleRole(roleId) {
    var idx = chosenRoles.indexOf(roleId);
    if (idx !== -1) {
      chosenRoles.splice(idx, 1);
    } else {
      if (chosenRoles.length >= 6) return;
      chosenRoles.push(roleId);
    }
    var cards = app.querySelectorAll('.ca-setup-role');
    cards.forEach(function (c) {
      c.classList.toggle('selected', chosenRoles.indexOf(c.dataset.role) !== -1);
    });
    var count = app.querySelector('#ca-count');
    if (count) count.textContent = '已选 ' + chosenRoles.length + ' / 6';
    var startBtn = app.querySelector('#ca-start');
    if (startBtn) startBtn.disabled = chosenRoles.length !== 6;
  }

  function startGame() {
    if (chosenRoles.length !== 6) return;
    var pool = DATA.ROLE_POOL.map(function (r) { return r.id; });
    var aiRoster = shuffle(pool).slice(0, 6);
    window.CardArena.start(chosenRoles.slice(), aiRoster);
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ===== 对局界面：整体渲染 =====
  function renderAll() {
    var s = window.CardArena.getState();
    if (!s) return;
    app.innerHTML = '';
    var layout = el('div', 'ca-layout');
    layout.appendChild(buildRosterBar(s.enemy, 'enemy'));
    layout.appendChild(buildEnemyZone(s));
    layout.appendChild(buildLogPanel(s));
    layout.appendChild(buildPlayerZone(s));
    layout.appendChild(buildRosterBar(s.player, 'player'));
    layout.appendChild(buildHandBar(s));
    layout.appendChild(buildActionBar(s));
    app.appendChild(layout);
  }

  function buildRosterBar(side, sideName) {
    var bar = el('div', 'ca-roster ca-roster-' + sideName);
    var title = el('div', 'ca-roster-label', sideName === 'player' ? '我方角色' : '敌方角色');
    bar.appendChild(title);
    side.roster.forEach(function (role, i) {
      var chip = el('div', 'ca-roster-chip');
      chip.dataset.roleIndex = i;
      chip.dataset.side = sideName;
      if (i === side.activeIndex) chip.classList.add('active');
      if (!role.alive) chip.classList.add('dead');
      var nm = el('span', 'ca-roster-chip-name', role.name);
      var hp = el('span', 'ca-roster-chip-hp', role.health + '/' + role.maxHealth);
      chip.appendChild(nm);
      chip.appendChild(hp);
      // 玩家方可点击候场存活角色主动换人
      if (sideName === 'player' && role.alive && i !== side.activeIndex) {
        chip.classList.add('swappable');
        chip.title = '点击换人（消耗整个回合）';
        chip.addEventListener('click', function () {
          window.CardArena.swapRole(i);
        });
      }
      bar.appendChild(chip);
    });
    return bar;
  }

  function buildHeroView(side, sideName) {
    var role = side.roster[side.activeIndex];
    var hero = el('div', 'ca-hero ca-hero-' + sideName);
    hero.dataset.side = sideName;
    if (sideName === 'player') hero.classList.add('attacker-selectable');
    var name = el('div', 'ca-hero-name', role.name);
    var stats = el('div', 'ca-hero-stats', role.health + ' / ' + role.maxHealth + ' 生命 · ' + role.attack + ' 攻击');
    var mana = el('div', 'ca-hero-mana', sideName === 'player' ? '法力 ' + side.mana + ' / ' + side.maxMana : '');
    var passive = el('div', 'ca-hero-passive', role.passive ? '被动: ' + describePassive(role.passive) : '');
    hero.appendChild(name);
    hero.appendChild(stats);
    if (sideName === 'player') hero.appendChild(mana);
    hero.appendChild(passive);
    return hero;
  }

  function buildBoard(side, sideName) {
    var zone = el('div', 'ca-board ca-board-' + sideName);
    var label = el('div', 'ca-board-label', '随从区');
    zone.appendChild(label);
    side.board.forEach(function (m) {
      if (m.health <= 0) return;
      var cell = el('div', 'ca-minion');
      cell.dataset.uid = m.uid;
      cell.dataset.side = sideName;
      if (sideName === 'player') {
        cell.classList.add('attacker-selectable');
        if (m.exhausted || m.attack === 0) cell.classList.add('disabled');
      }
      var nm = el('div', 'ca-minion-name', m.name);
      var kv = el('div', 'ca-minion-kv', m.attack + ' / ' + m.health);
      cell.appendChild(nm);
      cell.appendChild(kv);
      if (m.keywords && m.keywords.length) {
        var kw = el('div', 'ca-minion-kw', m.keywords.join(' · '));
        cell.appendChild(kw);
      }
      zone.appendChild(cell);
    });
    return zone;
  }
```
- [ ] **Step 2: 追加 UI 文件（后半部分）**

```javascript
  function buildEnemyZone(s) {
    var zone = el('div', 'ca-zone ca-zone-enemy');
    zone.appendChild(buildHeroView(s.enemy, 'enemy'));
    zone.appendChild(buildBoard(s.enemy, 'enemy'));
    return zone;
  }

  function buildPlayerZone(s) {
    var zone = el('div', 'ca-zone ca-zone-player');
    zone.appendChild(buildBoard(s.player, 'player'));
    zone.appendChild(buildHeroView(s.player, 'player'));
    return zone;
  }

  function buildLogPanel(s) {
    var panel = el('div', 'ca-log');
    var title = el('div', 'ca-log-label', '对战日志');
    panel.appendChild(title);
    var list = el('div', 'ca-log-list');
    s.logs.slice(0, 20).forEach(function (entry) {
      var line = el('div', 'ca-log-line');
      line.textContent = '[' + entry.time + '] ' + entry.message;
      list.appendChild(line);
    });
    panel.appendChild(list);
    return panel;
  }

  function buildHandBar(s) {
    var bar = el('div', 'ca-hand');
    var label = el('div', 'ca-hand-label', '手牌（回合结束回复 2 点法力）');
    bar.appendChild(label);
    var cards = el('div', 'ca-hand-cards');
    s.player.hand.forEach(function (cardId, i) {
      var c = DATA.CARDS.find(function (x) { return x.id === cardId; });
      if (!c) return;
      var cardEl = el('div', 'ca-card');
      cardEl.dataset.handIndex = i;
      if (c.cost > s.player.mana) cardEl.classList.add('disabled');
      var cost = el('div', 'ca-card-cost', String(c.cost));
      var nm = el('div', 'ca-card-name', c.name);
      var body = el('div', 'ca-card-desc', c.desc);
      cardEl.appendChild(cost);
      cardEl.appendChild(nm);
      cardEl.appendChild(body);
      if (c.type === 'minion') {
        var kv = el('div', 'ca-card-kv', c.attack + ' / ' + c.health);
        cardEl.appendChild(kv);
      }
      // 出牌点击由 bindAppEvents 的事件委托统一处理（避免双重触发）
      cards.appendChild(cardEl);
    });
    bar.appendChild(cards);
    return bar;
  }

  function buildActionBar(s) {
    var bar = el('div', 'ca-actions');
    var info = el('div', 'ca-actions-info',
      '第 ' + s.turn + ' 回合' + (s.phase === 'enemy_turn' ? ' · AI 行动中' : ' · 轮到玩家'));
    var endBtn = el('button', 'ca-btn', '结束回合');
    endBtn.id = 'ca-end-turn';
    if (s.phase === 'enemy_turn') endBtn.disabled = true;
    endBtn.addEventListener('click', function () { window.CardArena.endTurn(); });
    bar.appendChild(info);
    bar.appendChild(endBtn);
    return bar;
  }

  // ===== 目标选择高亮 =====
  function applyTargetingMode() {
    var s = window.CardArena.getState();
    if (!s) return;
    var valid = window.CardArena.getValidTargets();
    if (valid.length === 0) return;
    app.classList.add('ca-targeting');
    // 高亮合法目标（敌方区）
    valid.forEach(function (t) {
      if (t.kind === 'hero') {
        var heroEl = app.querySelector('.ca-hero-enemy');
        if (heroEl) heroEl.classList.add('targetable');
      } else {
        var cell = app.querySelector('.ca-minion[data-uid="' + t.uid + '"]');
        if (cell && cell.dataset.side === 'enemy') cell.classList.add('targetable');
      }
    });
  }

  // ===== 交互事件（事件委托）=====
  function bindAppEvents() {
    app.addEventListener('click', function (e) {
      var node = e.target.closest ? e.target.closest('[data-hand-index], .attacker-selectable, .targetable') : null;

      // 1. 选目标模式：点击 targetable 提交目标，点击其他任意处取消
      if (app.classList.contains('ca-targeting')) {
        app.classList.remove('ca-targeting');
        if (node && node.classList.contains('targetable')) {
          var target = null;
          if (node.dataset.uid) {
            target = { kind: 'minion', uid: node.dataset.uid };
          } else {
            target = { kind: 'hero', side: 'enemy' };
          }
          window.CardArena.chooseTarget(target);
        } else {
          renderAll(); // 取消选目标
        }
        return;
      }

      if (!node) return;

      // 2. 点击手牌 → 出牌
      if (node.dataset.handIndex !== undefined) {
        if (!node.classList.contains('disabled')) {
          window.CardArena.playCard(parseInt(node.dataset.handIndex, 10));
        }
        return;
      }

      // 3. 点击己方可攻击单位 → 选择攻击者
      if (node.classList.contains('attacker-selectable')) {
        var att = null;
        if (node.dataset.uid) {
          att = { kind: 'minion', uid: node.dataset.uid };
        } else {
          att = { kind: 'hero' };
        }
        var ok = window.CardArena.selectAttacker(att);
        if (ok) applyTargetingMode();
        return;
      }
    });
  }

  // ===== 结束结算 =====
  function showGameOver(result) {
    var overlay = el('div', 'ca-overlay');
    var box = el('div', 'ca-overlay-box');
    var title = el('h2', 'ca-overlay-title', result.winner === 'player' ? '胜利' : '失败');
    var sub = el('p', 'ca-overlay-sub', result.winner === 'player' ? '对方 6 名角色已全部阵亡' : '我方 6 名角色已全部阵亡');
    var again = el('button', 'ca-btn ca-btn-primary', '再来一局');
    again.addEventListener('click', function () {
      chosenRoles = [];
      app.classList.remove('ca-targeting');
      renderSetup();
    });
    box.appendChild(title);
    box.appendChild(sub);
    box.appendChild(again);
    overlay.appendChild(box);
    app.appendChild(overlay);
  }

  // ===== 初始化 =====
  function init() {
    app = document.getElementById('cardarena-app');
    if (!app) return;
    renderSetup();
    var engine = window.CardArena;
    engine.on('update', renderAll);
    engine.on('phase', function (phase) {
      if (phase === 'choose_target' || phase === 'choose_attack_target') {
        applyTargetingMode();
      }
    });
    engine.on('gameover', showGameOver);
    bindAppEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

- [ ] **Step 3: 验证语法**

Run: `node --check static/js/cardarena-ui.js`
Expected: 无输出（exit 0）

- [ ] **Step 4: 提交**

```bash
git add static/js/cardarena-ui.js
git commit -m "feat(cardarena): UI - 渲染/交互/目标选择/结算"
```

### Task 5: 样式 cardarena.css

**Files:**
- Create: `blog-static/static/css/cardarena.css`

- [ ] **Step 1: 创建样式文件**

```css
/* cardarena.css — CardArena 极简几何风 */
:root {
  --cardarena-bg: #f7fafc;
  --cardarena-panel: #ffffff;
  --cardarena-border: #cbd5e0;
  --cardarena-text: #2d3748;
  --cardarena-muted: #718096;
  --cardarena-primary: #2c5282;
  --cardarena-accent: #3182ce;
  --cardarena-danger: #c53030;
  --cardarena-success: #2f855a;
  --cardarena-target: #38a169;
}
[data-theme="dark"] {
  --cardarena-bg: #171923;
  --cardarena-panel: #1a202c;
  --cardarena-border: #2d3748;
  --cardarena-text: #e2e8f0;
  --cardarena-muted: #a0aec0;
}

#cardarena-app {
  max-width: 920px;
  margin: 0 auto;
  font-family: Inter, -apple-system, sans-serif;
  font-weight: 400;
  color: var(--cardarena-text);
  background: var(--cardarena-bg);
  padding: 16px;
  box-sizing: border-box;
  user-select: none;
}

/* ===== 开始界面 ===== */
.ca-setup-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 500;
  font-size: 1.6rem;
  margin: 0 0 4px;
  color: var(--cardarena-primary);
}
.ca-setup-sub {
  margin: 0 0 16px;
  color: var(--cardarena-muted);
  font-size: 0.9rem;
}
.ca-setup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.ca-setup-role {
  display: block;
  width: 100%;
  text-align: left;
  background: var(--cardarena-panel);
  border: 1px solid var(--cardarena-border);
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  color: var(--cardarena-text);
  font-family: inherit;
  font-weight: 400;
}
.ca-setup-role:hover {
  border-color: var(--cardarena-accent);
}
.ca-setup-role.selected {
  border-color: var(--cardarena-primary);
  background: #ebf8ff;
}
[data-theme="dark"] .ca-setup-role.selected {
  background: #1a365d;
}
.ca-setup-role-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 500;
  font-size: 1.1rem;
  margin-bottom: 4px;
}
.ca-setup-role-stat {
  font-size: 0.85rem;
  color: var(--cardarena-muted);
}
.ca-setup-role-intro {
  font-size: 0.85rem;
  margin: 6px 0;
  line-height: 1.4;
}
.ca-setup-role-passive {
  font-size: 0.8rem;
  color: var(--cardarena-muted);
}
.ca-setup-hint {
  margin: 8px 0 0;
  color: var(--cardarena-muted);
  font-size: 0.85rem;
}

/* ===== 通用按钮（扁平，非卡片）===== */
.ca-btn {
  background: transparent;
  border: 1px solid var(--cardarena-border);
  border-radius: 4px;
  padding: 6px 16px;
  font-family: inherit;
  font-weight: 400;
  font-size: 0.9rem;
  color: var(--cardarena-text);
  cursor: pointer;
}
.ca-btn:hover:not(:disabled) {
  border-color: var(--cardarena-accent);
  color: var(--cardarena-accent);
}
.ca-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ca-btn-primary {
  border-color: var(--cardarena-primary);
  color: var(--cardarena-primary);
}
.ca-btn-primary:hover:not(:disabled) {
  background: var(--cardarena-primary);
  color: #ffffff;
}

/* ===== 对局布局 ===== */
.ca-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ca-roster {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px;
  border: 1px solid var(--cardarena-border);
  border-radius: 6px;
  background: var(--cardarena-panel);
}
.ca-roster-label {
  font-size: 0.8rem;
  color: var(--cardarena-muted);
  width: 100%;
}
.ca-roster-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--cardarena-border);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
}
.ca-roster-chip.active {
  border-color: var(--cardarena-primary);
  color: var(--cardarena-primary);
}
.ca-roster-chip.dead {
  opacity: 0.4;
  text-decoration: line-through;
}
.ca-roster-chip.swappable {
  cursor: pointer;
}
.ca-roster-chip.swappable:hover {
  border-color: var(--cardarena-accent);
  color: var(--cardarena-accent);
}
.ca-roster-chip-hp {
  color: var(--cardarena-muted);
}
```
- [ ] **Step 2: 追加样式文件（后半部分）**

```css
/* ===== 英雄（出战角色）===== */
.ca-zone {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ca-hero {
  border: 1px solid var(--cardarena-border);
  border-radius: 6px;
  padding: 10px 12px;
  background: var(--cardarena-panel);
}
.ca-hero-player {
  border-color: var(--cardarena-primary);
}
.ca-hero-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 500;
  font-size: 1.15rem;
  margin-bottom: 2px;
}
.ca-hero-stats {
  font-size: 0.85rem;
  color: var(--cardarena-muted);
}
.ca-hero-mana {
  font-size: 0.85rem;
  color: var(--cardarena-accent);
  margin-top: 2px;
}
.ca-hero-passive {
  font-size: 0.8rem;
  color: var(--cardarena-muted);
  margin-top: 2px;
}

/* ===== 随从区 ===== */
.ca-board {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  min-height: 64px;
  padding: 8px;
  border: 1px dashed var(--cardarena-border);
  border-radius: 6px;
}
.ca-board-label {
  width: 100%;
  font-size: 0.75rem;
  color: var(--cardarena-muted);
}
.ca-minion {
  position: relative;
  min-width: 72px;
  padding: 8px;
  border: 1px solid var(--cardarena-border);
  border-radius: 6px;
  background: var(--cardarena-panel);
  text-align: center;
  font-size: 0.8rem;
}
.ca-minion-name {
  font-size: 0.85rem;
  margin-bottom: 2px;
}
.ca-minion-kv {
  font-size: 0.9rem;
  color: var(--cardarena-primary);
}
.ca-minion-kw {
  font-size: 0.7rem;
  color: var(--cardarena-muted);
}
.ca-minion.disabled {
  opacity: 0.55;
}

/* ===== 可攻击/可选中状态 ===== */
.attacker-selectable {
  cursor: crosshair;
}
.attacker-selectable:hover {
  outline: 1px solid var(--cardarena-accent);
}
.targetable {
  outline: 2px solid var(--cardarena-target);
  cursor: crosshair;
}

/* ===== 日志 ===== */
.ca-log {
  border: 1px solid var(--cardarena-border);
  border-radius: 6px;
  padding: 8px;
  background: var(--cardarena-panel);
}
.ca-log-label {
  font-size: 0.75rem;
  color: var(--cardarena-muted);
  margin-bottom: 4px;
}
.ca-log-list {
  max-height: 120px;
  overflow-y: auto;
}
.ca-log-line {
  font-size: 0.8rem;
  color: var(--cardarena-muted);
  line-height: 1.5;
}

/* ===== 手牌 ===== */
.ca-hand {
  border: 1px solid var(--cardarena-border);
  border-radius: 6px;
  padding: 8px;
  background: var(--cardarena-panel);
}
.ca-hand-label {
  font-size: 0.75rem;
  color: var(--cardarena-muted);
  margin-bottom: 6px;
}
.ca-hand-cards {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ca-card {
  position: relative;
  width: 132px;
  min-height: 96px;
  padding: 8px 8px 6px;
  border: 1px solid var(--cardarena-border);
  border-radius: 6px;
  background: var(--cardarena-panel);
  cursor: pointer;
  font-size: 0.8rem;
}
.ca-card:hover:not(.disabled) {
  border-color: var(--cardarena-accent);
}
.ca-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ca-card-cost {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  border-radius: 50%;
  background: var(--cardarena-primary);
  color: #ffffff;
  font-size: 0.8rem;
}
.ca-card-name {
  font-size: 0.9rem;
  margin-bottom: 4px;
  padding-right: 4px;
}
.ca-card-desc {
  font-size: 0.75rem;
  color: var(--cardarena-muted);
  line-height: 1.4;
}
.ca-card-kv {
  margin-top: 6px;
  font-size: 0.85rem;
  color: var(--cardarena-primary);
}

/* ===== 操作栏 ===== */
.ca-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.ca-actions-info {
  font-size: 0.85rem;
  color: var(--cardarena-muted);
}

/* ===== 结算遮罩 ===== */
.ca-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.ca-overlay-box {
  background: var(--cardarena-panel);
  border-radius: 8px;
  padding: 24px 32px;
  text-align: center;
}
.ca-overlay-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 500;
  font-size: 1.6rem;
  margin: 0 0 8px;
  color: var(--cardarena-primary);
}
.ca-overlay-sub {
  margin: 0 0 16px;
  color: var(--cardarena-muted);
  font-size: 0.9rem;
}

/* ===== 移动端 ===== */
@media (max-width: 640px) {
  #cardarena-app {
    padding: 10px;
  }
  .ca-card {
    width: 104px;
  }
  .ca-minion {
    min-width: 60px;
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add static/css/cardarena.css
git commit -m "feat(cardarena): 样式 - 极简几何风布局"
```

### Task 6: 页面模板与入口

**Files:**
- Create: `blog-static/layouts/_default/cardarena.html`
- Create: `blog-static/content/play/cardarena.md`
- Modify: `blog-static/layouts/_default/play.html:15-19`（games-grid 中新增卡片）

- [ ] **Step 1: 创建页面模板**

```html
{{ define "main" }}
<div class="cardarena-page">
  <header class="ca-page-header">
    <h1>CardArena</h1>
    <p class="ca-page-sub">多角色轮换卡牌对战 · 选择 6 名角色出战，击败对方全部角色</p>
  </header>
  <div id="cardarena-app"></div>
</div>
<link rel="stylesheet" href="/css/cardarena.css">
<script src="/js/cardarena-data.js"></script>
<script src="/js/cardarena-engine.js"></script>
<script src="/js/cardarena-ai.js"></script>
<script src="/js/cardarena-ui.js"></script>
<style>
  .main:has(.cardarena-page) {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .ca-page-header {
    max-width: 920px;
    margin: 0 auto;
    padding: 16px 16px 0;
  }
  .ca-page-header h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-weight: 500;
    font-size: 1.8rem;
    margin: 0 0 4px;
    color: var(--cardarena-primary, #2c5282);
  }
  .ca-page-sub {
    margin: 0;
    color: var(--cardarena-muted, #718096);
    font-size: 0.9rem;
  }
</style>
{{ end }}
```

- [ ] **Step 2: 创建内容声明文件** `content/play/cardarena.md`

```markdown
---
title: "CardArena"
description: "多角色轮换卡牌对战"
layout: "cardarena"
slug: "cardarena"
draft: false
---
```

- [ ] **Step 3: 修改 play.html 增加入口卡片**（在"关于我"卡片之后、"更多游戏"占位卡之前插入）

```html
    <a href="/play/cardarena/" class="game-card">
      <h2>CardArena</h2>
      <p>多角色轮换卡牌对战</p>
      <span class="game-tag">卡牌</span>
    </a>
```

- [ ] **Step 4: 验证构建**

Run: `hugo --minify --gc`（在 blog-static 目录）
Expected: 构建成功，无 ERROR（输出中 `/play/cardarena/` 出现）

- [ ] **Step 5: 提交**

```bash
git add layouts/_default/cardarena.html content/play/cardarena.md layouts/_default/play.html
git commit -m "feat(cardarena): 页面模板与娱乐中心入口"
```

### Task 7: 本地构建与手动测试

**Files:**
- 无新文件；运行验证

- [ ] **Step 1: 启动本地服务器**

Run: `hugo server -D`（在 blog-static 目录，后台运行）
Expected: 输出 `http://localhost:1313/`，无 ERROR

- [ ] **Step 2: 浏览器打开游戏页**

打开 `http://localhost:1313/play/cardarena/`，确认：
- 页面渲染"选择出战角色"界面，8 个角色卡片可见
- 选中 6 个角色后"开始对战"按钮可用，少于 6 个时禁用
- 页面无 emoji、无加粗文字、标题为 Playfair Display 字体

- [ ] **Step 3: 测试回合流程（DevTools Console 辅助）**

逐项验证（每项在浏览器中操作，对照预期）：

| 检查项 | 操作 | 预期 |
|--------|------|------|
| 首回合法力 | 开局后观察"法力 3 / 5" | 显示 3 / 5 |
| 出牌 | 点击可打出的随从卡 | 随从出现在我方随从区，法力减少 |
| 费用不足 | 点击灰色（disabled）手牌 | 无反应 |
| 法术选目标 | 点击"火弹" | 敌方随从/角色出现绿色高亮，点击目标后造成 2 点伤害 |
| 选目标取消 | 点击"火弹"后点击空白处 | 高亮消失，手牌未消耗 |
| 随从攻击 | 点击我方未行动随从，再点击敌方目标 | 双方血量按攻击力结算 |
| 嘲讽 | 敌方有嘲讽随从时点击攻击 | 只能选择嘲讽随从（其他目标不高亮） |
| 冲锋 | 召唤"突击兵" | 当回合即可攻击（可点击） |
| 圣盾 | 召唤"圣盾卫士"被攻击 | 不掉血，圣盾消失（日志记录） |
| 亡语 | "医师"被击杀 | 日志记录亡语生效（己方角色回 2 血） |
| 剧毒 | 数据中暂无带剧毒随从 | 跳过（engine 支持，卡牌未配置） |
| 风怒 | 召唤"暗影刺客" | 攻击两次后变为不可攻击 |
| 角色攻击 | 点击我方出战角色，再点击敌方目标 | 每回合一次，之后变灰 |
| 回合结束 | 点击"结束回合" | 法力 +2，轮到 AI 行动（操作按钮禁用） |
| 主动换人 | 点击我方候场存活角色 chip | 该角色上场，法力回满，本回合行动结束 |
| 被动换人 | 我方角色血量被打到 0 | 自动换下一个存活角色，手牌/卡组/法力重置 |
| 胜负结算 | 一方 6 角色全灭 | 弹出结算面板，点击"再来一局"回到选人界面 |

- [ ] **Step 4: 边界情况测试**

| 检查项 | 预期 |
|--------|------|
| 手牌满 5 张后再抽 | 不再抽入（手牌保持 5 张） |
| 随从位满 4 个再召唤 | 召唤被禁用/无效 |
| 全部候场角色阵亡 | 主动换人无响应（无 swappable chip） |
| 明暗主题切换 | 游戏界面颜色跟随主题变化 |
| 移动端宽度（DevTools 模拟 375px） | 布局不溢出，可正常操作 |

- [ ] **Step 5: 验证完成后停止本地服务器，提交验证结果（如发现 Bug 则修复后提交）**

```bash
git add -A
git commit -m "fix(cardarena): 手动测试修复"
```

---

### Task 8: 文档同步

**Files:**
- Modify: `blog-static/PROJECT_CONTEXT.md`（版本表 + 文件索引 + 功能列表）
- Modify: `blog-static/PROJECT_DOCUMENTATION.md`（v5.10 更新日志章节）
- Create: `blog-static/docs/CardArena-项目文档.md`

- [ ] **Step 1: 更新 PROJECT_CONTEXT.md**

定位"版本历史"表格，将当前版本 v5.9 更新为 v5.10，并在对应版本行追加：

```
v5.10 | 娱乐中心新增 CardArena 多角色轮换卡牌对战（模块化 JS 架构，纯前端，8 角色选 6 + 独立卡组 + 6 关键词 + 基础 AI）
```

在文件索引/目录树中追加 5 个新文件（cardarena-data.js / cardarena-engine.js / cardarena-ai.js / cardarena-ui.js / cardarena.css / cardarena.html / content/play/cardarena.md）。

- [ ] **Step 2: 更新 PROJECT_DOCUMENTATION.md**

在版本演进表追加 v5.10 行，并在更新日志区域追加 v5.10 章节：

```markdown
## v5.10 CardArena 多角色轮换卡牌对战

**发布日期**: 2026-08-01
**范围**: 游戏板块新增 CardArena

### 功能
- 双方各选 6 个角色轮流出战（玩家从 8 角色池选 6，AI 随机 6），一方 6 角色全灭判负
- 每角色独立专属卡组（6 张，含 1-2 张专属特殊卡）+ 独立法力（上限 5，回合结束回复 2，主动换人回满）
- 随从战场（上限 4）+ 6 关键词（嘲讽/冲锋/亡语/圣盾/剧毒/风怒）
- 主动换人消耗整个回合；被动换人（角色阵亡）后当回合可继续行动
- 手牌上限 5；首回合 3 费；回合结束法力 +2
- 基础贪心 AI（出牌→攻击→换人）

### 架构（模块化，区别于 SleepTown 单文件）
| 文件 | 职责 |
|------|------|
| `static/js/cardarena-data.js` | 数据驱动层（GAME_CONFIG/ROLE_POOL/CARDS），用户可自行修改 |
| `static/js/cardarena-engine.js` | 纯状态机引擎（回合/出牌/战斗/关键词/换人/胜负），不碰 DOM |
| `static/js/cardarena-ai.js` | AI 三阶段贪心决策 |
| `static/js/cardarena-ui.js` | DOM 渲染与交互（事件委托 + 选目标高亮） |
| `static/css/cardarena.css` | 极简几何风样式，`--cardarena-*` 定义在 `:root` |
| `layouts/_default/cardarena.html` | 页面模板（固定加载顺序 data→engine→ai→ui） |

### 关键设计
- 视觉硬约束：无 emoji、无粗体、无卡片式按钮、冷色系几何风
- `.main:has(.cardarena-page)` 突破 PaperMod 768px 约束
- 法术/被动/亡语统一 effect.kind 枚举（damage/heal/draw/buff/summon/board_clear）
- 随从带 `side` 引用，死亡结算/亡语按所属方触发
- AI 直接操作 side 状态对象，复用 engine `_internal` 接口
```

- [ ] **Step 3: 创建板块文档** `docs/CardArena-项目文档.md`

```markdown
# CardArena 多角色轮换卡牌对战 项目文档

> **访问地址**: https://deepsleep.fun/play/cardarena/
> **版本**: P0 核心对战（v1.0.0）
> **技术栈**: Hugo 布局模板 + 原生 JS（模块化）+ CSS Variables

## 玩法
双方各 6 个角色轮流出战。每回合用出战角色专属卡组出牌、召唤随从、发动攻击。角色血量归 0 自动换上下一角色（被动换人），也可主动换人（消耗整个回合，法力回满）。一方 6 个角色全部阵亡判负。

## 自定义角色与卡牌
修改 `static/js/cardarena-data.js`：
- `GAME_CONFIG`: 手牌上限/法力/回复等数值
- `ROLE_POOL`: 角色池（名字/血量/攻击/被动/卡组）
- `CARDS`: 卡牌定义（type/cost/attack/health/keywords/effect）

## 文件结构
| 文件 | 职责 |
|------|------|
| `static/js/cardarena-data.js` | 数据驱动层（用户可改） |
| `static/js/cardarena-engine.js` | 引擎状态机 |
| `static/js/cardarena-ai.js` | AI 策略 |
| `static/js/cardarena-ui.js` | UI 渲染与交互 |
| `static/css/cardarena.css` | 样式 |
| `layouts/_default/cardarena.html` | 页面模板 |

## 加载顺序
`cardarena-data.js → cardarena-engine.js → cardarena-ai.js → cardarena-ui.js`

## 已知限制（P0）
- 单机 vs AI，无多人、无持久化（刷新丢失进度）
- 无主动技能（角色 active 字段预留未启用）
- AI 为贪心策略，无复杂战术
```

- [ ] **Step 4: 提交文档**

```bash
git add PROJECT_CONTEXT.md PROJECT_DOCUMENTATION.md docs/CardArena-项目文档.md
git commit -m "docs(cardarena): 同步项目文档 v5.10"
```

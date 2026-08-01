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

  // 苏丹卡品级：黄金 / 白银 / 青铜 / 岩石（法术按费用，随从按战力）
  function cardTier(c) {
    if (c.type === 'spell') {
      if (c.cost >= 4) return 'gold';
      if (c.cost >= 2) return 'silver';
      return 'bronze';
    }
    var power = (c.attack || 0) + (c.health || 0);
    if (power >= 8) return 'gold';
    if (power >= 5) return 'silver';
    if (power >= 3) return 'bronze';
    return 'stone';
  }

  // ===== 开始界面：选择 6 个角色 =====
  // 角色品级：战力 = maxHealth + attack
  function roleTier(r) {
    var power = r.maxHealth + r.attack;
    if (power >= 23) return 'gold';
    if (power >= 20) return 'silver';
    if (power >= 18) return 'bronze';
    return 'stone';
  }
  function renderSetup() {
    app.innerHTML = '';
    var box = el('div', 'ca-setup');
    var title = el('h2', 'ca-setup-title', '选择出战角色');
    var sub = el('p', 'ca-setup-sub', '从 8 个角色中选择 6 个出战，AI 将随机挑选 6 个。点击角色卡翻转选卡');
    box.appendChild(title);
    box.appendChild(sub);

    var grid = el('div', 'ca-setup-grid');
    DATA.ROLE_POOL.forEach(function (role) {
      var tier = roleTier(role);
      var card = el('button', 'ca-setup-role tier-' + tier);
      card.dataset.role = role.id;

      var inner = el('span', 'ca-role-inner');

      // 正面
      var front = el('span', 'ca-role-face ca-role-front');
      ['tl', 'tr', 'bl', 'br'].forEach(function (pos) {
        front.appendChild(el('span', 'ca-card-corner ' + pos));
      });
      // 顶饰金线（极繁装饰）
      var topline = el('span', 'ca-role-topline');
      topline.appendChild(el('b', null));
      front.appendChild(topline);
      // 品级缎带（英文宫衔）
      front.appendChild(el('div', 'ca-role-band', role.titleEn || ''));
      var art = el('div', 'ca-role-art');
      // 纯几何徽记：外八角星 + 内八角星 + 中心宝石（无汉字）
      art.appendChild(el('span', 'ca-role-star-outer'));
      art.appendChild(el('span', 'ca-role-star-inner'));
      art.appendChild(el('span', 'ca-role-gem'));
      front.appendChild(art);
      front.appendChild(el('div', 'ca-setup-role-name', role.name));
      front.appendChild(el('div', 'ca-setup-role-intro', role.intro));
      var stats = el('div', 'ca-role-stats');
      var hp = el('span', 'ca-role-stat ca-role-stat-hp', '\u2764 ' + role.maxHealth);
      var atk = el('span', 'ca-role-stat ca-role-stat-atk', '\u2694 ' + role.attack);
      stats.appendChild(hp);
      stats.appendChild(atk);
      front.appendChild(stats);
      front.appendChild(el('div', 'ca-setup-role-passive', '被动: ' + (role.passive ? describePassive(role.passive) : '无')));
      inner.appendChild(front);

      // 背面（已出战印版）
      var back = el('span', 'ca-role-face ca-role-back');
      back.appendChild(el('span', 'ca-role-back-star-outer ca-role-star-outer'));
      back.appendChild(el('span', 'ca-role-back-star-inner ca-role-star-inner'));
      back.appendChild(el('span', 'ca-role-back-gem ca-role-gem'));
      back.appendChild(el('div', 'ca-role-back-name', role.name));
      back.appendChild(el('div', 'ca-role-back-mark', 'ON DUTY'));
      inner.appendChild(back);

      card.appendChild(inner);
      // 闪光层
      card.appendChild(el('span', 'ca-role-shine'));
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
      var isChosen = chosenRoles.indexOf(c.dataset.role) !== -1;
      var changed = c.classList.contains('selected') !== isChosen;
      c.classList.toggle('selected', isChosen);
      if (changed) {
        // 翻转闪光特效：移除旧动画后强制重排再播放
        c.classList.remove('flipping');
        void c.offsetWidth;
        c.classList.add('flipping');
        setTimeout(function () { c.classList.remove('flipping'); }, 650);
      }
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
    // 对局已结束：结算弹窗已由 showGameOver 渲染，跳过重建以免清掉 overlay
    if (s.phase === 'gameover') return;
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
    if (sideName === 'player') {
      hero.classList.add('attacker-selectable');
      // 本回合已攻击或攻击力为 0 时置为不可攻击态（对齐随从的 disabled 表现）
      if (side.roleAttacked || role.attack === 0) hero.classList.add('disabled');
    }
    var name = el('div', 'ca-hero-name', role.name);
    var stats = el('div', 'ca-hero-stats', (role.title ? role.title + ' · ' : '') + role.health + ' / ' + role.maxHealth + ' 生命 · ' + role.attack + ' 攻击');
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
      // 按战力映射品级（黄金/白银/青铜/岩石）
      var mp = (m.attack || 0) + (m.health || 0);
      if (mp >= 8) cell.classList.add('ca-minion-tier-gold');
      else if (mp >= 5) cell.classList.add('ca-minion-tier-silver');
      else if (mp >= 3) cell.classList.add('ca-minion-tier-bronze');
      else cell.classList.add('ca-minion-tier-stone');
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
      // 苏丹卡品级（黄金/白银/青铜/岩石）
      var tier = cardTier(c);
      cardEl.classList.add('ca-card-tier-' + tier);
      // 四角卷草纹角饰
      ['tl', 'tr', 'bl', 'br'].forEach(function (pos) {
        var corner = el('div', 'ca-card-corner ' + pos);
        cardEl.appendChild(corner);
      });
      // 品级缎带
      var tierNames = { gold: 'GOLD', silver: 'SILVER', bronze: 'BRONZE', stone: 'STONE' };
      var band = el('div', 'ca-card-tier-band', tierNames[tier] || '');
      cardEl.appendChild(band);
      // 费用宝石（圆形）
      var cost = el('div', 'ca-card-cost');
      var costNum = el('span', null, String(c.cost));
      cost.appendChild(costNum);
      cardEl.appendChild(cost);
      // 中央八角星徽
      var art = el('div', 'ca-card-art');
      art.appendChild(el('div', 'ca-card-star'));
      cardEl.appendChild(art);
      var nm = el('div', 'ca-card-name', c.name);
      var body = el('div', 'ca-card-desc', c.desc);
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
    // 高亮合法目标（按目标所属方：治疗/增益高亮己方，伤害/攻击高亮敌方）
    valid.forEach(function (t) {
      var sideStr = t.side || 'enemy';
      if (t.kind === 'hero') {
        var heroEl = app.querySelector('.ca-hero-' + sideStr);
        if (heroEl) heroEl.classList.add('targetable');
      } else {
        var cell = app.querySelector('.ca-minion[data-uid="' + t.uid + '"]');
        if (cell && cell.dataset.side === sideStr) cell.classList.add('targetable');
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
          // 按被点击元素的 data-side 判断目标所属方（治疗选己方 / 攻击选敌方）
          var sideStr = node.dataset.side || 'enemy';
          var target = null;
          if (node.dataset.uid) {
            target = { kind: 'minion', side: sideStr, uid: node.dataset.uid };
          } else {
            target = { kind: 'hero', side: sideStr };
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

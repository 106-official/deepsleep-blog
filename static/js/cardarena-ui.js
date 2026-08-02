// cardarena-ui.js — CardArena 界面渲染与交互
(function () {
  'use strict';
  var DATA = window.CARDARENA_DATA;
  var CONFIG = DATA.GAME_CONFIG;
  var app = null;
  var chosenRoles = [];       // 玩家选择的 6 个角色 id
  var prevState = null;       // 上一次渲染的状态快照（用于特效对比）
  var pendingAction = null;   // UI 发起的操作记录（攻击者等特效信息）

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

  // 品级英文名（缎带）
  function tierEn(t) {
    return { gold: 'GOLD', silver: 'SILVER', bronze: 'BRONZE', stone: 'STONE' }[t] || '';
  }

  // 随从关键词中文化（引擎存英文，界面显示中文）
  var KW_ZH = { taunt: '嘲讽', charge: '冲锋', deathrattle: '亡语', divine_shield: '圣盾', windfury: '风怒', poison: '剧毒' };
  function kwText(list) {
    return list.map(function (k) { return KW_ZH[k] || k; }).join(' · ');
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
    // 特效分析：清空前捕获旧 DOM 位置，再对比前后状态
    var oldRects = captureRects();
    var fx = analyzeFx(s, prevState, oldRects);
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
    applyFx(fx);
    prevState = snapshot(s);
    pendingAction = null;
  }

  // ===== 特效系统 =====
  // 状态快照（存值，避免引用被引擎就地修改）
  function snapSide(side) {
    var r = side.roster[side.activeIndex];
    return {
      activeIndex: side.activeIndex,
      hero: r ? { health: r.health, alive: r.alive, id: r.id, name: r.name, attack: r.attack, maxHealth: r.maxHealth } : null,
      hand: side.hand.slice(),
      minions: side.board.filter(function (m) { return m.health > 0; }).map(function (m) {
        return { uid: m.uid, health: m.health };
      })
    };
  }
  function snapshot(s) {
    return { player: snapSide(s.player), enemy: snapSide(s.enemy) };
  }

  // 捕获当前 DOM 中关键元素的屏幕位置（供特效定位）
  function captureRects() {
    var rects = {};
    app.querySelectorAll('.ca-hero').forEach(function (h) {
      rects['hero:' + h.dataset.side] = h.getBoundingClientRect();
    });
    app.querySelectorAll('.ca-minion[data-uid]').forEach(function (m) {
      rects['minion:' + m.dataset.side + ':' + m.dataset.uid] = m.getBoundingClientRect();
    });
    app.querySelectorAll('.ca-roster-chip[data-side]').forEach(function (c) {
      rects['chip:' + c.dataset.side + ':' + c.dataset.roleIndex] = c.getBoundingClientRect();
    });
    return rects;
  }

  // 计算手牌中「净新增」的牌数（按 id 计数值对比，正确处理重复牌）
  function gainedCards(oldHand, newHand) {
    var oldC = {}, newC = {}, gained = 0;
    (oldHand || []).forEach(function (id) { oldC[id] = (oldC[id] || 0) + 1; });
    (newHand || []).forEach(function (id) {
      newC[id] = (newC[id] || 0) + 1;
      if (newC[id] > (oldC[id] || 0)) gained++;
    });
    return gained;
  }

  // 对比前后状态，产出特效清单
  function analyzeFx(s, prev, rects) {
    var fx = { dmg: [], heal: [], deaths: [], summons: [], swap: null, draw: null, attacker: null };
    if (!prev) return fx;
    ['player', 'enemy'].forEach(function (sn) {
      var ns = s[sn];
      var ps = prev[sn];
      // ---- 抽牌（手牌净新增；换人时跳过，避免与幽灵卡重叠）----
      if (!fx.swap) {
        var gained = gainedCards(ps.hand, ns.hand);
        if (gained > 0) fx.draw = { side: sn, count: gained };
      }
      // ---- 随从（引擎状态用 board 字段，快照用 minions 字段）----
      var cur = {}, old = {};
      (ns.board || []).forEach(function (m) { if (m.health > 0) cur[m.uid] = m.health; });
      ps.minions.forEach(function (m) { old[m.uid] = m.health; });
      Object.keys(old).forEach(function (uid) {
        if (!cur[uid]) fx.deaths.push({ side: sn, kind: 'minion', rect: rects['minion:' + sn + ':' + uid] });
      });
      (ns.board || []).forEach(function (m) {
        if (m.health <= 0) return;
        if (old[m.uid] === undefined) {
          fx.summons.push({ side: sn, uid: m.uid });
        } else if (old[m.uid] > m.health) {
          fx.dmg.push({ side: sn, kind: 'minion', uid: m.uid, amount: old[m.uid] - m.health });
        } else if (old[m.uid] < m.health) {
          fx.heal.push({ side: sn, kind: 'minion', uid: m.uid, amount: m.health - old[m.uid] });
        }
      });
      // ---- 出战角色（引擎 side 无 hero 字段，取 roster[activeIndex]）----
      var nsRole = ns.roster[ns.activeIndex];
      if (ps.hero && nsRole) {
        if (ps.activeIndex === ns.activeIndex) {
          if (nsRole.health < ps.hero.health) {
            fx.dmg.push({ side: sn, kind: 'hero', amount: ps.hero.health - nsRole.health });
          } else if (nsRole.health > ps.hero.health) {
            fx.heal.push({ side: sn, kind: 'hero', amount: nsRole.health - ps.hero.health });
          }
        } else {
          // 换人（主动或阵亡切换）
          var oldRole = s[sn].roster[ps.activeIndex];
          var roleDead = oldRole && !oldRole.alive;
          if (roleDead) {
            if (ps.hero.health > 0) fx.dmg.push({ side: sn, kind: 'hero', amount: ps.hero.health, dead: true, rect: rects['hero:' + sn] });
            fx.deaths.push({ side: sn, kind: 'hero', rect: rects['hero:' + sn] });
          }
          fx.swap = {
            side: sn,
            fromIndex: ps.activeIndex,
            fromRect: rects['chip:' + sn + ':' + ps.activeIndex],
            role: nsRole
          };
        }
      }
    });
    // 攻击者前倾（仅玩家操作触发）
    if (pendingAction && pendingAction.type === 'attack') fx.attacker = pendingAction.attacker;
    return fx;
  }

  // 在渲染完成后播放特效
  function applyFx(fx) {
    if (!fx) return;
    // 攻击者前倾
    if (fx.attacker) {
      var atkEl = fx.attacker.kind === 'hero'
        ? app.querySelector('.ca-hero-player')
        : app.querySelector('.ca-minion[data-uid="' + fx.attacker.uid + '"]');
      if (atkEl) atkEl.classList.add('ca-lunge');
    }
    // 伤害：飘字 + 受击闪光 + 冲击波
    fx.dmg.forEach(function (d) {
      var el2 = d.kind === 'hero'
        ? app.querySelector('.ca-hero-' + d.side)
        : app.querySelector('.ca-minion[data-uid="' + d.uid + '"]');
      var rect = el2 ? el2.getBoundingClientRect() : d.rect;
      if (!rect) return;
      playFloating(d.amount, rect, 'dmg');
      if (el2) {
        el2.classList.remove('ca-hit');
        void el2.offsetWidth;
        el2.classList.add('ca-hit');
        var imp = el('div', 'ca-fx ca-fx-impact');
        el2.appendChild(imp);
        setTimeout(function () { imp.remove(); }, 600);
      } else {
        playImpactAt(rect);
      }
    });
    // 治疗飘字
    fx.heal.forEach(function (h) {
      var el2 = h.kind === 'hero'
        ? app.querySelector('.ca-hero-' + h.side)
        : app.querySelector('.ca-minion[data-uid="' + h.uid + '"]');
      var rect = el2 ? el2.getBoundingClientRect() : null;
      if (rect) playFloating(h.amount, rect, 'heal');
    });
    // 死亡化灰烬
    fx.deaths.forEach(function (d) {
      if (d.rect) playAshes(d.rect.left + d.rect.width / 2, d.rect.top + d.rect.height / 2);
    });
    // 召唤翻转入场
    fx.summons.forEach(function (sm) {
      var m = app.querySelector('.ca-minion[data-uid="' + sm.uid + '"]');
      if (m) {
        m.classList.remove('ca-minion-enter');
        void m.offsetWidth;
        m.classList.add('ca-minion-enter');
      }
    });
    // 换人 3D 幽灵卡翻飞
    if (fx.swap) playGhostSwap(fx.swap);
    // 抽牌：幻影牌从界面右侧 3D 翻入手牌区
    if (fx.draw && fx.draw.side === 'player' && fx.draw.count > 0) {
      var handCards = app.querySelectorAll('.ca-hand-cards .ca-card');
      if (handCards.length > 0) {
        playDrawFx(fx.draw.count, handCards[handCards.length - 1].getBoundingClientRect());
      }
    }
  }

  // 伤害/治疗飘字（fixed 定位到 body，不受重渲染影响）
  function playFloating(amount, rect, kind) {
    var fx = el('div', 'ca-fx ca-fx-' + kind, (kind === 'dmg' ? '-' : '+') + amount);
    fx.style.left = Math.round(rect.left + rect.width / 2) + 'px';
    fx.style.top = Math.round(rect.top + rect.height * 0.08) + 'px';
    document.body.appendChild(fx);
    setTimeout(function () { fx.remove(); }, 1100);
  }

  // 冲击波（目标已消失时定点播放）
  function playImpactAt(rect) {
    var imp = el('div', 'ca-fx ca-fx-impact');
    imp.style.left = Math.round(rect.left + rect.width / 2) + 'px';
    imp.style.top = Math.round(rect.top + rect.height / 2) + 'px';
    document.body.appendChild(imp);
    setTimeout(function () { imp.remove(); }, 600);
  }

  // 死亡：化为灰烬（金棕粒子 + 烟尘）
  function playAshes(cx, cy) {
    var wrap = el('div', 'ca-ashes');
    document.body.appendChild(wrap);
    for (var i = 0; i < 22; i++) {
      var ash = el('span', 'ca-ash');
      ash.style.setProperty('--ax', cx + 'px');
      ash.style.setProperty('--ay', cy + 'px');
      ash.style.setProperty('--as', (4 + Math.random() * 6).toFixed(1) + 'px');
      ash.style.setProperty('--adx', (Math.random() * 70 - 35).toFixed(1) + 'px');
      ash.style.setProperty('--ar', (Math.random() * 400 - 200).toFixed(1) + 'deg');
      ash.style.setProperty('--ad', (0.9 + Math.random() * 0.7).toFixed(2) + 's');
      ash.style.setProperty('--al', (Math.random() * 0.28).toFixed(2) + 's');
      wrap.appendChild(ash);
    }
    var puff = el('span', 'ca-ash-puff');
    puff.style.setProperty('--ax', cx + 'px');
    puff.style.setProperty('--ay', cy + 'px');
    wrap.appendChild(puff);
    setTimeout(function () { wrap.remove(); }, 1700);
  }

  // 换人：幽灵卡从角色牌区 3D 翻开飞向出战区
  function heroTier(r) {
    if (!r) return 'gold';
    var p = (r.maxHealth || 0) + (r.attack || 0);
    if (p >= 23) return 'gold';
    if (p >= 20) return 'silver';
    if (p >= 18) return 'bronze';
    return 'stone';
  }
  function playGhostSwap(swap) {
    var fromRect = swap.fromRect;
    if (!fromRect) return;
    var toEl = app.querySelector('.ca-hero-' + swap.side);
    if (!toEl) return;
    var toRect = toEl.getBoundingClientRect();
    var role = swap.role;
    var ghost = el('div', 'ca-ghost');
    ghost.style.left = Math.round(fromRect.left + fromRect.width / 2 - 58) + 'px';
    ghost.style.top = Math.round(fromRect.top + fromRect.height / 2 - 78) + 'px';
    ghost.style.setProperty('--ca-ghost-tier', 'var(--ca-tier-' + heroTier(role) + ')');
    var front = el('div', 'ca-ghost-face ca-ghost-front');
    front.appendChild(el('div', 'ca-ghost-title', role ? role.name : ''));
    front.appendChild(el('div', 'ca-ghost-star'));
    front.appendChild(el('div', 'ca-ghost-kv', role ? (role.attack + ' / ' + role.health) : ''));
    var back = el('div', 'ca-ghost-face ca-ghost-back');
    back.appendChild(el('div', 'ca-ghost-mark', 'ON DUTY'));
    ghost.appendChild(front);
    ghost.appendChild(back);
    document.body.appendChild(ghost);

    var dx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
    var dy = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);

    var anim = ghost.animate([
      { transform: 'translate(0px, 0px) rotateY(0deg) scale(1)', offset: 0 },
      { transform: 'translate(' + Math.round(dx * 0.5) + 'px, ' + Math.round(dy * 0.5 - 46) + 'px) rotateY(88deg) scale(1.06)', offset: 0.5 },
      { transform: 'translate(' + Math.round(dx) + 'px, ' + Math.round(dy - 6) + 'px) rotateY(180deg) scale(0.94)', offset: 1 }
    ], { duration: 820, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
    anim.onfinish = function () {
      ghost.remove();
      burstSparks(Math.round(toRect.left + toRect.width / 2), Math.round(toRect.top + toRect.height / 2), 14);
      var heroEl = app.querySelector('.ca-hero-' + swap.side);
      if (heroEl) {
        heroEl.classList.remove('ca-hero-enter');
        void heroEl.offsetWidth;
        heroEl.classList.add('ca-hero-enter');
      }
    };
  }

  // 落地金尘火花
  function burstSparks(cx, cy, n) {
    for (var i = 0; i < n; i++) {
      var sp = el('span', 'ca-spark');
      sp.style.left = cx + 'px';
      sp.style.top = cy + 'px';
      var ang = Math.random() * Math.PI * 2;
      var dist = 26 + Math.random() * 46;
      sp.style.setProperty('--sdx', Math.round(Math.cos(ang) * dist) + 'px');
      sp.style.setProperty('--sdy', Math.round(Math.sin(ang) * dist) + 'px');
      document.body.appendChild(sp);
      (function (n2) { setTimeout(function () { n2.remove(); }, 800); })(sp);
    }
  }

  // 抽牌：幻影牌从界面右侧 3D 翻转到手牌区（卡背朝外 → 正面落地，立体感）
  function playDrawFx(count, lastCardRect) {
    var n = Math.min(count, 3);
    for (var i = 0; i < n; i++) {
      var ghost = el('div', 'ca-draw-ghost');
      var front = el('div', 'ca-draw-face ca-draw-front');
      front.appendChild(el('div', 'ca-draw-band', 'GOLD'));
      front.appendChild(el('div', 'ca-draw-star'));
      var back = el('div', 'ca-draw-face ca-draw-back');
      back.appendChild(el('div', 'ca-draw-mark', 'ON DUTY'));
      ghost.appendChild(front);
      ghost.appendChild(back);
      document.body.appendChild(ghost);

      // 起点：视口右侧中部，多张时纵向错落成扇形
      var startX = window.innerWidth + 30 + i * 26;
      var startY = window.innerHeight * (0.28 + i * 0.10) + (Math.random() * 20 - 10);
      // 终点：手牌区最后一张（抽到的牌）的位置，多张时依次向左
      var endX = Math.round(lastCardRect.right - 34 - i * 84);
      var endY = Math.round(lastCardRect.top + lastCardRect.height / 2 - 48);
      var dx = endX - startX;
      var dy = endY - startY;
      ghost.style.left = startX + 'px';
      ghost.style.top = startY + 'px';

      var anim = ghost.animate([
        { transform: 'perspective(700px) translate(0px, 0px) rotateY(120deg) rotateZ(9deg) scale(1)', opacity: 0.95, offset: 0 },
        { transform: 'perspective(700px) translate(' + Math.round(dx * 0.72) + 'px, ' + Math.round(dy * 0.55 - 42) + 'px) rotateY(62deg) rotateZ(0deg) scale(1.08)', opacity: 1, offset: 0.62 },
        { transform: 'perspective(700px) translate(' + Math.round(dx) + 'px, ' + Math.round(dy) + 'px) rotateY(0deg) rotateZ(0deg) scale(0.96)', opacity: 0, offset: 1 }
      ], { duration: 780, delay: i * 110, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
      (function (g) {
        anim.onfinish = function () { g.remove(); };
      })(ghost);
      // 落地金尘
      (function (x, y, d) {
        setTimeout(function () { burstSparks(x, y, 5); }, 780 + d);
      })(endX, endY, i * 110);
    }
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
        (function (idx) {
          chip.addEventListener('click', function () {
            pendingAction = { type: 'swap', roleIndex: idx };
            window.CardArena.swapRole(idx);
          });
        })(i);
      }
      bar.appendChild(chip);
    });
    return bar;
  }

  function buildHeroView(side, sideName) {
    var role = side.roster[side.activeIndex];
    var def = DATA.ROLE_POOL.find(function (r) { return r.id === role.id; });
    var hero = el('div', 'ca-hero ca-hero-' + sideName);
    hero.dataset.side = sideName;
    if (sideName === 'player') {
      hero.classList.add('attacker-selectable');
      // 本回合已攻击或攻击力为 0 时置为不可攻击态（对齐随从的 disabled 表现）
      if (side.roleAttacked || role.attack === 0) hero.classList.add('disabled');
    }
    // 宫廷光环（旋转珠环 + 双圆环，作为背景圣徽）
    hero.appendChild(el('span', 'ca-role-halo'));
    hero.appendChild(el('span', 'ca-role-ring'));
    // 英文宫衔（细字距 + 左右渐隐金线）
    if (def && def.titleEn) hero.appendChild(el('div', 'ca-hero-en', def.titleEn));
    var name = el('div', 'ca-hero-name', role.name);
    var stats = el('div', 'ca-hero-stats', (role.title ? role.title + ' · ' : '') + role.health + ' / ' + role.maxHealth + ' 生命 · ' + role.attack + ' 攻击');
    var mana = el('div', 'ca-hero-mana', sideName === 'player' ? '法力 ' + side.mana + ' / ' + side.maxMana : '');
    var passive = el('div', 'ca-hero-passive', role.passive ? '被动: ' + describePassive(role.passive) : '');
    hero.appendChild(name);
    hero.appendChild(stats);
    if (sideName === 'player') hero.appendChild(mana);
    hero.appendChild(passive);
    // 右上角八角星水印
    hero.appendChild(el('span', 'ca-hero-star'));
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
      var tier = mp >= 8 ? 'gold' : (mp >= 5 ? 'silver' : (mp >= 3 ? 'bronze' : 'stone'));
      cell.classList.add('ca-minion-tier-' + tier);
      if (sideName === 'player') {
        cell.classList.add('attacker-selectable');
        if (m.exhausted || m.attack === 0) cell.classList.add('disabled');
      }
      // 宫廷光环（背景圣徽）
      cell.appendChild(el('span', 'ca-minion-halo'));
      cell.appendChild(el('span', 'ca-minion-ring'));
      // 品级缎带（英文品级）
      cell.appendChild(el('div', 'ca-minion-band', tierEn(tier)));
      // 徽记区：八角星徽
      var art = el('div', 'ca-minion-art');
      art.appendChild(el('div', 'ca-minion-star'));
      cell.appendChild(art);
      var nm = el('div', 'ca-minion-name', m.name);
      cell.appendChild(nm);
      // 攻/血（菱形宝石数值框）
      var kv = el('div', 'ca-minion-kv');
      kv.appendChild(el('b', null, String(m.attack)));
      kv.appendChild(el('b', null, String(m.health)));
      cell.appendChild(kv);
      if (m.keywords && m.keywords.length) {
        var kw = el('div', 'ca-minion-kw', kwText(m.keywords));
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
      // 宫廷光环（背景圣徽，位于星徽之后）
      cardEl.appendChild(el('span', 'ca-card-halo'));
      cardEl.appendChild(el('span', 'ca-card-ring'));
      // 四角卷草纹角饰
      ['tl', 'tr', 'bl', 'br'].forEach(function (pos) {
        var corner = el('div', 'ca-card-corner ' + pos);
        cardEl.appendChild(corner);
      });
      // 品级缎带
      var band = el('div', 'ca-card-tier-band', tierEn(tier));
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
          pendingAction = { type: 'play', handIndex: parseInt(node.dataset.handIndex, 10) };
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
        pendingAction = { type: 'attack', attacker: att };
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

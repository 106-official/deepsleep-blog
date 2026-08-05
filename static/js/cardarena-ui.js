// cardarena-ui.js — CardArena 界面渲染与交互
(function () {
  'use strict';
  var DATA = window.CARDARENA_DATA;
  var CONFIG = DATA.GAME_CONFIG;
  var app = null;
  var chosenRoles = [];       // 玩家选择的 6 个角色 id
  var prevState = null;       // 上一次渲染的状态快照（用于特效对比）
  var pendingAction = null;   // UI 发起的操作记录（攻击者等特效信息）
  var wasFull = false;        // 上一次 toggleRole 时是否已选满 6 张（用于「集结完成」只触发一次）
  var aiAttacker = null;      // AI 攻击时的前倾特效来源（区别于玩家的 pendingAction）
  var vsShownThisGame = false; // 对阵报幕 VS 每局只播一次
  var caDealt = false;         // 首次发牌错峰入场只播一次（renderAll 重建会重播，故用闸门）
  var ambientReady = false;    // 环境层呼吸浮层只在 body 上建一次（不参与 renderAll 重建）

  // ===== 演出节奏：速度档位（正常 1x / 快速 2x），localStorage 持久化 =====
  var SPEED_KEY = 'cardarena_speed';
  function getSpeed() {
    try { return localStorage.getItem(SPEED_KEY) === '2' ? 2 : 1; } catch (e) { return 1; }
  }
  function setSpeed(v) {
    try { localStorage.setItem(SPEED_KEY, String(v)); } catch (e) {}
  }
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 演出时长换算：reduce-motion 近乎瞬发；快速档减半
  function pace(ms) {
    if (reduceMotion) return Math.min(ms, 60);
    return getSpeed() === 2 ? Math.round(ms / 2) : ms;
  }

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
    DATA.ROLE_POOL.forEach(function (role, i) {
      var tier = roleTier(role);
      var card = el('button', 'ca-setup-role tier-' + tier);
      card.dataset.role = role.id;
      card.style.setProperty('--i', i);

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
    var full = chosenRoles.length === 6;
    if (startBtn) startBtn.disabled = !full;
    // 队伍集结完成：六张卡金线连结 + 计数器闪金（不阻塞操作）
    if (full && !wasFull) playRosterComplete();
    wasFull = full;
  }

  // 选满 6 张的仪式反馈：选中卡依次镀金脉冲 + 计数器闪金 + 开始按钮点亮
  function playRosterComplete() {
    var chosen = app.querySelectorAll('.ca-setup-role.selected');
    chosen.forEach(function (c, i) {
      c.style.setProperty('--ci', i);
      c.classList.remove('ca-linked');
      void c.offsetWidth;
      c.classList.add('ca-linked');
      setTimeout(function () { c.classList.remove('ca-linked'); }, 900);
    });
    var count = app.querySelector('#ca-count');
    if (count) {
      count.classList.remove('ca-count-full');
      void count.offsetWidth;
      count.classList.add('ca-count-full');
    }
    var btn = app.querySelector('#ca-start');
    if (btn) {
      btn.classList.remove('ca-btn-ready');
      void btn.offsetWidth;
      btn.classList.add('ca-btn-ready');
    }
  }

  function startGame() {
    if (chosenRoles.length !== 6) return;
    vsShownThisGame = false;   // 新对局：允许再次播放对阵报幕
    caDealt = false;           // 新对局：允许再次播放发牌入场
    var startBtn = app.querySelector('#ca-start');
    if (startBtn) { startBtn.disabled = true; startBtn.textContent = '出征…'; }
    // 未被选择的卡牌化为灰烬消失；选中的卡牌亮起
    var allCards = app.querySelectorAll('.ca-setup-role');
    allCards.forEach(function (c) {
      if (chosenRoles.indexOf(c.dataset.role) !== -1) {
        c.classList.add('ca-chosen');          // 选中卡牌亮起上浮
      } else {
        var rect = c.getBoundingClientRect();
        playAshes(rect.left + rect.width / 2, rect.top + rect.height / 2);  // 灰烬粒子
        c.classList.add('ca-fading');          // 卡牌淡出退场
      }
    });
    // 灰烬余韵 → 金色帷幕合拢 → 揭开选首发屏
    setTimeout(function () {
      playCurtain(function () {
        var pool = DATA.ROLE_POOL.map(function (r) { return r.id; });
        var aiRoster = shuffle(pool).slice(0, 6);
        window.CardArena.start(chosenRoles.slice(), aiRoster);
      });
    }, pace(760));
  }

  // 金色帷幕转场：上下两幅锦帘合拢遮住换屏瞬间，再向两侧揭开
  function playCurtain(onCovered) {
    var dur = pace(800);
    var half = Math.round(dur / 2);
    var wrap = el('div', 'ca-curtain');
    wrap.style.setProperty('--cd', half + 'ms');
    wrap.appendChild(el('span', 'ca-curtain-top'));
    wrap.appendChild(el('span', 'ca-curtain-bottom'));
    var seam = el('span', 'ca-curtain-seam');
    wrap.appendChild(seam);
    document.body.appendChild(wrap);
    // 合拢完成 → 切换内容 → 揭开
    setTimeout(function () {
      if (onCovered) onCovered();
      wrap.classList.add('ca-curtain-open');
      setTimeout(function () { wrap.remove(); }, half + 120);
    }, half);
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ===== 选首发阶段：从 6 张出战卡牌中选 1 张首发 =====
  function renderSelectFirst(s) {
    app.innerHTML = '';
    var box = el('div', 'ca-setup ca-select-first');
    box.appendChild(el('h2', 'ca-setup-title', '选择首发角色'));
    box.appendChild(el('p', 'ca-setup-sub', '从 6 张出战卡牌中选择 1 张首发，选择后进入玩家先手回合'));
    var grid = el('div', 'ca-setup-grid ca-first-grid');
    s.player.roster.forEach(function (role, i) {
      var tier = heroTier(role);
      var card = el('button', 'ca-first-card tier-' + tier);
      card.dataset.role = role.id;
      // 顶饰金线
      var topline = el('span', 'ca-role-topline');
      topline.appendChild(el('b', null));
      card.appendChild(topline);
      // 品级缎带
      card.appendChild(el('div', 'ca-role-band', role.titleEn || ''));
      var art = el('div', 'ca-role-art');
      art.appendChild(el('span', 'ca-role-star-outer'));
      art.appendChild(el('span', 'ca-role-star-inner'));
      art.appendChild(el('span', 'ca-role-gem'));
      card.appendChild(art);
      card.appendChild(el('div', 'ca-setup-role-name', role.name));
      card.appendChild(el('div', 'ca-setup-role-intro', role.intro));
      var stats = el('div', 'ca-role-stats');
      stats.appendChild(el('span', 'ca-role-stat ca-role-stat-hp', '\u2764 ' + role.maxHealth));
      stats.appendChild(el('span', 'ca-role-stat ca-role-stat-atk', '\u2694 ' + role.attack));
      card.appendChild(stats);
      card.appendChild(el('div', 'ca-setup-role-passive', '被动: ' + (role.passive ? describePassive(role.passive) : '无')));
      (function (idx) {
        card.addEventListener('click', function () {
          window.CardArena.selectFirstRole(idx);
        });
      })(i);
      grid.appendChild(card);
    });
    box.appendChild(grid);
    app.appendChild(box);
  }

  // ===== 对局界面：整体渲染 =====
  function renderAll() {
    var s = window.CardArena.getState();
    if (!s) return;
    // 对局已结束：结算弹窗已由 showGameOver 渲染，跳过重建以免清掉 overlay
    if (s.phase === 'gameover') return;
    // 选首发阶段：渲染首发选择屏，等待玩家点选第一张出战卡牌
    if (s.phase === 'select-first') { renderSelectFirst(s); return; }
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
    caDealt = true; // 首个战斗界面已渲染，关掉发牌入场闸门（后续重建不再重播）
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
    // 攻击者前倾：玩家操作触发，或 AI 逐步演出时由 aiAttacker 提供
    if (pendingAction && pendingAction.type === 'attack') fx.attacker = pendingAction.attacker;
    if (!fx.attacker && aiAttacker) fx.attacker = aiAttacker;
    return fx;
  }

  // 在渲染完成后播放特效
  function applyFx(fx) {
    if (!fx) return;
    var heavyHit = false;
    // 攻击者前倾
    if (fx.attacker) {
      var atkEl = fx.attacker.kind === 'hero'
        ? app.querySelector('.ca-hero-player')
        : app.querySelector('.ca-minion[data-uid="' + fx.attacker.uid + '"]');
      if (atkEl) atkEl.classList.add('ca-lunge');
    }
    // 伤害：飘字分级 + 受击闪光强化 + (重击)震屏/hit-stop
    fx.dmg.forEach(function (d) {
      var el2 = d.kind === 'hero'
        ? app.querySelector('.ca-hero-' + d.side)
        : app.querySelector('.ca-minion[data-uid="' + d.uid + '"]');
      var rect = el2 ? el2.getBoundingClientRect() : d.rect;
      if (!rect) return;
      var lethal = d.dead || isLethalDeath(fx, d);
      var tier = lethal ? 'lethal' : (d.amount >= 5 ? 'heavy' : 'normal');
      playFloating(d.amount, rect, 'dmg', tier);
      if (el2) {
        el2.classList.remove('ca-hit', 'ca-hit--lethal');
        void el2.offsetWidth;
        el2.classList.add('ca-hit' + (lethal ? ' ca-hit--lethal' : ''));
        var imp = el('div', 'ca-fx ca-fx-impact');
        el2.appendChild(imp);
        setTimeout(function () { imp.remove(); }, 600);
        if (tier !== 'normal') heavyHit = true;
      } else {
        playImpactAt(rect);
      }
    });
    if (heavyHit && !reduceMotion) doShakeAndHitstop();
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
    // 抽牌：幻影牌从界面右侧 3D 翻入手牌区（终点 = 实际抽到的每张牌的位置）
    if (fx.draw && fx.draw.side === 'player' && fx.draw.count > 0) {
      var handCards = app.querySelectorAll('.ca-hand-cards .ca-card');
      var n = Math.min(fx.draw.count, handCards.length);
      if (n > 0) {
        var targets = [];
        for (var k = 0; k < n; k++) {
          targets.push(handCards[handCards.length - 1 - k].getBoundingClientRect());
        }
        playDrawFx(targets);
      }
    }
  }

  // 伤害是否为致命一击（目标在本次更新中死亡）
  function isLethalDeath(fx, d) {
    return fx.deaths.some(function (x) {
      return x.side === d.side && x.kind === d.kind &&
        (d.kind === 'hero' ? true : x.uid === d.uid);
    });
  }
  // 重击：hit-stop 顿帧(冻结 70ms) + 随后震屏
  function doShakeAndHitstop() {
    if (reduceMotion) return;
    app.classList.add('ca-hitstop');
    setTimeout(function () {
      app.classList.remove('ca-hitstop');
      app.classList.remove('ca-shake');
      void app.offsetWidth;
      app.classList.add('ca-shake');
      setTimeout(function () { app.classList.remove('ca-shake'); }, 430);
    }, 70);
  }

  // 伤害/治疗飘字（fixed 定位到 body，不受重渲染影响）
  function playFloating(amount, rect, kind, tier) {
    var cls = 'ca-fx ca-fx-' + kind;
    if (tier) cls += ' ca-fx-' + kind + '--' + tier;
    var fx = el('div', cls, (kind === 'dmg' ? '-' : '+') + amount);
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
  // targets：抽到牌的 DOMRect 数组，每张幻影牌飞到对应位置，与屏幕大小/换行无关
  function playDrawFx(targets) {
    var n = targets.length;
    for (var i = 0; i < n; i++) {
      var t = targets[i];
      var ghost = el('div', 'ca-draw-ghost');
      var front = el('div', 'ca-draw-face ca-draw-front');
      front.appendChild(el('div', 'ca-draw-band', 'GOLD'));
      front.appendChild(el('div', 'ca-draw-star'));
      var back = el('div', 'ca-draw-face ca-draw-back');
      back.appendChild(el('div', 'ca-draw-mark', 'ON DUTY'));
      ghost.appendChild(front);
      ghost.appendChild(back);
      document.body.appendChild(ghost);

      // 起点：视口右侧，多张时以目标牌高度为基准上下错落成扇形
      var startX = window.innerWidth + 24 + i * 30;
      var startY = t.top + t.height / 2 + (i - (n - 1) / 2) * 46;
      // 终点：对应那张牌的几何中心（84×118 幻影牌中心对齐，落点精准）
      var endX = Math.round(t.left + t.width / 2);
      var endY = Math.round(t.top + t.height / 2);
      var dx = endX - startX;
      var dy = endY - startY;
      ghost.style.left = Math.round(startX - 42) + 'px';
      ghost.style.top = Math.round(startY - 59) + 'px';

      // 飞行全程高亮显眼，到达终点后淡出；中间点抬高形成抛物线弧线
      var anim = ghost.animate([
        { transform: 'perspective(700px) translate(0px, 0px) rotateY(120deg) rotateZ(8deg) scale(1.06)', offset: 0 },
        { transform: 'perspective(700px) translate(' + Math.round(dx * 0.7) + 'px, ' + Math.round(dy * 0.5 - 56) + 'px) rotateY(60deg) rotateZ(0deg) scale(1.12)', offset: 0.6 },
        { transform: 'perspective(700px) translate(' + Math.round(dx) + 'px, ' + Math.round(dy) + 'px) rotateY(0deg) rotateZ(0deg) scale(1)', opacity: 1, offset: 0.88 },
        { transform: 'perspective(700px) translate(' + Math.round(dx) + 'px, ' + Math.round(dy) + 'px) rotateY(0deg) rotateZ(0deg) scale(1)', opacity: 0, offset: 1 }
      ], { duration: 760, delay: i * 100, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
      (function (g) {
        anim.onfinish = function () { g.remove(); };
      })(ghost);
      // 落地金尘
      (function (x, y, d) {
        setTimeout(function () { burstSparks(x, y, 8); }, 760 + d);
      })(endX, endY, i * 100);
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
      // 卡池剩余数徽章（每角色独立卡池，显示剩余/总数）
      var poolCount = role.deck ? role.deck.length : 0;
      var pool = el('span', 'ca-roster-chip-pool' + (poolCount === 0 ? ' empty' : ''), String(poolCount));
      pool.title = '卡池剩余 ' + poolCount + ' 张';
      chip.appendChild(pool);
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
      // 玩家方点击卡池徽章查看该角色剩余卡牌（阻止冒泡避免触发换人）
      if (sideName === 'player' && role.alive) {
        (function (idx) {
          pool.addEventListener('click', function (e) {
            e.stopPropagation();
            showPoolModal('player', idx);
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
    // 卡池指示器（玩家方可点击查看剩余卡牌）：每角色独立卡池，剩余张数随抽牌递减、换人保留
    if (sideName === 'player') {
      var poolCount = role.deck ? role.deck.length : 0;
      var poolBtn = el('div', 'ca-hero-pool' + (poolCount === 0 ? ' empty' : ''), '卡池 ' + poolCount + '/12');
      poolBtn.title = '点击查看卡池剩余卡牌';
      (function (idx) {
        poolBtn.addEventListener('click', function (e) {
          e.stopPropagation();   // 阻止冒泡触发英雄选为攻击者
          showPoolModal('player', idx);
        });
      })(side.activeIndex);
      hero.appendChild(poolBtn);
    }
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
      // 首次发牌错峰入场：仅第一场战斗的第一次 renderAll 加 .ca-card-deal + --i
      if (!caDealt) { cardEl.classList.add('ca-card-deal'); cardEl.style.setProperty('--i', i); }
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
    // 速度开关：仅影响 AI 回合步进 / 开场转场的演出节奏（localStorage 持久化）
    var fast = getSpeed() === 2;
    var speedBtn = el('button', 'ca-speed' + (fast ? ' ca-speed-fast' : ''), fast ? '速度 2×' : '速度 1×');
    speedBtn.id = 'ca-speed';
    speedBtn.title = '切换 AI 演出速度';
    speedBtn.addEventListener('click', function () {
      setSpeed(fast ? 1 : 2);
      renderAll();   // 重渲染以刷新按钮状态，后续步进节奏即时生效
    });
    var endBtn = el('button', 'ca-btn', '结束回合');
    endBtn.id = 'ca-end-turn';
    if (s.phase === 'enemy_turn') endBtn.disabled = true;
    endBtn.addEventListener('click', function () { window.CardArena.endTurn(); });
    bar.appendChild(info);
    bar.appendChild(speedBtn);
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

  // ===== 卡池详情弹窗（苏丹宫廷风）=====
  // 显示指定角色卡池中剩余可抽的卡牌（按卡牌 id 聚合计数）
  function showPoolModal(sideName, roleIndex) {
    var s = window.CardArena.getState();
    if (!s) return;
    var side = sideName === 'enemy' ? s.enemy : s.player;
    var role = side.roster[roleIndex];
    if (!role) return;
    var pool = role.deck || [];
    // 按 cardId 聚合计数
    var counts = {};
    pool.forEach(function (cid) { counts[cid] = (counts[cid] || 0) + 1; });

    var overlay = el('div', 'ca-pool-overlay');
    var modal = el('div', 'ca-pool-modal');
    // 标题：角色名 · 卡池 X/12
    var title = el('div', 'ca-pool-modal-title');
    title.appendChild(el('span', 'ca-pool-modal-name', role.name));
    title.appendChild(el('span', 'ca-pool-modal-count', '卡池 ' + pool.length + '/12'));
    modal.appendChild(title);
    var sub = el('div', 'ca-pool-modal-sub', '剩余可抽卡牌（卡池为空时无法再抽）');
    modal.appendChild(sub);

    var grid = el('div', 'ca-pool-grid');
    if (pool.length === 0) {
      grid.appendChild(el('div', 'ca-pool-empty', '卡池已空'));
    } else {
      Object.keys(counts).forEach(function (cid) {
        var c = DATA.CARDS.find(function (x) { return x.id === cid; });
        if (!c) return;
        var tier = cardTier(c);
        var card = el('div', 'ca-pool-card ca-card-tier-' + tier);
        // 费用宝石
        var cost = el('div', 'ca-pool-card-cost', String(c.cost));
        card.appendChild(cost);
        // 品级缎带
        card.appendChild(el('div', 'ca-pool-card-band', tierEn(tier)));
        // 名称
        card.appendChild(el('div', 'ca-pool-card-name', c.name));
        // 类型/数值
        if (c.type === 'minion') {
          card.appendChild(el('div', 'ca-pool-card-kv', c.attack + ' / ' + c.health));
        } else {
          card.appendChild(el('div', 'ca-pool-card-type', '法术'));
        }
        // 描述
        card.appendChild(el('div', 'ca-pool-card-desc', c.desc));
        // 数量徽章
        if (counts[cid] > 1) card.appendChild(el('span', 'ca-pool-card-count', '×' + counts[cid]));
        grid.appendChild(card);
      });
    }
    modal.appendChild(grid);

    var close = el('button', 'ca-btn ca-pool-close', '关闭');
    close.addEventListener('click', function () { overlay.remove(); });
    modal.appendChild(close);

    overlay.appendChild(modal);
    // 点击遮罩关闭
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    app.appendChild(overlay);
  }

  // ===== 结束结算（胜：王冠加冕 + 光柱；败：全屏碎裂 + 灰烬）=====
  function showGameOver(result) {
    var win = result.winner === 'player';
    var s = window.CardArena.getState();
    var overlay = el('div', 'ca-overlay' + (win ? ' ca-win' : ' ca-lose'));
    var box = el('div', 'ca-overlay-box ca-develop' + (win ? ' ca-win-box' : ' ca-lose-box'));
    if (win) {
      var crown = el('div', 'ca-crown');
      crown.innerHTML = '<svg viewBox="0 0 100 62" xmlns="http://www.w3.org/2000/svg">' +
        '<defs><linearGradient id="caCrownG" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#ffe9a8"/><stop offset="0.5" stop-color="#e8c64a"/><stop offset="1" stop-color="#a87b2a"/>' +
        '</linearGradient></defs>' +
        '<path d="M8 54 L8 22 L27 39 L50 9 L73 39 L92 22 L92 54 Z" fill="url(#caCrownG)" stroke="#7a5a1e" stroke-width="2"/>' +
        '<circle cx="50" cy="9" r="5" fill="#fff3c4"/><circle cx="27" cy="39" r="4" fill="#fff3c4"/><circle cx="73" cy="39" r="4" fill="#fff3c4"/>' +
        '<rect x="8" y="51" width="84" height="9" rx="2" fill="#c8a23a"/></svg>';
      box.appendChild(crown);
      var beam = el('div', 'ca-lightbeam');
      box.appendChild(beam);
    } else {
      box.appendChild(el('div', 'ca-shatter'));
    }
    var title = el('h2', 'ca-overlay-title', win ? '胜 · 苏丹加冕' : '败 · 王朝倾覆');
    var sub = el('p', 'ca-overlay-sub', win ? '对方 6 名角色已全部阵亡' : '我方 6 名角色已全部阵亡');
    box.appendChild(title);
    box.appendChild(sub);
    // 战报
    if (s) {
      var aliveP = s.player.roster.filter(function (r) { return r.alive; }).length;
      var aliveE = s.enemy.roster.filter(function (r) { return r.alive; }).length;
      var ph = s.player.roster[s.player.activeIndex];
      var eh = s.enemy.roster[s.enemy.activeIndex];
      var mvp = s.player.roster.filter(function (r) { return r.alive; })
        .sort(function (a, b) { return (b.attack + b.health) - (a.attack + a.health); })[0];
      var report = el('div', 'ca-gameover-report');
      report.appendChild(row('对局回合', '第 ' + s.turn + ' 回合'));
      report.appendChild(row('我方剩余', aliveP + ' / 6 名角色' + (ph ? ' · 出战 ' + ph.health + ' 血' : '')));
      report.appendChild(row('敌方剩余', aliveE + ' / 6 名角色' + (eh ? ' · 出战 ' + eh.health + ' 血' : '')));
      report.appendChild(row('本局 MVP', mvp ? mvp.name : '—'));
      box.appendChild(report);
    }
    var again = el('button', 'ca-btn ca-btn-primary', '再来一局');
    again.addEventListener('click', function () {
      chosenRoles = [];
      app.classList.remove('ca-targeting');
      renderSetup();
    });
    box.appendChild(again);
    overlay.appendChild(box);
    app.appendChild(overlay);
    // 触发入场演出（next frame 保证过渡可播放）
    if (!reduceMotion) requestAnimationFrame(function () { box.classList.add('show'); });
    else box.classList.add('show');
    // 失败：中央灰烬飘落（纯 CSS/SVG，无素材）
    if (!win && !reduceMotion) {
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      playAshes(cx, cy);
      setTimeout(function () { playAshes(cx - 80, cy + 20); }, 120);
      setTimeout(function () { playAshes(cx + 80, cy - 10); }, 220);
    }
  }
  function row(k, v) {
    var r = el('div', 'ca-report-row');
    r.appendChild(el('span', null, k));
    r.appendChild(el('b', null, v));
    return r;
  }

  // 环境层呼吸：稳定父层(body)，不绑逐卡，规避 renderAll 重建导致的动画重置闪烁
  function ensureAmbient() {
    if (ambientReady) return;
    ambientReady = true;
    if (reduceMotion) return; // 降级：不播放常驻微动
    var layer = el('div', 'ca-ambient');
    layer.appendChild(el('div', 'ca-ambient-shimmer'));
    for (var i = 0; i < 14; i++) {
      var m = el('span', 'ca-mote');
      m.style.left = (Math.random() * 100).toFixed(2) + '%';
      m.style.top = (58 + Math.random() * 42).toFixed(2) + '%';
      var sz = (3 + Math.random() * 3).toFixed(1);
      m.style.width = sz + 'px';
      m.style.height = sz + 'px';
      m.style.animationDuration = (7 + Math.random() * 7).toFixed(1) + 's';
      m.style.animationDelay = (-Math.random() * 12).toFixed(1) + 's';
      layer.appendChild(m);
    }
    document.body.appendChild(layer);
  }

  // ===== AI 回合逐帧演出 =====
  // 效果文案（兼容 card.effect.kind / role.passive.type）
  function describeEffect(eff) {
    if (!eff) return '';
    var k = eff.kind || eff.type;
    if (k === 'heal') return '回复 ' + eff.value + ' 点生命';
    if (k === 'draw') return '抽 ' + eff.value + ' 张牌';
    if (k === 'damage') return '造成 ' + eff.value + ' 点伤害';
    if (k === 'buff') return '随从 +' + (eff.attack || 0) + '/+' + (eff.health || 0);
    if (k === 'summon') return '召唤随从';
    if (k === 'board_clear') return '清空敌方随从';
    return '';
  }

  // 对阵报幕 VS：双方首发角色撞入中央，一局一次
  function playVsReport(done) {
    var s = window.CardArena.getState();
    if (!s) { if (done) done(); return; }
    var pRole = s.player.roster[s.player.activeIndex];
    var eRole = s.enemy.roster[s.enemy.activeIndex];
    var wrap = el('div', 'ca-vs');
    wrap.style.setProperty('--vin', pace(520) + 'ms');
    wrap.style.setProperty('--vd', pace(320) + 'ms');
    var row = el('div', 'ca-vs-row');
    function vsCard(sideLabel, role, cls) {
      var c = el('div', 'ca-vs-card ' + cls);
      c.appendChild(el('div', 'ca-vs-side', sideLabel));
      c.appendChild(el('div', 'ca-vs-star'));
      c.appendChild(el('div', 'ca-vs-name', role ? role.name : ''));
      var stats = el('div', 'ca-vs-stats');
      stats.appendChild(el('span', null, '⚔ ' + (role ? role.attack : 0)));
      stats.appendChild(el('span', null, '♥ ' + (role ? role.maxHealth : 0)));
      c.appendChild(stats);
      return c;
    }
    row.appendChild(vsCard('我方首发', pRole, 'ca-vs-left'));
    row.appendChild(el('div', 'ca-vs-mark', 'VS'));
    row.appendChild(vsCard('敌方首发', eRole, 'ca-vs-right'));
    wrap.appendChild(row);
    wrap.appendChild(el('div', 'ca-vs-flash'));
    document.body.appendChild(wrap);
    void wrap.offsetWidth;
    wrap.classList.add('ca-vs-in');
    setTimeout(function () {
      wrap.classList.remove('ca-vs-in');
      wrap.classList.add('ca-vs-out');
      setTimeout(function () { wrap.remove(); if (done) done(); }, pace(360));
    }, pace(1700));
  }

  // AI 出牌：旋转展示该卡牌（敌方区上方偏中），展示完毕再执行效果
  function showAiCard(cardId, action, done) {
    var card = DATA.CARDS.find(function (c) { return c.id === cardId; });
    if (!card) { if (done) done(); return; }
    var node = el('div', 'ca-ai-card');
    node.style.left = '50%';
    node.style.top = '11%';
    node.style.setProperty('--ad', pace(900) + 'ms');
    node.appendChild(el('div', 'ca-ai-card-cost', String(card.cost)));
    node.appendChild(el('div', 'ca-ai-card-kind', (card.type === 'minion' ? '随从' : '法术') + ' · 出牌'));
    node.appendChild(el('div', 'ca-ai-card-name', card.name));
    var txt = describeEffect(card.effect);
    if (card.type === 'minion') txt = (card.attack + ' / ' + card.health) + (txt ? ' · ' + txt : '');
    node.appendChild(el('div', 'ca-ai-card-text', txt || '召唤入场'));
    document.body.appendChild(node);
    void node.offsetWidth;
    setTimeout(function () {
      if (done) done();                 // 此刻执行出牌效果，战场随之更新
      setTimeout(function () { node.remove(); }, pace(80));
    }, pace(900));
  }

  // AI 换人：横幅提示（换人幽灵翻飞由引擎 fx.swap 负责）
  function showAiSwap(action, done) {
    var s = window.CardArena.getState();
    var role = s && s.enemy.roster[action.roleIndex];
    var banner = el('div', 'ca-ai-banner', '敌方换人 · ' + (role ? role.name : '新角色') + ' 上场');
    banner.style.setProperty('--bd', pace(1000) + 'ms');
    document.body.appendChild(banner);
    void banner.offsetWidth;
    setTimeout(function () { banner.remove(); if (done) done(); }, pace(1000));
  }

  // 引擎驱动 AI 生成器时回调：按行动类型播放对应演出，并在合适时机回调 apply / next
  function playAiStep(action, apply, next) {
    if (action.type === 'play') {
      showAiCard(action.cardId, action, function () {
        apply();
        setTimeout(next, pace(140));
      });
    } else if (action.type === 'attack') {
      aiAttacker = action.attacker;     // 让本次渲染的攻击者触发前倾 lunge
      apply();                          // 执行攻击 → renderAll 播放 lunge
      setTimeout(function () { aiAttacker = null; next(); }, pace(820));
    } else if (action.type === 'swap') {
      showAiSwap(action, function () {
        apply();
        setTimeout(next, pace(320));
      });
    }
  }

  // 暴露给引擎，用于驱动 AI 回合的逐帧演出
  window.CardArenaUI = { playAiStep: playAiStep };

  // ===== 初始化 =====
  function init() {
    app = document.getElementById('cardarena-app');
    if (!app) return;
    ensureAmbient();
    renderSetup();
    // 开场闪屏协调：若闪屏将播放则先隐藏选人界面，待其关闭再播「显影」入场；否则直接入场
    if (window.__CA_SPLASH_WILL_SHOW) {
      var pre = app.querySelector('.ca-setup');
      if (pre) pre.classList.add('ca-pre');
      var revealed = false;
      function revealSetup() {
        if (revealed) return; revealed = true;
        var s = app.querySelector('.ca-setup');
        if (s) { s.classList.remove('ca-pre'); s.classList.add('ca-enter'); }
      }
      window.addEventListener('cardarena:splash-done', function onDone() {
        window.removeEventListener('cardarena:splash-done', onDone);
        revealSetup();
      });
      // 兜底：闪屏异常未派发 done 时确保选人界面出现，避免永久隐藏。
      // 闪屏为「纯点击门」不会自动关闭，玩家可能长时间观赏，故仅在闪屏确实未正常显示时才兜底。
      (function guard(tries) {
        setTimeout(function () {
          if (revealed) return;
          var sp = document.getElementById('ca-splash');
          var alive = sp && window.__CA_SPLASH_STARTED &&
            sp.classList.contains('show') && !sp.classList.contains('gone');
          if (alive) { if (tries < 40) guard(tries + 1); return; }  // 闪屏正常展示中，继续等玩家点击
          revealSetup();
        }, 3000);
      })(0);
    } else {
      var enter = app.querySelector('.ca-setup');
      if (enter) enter.classList.add('ca-enter');
    }
    var engine = window.CardArena;
    engine.on('update', renderAll);
    engine.on('phase', function (phase) {
      if (phase === 'choose_target' || phase === 'choose_attack_target') {
        applyTargetingMode();
        return;
      }
      // 对局正式开始（玩家先手首回合）：先播「对阵报幕 VS」，再揭开战斗界面
      if (phase === 'player_turn' && !vsShownThisGame) {
        vsShownThisGame = true;
        playVsReport(function () { renderAll(); });
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

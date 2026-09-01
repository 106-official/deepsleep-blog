/* ============================================================
   Lixin · 精灵学院  ——  玩法层 (mon.js)
   在原有 Lixin 校园 RPG 之上叠加精灵养成与回合制战斗：
   草丛遇敌 · 属性克制 · 技能/状态 · 捕获与进化 · 队伍/背包/图鉴/商店。
   依赖：mon-data.js（数据）、auth.js（账号与存档）、index.html（地图与主循环）
   ============================================================ */
(function () {
  'use strict';
  const D = window.MonData;
  if (!D) { console.error('[mon] 缺少 mon-data.js'); return; }
  // TILE 来自 index.html 顶层 const；取一份安全副本，避免任何作用域/时序问题导致 NaN
  const T = (typeof TILE === 'number') ? TILE : 32;

  /* ---------------- 基础工具 ---------------- */
  const $ = function (s) { return document.querySelector(s); };
  const rnd = function () { return Math.random(); };
  const ri = function (a, b) { return a + Math.floor(rnd() * (b - a + 1)); };
  const clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return 'm' + Date.now().toString(36) + Math.floor(rnd() * 1e6).toString(36); }

  /* ---------------- 数值 ---------------- */
  function spec(mon) { return D.BY_ID[mon.id] || D.SPECIES[0]; }
  function statHp(mon) { const b = spec(mon).b; return Math.floor((2 * b.hp + mon.iv.hp) * mon.lv / 100) + mon.lv + 10; }
  function statOf(mon, k) { const b = spec(mon).b; return Math.floor((2 * b[k] + mon.iv[k]) * mon.lv / 100) + 5; }
  function stats(mon) {
    return { maxhp: statHp(mon), atk: statOf(mon, 'atk'), def: statOf(mon, 'def'), spd: statOf(mon, 'spd') };
  }
  function expNeed(lv) { return Math.floor(5 * lv * lv + 12 * lv); }
  function expToNext(mon) { return expNeed(mon.lv); }

  function makeMon(id, lv, opt) {
    opt = opt || {};
    lv = Math.max(1, Math.min(100, lv || 5));
    // 高等级个体按进化链收敛到对应形态（例如 Lv22 的概率鱼应已是分布鲸）
    let guard = 0;
    while (guard++ < 8) {
      const cur = D.BY_ID[id];
      if (!cur || !cur.ev || lv < cur.ev.lv || !D.BY_ID[cur.ev.to]) break;
      id = cur.ev.to;
    }
    const s = D.BY_ID[id]; if (!s) return null;
    const iv = opt.iv || { hp: ri(0, 15), atk: ri(0, 15), def: ri(0, 15), spd: ri(0, 15) };
    const mon = {
      uid: uid(), id: id, lv: Math.max(1, Math.min(100, lv || 5)), exp: 0,
      iv: iv, nick: opt.nick || '', moves: [], status: null,
      metAt: opt.metAt || '', caughtAt: Date.now()
    };
    // 初始技能：前两个；之后按 learnLv 学会
    const learn = s.learnLv || [1, 1, 7, 16];
    s.moves.forEach(function (nm, i) {
      if (!nm || !D.MOVES[nm]) return;
      if (mon.lv >= (learn[i] === undefined ? 99 : learn[i])) mon.moves.push({ name: nm, pp: D.MOVES[nm].pp, max: D.MOVES[nm].pp });
    });
    if (!mon.moves.length) mon.moves.push({ name: '撞击', pp: 35, max: 35 });
    mon.hp = statHp(mon);          // 满血出场（缺失会导致伤害计算变 NaN）
    return mon;
  }
  function monName(mon) { return mon.nick || spec(mon).name; }
  function typeBadges(mon) {
    return spec(mon).t.map(function (t) {
      const T = D.TYPES[t];
      return '<i class="mb" style="background:' + T.color + '">' + T.icon + T.name + '</i>';
    }).join('');
  }
  function hpPct(mon) { return clamp(mon.hp / statHp(mon), 0, 1); }
  function hpClass(p) { return p > 0.5 ? 'ok' : (p > 0.2 ? 'mid' : 'low'); }
  function alive(mon) { return mon && mon.hp > 0; }

  /* ---------------- 状态 ---------------- */
  let S = null;   // 存档
  let HUD = null;

  function blankSave() {
    return {
      v: 1, team: [], box: [], bag: { ball: 5, potion: 3 }, money: 500,
      dex: {}, stats: { battles: 0, wins: 0, catches: 0, faints: 0, steps: 0 },
      step: 0, nextEncounter: ri(28, 56), createdAt: Date.now()
    };
  }
  function save() {
    if (!S) return;
    S.team.forEach(function (m) { if (m.hp === undefined) m.hp = statHp(m); });
    window.MonAuth.writeSave(S);
    renderHud();
  }
  function load() {
    const raw = window.MonAuth.loadSave();
    S = raw && raw.v ? raw : blankSave();
    S.bag = S.bag || {}; S.dex = S.dex || {};
    S.stats = S.stats || { battles: 0, wins: 0, catches: 0, faints: 0, steps: 0 };
    S.team.forEach(function (m) { if (m.hp === undefined) m.hp = statHp(m); });
    if (typeof S.nextEncounter !== 'number') S.nextEncounter = ri(28, 56);
  }

  function markSeen(id) { const k = String(id); S.dex[k] = S.dex[k] || { seen: 0, caught: 0 }; S.dex[k].seen = 1; }
  function markCaught(id) { const k = String(id); S.dex[k] = S.dex[k] || { seen: 0, caught: 0 }; S.dex[k].seen = 1; S.dex[k].caught = 1; }
  function dexCaught() { return Object.keys(S.dex).filter(function (k) { return S.dex[k].caught; }).length; }

  function teamAdd(mon) {
    if (S.team.length < 6) { S.team.push(mon); return 'team'; }
    S.box.push(mon); return 'box';
  }
  function firstAlive() { for (let i = 0; i < S.team.length; i++) if (alive(S.team[i])) return S.team[i]; return null; }

  function itemCount(k) { return S.bag[k] || 0; }
  function itemAdd(k, n) { S.bag[k] = (S.bag[k] || 0) + n; }
  function itemUse(k, n) {
    n = n || 1;
    if (itemCount(k) < n) return false;
    S.bag[k] -= n; if (S.bag[k] <= 0) delete S.bag[k];
    return true;
  }

  /* ---------------- 遇敌 tick ---------------- */
  let lastX = -1, lastY = -1, acc = 0;
  function zoneOf(px, py) {
    try {
      const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
      if (typeof isWater === 'function') {
        for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
          if (Math.abs(dx) + Math.abs(dy) <= 2 && isWater((tx + dx) * TILE + TILE / 2, (ty + dy) * TILE + TILE / 2)) return '水边';
        }
      }
      if (typeof isPath === 'function' && isPath(tx, ty)) return '道路';
      if (typeof blocked !== 'undefined') {
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          if (blocked.has(key(tx + dx, ty + dy))) return '建筑区';
        }
      }
      return '草地';
    } catch (e) { return '草地'; }
  }

  function tick(dt) {
    if (!S || !window.MonAuth.current) return;
    if (B.on || panelOpen || (typeof splashing !== 'undefined' && splashing)) return;
    if (typeof dialogOpen !== 'undefined' && dialogOpen) return;
    const px = player.x, py = player.y;
    // 首帧用玩家真实坐标初始化，避免 lastX/lastY 初值(-1)造成首帧距离爆表污染 acc
    if (lastX < 0) { lastX = px; lastY = py; }
    const d = Math.hypot(px - lastX, py - lastY);
    lastX = px; lastY = py;
    // 大跳跃（传送/读档/重生/地图加载）不计入行走距离，防止 acc 被一次性灌满 → 每帧触发战斗
    if (d > T * 1.5) { acc = 0; return; }
    if (d <= 0.01) return;
    acc += d / T;
    S.stats.steps++;
    if (acc < 1) return;
    acc -= 1;
    S.nextEncounter--;
    if (S.nextEncounter > 0) return;
    // 建筑区内为安全区，不触发野外遭遇（仅草地/水边/道路遇敌）
    if (zoneOf(px, py) === '建筑区') { S.nextEncounter = ri(12, 26); return; }
    S.nextEncounter = ri(12, 26);
    startWild(px, py);
  }

  function startWild(px, py) {
    const zone = zoneOf(px, py);
    let plv = 5;
    S.team.forEach(function (m) { if (m.lv > plv) plv = m.lv; });
    const pick = D.pickWild(zone, plv);
    const w = makeMon(pick.id, pick.lv);
    if (!w) return;
    markSeen(w.id);
    battleLoop(w, zone);
  }

  /* ---------------- 战斗 ---------------- */
  const B = {
    on: false, wild: null, mine: null, zone: '草地',
    tmp: null, log: [], busy: false, _wait: null, ended: false
  };

  function tmpOf(side) { return B.tmp[side]; }
  function stageMul(v) { return v >= 0 ? (2 + v) / 2 : 2 / (2 - v); }

  function battleLog(txt, cls) {
    B.log.push({ t: txt, c: cls || '' });
    if (B.log.length > 60) B.log.shift();
    const box = $('#mbLog');
    if (box) {
      const d = document.createElement('div');
      d.className = 'mb-line ' + (cls || '');
      d.textContent = txt;
      box.appendChild(d);
      box.scrollTop = box.scrollHeight;
    }
  }

  function showBattle() { const el = $('#monBattle'); if (el) el.classList.add('show'); }
  function hideBattle() {
    const el = $('#monBattle'); if (el) el.classList.remove('show');
    B.on = false; B.ended = false;
    if (typeof dialogOpen !== 'undefined') dialogOpen = false;
  }

  function barHtml(mon, cls) {
    const p = hpPct(mon), max = statHp(mon);
    return '<div class="mb-hpbar ' + hpClass(p) + ' ' + (cls || '') + '"><i style="width:' + (p * 100).toFixed(1) + '%"></i></div>' +
      '<div class="mb-hpnum">' + Math.max(0, Math.ceil(mon.hp)) + ' / ' + max + '</div>';
  }
  function statusTag(mon) {
    if (!mon.status) return '';
    const map = { burn: '🔥灼伤', poison: '☠️中毒', para: '⚡麻痹' };
    return '<i class="mb-st ' + mon.status + '">' + map[mon.status] + '</i>';
  }

  function renderBattle() {
    const el = $('#monBattle'); if (!el || !B.wild) return;
    const w = B.wild, m = B.mine;
    let html = '<div class="mb-stage">' +
      '<div class="mb-side wild">' +
      '  <div class="mb-card" id="mbWildCard">' +
      '    <div class="mb-top"><span class="mb-nm">' + esc(monName(w)) + '</span><span class="mb-lv">Lv' + w.lv + '</span>' + statusTag(w) + '</div>' +
      '    <div class="mb-types">' + typeBadges(w) + '</div>' +
      '    ' + barHtml(w) +
      '  </div>' +
      '  <div class="mb-sprite" id="mbWildSprite">' + spec(w).emoji + '</div>' +
      '</div>' +
      '<div class="mb-vs">' + (B.zone ? '<span>' + esc(B.zone) + '</span>' : '') + '</div>' +
      '<div class="mb-side mine">' +
      '  <div class="mb-sprite" id="mbMineSprite">' + (m ? spec(m).emoji : '❔') + '</div>' +
      '  <div class="mb-card">' +
      (m ? ('    <div class="mb-top"><span class="mb-nm">' + esc(monName(m)) + '</span><span class="mb-lv">Lv' + m.lv + '</span>' + statusTag(m) + '</div>' +
        '    <div class="mb-types">' + typeBadges(m) + '</div>' + barHtml(m) +
        '    <div class="mb-exp"><i style="width:' + clamp(m.exp / expToNext(m) * 100, 0, 100).toFixed(1) + '%"></i></div>')
        : '    <div class="mb-top"><span class="mb-nm">（无出战精灵）</span></div>') +
      '  </div>' +
      '</div></div>' +
      '<div class="mb-log" id="mbLog"></div>' +
      '<div class="mb-acts" id="mbActs"></div>';
    el.querySelector('.mb-inner').innerHTML = html;
    const log = $('#mbLog');
    if (log) B.log.forEach(function (l) {
      const d = document.createElement('div');
      d.className = 'mb-line ' + l.c; d.textContent = l.t; log.appendChild(d);
    });
    log.scrollTop = log.scrollHeight;
    renderActs();
  }

  function renderActs() {
    const box = $('#mbActs'); if (!box) return;
    box.innerHTML = '';
    const m = B.mine;
    if (!m || !alive(m)) { renderSwitchOnly(); return; }
    const main = document.createElement('div'); main.className = 'mb-acts-main';
    [['⚔️ 技能', 'move'], ['🎒 道具', 'item'], ['🔴 投球', 'ball'], ['🐾 换宠', 'switch'], ['🏃 逃跑', 'run']]
      .forEach(function (p) {
        const b = document.createElement('button');
        b.className = 'mb-btn'; b.textContent = p[0];
        b.onclick = function () { choose(p[1]); };
        main.appendChild(b);
      });
    box.appendChild(main);
    const sub = document.createElement('div'); sub.className = 'mb-acts-sub'; box.appendChild(sub);
    showMoveList(sub);
  }
  function renderSwitchOnly() {
    const box = $('#mbActs'); if (!box) return;
    box.innerHTML = '<div class="mb-acts-sub" style="grid-column:1/-1"></div>';
    showSwitchList(box.querySelector('.mb-acts-sub'), true);
  }
  function choose(kind) {
    const sub = $('#mbActs .mb-acts-sub'); if (!sub) return;
    if (kind === 'move') showMoveList(sub);
    else if (kind === 'item') showItemList(sub, false);
    else if (kind === 'ball') showItemList(sub, true);
    else if (kind === 'switch') showSwitchList(sub, false);
    else if (kind === 'run') act({ type: 'run' });
  }
  function showMoveList(sub) {
    sub.innerHTML = '';
    const m = B.mine; if (!m) return;
    m.moves.forEach(function (mv, i) {
      const def = D.MOVES[mv.name] || { type: 'normal', power: 0, acc: 1, pp: mv.pp };
      const T = D.TYPES[def.type];
      const b = document.createElement('button');
      b.className = 'mb-mv';
      b.innerHTML = '<span class="mv-n">' + esc(mv.name) + '</span>' +
        '<span class="mv-t" style="background:' + T.color + '">' + T.icon + T.name + '</span>' +
        '<span class="mv-p">' + (def.power ? ('威力 ' + def.power) : '变化') + '</span>' +
        '<span class="mv-pp">PP ' + mv.pp + '/' + mv.max + '</span>';
      if (mv.pp <= 0) b.classList.add('off');
      b.onclick = function () { if (mv.pp <= 0) { battleLog('这个技能已经没有 PP 了。', 'bad'); return; } act({ type: 'move', idx: i }); };
      sub.appendChild(b);
    });
  }
  function showItemList(sub, ballOnly) {
    sub.innerHTML = '';
    const keys = Object.keys(S.bag).filter(function (k) {
      if (!(S.bag[k] > 0)) return false;
      const it = D.ITEMS[k]; if (!it) return false;
      return ballOnly ? k.indexOf('ball') >= 0 : k.indexOf('ball') < 0;
    });
    if (!keys.length) { sub.innerHTML = '<div class="mb-empty">' + (ballOnly ? '没有精灵球，去教育超市买几个吧。' : '没有可用道具。') + '</div>'; return; }
    keys.forEach(function (k) {
      const it = D.ITEMS[k];
      const b = document.createElement('button');
      b.className = 'mb-mv';
      b.innerHTML = '<span class="mv-n">' + it.emoji + ' ' + esc(it.name) + '</span><span class="mv-pp">×' + S.bag[k] + '</span>';
      b.onclick = function () { act({ type: ballOnly ? 'ball' : 'item', item: k }); };
      sub.appendChild(b);
    });
  }
  function showSwitchList(sub, force) {
    sub.innerHTML = '';
    S.team.forEach(function (mon, i) {
      if (!alive(mon)) return;
      const b = document.createElement('button');
      b.className = 'mb-mv';
      b.innerHTML = '<span class="mv-n">' + spec(mon).emoji + ' ' + esc(monName(mon)) + ' Lv' + mon.lv + '</span>' +
        '<span class="mv-p">HP ' + Math.ceil(mon.hp) + '/' + statHp(mon) + '</span>';
      b.onclick = function () {
        if (mon === B.mine) { battleLog('它已经在场上了。'); return; }
        act({ type: 'switch', idx: i });
      };
      sub.appendChild(b);
    });
    if (force) {
      const d = document.createElement('div');
      d.className = 'mb-empty'; d.textContent = '请选择下一只出战的精灵';
      sub.insertBefore(d, sub.firstChild);
    }
  }

  function waitAct() { return new Promise(function (res) { B._wait = res; }); }
  function act(a) {
    if (B.busy || !B._wait) return;
    const r = B._wait; B._wait = null; r(a);
  }

  async function battleLoop(wild, zone) {
    B.on = true; B.ended = false; B.wild = wild; B.zone = zone || '草地';
    B.log = [];
    B.tmp = { me: { stages: { atk: 0, def: 0 } }, wild: { stages: { atk: 0, def: 0 } } };
    B.mine = firstAlive();
    if (!B.mine) {
      if (typeof toast === 'function') toast('队伍里没有能战斗的精灵，去校医院治疗吧');
      hideBattle(); return;
    }
    try { player.tx = player.x; player.ty = player.y; } catch (e) {}
    if (typeof dialogOpen !== 'undefined') dialogOpen = true;
    S.stats.battles++;
    battleLog('野生的 ' + monName(wild) + '（Lv' + wild.lv + '）出现了！', 'sys');
    showBattle(); renderBattle();

    while (B.on && !B.ended) {
      const need = !alive(B.mine);
      const a = need ? await waitSwitch() : await waitAct();
      if (!B.on) break;
      B.busy = true;
      await resolveTurn(a);
      B.busy = false;
      if (B.ended) break;
      renderBattle();
    }
    hideBattle();
    save();
  }

  function waitSwitch() {
    renderBattle();
    battleLog(monName(B.mine) + ' 失去了战斗能力！换上谁？', 'bad');
    return waitAct();
  }

  function allFainted() { return !S.team.some(alive); }

  async function resolveTurn(a) {
    const w = B.wild, me = B.mine;
    // 1) 换宠（优先，不消耗回合内的出手机会，但仍会被攻击）
    if (a.type === 'switch') {
      const to = S.team[a.idx];
      if (to && alive(to)) {
        B.mine = to; B.tmp.me = { stages: { atk: 0, def: 0 } };
        battleLog('去吧，' + monName(to) + '！', 'sys');
        renderBattle(); await sleep(420);
        await enemyTurn();
      } else { battleLog('那只精灵无法出战。'); }
      return;
    }
    if (a.type === 'run') {
      const ms = statOf(me, 'spd'), ws = statOf(w, 'spd');
      const p = clamp(ms / (ws * 0.65 + 1), 0.28, 0.95);
      if (rnd() < p) { battleLog('成功逃走了。', 'sys'); B.ended = true; await sleep(350); return; }
      battleLog('逃不掉！', 'bad');
      await enemyTurn(); return;
    }
    if (a.type === 'ball') {
      await tryCatch(a.item); return;
    }
    if (a.type === 'item') {
      const ok = await useItemInBattle(a.item);
      if (!ok) return;              // 未消耗回合，重新等待选择
      await enemyTurn(); return;
    }
    if (a.type === 'move') {
      const mineFirst = effectiveSpd(me, 'me') >= effectiveSpd(w, 'wild');
      const mv = me.moves[a.idx];
      if (!mv || mv.pp <= 0) { battleLog('技能无法使用。'); return; }
      if (me.status === 'para' && rnd() < 0.25) {
        battleLog(monName(me) + ' 因麻痹而无法行动！', 'bad');
        await sleep(420);
        await enemyTurn(); return;
      }
      const order = mineFirst ? [['me', mv], ['wild', pickEnemyMove()]] : [['wild', pickEnemyMove()], ['me', mv]];
      for (const it of order) {
        if (B.ended) break;
        if (it[0] === 'me') { if (!alive(me)) continue; await doMove(me, w, it[1], 'me'); }
        else { if (!alive(w)) continue; await doMove(w, me, it[1], 'wild'); }
        if (!alive(w)) { await winBattle(); return; }
        if (!alive(me)) {
          if (allFainted()) { await loseBattle(); return; }
          renderBattle(); return;   // 交回外层，等待玩家换宠
        }
      }
      await endOfTurn();
      return;
    }
  }

  /* 克制软化：把 2x/0.5x 收敛为 1.68x/0.59x。
     保留「效果拔群」的手感与提示，但避免属性克制造成一边倒——
     实测 2x 会让单只精灵的胜率直接变成 0%/100%。玩家的应对手段应是换宠与道具，而不是被属性锁死。 */
  function softenEff(eff) { return Math.pow(eff, 0.75); }

  /* 基础伤害（不含属性克制/暴击/随机），唯一权威实现，供战斗与平衡模拟共用 */
  function damageOf(src, dst, mvName, opt) {
    const def = D.MOVES[mvName] || { power: 40, type: 'normal' };
    if (!(def.power > 0)) return 0;
    const st = (opt && opt.srcStages) || {}, ds = (opt && opt.dstStages) || {};
    let atk = statOf(src, 'atk') * stageMul(st.atk || 0);
    if (src.status === 'burn') atk *= 0.5;
    const dfv = statOf(dst, 'def') * stageMul(ds.def || 0);
    return Math.floor(((2 * src.lv / 5 + 2) * def.power * atk / dfv) / 50 + 2);
  }
  /* 捕获概率（含球种/异常/等级修正） */
  function catchOdds(w, key) {
    const max = statHp(w);
    const ballMul = key === 'masterball' ? 255 : (key === 'greatball' ? 0.72 : 0.38);
    const statusMul = w.status ? (w.status === 'para' ? 1.8 : 1.5) : 1;
    const lvPen = clamp(1 - w.lv / 220, 0.5, 1);
    const raw = ((3 * max - 2 * w.hp) / (3 * max)) * spec(w).cr * ballMul * statusMul * lvPen;
    return clamp(raw, 0.01, 1);
  }

  function effectiveSpd(mon, side) {
    let s = statOf(mon, 'spd');
    if (mon.status === 'para') s *= 0.5;
    return s;
  }
  function pickEnemyMove() {
    const w = B.wild;
    const usable = w.moves.filter(function (m) { return m.pp > 0; });
    if (!usable.length) return { name: '撞击', pp: 99 };
    // 优先选克制且威力高的，70% 概率；否则随机
    const scored = usable.map(function (m) {
      const def = D.MOVES[m.name] || { power: 0, type: 'normal' };
      const eff = D.typeEff(def.type, spec(B.mine).t);
      return { m: m, s: (def.power || 20) * eff * (0.8 + rnd() * 0.4) };
    });
    scored.sort(function (a, b) { return b.s - a.s; });
    return (rnd() < 0.7) ? scored[0].m : usable[ri(0, usable.length - 1)];
  }

  async function doMove(src, dst, mv, side) {
    const def = D.MOVES[mv.name] || { type: 'normal', power: 40, acc: 1, effect: 'dmg' };
    const srcName = monName(src), dstName = monName(dst);
    const mineSide = (side === 'me');
    mv.pp = Math.max(0, mv.pp - 1);
    battleLog(srcName + ' 使出 ' + mv.name + '！', mineSide ? 'me' : 'wild');
    await sleep(260);
    if (rnd() > (def.acc || 1)) { battleLog('可惜，没有命中。', 'bad'); await sleep(280); return; }

    if (def.power > 0) {
      const st = side === 'me' ? B.tmp.me.stages : B.tmp.wild.stages;
      const dstSt = side === 'me' ? B.tmp.wild.stages : B.tmp.me.stages;
      const eff = D.typeEff(def.type, spec(dst).t);
      const crit = rnd() < 0.0625 ? 1.5 : 1;
      const base = damageOf(src, dst, mv.name, { srcStages: st, dstStages: dstSt });
      let dmg = Math.max(1, Math.floor(base * softenEff(eff) * crit * (0.85 + rnd() * 0.15)));
      dst.hp = Math.max(0, dst.hp - dmg);
      flash(side === 'me' ? '#mbWildCard' : '.mb-side.mine .mb-card');
      battleLog('造成 ' + dmg + ' 点伤害' + (eff > 1 ? '（效果拔群！）' : (eff < 1 ? '（效果不太理想…）' : '')) + (crit > 1 ? ' 会心一击！' : ''),
        eff > 1 ? 'good' : (eff < 1 ? 'bad' : ''));
      await sleep(420);
    } else {
      const st = side === 'me' ? B.tmp.me.stages : B.tmp.wild.stages;
      const dstSt = side === 'me' ? B.tmp.wild.stages : B.tmp.me.stages;
      if (def.effect === 'heal') {
        const max = statHp(src), amt = Math.floor(max * (def.val || 0.5));
        const before = src.hp; src.hp = Math.min(max, src.hp + amt);
        battleLog(srcName + ' 恢复了 ' + (src.hp - before) + ' 点 HP。', 'good');
      } else if (def.effect === 'atkUp') {
        st.atk = clamp(st.atk + 1, -2, 2); battleLog(srcName + ' 的攻击提升了！', 'good');
      } else if (def.effect === 'defUp') {
        st.def = clamp(st.def + 1, -2, 2); battleLog(srcName + ' 的防御提升了！', 'good');
      } else if (def.effect === 'atkDown') {
        dstSt.atk = clamp(dstSt.atk - 1, -2, 2); battleLog(dstName + ' 的攻击下降了！', 'good');
      } else if (def.effect === 'burn' || def.effect === 'poison' || def.effect === 'para') {
        if (dst.status) { battleLog(dstName + ' 已经处于异常状态了。', 'bad'); }
        else {
          dst.status = def.effect;
          battleLog(dstName + ' 陷入了' + ({ burn: '灼伤', poison: '中毒', para: '麻痹' }[def.effect]) + '！', 'good');
        }
      }
      await sleep(400);
    }
  }

  function flash(sel) {
    const el = $(sel); if (!el) return;
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
    setTimeout(function () { el.classList.remove('hit'); }, 320);
  }

  async function endOfTurn() {
    for (const pair of [[B.mine, 'me'], [B.wild, 'wild']]) {
      const mon = pair[0];
      if (!alive(mon) || !mon.status) continue;
      if (mon.status === 'burn' || mon.status === 'poison') {
        const dmg = Math.max(1, Math.floor(statHp(mon) * (mon.status === 'burn' ? 1 / 16 : 1 / 8)));
        mon.hp = Math.max(0, mon.hp - dmg);
        battleLog(monName(mon) + ' 受到' + (mon.status === 'burn' ? '灼伤' : '中毒') + '的侵蚀（-' + dmg + '）', 'bad');
        await sleep(320);
      }
    }
    if (!alive(B.wild)) { await winBattle(); return; }
    if (!alive(B.mine) && allFainted()) { await loseBattle(); }
  }

  async function enemyTurn() {
    if (B.ended) return;
    if (!alive(B.wild)) { await winBattle(); return; }
    const mv = pickEnemyMove();
    await doMove(B.wild, B.mine, mv, 'wild');
    if (!alive(B.mine)) {
      if (allFainted()) { await loseBattle(); return; }
    }
    if (!B.ended) await endOfTurn();
  }

  async function tryCatch(key) {
    const w = B.wild;
    if (!itemUse(key, 1)) { battleLog('没有这种球了。'); return; }
    battleLog('你扔出了' + D.ITEMS[key].name + '！', 'sys');
    renderBattle();
    await sleep(700);
    const max = statHp(w);
    const a = catchOdds(w, key);
    const shakes = clamp(Math.floor(a * 4) + 1, 1, 4);
    for (let i = 0; i < 3; i++) { battleLog('…咔嚓', 'sys'); await sleep(320); }
    if (rnd() < a) {
      battleLog('太好了！野生的 ' + monName(w) + ' 被收服了！', 'good');
      w.hp = Math.max(1, Math.round(max * 0.5));
      const dest = teamAdd(w);
      markCaught(w.id); S.stats.catches++;
      await sleep(450);
      const gain = w.lv * 26 + 18;
      const lines = gainExp(B.mine, gain);
      lines.forEach(function (l) { battleLog(l.t, l.c); });
      B.ended = true;
      await sleep(600);
      save();
      if (typeof toast === 'function') toast('收服 ' + monName(w) + '！' + (dest === 'box' ? '（队伍已满，送进宿舍箱子）' : ''));
    } else {
      battleLog('啊，它挣脱了' + D.ITEMS[key].name + '！', 'bad');
      await sleep(350);
      await enemyTurn();
    }
  }

  async function useItemInBattle(key) {
    const it = D.ITEMS[key]; if (!it || !itemCount(key)) return false;
    if (key === 'revive') {
      const dead = S.team.find(function (m) { return !alive(m); });
      if (!dead) { battleLog('没有濒死的精灵。'); return false; }
      itemUse(key, 1); dead.hp = Math.floor(statHp(dead) / 2); dead.status = null;
      battleLog(monName(dead) + ' 恢复了活力！', 'good');
    } else if (key === 'candy') {
      itemUse(key, 1);
      const lines = gainExp(B.mine, expToNext(B.mine) - B.mine.exp + 1);
      lines.forEach(function (l) { battleLog(l.t, l.c); });
    } else {
      const target = B.mine;
      if (key === 'potion') { itemUse(key, 1); healMon(target, 30); battleLog(monName(target) + ' 恢复了 30 点 HP。', 'good'); }
      else if (key === 'superpotion') { itemUse(key, 1); healMon(target, 80); battleLog(monName(target) + ' 恢复了 80 点 HP。', 'good'); }
      else if (key === 'fullheal') { itemUse(key, 1); target.hp = statHp(target); target.status = null; battleLog(monName(target) + ' 完全恢复了！', 'good'); }
      else return false;
    }
    renderBattle(); await sleep(400);
    return true;
  }
  function healMon(mon, amt) {
    const max = statHp(mon);
    mon.hp = Math.min(max, mon.hp + amt);
  }

  async function winBattle() {
    if (B.ended) return;
    B.ended = true;
    const w = B.wild;
    battleLog('野生的 ' + monName(w) + ' 倒下了！', 'good');
    S.stats.wins++;
    const gain = w.lv * 26 + 18;
    const money = w.lv * 12 + ri(6, 20);
    S.money += money;
    battleLog('获得 ' + money + ' 学分。', 'sys');
    await sleep(350);
    const lines = gainExp(B.mine, gain);
    lines.forEach(function (l) { battleLog(l.t, l.c); });
    save();
  }

  async function loseBattle() {
    if (B.ended) return;
    B.ended = true;
    battleLog('你的精灵全部失去了战斗能力…', 'bad');
    S.stats.faints++;
    const lost = Math.min(S.money, 120 + S.team.length * 30);
    S.money -= lost;
    battleLog('在医务室醒来，花费了 ' + lost + ' 学分。', 'sys');
    S.team.forEach(function (m) { m.hp = statHp(m); m.status = null; });
    save();
  }

  /* 经验 / 升级 / 进化（返回日志行） */
  function gainExp(mon, amount) {
    const out = [];
    if (!mon) return out;
    mon.exp += Math.max(1, Math.round(amount));
    out.push({ t: monName(mon) + ' 获得 ' + Math.max(1, Math.round(amount)) + ' 点经验值。', c: 'sys' });
    let guard = 0;
    while (mon.exp >= expToNext(mon) && mon.lv < 100 && guard++ < 60) {
      mon.exp -= expToNext(mon);
      mon.lv++;
      const before = statHp(mon) - (mon.lv > 1 ? 0 : 0);
      mon.hp = statHp(mon);
      out.push({ t: '★ ' + monName(mon) + ' 升到了 Lv' + mon.lv + '！', c: 'good' });
      // 学习新技能
      const s = spec(mon), learn = s.learnLv || [1, 1, 7, 16];
      s.moves.forEach(function (nm, i) {
        if (!nm || !D.MOVES[nm]) return;
        if (mon.lv >= (learn[i] === undefined ? 99 : learn[i]) &&
          !mon.moves.some(function (m) { return m.name === nm; })) {
          if (mon.moves.length < 4) {
            mon.moves.push({ name: nm, pp: D.MOVES[nm].pp, max: D.MOVES[nm].pp });
            out.push({ t: monName(mon) + ' 学会了 ' + nm + '！', c: 'good' });
          }
        }
      });
      // 进化
      if (s.ev && mon.lv >= s.ev.lv) {
        const from = s.name, to = D.BY_ID[s.ev.to];
        if (to) {
          mon.id = to.id;
          mon.hp = statHp(mon);
          out.push({ t: '✨ 恭喜！' + from + ' 进化成了 ' + to.name + '！', c: 'good' });
          (to.moves || []).forEach(function (nm) {
            if (!nm || !D.MOVES[nm]) return;
            if (!mon.moves.some(function (m) { return m.name === nm; })) {
              if (mon.moves.length < 4) {
                mon.moves.push({ name: nm, pp: D.MOVES[nm].pp, max: D.MOVES[nm].pp });
                out.push({ t: '学会了新技能 ' + nm + '！', c: 'good' });
              } else {
                mon.moves.shift();
                mon.moves.push({ name: nm, pp: D.MOVES[nm].pp, max: D.MOVES[nm].pp });
                out.push({ t: '忘掉了旧招，学会了 ' + nm + '！', c: 'good' });
              }
            }
          });
          markSeen(mon.id); markCaught(mon.id);
        }
      }
    }
    return out;
  }

  /* ---------------- 面板：队伍 / 背包 / 图鉴 / 商店 ---------------- */
  let panelOpen = false, curTab = 'team';
  function openPanel(tab) {
    const p = $('#monPanel'); if (!p) return;
    curTab = tab || curTab;
    panelOpen = true; p.classList.add('show');
    renderPanel();
  }
  function closePanel() {
    const p = $('#monPanel'); if (!p) return;
    panelOpen = false; p.classList.remove('show');
  }
  function renderPanel() {
    const p = $('#monPanel'); if (!p) return;
    p.querySelectorAll('.mp-tab').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-t') === curTab);
    });
    const body = p.querySelector('.mp-body');
    if (curTab === 'team') renderTeam(body);
    else if (curTab === 'bag') renderBag(body);
    else if (curTab === 'dex') renderDex(body);
    else renderShop(body);
  }

  function monCardHtml(mon, i) {
    const st = stats(mon), p = hpPct(mon);
    return '<div class="mp-card' + (alive(mon) ? '' : ' dead') + '" data-i="' + i + '">' +
      '<div class="mp-emo">' + spec(mon).emoji + '</div>' +
      '<div class="mp-nm">' + esc(monName(mon)) + ' <span class="mp-lv">Lv' + mon.lv + '</span></div>' +
      '<div class="mp-types">' + typeBadges(mon) + '</div>' +
      '<div class="mp-bar ' + hpClass(p) + '"><i style="width:' + (p * 100).toFixed(1) + '%"></i></div>' +
      '<div class="mp-hpn">HP ' + Math.ceil(mon.hp) + '/' + st.maxhp + (mon.status ? ' ' + statusTag(mon) : '') + '</div>' +
      '<div class="mp-xp"><i style="width:' + clamp(mon.exp / expToNext(mon) * 100, 0, 100).toFixed(1) + '%"></i></div>' +
      '<div class="mp-hint">点击查看详情</div>' +
      '</div>';
  }
  function renderTeam(body) {
    let h = '<div class="mp-head"><b>我的队伍</b> <span>出战顺序 = 队伍顺序，首只自动出战</span></div><div class="mp-grid">';
    if (!S.team.length) h += '<div class="mp-empty">还没有精灵，去草丛里走走吧（或在下面领取初始精灵）。</div>';
    S.team.forEach(function (mon, i) { h += monCardHtml(mon, i); });
    if (S.team.length < 6) h += '<div class="mp-card add" id="mpAddMon"><div class="mp-emo">＋</div><div class="mp-nm">空位</div><div class="mp-hint">战斗中收服会自动加入</div></div>';
    h += '</div>';
    h += '<div class="mp-head"><b>宿舍箱子</b> <span>队伍满 6 只后，新收服的会寄存在这里（' + S.box.length + '）</span></div>';
    if (S.box.length) {
      h += '<div class="mp-grid small">';
      S.box.forEach(function (mon, i) {
        h += '<div class="mp-card mini" data-box="' + i + '"><div class="mp-emo">' + spec(mon).emoji + '</div>' +
          '<div class="mp-nm">' + esc(monName(mon)) + ' <span class="mp-lv">Lv' + mon.lv + '</span></div>' +
          '<div class="mp-hint">点击取回</div></div>';
      });
      h += '</div>';
    } else h += '<div class="mp-empty small">空</div>';
    body.innerHTML = h;
    body.querySelectorAll('.mp-card[data-i]').forEach(function (c) {
      c.onclick = function () { openDetail(S.team[+c.getAttribute('data-i')]); };
    });
    body.querySelectorAll('.mp-card[data-box]').forEach(function (c) {
      c.onclick = function () {
        const i = +c.getAttribute('data-box');
        if (S.team.length >= 6) { toast('队伍已满 6 只，先放生或寄存一只'); return; }
        S.team.push(S.box.splice(i, 1)[0]); save(); renderPanel(); toast('已取回队伍');
      };
    });
  }
  function renderBag(body) {
    let h = '<div class="mp-head"><b>背包</b> <span>战斗中可直接使用；平时点「使用」选择目标</span></div><div class="mp-list">';
    const keys = Object.keys(S.bag).filter(function (k) { return S.bag[k] > 0 && D.ITEMS[k]; });
    if (!keys.length) h += '<div class="mp-empty">背包空空如也，去教育超市买点东西吧。</div>';
    keys.forEach(function (k) {
      const it = D.ITEMS[k];
      h += '<div class="mp-item" data-k="' + k + '"><div class="mp-iico">' + it.emoji + '</div>' +
        '<div class="mp-iinfo"><p class="mp-iname">' + esc(it.name) + ' ×' + S.bag[k] + '</p>' +
        '<div class="mp-idesc">' + esc(it.desc) + '</div></div>' +
        '<button class="mp-use" data-use="' + k + '">使用</button></div>';
    });
    h += '</div>';
    body.innerHTML = h;
    body.querySelectorAll('[data-use]').forEach(function (b) {
      b.onclick = function () { useItemOut(b.getAttribute('data-use')); };
    });
  }
  function renderDex(body) {
    let h = '<div class="mp-head"><b>精灵图鉴</b> <span>已收服 <b>' + dexCaught() + '</b> / ' + D.SPECIES.length +
      ' · 已见到 ' + Object.keys(S.dex).length + '</span></div><div class="mp-dex">';
    D.SPECIES.forEach(function (s) {
      const rec = S.dex[String(s.id)];
      const got = rec && rec.caught;
      h += '<div class="mp-dexcell' + (got ? ' got' : (rec ? ' seen' : '')) + '" data-id="' + s.id + '">' +
        '<div class="mp-demo">' + (rec ? s.emoji : '❔') + '</div>' +
        '<div class="mp-dnm">' + (rec ? esc(s.name) : '???') + '</div>' +
        '<div class="mp-dno">No.' + String(s.id).padStart(3, '0') + '</div></div>';
    });
    h += '</div>';
    body.innerHTML = h;
    body.querySelectorAll('.mp-dexcell').forEach(function (c) {
      c.onclick = function () { openDex(+c.getAttribute('data-id')); };
    });
  }
  function renderShop(body) {
    let h = '<div class="mp-head"><b>教育超市</b> <span>持有学分 <b class="money">' + S.money + '</b></span></div><div class="mp-list">';
    Object.keys(D.ITEMS).forEach(function (k) {
      const it = D.ITEMS[k];
      h += '<div class="mp-item"><div class="mp-iico">' + it.emoji + '</div>' +
        '<div class="mp-iinfo"><p class="mp-iname">' + esc(it.name) + ' <span class="mp-price">' + it.price + ' 学分</span></p>' +
        '<div class="mp-idesc">' + esc(it.desc) + '</div></div>' +
        '<button class="mp-use" data-buy="' + k + '">购买</button></div>';
    });
    h += '</div>';
    h += '<div class="mp-head" style="margin-top:14px"><b>校医院</b> <span>免费治疗全队</span></div>' +
      '<button class="mp-wide" id="mpHeal">🏥 治疗全队（免费）</button>';
    body.innerHTML = h;
    body.querySelectorAll('[data-buy]').forEach(function (b) {
      b.onclick = function () {
        const k = b.getAttribute('data-buy'), it = D.ITEMS[k];
        if (S.money < it.price) { toast('学分不够，去多打几场'); return; }
        S.money -= it.price; itemAdd(k, 1); save(); renderPanel(); toast('购买了 ' + it.name);
      };
    });
    const hb = $('#mpHeal');
    if (hb) hb.onclick = function () {
      let n = 0;
      S.team.forEach(function (m) { if (m.hp < statHp(m) || m.status) { m.hp = statHp(m); m.status = null; n++; } });
      S.box.forEach(function (m) { if (m.hp < statHp(m) || m.status) { m.hp = statHp(m); m.status = null; n++; } });
      save(); renderPanel();
      toast(n ? ('已治疗 ' + n + ' 只精灵') : '全队都很健康');
    };
  }

  function useItemOut(key) {
    const it = D.ITEMS[key]; if (!it || !itemCount(key)) return;
    if (key.indexOf('ball') >= 0) { toast('精灵球只能在战斗中使用'); return; }
    if (key === 'candy') { chooseTarget('使用' + it.name, function (m) { return m.lv < 100; }, function (m) { itemUse(key, 1); gainExp(m, expToNext(m) - m.exp + 1); }); return; }
    if (key === 'revive') { chooseTarget(it.name, function (m) { return !alive(m); }, function (m) { itemUse(key, 1); m.hp = Math.floor(statHp(m) / 2); m.status = null; }); return; }
    if (key === 'potion') { chooseTarget(it.name, function (m) { return alive(m) && m.hp < statHp(m); }, function (m) { itemUse(key, 1); healMon(m, 30); }); return; }
    if (key === 'superpotion') { chooseTarget(it.name, function (m) { return alive(m) && m.hp < statHp(m); }, function (m) { itemUse(key, 1); healMon(m, 80); }); return; }
    if (key === 'fullheal') { chooseTarget(it.name, function (m) { return m.hp < statHp(m) || m.status; }, function (m) { itemUse(key, 1); m.hp = statHp(m); m.status = null; }); return; }
  }
  function chooseTarget(title, filter, fn) {
    const list = S.team.filter(filter);
    if (!list.length) { toast('没有合适的精灵'); return; }
    const p = $('#monPanel');
    const body = p.querySelector('.mp-body');
    let h = '<div class="mp-head"><b>' + esc(title) + '</b> <span>选择目标</span></div><div class="mp-grid">';
    S.team.forEach(function (mon, i) {
      const ok = filter(mon);
      h += '<div class="mp-card' + (ok ? '' : ' off') + '" data-t="' + i + '"><div class="mp-emo">' + spec(mon).emoji + '</div>' +
        '<div class="mp-nm">' + esc(monName(mon)) + ' <span class="mp-lv">Lv' + mon.lv + '</span></div>' +
        '<div class="mp-hpn">HP ' + Math.ceil(mon.hp) + '/' + statHp(mon) + '</div></div>';
    });
    h += '</div><button class="mp-wide ghost" id="mpCancel">取消</button>';
    body.innerHTML = h;
    body.querySelectorAll('.mp-card[data-t]').forEach(function (c) {
      c.onclick = function () {
        const mon = S.team[+c.getAttribute('data-t')];
        if (!filter(mon)) { toast('这只精灵不适用'); return; }
        fn(mon); save(); toast('已对 ' + monName(mon) + ' 使用'); renderPanel();
      };
    });
    const cb = $('#mpCancel'); if (cb) cb.onclick = function () { renderPanel(); };
  }

  function openDetail(mon) {
    const p = $('#monPanel'), body = p.querySelector('.mp-body');
    const st = stats(mon), s = spec(mon);
    let h = '<div class="mp-detail">' +
      '<div class="mp-dtop"><div class="mp-demo big">' + s.emoji + '</div><div>' +
      '<p class="mp-dname">' + esc(monName(mon)) + ' <span class="mp-lv">Lv' + mon.lv + '</span></p>' +
      '<div class="mp-types">' + typeBadges(mon) + '</div>' +
      '<div class="mp-bar ' + hpClass(hpPct(mon)) + '"><i style="width:' + (hpPct(mon) * 100).toFixed(1) + '%"></i></div>' +
      '<div class="mp-hpn">HP ' + Math.ceil(mon.hp) + '/' + st.maxhp + '　EXP ' + mon.exp + '/' + expToNext(mon) + '</div>' +
      '</div></div>' +
      '<div class="mp-stats">' +
      [['HP', st.maxhp], ['攻击', st.atk], ['防御', st.def], ['速度', st.spd]].map(function (r) {
        return '<div class="mp-st"><span>' + r[0] + '</span><i style="width:' + clamp(r[1] / 130 * 100, 4, 100) + '%"></i><b>' + r[1] + '</b></div>';
      }).join('') + '</div>' +
      '<div class="mp-head"><b>技能</b></div><div class="mp-moves">' +
      mon.moves.map(function (mv) {
        const def = D.MOVES[mv.name] || { type: 'normal', power: 0 };
        const T = D.TYPES[def.type];
        return '<div class="mp-mv"><span class="mv-n">' + esc(mv.name) + '</span>' +
          '<span class="mv-t" style="background:' + T.color + '">' + T.icon + T.name + '</span>' +
          '<span class="mv-p">' + (def.power ? '威力 ' + def.power : '变化') + '</span>' +
          '<span class="mv-pp">PP ' + mv.pp + '/' + mv.max + '</span></div>';
      }).join('') + '</div>' +
      '<div class="mp-head"><b>图鉴简介</b></div><div class="mp-desc">' + esc(s.d) + '<br><span class="mp-dno">No.' + String(s.id).padStart(3, '0') + ' · 出没：' + esc(s.sp || '未知') + '</span></div>' +
      '<div class="mp-ops">' +
      '<button class="mp-wide ghost" id="mpFirst">设为首发</button>' +
      '<button class="mp-wide ghost" id="mpRename">改昵称</button>' +
      '<button class="mp-wide ghost" id="mpRelease">放生</button>' +
      '<button class="mp-wide" id="mpBack">返回队伍</button>' +
      '</div></div>';
    body.innerHTML = h;
    $('#mpBack').onclick = function () { curTab = 'team'; renderPanel(); };
    $('#mpFirst').onclick = function () {
      const i = S.team.indexOf(mon); if (i <= 0) { toast('已经是首发'); return; }
      S.team.splice(i, 1); S.team.unshift(mon); save(); toast(monName(mon) + ' 成为首发'); curTab = 'team'; renderPanel();
    };
    $('#mpRename').onclick = function () {
      const n = prompt('给 ' + monName(mon) + ' 起个昵称（留空恢复原名）', mon.nick || '');
      if (n === null) return;
      mon.nick = String(n).trim().slice(0, 12); save(); openDetail(mon);
    };
    $('#mpRelease').onclick = function () {
      if (!confirm('确定放生 ' + monName(mon) + ' 吗？此操作不可撤销。')) return;
      const i = S.team.indexOf(mon); if (i >= 0) S.team.splice(i, 1);
      save(); toast('已放生 ' + monName(mon)); curTab = 'team'; renderPanel();
    };
  }
  function openDex(id) {
    const s = D.BY_ID[id], rec = S.dex[String(id)];
    const p = $('#monPanel'), body = p.querySelector('.mp-body');
    let h = '<div class="mp-detail"><div class="mp-dtop"><div class="mp-demo big">' + (rec ? s.emoji : '❔') + '</div><div>' +
      '<p class="mp-dname">' + esc(rec ? s.name : '???') + '</p>' +
      '<div class="mp-types">' + s.t.map(function (t) { const T = D.TYPES[t]; return '<i class="mb" style="background:' + T.color + '">' + T.icon + T.name + '</i>'; }).join('') + '</div>' +
      (rec ? '<div class="mp-hpn">状态：' + (rec.caught ? '已收服 ✅' : '仅见过 👀') + '</div>' : '<div class="mp-hpn">尚未遇见</div>') +
      '</div></div>' +
      '<div class="mp-stats">' +
      [['HP', s.b.hp], ['攻击', s.b.atk], ['防御', s.b.def], ['速度', s.b.spd]].map(function (r) {
        return '<div class="mp-st"><span>' + r[0] + '</span><i style="width:' + clamp(r[1] / 130 * 100, 4, 100) + '%"></i><b>' + r[1] + '</b></div>';
      }).join('') + '</div>' +
      '<div class="mp-head"><b>简介</b></div><div class="mp-desc">' + (rec ? esc(s.d) : '收服或遇见它之后，这里会显示详细介绍。') + '</div>' +
      (s.ev ? '<div class="mp-desc">可在 Lv' + s.ev.lv + ' 进化为 <b>' + esc(D.BY_ID[s.ev.to].name) + '</b></div>' : '') +
      '<button class="mp-wide" id="mpBack">返回图鉴</button></div>';
    body.innerHTML = h;
    $('#mpBack').onclick = function () { curTab = 'dex'; renderPanel(); };
  }

  /* ---------------- HUD ---------------- */
  function renderHud() {
    if (!HUD || !S) return;
    const lead = S.team[0];
    HUD.innerHTML = '💰 <b>' + S.money + '</b> 学分' +
      '　·　📖 图鉴 <b>' + dexCaught() + '/' + D.SPECIES.length + '</b>' +
      (lead ? '　·　' + spec(lead).emoji + ' <b>Lv' + lead.lv + '</b> <span class="mh-hp ' + hpClass(hpPct(lead)) + '"><i style="width:' + (hpPct(lead) * 100).toFixed(0) + '%"></i></span>' : '');
  }

  /* ---------------- 初始精灵三选一 ---------------- */
  function offerStarter() {
    const box = document.createElement('div');
    box.id = 'monStarter';
    box.innerHTML = '<div class="ms-card"><h3>🎓 选择你的第一只精灵</h3>' +
      '<div class="ms-sub">在立信的校园里，它们会一直陪着你</div><div class="ms-grid">' +
      [[1, '账芽苗', '草'], [6, '借火猫', '火'], [13, '概率鱼', '水']].map(function (r) {
        const s = D.BY_ID[r[0]];
        return '<div class="ms-opt" data-id="' + r[0] + '"><div class="ms-emo">' + s.emoji + '</div>' +
          '<div class="ms-nm">' + s.name + '</div>' +
          '<div class="ms-t">' + s.t.map(function (t) { return D.TYPES[t].icon + D.TYPES[t].name; }).join(' ') + '</div>' +
          '<div class="ms-d">' + esc(s.d) + '</div></div>';
      }).join('') + '</div></div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add('show'); });
    box.querySelectorAll('.ms-opt').forEach(function (o) {
      o.onclick = function () {
        const id = +o.getAttribute('data-id');
        // 初始精灵给中上个体值，让开局不至于被野怪压着打
        const mon = makeMon(id, 6, { iv: { hp: ri(9, 15), atk: ri(9, 15), def: ri(9, 15), spd: ri(9, 15) } });
        mon.metAt = '初始';
        S.team.push(mon);
        itemAdd('ball', 5); itemAdd('potion', 3);
        markCaught(id);
        save();
        box.classList.remove('show');
        setTimeout(function () { box.remove(); renderHud(); openPanel('team'); }, 320);
        if (typeof toast === 'function') toast('欢迎来到精灵学院！先去草丛里走走吧');
      };
    });
  }

  /* ---------------- 注入 DOM & 样式 ---------------- */
  function buildUI() {
    const panel = document.createElement('div');
    panel.id = 'monPanel';
    panel.innerHTML = '<div class="mp-win"><div class="mp-tabs">' +
      '<button class="mp-tab on" data-t="team">🐾 队伍</button>' +
      '<button class="mp-tab" data-t="bag">🎒 背包</button>' +
      '<button class="mp-tab" data-t="dex">📕 图鉴</button>' +
      '<button class="mp-tab" data-t="shop">🛒 超市</button>' +
      '<span class="mp-x" id="mpClose">✕</span></div>' +
      '<div class="mp-hud" id="mpHud"></div>' +
      '<div class="mp-body"></div>' +
      '<div class="mp-foot">按 <b>P</b> 快速打开 · 走草地会遇见野生精灵 · 数据保存在本机账号下</div></div>';
    document.body.appendChild(panel);
    HUD = panel.querySelector('#mpHud');
    panel.querySelectorAll('.mp-tab').forEach(function (b) {
      b.onclick = function () { curTab = b.getAttribute('data-t'); renderPanel(); };
    });
    panel.querySelector('#mpClose').onclick = closePanel;
    panel.addEventListener('click', function (e) { if (e.target === panel) closePanel(); });

    const bt = document.createElement('div');
    bt.id = 'monBattle';
    bt.innerHTML = '<div class="mb-inner"></div>';
    document.body.appendChild(bt);

    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------- 启动 ---------------- */
  function onAuthReady() {
    load();
    const fresh = !S.team.length && !S.stats.battles;
    renderHud();
    if (fresh) offerStarter();
    const nick = (window.MonAuth.profile && window.MonAuth.profile.nick) || '训练家';
    if (typeof toast === 'function') toast('欢迎回来，' + nick + '！按 P 打开精灵面板');
  }

  function boot() {
    buildUI();
    // 开屏选完形象 → 触发账号流程
    if (typeof window.hideSplash === 'function') {
      const orig = window.hideSplash;
      window.hideSplash = function () {
        const r = orig.apply(this, arguments);
        setTimeout(function () { window.MonAuth.boot(); }, 620);
        return r;
      };
    }
    // HUD 按钮
    const mb = document.getElementById('monBtn');
    if (mb) mb.onclick = function () {
      if (!window.MonAuth.current) { window.MonAuth.open(); return; }
      panelOpen ? closePanel() : openPanel(curTab);
    };
    const ab = document.getElementById('acctBtn');
    if (ab) ab.onclick = function () {
      if (window.MonAuth.current && window.MonAuth.current !== '__guest__') window.MonAuth.openProfile();
      else window.MonAuth.open();
    };
    // 快捷键
    window.addEventListener('keydown', function (e) {
      if (B.on) return;
      const t = e.target || {};
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || '')) return;   // 输入时不抢键
      if (e.code === 'KeyP' && !panelOpen) {
        if (!window.MonAuth.current) { window.MonAuth.open(); return; }
        openPanel('team');
      } else if (e.code === 'Escape' && panelOpen) { closePanel(); }
      else if (e.code === 'Escape' && window.MonAuth.isOpen()) { /* 登录前必须先登录或选游客 */ }
    });
  }

  /* ---------------- 样式 ---------------- */
  const CSS =
    /* 面板 */ '#monPanel{position:fixed;inset:0;z-index:9990;display:none;align-items:center;justify-content:center;' +
    'background:rgba(24,18,12,.6);padding:14px;overflow:auto;}' +
    '#monPanel.show{display:flex;}' +
    '.mp-win{width:min(760px,100%);max-height:92vh;display:flex;flex-direction:column;background:linear-gradient(180deg,#fffaf0,#f6ead0);' +
    'border:4px solid #8a5a3b;border-radius:18px;box-shadow:0 16px 44px rgba(40,26,12,.5);overflow:hidden;}' +
    '.mp-tabs{display:flex;align-items:center;gap:6px;padding:10px 12px;background:rgba(138,90,59,.12);border-bottom:2px solid #e0cda6;position:relative;}' +
    '.mp-tab{font-family:inherit;cursor:pointer;border:2px solid #d9c7a3;background:#fff;color:#8a7a62;border-radius:999px;padding:6px 14px;font-size:14px;}' +
    '.mp-tab.on{background:#d98a1f;border-color:#b9700f;color:#fff;}' +
    '.mp-x{position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px;color:#8a5a3b;padding:2px 8px;}' +
    '.mp-hud{padding:8px 14px;font-size:13px;color:#6b5a44;border-bottom:1px dashed #e0cda6;background:rgba(255,255,255,.5);}' +
    '.mh-hp{display:inline-block;width:70px;height:8px;border-radius:5px;background:#ddd;overflow:hidden;vertical-align:middle;}' +
    '.mh-hp i{display:block;height:100%;}' +
    '.mh-hp.ok i{background:#2f9e6b;} .mh-hp.mid i{background:#e0b60a;} .mh-hp.low i{background:#d4564b;}' +
    '.mp-body{flex:1;overflow:auto;padding:12px 14px;}' +
    '.mp-foot{padding:8px 14px;font-size:11px;color:#98876c;text-align:center;border-top:1px dashed #e0cda6;}' +
    '.mp-head{display:flex;align-items:baseline;gap:10px;margin:6px 0 10px;font-size:14px;color:#6e452c;}' +
    '.mp-head span{font-size:11px;color:#98876c;}' +
    '.mp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}' +
    '.mp-card{background:#fff;border:2px solid #e6d5b4;border-radius:14px;padding:10px;text-align:center;cursor:pointer;' +
    'transition:transform .1s, box-shadow .1s;}' +
    '.mp-card:hover{transform:translateY(-2px);box-shadow:0 6px 14px rgba(120,90,50,.18);}' +
    '.mp-card.dead{filter:grayscale(.85);opacity:.6;}' +
    '.mp-card.off{opacity:.38;cursor:not-allowed;}' +
    '.mp-card.add{border-style:dashed;background:rgba(255,255,255,.4);}' +
    '.mp-card.mini{padding:6px;}' +
    '.mp-emo{font-size:38px;line-height:1.1;}' +
    '.mp-card.mini .mp-emo{font-size:26px;}' +
    '.mp-nm{font-size:14px;color:#3a2f25;margin-top:2px;}' +
    '.mp-lv{font-size:11px;color:#d98a1f;font-weight:bold;}' +
    '.mp-types{margin:4px 0;}' +
    '.mb{display:inline-block;font-style:normal;font-size:10px;color:#fff;border-radius:999px;padding:1px 7px;margin:0 2px;}' +
    '.mp-bar,.mb-hpbar{height:8px;border-radius:5px;background:#e3dccd;overflow:hidden;margin:4px 0;}' +
    '.mp-bar i,.mb-hpbar i{display:block;height:100%;background:#2f9e6b;transition:width .3s;}' +
    '.mp-bar.mid i,.mb-hpbar.mid i{background:#e0b60a;}' +
    '.mp-bar.low i,.mb-hpbar.low i{background:#d4564b;}' +
    '.mp-hpn{font-size:11px;color:#8a7a62;}' +
    '.mp-xp{height:4px;border-radius:3px;background:#e3dccd;overflow:hidden;margin-top:4px;}' +
    '.mp-xp i{display:block;height:100%;background:#3b7fd4;}' +
    '.mp-hint{font-size:10px;color:#b0a288;margin-top:4px;}' +
    '.mp-empty{padding:18px;text-align:center;color:#a2937a;font-size:13px;}' +
    '.mp-empty.small{padding:8px;font-size:12px;}' +
    '.mp-list{display:flex;flex-direction:column;gap:8px;}' +
    '.mp-item{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #e6d5b4;border-radius:12px;padding:8px 10px;}' +
    '.mp-iico{font-size:26px;width:38px;text-align:center;}' +
    '.mp-iinfo{flex:1;min-width:0;}' +
    '.mp-iname{margin:0;font-size:14px;color:#3a2f25;}' +
    '.mp-price{font-size:11px;color:#d98a1f;}' +
    '.mp-idesc{font-size:11px;color:#8a7a62;line-height:1.5;}' +
    '.mp-use{font-family:inherit;cursor:pointer;border:none;border-radius:999px;padding:7px 14px;font-size:13px;background:#d98a1f;color:#fff;box-shadow:0 2px 0 #b9700f;}' +
    '.mp-use:active{transform:translateY(1px);box-shadow:0 1px 0 #b9700f;}' +
    '.mp-wide{width:100%;font-family:inherit;cursor:pointer;border:none;border-radius:999px;padding:10px 0;font-size:14px;' +
    'background:#d98a1f;color:#fff;box-shadow:0 3px 0 #b9700f;margin-top:8px;}' +
    '.mp-wide.ghost{background:#fff;color:#6e452c;box-shadow:0 3px 0 #d9c7a3;}' +
    '.mp-dex{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;}' +
    '.mp-dexcell{background:#fff;border:2px solid #e6d5b4;border-radius:10px;padding:6px 2px;text-align:center;cursor:pointer;opacity:.55;}' +
    '.mp-dexcell.seen{opacity:.8;}' +
    '.mp-dexcell.got{opacity:1;border-color:#d98a1f;background:#fffdf5;}' +
    '.mp-demo{font-size:24px;line-height:1.1;}' +
    '.mp-demo.big{font-size:56px;}' +
    '.mp-dnm{font-size:11px;color:#3a2f25;}' +
    '.mp-dno{font-size:9px;color:#b0a288;}' +
    '.mp-detail{background:#fff;border:2px solid #e6d5b4;border-radius:14px;padding:12px;}' +
    '.mp-dtop{display:flex;gap:14px;align-items:center;border-bottom:1px dashed #e6d5b4;padding-bottom:10px;}' +
    '.mp-dname{margin:0;font-size:19px;color:#3a2f25;}' +
    '.mp-stats{margin-top:10px;}' +
    '.mp-st{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:12px;color:#6b5a44;}' +
    '.mp-st span{width:34px;}' +
    '.mp-st i{display:block;height:7px;border-radius:4px;background:#d98a1f;flex:1;max-width:220px;}' +
    '.mp-moves{display:grid;grid-template-columns:1fr 1fr;gap:6px;}' +
    '.mp-mv{display:flex;align-items:center;gap:6px;background:#faf4e6;border:1px solid #ece0c6;border-radius:9px;padding:5px 8px;font-size:11px;}' +
    '.mp-desc{font-size:12px;line-height:1.7;color:#6b5a44;background:#faf4e6;border-radius:10px;padding:8px 10px;}' +
    '.mp-ops{margin-top:12px;}' +
    /* 初始精灵 */ '#monStarter{position:fixed;inset:0;z-index:9995;display:flex;align-items:center;justify-content:center;' +
    'background:rgba(24,18,12,.72);padding:14px;opacity:0;transition:opacity .3s;}' +
    '#monStarter.show{opacity:1;}' +
    '.ms-card{width:min(720px,100%);background:linear-gradient(180deg,#fffaf0,#f6ead0);border:4px solid #8a5a3b;' +
    'border-radius:18px;padding:18px;box-shadow:0 16px 44px rgba(40,26,12,.5);}' +
    '.ms-card h3{margin:0 0 4px;text-align:center;color:#6e452c;font-size:20px;}' +
    '.ms-sub{text-align:center;font-size:12px;color:#98876c;margin-bottom:14px;}' +
    '.ms-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}' +
    '.ms-opt{background:#fff;border:3px solid #e6d5b4;border-radius:14px;padding:12px;text-align:center;cursor:pointer;transition:transform .12s,border-color .12s;}' +
    '.ms-opt:hover{transform:translateY(-4px);border-color:#d98a1f;}' +
    '.ms-emo{font-size:52px;}' +
    '.ms-nm{font-size:16px;color:#3a2f25;margin-top:4px;}' +
    '.ms-t{font-size:11px;color:#8a7a62;margin:2px 0;}' +
    '.ms-d{font-size:11px;color:#98876c;line-height:1.6;}' +
    /* 战斗 */ '#monBattle{position:fixed;inset:0;z-index:9996;display:none;align-items:center;justify-content:center;' +
    'background:rgba(16,12,8,.78);padding:12px;}' +
    '#monBattle.show{display:flex;}' +
    '.mb-inner{width:min(560px,100%);max-height:94vh;display:flex;flex-direction:column;background:linear-gradient(180deg,#fdf6e6,#f0e3c6);' +
    'border:4px solid #5c4a34;border-radius:16px;overflow:hidden;box-shadow:0 16px 44px rgba(0,0,0,.5);}' +
    '.mb-stage{padding:12px;background:linear-gradient(180deg,#cfe9c0,#a9d69a 60%,#93c98a);border-bottom:3px solid #5c4a34;}' +
    '.mb-side{display:flex;align-items:center;gap:10px;}' +
    '.mb-side.wild{justify-content:flex-start;}' +
    '.mb-side.mine{flex-direction:row-reverse;margin-top:6px;}' +
    '.mb-card{background:rgba(255,255,255,.92);border:2px solid #5c4a34;border-radius:10px;padding:6px 10px;min-width:190px;flex:1;}' +
    '.mb-card.hit{animation:mbHit .3s;}' +
    '@keyframes mbHit{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}' +
    '.mb-top{display:flex;align-items:center;gap:6px;}' +
    '.mb-nm{font-size:14px;color:#3a2f25;}' +
    '.mb-lv{font-size:11px;color:#c47b12;font-weight:bold;}' +
    '.mb-st{font-style:normal;font-size:10px;border-radius:999px;padding:1px 6px;color:#fff;}' +
    '.mb-st.burn{background:#e8642d;} .mb-st.poison{background:#8e44ad;} .mb-st.para{background:#e0b60a;}' +
    '.mb-hpnum{font-size:10px;color:#6b5a44;text-align:right;}' +
    '.mb-exp{height:4px;border-radius:3px;background:#e3dccd;overflow:hidden;margin-top:3px;}' +
    '.mb-exp i{display:block;height:100%;background:#3b7fd4;}' +
    '.mb-sprite{font-size:52px;line-height:1;filter:drop-shadow(0 4px 4px rgba(0,0,0,.25));}' +
    '.mb-vs{text-align:center;font-size:10px;color:#4a6b3c;margin:2px 0;letter-spacing:.2em;}' +
    '.mb-log{flex:1;min-height:110px;max-height:170px;overflow:auto;padding:8px 12px;font-size:12px;line-height:1.7;' +
    'background:#fffdf5;border-bottom:2px solid #d9c7a3;}' +
    '.mb-line{color:#4a4034;}' +
    '.mb-line.me{color:#1f6f9c;} .mb-line.wild{color:#a8501f;}' +
    '.mb-line.good{color:#1f7a4d;font-weight:bold;} .mb-line.bad{color:#b23b2e;} .mb-line.sys{color:#8a7a62;}' +
    '.mb-acts{padding:10px;background:#f3e6cc;display:grid;grid-template-columns:1fr;gap:8px;}' +
    '.mb-acts-main{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;}' +
    '.mb-btn{font-family:inherit;cursor:pointer;border:2px solid #b9a480;background:#fff;color:#4a4034;' +
    'border-radius:10px;padding:8px 2px;font-size:12px;box-shadow:0 2px 0 #b9a480;}' +
    '.mb-btn:active{transform:translateY(2px);box-shadow:none;}' +
    '.mb-acts-sub{display:grid;grid-template-columns:1fr 1fr;gap:6px;}' +
    '.mb-mv{font-family:inherit;cursor:pointer;border:2px solid #b9a480;background:#fff;color:#3a2f25;border-radius:10px;' +
    'padding:7px 8px;text-align:left;display:flex;flex-wrap:wrap;align-items:center;gap:5px;font-size:11px;}' +
    '.mb-mv.off{opacity:.45;}' +
    '.mv-n{font-size:13px;}' +
    '.mv-t{font-size:10px;color:#fff;border-radius:999px;padding:1px 6px;}' +
    '.mv-p{font-size:10px;color:#8a7a62;} .mv-pp{font-size:10px;color:#a2937a;margin-left:auto;}' +
    '.mb-empty{grid-column:1/-1;text-align:center;font-size:12px;color:#8a7a62;padding:8px;}' +
    '@media (max-width:640px){' +
    '.mp-grid{grid-template-columns:repeat(2,1fr);}' +
    '.mp-dex{grid-template-columns:repeat(4,1fr);}' +
    '.mp-moves{grid-template-columns:1fr;}' +
    '.ms-grid{grid-template-columns:1fr;}' +
    '.mb-acts-main{grid-template-columns:repeat(3,1fr);}' +
    '.mb-acts-sub{grid-template-columns:1fr;}' +
    '.mb-sprite{font-size:42px;}' +
    '.mb-card{min-width:0;}' +
    '}';

  /* 供 index.html 主循环调用 */
  window.__monTick = tick;

  window.MonGame = {
    boot: boot,
    onAuthReady: onAuthReady,
    openPanel: openPanel,
    closePanel: closePanel,
    save: save,
    toast: function (m) { if (typeof toast === 'function') toast(m); else console.log('[mon]', m); },
    debug: {
      startWild: startWild,
      state: function () { return S; },
      give: function (id, lv) { const m = makeMon(id, lv || 5); teamAdd(m); save(); return m; },
      act: act,
      battle: function () { return B; },
      gainExp: gainExp,
      stats: stats,
      makeMon: makeMon,
      damageOf: function (src, dst, mv) { return damageOf(src, dst, mv); },
      catchOdds: catchOdds,
      typeEff: function (a, d) { return D.typeEff(a, d); }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

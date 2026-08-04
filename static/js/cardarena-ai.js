// cardarena-ai.js — CardArena 基础 AI（贪心策略，生成器逐步产出行动）
// 注意：AI 直接操作 side 状态对象（与 engine 共享引用），并复用 engine 的 _internal 接口
// runTurn 改为生成器：逐步 yield 行动描述（出牌/攻击/换人），由 engine 驱动、UI 逐帧演出
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

  // 从手牌中选一张值得打出的牌（优先随从，其次解场法术）
  function chooseCard(side, enemy) {
    var hand = side.hand;
    for (var i = 0; i < hand.length; i++) {
      var card = getCard(hand[i]);
      if (card && card.type === 'minion' && card.cost <= side.mana) return i;
    }
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

  function pickTargetForMinion(minion, targets) {
    // 优先攻击能击杀的目标（attack >= 目标血量），其次高攻目标
    var withInfo = targets.map(function (t) {
      if (t.kind === 'hero') return { t: t, attack: 0, health: Infinity };
      return { t: t, attack: t.minion ? t.minion.attack : 0, health: t.minion ? t.minion.health : Infinity };
    });
    var killable = withInfo.filter(function (x) { return x.t.kind === 'minion' && x.health <= minion.attack; });
    var p = killable.length > 0 ? killable : withInfo;
    return p[p.length - 1].t;
  }

  // 换人决策：当前角色血量低且存活角色中有更健康者则换上（仅返回下标，不在 AI 层改状态）
  function decideSwap(side) {
    var hero = side.roster[side.activeIndex];
    if (hero.health > hero.maxHealth * 0.3) return -1;
    var best = -1;
    for (var i = 0; i < side.roster.length; i++) {
      var r = side.roster[i];
      if (!r.alive || i === side.activeIndex) continue;
      if (best === -1 || r.health > side.roster[best].health) best = i;
    }
    return best;
  }

  window.CARDARENA_AI = {
    // 生成器：逐步产出 AI 行动（出牌/攻击/换人），由 engine 驱动并在每步间插入演出动画
    runTurn: function* (side, enemy) {
      var engine = window.CardArena._internal;
      // ===== 阶段1：出牌 =====
      for (var guard = 0; guard < 20; guard++) {
        var handIndex = chooseCard(side, enemy);
        if (handIndex === -1) break;
        var card = getCard(side.hand[handIndex]);
        if (!card || card.cost > side.mana) break;
        if (card.type === 'minion') {
          if (aliveBoard(side).length >= window.CARDARENA_DATA.GAME_CONFIG.minionLimit) break;
          yield { type: 'play', handIndex: handIndex, cardId: card.id, target: null };
        } else {
          var eff = card.effect;
          if (!eff) { yield { type: 'play', handIndex: handIndex, cardId: card.id, target: null }; continue; }
          if (eff.target === 'none') { yield { type: 'play', handIndex: handIndex, cardId: card.id, target: null }; continue; }
          var target = chooseSpellTarget(eff, side, enemy);
          if (!target) break;   // 该牌无合适目标，跳出避免死循环
          yield { type: 'play', handIndex: handIndex, cardId: card.id, target: target };
        }
      }
      // ===== 阶段2：攻击（每个可攻击单位各产出一次，由 engine 逐步演出）=====
      var minions = aliveBoard(side).slice();
      for (var mi = 0; mi < minions.length; mi++) {
        var m = minions[mi];
        if (!engine.canActAsAttacker(side, m)) continue;
        var targets = engine.validAttackTargets(side).map(function (t) {
          if (t.kind === 'hero') return t;
          var mm = enemy.board.find(function (x) { return x.uid === t.uid; });
          return { kind: 'minion', side: t.side, uid: t.uid, minion: mm };
        });
        var t = pickTargetForMinion(m, targets);
        if (t) yield { type: 'attack', attacker: m, target: t };
      }
      var hero = side.roster[side.activeIndex];
      if (hero.attack > 0 && !side.roleAttacked) {
        var live = engine.validAttackTargets(side);
        if (live.length > 0) {
          var ht = live[live.length - 1];
          yield { type: 'attack', attacker: { kind: 'hero', attack: hero.attack }, target: ht };
        }
      }
      // ===== 阶段3：换人 =====
      var sw = decideSwap(side);
      if (sw !== -1) yield { type: 'swap', roleIndex: sw };
    }
  };
})();

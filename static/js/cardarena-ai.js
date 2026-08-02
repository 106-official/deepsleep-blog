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
    // 出战角色攻击：从当前存活合法目标中选取（避免攻击已被随从击杀的目标）
    var hero = side.roster[side.activeIndex];
    if (hero.attack > 0 && !side.roleAttacked) {
      var live = engine.validAttackTargets(side);
      if (live.length > 0) {
        var ht = live[live.length - 1];
        engine.combat(side, { kind: 'hero', attack: hero.attack }, ht);
      }
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
    // 每张牌放 2 份（12 张），与引擎 buildDeck 保持一致，避免抽牌类效果提前失效
    def.deck.forEach(function (cid) {
      var card = getCard(cid);
      if (card) deck.push(card.id, card.id);
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

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

  // 将 side 引用统一解析为真实 side 对象（UI 传入的可能是 'enemy'/'player' 字符串）
  function resolveSide(ref) {
    if (typeof ref === 'string') return ref === 'enemy' ? state.enemy : state.player;
    return ref;
  }

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
      kind: 'minion',                    // 标记随从类型（combat 反击/毒杀等依赖 kind 判断）
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
    // 解析目标真实引用：UI 传入 {kind:'hero', side:'enemy'}（字符串）或 {kind:'minion', uid}（无 side）
    var realTarget = target;
    if (target.kind === 'minion' && !target.health) {
      var mSide = resolveSide(target.side) || opposite(attackerSide);
      realTarget = mSide.board.find(function (m) { return m.uid === target.uid; }) || target;
    } else if (target.kind === 'hero' && typeof target.side === 'string') {
      realTarget = { kind: 'hero', side: resolveSide(target.side) };
    }
    // 解析攻击者：英雄攻击者需补 side 引用（反击结算需要）
    var realAttacker = attacker;
    if (attacker.kind === 'hero' && !attacker.side) {
      realAttacker = { kind: 'hero', side: attackerSide, attack: attacker.attack };
    }
    var aAtk = realAttacker.attack;
    if (realAttacker.kind === 'minion') {
      realAttacker.attacksLeft = (realAttacker.attacksLeft || 1) - 1;
      if (realAttacker.attacksLeft <= 0) realAttacker.exhausted = true;
    } else {
      attackerSide.roleAttacked = true;
    }
    addLog((realAttacker.kind === 'hero' ? activeRole(attackerSide).name : realAttacker.name)
      + ' 攻击 ' + (realTarget.kind === 'hero' ? activeRole(realTarget.side).name : realTarget.name));

    // 攻击者伤害目标
    dealDamage(attackerSide, realTarget, aAtk);
    if (hasKeyword(realAttacker, 'poison') && realTarget.kind === 'minion' && realTarget.health > 0) {
      realTarget.health = 0;
      addLog(realTarget.name + ' 被剧毒击杀');
      if (hasKeyword(realTarget, 'deathrattle')) applyEffect(realTarget.effect, realTarget.side, null);
      cleanupBoard(realTarget.side);
    }
    // 目标反击（若目标是存活且可攻击的随从）
    if (realTarget.kind === 'minion' && realTarget.health > 0 && realTarget.attack > 0) {
      dealDamage(realTarget.side, realAttacker, realTarget.attack);
      if (hasKeyword(realTarget, 'poison') && realAttacker.kind === 'minion' && realAttacker.health > 0) {
        realAttacker.health = 0;
        addLog(realAttacker.name + ' 被剧毒反击击杀');
        if (hasKeyword(realAttacker, 'deathrattle')) applyEffect(realAttacker.effect, realAttacker.side, null);
        cleanupBoard(realAttacker.side);
      }
    }
    if (realAttacker.kind === 'minion' && realAttacker.health <= 0) cleanupBoard(realAttacker.side);
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
        // ally_* 目标为己方，enemy_* 目标为敌方（治疗/增益卡选己方，伤害卡选敌方）
        var targetSide = eff.target.indexOf('enemy') === 0 ? state.enemy : state.player;
        var sideStr = targetSide === state.player ? 'player' : 'enemy';
        var targets = findTarget(targetSide, eff.target);
        return targets.map(function (t) {
          return t.kind === 'hero' ? { kind: 'hero', side: sideStr } : { kind: 'minion', side: sideStr, uid: t.uid };
        });
      }
      if (state.pendingAttack) {
        return validAttackTargets(state.player).map(function (t) {
          return t.kind === 'hero' ? { kind: 'hero', side: 'enemy' } : { kind: 'minion', side: 'enemy', uid: t.uid };
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

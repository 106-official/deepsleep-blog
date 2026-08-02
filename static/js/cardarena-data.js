// cardarena-data.js — CardArena 数据驱动层（用户可自行修改本文件自定义角色与卡牌）
window.CARDARENA_DATA = (function () {
  'use strict';

  // 全局配置
  const GAME_CONFIG = {
    handLimit: 7,
    manaMax: 5,
    manaStart: 3,
    manaRegen: 2,
    minionLimit: 4,
    startingHand: 3,
    drawPerTurn: 1
  };

  // 角色池（8 个，玩家选 6，AI 随机 6）
  const ROLE_POOL = [
    { id: 'r1', name: '守序者', title: '宫廷侍卫长', titleEn: 'ROYAL GUARD', intro: '沉稳的防线，每回合恢复少量生命', maxHealth: 20, attack: 2,
      passive: { type: 'heal', target: 'ally_hero', value: 1 },
      deck: ['c1', 'c2', 'g-m1', 'g-m2', 'g-m5', 'g-s1'] },
    { id: 'r2', name: '仲裁者', title: '大殿法官', titleEn: 'GRAND JUDGE', intro: '以攻代守，己方随从获得额外攻击', maxHealth: 18, attack: 3,
      passive: { type: 'buff', target: 'ally_minion', attack: 1 },
      deck: ['c3', 'c4', 'g-m1', 'g-m3', 'g-m4', 'g-s1'] },
    { id: 'r3', name: '预言家', title: '宫廷占星师', titleEn: 'COURT ASTROLOGER', intro: '洞悉先机，每回合多抽一张牌', maxHealth: 18, attack: 1,
      passive: { type: 'draw', target: 'none', value: 1 },
      deck: ['c5', 'c6', 'g-m1', 'g-m4', 'g-m7', 'g-s3'] },
    { id: 'r4', name: '守夜人', title: '夜巡统领', titleEn: 'NIGHT WARDEN', intro: '坚实的壁垒，随从获得额外生命', maxHealth: 22, attack: 2,
      passive: { type: 'buff', target: 'ally_minion', health: 1 },
      deck: ['c7', 'c8', 'g-m2', 'g-m5', 'g-m7', 'g-s2'] },
    { id: 'r5', name: '爆破手', title: '军械监制', titleEn: 'ARSENAL MASTER', intro: '高攻脆弱，每回合灼烧敌方随从', maxHealth: 16, attack: 4,
      passive: { type: 'damage', target: 'enemy_minion', value: 1 },
      deck: ['c9', 'c10', 'g-m1', 'g-m3', 'g-m6', 'g-s4'] },
    { id: 'r6', name: '召集者', title: '禁军教头', titleEn: 'DRILLMASTER', intro: '源源不断，每回合召唤小兵', maxHealth: 20, attack: 1,
      passive: { type: 'summon', target: 'none', cardId: 'c17' },
      deck: ['c11', 'c12', 'g-m1', 'g-m4', 'g-m7', 'g-s3'] },
    { id: 'r7', name: '守望者', title: '瞭望塔主', titleEn: 'TOWER WARDEN', intro: '远程压制，每回合灼烧敌方角色', maxHealth: 20, attack: 3,
      passive: { type: 'damage', target: 'enemy_hero', value: 1 },
      deck: ['c13', 'c14', 'g-m2', 'g-m5', 'g-m8', 'g-s2'] },
    { id: 'r8', name: '影行者', title: '密探之首', titleEn: 'SPYMASTER', intro: '攻血双修的刺客，随从全面强化', maxHealth: 16, attack: 3,
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

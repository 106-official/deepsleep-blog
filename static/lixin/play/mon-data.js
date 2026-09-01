/* ============================================================
   Lixin · 精灵学院  ——  数据层 (mon-data.js)
   立信主题的原创宠物、属性克制、技能池、道具与遇敌表。
   纯数据，无副作用；挂载到 window.MonData。
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 属性 ---------- */
  const TYPES = {
    grass:    { name: '草木', icon: '🌿', color: '#4caf7d' },
    fire:     { name: '火焰', icon: '🔥', color: '#e8642d' },
    water:    { name: '水流', icon: '💧', color: '#3b7fd4' },
    electric: { name: '雷电', icon: '⚡', color: '#e0b60a' },
    psychic:  { name: '超能', icon: '🔮', color: '#9b5ac9' },
    rock:     { name: '岩石', icon: '🪨', color: '#9a8358' },
    steel:    { name: '钢铁', icon: '🛡️', color: '#6e8ba3' },
    dark:     { name: '暗影', icon: '🌙', color: '#4a4468' },
    light:    { name: '荣耀', icon: '✨', color: '#e8b83a' },
    flying:   { name: '飞行', icon: '🌪️', color: '#6fb6c9' },
    normal:   { name: '普通', icon: '⭐', color: '#a89a86' }
  };

  /* 克制表：CHART[攻][守] = 倍率，缺省 1 */
  const CHART = {
    normal:   { rock: 0.5, steel: 0.5 },
    fire:     { grass: 2, steel: 2, water: 0.5, rock: 0.5, fire: 0.5, light: 0.5 },
    water:    { fire: 2, rock: 2, grass: 0.5, electric: 0.5, water: 0.5 },
    grass:    { water: 2, rock: 2, fire: 0.5, flying: 0.5, grass: 0.5, steel: 0.5 },
    electric: { water: 2, flying: 2, grass: 0.5, rock: 0.5, electric: 0.5 },
    psychic:  { dark: 2, fire: 2, steel: 0.5, rock: 0.5, psychic: 0.5 },
    rock:     { fire: 2, electric: 2, flying: 2, water: 0.5, grass: 0.5, steel: 0.5 },
    steel:    { rock: 2, light: 2, fire: 0.5, psychic: 0.5, steel: 0.5 },
    dark:     { psychic: 2, light: 2, steel: 0.5, dark: 0.5 },
    light:    { dark: 2, fire: 0.5, light: 0.5 },
    flying:   { grass: 2, psychic: 2, electric: 0.5, rock: 0.5, steel: 0.5 }
  };

  function typeEff(atkType, defTypes) {
    let m = 1;
    const row = CHART[atkType] || {};
    (defTypes || []).forEach(function (d) { m *= (row[d] === undefined ? 1 : row[d]); });
    return m;
  }

  /* ---------- 技能 ----------
     power: 0 表示变化技；effect: dmg / heal / atkUp / atkDown / defUp / para / burn / poison
  */
  const MOVES = {
    '撞击':     { type: 'normal',   power: 40,  acc: 1.00, pp: 35, effect: 'dmg' },
    '藤鞭':     { type: 'grass',    power: 42,  acc: 1.00, pp: 30, effect: 'dmg' },
    '飞叶快刀': { type: 'grass',    power: 62,  acc: 0.95, pp: 20, effect: 'dmg' },
    '光合作用': { type: 'grass',    power: 0,   acc: 1.00, pp: 10, effect: 'heal', val: 0.5 },
    '寄生种子': { type: 'grass',    power: 0,   acc: 0.90, pp: 12, effect: 'poison' },
    '火花':     { type: 'fire',     power: 42,  acc: 1.00, pp: 30, effect: 'dmg' },
    '火焰踢':   { type: 'fire',     power: 66,  acc: 0.95, pp: 18, effect: 'dmg' },
    '喷射火焰': { type: 'fire',     power: 92,  acc: 0.90, pp: 10, effect: 'dmg' },
    '灼烧':     { type: 'fire',     power: 0,   acc: 0.85, pp: 12, effect: 'burn' },
    '水枪':     { type: 'water',    power: 42,  acc: 1.00, pp: 30, effect: 'dmg' },
    '水流尾':   { type: 'water',    power: 68,  acc: 0.95, pp: 18, effect: 'dmg' },
    '冲浪':     { type: 'water',    power: 92,  acc: 0.90, pp: 10, effect: 'dmg' },
    '泡沫光线': { type: 'water',    power: 0,   acc: 0.95, pp: 16, effect: 'atkDown' },
    '电击':     { type: 'electric', power: 42,  acc: 1.00, pp: 30, effect: 'dmg' },
    '电光一闪': { type: 'electric', power: 66,  acc: 0.95, pp: 18, effect: 'dmg' },
    '十万伏特': { type: 'electric', power: 92,  acc: 0.90, pp: 10, effect: 'dmg' },
    '电磁波':   { type: 'electric', power: 0,   acc: 0.90, pp: 14, effect: 'para' },
    '念力':     { type: 'psychic',  power: 48,  acc: 1.00, pp: 25, effect: 'dmg' },
    '幻象术':   { type: 'psychic',  power: 86,  acc: 0.92, pp: 12, effect: 'dmg' },
    '冥想':     { type: 'psychic',  power: 0,   acc: 1.00, pp: 14, effect: 'atkUp' },
    '落石':     { type: 'rock',     power: 52,  acc: 0.95, pp: 22, effect: 'dmg' },
    '岩崩':     { type: 'rock',     power: 78,  acc: 0.88, pp: 12, effect: 'dmg' },
    '硬化':     { type: 'rock',     power: 0,   acc: 1.00, pp: 16, effect: 'defUp' },
    '金属爪':   { type: 'steel',    power: 52,  acc: 0.95, pp: 24, effect: 'dmg' },
    '铁头':     { type: 'steel',    power: 82,  acc: 0.90, pp: 12, effect: 'dmg' },
    '磨爪':     { type: 'steel',    power: 0,   acc: 1.00, pp: 14, effect: 'atkUp' },
    '暗算':     { type: 'dark',     power: 52,  acc: 1.00, pp: 22, effect: 'dmg' },
    '咬碎':     { type: 'dark',     power: 82,  acc: 0.90, pp: 12, effect: 'dmg' },
    '恐吓':     { type: 'dark',     power: 0,   acc: 0.95, pp: 16, effect: 'atkDown' },
    '闪光':     { type: 'light',    power: 48,  acc: 1.00, pp: 24, effect: 'dmg' },
    '圣光冲击': { type: 'light',    power: 88,  acc: 0.90, pp: 10, effect: 'dmg' },
    '净化':     { type: 'light',    power: 0,   acc: 1.00, pp: 8,  effect: 'heal', val: 0.45 },
    '啄':       { type: 'flying',   power: 38,  acc: 1.00, pp: 32, effect: 'dmg' },
    '翅膀攻击': { type: 'flying',   power: 62,  acc: 1.00, pp: 20, effect: 'dmg' },
    '燕返':     { type: 'flying',   power: 78,  acc: 0.95, pp: 14, effect: 'dmg' },
    '顺风':     { type: 'flying',   power: 0,   acc: 1.00, pp: 14, effect: 'defUp' }
  };

  /* 各属性默认技能组（未单独指定 moves 的宠物使用） */
  const TYPE_MOVES = {
    grass:    ['撞击', '藤鞭', '飞叶快刀', '光合作用'],
    fire:     ['撞击', '火花', '火焰踢', '喷射火焰'],
    water:    ['撞击', '水枪', '水流尾', '冲浪'],
    electric: ['撞击', '电击', '电光一闪', '十万伏特'],
    psychic:  ['撞击', '念力', '幻象术', '冥想'],
    rock:     ['撞击', '落石', '岩崩', '硬化'],
    steel:    ['撞击', '金属爪', '铁头', '磨爪'],
    dark:     ['撞击', '暗算', '咬碎', '恐吓'],
    light:    ['撞击', '闪光', '圣光冲击', '净化'],
    flying:   ['啄', '翅膀攻击', '燕返', '顺风'],
    normal:   ['撞击', '撞击', '撞击', '撞击']
  };

  /* ---------- 图鉴 ----------
     b  = 种族值 {hp,atk,def,spd}
     t  = 属性数组
     ev = 进化 {lv, to}
     cr = 捕获难度（越大越好抓，0.2 ~ 1.2）
     sp = 出没地带
     d  = 图鉴简介
  */
  const SPECIES = [
    { id: 1,  name: '账芽苗',   emoji: '🌱', t: ['grass'],              b: { hp: 46, atk: 49, def: 45, spd: 46 }, cr: 1.10, ev: { lv: 12, to: 2 },   sp: '草地', d: '刚发的新芽，最爱在图书馆窗台晒太阳，据说记账时特别专注。' },
    { id: 2,  name: '账本藤',   emoji: '🌿', t: ['grass'],              b: { hp: 62, atk: 64, def: 60, spd: 56 }, cr: 0.75, ev: { lv: 27, to: 3 },   sp: '草地', d: '藤蔓会自己排列成三栏式账页，期末周常被人借去整理笔记。' },
    { id: 3,  name: '报表树',   emoji: '🌳', t: ['grass', 'steel'],     b: { hp: 88, atk: 90, def: 98, spd: 60 }, cr: 0.42, sp: '草地',              d: '树干上天然长着资产负债表，风吹过时沙沙作响，像在核对数字。' },

    { id: 4,  name: '算珠鼠',   emoji: '🐭', t: ['steel'],              b: { hp: 48, atk: 55, def: 62, spd: 52 }, cr: 1.05, ev: { lv: 20, to: 5 },   sp: '建筑区', d: '尾巴是一整排算珠，紧张时会飞快地来回拨动。' },
    { id: 5,  name: '算盘侠',   emoji: '🦔', t: ['steel'],              b: { hp: 74, atk: 88, def: 100, spd: 66 },cr: 0.48, sp: '建筑区',            d: '背上的刺是锋利的算珠，能在一秒内算完一整页凭证。' },

    { id: 6,  name: '借火猫',   emoji: '🐱', t: ['fire'],               b: { hp: 52, atk: 60, def: 46, spd: 62 }, cr: 1.00, ev: { lv: 14, to: 7 },   sp: '道路', d: '脾气有点冲，被摸到尾巴会喷出一小簇火苗——据说像极了月底的账单。' },
    { id: 7,  name: '贷焰虎',   emoji: '🐯', t: ['fire'],               b: { hp: 80, atk: 100, def: 72, spd: 84 },cr: 0.45, sp: '道路',              d: '身上的花纹是燃烧的赤字，吼一声能把整间自习室的人吓醒。' },

    { id: 8,  name: '微积喵',   emoji: '🐈', t: ['psychic'],            b: { hp: 50, atk: 54, def: 48, spd: 60 }, cr: 1.05, ev: { lv: 16, to: 9 },   sp: '草地', d: '盯着草稿纸能看一整天，偶尔用爪子在沙地上画出导数符号。' },
    { id: 9,  name: '微积虎',   emoji: '🐅', t: ['psychic'],            b: { hp: 74, atk: 82, def: 70, spd: 90 }, cr: 0.55, ev: { lv: 32, to: 10 },  sp: '草地', d: '斑纹是一道道积分曲线，跑起来像在解一道证明题。' },
    { id: 10, name: '微积圣',   emoji: '🦁', t: ['psychic', 'light'],   b: { hp: 96, atk: 102, def: 88, spd: 104 },cr: 0.30, sp: '草地',             d: '传说中的极限存在。鬃毛由无数收敛级数构成，据说看懂它就能通过高数。' },

    { id: 11, name: '线代蛛',   emoji: '🕷️', t: ['rock'],               b: { hp: 48, atk: 58, def: 64, spd: 44 }, cr: 1.00, ev: { lv: 22, to: 12 },  sp: '建筑区', d: '吐出的丝是标准的矩阵网格，横平竖直，一丝不苟。' },
    { id: 12, name: '矩阵蛛',   emoji: '🦂', t: ['rock', 'steel'],      b: { hp: 78, atk: 94, def: 110, spd: 58 },cr: 0.44, sp: '建筑区',           d: '八条腿能同时解八个方程组，被它缠上就只能乖乖做行变换。' },

    { id: 13, name: '概率鱼',   emoji: '🐟', t: ['water'],              b: { hp: 48, atk: 50, def: 52, spd: 54 }, cr: 1.10, ev: { lv: 16, to: 14 },  sp: '水边', d: '出现的时机完全随机，有人在湖边蹲了三天也没见着一条。' },
    { id: 14, name: '分布鲸',   emoji: '🐋', t: ['water'],              b: { hp: 100, atk: 82, def: 78, spd: 58 },cr: 0.42, sp: '水边',              d: '喷出的水柱是一条完美的正态分布曲线，落下来刚好淋湿挂科的边。' },

    { id: 15, name: '代码虫',   emoji: '🐛', t: ['electric'],           b: { hp: 44, atk: 52, def: 44, spd: 64 }, cr: 1.10, ev: { lv: 14, to: 16 },  sp: '道路', d: '总在半夜爬进机房，第二天老师会发现 bug 少了一个、多了一行注释。' },
    { id: 16, name: '程序蛾',   emoji: '🦋', t: ['electric', 'flying'], b: { hp: 68, atk: 80, def: 60, spd: 96 }, cr: 0.58, ev: { lv: 30, to: 17 },  sp: '道路', d: '翅膀上的纹路是密密麻麻的代码，飞过的地方 Wi-Fi 信号会变强。' },
    { id: 17, name: '编译龙',   emoji: '🐉', t: ['electric', 'steel'],  b: { hp: 96, atk: 110, def: 100, spd: 102 },cr: 0.28, sp: '道路',            d: '一口龙息能同时编译整个项目。零 warning，零 error，传说只有一次。' },

    { id: 18, name: '早八兽',   emoji: '🦥', t: ['dark'],               b: { hp: 58, atk: 62, def: 52, spd: 40 }, cr: 1.05, ev: { lv: 24, to: 19 },  sp: '草地', d: '永远睡不醒。被闹钟吵醒时会用最幽怨的眼神盯着你。' },
    { id: 19, name: '熬夜魔',   emoji: '🦇', t: ['dark'],               b: { hp: 84, atk: 106, def: 78, spd: 72 },cr: 0.46, sp: '草地',              d: '白天消失，凌晨三点准时出现在自习室。黑眼圈是它的武器。' },
    { id: 20, name: '挂科怪',   emoji: '👻', t: ['dark'],               b: { hp: 72, atk: 90, def: 66, spd: 56 }, cr: 0.50, sp: '草地',              d: '平时神出鬼没，期末周成群结队。被它盯上的学分，多半留不住。' },

    { id: 21, name: '英语鹉',   emoji: '🦜', t: ['flying'],             b: { hp: 60, atk: 62, def: 54, spd: 82 }, cr: 0.85, sp: '道路',              d: '会模仿老师的点名口音，经常导致整间教室的人一起站起来。' },
    { id: 22, name: '学分鸟',   emoji: '🕊️', t: ['light', 'flying'],    b: { hp: 64, atk: 70, def: 60, spd: 94 }, cr: 0.60, sp: '道路',              d: '嘴里衔着一枚学分。想抓住它，得先修满培养方案。' },
    { id: 23, name: '奖学金兽', emoji: '🦄', t: ['light'],              b: { hp: 92, atk: 98, def: 92, spd: 90 }, cr: 0.22, sp: '草地',              d: '极其稀有的存在。据说只在绩点 3.8 以上的人面前现身一次。' },

    { id: 24, name: '体育兔',   emoji: '🐰', t: ['fire'],               b: { hp: 62, atk: 74, def: 58, spd: 88 }, cr: 0.80, sp: '道路',              d: '跑八百米从不喘气，终点线前还会回头等你。' },
    { id: 25, name: '食堂猪',   emoji: '🐷', t: ['grass'],              b: { hp: 96, atk: 64, def: 76, spd: 34 }, cr: 0.90, sp: '建筑区',            d: '常年盘踞在食堂门口，对"今天吃什么"这个问题有独到的见解。' },
    { id: 26, name: '图书猫',   emoji: '🐈‍⬛', t: ['psychic'],           b: { hp: 68, atk: 60, def: 74, spd: 70 }, cr: 0.85, ev: { lv: 28, to: 27 },  sp: '建筑区', d: '会安静地趴在你翻开的书上，用尾巴指着写错的那一行。' },
    { id: 27, name: '馆长狮',   emoji: '🦁', t: ['psychic', 'steel'],   b: { hp: 98, atk: 88, def: 112, spd: 72 },cr: 0.32, sp: '建筑区',           d: '图书馆的守护者。一声低吼，全场安静，连翻书声都变得轻柔。' },

    { id: 28, name: '审计犬',   emoji: '🐕', t: ['steel'],              b: { hp: 72, atk: 84, def: 88, spd: 74 }, cr: 0.70, ev: { lv: 30, to: 29 },  sp: '建筑区', d: '鼻子能闻出账目里一分钱的差错，尾巴摇起来说明账做平了。' },
    { id: 29, name: '内审狼',   emoji: '🐺', t: ['steel', 'dark'],      b: { hp: 98, atk: 114, def: 104, spd: 86 },cr: 0.28, sp: '建筑区',          d: '据说被它盯上的报表，没有一张能带着问题走出财务处。' },
    { id: 30, name: '点名鹅',   emoji: '🦢', t: ['flying'],             b: { hp: 66, atk: 72, def: 62, spd: 76 }, cr: 0.75, sp: '道路',              d: '会在上课前两分钟准时出现在教室门口，伸长脖子数人头。' }
  ];

  const BY_ID = {};
  SPECIES.forEach(function (s) {
    BY_ID[s.id] = s;
    if (!s.moves) s.moves = (TYPE_MOVES[s.t[0]] || TYPE_MOVES.normal).slice();
  });

  /* ---------- 道具 ---------- */
  const ITEMS = {
    ball:     { name: '精灵球',   emoji: '🔴', price: 200,  desc: '捕捉野生精灵的基础球，捕获率一般。' },
    greatball:{ name: '超级球',   emoji: '🔵', price: 600,  desc: '捕获率明显高于精灵球，值得常备。' },
    masterball:{name: '大师球',   emoji: '🟣', price: 3000, desc: '必定捕获。留给真正的稀有精灵。', rare: true },
    potion:   { name: '伤药',     emoji: '🧪', price: 150,  desc: '恢复 30 点 HP。' },
    superpotion:{name:'好伤药',   emoji: '💊', price: 400,  desc: '恢复 80 点 HP。' },
    fullheal: { name: '全能药',   emoji: '🍶', price: 900,  desc: '完全恢复 HP 并解除所有异常状态。' },
    revive:   { name: '复活药',   emoji: '🕯️', price: 1200, desc: '让濒死的精灵以一半 HP 复活。' },
    candy:    { name: '学分糖',   emoji: '🍬', price: 2500, desc: '提升 1 级。给真正想培养的精灵。', rare: true }
  };

  /* ---------- 地带与遇敌表 ----------
     地带判定见 mon.js 的 zoneOf()：草地 / 水边 / 道路 / 建筑区
     每项：[种类id, 权重, 等级下限, 等级上限]
  */
  const ZONES = {
    /* 每个地带分低 / 中 / 高三段，保证任何等级都有 4~6 种可选敌人，
       避免「某等级只能撞见某只克星」的死局（实测曾出现火系在草地 Lv40 胜率 0%）。 */
    '草地': [
      [1, 14, 2, 6], [8, 12, 3, 7], [18, 12, 4, 8], [21, 6, 10, 16], [22, 4, 11, 17],
      [20, 9, 9, 16], [25, 6, 9, 15], [19, 7, 12, 20],
      [2, 7, 12, 18], [9, 4, 18, 26], [23, 1, 18, 26],
      [20, 5, 26, 36], [25, 5, 26, 36], [19, 5, 26, 36], [2, 5, 24, 34], [3, 2, 26, 34], [10, 1, 30, 40]
    ],
    /* 水边以水系为主，但混入飞行/草/暗，避免火系训练家一进水边就必输 */
    '水边': [
      [13, 18, 3, 8], [1, 6, 3, 8], [8, 5, 4, 9], [22, 6, 6, 12],
      [13, 8, 12, 18], [21, 6, 10, 18], [20, 5, 12, 20], [18, 6, 8, 16],
      [14, 4, 20, 28], [14, 4, 28, 38], [20, 4, 26, 36], [21, 4, 24, 34], [3, 2, 26, 34], [10, 1, 30, 40]
    ],
    '道路': [
      [6, 16, 3, 8], [15, 15, 3, 8], [24, 10, 4, 10], [30, 9, 5, 11], [21, 8, 5, 11],
      [6, 9, 12, 18], [15, 9, 12, 18], [24, 8, 12, 18], [30, 8, 12, 18],
      [7, 4, 18, 26], [16, 5, 18, 26],
      [7, 4, 26, 36], [16, 4, 26, 36], [21, 4, 24, 34], [30, 4, 24, 34], [17, 1, 30, 40]
    ],
    '建筑区': [
      [4, 16, 3, 8], [11, 13, 4, 9], [25, 9, 8, 14], [26, 8, 6, 12], [28, 6, 8, 15],
      [4, 9, 12, 18], [11, 8, 12, 18], [26, 7, 12, 18], [25, 6, 12, 18],
      [5, 4, 18, 26], [12, 4, 20, 28], [28, 4, 18, 26],
      [5, 4, 26, 36], [12, 4, 28, 38], [28, 4, 26, 36], [25, 4, 24, 34], [27, 2, 26, 34], [29, 1, 32, 42]
    ]
  };

  const ZONE_NAMES = Object.keys(ZONES);

  /* 按地带权重抽一只野生精灵。
     playerLv：队伍最高等级——野生等级上限 = playerLv + 6，
     避免新手在草地里撞见 Lv40 的报表树这种碾压级遭遇。 */
  function pickWild(zone, playerLv) {
    const full = ZONES[zone] || ZONES['草地'];
    const pv = Math.max(2, playerLv || 5);
    const lo = Math.max(2, pv - 4), hi = pv + 2;          // 滑动窗口：敌人始终与玩家同档
    let cands = full.filter(function (r) { return r[3] >= lo && r[2] <= hi; });
    if (!cands.length) cands = full.filter(function (r) { return r[2] <= hi; });
    if (!cands.length) cands = [full[0]];
    let total = 0;
    cands.forEach(function (r) { total += r[1]; });
    let roll = Math.random() * total;
    let picked = cands[0];
    for (let i = 0; i < cands.length; i++) {
      roll -= cands[i][1];
      if (roll <= 0) { picked = cands[i]; break; }
    }
    const a = Math.max(picked[2], lo), b = Math.min(picked[3], hi);
    const lv = b >= a ? (a + Math.floor(Math.random() * (b - a + 1))) : Math.min(picked[3], hi);
    return { id: picked[0], lv: Math.max(2, Math.min(50, lv)) };
  }

  global.MonData = {
    TYPES: TYPES, CHART: CHART, MOVES: MOVES, TYPE_MOVES: TYPE_MOVES,
    SPECIES: SPECIES, BY_ID: BY_ID, ITEMS: ITEMS, ZONES: ZONES, ZONE_NAMES: ZONE_NAMES,
    typeEff: typeEff, pickWild: pickWild
  };
})(window);

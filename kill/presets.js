// 撃破確率ツール用の技プリセット。
// 倍率は属性補正・種族補正を掛ける前の技倍率。
// majorGroup がある技だけを「主要技プリセット」に表示する。
// キャラクタープリセット専用技は同じデータを使って自動入力するが、主要技一覧には表示しない。

const attack = (id, name, {
  multiplier = '100', attribute = 'none', attribute2 = 'none', attackType = 'physical', hits = '1',
  multiplierMin = '', multiplierMax = '', multiplierStep = '', hitsMin = '', hitsMax = '',
  undeadSkillMultiplier = '', poisonedSkillMultiplier = '', deadlyPoisonSkillMultiplier = '',
  effects = [], note = '', selectable = true
} = {}) => ({
  id, name, kind: 'attack', skillName: name, skillMultiplier: multiplier,
  attackAttribute: attribute, attackAttribute2: attribute2, attackType, hits,
  skillMultiplierMin: multiplierMin, skillMultiplierMax: multiplierMax, skillMultiplierStep: multiplierStep,
  hitsMin, hitsMax, undeadSkillMultiplier, poisonedSkillMultiplier, deadlyPoisonSkillMultiplier,
  effects, note, selectable
});

const buff = (id, name, buffData, effects = [], note = '', selectable = true) => ({
  id, name, kind: 'buff', skillName: name, buff: buffData, effects, note, selectable
});

const effectOnly = (id, name, effects = [], note = '', selectable = true) => ({
  id, name, kind: 'effect', skillName: name, effects, note, selectable
});

const major = (preset, majorGroup) => ({ ...preset, major: true, majorGroup });

export const SKILL_PRESETS = Object.freeze([
  // ---------------------------------------------------------------------------
  // 主要技：Wiki「バトル入手チャート」2ページ末尾の
  // 「変化先コマンドサンプル一覧」に掲載されている技。
  // ---------------------------------------------------------------------------

  // バフ / 強化技
  major(buff('loki_brand', 'ロキブランド',
    { type: 'atkBuff', target: 'self', mode: 'mult', value: '150', duration: '2' },
    [], '対象は手動変更できます。'), 'buff'),
  major(buff('oni_spirit', '鬼の気合入れ',
    { type: 'atkBuff', target: 'self', mode: 'mult', value: '200', duration: '1' }), 'buff'),
  major(buff('sea_king_gaze', '海王のまなざし',
    { type: 'atkBuff', target: 'self', mode: 'add', value: '30', duration: '99' },
    [{ type: 'speedBuff', target: 'self', mode: 'add', value: '30', duration: '99' }],
    '重ねがけ不可の永続効果として99ターンで保持します。'), 'buff'),
  major(effectOnly('spirit_blessing', '精霊の加護',
    [{ type: 'weaknessBuff', target: 'all', duration: '3' }],
    '弱点倍率1.5→1.9、1.4→1.8。'), 'buff'),
  major(buff('growl', 'うなる',
    { type: 'atkBuff', target: 'self', mode: 'mult', value: '150', duration: '3' }), 'buff'),
  major(buff('sun_hymn', '太陽讃歌',
    { type: 'atkBuff', target: 'self', mode: 'add', value: '50', duration: '3' },
    [], '本来は自軍の火属性が対象です。味方属性入力がないため対象は手動変更してください。'), 'buff'),
  major(buff('sword_dance', 'つるぎの舞',
    { type: 'atkBuff', target: 'others', mode: 'mult', value: '120', duration: '3' },
    [], '自身以外の味方を1.2倍。自動連続使用・被弾による解除はこのツールでは扱いません。'), 'buff'),
  major(buff('name_announcement', '名乗り上げ',
    { type: 'atkBuff', target: 'self', mode: 'mult', value: '200', duration: '3' },
    [], '味方をかばう効果は撃破確率には反映しません。'), 'buff'),

  // 攻撃技：忍法 〇〇の術
  major(attack('ninja_thunder', '忍法 雷鳴の術', {
    multiplier: '80', multiplierMin: '70', multiplierMax: '90', multiplierStep: '0.1',
    attribute: 'thunder', attackType: 'magic', hits: '3'
  }), 'attack'),
  major(attack('ninja_wind', '忍法 風迅の術', {
    multiplier: '80', multiplierMin: '70', multiplierMax: '90', multiplierStep: '0.1',
    attribute: 'wind', attackType: 'magic', hits: '3'
  }), 'attack'),
  major(attack('ninja_fire', '忍法 鬼火の術', {
    multiplier: '80', multiplierMin: '70', multiplierMax: '90', multiplierStep: '0.1',
    attribute: 'fire', attackType: 'magic', hits: '3'
  }), 'attack'),
  major(attack('ninja_water', '忍法 蛇水の術', {
    multiplier: '80', multiplierMin: '70', multiplierMax: '90', multiplierStep: '0.1',
    attribute: 'water', attackType: 'magic', hits: '3'
  }), 'attack'),

  // 攻撃技：〇〇ポイント。EXゲージ量別に実用値を分けて選択できるようにする。
  major(attack('red_point_0', 'レッドポイント（EX0）', { multiplier: '100', attribute: 'fire', attackType: 'physical' }), 'attack'),
  major(attack('red_point_1', 'レッドポイント（EX1）', { multiplier: '200', attribute: 'fire', attackType: 'physical' }), 'attack'),
  major(attack('red_point_2', 'レッドポイント（EX2）', { multiplier: '250', attribute: 'fire', attackType: 'physical' }), 'attack'),
  major(attack('blue_point_0', 'ブルーポイント（EX0）', { multiplier: '100', attribute: 'water', attackType: 'physical' }), 'attack'),
  major(attack('blue_point_1', 'ブルーポイント（EX1）', { multiplier: '200', attribute: 'water', attackType: 'physical' }), 'attack'),
  major(attack('blue_point_2', 'ブルーポイント（EX2）', { multiplier: '250', attribute: 'water', attackType: 'physical' }), 'attack'),
  major(attack('yellow_point_0', 'イエローポイント（EX0）', { multiplier: '100', attribute: 'earth', attackType: 'physical' }), 'attack'),
  major(attack('yellow_point_1', 'イエローポイント（EX1）', { multiplier: '200', attribute: 'earth', attackType: 'physical' }), 'attack'),
  major(attack('yellow_point_2', 'イエローポイント（EX2）', { multiplier: '250', attribute: 'earth', attackType: 'physical' }), 'attack'),
  major(attack('green_point_0', 'グリーンポイント（EX0）', { multiplier: '100', attribute: 'wind', attackType: 'physical' }), 'attack'),
  major(attack('green_point_1', 'グリーンポイント（EX1）', { multiplier: '200', attribute: 'wind', attackType: 'physical' }), 'attack'),
  major(attack('green_point_2', 'グリーンポイント（EX2）', { multiplier: '250', attribute: 'wind', attackType: 'physical' }), 'attack'),

  major(attack('crush', 'おしつぶし', {
    multiplier: '65', attribute: 'earth', attackType: 'physical', hits: '4',
    note: '麻痺15%は撃破確率計算では未反映。'
  }), 'attack'),
  major(attack('peck_many', 'つつきまくり', {
    multiplier: '70', attribute: 'wind', attackType: 'physical', hits: '3'
  }), 'attack'),

  // ファイア!! / アクア!! はユーザー指定により !!! 版も例外的に追加。
  major(attack('fire2', 'ファイア!!', { multiplier: '150', attribute: 'fire', attackType: 'magic' }), 'attack'),
  major(attack('fire3', 'ファイア!!!', { multiplier: '200', attribute: 'fire', attackType: 'magic' }), 'attack'),
  major(attack('aqua2', 'アクア!!', { multiplier: '150', attribute: 'water', attackType: 'magic' }), 'attack'),
  major(attack('aqua3', 'アクア!!!', { multiplier: '200', attribute: 'water', attackType: 'magic' }), 'attack'),
  major(attack('wind2', 'ウィンド!!', { multiplier: '150', attribute: 'wind', attackType: 'magic' }), 'attack'),

  major(attack('fire_torture', '火責め', { multiplier: '165', attribute: 'fire', attackType: 'magic' }), 'attack'),
  major(attack('water_torture', '水責め', { multiplier: '165', attribute: 'water', attackType: 'magic' }), 'attack'),
  major(attack('wet_slicer', 'ウェットスライサー', { multiplier: '50', attribute: 'water', attackType: 'physical', hits: '4' }), 'attack'),
  major(attack('dark_bahamut_breath', '〇〇ブレス', {
    multiplier: '90', attribute: 'all', attackType: 'other',
    note: '冥界竜ダークバハムート用。敵属性に合わせた具体的なブレス属性・特効倍率は必要に応じて手動変更してください。'
  }), 'attack'),
  major(attack('roaring_lightning', '轟く稲妻', {
    multiplier: '80', attribute: 'thunder', attackType: 'physical', hits: '4', hitsMin: '3', hitsMax: '5',
    note: '麻痺付与確率は撃破確率計算では未反映。'
  }), 'attack'),
  major(attack('rock_throw', '岩飛ばし', { multiplier: '180', attribute: 'earth', attackType: 'physical' }), 'attack'),
  major(attack('poison_crush', 'どくつぶし', {
    multiplier: '80', poisonedSkillMultiplier: '105', attribute: 'poison', attackType: 'physical', hits: '3',
    note: '敵が毒・猛毒なら1発105%。毒20%付与は確率状態異常のため未反映。'
  }), 'attack'),
  major(attack('kamaitachi', 'カマイタチ', {
    multiplier: '50', attribute: 'wind', attackType: 'magic', hits: '4', hitsMin: '3', hitsMax: '6'
  }), 'attack'),
  major(attack('tatsumaki', 'タツマキ', {
    multiplier: '70', attribute: 'wind', attackType: 'magic', hits: '4', hitsMin: '3', hitsMax: '6'
  }), 'attack'),
  major(attack('dark_fire', 'ダークファイア', { multiplier: '250', attribute: 'fire', attribute2: 'dark', attackType: 'magic' }), 'attack'),
  major(attack('rain_god_spear', '雨神の戟', { multiplier: '230', attribute: 'water', attackType: 'physical' }), 'attack'),
  major(attack('marking_arrow', 'マーキングアロー', {
    multiplier: '110', attribute: 'none', attackType: 'physical',
    effects: [{ type: 'defenseDown', mode: 'mult', value: '140', duration: '99', expiry: 'sourceNextActionEnd' }],
    note: '敵の被ダメージ1.4倍。使用者の次の行動終了まで。'
  }), 'attack'),
  major(attack('paralysis_arrow', 'マヒ矢', {
    multiplier: '140', attribute: 'none', attackType: 'physical',
    note: '麻痺25%は撃破確率計算では未反映。'
  }), 'attack'),
  major(attack('neck_cut_reward', 'くびかりのほうしゅう', {
    multiplier: '170', attribute: 'dark', attackType: 'physical',
    note: '撃破時のEXゲージ増加は撃破確率計算には影響しないため未反映。'
  }), 'attack'),
  major(attack('deadly_blow', '必殺の一撃', { multiplier: '250', attribute: 'none', attackType: 'physical' }), 'attack'),
  major(attack('self_destruct', '自爆', {
    multiplier: '200', attribute: 'none', attackType: 'physical',
    note: '使用後に使用者が離脱する処理は現在の撃破確率計算では未反映。'
  }), 'attack'),
  major(attack('ikazuchi', 'イカズチ', { multiplier: '140', attribute: 'thunder', attackType: 'magic' }), 'attack'),
  major(attack('venom_salamanda', 'ヴェノム・サラマンダ', {
    multiplier: '135', attribute: 'fire', attribute2: 'poison', attackType: 'magic',
    note: '毒40%付与は確率状態異常のため未反映。'
  }), 'attack'),
  major(attack('fire_ice_breath2', '炎と氷のいき!!', { multiplier: '300', attribute: 'all', attackType: 'other' }), 'attack'),
  major(attack('shout', 'さけぶ', {
    multiplier: '10', attribute: 'none', attackType: 'magic',
    note: '麻痺80%は撃破確率計算では未反映。'
  }), 'attack'),
  major(attack('headwind', 'むかい風', {
    multiplier: '90', attribute: 'wind', attackType: 'magic',
    effects: [{ type: 'speedDown', mode: 'mult', value: '50', duration: '2' }],
    note: '敵の素早さ半減（2ターン）を反映。速度差で威力が上がる部分は未反映。'
  }), 'attack'),

  // 吸いつくしはコマンドサンプル上は攻撃技だが、以前の指定どおり自身の攻撃+15だけを計算する。
  major(buff('suck_dry', '吸いつくし',
    { type: 'atkBuff', target: 'self', mode: 'add', value: '15', duration: '3' },
    [], '撃破確率計算では自身の攻撃+15のみ反映し、味方へのダメージ・回復は無視します。'), 'attack'),
  major(attack('bubble_grand', 'シャボン・グラン', { multiplier: '150', attribute: 'water', attackType: 'magic' }), 'attack'),
  major(attack('rengeki', '連撃', { multiplier: '115', attribute: 'none', attackType: 'physical', hits: '2' }), 'attack'),
  major(attack('heat_wave', 'ヒートウェイブ', { multiplier: '90', attribute: 'fire', attackType: 'physical' }), 'attack'),
  major(attack('ice_storm_strike', '氷嵐撃', { multiplier: '140', attribute: 'ice', attribute2: 'wind', attackType: 'physical' }), 'attack'),

  // その他：この撃破確率ツールで敵HPに直接影響しない効果は、選択肢として保持して注記する。
  major(effectOnly('kerakuzu', 'ケラクズ', [], '状態異常解除・予防は現在の撃破確率計算には影響しないため数値処理しません。'), 'other'),
  major(effectOnly('sun_blessing', '太陽の加護', [], '状態異常解除・付与率低下は現在の撃破確率計算には影響しないため数値処理しません。'), 'other'),
  major(effectOnly('bubble_barrier_grand', 'シャボン・バリア・グラン', [], '被ダメージ軽減・状態異常予防は現在の撃破確率計算には影響しないため数値処理しません。'), 'other'),
  major(effectOnly('ex_gauge_plus8', 'EXゲージ+8', [], 'EXゲージ増加は現在の撃破確率計算には影響しないため数値処理しません。'), 'other'),
  major(effectOnly('queen_reward', '女王のごほうび', [], 'コマンドレベル上昇は現在の撃破確率計算には影響しないため数値処理しません。'), 'other'),
  major(effectOnly('false_reflect_wall', 'いつわりの反射壁', [], '攻撃反射は現在の撃破確率計算には影響しないため数値処理しません。'), 'other'),

  // ユーザー指定で「主要技」に追加している技（コマンドサンプル一覧外を含む）。
  major(attack('poison_bite', 'どくかみつき', {
    multiplier: '140', attribute: 'poison', attackType: 'physical', effects: [{ type: 'poison' }]
  }), 'attack'),
  major(attack('melting_breath', 'とけるいき', {
    multiplier: '60', deadlyPoisonSkillMultiplier: '120', attribute: 'poison', attribute2: 'dark', attackType: 'other',
    effects: [{ type: 'poisonToDeadly' }], note: '敵が猛毒なら技倍率120%。毒なら攻撃後に猛毒化。'
  }), 'attack'),
  major(effectOnly('epidemic_glass', '悪疫グラス', [{ type: 'poisonToDeadly' }], '撃破確率計算では毒→猛毒のみ反映。'), 'other'),

  // ---------------------------------------------------------------------------
  // キャラクタープリセット専用技。
  // 主要技ではないため majorGroup を付けず、主要技ドロップダウンには出さない。
  // ---------------------------------------------------------------------------
  attack('foot_sweep', '足ばらい', {
    multiplier: '40', attribute: 'none', attackType: 'physical',
    effects: [{ type: 'defenseDown', mode: 'mult', value: '120', duration: '99', expiry: 'sourceNextActionStart' }],
    note: '敵の被ダメージ1.2倍。使用者の次の行動開始まで。'
  }),
  attack('attack_bang', 'こうげき!', { multiplier: '100', attribute: 'none', attackType: 'physical' }),
  attack('dragon_tail', '竜のしっぽ', { multiplier: '90', attribute: 'none', attackType: 'physical' }),
  attack('aqua_breath', 'アクアブレス', { multiplier: '105', attribute: 'water', attackType: 'other' }),
  attack('shining_breath', 'シャイニングブレス', { multiplier: '105', attribute: 'light', attackType: 'other' }),
  attack('fire1', 'ファイア!', { multiplier: '100', attribute: 'fire', attackType: 'magic' }),
  attack('ice1', 'アイス!', { multiplier: '100', attribute: 'ice', attackType: 'magic' }),
  attack('thunder1', 'サンダー!', { multiplier: '100', attribute: 'thunder', attackType: 'magic' }),
  attack('meteor', 'メテオ!', { multiplier: '160', attribute: 'all', attackType: 'magic' }),
  attack('purifying_flame', '浄化の炎', { multiplier: '50', undeadSkillMultiplier: '170', attribute: 'fire', attribute2: 'holy', attackType: 'magic' }),
  attack('shiden', '紫電', { multiplier: '200', attribute: 'thunder', attackType: 'physical' }),
  attack('critical_hit', '会心の一撃', { multiplier: '200', attribute: 'none', attackType: 'physical' })
]);

export const SKILL_PRESET_BY_ID = new Map(SKILL_PRESETS.map(p => [p.id, p]));

const NORMALIZED_NAME_TO_ID = new Map();
for (const p of SKILL_PRESETS) NORMALIZED_NAME_TO_ID.set(normalizeSkillName(p.skillName), p.id);

// 表記揺れと旧バージョンの表示名を吸収。
const ALIASES = new Map([
  ['こうげき！', 'attack_bang'],
  ['ファイア‼︎', 'fire2'],
  ['ファイア‼', 'fire2'],
  ['ファイア!!!', 'fire3'],
  ['アクア!!!', 'aqua3'],
  ['メテオ！', 'meteor'],
  ['ウィンド‼︎', 'wind2'],
  ['ウィンド‼', 'wind2'],
  ['太陽賛歌', 'sun_hymn'],
  ['ブレス系統（敵属性で選択）', 'dark_bahamut_breath'],
  ['○○ブレス', 'dark_bahamut_breath'],
  ['〇〇ブレス（敵属性で選択）', 'dark_bahamut_breath']
]);

export function normalizeSkillName(name) {
  return String(name ?? '')
    .trim()
    .replaceAll('！', '!')
    .replaceAll('‼︎', '!!')
    .replaceAll('‼', '!!');
}

export function presetIdForSkillName(name) {
  const raw = String(name ?? '').trim();
  if (ALIASES.has(raw)) return ALIASES.get(raw);
  return NORMALIZED_NAME_TO_ID.get(normalizeSkillName(raw)) ?? '';
}

export function caminekoPresetForEnemy(attribute) {
  if (attribute === 'fire') return 'ice1';
  if (attribute === 'water') return 'fire1';
  if (attribute === 'earth') return 'thunder1';
  if (attribute === 'wind') return 'ice1';
  return 'fire1';
}

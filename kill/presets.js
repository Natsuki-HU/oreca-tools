// 撃破確率ツール用の技プリセット。
// 倍率は属性補正・種族補正を掛ける前の技倍率。

const attack = (id, name, {
  multiplier = '100', attribute = 'none', attribute2 = 'none', attackType = 'physical', hits = '1',
  multiplierMin = '', multiplierMax = '', multiplierStep = '', hitsMin = '', hitsMax = '',
  undeadSkillMultiplier = '', deadlyPoisonSkillMultiplier = '', effects = [], note = '', selectable = true
} = {}) => ({
  id, name, kind: 'attack', skillName: name, skillMultiplier: multiplier,
  attackAttribute: attribute, attackAttribute2: attribute2, attackType, hits,
  skillMultiplierMin: multiplierMin, skillMultiplierMax: multiplierMax, skillMultiplierStep: multiplierStep,
  hitsMin, hitsMax, undeadSkillMultiplier, deadlyPoisonSkillMultiplier, effects, note, selectable
});

const buff = (id, name, buffData, effects = [], note = '', selectable = true) => ({
  id, name, kind: 'buff', skillName: name, buff: buffData, effects, note, selectable
});

const effectOnly = (id, name, effects, note = '', selectable = true) => ({
  id, name, kind: 'effect', skillName: name, effects, note, selectable
});

export const SKILL_PRESETS = Object.freeze([
  // 主要な強化技
  buff('loki_brand', 'ロキブランド', { type: 'atkBuff', target: 'self', mode: 'mult', value: '150', duration: '2' }, [], '対象は手動変更できます。'),
  buff('oni_spirit', '鬼の気合入れ', { type: 'atkBuff', target: 'self', mode: 'mult', value: '200', duration: '1' }),
  buff('sea_king_gaze', '海王のまなざし', { type: 'atkBuff', target: 'self', mode: 'add', value: '30', duration: '99' }, [
    { type: 'speedBuff', target: 'self', mode: 'add', value: '30', duration: '99' }
  ], '永続扱いとして99ターンで保持します。'),
  buff('sun_hymn', '太陽賛歌', { type: 'atkBuff', target: 'self', mode: 'add', value: '50', duration: '3' }, [], '対象は手動変更できます。'),
  buff('growl', 'うなる', { type: 'atkBuff', target: 'self', mode: 'mult', value: '150', duration: '3' }),
  effectOnly('spirit_blessing', '精霊の加護', [
    { type: 'weaknessBuff', target: 'all', duration: '3' }
  ], '弱点倍率1.5→1.9、1.4→1.8。'),
  buff('suck_dry', '吸いつくし', { type: 'atkBuff', target: 'self', mode: 'add', value: '15', duration: '3' }, [], '撃破確率計算では自身の攻撃+15のみ反映。'),

  // 主要な攻撃技
  attack('fire2', 'ファイア!!', { multiplier: '150', attribute: 'fire', attackType: 'magic' }),
  attack('dark_fire', 'ダークファイア', { multiplier: '250', attribute: 'fire', attribute2: 'dark', attackType: 'magic' }),
  attack('ninja_thunder', '忍法 雷鳴の術', { multiplier: '80', multiplierMin: '70', multiplierMax: '90', multiplierStep: '0.1', attribute: 'thunder', attackType: 'magic', hits: '3' }),
  attack('ninja_wind', '忍法 風迅の術', { multiplier: '80', multiplierMin: '70', multiplierMax: '90', multiplierStep: '0.1', attribute: 'wind', attackType: 'magic', hits: '3' }),
  attack('ninja_fire', '忍法 鬼火の術', { multiplier: '80', multiplierMin: '70', multiplierMax: '90', multiplierStep: '0.1', attribute: 'fire', attackType: 'magic', hits: '3' }),
  attack('ninja_water', '忍法 蛇水の術', { multiplier: '80', multiplierMin: '70', multiplierMax: '90', multiplierStep: '0.1', attribute: 'water', attackType: 'magic', hits: '3' }),

  attack('red_point_0', 'レッドポイント（EX0）', { multiplier: '100', attribute: 'fire', attackType: 'physical' }),
  attack('red_point_1', 'レッドポイント（EX1）', { multiplier: '200', attribute: 'fire', attackType: 'physical' }),
  attack('red_point_2', 'レッドポイント（EX2）', { multiplier: '250', attribute: 'fire', attackType: 'physical' }),
  attack('blue_point_0', 'ブルーポイント（EX0）', { multiplier: '100', attribute: 'water', attackType: 'physical' }),
  attack('blue_point_1', 'ブルーポイント（EX1）', { multiplier: '200', attribute: 'water', attackType: 'physical' }),
  attack('blue_point_2', 'ブルーポイント（EX2）', { multiplier: '250', attribute: 'water', attackType: 'physical' }),
  attack('yellow_point_0', 'イエローポイント（EX0）', { multiplier: '100', attribute: 'earth', attackType: 'physical' }),
  attack('yellow_point_1', 'イエローポイント（EX1）', { multiplier: '200', attribute: 'earth', attackType: 'physical' }),
  attack('yellow_point_2', 'イエローポイント（EX2）', { multiplier: '250', attribute: 'earth', attackType: 'physical' }),
  attack('green_point_0', 'グリーンポイント（EX0）', { multiplier: '100', attribute: 'wind', attackType: 'physical' }),
  attack('green_point_1', 'グリーンポイント（EX1）', { multiplier: '200', attribute: 'wind', attackType: 'physical' }),
  attack('green_point_2', 'グリーンポイント（EX2）', { multiplier: '250', attribute: 'wind', attackType: 'physical' }),

  attack('roaring_lightning', '轟く稲妻', { multiplier: '80', attribute: 'thunder', attackType: 'physical', hits: '4', hitsMin: '3', hitsMax: '5' }),
  attack('kamaitachi', 'カマイタチ', { multiplier: '50', attribute: 'wind', attackType: 'magic', hits: '4', hitsMin: '3', hitsMax: '6' }),
  attack('tatsumaki', 'タツマキ', { multiplier: '70', attribute: 'wind', attackType: 'magic', hits: '4', hitsMin: '3', hitsMax: '6' }),
  attack('fire_ice_breath2', '炎と氷のいき!!', { multiplier: '300', attribute: 'all', attackType: 'other' }),
  attack('poison_bite', 'どくかみつき', { multiplier: '140', attribute: 'poison', attackType: 'physical', effects: [{ type: 'poison' }] }),
  attack('melting_breath', 'とけるいき', { multiplier: '60', deadlyPoisonSkillMultiplier: '120', attribute: 'poison', attribute2: 'dark', attackType: 'other', effects: [{ type: 'poisonToDeadly' }], note: '敵が猛毒なら技倍率120%。毒なら攻撃後に猛毒化。' }),
  effectOnly('epidemic_glass', '悪疫グラス', [{ type: 'poisonToDeadly' }], '撃破確率計算では毒→猛毒のみ反映。'),
  attack('marking_arrow', 'マーキングアロー', { multiplier: '110', attribute: 'none', attackType: 'physical', effects: [
    { type: 'defenseDown', mode: 'mult', value: '140', duration: '99', expiry: 'sourceNextActionEnd' }
  ], note: '敵の被ダメージ1.4倍。使用者の次の行動終了まで。' }),
  attack('foot_sweep', '足ばらい', { multiplier: '40', attribute: 'none', attackType: 'physical', effects: [
    { type: 'defenseDown', mode: 'mult', value: '120', duration: '99', expiry: 'sourceNextActionStart' }
  ], note: '敵の被ダメージ1.2倍。使用者の次の行動開始まで。' }),

  // キャラクタープリセットで使う基本技（主要技選択にも表示）
  attack('attack_bang', 'こうげき!', { multiplier: '100', attribute: 'none', attackType: 'physical' }),
  attack('dragon_tail', '竜のしっぽ', { multiplier: '90', attribute: 'none', attackType: 'physical' }),
  attack('aqua_breath', 'アクアブレス', { multiplier: '105', attribute: 'water', attackType: 'other' }),
  attack('shining_breath', 'シャイニングブレス', { multiplier: '105', attribute: 'light', attackType: 'other' }),
  attack('shout', 'さけぶ', { multiplier: '10', attribute: 'none', attackType: 'magic' }),
  attack('peck_many', 'つつきまくり', { multiplier: '70', attribute: 'wind', attackType: 'physical', hits: '3' }),
  attack('crush', 'おしつぶし', { multiplier: '65', attribute: 'earth', attackType: 'physical', hits: '4' }),
  attack('bubble_grand', 'シャボン・グラン', { multiplier: '150', attribute: 'water', attackType: 'magic' }),
  attack('rengeki', '連撃', { multiplier: '115', attribute: 'none', attackType: 'physical', hits: '2' }),
  attack('fire1', 'ファイア!', { multiplier: '100', attribute: 'fire', attackType: 'magic' }),
  attack('ice1', 'アイス!', { multiplier: '100', attribute: 'ice', attackType: 'magic' }),
  attack('thunder1', 'サンダー!', { multiplier: '100', attribute: 'thunder', attackType: 'magic' }),
  attack('heat_wave', 'ヒートウェイブ', { multiplier: '90', attribute: 'fire', attackType: 'physical' }),
  attack('meteor', 'メテオ!', { multiplier: '160', attribute: 'all', attackType: 'magic' }),
  attack('purifying_flame', '浄化の炎', { multiplier: '50', undeadSkillMultiplier: '170', attribute: 'fire', attribute2: 'holy', attackType: 'magic' }),
  attack('shiden', '紫電', { multiplier: '200', attribute: 'thunder', attackType: 'physical' }),
  attack('critical_hit', '会心の一撃', { multiplier: '200', attribute: 'none', attackType: 'physical' }),
  attack('wind2', 'ウィンド!!', { multiplier: '150', attribute: 'wind', attackType: 'magic' }),

  // 冥界竜ダークバハムートは技名の選択を残しつつ、ブレス分類と基礎倍率を自動入力する。
  attack('dark_bahamut_breath', 'ブレス系統（敵属性で選択）', { multiplier: '90', attribute: 'all', attackType: 'other', note: '敵属性に応じた具体的なブレス属性は必要に応じて手動変更してください。' })
]);

export const SKILL_PRESET_BY_ID = new Map(SKILL_PRESETS.map(p => [p.id, p]));

const NORMALIZED_NAME_TO_ID = new Map();
for (const p of SKILL_PRESETS) NORMALIZED_NAME_TO_ID.set(normalizeSkillName(p.skillName), p.id);

// 表記揺れをキャラプリセットから吸収。
const ALIASES = new Map([
  ['こうげき！', 'attack_bang'],
  ['ファイア‼︎', 'fire2'],
  ['ファイア‼', 'fire2'],
  ['メテオ！', 'meteor'],
  ['ウィンド‼︎', 'wind2'],
  ['ウィンド‼', 'wind2']
]);

export function normalizeSkillName(name) {
  return String(name ?? '')
    .trim()
    .replaceAll('！', '!')
    .replaceAll('‼︎', '!!')
    .replaceAll('‼', '!!');
}

export function presetIdForSkillName(name) {
  if (ALIASES.has(String(name ?? '').trim())) return ALIASES.get(String(name ?? '').trim());
  return NORMALIZED_NAME_TO_ID.get(normalizeSkillName(name)) ?? '';
}

export function caminekoPresetForEnemy(attribute) {
  if (attribute === 'fire') return 'ice1';
  if (attribute === 'water') return 'fire1';
  if (attribute === 'earth') return 'thunder1';
  if (attribute === 'wind') return 'ice1';
  return 'fire1';
}

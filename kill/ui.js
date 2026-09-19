import { APP_VERSION } from '../assets/version.js';
import {
  ALLY_EFFECT_TYPES,
  ATTACK_ATTRIBUTES,
  ENEMY_ATTRIBUTE_OPTIONS,
  ENEMY_EFFECT_TYPES,
  cloneDefaultState,
  simulateKillProbability
} from './engine.js';

const STORAGE_KEY = 'oreca-tools.kill.v0.4.2';
const root = document.getElementById('killRoot');
const resetButton = document.getElementById('resetButton');

for (const el of document.querySelectorAll('[data-app-version]')) el.textContent = APP_VERSION;

const ALLY_BUFF_TYPES = Object.freeze([['atkBuff', '攻撃力'], ['speedBuff', '素早さ']]);
const ENEMY_BUFF_TYPES = Object.freeze([['enemyAtkBuff', '攻撃力'], ['enemySpeedBuff', '素早さ']]);

const CHARACTER_PRESETS = Object.freeze([
  { id: '', name: '選択なし', group: 'none', skill: '', attack: '0', speed: '0' },
  { id: 'son_goku', name: '斉天大聖ソンゴクウ', group: 'general', skill: 'ロキブランド', attack: '84', speed: '78', kind: 'buff' },
  { id: 'gyumao', name: '牛魔王', group: 'general', skill: '鬼の気合入れ', attack: '94', speed: '15', kind: 'buff' },
  { id: 'sylph', name: 'シルフ', group: 'general', skill: 'こうげき！', attack: '31', speed: '42', kind: 'attack' },
  { id: 'crow', name: 'カラス', group: 'general', skill: 'こうげき！', attack: '31', speed: '63', kind: 'attack' },
  { id: 'platinum_drake', name: 'プラチナドレイク', group: 'general', skill: '竜のしっぽ', attack: '78', speed: '78', kind: 'attack' },
  { id: 'clear_blue_dragon', name: 'クリア・ブルードラゴン', group: 'general', skill: 'アクアブレス', attack: '73', speed: '68', kind: 'attack' },
  { id: 'bahamut', name: '天界竜バハムート', group: 'general', skill: 'シャイニングブレス', attack: '89', speed: '73', kind: 'attack' },
  { id: 'mimitoshishi', name: 'ミミトシシ', group: 'general', skill: 'こうげき！', attack: '42', speed: '63', kind: 'attack' },
  { id: 'dark_bahamut', name: '冥界竜ダークバハムート', group: 'general', skill: 'ブレス系統（敵属性で選択）', attack: '89', speed: '73', kind: 'attack' },
  { id: 'magora', name: 'マゴラ', group: 'general', skill: 'さけぶ', attack: '36', speed: '57', kind: 'buff' },
  { id: 'kerogon_green', name: 'ケロゴン(緑)', group: 'general', skill: '竜のしっぽ', attack: '31', speed: '52', kind: 'attack' },
  { id: 'oniwaka_monk', name: '僧兵オニワカ', group: 'general', skill: '足ばらい', attack: '63', speed: '47', kind: 'attack' },
  { id: 'oniwaka', name: 'オニワカ', group: 'general', skill: '足ばらい', attack: '57', speed: '42', kind: 'attack' },
  { id: 'red_empress', name: '赤のエンプレス', group: 'general', skill: '行動スキップ', attack: '63', speed: '84', kind: 'skip' },
  { id: 'raijin_kukulkan', name: '雷神竜ククルカン', group: 'general', skill: 'つつきまくり', attack: '78', speed: '89', kind: 'attack' },
  { id: 'venom_behemoth', name: '猛毒竜ベヒモス', group: 'general', skill: 'おしつぶし', attack: '73', speed: '15', kind: 'attack' },
  { id: 'heavy_behemoth', name: '重竜ベヒモス', group: 'general', skill: 'おしつぶし', attack: '63', speed: '10', kind: 'attack' },
  { id: 'kerogon_yellow', name: 'ケロゴン(黄)', group: 'general', skill: '竜のしっぽ', attack: '31', speed: '21', kind: 'attack' },
  { id: 'guardian_powan', name: '魔海の守護者ポワン', group: 'both', skill: 'シャボン・グラン', attack: '73', speed: '73', kind: 'attack' },
  { id: 'kerogon_blue', name: 'ケロゴン(青)', group: 'general', skill: '竜のしっぽ', attack: '31', speed: '42', kind: 'attack' },
  { id: 'dartan', name: '無幻銃士ダルタン', group: 'general', skill: '連撃', attack: '78', speed: '36', kind: 'attack' },
  { id: 'kerogon_gold', name: 'ケロゴン(金)', group: 'general', skill: '竜のしっぽ', attack: '36', speed: '10', kind: 'attack' },
  { id: 'camineko', name: 'キャミネコ', group: 'general', skill: 'ファイア！／アイス！／サンダー！（敵属性で選択）', attack: '42', speed: '68', kind: 'attack' },
  { id: 'garanezumi', name: 'ガラネズミ', group: 'general', skill: 'こうげき！', attack: '31', speed: '73', kind: 'attack' },
  { id: 'black_knight_gebolg', name: '黒騎士ゲボルグ', group: 'general', skill: 'ヒートウェイブ', attack: '74', speed: '31', kind: 'attack' },
  { id: 'rakshasa', name: 'ラクシャーサ', group: 'general', skill: 'ヒートウェイブ', attack: '53', speed: '21', kind: 'attack' },
  { id: 'scarlet_dragon', name: 'スカーレッド・ドラゴン', group: 'general', skill: '竜のしっぽ', attack: '89', speed: '47', kind: 'attack' },
  { id: 'kenran_kukulkan', name: '絢蘭竜ククルカン', group: 'general', skill: 'つつきまくり', attack: '78', speed: '89', kind: 'attack' },
  { id: 'shinjuryu_kukulkan', name: '神樹竜ククルカン', group: 'general', skill: 'つつきまくり', attack: '78', speed: '84', kind: 'attack' },
  { id: 'ifrit', name: '大魔神イフリート', group: 'general', skill: 'ファイア‼︎', attack: '84', speed: '42', kind: 'attack' },
  { id: 'astaroth', name: '魔公爵アスタロト', group: 'general', skill: 'メテオ！', attack: '68', speed: '31', kind: 'attack' },
  { id: 'loki', name: 'ロキ', group: 'general', skill: 'ロキブランド', attack: '63', speed: '68', kind: 'buff' },
  { id: 'toritamago', name: '魔王のトリタマゴ', group: 'condition', skill: 'こうげき！', attack: '1', speed: '1', kind: 'attack' },
  { id: 'ares', name: '熱剣士アレス', group: 'condition', skill: 'こうげき！', attack: '73', speed: '21', kind: 'attack' },
  { id: 'chibimuus', name: 'チビムウス', group: 'condition', skill: 'こうげき！', attack: '45', speed: '15', kind: 'attack' },
  { id: 'lafroig', name: '魔皇ラフロイグ', group: 'condition', skill: 'こうげき！', attack: '94', speed: '57', kind: 'attack' },
  { id: 'mermaid_mellow', name: 'マーメイドメロウ', group: 'condition', skill: 'こうげき！', attack: '68', speed: '73', kind: 'attack' },
  { id: 'captain_azul', name: 'キャプテン・アズール', group: 'condition', skill: 'こうげき！', attack: '63', speed: '42', kind: 'attack' },
  { id: 'elysion', name: '光王エーリュシオン', group: 'condition', skill: '行動スキップ', attack: '78', speed: '52', kind: 'skip', secondSkill: '浄化の炎', secondKind: 'attack' },
  { id: 'hien', name: '剣豪ヒエン', group: 'condition', skill: '紫電', attack: '63', speed: '78', kind: 'attack' },
  { id: 'marduk', name: '王子マルドク', group: 'condition', skill: '会心の一撃', attack: '79', speed: '95', kind: 'attack' },
  { id: 'enki', name: '老将エンキ', group: 'condition', skill: '会心の一撃', attack: '78', speed: '57', kind: 'attack' },
  { id: 'damkina', name: 'ダムキナ', group: 'condition', skill: 'ウィンド‼︎', attack: '68', speed: '89', kind: 'attack' },
  { id: 'saezer', name: '棘騎士サエザー', group: 'condition', skill: 'こうげき！', attack: '68', speed: '52', kind: 'attack' },
  { id: 'dante_magic_swordsman', name: '魔剣士ダンテ', group: 'condition', skill: 'こうげき！', attack: '68', speed: '31', kind: 'attack' },
  { id: 'simon', name: 'シモン', group: 'condition', skill: 'こうげき！', attack: '68', speed: '47', kind: 'attack' },
  { id: 'hayate', name: '風隠の戦士ハヤテ', group: 'condition', skill: 'こうげき！', attack: '57', speed: '84', kind: 'attack' },
  { id: 'sky_clay', name: '天空騎士クレイ', group: 'condition', skill: 'こうげき！', attack: '73', speed: '73', kind: 'attack' },
  { id: 'djinn', name: '大魔神ジン', group: 'condition', skill: 'ウィンド‼︎', attack: '63', speed: '84', kind: 'attack' },
  { id: 'gate_dante', name: '魔界の門番ダンテ', group: 'condition', skill: 'こうげき！', attack: '78', speed: '36', kind: 'attack' },
  { id: 'yamato', name: 'ヤマト', group: 'condition', skill: 'こうげき！', attack: '78', speed: '78', kind: 'attack' },
  { id: 'susanoo', name: 'スサノヲ', group: 'condition', skill: 'こうげき！', attack: '73', speed: '78', kind: 'attack' },
  { id: 'nanawarai', name: '魔王ナナワライ', group: 'condition', skill: 'こうげき！', attack: '84', speed: '63', kind: 'attack' },
  { id: 'ginger_ale', name: '魔王ジンジャーエイル', group: 'condition', skill: 'こうげき！', attack: '84', speed: '52', kind: 'attack' },
  { id: 'soccerra', name: '邪神サッカーラ', group: 'condition', skill: 'こうげき！', attack: '92', speed: '26', kind: 'attack' },
  { id: 'fire_drake', name: '煌竜王ファイアドレイク', group: 'condition', skill: 'こうげき！', attack: '84', speed: '47', kind: 'attack' }
]);

const CHARACTER_BY_ID = new Map(CHARACTER_PRESETS.map(x => [x.id, x]));

function defaultCharacterStats() {
  return Object.fromEntries(
    CHARACTER_PRESETS
      .filter(x => x.id && x.attack !== undefined && x.speed !== undefined)
      .map(x => [x.id, { attack: x.attack, speed: x.speed }])
  );
}

function statusForCharacter(state, characterId) {
  const preset = CHARACTER_BY_ID.get(characterId);
  const saved = state.characterStats?.[characterId] ?? {};
  return {
    attack: preset?.attack ?? saved.attack ?? '',
    speed: preset?.speed ?? saved.speed ?? ''
  };
}

function defaultPrimaryBuff(side = 'ally') {
  return side === 'enemy'
    ? { type: 'enemyAtkBuff', mode: 'mult', value: '150', duration: '1' }
    : { type: 'atkBuff', target: 'self', mode: 'mult', value: '150', duration: '1' };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeState(saved) {
  const fallback = cloneDefaultState();
  if (!saved || typeof saved !== 'object') return fallback;

  const state = { ...fallback, ...saved };
  state.enemy = { ...fallback.enemy, ...(saved.enemy ?? {}) };
  state.characterStats = { ...defaultCharacterStats(), ...(saved.characterStats ?? {}) };
  state.allyCount = Math.min(3, Math.max(1, Number(saved.allyCount) || fallback.allyCount));
  state.allies = fallback.allies.map((ally, i) => ({ ...ally, ...(saved.allies?.[i] ?? {}), characterId: saved.allies?.[i]?.characterId ?? ally.characterId ?? '' }));
  state.turns = Array.isArray(saved.turns) && saved.turns.length ? saved.turns.slice(0, 12) : fallback.turns;

  const allowedEnemyAttrs = new Set(ENEMY_ATTRIBUTE_OPTIONS.map(([value]) => value));
  if (!allowedEnemyAttrs.has(state.enemy.attribute)) state.enemy.attribute = 'fire';

  for (const turn of state.turns) {
    turn.allyActions = Array.from({ length: 3 }, (_, i) => ({
      kind: turn.allyActions?.[i]?.kind ?? 'skip',
      skillMultiplier: turn.allyActions?.[i]?.skillMultiplier ?? '200',
      attackAttribute: turn.allyActions?.[i]?.attackAttribute ?? 'none',
      hits: turn.allyActions?.[i]?.hits ?? '1',
      buff: { ...defaultPrimaryBuff('ally'), ...(turn.allyActions?.[i]?.buff ?? {}) },
      effects: Array.isArray(turn.allyActions?.[i]?.effects) ? turn.allyActions[i].effects : [],
      skillName: turn.allyActions?.[i]?.skillName ?? ''
    }));
    const legacyEnemyEffect = Array.isArray(turn.enemyAction?.effects) && turn.enemyAction.effects.length
      ? turn.enemyAction.effects[0]
      : turn.enemyAction?.kind === 'buff' ? turn.enemyAction?.buff : null;
    turn.enemyAction = {
      enabled: turn.enemyAction?.enabled !== false,
      effect: { type: 'none', target: 'all', mode: 'mult', value: '80', duration: '1', ...(turn.enemyAction?.effect ?? legacyEnemyEffect ?? {}) }
    };
  }
  return state;
}

function loadState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return normalizeState(cloneDefaultState());
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function optionsHtml(items, selected) {
  return items.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
}

function characterOptionsHtml(selected) {
  const general = CHARACTER_PRESETS.filter(x => x.id && (x.group === 'general' || x.group === 'both'));
  const condition = CHARACTER_PRESETS.filter(x => x.id && (x.group === 'condition' || x.group === 'both'));
  const render = items => items.map(x => `<option value="${escapeHtml(x.id)}" ${x.id === selected ? 'selected' : ''}>${escapeHtml(x.name)}</option>`).join('');
  return `<option value="" ${!selected ? 'selected' : ''}>選択なし</option><optgroup label="汎用">${render(general)}</optgroup><optgroup label="条件">${render(condition)}</optgroup>`;
}

function applyCharacterPreset(allyIndex, characterId) {
  const preset = CHARACTER_BY_ID.get(characterId) ?? CHARACTER_BY_ID.get('');
  const ally = state.allies[allyIndex];
  ally.characterId = characterId;
  const status = statusForCharacter(state, characterId);
  ally.attack = status.attack || '0';
  ally.speed = status.speed || '0';

  state.turns.forEach((turn, turnIndex) => {
    const action = turn.allyActions[allyIndex];
    if (!characterId) {
      action.kind = 'skip'; action.skillName = ''; action.effects = [];
      return;
    }
    if (turnIndex === 0) {
      action.kind = preset.kind ?? 'attack';
      action.skillName = preset.skill;
      if (characterId === 'son_goku') action.buff = { type: 'atkBuff', target: 'self', mode: 'mult', value: '150', duration: '2' };
      if (characterId === 'gyumao') action.buff = { type: 'atkBuff', target: 'self', mode: 'mult', value: '200', duration: '1' };
    } else if (preset.secondSkill && turnIndex === 1) {
      action.kind = preset.secondKind ?? 'attack';
      action.skillName = preset.secondSkill;
    } else {
      action.kind = 'same';
      action.skillName = '';
    }
  });
}

function effectDefault(type, side) {
  if (type === 'poison' || type === 'deadlyPoison') return { type };
  if (type === 'heal') return { type, mode: 'flat', value: '200' };
  if (side === 'enemy') {
    if (type === 'allyAtkDebuff' || type === 'allySpeedDebuff') {
      return { type, target: 'all', mode: 'mult', value: '80', duration: '1' };
    }
    return { type, mode: 'mult', value: '150', duration: '1' };
  }
  if (type === 'defenseDown') return { type, mode: 'mult', value: '120', duration: '1' };
  if (type === 'speedDown') return { type, mode: 'mult', value: '80', duration: '1' };
  return { type, target: 'self', mode: 'mult', value: '150', duration: '1' };
}

function targetOptions(selected, includeSelf = true) {
  const items = [];
  if (includeSelf) items.push(['self', '自分']);
  for (let i = 1; i <= state.allyCount; i++) items.push([`ally${i}`, `キャラ${i}`]);
  items.push(['all', '味方全員']);
  return optionsHtml(items, selected);
}

function effectFieldsHtml(effect, side) {
  const type = effect.type;
  if (type === 'poison' || type === 'deadlyPoison') {
    return '<div class="effect-note">後から付与した毒系状態で上書き</div>';
  }
  if (type === 'heal') {
    return `
      <select class="effect-mode" aria-label="回復方法">
        <option value="flat" ${effect.mode !== 'maxPercent' ? 'selected' : ''}>固定値</option>
        <option value="maxPercent" ${effect.mode === 'maxPercent' ? 'selected' : ''}>最大HP%</option>
      </select>
      <input class="effect-value" type="number" inputmode="decimal" step="0.1" min="0" value="${escapeHtml(effect.value ?? '200')}" aria-label="回復量" />`;
  }

  const isTargeted = ['atkBuff', 'speedBuff', 'allyAtkDebuff', 'allySpeedDebuff'].includes(type);
  const target = isTargeted
    ? `<select class="effect-target" aria-label="対象">${targetOptions(effect.target ?? (side === 'enemy' ? 'all' : 'self'), side !== 'enemy')}</select>`
    : '';
  const modeControl = type === 'defenseDown'
    ? ''
    : `<select class="effect-mode" aria-label="補正方式">
        <option value="mult" ${effect.mode !== 'add' ? 'selected' : ''}>乗算</option>
        <option value="add" ${effect.mode === 'add' ? 'selected' : ''}>加算（±）</option>
      </select>`;
  const isAdd = type !== 'defenseDown' && effect.mode === 'add';

  return `
    ${target}
    ${modeControl}
    <div class="input-with-suffix compact-input">
      <input class="effect-value" type="number" inputmode="decimal" step="0.1" value="${escapeHtml(effect.value ?? '100')}" aria-label="補正値" />
      <span class="suffix">${isAdd ? '' : '%'}</span>
    </div>
    <div class="input-with-suffix compact-input">
      <input class="effect-duration" type="number" inputmode="numeric" step="1" min="1" max="99" value="${escapeHtml(effect.duration ?? '1')}" aria-label="継続ターン" />
      <span class="suffix">ターン</span>
    </div>`;
}

function effectsHtml(effects, side, turnIndex, actorKey) {
  const types = side === 'enemy' ? ENEMY_EFFECT_TYPES : ALLY_EFFECT_TYPES;
  if (!effects.length) return '<div class="empty-note compact-empty">追加効果なし</div>';
  return effects.map((effect, effectIndex) => `
    <div class="effect-row" data-turn-index="${turnIndex}" data-actor-key="${actorKey}" data-effect-index="${effectIndex}" data-effect-side="${side}">
      <select class="effect-type" aria-label="追加効果">
        ${optionsHtml(types, effect.type)}
      </select>
      ${effectFieldsHtml(effect, side)}
      <button class="icon-button remove-effect" type="button" aria-label="追加効果を削除">×</button>
    </div>`).join('');
}

function primaryBuffHtml(buff, side, disabled = false) {
  const b = { ...defaultPrimaryBuff(side), ...(buff ?? {}) };
  const types = side === 'enemy' ? ENEMY_BUFF_TYPES : ALLY_BUFF_TYPES;
  const isAdd = b.mode === 'add';
  const target = side === 'ally'
    ? `<label class="mini-field"><span>対象</span><select class="main-buff-target" ${disabled ? 'disabled' : ''}>${targetOptions(b.target ?? 'self')}</select></label>`
    : '';
  return `
    <div class="primary-buff-block">
      <div class="sub-heading"><span>バフ内容</span></div>
      <div class="primary-buff-grid">
        <label class="mini-field"><span>能力</span><select class="main-buff-type" ${disabled ? 'disabled' : ''}>${optionsHtml(types, b.type)}</select></label>
        ${target}
        <label class="mini-field"><span>方式</span><select class="main-buff-mode" ${disabled ? 'disabled' : ''}><option value="mult" ${b.mode !== 'add' ? 'selected' : ''}>乗算</option><option value="add" ${b.mode === 'add' ? 'selected' : ''}>加算</option></select></label>
        <label class="mini-field"><span>値</span><div class="input-with-suffix"><input class="main-buff-value" type="number" inputmode="decimal" step="0.1" value="${escapeHtml(b.value ?? (isAdd ? '50' : '150'))}" ${disabled ? 'disabled' : ''}><span class="suffix">${isAdd ? '' : '%'}</span></div></label>
        <label class="mini-field"><span>継続</span><div class="input-with-suffix"><input class="main-buff-duration" type="number" inputmode="numeric" min="1" max="99" step="1" value="${escapeHtml(b.duration ?? '1')}" ${disabled ? 'disabled' : ''}><span class="suffix">ターン</span></div></label>
      </div>
    </div>`;
}

function actionKindOptions(action, turnIndex) {
  return `
    <option value="attack" ${action.kind === 'attack' ? 'selected' : ''}>攻撃</option>
    <option value="buff" ${action.kind === 'buff' ? 'selected' : ''}>バフ</option>
    ${turnIndex > 0 ? `<option value="same" ${action.kind === 'same' ? 'selected' : ''}>同行動</option>` : ''}
    <option value="skip" ${action.kind === 'skip' ? 'selected' : ''}>行動スキップ</option>`;
}

function actionCardHtml(action, turnIndex, allyIndex) {
  const actorKey = `ally${allyIndex}`;
  return `
    <div class="action-card" data-turn-index="${turnIndex}" data-actor-key="${actorKey}">
      <div class="action-card-head">
        <strong>キャラ${allyIndex + 1}</strong>
        <select class="action-kind" aria-label="キャラ${allyIndex + 1}の基本行動">
          ${actionKindOptions(action, turnIndex)}
        </select>
      </div>
      ${action.kind !== 'same' ? `<label class="mini-field skill-name-field"><span>使用技</span><input class="skill-name" type="text" value="${escapeHtml(action.skillName ?? '')}" placeholder="技名"></label>` : ''}
      ${action.kind === 'attack' ? `
        <div class="action-input-grid">
          <label class="mini-field"><span>技倍率</span><div class="input-with-suffix"><input class="skill-multiplier" type="number" inputmode="decimal" step="0.1" min="0" value="${escapeHtml(action.skillMultiplier)}"><span class="suffix">%</span></div></label>
          <label class="mini-field"><span>技属性</span><select class="attack-attribute">${optionsHtml(ATTACK_ATTRIBUTES, action.attackAttribute)}</select></label>
          <label class="mini-field"><span>ヒット数</span><input class="hit-count" type="number" inputmode="numeric" step="1" min="1" max="50" value="${escapeHtml(action.hits)}"></label>
        </div>` : ''}
      ${action.kind === 'buff' ? primaryBuffHtml(action.buff, 'ally') : ''}
      ${action.kind === 'same' ? '<p class="same-action-note">前回の同モンスターの行動内容をそのまま使用します。</p>' : ''}
      ${action.kind === 'attack' || action.kind === 'buff' ? `
        <div class="effects-block">
          <div class="sub-heading"><span>追加効果</span><button type="button" class="mini-add add-effect" data-side="ally">＋追加</button></div>
          <div class="effects-list">${effectsHtml(action.effects ?? [], 'ally', turnIndex, actorKey)}</div>
        </div>` : ''}
    </div>`;
}

function enemyEffectFieldsHtml(effect, enabled) {
  const disabled = enabled ? '' : 'disabled';
  if (!effect || effect.type === 'none' || effect.type === 'same') return '';
  if (effect.type === 'heal') {
    return `<div class="enemy-effect-fields">
      <label class="mini-field"><span>回復方法</span><select class="enemy-effect-mode" ${disabled}><option value="flat" ${effect.mode !== 'maxPercent' ? 'selected' : ''}>固定値</option><option value="maxPercent" ${effect.mode === 'maxPercent' ? 'selected' : ''}>最大HP%</option></select></label>
      <label class="mini-field"><span>回復量</span><input class="enemy-effect-value" type="number" inputmode="decimal" step="0.1" min="0" value="${escapeHtml(effect.value ?? '200')}" ${disabled}></label>
    </div>`;
  }
  const targeted = effect.type === 'allyAtkDebuff' || effect.type === 'allySpeedDebuff';
  const defaultValue = effect.type === 'enemyDefenseBuff' ? '80' : (targeted ? '80' : '150');
  return `<div class="enemy-effect-fields">
    ${targeted ? `<label class="mini-field"><span>対象</span><select class="enemy-effect-target" ${disabled}>${targetOptions(effect.target ?? 'all', false)}</select></label>` : ''}
    <label class="mini-field"><span>方式</span><select class="enemy-effect-mode" ${disabled}><option value="mult" ${effect.mode !== 'add' ? 'selected' : ''}>乗算</option><option value="add" ${effect.mode === 'add' ? 'selected' : ''}>加算</option></select></label>
    <label class="mini-field"><span>値</span><div class="input-with-suffix"><input class="enemy-effect-value" type="number" inputmode="decimal" step="0.1" value="${escapeHtml(effect.value ?? defaultValue)}" ${disabled}><span class="suffix">${effect.mode === 'add' ? '' : '%'}</span></div></label>
    <label class="mini-field"><span>継続</span><div class="input-with-suffix"><input class="enemy-effect-duration" type="number" inputmode="numeric" min="1" max="99" step="1" value="${escapeHtml(effect.duration ?? '1')}" ${disabled}><span class="suffix">ターン</span></div></label>
  </div>`;
}

function enemyActionHtml(action, turnIndex) {
  const effect = action.effect ?? { type: 'none' };
  const choices = turnIndex > 0 ? [...ENEMY_EFFECT_TYPES, ['same', '同行動']] : ENEMY_EFFECT_TYPES;
  return `
    <div class="action-card enemy-action-card" data-turn-index="${turnIndex}" data-actor-key="enemy">
      <div class="action-card-head enemy-head">
        <strong>敵</strong>
        <label class="toggle-line"><input class="enemy-enabled" type="checkbox" ${action.enabled ? 'checked' : ''}> このターン行動する</label>
      </div>
      <div class="enemy-action-body ${action.enabled ? '' : 'is-disabled'}">
        <label class="mini-field"><span>敵行動効果</span>
          <select class="enemy-effect-type" ${action.enabled ? '' : 'disabled'}>${optionsHtml(choices, effect.type)}</select>
        </label>
        ${enemyEffectFieldsHtml(effect, action.enabled)}
      </div>
      <p class="inline-note poison-note">敵行動OFFでも、この敵の行動タイミングで毒・猛毒ダメージは発生します。</p>
    </div>`;
}

function turnHtml(turn, turnIndex) {
  return `
    <section class="panel turn-panel" data-turn-panel="${turnIndex}">
      <div class="section-heading turn-heading">
        <div><h2>ターン${turnIndex + 1}</h2><p>ターン開始時の素早さで行動順を決定します。</p></div>
        <div class="turn-actions">
          <button type="button" class="mini-add duplicate-turn">複製</button>
          ${state.turns.length > 1 ? '<button type="button" class="mini-danger remove-turn">削除</button>' : ''}
        </div>
      </div>
      <div class="turn-action-list">
        ${Array.from({ length: state.allyCount }, (_, i) => actionCardHtml(turn.allyActions[i], turnIndex, i)).join('')}
        ${enemyActionHtml(turn.enemyAction, turnIndex)}
      </div>
    </section>`;
}

function resultHtml(result, error = '') {
  if (error) {
    return `
      <section class="result-panel kill-result has-error" id="killResultPanel">
        <div class="result-card kill-result-main"><span class="result-label">撃破確率</span><strong class="result-number">—</strong></div>
        <div class="result-meta"><span class="error-text">${escapeHtml(error)}</span></div>
      </section>`;
  }
  const pct = result.killChance * 100;
  const pctText = pct > 0 && pct < 0.01 ? '<0.01%' : `${pct.toFixed(2)}%`;
  const verdict = pct >= 100 - 1e-10 ? '確定撃破' : pct <= 1e-12 ? '撃破不可' : '確率撃破';
  const finalOrder = result.finalOrder.map(a => a.side === 'enemy' ? `敵(${a.speed})` : `キャラ${a.index + 1}(${a.speed})`).join(' → ');
  return `
    <section class="result-panel kill-result" id="killResultPanel">
      <div class="result-card kill-result-main">
        <span class="result-label">撃破確率</span>
        <strong class="result-number">${pctText}</strong>
      </div>
      <div class="result-card kill-verdict-card">
        <span class="result-label">判定</span>
        <strong class="kill-verdict">${verdict}</strong>
      </div>
      <div class="result-meta">最終ターン行動順: ${escapeHtml(finalOrder)}</div>
    </section>`;
}

function timelineHtml(result) {
  if (!result) return '';
  return `
    <details class="panel details-panel">
      <summary>計算経過</summary>
      <div class="timeline-list">
        ${result.timeline.map(item => {
          const p = item.killChance * 100;
          const live = item.minLiveHp === 0 && item.maxLiveHp === 0 ? '生存分岐なし' : `生存HP ${item.minLiveHp}～${item.maxLiveHp}`;
          return `<div class="timeline-row"><span>T${item.turn} ${escapeHtml(item.label)}</span><strong>${p.toFixed(2)}%</strong><small>${live}</small></div>`;
        }).join('')}
      </div>
    </details>`;
}

function calculate() {
  try {
    return { result: simulateKillProbability(state), error: '' };
  } catch (e) {
    return { result: null, error: e.message };
  }
}

function render() {
  const { result, error } = calculate();
  root.innerHTML = `
    ${resultHtml(result, error)}

    <section class="panel">
      <h2>敵</h2>
      <div class="field-grid three-col">
        <label class="field"><span class="field-label">HP</span><input id="enemyHp" type="number" inputmode="numeric" min="1" step="1" value="${escapeHtml(state.enemy.maxHp)}"></label>
        <label class="field"><span class="field-label">属性</span><select id="enemyAttribute">${optionsHtml(ENEMY_ATTRIBUTE_OPTIONS, state.enemy.attribute)}</select></label>
        <label class="field"><span class="field-label">素早さ</span><input id="enemySpeed" type="number" inputmode="decimal" min="0" step="0.1" value="${escapeHtml(state.enemy.speed)}"></label>
      </div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div><h2>味方</h2><p>1～3体。素早さ同値ならキャラ番号が小さい順、敵と同値なら味方が先です。</p></div>
        <label class="count-select">人数 <select id="allyCount"><option value="1" ${state.allyCount === 1 ? 'selected' : ''}>1</option><option value="2" ${state.allyCount === 2 ? 'selected' : ''}>2</option><option value="3" ${state.allyCount === 3 ? 'selected' : ''}>3</option></select></label>
      </div>
      <div class="ally-grid">
        ${Array.from({ length: state.allyCount }, (_, i) => `
          <div class="ally-card" data-ally-index="${i}">
            <strong>キャラ${i + 1}</strong>
            <label class="mini-field"><span>モンスター</span><select class="ally-character">${characterOptionsHtml(state.allies[i].characterId ?? '')}</select></label>
            <label class="mini-field"><span>攻撃力</span><input class="ally-attack" type="number" inputmode="decimal" min="0" step="0.1" value="${escapeHtml(state.allies[i].attack)}"></label>
            <label class="mini-field"><span>素早さ</span><input class="ally-speed" type="number" inputmode="decimal" min="0" step="0.1" value="${escapeHtml(state.allies[i].speed)}"></label>
          </div>`).join('')}
      </div>
    </section>

    <section class="panel rule-note-panel">
      <h2>現在の暫定ルール</h2>
      <p>毒=現在HPの10%、猛毒=20%を敵の行動タイミング終了直後に切り捨てダメージ。毒系は後から付与したものが上書きされます。バフ／デバフは付与ターンを1ターン目としてターン終了時に残りターンを1減らします。行動順は各ターン開始時に固定します。</p>
    </section>

    <div class="turn-stack">
      ${state.turns.map((turn, i) => turnHtml(turn, i)).join('')}
    </div>

    <div class="turn-add-row">
      <button type="button" class="add-button" id="addTurn" ${state.turns.length >= 12 ? 'disabled' : ''}>＋ ターン追加</button>
      <button type="button" class="ghost-button" id="duplicateLastTurn" ${state.turns.length >= 12 ? 'disabled' : ''}>最後のターンを複製</button>
    </div>

    <div id="timelineContainer">${timelineHtml(result)}</div>
  `;
}

function collectStateFromDom() {
  state.enemy.maxHp = root.querySelector('#enemyHp')?.value ?? state.enemy.maxHp;
  state.enemy.attribute = root.querySelector('#enemyAttribute')?.value ?? state.enemy.attribute;
  state.enemy.speed = root.querySelector('#enemySpeed')?.value ?? state.enemy.speed;
  state.allyCount = Number(root.querySelector('#allyCount')?.value ?? state.allyCount);

  root.querySelectorAll('.ally-card').forEach(card => {
    const i = Number(card.dataset.allyIndex);
    state.allies[i].characterId = card.querySelector('.ally-character')?.value ?? state.allies[i].characterId ?? '';
    state.allies[i].attack = card.querySelector('.ally-attack')?.value ?? state.allies[i].attack;
    state.allies[i].speed = card.querySelector('.ally-speed')?.value ?? state.allies[i].speed;
    rememberCharacterStats(state.allies[i]);
  });

  root.querySelectorAll('.action-card').forEach(card => {
    const turnIndex = Number(card.dataset.turnIndex);
    const actorKey = card.dataset.actorKey;
    if (!state.turns[turnIndex]) return;

    if (actorKey === 'enemy') {
      const action = state.turns[turnIndex].enemyAction;
      action.enabled = card.querySelector('.enemy-enabled')?.checked ?? action.enabled;
      const type = card.querySelector('.enemy-effect-type')?.value ?? action.effect?.type ?? 'none';
      const effect = { type };
      const target = card.querySelector('.enemy-effect-target')?.value;
      const mode = card.querySelector('.enemy-effect-mode')?.value;
      const value = card.querySelector('.enemy-effect-value')?.value;
      const duration = card.querySelector('.enemy-effect-duration')?.value;
      if (target !== undefined) effect.target = target;
      if (mode !== undefined) effect.mode = mode;
      if (value !== undefined) effect.value = value;
      if (duration !== undefined) effect.duration = duration;
      action.effect = effect;
    } else {
      const allyIndex = Number(actorKey.replace('ally', ''));
      const action = state.turns[turnIndex].allyActions[allyIndex];
      action.kind = card.querySelector('.action-kind')?.value ?? action.kind;
      action.skillMultiplier = card.querySelector('.skill-multiplier')?.value ?? action.skillMultiplier;
      action.attackAttribute = card.querySelector('.attack-attribute')?.value ?? action.attackAttribute;
      action.hits = card.querySelector('.hit-count')?.value ?? action.hits;
      action.skillName = card.querySelector('.skill-name')?.value ?? action.skillName ?? '';
      action.buff = collectPrimaryBuff(card, 'ally', action.buff);
      action.effects = collectEffects(card);
    }
  });
}

function collectPrimaryBuff(card, side, current) {
  const type = card.querySelector('.main-buff-type')?.value;
  if (type === undefined) return current ?? defaultPrimaryBuff(side);
  const buff = {
    type,
    mode: card.querySelector('.main-buff-mode')?.value ?? 'mult',
    value: card.querySelector('.main-buff-value')?.value ?? '150',
    duration: card.querySelector('.main-buff-duration')?.value ?? '1'
  };
  const target = card.querySelector('.main-buff-target')?.value;
  if (target !== undefined) buff.target = target;
  return buff;
}

function collectEffects(card) {
  return [...card.querySelectorAll('.effect-row')].map(row => {
    const type = row.querySelector('.effect-type')?.value;
    const effect = { type };
    const target = row.querySelector('.effect-target')?.value;
    const mode = row.querySelector('.effect-mode')?.value;
    const value = row.querySelector('.effect-value')?.value;
    const duration = row.querySelector('.effect-duration')?.value;
    if (target !== undefined) effect.target = target;
    if (mode !== undefined) effect.mode = mode;
    if (value !== undefined) effect.value = value;
    if (duration !== undefined) effect.duration = duration;
    return effect;
  });
}

function rememberCharacterStats(ally) {
  if (!ally?.characterId) return;
  if (!state.characterStats) state.characterStats = defaultCharacterStats();
  const attack = ally.attack ?? '';
  const speed = ally.speed ?? '';
  if (attack === '' && speed === '') return;
  state.characterStats[ally.characterId] = { attack, speed };
}

function saveAndRender() {
  saveState();
  render();
}

function updateResultOnly() {
  const { result, error } = calculate();
  const old = root.querySelector('#killResultPanel');
  if (old) old.outerHTML = resultHtml(result, error);
  const timeline = root.querySelector('#timelineContainer');
  if (timeline) timeline.innerHTML = timelineHtml(result);
}

let state = loadState();
render();

root.addEventListener('input', event => {
  if (!(event.target instanceof HTMLInputElement)) return;
  collectStateFromDom();
  saveState();
  updateResultOnly();
});

root.addEventListener('change', event => {
  if (!(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLSelectElement)) return;
  if (event.target.classList.contains('ally-character')) {
    const card = event.target.closest('.ally-card');
    const allyIndex = Number(card?.dataset.allyIndex);
    if (Number.isInteger(allyIndex)) applyCharacterPreset(allyIndex, event.target.value);
  } else {
    collectStateFromDom();
  }

  // 表示項目が変わる選択は全体を再描画。
  if (
    event.target.id === 'allyCount' ||
    event.target.classList.contains('action-kind') ||
    event.target.classList.contains('enemy-enabled') ||
    event.target.classList.contains('enemy-effect-type') ||
    event.target.classList.contains('ally-character') ||
    event.target.classList.contains('effect-type') ||
    event.target.classList.contains('effect-mode') ||
    event.target.classList.contains('main-buff-mode')
  ) {
    saveAndRender();
  } else {
    saveState();
    updateResultOnly();
  }
});

root.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  collectStateFromDom();

  if (button.id === 'addTurn') {
    const base = deepClone(state.turns[state.turns.length - 1] ?? cloneDefaultState().turns[0]);
    if (state.turns.length < 12) state.turns.push(base);
    saveAndRender();
    return;
  }

  if (button.id === 'duplicateLastTurn') {
    if (state.turns.length < 12) state.turns.push(deepClone(state.turns[state.turns.length - 1]));
    saveAndRender();
    return;
  }

  if (button.classList.contains('duplicate-turn')) {
    const turnIndex = Number(button.closest('[data-turn-panel]')?.dataset.turnPanel);
    if (state.turns.length < 12 && Number.isInteger(turnIndex)) state.turns.splice(turnIndex + 1, 0, deepClone(state.turns[turnIndex]));
    saveAndRender();
    return;
  }

  if (button.classList.contains('remove-turn')) {
    const turnIndex = Number(button.closest('[data-turn-panel]')?.dataset.turnPanel);
    if (state.turns.length > 1 && Number.isInteger(turnIndex)) state.turns.splice(turnIndex, 1);
    saveAndRender();
    return;
  }

  if (button.classList.contains('add-effect')) {
    const card = button.closest('.action-card');
    const turnIndex = Number(card.dataset.turnIndex);
    const actorKey = card.dataset.actorKey;
    const side = button.dataset.side;
    const types = side === 'enemy' ? ENEMY_EFFECT_TYPES : ALLY_EFFECT_TYPES;
    const effect = effectDefault(types[0][0], side);
    if (actorKey === 'enemy') state.turns[turnIndex].enemyAction.effects.push(effect);
    else state.turns[turnIndex].allyActions[Number(actorKey.replace('ally', ''))].effects.push(effect);
    saveAndRender();
    return;
  }

  if (button.classList.contains('remove-effect')) {
    const row = button.closest('.effect-row');
    const turnIndex = Number(row.dataset.turnIndex);
    const effectIndex = Number(row.dataset.effectIndex);
    const actorKey = row.dataset.actorKey;
    if (actorKey === 'enemy') state.turns[turnIndex].enemyAction.effects.splice(effectIndex, 1);
    else state.turns[turnIndex].allyActions[Number(actorKey.replace('ally', ''))].effects.splice(effectIndex, 1);
    saveAndRender();
  }
});

resetButton.addEventListener('click', () => {
  state = normalizeState(cloneDefaultState());
  saveState();
  render();
});

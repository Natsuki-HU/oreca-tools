// 撃破確率シミュレータ v0.4.2
// 公開用の撃破確率計算に必要な戦闘要素だけを扱います。

export const DEFENDER_ATTRIBUTES = Object.freeze([
  ['none', '無'], ['fire', '火'], ['water', '水'], ['earth', '土'],
  ['wind', '風'], ['light', '光'], ['dark', '闇']
]);

// 撃破確率ページで選択できる敵属性。敵には無・光・闇属性は存在しないため除外。
export const ENEMY_ATTRIBUTE_OPTIONS = Object.freeze([
  ['fire', '火'], ['water', '水'], ['earth', '土'], ['wind', '風']
]);

export const ATTACK_ATTRIBUTES = Object.freeze([
  ['none', '無'], ['fire', '火'], ['heat', '熱'], ['water', '水'], ['ice', '氷'],
  ['earth', '土'], ['poison', '毒'], ['wind', '風'], ['thunder', '雷'],
  ['light', '光'], ['holy', '聖'], ['dark', '闇'], ['evil', '邪'], ['all', '全']
]);

const ATTACK_ATTRIBUTE_INDEX = Object.freeze(Object.fromEntries(ATTACK_ATTRIBUTES.map((x, i) => [x[0], i])));
const DEFENDER_ATTRIBUTE_INDEX = Object.freeze(Object.fromEntries(DEFENDER_ATTRIBUTES.map((x, i) => [x[0], i])));

// 1000 = 100%。アプリ内部で確認した14×7属性表。
const ATTRIBUTE_TABLE = Object.freeze([
  [1000,1000,1000,1000,1000,1000,1000],
  [1000,1000,1500, 900, 800, 900, 900],
  [1000,1000, 900, 900,1400, 900, 900],
  [1000, 800,1000,1500, 900, 900, 900],
  [1000,1400,1000, 900, 900, 900, 900],
  [1000, 900, 800,1000,1500, 900, 900],
  [1000, 900,1400,1000, 900, 900, 900],
  [1000,1500, 900, 800,1000, 900, 900],
  [1000, 900, 900,1400,1000, 900, 900],
  [1000,1050,1050,1050,1050,1000,1500],
  [1000,1070,1070,1070,1070,1000,1400],
  [1000,1050,1050,1050,1050,1500,1000],
  [1000,1070,1070,1070,1070,1400,1000],
  [1000,1100,1100,1100,1100,1100,1100]
]);

export const ALLY_EFFECT_TYPES = Object.freeze([
  ['atkBuff', '攻撃力バフ'],
  ['speedBuff', '素早さバフ'],
  ['defenseDown', '敵の防御ダウン'],
  ['speedDown', '敵の素早さダウン'],
  ['poison', '毒'],
  ['deadlyPoison', '猛毒']
]);

export const ENEMY_EFFECT_TYPES = Object.freeze([
  ['none', '効果なし'],
  ['allyAtkDebuff', '攻撃デバフ'],
  ['allySpeedDebuff', '素早さデバフ'],
  ['enemyAtkBuff', '敵の攻撃アップ'],
  ['enemyDefenseBuff', '敵の防御アップ'],
  ['enemySpeedBuff', '敵の素早さアップ'],
  ['heal', '回復']
]);

function defaultAllyBuff() {
  return { type: 'atkBuff', target: 'self', mode: 'mult', value: '150', duration: '1' };
}

function defaultEnemyBuff() {
  return { type: 'enemyAtkBuff', mode: 'mult', value: '150', duration: '1' };
}

function defaultEnemyEffect() {
  return { type: 'none', target: 'all', mode: 'mult', value: '80', duration: '1' };
}

function defaultAttackAction() {
  return {
    kind: 'attack',
    skillMultiplier: '200',
    attackAttribute: 'none',
    hits: '1',
    buff: defaultAllyBuff(),
    effects: []
  };
}

function defaultSkipAction() {
  return { kind: 'skip', skillMultiplier: '200', attackAttribute: 'none', hits: '1', buff: defaultAllyBuff(), effects: [] };
}

export const DEFAULT_STATE = Object.freeze({
  enemy: { maxHp: '1500', attribute: 'fire', speed: '45' },
  characterStats: {
    son_goku: { attack: '84', speed: '78' },
    gyumao: { attack: '94', speed: '15' },
    sylph: { attack: '31', speed: '42' },
    crow: { attack: '31', speed: '63' },
    platinum_drake: { attack: '78', speed: '78' },
    clear_blue_dragon: { attack: '73', speed: '68' },
    bahamut: { attack: '89', speed: '73' },
    mimitoshishi: { attack: '42', speed: '63' },
    dark_bahamut: { attack: '89', speed: '73' },
    magora: { attack: '36', speed: '57' },
    kerogon_green: { attack: '31', speed: '52' },
    oniwaka_monk: { attack: '63', speed: '47' },
    oniwaka: { attack: '57', speed: '42' },
    red_empress: { attack: '63', speed: '84' },
    raijin_kukulkan: { attack: '78', speed: '89' },
    venom_behemoth: { attack: '73', speed: '15' },
    heavy_behemoth: { attack: '63', speed: '10' },
    kerogon_yellow: { attack: '31', speed: '21' },
    guardian_powan: { attack: '73', speed: '73' },
    kerogon_blue: { attack: '31', speed: '42' },
    dartan: { attack: '78', speed: '36' },
    kerogon_gold: { attack: '36', speed: '10' },
    camineko: { attack: '42', speed: '68' },
    garanezumi: { attack: '31', speed: '73' },
    black_knight_gebolg: { attack: '74', speed: '31' },
    rakshasa: { attack: '53', speed: '21' },
    scarlet_dragon: { attack: '89', speed: '47' },
    kenran_kukulkan: { attack: '78', speed: '89' },
    shinjuryu_kukulkan: { attack: '78', speed: '84' },
    ifrit: { attack: '84', speed: '42' },
    astaroth: { attack: '68', speed: '31' },
    loki: { attack: '63', speed: '68' },
    toritamago: { attack: '1', speed: '1' },
    ares: { attack: '73', speed: '21' },
    chibimuus: { attack: '45', speed: '15' },
    lafroig: { attack: '94', speed: '57' },
    mermaid_mellow: { attack: '68', speed: '73' },
    captain_azul: { attack: '63', speed: '42' },
    elysion: { attack: '78', speed: '52' },
    hien: { attack: '63', speed: '78' },
    marduk: { attack: '79', speed: '95' },
    enki: { attack: '78', speed: '57' },
    damkina: { attack: '68', speed: '89' },
    saezer: { attack: '68', speed: '52' },
    dante_magic_swordsman: { attack: '68', speed: '31' },
    simon: { attack: '68', speed: '47' },
    hayate: { attack: '57', speed: '84' },
    sky_clay: { attack: '73', speed: '73' },
    djinn: { attack: '63', speed: '84' },
    gate_dante: { attack: '78', speed: '36' },
    yamato: { attack: '78', speed: '78' },
    susanoo: { attack: '73', speed: '78' },
    nanawarai: { attack: '84', speed: '63' },
    ginger_ale: { attack: '84', speed: '52' },
    soccerra: { attack: '92', speed: '26' },
    fire_drake: { attack: '84', speed: '47' }
  },
  allyCount: 3,
  allies: [
    { characterId: 'son_goku', attack: '84', speed: '78' },
    { characterId: 'gyumao', attack: '94', speed: '15' },
    { characterId: '', attack: '0', speed: '0' }
  ],
  turns: [{
    allyActions: [
      { ...defaultAttackAction(), kind: 'buff', skillName: 'ロキブランド', buff: { type: 'atkBuff', target: 'self', mode: 'mult', value: '150', duration: '2' } },
      { ...defaultAttackAction(), kind: 'buff', skillName: '鬼の気合入れ', buff: { type: 'atkBuff', target: 'self', mode: 'mult', value: '200', duration: '1' } },
      { ...defaultSkipAction(), skillName: '' }
    ],
    enemyAction: { enabled: true, effect: defaultEnemyEffect() }
  }]
});

export function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function trunc0(value) {
  return Math.trunc(value);
}

function parseNumber(value, label, { min = -Infinity, max = Infinity } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${label}が不正です`);
  return n;
}

function parseIntValue(value, label, { min = -Infinity, max = Infinity } = {}) {
  const n = trunc0(parseNumber(value, label, { min, max }));
  if (n < min || n > max) throw new Error(`${label}が不正です`);
  return n;
}

function applyMod(value, mod) {
  const amount = Number(mod.value);
  if (!Number.isFinite(amount)) return value;
  if (mod.mode === 'add') return value + trunc0(amount);
  return trunc0(value * amount / 100);
}

function applyMods(base, mods, { clampMin = -Infinity, clampMax = Infinity } = {}) {
  let value = base;
  for (const mod of [...mods].sort((a, b) => a.seq - b.seq)) value = applyMod(value, mod);
  return Math.min(clampMax, Math.max(clampMin, value));
}

function attrCoefficient(attackAttr, defenderAttr) {
  const a = ATTACK_ATTRIBUTE_INDEX[attackAttr];
  const d = DEFENDER_ATTRIBUTE_INDEX[defenderAttr];
  if (a === undefined || d === undefined) return 1000;
  return ATTRIBUTE_TABLE[a][d];
}

function oneHitDistribution({ attack, skillMultiplier, attackAttribute, defenderAttribute, defenseMods }) {
  let base = trunc0(attack * skillMultiplier / 100);
  base = trunc0(base * attrCoefficient(attackAttribute, defenderAttribute) / 1000);

  const counts = new Map();
  for (let r = -50; r <= 50; r++) {
    let damage = base + trunc0(base * r / 1000);
    damage = Math.min(damage, 999);
    damage = applyMods(damage, defenseMods, { clampMin: 0 });
    counts.set(damage, (counts.get(damage) ?? 0) + 1);
  }
  return new Map([...counts].map(([damage, count]) => [damage, count / 101]));
}

function convolveDamage(a, b) {
  const out = new Map();
  for (const [da, pa] of a) {
    for (const [db, pb] of b) {
      const key = da + db;
      out.set(key, (out.get(key) ?? 0) + pa * pb);
    }
  }
  return out;
}

export function attackDamageDistribution(config) {
  const hits = parseIntValue(config.hits, 'ヒット数', { min: 1, max: 50 });
  const skillMultiplier = parseNumber(config.skillMultiplier, '技倍率', { min: 0 });
  const one = oneHitDistribution({ ...config, skillMultiplier });
  let total = new Map([[0, 1]]);
  for (let i = 0; i < hits; i++) total = convolveDamage(total, one);
  return total;
}

function mapHpDistribution(hpDist, mapper) {
  const out = new Map();
  for (const [hp, probability] of hpDist) {
    if (hp <= 0) {
      out.set(0, (out.get(0) ?? 0) + probability);
      continue;
    }
    const nextHp = Math.max(0, trunc0(mapper(hp)));
    out.set(nextHp, (out.get(nextHp) ?? 0) + probability);
  }
  return out;
}

function applyAttackToHp(hpDist, damageDist) {
  const out = new Map();
  for (const [hp, hpProb] of hpDist) {
    if (hp <= 0) {
      out.set(0, (out.get(0) ?? 0) + hpProb);
      continue;
    }
    for (const [damage, damageProb] of damageDist) {
      const nextHp = Math.max(0, hp - damage);
      out.set(nextHp, (out.get(nextHp) ?? 0) + hpProb * damageProb);
    }
  }
  return out;
}

function killChance(hpDist) {
  return Math.max(0, Math.min(1, hpDist.get(0) ?? 0));
}

function hpRange(hpDist) {
  const live = [...hpDist.keys()].filter(hp => hp > 0);
  if (!live.length) return { min: 0, max: 0 };
  return { min: Math.min(...live), max: Math.max(...live) };
}

function normalizeTarget(effect, actorIndex, allyCount) {
  const target = effect.target ?? 'self';
  if (target === 'all') return Array.from({ length: allyCount }, (_, i) => i);
  if (target === 'self') return [actorIndex];
  const m = /^ally(\d)$/.exec(target);
  if (m) {
    const i = Number(m[1]) - 1;
    return i >= 0 && i < allyCount ? [i] : [];
  }
  return [];
}

function addTimedMod(list, effect, seq, defaultMode = 'mult') {
  const duration = Math.max(1, parseIntValue(effect.duration ?? '1', '継続ターン', { min: 1, max: 99 }));
  const value = parseNumber(effect.value ?? '100', '補正値');
  list.push({ mode: effect.mode ?? defaultMode, value, remaining: duration, seq });
}

function decrementTimedEffects(runtime) {
  const dec = list => list
    .map(x => ({ ...x, remaining: x.remaining - 1 }))
    .filter(x => x.remaining > 0);
  for (const ally of runtime.allies) {
    ally.attackMods = dec(ally.attackMods);
    ally.speedMods = dec(ally.speedMods);
  }
  runtime.enemy.speedMods = dec(runtime.enemy.speedMods);
  runtime.enemy.attackMods = dec(runtime.enemy.attackMods);
  runtime.enemy.defenseMods = dec(runtime.enemy.defenseMods);
}

function allyEffect(runtime, effect, actorIndex) {
  runtime.seq += 1;
  switch (effect.type) {
    case 'atkBuff': {
      for (const i of normalizeTarget(effect, actorIndex, runtime.allyCount)) {
        addTimedMod(runtime.allies[i].attackMods, effect, runtime.seq);
      }
      break;
    }
    case 'speedBuff': {
      for (const i of normalizeTarget(effect, actorIndex, runtime.allyCount)) {
        addTimedMod(runtime.allies[i].speedMods, effect, runtime.seq);
      }
      break;
    }
    case 'defenseDown':
      addTimedMod(runtime.enemy.defenseMods, effect, runtime.seq);
      break;
    case 'speedDown':
      addTimedMod(runtime.enemy.speedMods, effect, runtime.seq);
      break;
    case 'poison':
      runtime.enemy.poison = 'poison';
      break;
    case 'deadlyPoison':
      runtime.enemy.poison = 'deadlyPoison';
      break;
    default:
      break;
  }
}

function enemyEffect(runtime, effect, hpDist) {
  runtime.seq += 1;
  switch (effect.type) {
    case 'allyAtkDebuff': {
      const targets = effect.target === 'all'
        ? Array.from({ length: runtime.allyCount }, (_, i) => i)
        : normalizeTarget(effect, 0, runtime.allyCount);
      for (const i of targets) addTimedMod(runtime.allies[i].attackMods, effect, runtime.seq);
      return hpDist;
    }
    case 'allySpeedDebuff': {
      const targets = effect.target === 'all'
        ? Array.from({ length: runtime.allyCount }, (_, i) => i)
        : normalizeTarget(effect, 0, runtime.allyCount);
      for (const i of targets) addTimedMod(runtime.allies[i].speedMods, effect, runtime.seq);
      return hpDist;
    }
    case 'enemySpeedBuff':
      addTimedMod(runtime.enemy.speedMods, effect, runtime.seq);
      return hpDist;
    case 'enemyAtkBuff':
      addTimedMod(runtime.enemy.attackMods, effect, runtime.seq);
      return hpDist;
    case 'enemyDefenseBuff':
      addTimedMod(runtime.enemy.defenseMods, effect, runtime.seq);
      return hpDist;
    case 'heal': {
      const value = parseNumber(effect.value ?? '0', '回復量', { min: 0 });
      const mode = effect.mode ?? 'flat';
      const amount = mode === 'maxPercent' ? trunc0(runtime.maxHp * value / 100) : trunc0(value);
      return mapHpDistribution(hpDist, hp => Math.min(runtime.maxHp, hp + amount));
    }
    default:
      return hpDist;
  }
}

function applyPoison(runtime, hpDist) {
  if (runtime.enemy.poison === 'poison') {
    return mapHpDistribution(hpDist, hp => hp - Math.floor(hp * 0.10));
  }
  if (runtime.enemy.poison === 'deadlyPoison') {
    return mapHpDistribution(hpDist, hp => hp - Math.floor(hp * 0.20));
  }
  return hpDist;
}

function actorOrder(runtime) {
  const actors = [];
  for (let i = 0; i < runtime.allyCount; i++) {
    actors.push({
      side: 'ally',
      index: i,
      speed: applyMods(runtime.allies[i].baseSpeed, runtime.allies[i].speedMods, { clampMin: 0 })
    });
  }
  actors.push({
    side: 'enemy',
    index: -1,
    speed: applyMods(runtime.enemy.baseSpeed, runtime.enemy.speedMods, { clampMin: 0 })
  });

  actors.sort((a, b) => {
    if (a.speed !== b.speed) return b.speed - a.speed;
    if (a.side !== b.side) return a.side === 'ally' ? -1 : 1;
    return a.index - b.index;
  });
  return actors;
}

function recordTimeline(timeline, label, hpDist, turn, kind) {
  const range = hpRange(hpDist);
  timeline.push({
    label,
    turn,
    kind,
    killChance: killChance(hpDist),
    minLiveHp: range.min,
    maxLiveHp: range.max
  });
}

function ensureAction(action, side = 'ally') {
  const defaultBuff = side === 'enemy' ? defaultEnemyBuff() : defaultAllyBuff();
  return {
    kind: action?.kind ?? 'skip',
    skillMultiplier: action?.skillMultiplier ?? '200',
    attackAttribute: action?.attackAttribute ?? 'none',
    hits: action?.hits ?? '1',
    buff: { ...defaultBuff, ...(action?.buff ?? {}) },
    effects: Array.isArray(action?.effects) ? action.effects : [],
    skillName: action?.skillName ?? ''
  };
}

function resolveAction(turns, turnIndex, side, actorIndex = -1) {
  let index = turnIndex;
  let repeated = false;
  while (index >= 0) {
    const raw = side === 'enemy'
      ? turns[index]?.enemyAction
      : turns[index]?.allyActions?.[actorIndex];
    const action = ensureAction(raw, side);
    if (action.kind !== 'same') return { action, repeated };
    repeated = true;
    index -= 1;
  }
  return { action: ensureAction({ kind: 'skip' }, side), repeated: true };
}

export function simulateKillProbability(state) {
  const maxHp = parseIntValue(state.enemy?.maxHp, '敵HP', { min: 1, max: 9999999 });
  const enemyBaseSpeed = parseNumber(state.enemy?.speed, '敵の素早さ', { min: 0 });
  const allyCount = parseIntValue(state.allyCount, '味方人数', { min: 1, max: 3 });
  const turns = Array.isArray(state.turns) && state.turns.length ? state.turns : [];
  if (!turns.length) throw new Error('ターンを1つ以上設定してください');

  const runtime = {
    maxHp,
    allyCount,
    seq: 0,
    allies: Array.from({ length: allyCount }, (_, i) => ({
      baseAttack: parseNumber(state.allies?.[i]?.attack, `キャラ${i + 1}の攻撃力`, { min: 0 }),
      baseSpeed: parseNumber(state.allies?.[i]?.speed, `キャラ${i + 1}の素早さ`, { min: 0 }),
      attackMods: [],
      speedMods: []
    })),
    enemy: {
      baseSpeed: enemyBaseSpeed,
      speedMods: [],
      attackMods: [],
      defenseMods: [],
      poison: 'none'
    }
  };

  let hpDist = new Map([[maxHp, 1]]);
  const timeline = [];

  for (let turnIndex = 0; turnIndex < turns.length; turnIndex++) {
    const turn = turns[turnIndex] ?? {};
    const order = actorOrder(runtime);
    const isFinalTurn = turnIndex === turns.length - 1;
    const lastAllyPosition = Math.max(...order.map((actor, pos) => actor.side === 'ally' ? pos : -1));

    for (let pos = 0; pos < order.length; pos++) {
      const actor = order[pos];

      if (actor.side === 'ally') {
        const resolved = resolveAction(turns, turnIndex, 'ally', actor.index);
        const action = resolved.action;
        const samePrefix = resolved.repeated ? '同行動→' : '';
        if (action.kind === 'attack') {
          const attack = applyMods(
            runtime.allies[actor.index].baseAttack,
            runtime.allies[actor.index].attackMods,
            { clampMin: 1, clampMax: 999 }
          );
          const damageDist = attackDamageDistribution({
            attack,
            skillMultiplier: action.skillMultiplier,
            attackAttribute: action.attackAttribute,
            defenderAttribute: state.enemy?.attribute ?? 'none',
            defenseMods: runtime.enemy.defenseMods,
            hits: action.hits
          });
          hpDist = applyAttackToHp(hpDist, damageDist);
          recordTimeline(timeline, `キャラ${actor.index + 1} ${samePrefix}攻撃`, hpDist, turnIndex + 1, 'attack');
        } else if (action.kind === 'buff') {
          allyEffect(runtime, action.buff, actor.index);
          recordTimeline(timeline, `キャラ${actor.index + 1} ${samePrefix}バフ`, hpDist, turnIndex + 1, 'buff');
        } else {
          recordTimeline(timeline, `キャラ${actor.index + 1} ${samePrefix}行動スキップ`, hpDist, turnIndex + 1, 'skip');
        }

        if (action.kind !== 'skip') {
          for (const effect of action.effects) allyEffect(runtime, effect, actor.index);
        }
      } else {
        const rawEnemyAction = turn.enemyAction ?? { enabled: false, effect: { type: 'none' } };
        let effect = rawEnemyAction.effect ?? { type: 'none' };
        let repeated = false;
        if (effect.type === 'same') {
          repeated = true;
          for (let i = turnIndex - 1; i >= 0; i--) {
            const prev = turns[i]?.enemyAction?.effect;
            if (prev && prev.type !== 'same') { effect = prev; break; }
          }
          if (effect.type === 'same') effect = { type: 'none' };
        }
        if (rawEnemyAction.enabled !== false) {
          hpDist = enemyEffect(runtime, effect, hpDist);
          const labelMap = {
            none: '効果なし', allyAtkDebuff: '攻撃デバフ', allySpeedDebuff: '素早さデバフ',
            enemyAtkBuff: '敵の攻撃アップ', enemyDefenseBuff: '敵の防御アップ',
            enemySpeedBuff: '敵の素早さアップ', heal: '回復'
          };
          recordTimeline(timeline, `敵 ${repeated ? '同行動→' : ''}${labelMap[effect.type] ?? '効果なし'}`, hpDist, turnIndex + 1, 'enemy');
        } else {
          recordTimeline(timeline, '敵 行動OFF', hpDist, turnIndex + 1, 'enemyOff');
        }

        const before = hpDist;
        hpDist = applyPoison(runtime, hpDist);
        if (runtime.enemy.poison !== 'none') {
          recordTimeline(
            timeline,
            runtime.enemy.poison === 'poison' ? '毒ダメージ' : '猛毒ダメージ',
            hpDist,
            turnIndex + 1,
            'poison'
          );
        } else if (before !== hpDist) {
          recordTimeline(timeline, '毒ダメージ', hpDist, turnIndex + 1, 'poison');
        }
      }

      // 最終ターンは、入力された味方の最終行動が終わった瞬間で計算を止める。
      if (isFinalTurn && pos === lastAllyPosition) {
        return {
          killChance: killChance(hpDist),
          hpDistribution: hpDist,
          timeline,
          finalTurn: turnIndex + 1,
          finalOrder: order
        };
      }
    }

    decrementTimedEffects(runtime);
  }

  return { killChance: killChance(hpDist), hpDistribution: hpDist, timeline, finalTurn: turns.length, finalOrder: [] };
}

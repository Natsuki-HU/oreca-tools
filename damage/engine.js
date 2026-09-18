export const LIMITS = Object.freeze({
  attackMods: 10,
  attributeMultipliers: 2,
  defenseMods: 10,
  reductions: 5
});

export const DEFAULT_STATE = Object.freeze({
  attackPower: '84',
  attackMods: [{ type: 'mult', value: '100' }],
  attributeMultipliers: ['100'],
  skillMultiplier: '200',
  hits: '1',
  undeadMultiplier: '100',
  defenseMods: ['100'],
  reductions: ['0']
});

export function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function parseDecimalFraction(text) {
  const raw = String(text ?? '').trim();
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(raw)) return null;
  const sign = raw.startsWith('-') ? -1n : 1n;
  const clean = raw.replace(/^[-+]/, '');
  const [intPart, fracPart = ''] = clean.split('.');
  const denominator = 10n ** BigInt(fracPart.length);
  const numerator = sign * BigInt((intPart || '0') + fracPart);
  return { numerator, denominator };
}

function parseIntegerTrunc(text) {
  const fraction = parseDecimalFraction(text);
  if (!fraction) return null;
  return Number(fraction.numerator / fraction.denominator);
}

function mulPercentTrunc(value, percentText) {
  const fraction = parseDecimalFraction(percentText);
  if (!fraction) return null;
  const numerator = BigInt(value) * fraction.numerator;
  const denominator = fraction.denominator * 100n;
  return Number(numerator / denominator);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function applyAttackMods(baseAtk, mods, trace) {
  let atk = baseAtk;
  mods.forEach((mod, index) => {
    if (mod.type === 'add') {
      const add = parseIntegerTrunc(mod.value);
      if (add === null) throw new Error(`攻撃補正${index + 1}が不正です`);
      atk += add;
      trace.push(`攻撃補正${index + 1}（加算 ${add >= 0 ? '+' : ''}${add}） → ${atk}`);
    } else {
      const next = mulPercentTrunc(atk, mod.value);
      if (next === null) throw new Error(`攻撃補正${index + 1}が不正です`);
      atk = next;
      trace.push(`攻撃補正${index + 1}（×${mod.value}%） → ${atk}`);
    }
  });

  atk = clamp(atk, 1, 999);
  trace.push(`攻撃力を1～999に制限 → ${atk}`);
  return atk;
}

function applySequentialPercent(value, values, label, trace) {
  let current = value;
  values.forEach((percent, index) => {
    const next = mulPercentTrunc(current, percent);
    if (next === null) throw new Error(`${label}${index + 1}が不正です`);
    current = next;
    trace.push(`${label}${index + 1}（×${percent}%） → ${current}`);
  });
  return current;
}

function applyReductions(value, reductions, trace) {
  let current = value;
  reductions.forEach((reduction, index) => {
    const fraction = parseDecimalFraction(reduction);
    if (!fraction) throw new Error(`ダメージ軽減${index + 1}が不正です`);

    const scaled = fraction.numerator * 1000n / fraction.denominator;
    if (scaled < 0n || scaled > 100000n) {
      throw new Error(`ダメージ軽減${index + 1}は0～100%で入力してください`);
    }

    const complementNumerator = 100n * fraction.denominator - fraction.numerator;
    current = Number((BigInt(current) * complementNumerator) / (fraction.denominator * 100n));
    trace.push(`ダメージ軽減${index + 1}（${reduction}%軽減） → ${current}`);
  });
  return current;
}

export function calculateDamage(state) {
  const traceBase = [];
  const baseAtk = parseIntegerTrunc(state.attackPower);
  const hits = parseIntegerTrunc(state.hits);

  if (baseAtk === null || baseAtk < 0) throw new Error('攻撃力を0以上の数値で入力してください');
  if (hits === null || hits < 1) throw new Error('ヒット数は1以上で入力してください');

  let atk = applyAttackMods(baseAtk, state.attackMods ?? [], traceBase);

  let damage = mulPercentTrunc(atk, state.skillMultiplier);
  if (damage === null) throw new Error('技倍率が不正です');
  traceBase.push(`技倍率（×${state.skillMultiplier}%） → ${damage}`);

  damage = applySequentialPercent(
    damage,
    state.attributeMultipliers?.length ? state.attributeMultipliers : ['100'],
    '属性倍率',
    traceBase
  );

  damage = mulPercentTrunc(damage, state.undeadMultiplier);
  if (damage === null) throw new Error('アンデッド補正が不正です');
  traceBase.push(`アンデッド補正（×${state.undeadMultiplier}%） → ${damage}`);

  const preRandom = damage;
  const minDelta = Number((BigInt(preRandom) * -50n) / 1000n);
  const maxDelta = Number((BigInt(preRandom) * 50n) / 1000n);

  let minHit = preRandom + minDelta;
  let maxHit = preRandom + maxDelta;

  // 標準ダメージコアの1ヒット999上限。
  minHit = Math.min(minHit, 999);
  maxHit = Math.min(maxHit, 999);

  const minTrace = [...traceBase, `最低乱数（-5.0%の増減量を0方向に整数化） → ${minHit}`];
  const maxTrace = [...traceBase, `最高乱数（+5.0%の増減量を0方向に整数化） → ${maxHit}`];

  minHit = applySequentialPercent(minHit, state.defenseMods ?? [], '防御補正', minTrace);
  maxHit = applySequentialPercent(maxHit, state.defenseMods ?? [], '防御補正', maxTrace);

  minHit = applyReductions(minHit, state.reductions ?? [], minTrace);
  maxHit = applyReductions(maxHit, state.reductions ?? [], maxTrace);

  return {
    atk,
    preRandom,
    minHit,
    maxHit,
    totalMin: minHit * hits,
    totalMax: maxHit * hits,
    hits,
    minTrace,
    maxTrace
  };
}

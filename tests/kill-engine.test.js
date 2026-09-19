import assert from 'node:assert/strict';
import { attackDamageDistribution, cloneDefaultState, simulateKillProbability } from '../kill/engine.js';
import { SKILL_PRESETS, SKILL_PRESET_BY_ID } from '../kill/presets.js';

function approx(actual, expected, eps = 1e-10) {
  assert.ok(Math.abs(actual - expected) <= eps, `expected ${expected}, got ${actual}`);
}

// 1) 十分低いHPなら1発で確定撃破。
{
  const s = cloneDefaultState();
  s.allyCount = 1;
  s.enemy.maxHp = '10';
  s.turns[0].allyActions[0] = { kind: 'attack', skillMultiplier: '100', attackAttribute: 'none', hits: '1', effects: [] };
  s.turns[0].enemyAction.enabled = false;
  const r = simulateKillProbability(s);
  approx(r.killChance, 1);
}

// 2) 敵行動OFFでも毒は敵の行動タイミングで発生する。
// キャラ1が猛毒を付与、敵が同ターン中に行動タイミングを迎え、20%減る。
{
  const s = cloneDefaultState();
  s.allyCount = 1;
  s.enemy.maxHp = '1000';
  s.enemy.speed = '50';
  s.allies[0].attack = '0';
  s.allies[0].speed = '100';
  s.turns[0].allyActions[0] = {
    kind: 'buff', skillMultiplier: '200', attackAttribute: 'none', hits: '1',
    effects: [{ type: 'deadlyPoison' }]
  };
  s.turns[0].enemyAction.enabled = false;
  // 最終ターンは味方最終行動で止まるので、毒タイミングを含めるため2ターンにする。
  s.turns.push(JSON.parse(JSON.stringify(s.turns[0])));
  s.turns[1].allyActions[0] = { kind: 'skip', skillMultiplier: '200', attackAttribute: 'none', hits: '1', effects: [] };
  const r = simulateKillProbability(s);
  const poisonEvent = r.timeline.find(x => x.kind === 'poison');
  assert.ok(poisonEvent);
  assert.equal(poisonEvent.minLiveHp, 800);
  assert.equal(poisonEvent.maxLiveHp, 800);
}

// 3) 同速では味方が敵より先。味方同士は番号順。
{
  const s = cloneDefaultState();
  s.enemy.speed = '100';
  s.allies[0].speed = '100';
  s.allies[1].speed = '100';
  s.allies[2].speed = '100';
  const r = simulateKillProbability(s);
  assert.deepEqual(r.finalOrder.map(x => x.side === 'enemy' ? 'E' : `A${x.index + 1}`), ['A1','A2','A3','E']);
}

// 4) 最終ターンでは最後の味方行動後に敵が遅ければ、敵毒タイミングは含めない。
{
  const s = cloneDefaultState();
  s.allyCount = 1;
  s.enemy.maxHp = '100';
  s.enemy.speed = '10';
  s.allies[0].speed = '100';
  s.turns[0].allyActions[0] = { kind: 'buff', skillMultiplier: '200', attackAttribute: 'none', hits: '1', effects: [{ type: 'deadlyPoison' }] };
  s.turns[0].enemyAction.enabled = false;
  const r = simulateKillProbability(s);
  assert.equal(r.timeline.some(x => x.kind === 'poison'), false);
}

console.log('kill-engine tests: OK');

// 5) v0.4.0 のデフォルト値。
{
  const s = cloneDefaultState();
  assert.equal(s.enemy.maxHp, '1500');
  assert.equal(s.enemy.attribute, 'fire');
  assert.equal(s.enemy.speed, '45');
  assert.deepEqual(s.allies, [
    { characterId: 'son_goku', attack: '84', speed: '78' },
    { characterId: 'gyumao', attack: '94', speed: '15' },
    { characterId: '', attack: '0', speed: '0' }
  ]);
  assert.equal(s.turns[0].allyActions[0].skillName, 'ロキブランド');
  assert.equal(s.turns[0].allyActions[1].skillName, '鬼の気合入れ');
}

// 6) 基本行動「バフ」の主効果が次ターンの攻撃に反映される。
{
  const s = cloneDefaultState();
  s.allyCount = 1;
  s.enemy.maxHp = '160';
  s.enemy.speed = '10';
  s.allies[0].attack = '84';
  s.allies[0].speed = '100';
  s.turns[0].allyActions[0] = {
    kind: 'buff', skillMultiplier: '200', attackAttribute: 'none', hits: '1',
    buff: { type: 'atkBuff', target: 'self', mode: 'mult', value: '100', duration: '2' },
    effects: []
  };
  s.turns[0].enemyAction.enabled = false;
  s.turns.push(JSON.parse(JSON.stringify(s.turns[0])));
  s.turns[1].allyActions[0] = {
    kind: 'attack', skillMultiplier: '100', attackAttribute: 'none', hits: '1',
    buff: { type: 'atkBuff', target: 'self', mode: 'mult', value: '50', duration: '1' },
    effects: []
  };
  const r = simulateKillProbability(s);
  approx(r.killChance, 1);
}

// 7) 「同行動」は前回の同モンスターの具体的な行動を再利用する。
{
  const base = cloneDefaultState();
  base.allyCount = 1;
  base.enemy.maxHp = '250';
  base.enemy.speed = '10';
  base.allies[0].attack = '84';
  base.allies[0].speed = '100';
  base.turns[0].allyActions[0] = {
    kind: 'attack', skillMultiplier: '150', attackAttribute: 'none', hits: '1',
    buff: { type: 'atkBuff', target: 'self', mode: 'mult', value: '50', duration: '1' },
    effects: []
  };
  base.turns[0].enemyAction.enabled = false;
  base.turns.push(JSON.parse(JSON.stringify(base.turns[0])));

  const explicit = JSON.parse(JSON.stringify(base));
  const same = JSON.parse(JSON.stringify(base));
  same.turns[1].allyActions[0].kind = 'same';

  const a = simulateKillProbability(explicit);
  const b = simulateKillProbability(same);
  approx(a.killChance, b.killChance);
  assert.deepEqual([...a.hpDistribution.entries()], [...b.hpDistribution.entries()]);
}


// 8) 敵の防御アップは被ダメージ倍率として攻撃ダメージを減らす。
{
  const base = cloneDefaultState();
  base.allyCount = 1;
  base.enemy.maxHp = '90';
  base.enemy.speed = '100';
  base.allies[0].attack = '100';
  base.allies[0].speed = '10';
  base.turns[0].enemyAction = { enabled: true, effect: { type: 'enemyDefenseBuff', mode: 'mult', value: '50', duration: '1' } };
  base.turns[0].allyActions[0] = { kind: 'attack', skillMultiplier: '100', attackAttribute: 'none', hits: '1', effects: [] };
  const r = simulateKillProbability(base);
  approx(r.killChance, 0);
}

// 9) アンデッド補正：物理0.8、魔法1.2、それ以外1.0。
{
  const base = {
    attack: 100, skillMultiplier: 100, attackAttribute: 'none', attackAttribute2: 'none',
    defenderAttribute: 'fire', defenderRace: 'undead', defenseMods: [], hits: 1
  };
  const phys = attackDamageDistribution({ ...base, attackType: 'physical' });
  const magic = attackDamageDistribution({ ...base, attackType: 'magic' });
  const other = attackDamageDistribution({ ...base, attackType: 'other' });
  assert.equal(Math.min(...phys.keys()), 76);
  assert.equal(Math.max(...phys.keys()), 84);
  assert.equal(Math.min(...magic.keys()), 114);
  assert.equal(Math.max(...magic.keys()), 126);
  assert.equal(Math.min(...other.keys()), 95);
  assert.equal(Math.max(...other.keys()), 105);
}

// 10) 倍率レンジ・ヒット数レンジの確率合計は1になる。
{
  const dist = attackDamageDistribution({
    attack: 100,
    skillMultiplier: 80,
    skillMultiplierMin: 70,
    skillMultiplierMax: 90,
    skillMultiplierStep: 0.1,
    attackAttribute: 'wind',
    attackAttribute2: 'none',
    attackType: 'magic',
    defenderAttribute: 'fire',
    defenderRace: 'normal',
    defenseMods: [],
    hits: 3,
    hitsMin: 3,
    hitsMax: 5
  });
  approx([...dist.values()].reduce((a, b) => a + b, 0), 1, 1e-9);
}


// 11) 足ばらい・マーキングアローの防御ダウン定義をプリセットが保持する。
{
  const foot = SKILL_PRESET_BY_ID.get('foot_sweep');
  assert.equal(foot.attackType, 'physical');
  assert.deepEqual(foot.effects[0], {
    type: 'defenseDown', mode: 'mult', value: '20', duration: '99', expiry: 'sourceNextActionStart'
  });
  const marking = SKILL_PRESET_BY_ID.get('marking_arrow');
  assert.equal(marking.attackType, 'physical');
  assert.deepEqual(marking.effects[0], {
    type: 'defenseDown', mode: 'mult', value: '40', duration: '99', expiry: 'sourceNextActionEnd'
  });
}


// 12) 「主要技」はバトル入手チャート末尾のコマンドサンプル一覧と明示追加技だけ。
// キャラクタープリセット専用技は自動入力には使うが、主要技メニューには出さない。
{
  const majorIds = new Set(SKILL_PRESETS.filter(x => x.major === true).map(x => x.id));
  for (const id of [
    'loki_brand', 'oni_spirit', 'sea_king_gaze', 'spirit_blessing', 'growl', 'sun_hymn',
    'sword_dance', 'name_announcement', 'fire2', 'fire3', 'aqua2', 'aqua3', 'wind2',
    'marking_arrow', 'self_destruct', 'bubble_grand', 'rengeki',
    'heat_wave', 'ice_storm_strike', 'false_reflect_wall',
    // ユーザー指定の追加枠
    'epidemic_glass', 'poison_bite', 'melting_breath', 'suck_dry'
  ]) assert.ok(majorIds.has(id), `${id} should be a major skill`);

  for (const id of [
    'foot_sweep', 'attack_bang', 'dragon_tail', 'aqua_breath', 'shining_breath',
    'fire1', 'ice1', 'thunder1', 'meteor', 'purifying_flame', 'shiden', 'critical_hit',
    'ninja_thunder'
  ]) assert.equal(majorIds.has(id), false, `${id} must stay character-preset-only`);
}


// 12b) ユーザー指定で復帰した追加主要技の内容を保持する。
{
  const suck = SKILL_PRESET_BY_ID.get('suck_dry');
  assert.equal(suck.major, true);
  assert.equal(suck.kind, 'buff');
  assert.deepEqual(suck.buff, { type: 'atkBuff', target: 'self', mode: 'add', value: '15', duration: '3' });

  const bite = SKILL_PRESET_BY_ID.get('poison_bite');
  assert.deepEqual([bite.skillMultiplier, bite.attackAttribute, bite.attackType], ['140', 'poison', 'physical']);
  assert.deepEqual(bite.effects, [{ type: 'poison' }]);

  const melt = SKILL_PRESET_BY_ID.get('melting_breath');
  assert.deepEqual([melt.skillMultiplier, melt.deadlyPoisonSkillMultiplier, melt.attackType], ['60', '120', 'other']);
  assert.deepEqual(melt.effects, [{ type: 'poisonToDeadly' }]);
}

// 13) ファイア!! / アクア!! だけは例外として !!! 版も主要技に持つ。
{
  const fire2 = SKILL_PRESET_BY_ID.get('fire2');
  const fire3 = SKILL_PRESET_BY_ID.get('fire3');
  const aqua2 = SKILL_PRESET_BY_ID.get('aqua2');
  const aqua3 = SKILL_PRESET_BY_ID.get('aqua3');
  const wind2 = SKILL_PRESET_BY_ID.get('wind2');
  assert.deepEqual([fire2.skillName, fire2.skillMultiplier, fire2.attackType], ['ファイア!!', '150', 'magic']);
  assert.deepEqual([fire3.skillName, fire3.skillMultiplier, fire3.attackType], ['ファイア!!!', '200', 'magic']);
  assert.deepEqual([aqua2.skillName, aqua2.skillMultiplier, aqua2.attackType], ['アクア!!', '150', 'magic']);
  assert.deepEqual([aqua3.skillName, aqua3.skillMultiplier, aqua3.attackType], ['アクア!!!', '200', 'magic']);
  assert.deepEqual([wind2.skillName, wind2.skillMultiplier, wind2.attackType], ['ウィンド!!', '150', 'magic']);
  assert.equal(SKILL_PRESETS.some(x => x.skillName === 'ウィンド!!!' && x.major === true), false);
}

// 14) どくつぶしは敵がすでに毒・猛毒なら技倍率105%を使う。
{
  const poisonCrush = SKILL_PRESET_BY_ID.get('poison_crush');
  assert.equal(poisonCrush.skillMultiplier, '80');
  assert.equal(poisonCrush.poisonedSkillMultiplier, '105');
}


// 15) バフ/デバフの割合入力は「効果量」。アップ20→×120%、ダウン20→×80%。
{
  const s = cloneDefaultState();
  s.allyCount = 1;
  s.enemy.maxHp = '115';
  s.enemy.speed = '10';
  s.allies[0].attack = '100';
  s.allies[0].speed = '100';
  s.turns[0].allyActions[0] = {
    kind: 'buff', skillMultiplier: '100', attackAttribute: 'none', hits: '1',
    buff: { type: 'atkBuff', target: ['ally1'], mode: 'mult', value: '20', duration: '2' }, effects: []
  };
  s.turns[0].enemyAction.enabled = false;
  s.turns.push(JSON.parse(JSON.stringify(s.turns[0])));
  s.turns[1].allyActions[0] = { kind: 'attack', skillMultiplier: '100', attackAttribute: 'none', hits: '1', effects: [] };
  const r = simulateKillProbability(s);
  assert.ok(r.killChance > 0);
}

// 16) バフ対象は配列で複数指定できる。
{
  const s = cloneDefaultState();
  s.allyCount = 2;
  s.enemy.maxHp = '180';
  s.enemy.speed = '10';
  s.allies[0].attack = '1'; s.allies[0].speed = '100';
  s.allies[1].attack = '100'; s.allies[1].speed = '90';
  s.turns[0].allyActions[0] = { kind: 'buff', buff: { type: 'atkBuff', target: ['ally1','ally2'], mode: 'mult', value: '100', duration: '2' }, effects: [] };
  s.turns[0].allyActions[1] = { kind: 'skip', effects: [] };
  s.turns[0].enemyAction.enabled = false;
  s.turns.push(JSON.parse(JSON.stringify(s.turns[0])));
  s.turns[1].allyActions[0] = { kind: 'skip', effects: [] };
  s.turns[1].allyActions[1] = { kind: 'attack', skillMultiplier: '100', attackAttribute: 'none', hits: '1', effects: [] };
  const r = simulateKillProbability(s);
  assert.ok(r.killChance > 0);
}

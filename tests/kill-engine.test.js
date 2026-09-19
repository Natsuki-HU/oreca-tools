import assert from 'node:assert/strict';
import { cloneDefaultState, simulateKillProbability } from '../kill/engine.js';

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
    buff: { type: 'atkBuff', target: 'self', mode: 'mult', value: '200', duration: '2' },
    effects: []
  };
  s.turns[0].enemyAction.enabled = false;
  s.turns.push(JSON.parse(JSON.stringify(s.turns[0])));
  s.turns[1].allyActions[0] = {
    kind: 'attack', skillMultiplier: '100', attackAttribute: 'none', hits: '1',
    buff: { type: 'atkBuff', target: 'self', mode: 'mult', value: '150', duration: '1' },
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
    buff: { type: 'atkBuff', target: 'self', mode: 'mult', value: '150', duration: '1' },
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

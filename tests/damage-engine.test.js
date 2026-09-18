import assert from 'node:assert/strict';
import { calculateDamage, cloneDefaultState } from '../damage/engine.js';

function neutralState() {
  const state = cloneDefaultState();
  state.attackPower = '100';
  state.attackMods = [];
  state.attributeMultipliers = ['100'];
  state.skillMultiplier = '100';
  state.hits = '1';
  state.undeadMultiplier = '100';
  state.defenseMods = [];
  state.reductions = [];
  return state;
}

function run(name, edit, expected) {
  const state = neutralState();
  edit(state);
  const got = calculateDamage(state);
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(got[key], value, `${name}: ${key}`);
  }
  console.log(`✓ ${name}`);
}

run('基準100・乱数±5%', () => {}, {
  minHit: 95,
  maxHit: 105,
  totalMin: 95,
  totalMax: 105
});

run('101の最低乱数は95ではなく96', state => {
  state.attackPower = '101';
}, {
  minHit: 96,
  maxHit: 106
});

run('複合属性は順次切り捨て', state => {
  state.attackPower = '101';
  state.attributeMultipliers = ['150', '105'];
}, {
  preRandom: 158,
  minHit: 151,
  maxHit: 165
});

run('攻撃補正は上から順に適用', state => {
  state.attackMods = [
    { type: 'add', value: '20' },
    { type: 'mult', value: '150' }
  ];
}, {
  atk: 180,
  preRandom: 180
});

run('防御補正→ダメージ軽減', state => {
  state.defenseMods = ['80'];
  state.reductions = ['25'];
}, {
  minHit: 57,
  maxHit: 63
});

run('ヒット数は1ヒット結果に最後に掛ける', state => {
  state.hits = '5';
}, {
  totalMin: 475,
  totalMax: 525
});

run('標準コア999上限後に防御デバフ', state => {
  state.attackPower = '999';
  state.skillMultiplier = '500';
  state.defenseMods = ['150'];
}, {
  minHit: 1498,
  maxHit: 1498
});

{
  const state = cloneDefaultState();
  assert.equal(state.attackPower, '84', 'default attackPower');
  assert.equal(state.skillMultiplier, '200', 'default skillMultiplier');
  assert.deepEqual(state.attackMods, [{ type: 'mult', value: '100' }], 'default attackMods');
  assert.deepEqual(state.defenseMods, ['100'], 'default defenseMods');
  assert.deepEqual(state.reductions, ['0'], 'default reductions');
  console.log('✓ v0.2.3 default state');
}

console.log('All damage engine tests passed.');

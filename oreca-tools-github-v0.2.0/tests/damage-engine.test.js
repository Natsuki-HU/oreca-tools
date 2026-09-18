import assert from 'node:assert/strict';
import { calculateDamage, cloneDefaultState } from '../damage/engine.js';

function run(name, edit, expected) {
  const state = cloneDefaultState();
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

console.log('All damage engine tests passed.');

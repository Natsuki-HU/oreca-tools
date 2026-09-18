import { APP_VERSION } from '../assets/version.js';
import {
  ALLY_EFFECT_TYPES,
  ATTACK_ATTRIBUTES,
  DEFENDER_ATTRIBUTES,
  ENEMY_EFFECT_TYPES,
  cloneDefaultState,
  simulateKillProbability
} from './engine.js';

const STORAGE_KEY = 'oreca-tools.kill.v0.3';
const root = document.getElementById('killRoot');
const resetButton = document.getElementById('resetButton');

for (const el of document.querySelectorAll('[data-app-version]')) el.textContent = APP_VERSION;

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
  state.allyCount = Math.min(3, Math.max(1, Number(saved.allyCount) || fallback.allyCount));
  state.allies = fallback.allies.map((ally, i) => ({ ...ally, ...(saved.allies?.[i] ?? {}) }));
  state.turns = Array.isArray(saved.turns) && saved.turns.length ? saved.turns.slice(0, 12) : fallback.turns;

  for (const turn of state.turns) {
    turn.allyActions = Array.from({ length: 3 }, (_, i) => ({
      kind: turn.allyActions?.[i]?.kind ?? 'skip',
      skillMultiplier: turn.allyActions?.[i]?.skillMultiplier ?? '200',
      attackAttribute: turn.allyActions?.[i]?.attackAttribute ?? 'none',
      hits: turn.allyActions?.[i]?.hits ?? '1',
      effects: Array.isArray(turn.allyActions?.[i]?.effects) ? turn.allyActions[i].effects : []
    }));
    turn.enemyAction = {
      enabled: turn.enemyAction?.enabled !== false,
      kind: turn.enemyAction?.kind ?? 'skip',
      effects: Array.isArray(turn.enemyAction?.effects) ? turn.enemyAction.effects : []
    };
  }
  return state;
}

function loadState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return cloneDefaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function optionsHtml(items, selected) {
  return items.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
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
    ? `<select class="effect-target" aria-label="対象">${targetOptions(effect.target ?? (side === 'enemy' ? 'all' : 'self'))}</select>`
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

function actionCardHtml(action, turnIndex, allyIndex) {
  const actorKey = `ally${allyIndex}`;
  return `
    <div class="action-card" data-turn-index="${turnIndex}" data-actor-key="${actorKey}">
      <div class="action-card-head">
        <strong>キャラ${allyIndex + 1}</strong>
        <select class="action-kind" aria-label="キャラ${allyIndex + 1}の基本行動">
          <option value="attack" ${action.kind === 'attack' ? 'selected' : ''}>攻撃</option>
          <option value="buff" ${action.kind === 'buff' ? 'selected' : ''}>バフ</option>
          <option value="skip" ${action.kind === 'skip' ? 'selected' : ''}>行動スキップ</option>
        </select>
      </div>
      ${action.kind === 'attack' ? `
        <div class="action-input-grid">
          <label class="mini-field"><span>技倍率</span><div class="input-with-suffix"><input class="skill-multiplier" type="number" inputmode="decimal" step="0.1" min="0" value="${escapeHtml(action.skillMultiplier)}"><span class="suffix">%</span></div></label>
          <label class="mini-field"><span>技属性</span><select class="attack-attribute">${optionsHtml(ATTACK_ATTRIBUTES, action.attackAttribute)}</select></label>
          <label class="mini-field"><span>ヒット数</span><input class="hit-count" type="number" inputmode="numeric" step="1" min="1" max="50" value="${escapeHtml(action.hits)}"></label>
        </div>` : ''}
      ${action.kind !== 'skip' ? `
        <div class="effects-block">
          <div class="sub-heading"><span>追加効果</span><button type="button" class="mini-add add-effect" data-side="ally">＋追加</button></div>
          <div class="effects-list">${effectsHtml(action.effects ?? [], 'ally', turnIndex, actorKey)}</div>
        </div>` : ''}
    </div>`;
}

function enemyActionHtml(action, turnIndex) {
  const actorKey = 'enemy';
  return `
    <div class="action-card enemy-action-card" data-turn-index="${turnIndex}" data-actor-key="enemy">
      <div class="action-card-head enemy-head">
        <strong>敵</strong>
        <label class="toggle-line"><input class="enemy-enabled" type="checkbox" ${action.enabled ? 'checked' : ''}> このターン行動する</label>
      </div>
      <div class="enemy-action-body ${action.enabled ? '' : 'is-disabled'}">
        <label class="mini-field"><span>基本行動</span>
          <select class="action-kind enemy-kind" ${action.enabled ? '' : 'disabled'}>
            <option value="attack" ${action.kind === 'attack' ? 'selected' : ''}>攻撃</option>
            <option value="buff" ${action.kind === 'buff' ? 'selected' : ''}>バフ</option>
            <option value="skip" ${action.kind === 'skip' ? 'selected' : ''}>行動スキップ</option>
          </select>
        </label>
        <div class="effects-block">
          <div class="sub-heading"><span>敵の追加効果</span><button type="button" class="mini-add add-effect" data-side="enemy" ${action.enabled && action.kind !== 'skip' ? '' : 'disabled'}>＋追加</button></div>
          <div class="effects-list">${effectsHtml(action.effects ?? [], 'enemy', turnIndex, actorKey)}</div>
        </div>
        <p class="inline-note">敵の攻撃ダメージそのものは未計算です。敵の追加効果だけを撃破確率に反映します。</p>
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
        <label class="field"><span class="field-label">属性</span><select id="enemyAttribute">${optionsHtml(DEFENDER_ATTRIBUTES, state.enemy.attribute)}</select></label>
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
    state.allies[i].attack = card.querySelector('.ally-attack')?.value ?? state.allies[i].attack;
    state.allies[i].speed = card.querySelector('.ally-speed')?.value ?? state.allies[i].speed;
  });

  root.querySelectorAll('.action-card').forEach(card => {
    const turnIndex = Number(card.dataset.turnIndex);
    const actorKey = card.dataset.actorKey;
    if (!state.turns[turnIndex]) return;

    if (actorKey === 'enemy') {
      const action = state.turns[turnIndex].enemyAction;
      action.enabled = card.querySelector('.enemy-enabled')?.checked ?? action.enabled;
      action.kind = card.querySelector('.action-kind')?.value ?? action.kind;
      action.effects = collectEffects(card);
    } else {
      const allyIndex = Number(actorKey.replace('ally', ''));
      const action = state.turns[turnIndex].allyActions[allyIndex];
      action.kind = card.querySelector('.action-kind')?.value ?? action.kind;
      action.skillMultiplier = card.querySelector('.skill-multiplier')?.value ?? action.skillMultiplier;
      action.attackAttribute = card.querySelector('.attack-attribute')?.value ?? action.attackAttribute;
      action.hits = card.querySelector('.hit-count')?.value ?? action.hits;
      action.effects = collectEffects(card);
    }
  });
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
  collectStateFromDom();

  // 表示項目が変わる選択は全体を再描画。
  if (
    event.target.id === 'allyCount' ||
    event.target.classList.contains('action-kind') ||
    event.target.classList.contains('enemy-enabled') ||
    event.target.classList.contains('effect-type') ||
    event.target.classList.contains('effect-mode')
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
  state = cloneDefaultState();
  saveState();
  render();
});

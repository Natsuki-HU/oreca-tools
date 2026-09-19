import { APP_VERSION } from '../assets/version.js';
import { calculateDamage, cloneDefaultState, LIMITS } from './engine.js';

const STORAGE_KEY = 'oreca-tools.damage.v0.3';
const LEGACY_STORAGE_KEY = 'oreca-tools.damage.v0.2';
const root = document.getElementById('toolRoot');
const resetButton = document.getElementById('resetButton');

for (const el of document.querySelectorAll('[data-app-version]')) el.textContent = APP_VERSION;

function normalizeDefenseMod(mod) {
  if (mod && typeof mod === 'object' && 'value' in mod) {
    return { sign: mod.sign === '-' ? '-' : '+', value: String(mod.value ?? '0') };
  }
  const multiplier = Number(mod);
  if (!Number.isFinite(multiplier)) return { sign: '+', value: '0' };
  return multiplier <= 100
    ? { sign: '+', value: String(100 - multiplier) }
    : { sign: '-', value: String(multiplier - 100) };
}

function loadState() {
  const fallback = cloneDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (!saved || typeof saved !== 'object') return fallback;
    return {
      ...fallback,
      ...saved,
      attackMods: Array.isArray(saved.attackMods) ? saved.attackMods.slice(0, LIMITS.attackMods) : [],
      attributeMultipliers: Array.isArray(saved.attributeMultipliers) && saved.attributeMultipliers.length
        ? saved.attributeMultipliers.slice(0, LIMITS.attributeMultipliers)
        : ['100'],
      defenseMods: Array.isArray(saved.defenseMods) ? saved.defenseMods.slice(0, LIMITS.defenseMods).map(normalizeDefenseMod) : [],
      reductions: Array.isArray(saved.reductions) ? saved.reductions.slice(0, LIMITS.reductions) : []
    };
  } catch {
    return fallback;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function inputRowHtml({ id, label, value, suffix = '', step = '0.1', min }) {
  return `
    <label class="field" for="${id}">
      <span class="field-label">${label}</span>
      <div class="input-with-suffix">
        <input id="${id}" inputmode="decimal" type="number" step="${step}" ${min !== undefined ? `min="${min}"` : ''} value="${escapeHtml(value)}" />
        ${suffix ? `<span class="suffix">${suffix}</span>` : ''}
      </div>
    </label>`;
}

function quickButtonsHtml(values, attrs, formatter = value => `${value}%`) {
  return `
    <div class="quick-values row-quick-values">
      ${values.map(value => `<button type="button" class="quick-value" ${attrs(value)}>${formatter(value)}</button>`).join('')}
    </div>`;
}

function renderAttackMods(state) {
  return state.attackMods.map((mod, index) => {
    const values = mod.type === 'add'
      ? [15, 25, 30, 50, 125, 150]
      : [110, 120, 150, 200];
    const quick = quickButtonsHtml(
      values,
      value => `data-quick-attack-index="${index}" data-quick-value="${value}"`,
      value => mod.type === 'add' ? `+${value}` : `${value}%`
    );

    return `
      <div class="dynamic-item">
        <div class="dynamic-row" data-kind="attackMods" data-index="${index}">
          <span class="row-number">${index + 1}</span>
          <select class="compact-select mod-type" aria-label="攻撃補正${index + 1}の種類">
            <option value="mult" ${mod.type !== 'add' ? 'selected' : ''}>乗算</option>
            <option value="add" ${mod.type === 'add' ? 'selected' : ''}>加算</option>
          </select>
          <div class="input-with-suffix compact-input">
            <input class="mod-value" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(mod.value)}" />
            <span class="suffix">${mod.type === 'add' ? 'ATK' : '%'}</span>
          </div>
          <button class="icon-button remove-row" type="button" aria-label="削除">×</button>
        </div>
        ${quick}
      </div>`;
  }).join('');
}

function renderSimpleRows(values, kind, suffix, labelPrefix, quickValues = []) {
  return values.map((value, index) => {
    const quick = quickValues.length
      ? quickButtonsHtml(
          quickValues,
          option => `data-quick-kind="${kind}" data-quick-index="${index}" data-quick-value="${option}"`,
          option => kind === 'reductions' ? `${option}%` : `${option}%`
        )
      : '';

    return `
      <div class="dynamic-item">
        <div class="dynamic-row simple" data-kind="${kind}" data-index="${index}">
          <span class="row-number">${index + 1}</span>
          <div class="input-with-suffix compact-input grow">
            <input class="simple-value" aria-label="${labelPrefix}${index + 1}" inputmode="decimal" type="number" step="0.1" value="${escapeHtml(value)}" />
            <span class="suffix">${suffix}</span>
          </div>
          ${(kind === 'attributeMultipliers' && index === 0)
            ? '<span class="row-placeholder"></span>'
            : '<button class="icon-button remove-row" type="button" aria-label="削除">×</button>'}
        </div>
        ${quick}
      </div>`;
  }).join('');
}


function renderDefenseMods(state) {
  const quickValues = [
    ['+', '60'], ['+', '50'], ['+', '40'], ['+', '30'], ['+', '20'],
    ['+', '15'], ['+', '10'], ['-', '15'], ['-', '20'], ['-', '40']
  ];
  return state.defenseMods.map((mod, index) => {
    const sign = mod.sign === '-' ? '-' : '+';
    const quick = `
      <div class="quick-values row-quick-values">
        ${quickValues.map(([qSign, qValue]) => `<button type="button" class="quick-value" data-quick-defense-index="${index}" data-quick-sign="${qSign}" data-quick-value="${qValue}">${qSign}${qValue}%</button>`).join('')}
      </div>`;
    return `
      <div class="dynamic-item">
        <div class="dynamic-row" data-kind="defenseMods" data-index="${index}">
          <span class="row-number">${index + 1}</span>
          <select class="compact-select defense-sign" aria-label="防御補正${index + 1}の符号">
            <option value="+" ${sign === '+' ? 'selected' : ''}>＋</option>
            <option value="-" ${sign === '-' ? 'selected' : ''}>－</option>
          </select>
          <div class="input-with-suffix compact-input grow">
            <input class="defense-value" aria-label="防御補正${index + 1}の効果量" inputmode="decimal" type="number" min="0" step="0.1" value="${escapeHtml(mod.value)}" />
            <span class="suffix">%</span>
          </div>
          <button class="icon-button remove-row" type="button" aria-label="削除">×</button>
        </div>
        ${quick}
      </div>`;
  }).join('');
}

function render(state, errorMessage = '') {
  let result;
  let error = errorMessage;
  if (!error) {
    try {
      result = calculateDamage(state);
    } catch (e) {
      error = e.message;
    }
  }

  root.innerHTML = `
    <section class="result-panel ${error ? 'has-error' : ''}">
      <div class="result-card">
        <span class="result-label">最低ダメージ</span>
        <strong id="minDamage" class="result-number">${error ? '—' : result.totalMin.toLocaleString('ja-JP')}</strong>
      </div>
      <div class="result-card">
        <span class="result-label">最高ダメージ</span>
        <strong id="maxDamage" class="result-number">${error ? '—' : result.totalMax.toLocaleString('ja-JP')}</strong>
      </div>
      <div class="result-meta">${error
        ? `<span class="error-text">${escapeHtml(error)}</span>`
        : `1ヒット: ${result.minHit} ～ ${result.maxHit}　／　${result.hits}ヒット`}</div>
    </section>

    <section class="panel">
      <h2>基本入力</h2>
      <div class="field-grid">
        ${inputRowHtml({ id: 'attackPower', label: '攻撃力', value: state.attackPower, step: '1', min: 0 })}
        ${inputRowHtml({ id: 'skillMultiplier', label: '技倍率', value: state.skillMultiplier, suffix: '%', step: '0.1', min: 0 })}
        ${inputRowHtml({ id: 'hits', label: 'ヒット数', value: state.hits, step: '1', min: 1 })}
        <label class="field" for="undeadMultiplier">
          <span class="field-label">アンデッド補正</span>
          <select id="undeadMultiplier">
            <option value="100" ${state.undeadMultiplier === '100' ? 'selected' : ''}>なし / ブレス（100%）</option>
            <option value="80" ${state.undeadMultiplier === '80' ? 'selected' : ''}>物理（80%）</option>
            <option value="120" ${state.undeadMultiplier === '120' ? 'selected' : ''}>魔法（120%）</option>
          </select>
        </label>
      </div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>攻撃バフ・デバフ</h2>
          <p>上から順に適用します。乗算は100%=変化なし。加算はATKへの直接加算です。</p>
        </div>
        <button class="add-button" type="button" data-add="attackMods" ${state.attackMods.length >= LIMITS.attackMods ? 'disabled' : ''}>＋ 追加</button>
      </div>
      <div class="dynamic-list">
        ${state.attackMods.length ? renderAttackMods(state) : '<div class="empty-note">補正なし</div>'}
      </div>
      <div class="limit-note">最大10個</div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>属性倍率</h2>
          <p>複合属性は1個目→2個目の順に個別計算します。</p>
        </div>
        <button class="add-button" type="button" data-add="attributeMultipliers" ${state.attributeMultipliers.length >= LIMITS.attributeMultipliers ? 'disabled' : ''}>＋ 2個目</button>
      </div>
      <div class="dynamic-list">
        ${renderSimpleRows(state.attributeMultipliers, 'attributeMultipliers', '%', '属性倍率', [80,90,100,105,107,110,140,150,180,190])}
      </div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>防御バフ・デバフ</h2>
          <p>＋は防御アップ、－は防御ダウンです。効果量だけ入力します。＋20%なら被ダメージ20%減、－20%なら20%増です。</p>
        </div>
        <button class="add-button" type="button" data-add="defenseMods" ${state.defenseMods.length >= LIMITS.defenseMods ? 'disabled' : ''}>＋ 追加</button>
      </div>
      <div class="dynamic-list">
        ${state.defenseMods.length ? renderDefenseMods(state) : '<div class="empty-note">補正なし</div>'}
      </div>
      <div class="limit-note">最大10個</div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>ダメージ軽減</h2>
          <p>防御バフとは別枠です。20と入力すると20%軽減として計算します。</p>
        </div>
        <button class="add-button" type="button" data-add="reductions" ${state.reductions.length >= LIMITS.reductions ? 'disabled' : ''}>＋ 追加</button>
      </div>
      <div class="dynamic-list">
        ${state.reductions.length ? renderSimpleRows(state.reductions, 'reductions', '%軽減', 'ダメージ軽減', [40,50,55,60,70]) : '<div class="empty-note">軽減なし</div>'}
      </div>
      <div class="limit-note">最大5個</div>
    </section>

    <details class="panel details-panel">
      <summary>計算方式・内訳</summary>
      <div class="method-note">
        <p>現在の順序: 攻撃力補正 → 技倍率 → 属性倍率（最大2個） → アンデッド補正 → ±5%乱数 → 標準1ヒット999上限 → 防御補正 → ダメージ軽減 → ヒット数。</p>
        <p>整数化は各段階で0方向。最低乱数は <code>D + trunc(D×-50/1000)</code>、最高乱数は <code>D + trunc(D×50/1000)</code>。</p>
      </div>
      ${error ? '' : `
        <div class="trace-grid">
          <div><h3>最低側</h3><ol>${result.minTrace.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ol></div>
          <div><h3>最高側</h3><ol>${result.maxTrace.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ol></div>
        </div>`}
    </details>
  `;
}

function collectStateFromDom(state) {
  state.attackPower = root.querySelector('#attackPower')?.value ?? state.attackPower;
  state.skillMultiplier = root.querySelector('#skillMultiplier')?.value ?? state.skillMultiplier;
  state.hits = root.querySelector('#hits')?.value ?? state.hits;
  state.undeadMultiplier = root.querySelector('#undeadMultiplier')?.value ?? state.undeadMultiplier;

  state.attackMods = [...root.querySelectorAll('[data-kind="attackMods"]')].map(row => ({
    type: row.querySelector('.mod-type').value,
    value: row.querySelector('.mod-value').value
  }));

  for (const kind of ['attributeMultipliers', 'reductions']) {
    state[kind] = [...root.querySelectorAll(`[data-kind="${kind}"]`)].map(row => row.querySelector('.simple-value').value);
  }
  state.defenseMods = [...root.querySelectorAll('[data-kind="defenseMods"]')].map(row => ({
    sign: row.querySelector('.defense-sign')?.value === '-' ? '-' : '+',
    value: row.querySelector('.defense-value')?.value ?? '0'
  }));

  if (!state.attributeMultipliers.length) state.attributeMultipliers = ['100'];
  return state;
}

let state = loadState();

function rerender() {
  saveState(state);
  render(state);
}

render(state);

root.addEventListener('input', event => {
  if (!(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLSelectElement)) return;
  state = collectStateFromDom(state);
  saveState(state);

  try {
    const result = calculateDamage(state);
    root.querySelector('#minDamage').textContent = result.totalMin.toLocaleString('ja-JP');
    root.querySelector('#maxDamage').textContent = result.totalMax.toLocaleString('ja-JP');
    root.querySelector('.result-meta').textContent = `1ヒット: ${result.minHit} ～ ${result.maxHit}　／　${result.hits}ヒット`;
    root.querySelector('.result-panel')?.classList.remove('has-error');
  } catch (e) {
    root.querySelector('#minDamage').textContent = '—';
    root.querySelector('#maxDamage').textContent = '—';
    root.querySelector('.result-meta').innerHTML = `<span class="error-text">${escapeHtml(e.message)}</span>`;
    root.querySelector('.result-panel')?.classList.add('has-error');
  }
});

root.addEventListener('change', event => {
  if (event.target.classList.contains('mod-type')) {
    const row = event.target.closest('[data-kind="attackMods"]');
    const index = Number(row?.dataset.index);
    state = collectStateFromDom(state);

    // 種類を切り替えたときは、その種類の標準値を入れる。
    // 乗算: 100%（変化なし） / 加算: +50 ATK
    if (Number.isInteger(index) && state.attackMods[index]) {
      state.attackMods[index].value = event.target.value === 'add' ? '50' : '100';
    }
    rerender();
  }
});

root.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;

  state = collectStateFromDom(state);

  const addKind = button.dataset.add;
  if (addKind) {
    if (addKind === 'attackMods' && state.attackMods.length < LIMITS.attackMods) {
      state.attackMods.push({ type: 'mult', value: '100' });
    } else if (addKind === 'attributeMultipliers' && state.attributeMultipliers.length < LIMITS.attributeMultipliers) {
      state.attributeMultipliers.push('100');
    } else if (addKind === 'defenseMods' && state.defenseMods.length < LIMITS.defenseMods) {
      state.defenseMods.push({ sign: '+', value: '0' });
    } else if (addKind === 'reductions' && state.reductions.length < LIMITS.reductions) {
      state.reductions.push('0');
    }
    rerender();
    return;
  }

  if (button.classList.contains('remove-row')) {
    const row = button.closest('[data-kind]');
    const kind = row.dataset.kind;
    const index = Number(row.dataset.index);
    if (kind === 'attributeMultipliers') {
      if (index > 0) state.attributeMultipliers.splice(index, 1);
    } else if (Array.isArray(state[kind])) {
      state[kind].splice(index, 1);
    }
    rerender();
    return;
  }

  if (button.dataset.quickAttackIndex !== undefined && button.dataset.quickValue !== undefined) {
    const index = Number(button.dataset.quickAttackIndex);
    if (Number.isInteger(index) && state.attackMods[index]) {
      state.attackMods[index].value = button.dataset.quickValue;
      rerender();
    }
    return;
  }

  if (button.dataset.quickDefenseIndex !== undefined && button.dataset.quickValue !== undefined) {
    const index = Number(button.dataset.quickDefenseIndex);
    if (Number.isInteger(index) && state.defenseMods[index]) {
      state.defenseMods[index] = {
        sign: button.dataset.quickSign === '-' ? '-' : '+',
        value: button.dataset.quickValue
      };
      rerender();
    }
    return;
  }

  if (button.dataset.quickKind && button.dataset.quickIndex !== undefined && button.dataset.quickValue !== undefined) {
    const kind = button.dataset.quickKind;
    const index = Number(button.dataset.quickIndex);
    if (Array.isArray(state[kind]) && Number.isInteger(index) && state[kind][index] !== undefined) {
      state[kind][index] = button.dataset.quickValue;
      rerender();
    }
  }
});

resetButton.addEventListener('click', () => {
  state = cloneDefaultState();
  saveState(state);
  render(state);
});

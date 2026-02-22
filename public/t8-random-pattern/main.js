// @ts-check

// ── DOM 要素 ──

const midiErrorEl = /** @type {HTMLDivElement} */ (
  document.getElementById('midi-error')
);
const runtimeErrorEl = /** @type {HTMLDivElement} */ (
  document.getElementById('runtime-error')
);
const runtimeErrorMsg = /** @type {HTMLParagraphElement} */ (
  document.getElementById('runtime-error-msg')
);
const deviceSelect = /** @type {HTMLSelectElement} */ (
  document.getElementById('midi-device')
);
const channelSelect = /** @type {HTMLSelectElement} */ (
  document.getElementById('midi-channel')
);
const bpmInput = /** @type {HTMLInputElement} */ (
  document.getElementById('bpm')
);
const intervalDisplay = /** @type {HTMLSpanElement} */ (
  document.getElementById('interval-display')
);
const patternGrid = /** @type {HTMLDivElement} */ (
  document.getElementById('pattern-grid')
);
const patternAllBtn = /** @type {HTMLButtonElement} */ (
  document.getElementById('pattern-all')
);
const patternNoneBtn = /** @type {HTMLButtonElement} */ (
  document.getElementById('pattern-none')
);
const nowPlayingEl = /** @type {HTMLDivElement} */ (
  document.getElementById('now-playing')
);
const progressFill = /** @type {HTMLDivElement} */ (
  document.getElementById('progress-fill')
);
const startStopBtn = /** @type {HTMLButtonElement} */ (
  document.getElementById('start-stop')
);
const cancelBtn = /** @type {HTMLButtonElement} */ (
  document.getElementById('cancel-btn')
);
const resyncBtn = /** @type {HTMLButtonElement} */ (
  document.getElementById('resync-btn')
);
const tapHint = /** @type {HTMLParagraphElement} */ (
  document.getElementById('tap-hint')
);

// ── 状態 ──

/** @type {MIDIAccess | null} */
let midiAccess = null;

/** @type {MIDIOutput | null} */
let selectedOutput = null;

let currentBank = 1;
let currentSteps = 16;

/**
 * 各Bankのパターン選択状態
 * @type {boolean[][]}
 */
const bankPatterns = [
  new Array(16).fill(true),
  new Array(16).fill(true),
  new Array(16).fill(true),
  new Array(16).fill(true),
];

/** @type {'idle' | 'waiting' | 'running'} */
let engineState = 'idle';

/** @type {number | null} */
let timerId = null;

/** @type {number | null} */
let animFrameId = null;

let lastSendTime = 0;
let intervalMs = 2000;
let expected = 0;

/** @type {number | null} */
let runtimeErrorTimerId = null;

// ── 初期化 ──

initPatternGrid();
updateIntervalDisplay();
initMidi();

// ── MIDI 接続管理 ──

async function initMidi() {
  if (!navigator.requestMIDIAccess) {
    showMidiError();
    return;
  }

  try {
    midiAccess = await navigator.requestMIDIAccess();
    midiAccess.onstatechange = onMidiStateChange;
    updateDeviceList();
  } catch {
    showMidiError();
  }
}

function showMidiError() {
  midiErrorEl.hidden = false;
  deviceSelect.disabled = true;
  startStopBtn.disabled = true;
  // フォームを無効化
  bpmInput.disabled = true;
  channelSelect.disabled = true;
  for (const btn of document.querySelectorAll(
    '.step-btn, .bank-btn, .pattern-cell, .pattern-actions button, #cancel-btn, #resync-btn',
  )) {
    /** @type {HTMLButtonElement} */ (btn).disabled = true;
  }
}

function onMidiStateChange() {
  // 選択中のデバイスが切断された場合、先に停止してからリスト更新
  if (selectedOutput && selectedOutput.state === 'disconnected') {
    if (engineState !== 'idle') {
      transitionToIdle();
    }
    selectedOutput = null;
  }

  updateDeviceList();
}

function updateDeviceList() {
  if (!midiAccess) return;

  // 接続済み（connected）の Output のみ対象
  const outputs = Array.from(midiAccess.outputs.values()).filter(
    (o) => o.state === 'connected',
  );
  const prevValue = deviceSelect.value;

  deviceSelect.innerHTML = '';

  if (outputs.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '-- デバイスなし --';
    deviceSelect.appendChild(opt);
    deviceSelect.disabled = true;
    selectedOutput = null;
    updateUI();
    return;
  }

  for (const output of outputs) {
    const opt = document.createElement('option');
    opt.value = output.id;
    opt.textContent = output.name || output.id;
    deviceSelect.appendChild(opt);
  }

  deviceSelect.disabled = false;

  // 以前の選択を復元、なければ最初のデバイスを選択
  const matchingOption = Array.from(deviceSelect.options).find(
    (o) => o.value === prevValue,
  );
  if (matchingOption) {
    deviceSelect.value = prevValue;
  }

  selectDevice();
}

function selectDevice() {
  if (!midiAccess || !deviceSelect.value) {
    selectedOutput = null;
    updateUI();
    return;
  }
  const output = midiAccess.outputs.get(deviceSelect.value) || null;
  // 切断済みポートは選択しない
  selectedOutput = output && output.state === 'connected' ? output : null;
  updateUI();
}

// ユーザー操作でデバイスを変更した場合は安全のため停止
deviceSelect.addEventListener('change', () => {
  if (engineState !== 'idle') {
    transitionToIdle();
  }
  selectDevice();
});

// ── タイミング設定 ──

function calcInterval() {
  const raw = Number(bpmInput.value) || 120;
  const bpm = Math.max(30, Math.min(300, raw));
  const bars = currentSteps === 16 ? 1 : 2;
  return (60 / bpm) * 4 * bars * 1000;
}

function updateIntervalDisplay() {
  intervalMs = calcInterval();
  intervalDisplay.textContent = `${(intervalMs / 1000).toFixed(3)} 秒`;
}

bpmInput.addEventListener('input', () => {
  updateIntervalDisplay();
  if (engineState === 'running') {
    restartSelfCorrectingTimer();
  }
});

for (const btn of document.querySelectorAll('.step-btn')) {
  btn.addEventListener('click', () => {
    for (const b of document.querySelectorAll('.step-btn')) {
      b.classList.remove('active');
    }
    btn.classList.add('active');
    currentSteps = Number(/** @type {HTMLElement} */ (btn).dataset.steps);
    updateIntervalDisplay();
    if (engineState === 'running') {
      restartSelfCorrectingTimer();
    }
  });
}

// ── Bank 選択 ──

for (const btn of document.querySelectorAll('.bank-btn')) {
  btn.addEventListener('click', () => {
    for (const b of document.querySelectorAll('.bank-btn')) {
      b.classList.remove('active');
    }
    btn.classList.add('active');
    currentBank = Number(/** @type {HTMLElement} */ (btn).dataset.bank);
    renderPatternGrid();
  });
}

// ── パターングリッド ──

function initPatternGrid() {
  patternGrid.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'pattern-cell active';
    cell.textContent = String(i + 1);
    cell.dataset.index = String(i);
    cell.addEventListener('click', () => togglePattern(i));
    patternGrid.appendChild(cell);
  }
}

function renderPatternGrid() {
  const patterns = bankPatterns[currentBank - 1];
  const cells = patternGrid.querySelectorAll('.pattern-cell');
  for (let i = 0; i < 16; i++) {
    cells[i].classList.toggle('active', patterns[i]);
    cells[i].classList.remove('current');
  }
}

/** @param {number} index */
function togglePattern(index) {
  const patterns = bankPatterns[currentBank - 1];
  patterns[index] = !patterns[index];
  renderPatternGrid();

  // 有効パターンが 0 件になった場合は IDLE へ
  if (engineState !== 'idle' && !bankPatterns.flat().some(Boolean)) {
    transitionToIdle();
    return;
  }
  updateUI();
}

patternAllBtn.addEventListener('click', () => {
  bankPatterns[currentBank - 1].fill(true);
  renderPatternGrid();
  updateUI();
});

patternNoneBtn.addEventListener('click', () => {
  bankPatterns[currentBank - 1].fill(false);
  renderPatternGrid();

  // 有効パターンが 0 件になった場合は IDLE へ
  if (engineState !== 'idle' && !bankPatterns.flat().some(Boolean)) {
    transitionToIdle();
    return;
  }
  updateUI();
});

// ── UI 更新（状態ベース） ──

function updateUI() {
  const hasActivePatterns = bankPatterns.flat().some(Boolean);

  switch (engineState) {
    case 'idle':
      startStopBtn.textContent = 'START';
      startStopBtn.classList.remove('running', 'waiting');
      startStopBtn.disabled = !selectedOutput || !hasActivePatterns;
      cancelBtn.hidden = true;
      resyncBtn.hidden = true;
      tapHint.hidden = true;
      // IDLE リセット
      progressFill.style.width = '0';
      nowPlayingEl.textContent = '--';
      for (const cell of patternGrid.querySelectorAll('.pattern-cell')) {
        cell.classList.remove('current');
      }
      break;

    case 'waiting':
      startStopBtn.textContent = 'TAP ♪';
      startStopBtn.classList.remove('running');
      startStopBtn.classList.add('waiting');
      startStopBtn.disabled = false;
      cancelBtn.hidden = false;
      resyncBtn.hidden = true;
      tapHint.hidden = false;
      break;

    case 'running':
      startStopBtn.textContent = 'STOP';
      startStopBtn.classList.remove('waiting');
      startStopBtn.classList.add('running');
      startStopBtn.disabled = false;
      cancelBtn.hidden = true;
      resyncBtn.hidden = false;
      tapHint.hidden = true;
      break;
  }
}

// ── メインボタン（START / TAP ♪ / STOP） ──

startStopBtn.addEventListener('click', () => {
  switch (engineState) {
    case 'idle':
      // IDLE → WAITING
      engineState = 'waiting';
      hideRuntimeError();
      updateUI();
      break;

    case 'waiting': {
      // WAITING → RUNNING（TAP ♪）
      const result = trySendRandomPC();
      if (result !== 'ok') {
        transitionToIdle();
        if (result === 'send-error') {
          showRuntimeError('MIDI 送信に失敗しました');
        }
        return;
      }
      engineState = 'running';
      lastSendTime = performance.now();
      intervalMs = calcInterval();
      hideRuntimeError();
      updateUI();
      startSelfCorrectingTimer();
      startProgressAnimation();
      break;
    }

    case 'running':
      // RUNNING → IDLE（STOP）
      transitionToIdle();
      break;
  }
});

// ── CANCEL ボタン ──

cancelBtn.addEventListener('click', () => {
  if (engineState === 'waiting') {
    transitionToIdle();
  }
});

// ── RESYNC ボタン ──

resyncBtn.addEventListener('click', () => {
  if (engineState !== 'running') return;

  const result = trySendRandomPC();
  switch (result) {
    case 'ok':
      // タイマーリセット（expected 再初期化）
      lastSendTime = performance.now();
      restartSelfCorrectingTimer();
      break;
    case 'send-error':
      // RUNNING 維持、エラー表示（タイマーは継続、次の tick で再試行）
      showRuntimeError('MIDI 送信に失敗しました');
      break;
    case 'disconnected':
    case 'no-pattern':
      // 致命的: IDLE へ
      transitionToIdle();
      break;
  }
});

// ── 状態遷移ヘルパー ──

function transitionToIdle() {
  // タイマー停止
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }

  // アニメーション停止
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  engineState = 'idle';
  updateUI();
}

// ── ランダム PC 送信 ──

/**
 * ランダムな Program Change を送信する。
 * 状態遷移は行わず、結果を返す。
 * @returns {'ok' | 'disconnected' | 'no-pattern' | 'send-error'}
 */
function trySendRandomPC() {
  if (!selectedOutput || selectedOutput.state === 'disconnected') {
    return 'disconnected';
  }

  const activePatterns = getActivePatterns();
  if (activePatterns.length === 0) {
    return 'no-pattern';
  }

  const chosen =
    activePatterns[Math.floor(Math.random() * activePatterns.length)];
  const channel = Number(channelSelect.value);
  const statusByte = 0xc0 | channel;

  try {
    selectedOutput.send([statusByte, chosen.pc]);
  } catch {
    return 'send-error';
  }

  // UI 更新
  nowPlayingEl.textContent = `Bank ${chosen.bank} - Pattern ${chosen.pattern}`;
  updateCurrentHighlight(chosen.bank, chosen.pattern);

  return 'ok';
}

/**
 * アクティブなパターンの一覧を返す
 * @returns {{ bank: number, pattern: number, pc: number }[]}
 */
function getActivePatterns() {
  const result = [];
  for (let b = 0; b < 4; b++) {
    for (let p = 0; p < 16; p++) {
      if (bankPatterns[b][p]) {
        result.push({
          bank: b + 1,
          pattern: p + 1,
          pc: b * 16 + p,
        });
      }
    }
  }
  return result;
}

/**
 * @param {number} bank
 * @param {number} pattern
 */
function updateCurrentHighlight(bank, pattern) {
  // 全セルから current を除去
  for (const cell of patternGrid.querySelectorAll('.pattern-cell')) {
    cell.classList.remove('current');
  }

  // 表示中の Bank と一致する場合のみハイライト
  if (bank === currentBank) {
    const cells = patternGrid.querySelectorAll('.pattern-cell');
    const target = cells[pattern - 1];
    if (target) {
      target.classList.add('current');
    }
  }
}

// ── 自己補正タイマー ──

function startSelfCorrectingTimer() {
  expected = performance.now() + intervalMs;

  function tick() {
    if (engineState !== 'running') return;

    const result = trySendRandomPC();
    if (result !== 'ok') {
      transitionToIdle();
      if (result === 'send-error') {
        showRuntimeError('MIDI 送信に失敗しました');
      }
      return;
    }
    lastSendTime = performance.now();

    // バースト送信防止
    const now = performance.now();
    const drift = now - expected;
    if (drift > intervalMs) {
      while (expected <= now) {
        expected += intervalMs;
      }
    } else {
      expected += intervalMs;
    }
    const nextDelay = Math.max(0, expected - performance.now());

    timerId = window.setTimeout(tick, nextDelay);
  }

  timerId = window.setTimeout(tick, intervalMs);
}

function restartSelfCorrectingTimer() {
  if (timerId !== null) {
    clearTimeout(timerId);
  }
  intervalMs = calcInterval();
  expected = performance.now() + intervalMs;
  lastSendTime = performance.now();

  function tick() {
    if (engineState !== 'running') return;

    const result = trySendRandomPC();
    if (result !== 'ok') {
      transitionToIdle();
      if (result === 'send-error') {
        showRuntimeError('MIDI 送信に失敗しました');
      }
      return;
    }
    lastSendTime = performance.now();

    const now = performance.now();
    const drift = now - expected;
    if (drift > intervalMs) {
      while (expected <= now) {
        expected += intervalMs;
      }
    } else {
      expected += intervalMs;
    }
    const nextDelay = Math.max(0, expected - performance.now());

    timerId = window.setTimeout(tick, nextDelay);
  }

  timerId = window.setTimeout(tick, intervalMs);
}

// ── プログレスバー ──

function startProgressAnimation() {
  function update() {
    if (engineState !== 'running') return;

    const elapsed = performance.now() - lastSendTime;
    const progress = Math.min(elapsed / intervalMs, 1);
    progressFill.style.width = `${progress * 100}%`;

    animFrameId = requestAnimationFrame(update);
  }
  animFrameId = requestAnimationFrame(update);
}

// ── 実行時エラー表示 ──

/** @param {string} message */
function showRuntimeError(message) {
  runtimeErrorMsg.textContent = message;
  runtimeErrorEl.hidden = false;

  // 前回のタイマーをクリア
  if (runtimeErrorTimerId !== null) {
    clearTimeout(runtimeErrorTimerId);
  }

  // 5秒後に自動消去
  runtimeErrorTimerId = window.setTimeout(() => {
    hideRuntimeError();
  }, 5000);
}

function hideRuntimeError() {
  runtimeErrorEl.hidden = true;
  runtimeErrorMsg.textContent = '';
  if (runtimeErrorTimerId !== null) {
    clearTimeout(runtimeErrorTimerId);
    runtimeErrorTimerId = null;
  }
}

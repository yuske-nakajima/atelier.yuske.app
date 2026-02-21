// @ts-check

// ── DOM 要素 ──

const midiErrorEl = /** @type {HTMLDivElement} */ (
  document.getElementById('midi-error')
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

/** @type {number | null} */
let intervalId = null;

/** @type {number | null} */
let animFrameId = null;

let isRunning = false;
let lastSendTime = 0;
let intervalMs = 2000;

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
    '.step-btn, .bank-btn, .pattern-cell, .pattern-actions button',
  )) {
    /** @type {HTMLButtonElement} */ (btn).disabled = true;
  }
}

function onMidiStateChange() {
  // 選択中のデバイスが切断された場合、先に停止してからリスト更新
  if (selectedOutput && selectedOutput.state === 'disconnected') {
    if (isRunning) {
      stopEngine();
    }
    selectedOutput = null;
  }

  updateDeviceList();
}

function updateDeviceList() {
  if (!midiAccess) return;

  const outputs = Array.from(midiAccess.outputs.values());
  const prevValue = deviceSelect.value;

  deviceSelect.innerHTML = '';

  if (outputs.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '-- デバイスなし --';
    deviceSelect.appendChild(opt);
    deviceSelect.disabled = true;
    selectedOutput = null;
    updateStartButton();
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
    updateStartButton();
    return;
  }
  selectedOutput = midiAccess.outputs.get(deviceSelect.value) || null;
  updateStartButton();
}

deviceSelect.addEventListener('change', selectDevice);

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
  if (isRunning) {
    restartTimer();
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
    if (isRunning) {
      restartTimer();
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
  updateStartButton();
}

patternAllBtn.addEventListener('click', () => {
  bankPatterns[currentBank - 1].fill(true);
  renderPatternGrid();
  updateStartButton();
});

patternNoneBtn.addEventListener('click', () => {
  bankPatterns[currentBank - 1].fill(false);
  renderPatternGrid();
  updateStartButton();
});

// ── Start / Stop ──

function updateStartButton() {
  const hasActivePatterns = bankPatterns.flat().some(Boolean);
  startStopBtn.disabled = !selectedOutput || !hasActivePatterns;
}

startStopBtn.addEventListener('click', () => {
  if (isRunning) {
    stopEngine();
  } else {
    startEngine();
  }
});

// ── ランダム送信エンジン ──

function startEngine() {
  if (!selectedOutput) return;

  const activePatterns = getActivePatterns();
  if (activePatterns.length === 0) return;

  isRunning = true;
  startStopBtn.textContent = 'STOP';
  startStopBtn.classList.add('running');

  // 即座に1回目を送信
  sendRandomPC();
  lastSendTime = performance.now();

  // タイマー開始
  intervalMs = calcInterval();
  intervalId = window.setInterval(() => {
    sendRandomPC();
    lastSendTime = performance.now();
  }, intervalMs);

  // プログレスバーアニメーション開始
  startProgressAnimation();
}

function stopEngine() {
  isRunning = false;
  startStopBtn.textContent = 'START';
  startStopBtn.classList.remove('running');

  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }

  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  progressFill.style.width = '0';
  nowPlayingEl.textContent = '--';
  updateStartButton();

  // current ハイライトをクリア
  for (const cell of patternGrid.querySelectorAll('.pattern-cell')) {
    cell.classList.remove('current');
  }
}

function restartTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
  intervalMs = calcInterval();
  lastSendTime = performance.now();
  intervalId = window.setInterval(() => {
    sendRandomPC();
    lastSendTime = performance.now();
  }, intervalMs);
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

function sendRandomPC() {
  if (!selectedOutput || selectedOutput.state === 'disconnected') {
    stopEngine();
    return;
  }

  const activePatterns = getActivePatterns();
  if (activePatterns.length === 0) {
    stopEngine();
    return;
  }

  const chosen =
    activePatterns[Math.floor(Math.random() * activePatterns.length)];
  const channel = Number(channelSelect.value);
  const statusByte = 0xc0 | channel;

  try {
    selectedOutput.send([statusByte, chosen.pc]);
  } catch {
    stopEngine();
    return;
  }

  // UI 更新
  nowPlayingEl.textContent = `Bank ${chosen.bank} - Pattern ${chosen.pattern}`;

  // パターングリッドの current ハイライトを更新
  updateCurrentHighlight(chosen.bank, chosen.pattern);
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

// ── プログレスバー ──

function startProgressAnimation() {
  function update() {
    if (!isRunning) return;

    const elapsed = performance.now() - lastSendTime;
    const progress = Math.min(elapsed / intervalMs, 1);
    progressFill.style.width = `${progress * 100}%`;

    animFrameId = requestAnimationFrame(update);
  }
  animFrameId = requestAnimationFrame(update);
}

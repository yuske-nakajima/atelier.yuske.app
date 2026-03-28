// @ts-check

/**
 * @typedef {object} MidiCallbacks
 * @property {(note: number, velocity: number) => void} onNoteOn
 * @property {(note: number) => void} onNoteOff
 * @property {(cc: number, value: number) => void} onCC
 * @property {(hasDevice: boolean) => void} onConnectionChange
 */

/** MIDI ステータスバイト */
const STATUS_NOTE_ON = 0x90;
const STATUS_NOTE_OFF = 0x80;
const STATUS_CC = 0xb0;

/**
 * MIDI メッセージをパースしてコールバックに通知する
 * @param {MIDIMessageEvent} event
 * @param {MidiCallbacks} callbacks
 */
function handleMidiMessage(event, callbacks) {
  const data = event.data;
  if (!data || data.length < 3) return;

  const status = data[0] & 0xf0;
  const value1 = data[1];
  const value2 = data[2];

  if (status === STATUS_NOTE_ON && value2 > 0) {
    callbacks.onNoteOn(value1, value2);
    return;
  }

  if (
    status === STATUS_NOTE_OFF ||
    (status === STATUS_NOTE_ON && value2 === 0)
  ) {
    callbacks.onNoteOff(value1);
    return;
  }

  if (status === STATUS_CC) {
    callbacks.onCC(value1, value2);
  }
}

/**
 * 全 MIDI 入力にイベントリスナーを登録する（重複を防ぐため onmidimessage を使用）
 * @param {MIDIAccess} midiAccess
 * @param {MidiCallbacks} callbacks
 * @returns {number} 接続されたデバイス数
 */
function bindInputs(midiAccess, callbacks) {
  let count = 0;
  for (const input of midiAccess.inputs.values()) {
    input.onmidimessage = (/** @type {MIDIMessageEvent} */ event) => {
      handleMidiMessage(event, callbacks);
    };
    count++;
  }
  return count;
}

/**
 * Web MIDI API でデバイスに接続する
 * @param {MidiCallbacks} callbacks
 * @returns {Promise<boolean>} MIDI API に対応していれば true
 */
export async function connectMidi(callbacks) {
  if (!navigator.requestMIDIAccess) {
    return false;
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess();
    const deviceCount = bindInputs(midiAccess, callbacks);
    callbacks.onConnectionChange(deviceCount > 0);

    midiAccess.addEventListener('statechange', () => {
      const newCount = bindInputs(midiAccess, callbacks);
      callbacks.onConnectionChange(newCount > 0);
    });

    return true;
  } catch {
    return false;
  }
}

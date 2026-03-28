// @ts-check

/**
 * @typedef {object} MidiCallbacks
 * @property {(note: number, velocity: number) => void} onNoteOn
 * @property {(note: number) => void} onNoteOff
 * @property {(cc: number, value: number) => void} onCC
 */

/** MIDI ステータスバイト */
const STATUS_NOTE_ON = 0x90;
const STATUS_NOTE_OFF = 0x80;
const STATUS_CC = 0xb0;

/**
 * MIDI メッセージをパースしてコールバックに通知する
 * @param {MIDIMessageEvent} event - MIDI メッセージイベント
 * @param {MidiCallbacks} callbacks - コールバック関数群
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
 * 全 MIDI 入力にイベントリスナーを登録する
 * @param {MIDIAccess} midiAccess - MIDI アクセスオブジェクト
 * @param {MidiCallbacks} callbacks - コールバック関数群
 */
function bindInputs(midiAccess, callbacks) {
  for (const input of midiAccess.inputs.values()) {
    input.addEventListener(
      'midimessage',
      (/** @type {MIDIMessageEvent} */ event) => {
        handleMidiMessage(event, callbacks);
      },
    );
  }
}

/**
 * Web MIDI API でデバイスに接続する
 * @param {MidiCallbacks} callbacks - コールバック関数群
 * @returns {Promise<boolean>} 接続成功なら true
 */
export async function connectMidi(callbacks) {
  if (!navigator.requestMIDIAccess) {
    return false;
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess();
    bindInputs(midiAccess, callbacks);

    midiAccess.addEventListener('statechange', () => {
      bindInputs(midiAccess, callbacks);
    });

    return true;
  } catch {
    return false;
  }
}

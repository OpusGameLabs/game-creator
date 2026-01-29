// SFX use the Web Audio API directly for true one-shot playback.
// Strudel's .play() loops patterns continuously, which is wrong for SFX.

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// --- Helpers ---

function playTone(freq, type, duration, gain = 0.3, filterFreq = 4000) {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFreq, now);

  osc.connect(filter).connect(gainNode).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function playNotes(notes, type, noteDuration, gap, gain = 0.3, filterFreq = 4000) {
  const ctx = getCtx();
  const now = ctx.currentTime;

  notes.forEach((freq, i) => {
    const start = now + i * gap;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(gain, start);
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, start);

    osc.connect(filter).connect(gainNode).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + noteDuration);
  });
}

// --- SFX ---

// Ring collect — bright ascending two-tone chime
export function ringCollectSfx() {
  playNotes([659.25, 987.77], 'square', 0.12, 0.07, 0.3, 5000); // E5, B5
}

// Crash / death — descending crushed tones
export function crashSfx() {
  playNotes([392, 329.63, 261.63, 220, 174.61], 'square', 0.2, 0.1, 0.25, 2000); // G4 E4 C4 A3 F3
}

// Button click — short pop
export function clickSfx() {
  playTone(523.25, 'sine', 0.08, 0.2, 5000); // C5
}

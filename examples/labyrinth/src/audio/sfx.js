let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

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

// Gem collect — bright sparkle chime (ascending arpeggio)
export function gemSfx() {
  playNotes([784, 988, 1319], 'sine', 0.1, 0.06, 0.2, 6000);
}

// Ball fall — descending whoosh with low thud
export function fallSfx() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Descending sweep
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.15, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(2000, now);
  f.frequency.exponentialRampToValueAtTime(200, now + 0.4);

  osc.connect(f).connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.5);

  // Low thud
  const thud = ctx.createOscillator();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(60, now + 0.3);

  const tg = ctx.createGain();
  tg.gain.setValueAtTime(0, now);
  tg.gain.setValueAtTime(0.25, now + 0.3);
  tg.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  thud.connect(tg).connect(ctx.destination);
  thud.start(now + 0.3);
  thud.stop(now + 0.6);
}

// Level complete — triumphant ascending fanfare
export function levelCompleteSfx() {
  playNotes([523, 659, 784, 1047], 'square', 0.18, 0.12, 0.2, 5000);
}

// Game over — somber descending tones
export function gameOverSfx() {
  playNotes([392, 329.63, 261.63, 196, 164.81], 'triangle', 0.3, 0.15, 0.2, 1800);
}

// Button click — short pop
export function clickSfx() {
  playTone(523.25, 'sine', 0.08, 0.2, 5000);
}

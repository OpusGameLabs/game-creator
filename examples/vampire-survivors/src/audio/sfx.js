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

// Whip attack — crack sound
export function whipSfx() {
  playTone(800, 'sawtooth', 0.08, 0.25, 6000);
}

// Projectile fire
export function projectileSfx() {
  playTone(440, 'square', 0.1, 0.15, 3000);
}

// Enemy death — short crush
export function enemyDeathSfx() {
  playTone(200, 'square', 0.12, 0.2, 1500);
}

// XP pickup — bright chime
export function xpPickupSfx() {
  playNotes([659.25, 987.77], 'square', 0.08, 0.05, 0.2, 5000);
}

// Player hit — low thud
export function playerHitSfx() {
  playTone(100, 'square', 0.15, 0.25, 800);
}

// Level up — ascending arpeggio
export function levelUpSfx() {
  playNotes([261.63, 329.63, 392, 523.25, 659.25], 'square', 0.1, 0.06, 0.25, 5000);
}

// Button click
export function clickSfx() {
  playTone(523.25, 'sine', 0.08, 0.2, 5000);
}

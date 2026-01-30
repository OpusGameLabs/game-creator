// =============================================================================
// Barn Defense - SFX (Sound Effects)
// All SFX use the Web Audio API directly. NEVER Strudel for SFX.
// Farm-themed sound effects for tower defense gameplay.
// =============================================================================

let _ctx = null;

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume();
  }
  return _ctx;
}

/**
 * Play a single oscillator tone.
 * @param {number} freq - Frequency in Hz
 * @param {string} type - Oscillator type: 'sine', 'square', 'sawtooth', 'triangle'
 * @param {number} duration - Duration in seconds
 * @param {number} gain - Volume (0-1)
 * @param {number} [filterFreq] - Optional low-pass filter frequency
 */
function playTone(freq, type, duration, gain, filterFreq) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  if (filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
    osc.connect(filter);
    filter.connect(gainNode);
  } else {
    osc.connect(gainNode);
  }

  gainNode.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/**
 * Play a sequence of tones.
 * @param {number[]} notes - Array of frequencies in Hz
 * @param {string} type - Oscillator type
 * @param {number} noteDuration - Duration per note in seconds
 * @param {number} gap - Gap between notes in seconds
 * @param {number} gain - Volume (0-1)
 * @param {number} [filterFreq] - Optional low-pass filter frequency
 */
function playNotes(notes, type, noteDuration, gap, gain, filterFreq) {
  const ctx = getCtx();
  const now = ctx.currentTime;

  notes.forEach((freq, i) => {
    const startTime = now + i * (noteDuration + gap);
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gainNode.gain.setValueAtTime(gain, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

    if (filterFreq) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, startTime);
      osc.connect(filter);
      filter.connect(gainNode);
    } else {
      osc.connect(gainNode);
    }

    gainNode.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}

/**
 * Play a noise burst (white noise through filters).
 * @param {number} duration - Duration in seconds
 * @param {number} gain - Volume (0-1)
 * @param {number} [lpfFreq] - Low-pass filter frequency
 * @param {number} [hpfFreq] - High-pass filter frequency
 */
function playNoise(duration, gain, lpfFreq, hpfFreq) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  let lastNode = source;

  if (hpfFreq) {
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(hpfFreq, ctx.currentTime);
    lastNode.connect(hpf);
    lastNode = hpf;
  }

  if (lpfFreq) {
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(lpfFreq, ctx.currentTime);
    lastNode.connect(lpf);
    lastNode = lpf;
  }

  lastNode.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + duration);
}

// =============================================================================
// Farm-Themed Sound Effects
// =============================================================================

/** Short whoosh/thwack for tower firing */
export function towerFireSfx() {
  // Quick noise burst for a whoosh feel
  playNoise(0.08, 0.18, 2000, 800);
  // Add a sharp attack tone
  playTone(600, 'square', 0.05, 0.12, 1500);
}

/** Satisfying pop/burst when enemy dies */
export function enemyDeathSfx() {
  playTone(400, 'square', 0.06, 0.2, 1200);
  playTone(250, 'triangle', 0.1, 0.15);
  playNoise(0.08, 0.12, 1500);
}

/** Bright ascending two-tone chime (coin pickup feel) */
export function cornEarnedSfx() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // First tone - E5
  const osc1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(659, now);
  g1.gain.setValueAtTime(0.2, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc1.connect(g1);
  g1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.12);

  // Second tone - A5 (higher, brighter)
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(880, now + 0.08);
  g2.gain.setValueAtTime(0.25, now + 0.08);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc2.connect(g2);
  g2.connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.22);
}

/** Low thump/impact when barn takes damage */
export function barnHitSfx() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Deep thump
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
  g.gain.setValueAtTime(0.3, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.3);

  // Noise impact layer
  playNoise(0.12, 0.15, 300);
}

/** Alert horn / ascending arpeggio when new wave starts */
export function waveStartSfx() {
  // Ascending alert: C5 -> E5 -> G5
  playNotes([523, 659, 784], 'square', 0.1, 0.03, 0.2, 2500);
}

/** Triumphant short fanfare when wave is cleared */
export function waveCompleteSfx() {
  // Victory sting: C5 -> E5 -> G5 -> C6
  playNotes([523, 659, 784, 1047], 'triangle', 0.12, 0.02, 0.22);
}

/** Placement thud when tower is built */
export function towerPlaceSfx() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Solid thud
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
  g.gain.setValueAtTime(0.25, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);

  // Small click layer
  playNoise(0.04, 0.1, 1000, 400);
}

/** Short pop/click for UI buttons */
export function buttonClickSfx() {
  playTone(800, 'sine', 0.04, 0.15, 2000);
  playNoise(0.02, 0.08, 3000, 1000);
}

/** Victory arpeggio (ascending major) for level completion */
export function levelCompleteSfx() {
  // C5 -> E5 -> G5 -> B5 -> C6
  playNotes([523, 659, 784, 988, 1047], 'triangle', 0.12, 0.04, 0.22);
  // Add a sine pad underneath
  setTimeout(() => {
    playTone(523, 'sine', 0.5, 0.15);
  }, 100);
}

/** Descending crushed tones for game over */
export function gameOverSfx() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Descending minor: C5 -> Bb4 -> Ab4 -> G4 -> low rumble
  const notes = [523, 466, 415, 392, 330];
  const type = 'triangle';
  const dur = 0.18;
  const gap = 0.04;

  notes.forEach((freq, i) => {
    const t = now + i * (dur + gap);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  });

  // Low rumble at the end
  const rumbleStart = now + notes.length * (dur + gap);
  const rumble = ctx.createOscillator();
  const rg = ctx.createGain();
  rumble.type = 'sine';
  rumble.frequency.setValueAtTime(60, rumbleStart);
  rumble.frequency.exponentialRampToValueAtTime(30, rumbleStart + 0.5);
  rg.gain.setValueAtTime(0.2, rumbleStart);
  rg.gain.exponentialRampToValueAtTime(0.001, rumbleStart + 0.5);
  rumble.connect(rg);
  rg.connect(ctx.destination);
  rumble.start(rumbleStart);
  rumble.stop(rumbleStart + 0.5);
}

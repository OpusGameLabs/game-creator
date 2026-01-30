// SFX use the Web Audio API directly for true one-shot playback.
// Strudel's .play() loops patterns continuously, which is wrong for SFX.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

// --- Helpers ---

function playTone(freq: number, type: OscillatorType, duration: number, gain: number = 0.3, filterFreq: number = 4000): void {
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

function playNotes(notes: number[], type: OscillatorType, noteDuration: number, gap: number, gain: number = 0.3, filterFreq: number = 4000): void {
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

function playPitchSweep(startFreq: number, endFreq: number, type: OscillatorType, duration: number, gain: number = 0.3, filterFreq: number = 4000): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

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

// --- SFX ---

// Flap -- quick upward pitch sweep
export function flapSfx(): void {
  playPitchSweep(261.63, 2093, 'square', 0.1, 0.2, 3000); // C4 -> C7
}

// Score -- bright two-tone chime
export function scoreSfx(): void {
  playNotes([659.25, 987.77], 'square', 0.1, 0.07, 0.3, 4000); // E5, B5
}

// Death -- descending crushed tones
export function deathSfx(): void {
  playNotes([392, 329.63, 261.63, 220], 'square', 0.18, 0.1, 0.25, 2000); // G4 E4 C4 A3
}

// Button click -- short pop
export function buttonClickSfx(): void {
  playTone(523.25, 'sine', 0.08, 0.2, 5000); // C5
}

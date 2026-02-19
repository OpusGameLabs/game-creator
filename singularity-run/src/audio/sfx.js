// SFX — Web Audio API one-shot sounds
// NEVER use Strudel for SFX. All effects play once and stop.
import { gameState } from '../core/GameState.js';

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Play a single tone that stops after duration.
 */
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

/**
 * Play a sequence of tones (each fires once and stops).
 */
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

/**
 * Play noise burst (for whooshes, clicks).
 */
function playNoise(duration, gain = 0.2, lpfFreq = 4000, hpfFreq = 0) {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(lpfFreq, now);

  let chain = source.connect(lpf).connect(gainNode);

  if (hpfFreq > 0) {
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(hpfFreq, now);
    source.disconnect();
    chain = source.connect(hpf).connect(lpf).connect(gainNode);
  }

  chain.connect(ctx.destination);
  source.start(now);
  source.stop(now + duration);
}

// ─── Game-specific SFX ───────────────────────────────────────

// Note frequencies reference:
// C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00,
// A4=440.00, B4=493.88, C5=523.25, E5=659.25, B5=987.77,
// F3=174.61, A3=220.00, C4=261.63, G4=392.00

/**
 * Jump — quick upward electronic sweep (square, 200Hz -> 800Hz in 0.1s).
 * Matrix "digital leap" feel.
 */
export function jumpSfx() {
  if (gameState.isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.2, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, now);

  osc.connect(filter).connect(gainNode).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

/**
 * Slide — whoosh noise burst (filtered noise, 0.2s, bandpass).
 * Low sweep feel.
 */
export function slideSfx() {
  if (gameState.isMuted) return;
  playNoise(0.2, 0.2, 3000, 600);
}

/**
 * Collect — digital chime, ascending two-tone (E5, B5) on square wave.
 * Quick and satisfying.
 */
export function collectSfx() {
  if (gameState.isMuted) return;
  playNotes([659.25, 987.77], 'square', 0.12, 0.07, 0.3, 5000);
}

/**
 * Death — crash/glitch, descending crushed tones (G4, E4, C4, A3, F3).
 * Low-pass filtered. Sounds like system failure.
 */
export function deathSfx() {
  if (gameState.isMuted) return;
  playNotes([392, 329.63, 261.63, 220, 174.61], 'square', 0.2, 0.1, 0.25, 1500);
}

/**
 * Lane change — very subtle soft click. Short sine tone (C5), 0.05s, low gain.
 * Barely noticeable but confirms input.
 */
export function laneChangeSfx() {
  if (gameState.isMuted) return;
  playTone(523.25, 'sine', 0.05, 0.15, 5000);
}

/**
 * Restart — short ascending blip (C4 -> G4). Digital boot-up feel.
 */
export function restartSfx() {
  if (gameState.isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(261.63, now);
  osc.frequency.exponentialRampToValueAtTime(392, now + 0.1);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.25, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(4000, now);

  osc.connect(filter).connect(gainNode).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

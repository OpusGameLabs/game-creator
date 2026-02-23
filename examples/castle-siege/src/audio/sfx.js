// =============================================================================
// sfx.js — One-shot sound effects for Castle Siege Defense (Web Audio API)
// Never use Strudel for SFX. All sounds are procedural (no external files).
// Each function checks gameState.isMuted before playing.
// =============================================================================

import { gameState } from '../core/GameState.js';
import { AUDIO } from '../core/Constants.js';

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/** Play a single tone that decays to silence */
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

/** Play a sequence of tones (each fires once and stops) */
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

/** Play a noise burst (for whooshes, impacts) */
function playNoise(duration, gain = 0.2, lpfFreq = 4000, hpfFreq = 0) {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
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

// ---------------------------------------------------------------------------
// Game-specific SFX
// ---------------------------------------------------------------------------

/**
 * Catapult launch — whoosh + thud combo
 * Quick noise sweep + low thump for the stone leaving the catapult
 */
export function catapultLaunchSfx() {
  if (gameState.isMuted) return;
  // Whoosh — rising noise
  playNoise(0.25, AUDIO.SFX_LAUNCH_GAIN, 6000, 800);
  // Thump — low tone for catapult arm hitting
  playTone(65.41, 'sine', 0.15, AUDIO.SFX_LAUNCH_GAIN * 0.8, 400);
}

/**
 * Explosion / projectile impact — deep boom with rumble
 * Low sine burst + noise for debris scatter
 */
export function explosionSfx() {
  if (gameState.isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Deep boom — sine sweep from low to very low
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(AUDIO.SFX_EXPLOSION_GAIN, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, now);

  osc.connect(filter).connect(gainNode).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.5);

  // Debris noise
  playNoise(0.3, AUDIO.SFX_EXPLOSION_GAIN * 0.5, 3000, 200);
}

/**
 * Enemy death — short crunchy hit
 * Quick descending tone + noise burst
 */
export function enemyDeathSfx() {
  if (gameState.isMuted) return;
  playTone(440, 'square', 0.08, AUDIO.SFX_ENEMY_DEATH_GAIN, 2000);
  playNoise(0.1, AUDIO.SFX_ENEMY_DEATH_GAIN * 0.6, 4000, 500);
}

/**
 * Castle hit — heavy stone impact
 * Low thud with resonance, like stone cracking
 */
export function castleHitSfx() {
  if (gameState.isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Heavy stone thud
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(AUDIO.SFX_CASTLE_HIT_GAIN, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, now);
  filter.Q.setValueAtTime(5, now); // resonance for stone ring

  osc.connect(filter).connect(gainNode).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);

  // Stone debris noise
  playNoise(0.2, AUDIO.SFX_CASTLE_HIT_GAIN * 0.4, 2500, 300);
}

/**
 * Wave start — war horn blast
 * Long sawtooth tone with filter sweep, like a brass horn
 */
export function warHornSfx() {
  if (gameState.isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Horn — sawtooth with slow filter open
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.setValueAtTime(146.83, now + 0.15); // D3 — slight pitch up

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(AUDIO.SFX_WAR_HORN_GAIN, now + 0.15);
  gainNode.gain.setValueAtTime(AUDIO.SFX_WAR_HORN_GAIN, now + 0.5);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
  filter.frequency.exponentialRampToValueAtTime(600, now + 0.8);

  osc.connect(filter).connect(gainNode).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.9);
}

/**
 * Castle destroyed — dramatic crash
 * Deep descending boom + stone crumble noise + dissonant tones
 */
export function castleDestroyedSfx() {
  if (gameState.isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Massive low boom
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(60, now);
  osc.frequency.exponentialRampToValueAtTime(20, now + 1.0);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(AUDIO.SFX_CASTLE_DESTROYED_GAIN, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, now);

  osc.connect(filter).connect(gainNode).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 1.2);

  // Stone crumble — long noise burst
  playNoise(0.8, AUDIO.SFX_CASTLE_DESTROYED_GAIN * 0.4, 2000, 100);

  // Dissonant descending tones for drama
  playNotes(
    [392, 329.63, 261.63, 220, 174.61, 130.81],
    'square', 0.25, 0.12,
    AUDIO.SFX_CASTLE_DESTROYED_GAIN * 0.3, 1500
  );
}

/**
 * Score / kill points — bright ascending chime
 */
export function scoreSfx() {
  if (gameState.isMuted) return;
  playNotes([659.25, 987.77], 'square', 0.1, 0.06, AUDIO.SFX_SCORE_GAIN, 5000);
}

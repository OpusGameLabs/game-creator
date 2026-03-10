# SFX Engine (Web Audio API -- one-shot)

```js
// sfx.js — Web Audio API one-shot sounds
import { audioManager } from './AudioManager.js';

function playTone(freq, type, duration, gain = 0.3, filterFreq = 4000) {
  const ctx = audioManager.getCtx();
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

  osc.connect(filter).connect(gainNode).connect(audioManager.getMaster());
  osc.start(now);
  osc.stop(now + duration);
}

function playNotes(notes, type, noteDuration, gap, gain = 0.3, filterFreq = 4000) {
  const ctx = audioManager.getCtx();
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

    osc.connect(filter).connect(gainNode).connect(audioManager.getMaster());
    osc.start(start);
    osc.stop(start + noteDuration);
  });
}

function playNoise(duration, gain = 0.2, lpfFreq = 4000, hpfFreq = 0) {
  const ctx = audioManager.getCtx();
  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

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

  chain.connect(audioManager.getMaster());
  source.start(now);
  source.stop(now + duration);
}

// --- Common Game SFX ---
// Note frequencies: C4=261.63, D4=293.66, E4=329.63, F4=349.23,
// G4=392.00, A4=440.00, B4=493.88, C5=523.25, E5=659.25, B5=987.77

export function scoreSfx() {
  playNotes([659.25, 987.77], 'square', 0.12, 0.07, 0.3, 5000);
}

export function jumpSfx() {
  const ctx = audioManager.getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(261.63, now);
  osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.2, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(3000, now);
  osc.connect(f).connect(g).connect(audioManager.getMaster());
  osc.start(now);
  osc.stop(now + 0.12);
}

export function deathSfx() {
  playNotes([392, 329.63, 261.63, 220, 174.61], 'square', 0.2, 0.1, 0.25, 2000);
}

export function clickSfx() {
  playTone(523.25, 'sine', 0.08, 0.2, 5000);
}

export function powerUpSfx() {
  playNotes([261.63, 329.63, 392, 523.25, 659.25], 'square', 0.1, 0.06, 0.3, 5000);
}

export function hitSfx() {
  playTone(65.41, 'square', 0.15, 0.3, 800);
}

export function whooshSfx() {
  playNoise(0.25, 0.15, 6000, 800);
}

export function selectSfx() {
  playTone(523.25, 'sine', 0.2, 0.25, 6000);
}
```

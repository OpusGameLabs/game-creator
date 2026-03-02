---
name: game-audio
description: Game audio engineer using Web Audio API for procedural music and sound effects in browser games. Zero dependencies. Use when adding music or SFX to a game.
---

# Game Audio Engineer (Web Audio API)

You are an expert game audio engineer. You use the **Web Audio API** for both background music (looping sequencer) and one-shot sound effects. Zero dependencies — everything is built into the browser.

## Reference Files

For detailed reference, see companion files in this directory:
- `mixing-guide.md` — Volume levels table and style guidelines per genre

## Tech Stack

| Purpose | Engine | Package |
|---------|--------|---------|
| Background music | Web Audio API sequencer | Built into browsers |
| Sound effects | Web Audio API one-shot | Built into browsers |
| Synths | OscillatorNode (square, triangle, sawtooth, sine) | — |
| Effects | GainNode, BiquadFilterNode, ConvolverNode, DelayNode | — |

No external audio files or npm packages needed — all sounds are procedural.

## File Structure

```
src/
├── audio/
│   ├── AudioManager.js    # AudioContext init, BGM sequencer, play/stop
│   ├── AudioBridge.js     # Wires EventBus → audio playback
│   ├── music.js           # BGM patterns (sequencer note arrays)
│   └── sfx.js             # SFX (one-shot oscillator + gain + filter)
```

## AudioManager (BGM Sequencer + AudioContext)

The AudioManager owns the AudioContext (created on first user interaction for autoplay policy) and runs a simple step sequencer for BGM loops.

```js
// AudioManager.js — Web Audio API BGM sequencer + SFX context

class AudioManager {
  constructor() {
    this.ctx = null;
    this.currentBgm = null; // { stop() }
    this.masterGain = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
  }

  getCtx() {
    if (!this.ctx) this.init();
    return this.ctx;
  }

  getMaster() {
    if (!this.masterGain) this.init();
    return this.masterGain;
  }

  playMusic(patternFn) {
    this.stopMusic();
    try {
      this.currentBgm = patternFn(this.getCtx(), this.getMaster());
    } catch (e) {
      console.warn('[Audio] BGM error:', e);
    }
  }

  stopMusic() {
    if (this.currentBgm) {
      try { this.currentBgm.stop(); } catch (_) {}
      this.currentBgm = null;
    }
  }

  setMuted(muted) {
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 1;
    }
  }
}

export const audioManager = new AudioManager();
```

## BGM Sequencer Pattern

BGM uses a step sequencer that schedules oscillator notes ahead of time in a recurring loop. This gives sample-accurate timing with zero drift.

```js
// music.js — BGM patterns using Web Audio API sequencer

const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, R: 0, // R = rest
};

/**
 * Simple step sequencer — schedules notes in a loop using Web Audio API.
 * Returns { stop() } to cancel the loop.
 *
 * @param {AudioContext} ctx
 * @param {GainNode} dest - destination node (master gain)
 * @param {Array<Array<{freq, type, gain, duration}>>} layers - parallel note sequences
 * @param {number} bpm - beats per minute
 * @param {number} stepsPerBeat - subdivisions per beat (default 2 = eighth notes)
 */
function sequencer(ctx, dest, layers, bpm, stepsPerBeat = 2) {
  const stepDuration = 60 / bpm / stepsPerBeat;
  let nextStepTime = ctx.currentTime + 0.05; // small initial buffer
  let stepIndex = 0;
  let stopped = false;
  let timerId = null;

  function scheduleStep() {
    if (stopped) return;

    // Schedule notes while we're ahead of the playback cursor
    while (nextStepTime < ctx.currentTime + 0.1) {
      for (const layer of layers) {
        const note = layer[stepIndex % layer.length];
        if (note && note.freq > 0) {
          const osc = ctx.createOscillator();
          osc.type = note.type || 'square';
          osc.frequency.setValueAtTime(note.freq, nextStepTime);

          if (note.freqEnd) {
            osc.frequency.exponentialRampToValueAtTime(note.freqEnd, nextStepTime + (note.duration || stepDuration));
          }

          const g = ctx.createGain();
          const noteGain = note.gain ?? 0.15;
          g.gain.setValueAtTime(noteGain, nextStepTime);
          g.gain.exponentialRampToValueAtTime(0.001, nextStepTime + (note.duration || stepDuration * 0.9));

          const f = ctx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.setValueAtTime(note.lpf || 3000, nextStepTime);

          osc.connect(f).connect(g).connect(dest);
          osc.start(nextStepTime);
          osc.stop(nextStepTime + (note.duration || stepDuration));
        }
      }

      stepIndex++;
      nextStepTime += stepDuration;
    }

    timerId = setTimeout(scheduleStep, 25); // check every 25ms
  }

  scheduleStep();
  return { stop() { stopped = true; clearTimeout(timerId); } };
}

// Helper: convert a string pattern like "C4 R E4 G4" into note objects
function parsePattern(str, type = 'square', gain = 0.15, lpf = 3000) {
  return str.split(' ').map(n => {
    if (n === 'R' || n === '~') return { freq: 0 };
    return { freq: NOTES[n] || 0, type, gain, lpf };
  });
}

// --- Example BGM patterns ---

export function gameplayBGM(ctx, dest) {
  return sequencer(ctx, dest, [
    // Melody — square wave
    parsePattern('C4 E4 G4 E4 C4 D4 E4 C4 D4 F4 A4 F4 D4 E4 F4 D4', 'square', 0.14, 2200),
    // Bass — triangle wave
    parsePattern('C3 R C3 R G3 R G3 R F3 R F3 R C3 R C3 R', 'triangle', 0.18, 500),
    // Arpeggio texture — quiet square
    parsePattern('C5 E5 G5 E5 C5 E5 G5 E5 D5 F4 A4 F4 D5 F4 A4 F4', 'square', 0.04, 1000),
    // Kick drum — low sine
    parsePattern('C3 R R R C3 R R R C3 R R R C3 R R R', 'sine', 0.25, 200),
  ], 130, 2);
}

export function gameOverTheme(ctx, dest) {
  return sequencer(ctx, dest, [
    // Slow descending melody
    parsePattern('B4 R A4 R G4 R E4 R D4 R C4 R R R R R', 'triangle', 0.18, 1800),
    // Pad chord
    parsePattern('A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3', 'sine', 0.10, 1200),
  ], 60, 2);
}
```

### Anti-Repetition Techniques

The #1 complaint about procedural game music is repetitiveness. Use these techniques:

1. **Multiple phrase variations** — Write 2-4 melody arrays and cycle through them:
```js
const melodies = [
  parsePattern('C4 E4 G4 E4 C4 D4 E4 C4'),
  parsePattern('G4 A4 B4 A4 G4 E4 D4 E4'),
  parsePattern('E4 G4 A4 G4 E4 D4 C4 D4'),
];
// In sequencer, index melody layers by Math.floor(stepIndex / stepsPerPhrase) % melodies.length
```

2. **Different layer lengths** — Make bass 12 steps while melody is 16. They realign after LCM(12,16)=48 steps.

3. **Random note omission** — In the sequencer loop, skip notes with `Math.random() > 0.85` for organic variation.

4. **Filter sweep** — Gradually change `lpf` values over time for timbral movement.

**Rule of thumb**: Effective loop length should be 30+ seconds before exact repetition.

## SFX Engine (Web Audio API — one-shot)

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

## AudioBridge (wiring EventBus → audio)

```js
import { eventBus, Events } from '../core/EventBus.js';
import { audioManager } from './AudioManager.js';
import { gameplayBGM, gameOverTheme } from './music.js';
import { scoreSfx, deathSfx, clickSfx } from './sfx.js';

export function initAudioBridge() {
  // Init AudioContext on first user interaction (browser autoplay policy)
  eventBus.on(Events.AUDIO_INIT, () => audioManager.init());

  // BGM transitions
  eventBus.on(Events.MUSIC_GAMEPLAY, () => audioManager.playMusic(gameplayBGM));
  eventBus.on(Events.MUSIC_GAMEOVER, () => audioManager.playMusic(gameOverTheme));
  eventBus.on(Events.MUSIC_STOP, () => audioManager.stopMusic());

  // SFX (one-shot)
  eventBus.on(Events.SCORE_CHANGED, () => scoreSfx());
  eventBus.on(Events.PLAYER_DIED, () => deathSfx());
}
```

## Mute State Management

Store `isMuted` in GameState and respect it via the master gain node:

```js
// AudioBridge — handle mute toggle event
eventBus.on(Events.AUDIO_TOGGLE_MUTE, () => {
  gameState.isMuted = !gameState.isMuted;
  try { localStorage.setItem('muted', gameState.isMuted); } catch (_) {}
  audioManager.setMuted(gameState.isMuted);
  if (gameState.isMuted) audioManager.stopMusic();
});
```

Muting via `masterGain.gain.value = 0` silences both BGM and SFX through a single control point. No need to check mute state in every SFX function.

### Mute Button

Reference implementation for drawing a speaker icon with the Phaser Graphics API:

```js
function drawMuteIcon(gfx, muted, size) {
  gfx.clear();
  const s = size;

  // Speaker body — rectangle + triangle cone
  gfx.fillStyle(0xffffff);
  gfx.fillRect(-s * 0.15, -s * 0.15, s * 0.15, s * 0.3);
  gfx.fillTriangle(-s * 0.15, -s * 0.3, -s * 0.15, s * 0.3, -s * 0.45, 0);

  if (!muted) {
    // Sound waves — two arcs
    gfx.lineStyle(2, 0xffffff);
    gfx.beginPath();
    gfx.arc(0, 0, s * 0.2, -Math.PI / 4, Math.PI / 4);
    gfx.strokePath();
    gfx.beginPath();
    gfx.arc(0, 0, s * 0.35, -Math.PI / 4, Math.PI / 4);
    gfx.strokePath();
  } else {
    // X mark
    gfx.lineStyle(3, 0xff4444);
    gfx.lineBetween(s * 0.05, -s * 0.25, s * 0.35, s * 0.25);
    gfx.lineBetween(s * 0.05, s * 0.25, s * 0.35, -s * 0.25);
  }
}
```

Create the button in UIScene (runs as a parallel scene, visible on all screens):

```js
// In UIScene.create():
_createMuteButton() {
  const ICON_SIZE = 16;
  const MARGIN = 12;
  const x = this.cameras.main.width - MARGIN - ICON_SIZE;
  const y = this.cameras.main.height - MARGIN - ICON_SIZE;

  this.muteBg = this.add.circle(x, y, ICON_SIZE + 4, 0x000000, 0.3)
    .setInteractive({ useHandCursor: true })
    .setDepth(100);

  this.muteIcon = this.add.graphics().setDepth(100);
  this.muteIcon.setPosition(x, y);
  drawMuteIcon(this.muteIcon, gameState.isMuted, ICON_SIZE);

  this.muteBg.on('pointerdown', () => {
    eventBus.emit(Events.AUDIO_TOGGLE_MUTE);
    drawMuteIcon(this.muteIcon, gameState.isMuted, ICON_SIZE);
  });

  this.input.keyboard.on('keydown-M', () => {
    eventBus.emit(Events.AUDIO_TOGGLE_MUTE);
    drawMuteIcon(this.muteIcon, gameState.isMuted, ICON_SIZE);
  });
}
```

Persist preference via `localStorage`:

```js
// GameState — read on construct
constructor() {
  this.isMuted = localStorage.getItem('muted') === 'true';
}
```

## Integration Checklist

1. Create `src/audio/AudioManager.js` — AudioContext + sequencer + master gain
2. Create `src/audio/music.js` — BGM patterns as note arrays + sequencer calls
3. Create `src/audio/sfx.js` — SFX using Web Audio API (oscillator + gain + filter)
4. Create `src/audio/AudioBridge.js` — wire EventBus events to audio
5. Wire `initAudioBridge()` in `main.js`
6. Emit `AUDIO_INIT` on first user click (browser autoplay policy)
7. Emit `MUSIC_GAMEPLAY`, `MUSIC_GAMEOVER`, `MUSIC_STOP` at scene transitions
8. **Add mute toggle** — `AUDIO_TOGGLE_MUTE` event, UI button, M key shortcut
9. Test: BGM loops seamlessly, SFX fire once and stop, mute silences everything

## Important Notes

- **Zero dependencies**: Everything uses the built-in Web Audio API. No npm packages needed for audio.
- **Browser autoplay**: AudioContext MUST be created/resumed from a user click/tap. The `AUDIO_INIT` event handles this.
- **Master gain for mute**: Route everything through a single GainNode. Setting `gain.value = 0` mutes all audio instantly.
- **Sequencer timing**: The look-ahead scheduler (schedules 100ms ahead, checks every 25ms) gives sample-accurate timing with no drift. This is the standard Web Audio scheduling pattern.
- **No external audio files needed**: Everything is synthesized with oscillators.
- **SFX are instant**: Web Audio API fires immediately with zero scheduler latency.

## Optional: Strudel.cc Upgrade

For richer procedural BGM with pattern language support, you can optionally install `@strudel/web`:

```bash
npm install @strudel/web
```

**Note**: Strudel is **AGPL-3.0** — projects using it must be open source. See `strudel-reference.md` and `bgm-patterns.md` in this directory for Strudel-specific patterns.

The Strudel upgrade replaces the Web Audio sequencer for BGM only. SFX always use Web Audio API directly.

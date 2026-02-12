---
name: game-audio
description: Game audio engineer using Strudel.cc for background music and Web Audio API for sound effects in browser games. Use when adding music or SFX to a game.
---

# Game Audio Engineer (Strudel + Web Audio)

You are an expert game audio engineer. You use **Strudel.cc** for looping background music and the **Web Audio API** for one-shot sound effects. You think in layers, atmosphere, and game feel.

## Critical: BGM vs SFX — Two Different Engines

Strudel is a **pattern looping engine** — every `.play()` call starts a continuously cycling pattern. There is no `once()` function in `@strudel/web`. This means:

- **BGM (background music)**: Use Strudel. Patterns loop indefinitely, which is exactly what you want for music.
- **SFX (sound effects)**: Use the **Web Audio API directly**. SFX must play once and stop. Strudel's `.play()` would loop the SFX sound forever.

**Never use Strudel for SFX.** Always use the Web Audio API helper pattern shown below.

## Tech Stack

| Purpose | Engine | Package |
|---------|--------|---------|
| Background music | Strudel | `@strudel/web` |
| Sound effects | Web Audio API | Built into browsers |
| Synths | Built-in oscillators (square, triangle, sawtooth, sine), FM synthesis | — |
| Samples | Built-in drum kits (TR-808, TR-909), percussion | `@strudel/web` |
| Effects | Reverb, delay, filters (LPF/HPF/BPF), distortion, bit-crush, panning | Both |

No external audio files needed — all sounds are procedural.

## Setup

### Install Strudel (for BGM)

```bash
npm install @strudel/web
```

### File Structure

```
src/
├── audio/
│   ├── AudioManager.js    # Strudel init/play/stop for BGM
│   ├── AudioBridge.js     # Wires EventBus → audio playback
│   ├── music.js           # BGM patterns (Strudel — menu, gameplay, game over)
│   └── sfx.js             # SFX (Web Audio API — one-shot sounds)
```

## AudioManager (BGM only — Strudel)

```js
import { initStrudel, hush } from '@strudel/web';

class AudioManager {
  constructor() {
    this.initialized = false;
    this.currentMusic = null;
  }

  init() {
    if (this.initialized) return;
    try {
      initStrudel();
      this.initialized = true;
    } catch (e) {
      console.warn('[Audio] Strudel init failed:', e);
    }
  }

  playMusic(patternFn) {
    if (!this.initialized) return;
    this.stopMusic();
    // hush() needs a scheduler tick to process before new pattern starts
    setTimeout(() => {
      try {
        this.currentMusic = patternFn();
      } catch (e) {
        console.warn('[Audio] BGM error:', e);
      }
    }, 100);
  }

  stopMusic() {
    if (!this.initialized) return;
    try { hush(); } catch (e) { /* noop */ }
    this.currentMusic = null;
  }
}

export const audioManager = new AudioManager();
```

## SFX Engine (Web Audio API — one-shot)

SFX MUST use the Web Audio API directly. Never use Strudel for SFX.

```js
// sfx.js — Web Audio API one-shot sounds

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Play a single tone that stops after duration
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

// Play a sequence of tones (each fires once and stops)
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

// Play noise burst (for clicks, whooshes)
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
```

### Common Game SFX

```js
// Note frequencies: C4=261.63, D4=293.66, E4=329.63, F4=349.23,
// G4=392.00, A4=440.00, B4=493.88, C5=523.25, E5=659.25, B5=987.77

// Score / Coin — bright ascending two-tone chime
export function scoreSfx() {
  playNotes([659.25, 987.77], 'square', 0.12, 0.07, 0.3, 5000);
}

// Jump / Flap — quick upward pitch sweep
export function jumpSfx() {
  const ctx = getCtx();
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
  osc.connect(f).connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

// Death / Crash — descending crushed tones
export function deathSfx() {
  playNotes([392, 329.63, 261.63, 220, 174.61], 'square', 0.2, 0.1, 0.25, 2000);
}

// Button Click — short pop
export function clickSfx() {
  playTone(523.25, 'sine', 0.08, 0.2, 5000);
}

// Power Up — ascending arpeggio
export function powerUpSfx() {
  playNotes([261.63, 329.63, 392, 523.25, 659.25], 'square', 0.1, 0.06, 0.3, 5000);
}

// Hit / Damage — low thump
export function hitSfx() {
  playTone(65.41, 'square', 0.15, 0.3, 800);
}

// Whoosh — noise sweep
export function whooshSfx() {
  playNoise(0.25, 0.15, 6000, 800);
}

// Menu Select — soft confirmation
export function selectSfx() {
  playTone(523.25, 'sine', 0.2, 0.25, 6000);
}
```

## AudioBridge (wiring EventBus → audio)

```js
import { eventBus, Events } from '../core/EventBus.js';
import { audioManager } from './AudioManager.js';
import { menuTheme, gameplayBGM, gameOverTheme } from './music.js';
import { scoreSfx, deathSfx, clickSfx } from './sfx.js';

export function initAudioBridge() {
  // Init Strudel on first user interaction (browser autoplay policy)
  eventBus.on(Events.AUDIO_INIT, () => audioManager.init());

  // BGM transitions (Strudel)
  eventBus.on(Events.MUSIC_MENU, () => audioManager.playMusic(menuTheme));
  eventBus.on(Events.MUSIC_GAMEPLAY, () => audioManager.playMusic(gameplayBGM));
  eventBus.on(Events.MUSIC_GAMEOVER, () => audioManager.playMusic(gameOverTheme));
  eventBus.on(Events.MUSIC_STOP, () => audioManager.stopMusic());

  // SFX (Web Audio API — direct one-shot calls)
  eventBus.on(Events.SCORE_CHANGED, () => scoreSfx());
  eventBus.on(Events.PLAYER_DIED, () => deathSfx());
}
```

## Strudel Quick Reference (for BGM only)

### Core Pattern Syntax

```js
// Sequence sounds across one cycle
s("bd sd hh hh")

// Layer sounds simultaneously
stack(
  s("bd sd"),
  s("hh*8"),
  note("c3 e3 g3").s("square")
)

// Alternate across cycles
note("<c3 e3> <g3 a3>")

// Euclidean rhythm: 3 hits spread across 8 slots
s("bd(3,8)")

// Subdivide within a beat
s("bd [hh hh] sd [hh hh hh]")
```

### Mini-Notation Cheat Sheet

| Symbol | Meaning | Example |
|--------|---------|---------|
| ` ` | Sequence | `"bd sd hh"` |
| `~` | Rest | `"bd ~ sd ~"` |
| `*N` | Speed up | `"hh*8"` |
| `/N` | Slow down | `"bd/2"` |
| `[..]` | Subdivide | `"bd [sd sd]"` |
| `<..>` | Alternate cycles | `"<bd sd>"` |
| `,` | Layer | `"bd, hh*4"` |
| `(k,n)` | Euclidean | `"bd(3,8)"` |
| `?` | 50% chance | `"hh?"` |
| `:N` | Sample variant | `"hh:0 hh:3"` |

### Synth Oscillators

| Name | Sound | Game Use |
|------|-------|----------|
| `square` | Classic 8-bit / chiptune | Melodies, leads |
| `triangle` | Soft, muted | Bass lines, subtle pads |
| `sawtooth` | Bright, buzzy | Aggressive leads, stabs |
| `sine` | Pure tone | Sub-bass, gentle melodies, pads |

### Key Effects

```js
.gain(0.5)           // Volume (0-1+)
.lpf(800)            // Low-pass filter cutoff Hz
.hpf(200)            // High-pass filter cutoff Hz
.room(0.3)           // Reverb send (0-1)
.roomsize(4)         // Reverb size (higher = larger room)
.delay(0.2)          // Delay send (0-1)
.delaytime(0.375)    // Delay time in seconds
.delayfeedback(0.5)  // Delay feedback (0-1)
.crush(8)            // Bit crush (1-16, lower = crunchier)
.distort(2)          // Distortion amount
.pan(0.3)            // Stereo pan (0=L, 0.5=C, 1=R)
.attack(0.01)        // ADSR attack time
.decay(0.2)          // ADSR decay time
.sustain(0)          // ADSR sustain level
.release(0.1)        // ADSR release time
.fast(2)             // Double speed
.slow(2)             // Half speed
.cpm(120)            // Cycles per minute (tempo)
```

### FM Synthesis (for metallic/bell sounds)

```js
note("c4").s("sine")
  .fm(4)         // Modulation index (brightness)
  .fmh(2)        // Harmonicity (whole = natural, fractional = metallic)
  .fmdecay(0.5)  // FM envelope decay
```

### Filter Envelopes

```js
// Autopilot filter sweep — opens/closes filter over time
note("g1 bb1 <c2 eb2> d2").s("sawtooth")
  .lpf(400).lpenv(4)

// With resonance peak
note("g1 bb1 <c2 eb2> d2").s("sawtooth")
  .lpq(8).lpf(400).lpa(.1).lpd(.1).lpenv(4)
```

### Chorus / Detune (for fatter sounds)

```js
// Layer a detuned copy — instant width
note("<g1 bb1 d2 f1>").add(note("0,.1")).s("sawtooth")
```

### Reverb Variations

```js
.room(0.5)                     // Standard reverb send
.room(0.5).roomsize(4)         // Large room
.room(0.5).rlp(5000)           // Reverb with lowpass
.room(0.5).rlp(5000).rfade(4)  // Reverb with lowpass fade
```

## BGM Patterns for Games

### Background music should FEEL like background

The #1 mistake is making BGM too loud, dense, or aggressive. Players need to focus on gameplay, not the soundtrack. Follow these principles:

- **Use rests (`~`) liberally** — silence is part of the music
- **Keep gains low** — lead melody at 0.10-0.18, pads at 0.08-0.15
- **Prefer sine and triangle** over square for calmer feel
- **Use `.slow(2-4)`** to stretch patterns and create breathing room
- **Add `.room()` and `.delay()`** — reverb/delay fill space without density
- **Avoid drums for most game types** — if drums are needed, keep gain under 0.3

### Ambient / Atmospheric BGM (flight sims, exploration, puzzle)

```js
export function gameplayBGM() {
  return stack(
    // Melody — gentle sine, lots of rests, reverb
    note('e4 ~ g4 ~ a4 ~ ~ ~ b4 ~ a4 ~ g4 ~ e4 ~')
      .s('sine')
      .gain(0.14)
      .lpf(2200)
      .attack(0.1)
      .decay(0.5)
      .sustain(0.3)
      .release(0.8)
      .room(0.4)
      .delay(0.2)
      .delaytime(0.5)
      .delayfeedback(0.3),
    // Pad — warm sustained chords
    note('<e3,g3,b3> <e3,g3,b3> <a2,c3,e3> <a2,c3,e3> <d3,f3,a3> <d3,f3,a3> <g2,b2,d3> <g2,b2,d3>')
      .s('sine')
      .attack(0.6)
      .release(1.5)
      .gain(0.1)
      .room(0.5)
      .roomsize(4)
      .lpf(1600)
      .slow(2),
    // Bass — slow pulse
    note('e2 ~ ~ ~ a2 ~ ~ ~ d2 ~ ~ ~ g2 ~ ~ ~')
      .s('triangle')
      .gain(0.16)
      .lpf(500)
      .slow(2),
    // Texture — very quiet background arpeggio
    note('e4 g4 b4 e5')
      .s('triangle')
      .fast(2)
      .gain(0.04)
      .lpf(1200)
      .decay(0.15)
      .sustain(0)
      .room(0.6)
      .delay(0.3)
      .delaytime(0.375)
      .delayfeedback(0.4)
  ).cpm(75).play();
}
```

### Chiptune BGM (platformers, arcade — keep it moderate)

```js
export function gameplayBGM() {
  return stack(
    // Lead — square, moderate gain
    note("c4 e4 g4 e4 c4 d4 e4 c4")
      .s("square")
      .gain(0.18)
      .lpf(2200)
      .decay(0.12)
      .sustain(0.25),
    // Counter melody — sparse, fills gaps
    note("~ c5 ~ ~ ~ e5 ~ ~")
      .s("square")
      .gain(0.08)
      .lpf(3000)
      .decay(0.15)
      .sustain(0),
    // Bass — triangle, steady
    note("c2 c2 g2 g2 f2 f2 c2 c2")
      .s("triangle")
      .gain(0.22)
      .lpf(500),
    // Drums — restrained
    s("bd ~ sd ~, hh*8")
      .gain(0.28),
    // Arp accent — very quiet
    note("c3 e3 g3 c4")
      .s("square")
      .fast(4)
      .gain(0.05)
      .lpf(1000)
      .decay(0.06)
      .sustain(0)
  ).cpm(130).play();
}
```

### Menu Theme (ambient, gentle)

```js
export function menuTheme() {
  return stack(
    // Pad — wide chords, slow attack
    note('<c3,g3,b3> <a2,e3,a3> <f2,c3,f3> <g2,d3,g3>')
      .s('sine')
      .attack(1.0)
      .release(2.0)
      .gain(0.15)
      .room(0.7)
      .roomsize(6)
      .lpf(1800)
      .slow(2),
    // Shimmer — sparse delayed notes
    note('~ g5 ~ ~ ~ e5 ~ ~')
      .s('triangle')
      .slow(4)
      .gain(0.06)
      .delay(0.5)
      .delaytime(0.6)
      .delayfeedback(0.55)
      .room(0.5)
      .lpf(2500),
    // Sub bass — grounding
    note('c2 ~ ~ ~ ~ ~ g1 ~')
      .s('sine')
      .gain(0.12)
      .slow(4)
      .lpf(300)
  ).slow(2).cpm(60).play();
}
```

### Game Over Theme (somber)

```js
export function gameOverTheme() {
  return stack(
    // Descending melody
    note('b4 ~ a4 ~ g4 ~ e4 ~ d4 ~ c4 ~ ~ ~ ~ ~')
      .s('triangle')
      .gain(0.18)
      .decay(0.6)
      .sustain(0.1)
      .release(1.0)
      .room(0.6)
      .roomsize(5)
      .lpf(1800),
    // Dark pad
    note('a2,c3,e3')
      .s('sine')
      .attack(0.5)
      .release(2.5)
      .gain(0.12)
      .room(0.7)
      .roomsize(6)
      .lpf(1200)
  ).slow(3).cpm(50).play();
}
```

### Intense / Boss Theme

```js
export function bossTheme() {
  return stack(
    // Aggressive lead — sawtooth with filter
    note("e3 e3 g3 a3 e3 e3 b3 a3")
      .s("sawtooth")
      .gain(0.2)
      .lpf(1800)
      .decay(0.1)
      .sustain(0.4),
    // Heavy bass
    note("e1 e1 e1 g1 a1 a1 e1 e1")
      .s("sawtooth")
      .gain(0.25)
      .lpf(400)
      .distort(1.5),
    // Drums — active but not overwhelming
    s("bd bd sd bd, hh*16")
      .gain(0.35),
    // Tension arp
    note("e4 g4 b4 e5")
      .s("square")
      .fast(8)
      .gain(0.08)
      .lpf("<800 1600 2400 1200>")
      .decay(0.05)
      .sustain(0)
  ).cpm(160).play();
}
```

## Volume Mixing

Game audio should never overpower gameplay. BGM gains are lower than you think:

| Element | Gain | Notes |
|---------|------|-------|
| BGM Lead melody | 0.10-0.18 | Must not distract from gameplay |
| BGM Pad / chords | 0.08-0.15 | Background wash |
| BGM Bass | 0.15-0.22 | Foundation, felt not heard |
| BGM Drums | 0.20-0.30 | Only if game style demands it |
| BGM Arp/Texture | 0.03-0.08 | Barely audible movement |
| SFX (score, jump) | 0.2-0.3 | Should cut through BGM |
| SFX (death, hit) | 0.2-0.3 | Impactful but not ear-piercing |
| SFX (button, UI) | 0.15-0.25 | Subtle confirmation |

## Style Guidelines

### Retro / Chiptune (platformers, arcade)
- Use `square` and `triangle` oscillators
- Short `.decay()`, `.sustain(0)` for percussive feel
- `.crush(8-12)` for lo-fi crunch
- `.lpf(1000-3000)` to tame harshness
- Simple melodies: pentatonic or major scale
- Tempo: 100-140 cpm (not 160+ — that's frenetic)

### Ambient / Atmospheric (flight sims, puzzle, exploration)
- Use `sine` and `triangle` oscillators
- Long `.attack(0.3-1.0)` and `.release(1.0-2.5)`
- Heavy `.room(0.4-0.7)` and `.delay(0.2-0.5)`
- Stacked chords with `.slow(2-4)`
- Lots of rests (`~`) — silence is part of the music
- Tempo: 50-80 cpm

### Minimal / Casual (mobile games)
- Light percussion only: `s("hh*4, ~ sd")`
- Sparse melody: mostly rests
- `.gain(0.10-0.20)` — keep it very quiet
- Heavy `.room()` for space
- Tempo: 70-100 cpm

## Mute State Management

Every game with audio MUST support a mute toggle. Store `isMuted` in GameState and respect it everywhere:

```js
// AudioManager — check mute before playing BGM
playMusic(patternFn) {
  if (gameState.game.isMuted || !this.initialized) return;
  this.stopMusic();
  setTimeout(() => {
    try { this.currentMusic = patternFn(); } catch (e) { /* noop */ }
  }, 100);
}

// SFX — check mute before playing
export function scoreSfx() {
  if (gameState.game.isMuted) return;
  playNotes([659.25, 987.77], 'square', 0.12, 0.07, 0.3, 5000);
}

// AudioBridge — handle mute toggle event
eventBus.on(Events.AUDIO_TOGGLE_MUTE, () => {
  gameState.game.isMuted = !gameState.game.isMuted;
  if (gameState.game.isMuted) audioManager.stopMusic();
});
```

Wire the toggle to:
- A speaker icon button in the UI (visible on all scenes)
- The **M** key on keyboard
- Persist preference in `localStorage` if available

## Integration Checklist

1. `npm install @strudel/web`
2. Create `src/audio/AudioManager.js` — Strudel init/playMusic/stopMusic (BGM only)
3. Create `src/audio/music.js` — BGM patterns using Strudel `stack()` + `.play()`
4. Create `src/audio/sfx.js` — SFX using **Web Audio API** (oscillator + gain + filter, `.start()` + `.stop()`)
5. Create `src/audio/AudioBridge.js` — wire EventBus events to audio
6. Wire `initAudioBridge()` in `main.js`
7. Emit `AUDIO_INIT` on first user click (browser autoplay policy)
8. Emit `MUSIC_GAMEPLAY`, `MUSIC_MENU`, `MUSIC_GAMEOVER`, `MUSIC_STOP` at scene transitions
9. **Add mute toggle** — `AUDIO_TOGGLE_MUTE` event, UI button, M key shortcut
10. Test: BGM loops seamlessly, SFX fire once and stop, mute silences everything, nothing clips

## Important Notes

- **Browser autoplay**: Audio MUST be initiated from a user click/tap. Call `initStrudel()` inside a click handler.
- **`hush()` stops ALL Strudel patterns**: When switching BGM, call `hush()` then wait ~100ms before starting new pattern. SFX are unaffected since they use Web Audio API.
- **Strudel is AGPL-3.0**: Projects using `@strudel/web` must be open source under a compatible license.
- **No external audio files needed**: Everything is synthesized.
- **SFX are instant**: Web Audio API fires immediately with no scheduler latency (unlike Strudel's 50-150ms).

## References

- [Strudel Recipes](https://strudel.cc/recipes/recipes/) — code patterns for common musical goals
- [Strudel Effects](https://strudel.cc/learn/effects/) — complete effects reference
- [Strudel Synths](https://strudel.cc/learn/synths/) — oscillators, FM, wavetable, ZZFX
- [Strudel Time Modifiers](https://strudel.cc/learn/time-modifiers/) — slow, fast, early, late, linger
- [Strudel Pattern Effects](https://strudel.cc/workshop/pattern-effects/) — advanced pattern manipulation
- [Strudel in Your Project](https://strudel.cc/technical-manual/project-start/) — @strudel/web integration
- [Strudel Cheatsheet](https://eggg.uk/strudel/cheatsheet/) — community quick reference

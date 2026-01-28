---
name: game-audio
description: Game audio engineer using Strudel.cc to compose background music, menu themes, and sound effects for browser games. Use when adding music or SFX to a game.
---

# Game Audio Engineer (Strudel)

You are an expert game audio engineer. You use **Strudel.cc** — a browser-based live coding music tool — to compose background music, menu themes, and sound effects for browser games. You think in layers, loops, and game feel.

## Tech Stack

- **Audio Engine**: Strudel (`@strudel/web` npm package)
- **Synths**: Built-in oscillators (square, triangle, sawtooth, sine), FM synthesis, ZZFX (game-oriented)
- **Samples**: Built-in drum kits (TR-808, TR-909), percussion, VCSL instruments
- **Effects**: Reverb, delay, filters (LPF/HPF/BPF), distortion, bit-crush, panning
- **No external audio files needed** — all sounds are procedural or from built-in sample banks
- **Desktop app**: Strudel has a Tauri-based desktop app (`src-tauri/` in the repo) for local use without a browser
- **Node.js**: `@strudel/core` is a pure JS pattern engine that runs in Node.js. Combine with `@strudel/osc` or `@strudel/midi` for headless audio output to external synths/DAWs
- **For browser games**, use `@strudel/web` which bundles everything including Web Audio output

## Setup

### Install Strudel in a game project

```bash
npm install @strudel/web
```

### Initialize in `main.js`

Strudel must be initialized after a user interaction (browser autoplay policy). Add this to the game's entry point:

```js
import { initStrudel } from '@strudel/web';

// Initialize Strudel audio — call after first user click/tap
let strudelReady = false;
function initAudio() {
  if (strudelReady) return;
  initStrudel();
  strudelReady = true;
}

// Expose for game scenes to call
window.__INIT_AUDIO__ = initAudio;
```

### Wire into the game

Call `window.__INIT_AUDIO__()` on the first user interaction (menu tap, first flap, etc.), then use `play()` and `hush()` to control music.

## Architecture

### File Structure

```
src/
├── audio/
│   ├── AudioManager.js    # Manages BGM and SFX playback
│   ├── music.js           # Background music patterns (menu, gameplay, game over)
│   └── sfx.js             # Sound effect patterns (jump, score, death, button)
```

### AudioManager Pattern

```js
import { initStrudel } from '@strudel/web';

class AudioManager {
  constructor() {
    this.initialized = false;
    this.currentMusic = null;
  }

  init() {
    if (this.initialized) return;
    initStrudel();
    this.initialized = true;
  }

  playMusic(patternFn) {
    if (!this.initialized) return;
    this.stopMusic();
    this.currentMusic = patternFn();
  }

  stopMusic() {
    if (!this.initialized) return;
    hush(); // stops all patterns
  }

  playSfx(patternFn) {
    if (!this.initialized) return;
    patternFn();
    // SFX patterns use short envelopes and decay naturally
  }
}

export const audioManager = new AudioManager();
```

### EventBus Integration

Wire audio to game events:

```js
import { eventBus, Events } from '../core/EventBus.js';
import { audioManager } from '../audio/AudioManager.js';
import { menuTheme, gameplayBGM, gameOverTheme } from '../audio/music.js';
import { flapSfx, scoreSfx, deathSfx } from '../audio/sfx.js';

// Music transitions
eventBus.on(Events.GAME_START, () => audioManager.playMusic(gameplayBGM));
eventBus.on(Events.GAME_OVER, () => audioManager.playMusic(gameOverTheme));
eventBus.on(Events.GAME_RESTART, () => audioManager.playMusic(gameplayBGM));

// SFX
eventBus.on(Events.BIRD_FLAP, () => audioManager.playSfx(flapSfx));
eventBus.on(Events.SCORE_CHANGED, () => audioManager.playSfx(scoreSfx));
eventBus.on(Events.BIRD_DIED, () => audioManager.playSfx(deathSfx));
```

## Strudel Quick Reference

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
| `square` | Classic 8-bit / chiptune | Melodies, leads, retro SFX |
| `triangle` | Soft, muted | Bass lines, subtle pads |
| `sawtooth` | Bright, buzzy | Aggressive leads, stabs |
| `sine` | Pure tone | Sub-bass, gentle melodies |

### Key Effects

```js
.gain(0.5)          // Volume (0-1+)
.lpf(800)           // Low-pass filter cutoff Hz
.hpf(200)           // High-pass filter cutoff Hz
.room(0.3)          // Reverb send (0-1)
.delay(0.2)         // Delay send (0-1)
.delaytime(0.375)   // Delay time in seconds
.crush(8)           // Bit crush (1-16, lower = crunchier)
.distort(2)         // Distortion amount
.pan(0.3)           // Stereo pan (0=L, 0.5=C, 1=R)
.attack(0.01)       // ADSR attack time
.decay(0.2)         // ADSR decay time
.sustain(0)         // ADSR sustain level (0 = percussive)
.release(0.1)       // ADSR release time
.speed(-1)          // Reverse playback
.fast(2)            // Double speed
.slow(2)            // Half speed
.cpm(120)           // Cycles per minute (tempo)
```

### FM Synthesis (for metallic/bell sounds)

```js
note("c4").s("sine")
  .fm(4)        // Modulation index (brightness)
  .fmh(2)       // Harmonicity (whole = natural, fractional = metallic)
  .fmdecay(0.5) // FM envelope decay
```

## Music Patterns for Games

### Chiptune Gameplay BGM

```js
export function gameplayBGM() {
  return stack(
    // Lead melody — square wave, classic 8-bit
    note("c4 e4 g4 e4 c4 d4 e4 c4")
      .s("square")
      .gain(0.35)
      .lpf(2500)
      .decay(0.12)
      .sustain(0.3),
    // Bass — triangle wave, steady pulse
    note("c2 c2 g2 g2 f2 f2 c2 c2")
      .s("triangle")
      .gain(0.45),
    // Drums — minimal kit
    s("bd ~ sd ~, hh*8")
      .gain(0.5),
    // Arpeggio accent — adds movement
    note("c3 e3 g3 c4")
      .s("square")
      .fast(4)
      .gain(0.15)
      .lpf(1200)
      .decay(0.08)
      .sustain(0)
  ).cpm(140).play();
}
```

### Menu Theme (ambient, gentle)

```js
export function menuTheme() {
  return stack(
    // Pad — stacked chords with slow attack
    note("<c3,e3,g3> <a2,c3,e3> <f2,a2,c3> <g2,b2,d3>")
      .s("sine")
      .attack(0.5)
      .release(1)
      .gain(0.25)
      .room(0.5)
      .roomsize(4),
    // Melodic texture — delayed triangle arps
    note("c5 e5 g5 b5")
      .s("triangle")
      .slow(4)
      .gain(0.12)
      .delay(0.4)
      .delaytime(0.375)
      .delayfeedback(0.5),
    // Gentle pulse
    note("c2 ~ g2 ~")
      .s("triangle")
      .gain(0.2)
      .slow(2)
  ).slow(2).cpm(80).play();
}
```

### Game Over Theme (somber, short)

```js
export function gameOverTheme() {
  return stack(
    // Descending melody
    note("e4 d4 c4 b3 a3 ~ ~ ~")
      .s("triangle")
      .gain(0.3)
      .decay(0.4)
      .sustain(0.2)
      .room(0.4),
    // Low pad
    note("a2,c3,e3")
      .s("sine")
      .attack(0.3)
      .release(2)
      .gain(0.2)
      .room(0.6)
  ).slow(2).cpm(60).play();
}
```

### Intense/Boss Theme

```js
export function bossTheme() {
  return stack(
    // Aggressive lead — sawtooth with filter
    note("e3 e3 g3 a3 e3 e3 b3 a3")
      .s("sawtooth")
      .gain(0.3)
      .lpf(1800)
      .decay(0.1)
      .sustain(0.4),
    // Heavy bass
    note("e1 e1 e1 g1 a1 a1 e1 e1")
      .s("sawtooth")
      .gain(0.4)
      .lpf(400)
      .distort(1.5),
    // Fast drums
    s("bd bd sd bd, hh*16")
      .gain(0.6),
    // Tension arp
    note("e4 g4 b4 e5")
      .s("square")
      .fast(8)
      .gain(0.12)
      .lpf("<800 1600 2400 1200>")
      .decay(0.05)
      .sustain(0)
  ).cpm(160).play();
}
```

## Sound Effects for Games

Design SFX with **very short envelopes** (`.sustain(0)`) so they decay naturally within one cycle.

### Common Game SFX

```js
// Flap / Jump — quick upward pitch sweep
export function flapSfx() {
  note("c4").s("square")
    .penv(8).pdecay(0.1)
    .decay(0.12).sustain(0).gain(0.3)
    .lpf(3000).play();
}

// Score / Coin — bright two-tone ding
export function scoreSfx() {
  note("e5 b5").s("square")
    .fast(6).decay(0.1).sustain(0).gain(0.4)
    .lpf(4000).play();
}

// Death / Fail — descending crushed notes
export function deathSfx() {
  note("g4 e4 c4 a3").s("square")
    .fast(3).decay(0.2).sustain(0)
    .crush(8).gain(0.35).play();
}

// Button Click — short noise burst
export function clickSfx() {
  s("white").decay(0.02).sustain(0)
    .lpf(4000).gain(0.25).play();
}

// Power Up — ascending arpeggio
export function powerUpSfx() {
  note("c4 e4 g4 c5 e5").s("square")
    .fast(5).decay(0.12).sustain(0)
    .gain(0.35).lpf(5000).play();
}

// Whoosh — filtered noise sweep
export function whooshSfx() {
  s("white").hpf(1000).lpf(8000)
    .decay(0.25).sustain(0).gain(0.2)
    .pan(sine).play();
}

// Hit / Damage — distorted low thump
export function hitSfx() {
  note("c2").s("square")
    .fm(2).fmh(0.5).fmdecay(0.1)
    .decay(0.15).sustain(0)
    .distort(3).gain(0.3).play();
}

// Menu Select — soft confirmation tone
export function selectSfx() {
  note("c5").s("sine")
    .decay(0.2).sustain(0)
    .gain(0.3).room(0.2).play();
}
```

## Style Guidelines

### Retro / Chiptune (Flappy Bird, platformers)
- Use `square` and `triangle` oscillators
- Short `.decay()`, `.sustain(0)` for percussive feel
- `.crush(8-12)` for lo-fi crunch
- `.lpf(1000-3000)` to tame harshness
- Simple melodies: pentatonic or major scale
- Tempo: 120-160 cpm

### Ambient / Atmospheric (puzzle games, menus)
- Use `sine` oscillators
- Long `.attack()` and `.release()`
- Heavy `.room()` and `.delay()`
- Stacked chords with `.slow(4-8)`
- Tempo: 60-80 cpm

### Intense / Action (boss fights, racing)
- Use `sawtooth` with `.lpf()` sweeps
- `.distort()` on bass
- Fast drums: `s("bd bd sd bd, hh*16")`
- `.every(4, fast(2))` for variation
- Tempo: 140-180 cpm

### Minimal / Casual (mobile games)
- Light percussion only: `s("hh*4, ~ sd")`
- Sparse melody: mostly rests
- `.gain(0.2-0.3)` — keep it quiet
- Heavy `.room()` for space
- Tempo: 90-110 cpm

## Volume Mixing

Game audio should never overpower gameplay. Use these gain levels as defaults:

| Element | Gain |
|---------|------|
| BGM Lead | 0.25-0.35 |
| BGM Bass | 0.3-0.45 |
| BGM Drums | 0.4-0.5 |
| BGM Arp/Texture | 0.10-0.15 |
| SFX (score, jump) | 0.3-0.4 |
| SFX (death, hit) | 0.3-0.35 |
| SFX (button, UI) | 0.2-0.25 |

## Integration Checklist

1. `npm install @strudel/web`
2. Create `src/audio/AudioManager.js` with init/play/stop
3. Create `src/audio/music.js` with BGM patterns for each scene
4. Create `src/audio/sfx.js` with SFX patterns for each event
5. Wire AudioManager to EventBus events
6. Call `audioManager.init()` on first user interaction
7. Add audio events to `EventBus.js` if needed (`MUSIC_START`, `MUSIC_STOP`)
8. Add volume/mute config to `Constants.js`
9. Test: music loops seamlessly, SFX are responsive, nothing clips

## Important Notes

- **Browser autoplay**: Audio MUST be initiated from a user click/tap. Always call `initStrudel()` inside a click handler.
- **`hush()` stops everything**: When switching BGM, `hush()` kills all patterns including SFX. For independent control, use `.orbit(n)` to separate BGM and SFX buses, or time SFX to play after the new BGM starts.
- **SFX latency**: Strudel's scheduler has ~50-150ms latency. For frame-precise SFX, consider using the Web Audio API directly for critical sounds.
- **License**: Strudel is AGPL-3.0. Projects using it must be open source under a compatible license.
- **No external audio files needed**: Everything is synthesized or uses built-in sample banks.

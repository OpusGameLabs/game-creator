# Strudel Quick Reference (for BGM only)

Reference for Strudel mini-notation syntax, synth oscillators, effects, and advanced patterns. Used when composing background music with `@strudel/web`.

## Core Pattern Syntax

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

## Mini-Notation Cheat Sheet

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

## Synth Oscillators

| Name | Sound | Game Use |
|------|-------|----------|
| `square` | Classic 8-bit / chiptune | Melodies, leads |
| `triangle` | Soft, muted | Bass lines, subtle pads |
| `sawtooth` | Bright, buzzy | Aggressive leads, stabs |
| `sine` | Pure tone | Sub-bass, gentle melodies, pads |

## Key Effects

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

## FM Synthesis (for metallic/bell sounds)

```js
note("c4").s("sine")
  .fm(4)         // Modulation index (brightness)
  .fmh(2)        // Harmonicity (whole = natural, fractional = metallic)
  .fmdecay(0.5)  // FM envelope decay
```

## Filter Envelopes

```js
// Autopilot filter sweep — opens/closes filter over time
note("g1 bb1 <c2 eb2> d2").s("sawtooth")
  .lpf(400).lpenv(4)

// With resonance peak
note("g1 bb1 <c2 eb2> d2").s("sawtooth")
  .lpq(8).lpf(400).lpa(.1).lpd(.1).lpenv(4)
```

## Chorus / Detune (for fatter sounds)

```js
// Layer a detuned copy — instant width
note("<g1 bb1 d2 f1>").add(note("0,.1")).s("sawtooth")
```

## Reverb Variations

```js
.room(0.5)                     // Standard reverb send
.room(0.5).roomsize(4)         // Large room
.room(0.5).rlp(5000)           // Reverb with lowpass
.room(0.5).rlp(5000).rfade(4)  // Reverb with lowpass fade
```

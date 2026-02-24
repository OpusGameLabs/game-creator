# BGM Patterns for Games

Genre-specific background music patterns using Strudel. Each pattern uses `stack()` to layer instruments and `.play()` to start the loop.

## Background music should FEEL like background

The #1 mistake is making BGM too loud, dense, or aggressive. Players need to focus on gameplay, not the soundtrack. Follow these principles:

- **Use rests (`~`) liberally** — silence is part of the music
- **Keep gains low** — lead melody at 0.10-0.18, pads at 0.08-0.15
- **Prefer sine and triangle** over square for calmer feel
- **Use `.slow(2-4)`** to stretch patterns and create breathing room
- **Add `.room()` and `.delay()`** — reverb/delay fill space without density
- **Avoid drums for most game types** — if drums are needed, keep gain under 0.3

## Anti-Repetition (CRITICAL)

The #2 mistake is writing short patterns that sound identical every cycle. A 16-step pattern at 120 cpm loops every ~8 seconds — players hear the same thing 7+ times per minute. Use these techniques on EVERY BGM pattern:

### Cycle alternation — `<[phrase1] [phrase2] [phrase3]>`
Write 3-4 melodic variations that rotate each cycle. This multiplies your effective loop length:

```js
// 4 alternating melodies = 4x longer before repeating
note('<[e3 ~ g3 a3 ~ ~ g3 ~] [g3 ~ a3 b3 ~ ~ a3 ~] [a3 ~ g3 e3 ~ ~ d3 ~] [b3 ~ a3 g3 ~ ~ e3 ~]>')
```

### Layer phasing — different `.slow()` per layer
When layers cycle at different speeds, they combine differently each pass:
```js
// Melody: 1 cycle, Counter: 1.5 cycles, Pad: 4 cycles, Texture: 3 cycles
// = ~12 cycles before exact realignment
melody,                           // default speed
counterMelody.slow(1.5),          // phased
padChords.slow(4),                // very slow
atmosphericTexture.slow(3),       // different phase
```

### Probabilistic notes — `?` suffix
Notes with `?` play 50% of the time, creating organic variation each loop:
```js
note('b4 ~ ~ ~ e5? ~ ~ ~ g4? ~ ~ ~ a4? ~ ~ ~')
```

### Filter cycling — `<value1 value2 ...>`
Change timbre across cycles:
```js
.lpf('<1200 800 1600 1000>')  // brightness shifts each cycle
```

**Rule of thumb**: Effective loop length should be 30+ seconds before exact repetition. Apply ALL of these techniques, not just one.

## Ambient / Atmospheric BGM (flight sims, exploration, puzzle)

```js
export function gameplayBGM() {
  return stack(
    // Melody — 3 alternating phrases, gentle sine, lots of rests
    note('<[e4 ~ g4 ~ a4 ~ ~ ~ b4 ~ a4 ~ g4 ~ e4 ~] [g4 ~ a4 ~ b4 ~ ~ ~ a4 ~ g4 ~ e4 ~ ~ ~] [b4 ~ a4 ~ g4 ~ ~ ~ e4 ~ g4 ~ a4 ~ g4 ~]>')
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
    // Pad — 4-chord progression on slow cycle (phases against melody)
    note('<e3,g3,b3> <e3,g3,b3> <a2,c3,e3> <a2,c3,e3> <d3,f3,a3> <d3,f3,a3> <g2,b2,d3> <g2,b2,d3>')
      .s('sine')
      .attack(0.6)
      .release(1.5)
      .gain(0.1)
      .room(0.5)
      .roomsize(4)
      .lpf(1600)
      .slow(4),
    // Bass — 2 alternating root progressions
    note('<[e2 ~ ~ ~ a2 ~ ~ ~ d2 ~ ~ ~ g2 ~ ~ ~] [a2 ~ ~ ~ d2 ~ ~ ~ g2 ~ ~ ~ c2 ~ ~ ~]>')
      .s('triangle')
      .gain(0.16)
      .lpf(500)
      .slow(2),
    // Texture — probabilistic notes with delay, on its own slow cycle
    note('e4? g4 b4? e5')
      .s('triangle')
      .fast(2)
      .gain(0.04)
      .lpf('<1200 900 1500 1100>')
      .decay(0.15)
      .sustain(0)
      .room(0.6)
      .delay(0.3)
      .delaytime(0.375)
      .delayfeedback(0.4)
      .slow(3)
  ).cpm(75).play();
}
```

## Chiptune BGM (platformers, arcade — keep it moderate)

```js
export function gameplayBGM() {
  return stack(
    // Lead — 4 alternating phrases for variety
    note('<[c4 e4 g4 e4 c4 d4 e4 c4] [e4 g4 c5 g4 e4 f4 g4 e4] [g4 e4 c4 d4 e4 c4 g3 c4] [c4 d4 e4 g4 e4 d4 c4 d4]>')
      .s("square")
      .gain(0.18)
      .lpf(2200)
      .decay(0.12)
      .sustain(0.25),
    // Counter melody — 2 alternating phrases, offset timing
    note('<[~ c5 ~ ~ ~ e5 ~ ~] [~ ~ e5 ~ ~ ~ c5 ~]>')
      .s("square")
      .gain(0.08)
      .lpf(3000)
      .decay(0.15)
      .sustain(0)
      .slow(1.5),
    // Bass — 3 root progressions
    note('<[c2 c2 g2 g2 f2 f2 c2 c2] [a1 a1 e2 e2 f2 f2 g2 g2] [f2 f2 c2 c2 g2 g2 c2 c2]>')
      .s("triangle")
      .gain(0.22)
      .lpf(500),
    // Synth drums — 2 alternating kick patterns
    note('<[c1 ~ c1 ~ c1 c1 ~ ~ c1 ~ c1 ~ c1 ~ c1 ~] [c1 c1 ~ ~ c1 ~ c1 ~ ~ c1 ~ c1 c1 ~ ~ c1]>')
      .s("sine")
      .gain(0.28)
      .decay(0.12)
      .sustain(0)
      .lpf(200),
    // Arp accent — filter cycles for timbral shift
    note("c3 e3 g3 c4")
      .s("square")
      .fast(4)
      .gain(0.05)
      .lpf('<1000 700 1400 900>')
      .decay(0.06)
      .sustain(0)
  ).cpm(130).play();
}
```

## Menu Theme (ambient, gentle — only add if the game has a title screen)

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

## Game Over Theme (somber)

```js
export function gameOverTheme() {
  return stack(
    // Descending melody — 3 variations
    note('<[b4 ~ a4 ~ g4 ~ e4 ~ d4 ~ c4 ~ ~ ~ ~ ~] [e4 ~ d4 ~ c4 ~ b3 ~ a3 ~ g3 ~ ~ ~ ~ ~] [g4 ~ e4 ~ d4 ~ c4 ~ e4 ~ d4 ~ b3 ~ ~ ~]>')
      .s('triangle')
      .gain(0.18)
      .decay(0.6)
      .sustain(0.1)
      .release(1.0)
      .room(0.6)
      .roomsize(5)
      .lpf(1800),
    // Dark pad — alternating chords on slow cycle
    note('<[a2,c3,e3] [d2,f2,a2] [e2,g2,b2]>')
      .s('sine')
      .attack(0.5)
      .release(2.5)
      .gain(0.12)
      .room(0.7)
      .roomsize(6)
      .lpf(1200)
      .slow(2),
    // Ghostly high texture — probabilistic, phased
    note('~ ~ ~ ~ ~ e5? ~ ~ ~ ~ ~ ~ ~ b4? ~ ~')
      .s('sine')
      .gain(0.03)
      .delay(0.5)
      .delaytime(0.6)
      .delayfeedback(0.5)
      .room(0.7)
      .lpf(2000)
      .slow(3)
  ).slow(3).cpm(50).play();
}
```

## Intense / Boss Theme

```js
export function bossTheme() {
  return stack(
    // Aggressive lead — 3 alternating riffs
    note('<[e3 e3 g3 a3 e3 e3 b3 a3] [e3 g3 a3 b3 a3 g3 e3 g3] [b3 a3 g3 e3 g3 a3 b3 a3]>')
      .s("sawtooth")
      .gain(0.2)
      .lpf(1800)
      .decay(0.1)
      .sustain(0.4),
    // Heavy bass — 2 alternating lines
    note('<[e1 e1 e1 g1 a1 a1 e1 e1] [a1 a1 g1 e1 e1 g1 a1 a1]>')
      .s("sawtooth")
      .gain(0.25)
      .lpf(400)
      .distort(1.5),
    // Synth drums — 2 alternating patterns
    note('<[c1 c1 ~ c1 c1 ~ c1 ~] [c1 ~ c1 c1 ~ c1 ~ c1]>')
      .s("sine")
      .gain(0.35)
      .decay(0.12)
      .sustain(0)
      .lpf(200),
    // Tension arp — filter cycling for movement
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

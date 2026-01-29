import { stack, note, s } from '@strudel/web';

// Menu theme — ambient, airy, open sky atmosphere
// Slow evolving pads with heavy reverb, no drums
export function menuTheme() {
  return stack(
    // Wide pad — open voicings, slow swell
    note('<c3,g3,b3> <a2,e3,a3> <f2,c3,f3> <g2,d3,g3>')
      .s('sine')
      .attack(1.0)
      .release(2.0)
      .gain(0.15)
      .room(0.7)
      .roomsize(6)
      .lpf(1800)
      .slow(2),
    // High shimmer — sparse delayed notes
    note('~ g5 ~ ~ ~ e5 ~ ~')
      .s('triangle')
      .slow(4)
      .gain(0.06)
      .delay(0.5)
      .delaytime(0.6)
      .delayfeedback(0.55)
      .room(0.5)
      .lpf(2500),
    // Sub bass — very sparse, grounding
    note('c2 ~ ~ ~ ~ ~ g1 ~')
      .s('sine')
      .gain(0.12)
      .slow(4)
      .lpf(300)
  ).slow(2).cpm(60).play();
}

// Gameplay BGM — calm, flowing flight music
// Gentle sine/triangle melody, no drums, light arpeggios
// Feels like soaring through clouds, not an arcade machine
export function gameplayBGM() {
  return stack(
    // Melody — gentle sine, wide intervals, lots of space
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
    // Pad — warm sustained chords, evolving
    note('<e3,g3,b3> <e3,g3,b3> <a2,c3,e3> <a2,c3,e3> <d3,f3,a3> <d3,f3,a3> <g2,b2,d3> <g2,b2,d3>')
      .s('sine')
      .attack(0.6)
      .release(1.5)
      .gain(0.1)
      .room(0.5)
      .roomsize(4)
      .lpf(1600)
      .slow(2),
    // Bass — triangle, slow steady pulse
    note('e2 ~ ~ ~ a2 ~ ~ ~ d2 ~ ~ ~ g2 ~ ~ ~')
      .s('triangle')
      .gain(0.16)
      .lpf(500)
      .slow(2),
    // Arpeggio texture — very quiet, background movement
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

// Game over theme — somber, reflective, sparse
export function gameOverTheme() {
  return stack(
    // Descending melody — slow, sad
    note('b4 ~ a4 ~ g4 ~ e4 ~ d4 ~ c4 ~ ~ ~ ~ ~')
      .s('triangle')
      .gain(0.18)
      .decay(0.6)
      .sustain(0.1)
      .release(1.0)
      .room(0.6)
      .roomsize(5)
      .lpf(1800),
    // Low pad — minor chord, dark
    note('a2,c3,e3')
      .s('sine')
      .attack(0.5)
      .release(2.5)
      .gain(0.12)
      .room(0.7)
      .roomsize(6)
      .lpf(1200),
    // Sub — very quiet
    note('a1 ~ ~ ~ ~ ~ ~ ~')
      .s('sine')
      .gain(0.1)
      .lpf(250)
      .slow(4)
  ).slow(3).cpm(50).play();
}

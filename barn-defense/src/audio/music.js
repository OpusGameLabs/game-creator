// =============================================================================
// Barn Defense - BGM (Background Music)
// Farm-themed music patterns using Strudel.cc.
// Each function returns stack(...).cpm(N).play().
// =============================================================================

import { stack, note, s } from '@strudel/web';

/**
 * Menu Theme - Gentle, pastoral evening on the farm.
 * Sine/triangle pads, slow tempo, C/F/G/Am chords with reverb and delay.
 */
export function menuTheme() {
  return stack(
    // Warm pad chords: C -> F -> G -> Am
    note('<c3,e3,g3> <f3,a3,c4> <g3,b3,d4> <a3,c4,e4>')
      .s('sine')
      .attack(1.2)
      .release(2.0)
      .gain(0.12)
      .room(0.8)
      .roomsize(7)
      .lpf(1600)
      .slow(2),
    // Gentle melodic sparkle - pentatonic hints
    note('~ g4 ~ e4 ~ ~ c5 ~')
      .s('triangle')
      .slow(4)
      .gain(0.06)
      .delay(0.45)
      .delaytime(0.5)
      .delayfeedback(0.5)
      .room(0.6)
      .lpf(2200),
    // Deep bass root notes
    note('c2 ~ ~ ~ f2 ~ ~ ~ g2 ~ ~ ~ a2 ~ ~ ~')
      .s('sine')
      .gain(0.1)
      .slow(4)
      .lpf(280),
    // Distant cricket-like high sine pings
    note('~ ~ ~ e6 ~ ~ ~ ~ ~ ~ g6 ~ ~ ~ ~ ~')
      .s('sine')
      .gain(0.03)
      .slow(4)
      .delay(0.6)
      .delaytime(0.7)
      .delayfeedback(0.4)
      .room(0.9)
      .roomsize(8)
      .lpf(4000)
  ).slow(2).cpm(65).play();
}

/**
 * Gameplay BGM - Moderate energy country/folk feel.
 * Square wave lead for chiptune feel, triangle bass, light percussion.
 * Gains kept LOW to avoid distracting from gameplay.
 */
export function gameplayBGM() {
  return stack(
    // Chiptune lead melody - bouncy folk tune in C major
    note('c4 e4 g4 e4 f4 a4 g4 e4')
      .s('square')
      .gain(0.12)
      .lpf(2000)
      .decay(0.12)
      .sustain(0.2),
    // Counter melody - responds to lead
    note('~ g4 ~ ~ ~ c5 ~ ~')
      .s('square')
      .gain(0.05)
      .lpf(2500)
      .decay(0.1)
      .sustain(0),
    // Walking bass line - country feel
    note('c2 c2 g2 g2 f2 f2 e2 g2')
      .s('triangle')
      .gain(0.16)
      .lpf(450),
    // Light drum pattern - kick and snare with hihats
    s('bd ~ sd ~, hh*8')
      .gain(0.2),
    // Rhythmic chordal stabs (banjo-like)
    note('~ c4,e4 ~ c4,e4 ~ f4,a4 ~ g4,b4')
      .s('square')
      .gain(0.04)
      .lpf(1200)
      .decay(0.06)
      .sustain(0)
  ).cpm(110).play();
}

/**
 * Game Over Theme - Somber, descending, minor key.
 * Triangle waves, heavy reverb, slow tempo. Dark pad underneath.
 */
export function gameOverTheme() {
  return stack(
    // Descending somber melody in A minor
    note('e4 ~ d4 ~ c4 ~ b3 ~ a3 ~ ~ ~ ~ ~ ~ ~')
      .s('triangle')
      .gain(0.16)
      .decay(0.7)
      .sustain(0.1)
      .release(1.2)
      .room(0.7)
      .roomsize(6)
      .lpf(1600),
    // Dark minor pad: Am chord
    note('a2,c3,e3')
      .s('sine')
      .attack(0.6)
      .release(2.5)
      .gain(0.1)
      .room(0.8)
      .roomsize(7)
      .lpf(1000),
    // Low ominous drone
    note('a1')
      .s('sine')
      .gain(0.08)
      .attack(1.0)
      .release(3.0)
      .lpf(200)
      .room(0.5)
  ).slow(3).cpm(50).play();
}

/**
 * Level Complete Theme - Triumphant, major key, celebratory.
 * Ascending patterns, brighter than menu, moderate tempo.
 */
export function levelCompleteTheme() {
  return stack(
    // Triumphant ascending melody
    note('c4 e4 g4 c5 ~ e5 g5 c6 ~ ~ ~ ~ ~ ~ ~ ~')
      .s('triangle')
      .gain(0.18)
      .decay(0.3)
      .sustain(0.3)
      .release(0.8)
      .room(0.6)
      .roomsize(5)
      .lpf(3000),
    // Bright major chord pad: C -> G -> Am -> F
    note('<c3,e3,g3> <g3,b3,d4> <a3,c4,e4> <f3,a3,c4>')
      .s('sine')
      .attack(0.8)
      .release(1.5)
      .gain(0.1)
      .room(0.7)
      .roomsize(6)
      .lpf(2000)
      .slow(2),
    // Celebratory bass
    note('c2 g2 a2 f2')
      .s('triangle')
      .gain(0.12)
      .lpf(400)
      .slow(2),
    // Sparkle arpeggios
    note('e5 g5 c6 g5 e5 c5 g4 c5')
      .s('sine')
      .gain(0.04)
      .delay(0.4)
      .delaytime(0.3)
      .delayfeedback(0.4)
      .room(0.5)
      .lpf(4000)
  ).cpm(80).play();
}

// BGM patterns — Strudel (@strudel/web)
// Dark electronic / synthwave theme for Matrix-style endless runner
import { stack, note, s } from '@strudel/web';

/**
 * Gameplay BGM — dark synthwave, ~140 cpm
 * Pulsing bass, sparse sawtooth lead, minor pads, electronic drums,
 * and a fast filtered arpeggio for "digital data stream" texture.
 */
export function gameplayBGM() {
  return stack(
    // Bass — deep sawtooth, pulsing E minor pattern, low-pass filtered
    note('e1 e1 ~ e1 g1 g1 ~ g1 e1 e1 ~ e1 a1 a1 ~ g1')
      .s('sawtooth')
      .gain(0.18)
      .lpf(400)
      .decay(0.15)
      .sustain(0.4)
      .release(0.1),

    // Lead — sawtooth melody with filter sweep, sparse with rests (E minor scale)
    note('~ e4 ~ g4 ~ ~ b4 ~ ~ a4 ~ ~ g4 ~ e4 ~')
      .s('sawtooth')
      .gain(0.14)
      .lpf(2400)
      .attack(0.05)
      .decay(0.3)
      .sustain(0.2)
      .release(0.5)
      .room(0.4)
      .roomsize(3)
      .delay(0.25)
      .delaytime(0.375)
      .delayfeedback(0.35),

    // Pad — slow attack sine chords, minor, reverb-heavy
    note('<e2,g2,b2> <e2,g2,b2> <c2,e2,g2> <c2,e2,g2> <a1,c2,e2> <a1,c2,e2> <e2,g2,b2> <e2,g2,b2>')
      .s('sine')
      .attack(0.8)
      .release(2.0)
      .gain(0.10)
      .room(0.6)
      .roomsize(5)
      .lpf(1200)
      .slow(2),

    // Drums — electronic kick + hi-hat pattern
    s('bd bd ~ bd, hh*8')
      .gain(0.25),

    // Arp — fast 16th note square wave arpeggio cycling E minor, very quiet + filtered + crushed
    note('e4 g4 b4 e5 b4 g4 e4 b3')
      .s('square')
      .fast(4)
      .gain(0.05)
      .lpf(1800)
      .decay(0.05)
      .sustain(0)
      .crush(10)
      .room(0.3)
      .delay(0.15)
      .delaytime(0.25)
      .delayfeedback(0.3)
  ).cpm(140).play();
}

/**
 * Game Over BGM — glitchy, somber, ~50 cpm
 * Descending minor melody on triangle, dark sine pad, no drums.
 * Atmospheric system-failure feel.
 */
export function gameOverBGM() {
  return stack(
    // Descending minor melody — triangle, lots of rests, reverb
    note('b4 ~ ~ a4 ~ ~ g4 ~ ~ e4 ~ ~ d4 ~ ~ ~')
      .s('triangle')
      .gain(0.18)
      .decay(0.6)
      .sustain(0.1)
      .release(1.2)
      .room(0.7)
      .roomsize(6)
      .lpf(1600),

    // Dark pad — low sine chords with long attack
    note('<e2,g2,b2> <c2,e2,g2>')
      .s('sine')
      .attack(1.0)
      .release(3.0)
      .gain(0.10)
      .room(0.8)
      .roomsize(8)
      .lpf(800)
      .slow(2)
  ).slow(2).cpm(50).play();
}

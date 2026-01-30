import { stack, note, s } from '@strudel/web';

export function menuTheme() {
  return stack(
    // Dark pad — minor chords
    note('<a2,c3,e3> <f2,a2,c3> <d2,f2,a2> <e2,g2,b2>')
      .s('sine')
      .attack(0.8)
      .release(2.0)
      .gain(0.14)
      .room(0.6)
      .roomsize(5)
      .lpf(1400)
      .slow(2),
    // Eerie shimmer
    note('~ e5 ~ ~ ~ c5 ~ ~')
      .s('triangle')
      .slow(4)
      .gain(0.05)
      .delay(0.4)
      .delaytime(0.5)
      .delayfeedback(0.5)
      .room(0.5)
      .lpf(2000),
    // Sub bass
    note('a1 ~ ~ ~ f1 ~ ~ ~')
      .s('sine')
      .gain(0.15)
      .slow(4)
      .lpf(250)
  ).slow(2).cpm(70).play();
}

export function gameplayBGM() {
  return stack(
    // Aggressive lead
    note("a3 c4 e4 a3 g3 a3 c4 e4")
      .s("sawtooth")
      .gain(0.12)
      .lpf(1800)
      .decay(0.1)
      .sustain(0.3),
    // Bass line — driving
    note("a1 a1 f1 f1 d1 d1 e1 e1")
      .s("sawtooth")
      .gain(0.2)
      .lpf(400)
      .distort(0.5),
    // Drums — intense
    s("bd bd sd bd, hh*8")
      .gain(0.28),
    // Tension arp
    note("a3 c4 e4 a4")
      .s("square")
      .fast(4)
      .gain(0.05)
      .lpf("<600 1200 1800 900>")
      .decay(0.05)
      .sustain(0)
  ).cpm(140).play();
}

export function gameOverTheme() {
  return stack(
    note('e4 ~ d4 ~ c4 ~ a3 ~ g3 ~ ~ ~ ~ ~ ~ ~')
      .s('triangle')
      .gain(0.16)
      .decay(0.6)
      .sustain(0.1)
      .release(1.0)
      .room(0.7)
      .roomsize(6)
      .lpf(1600),
    note('a2,c3,e3')
      .s('sine')
      .attack(0.5)
      .release(2.5)
      .gain(0.11)
      .room(0.7)
      .roomsize(6)
      .lpf(1000)
  ).slow(3).cpm(50).play();
}

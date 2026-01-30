import { stack, note, s } from '@strudel/web';

export function menuTheme() {
  return stack(
    note('<c3,g3,b3> <a2,e3,a3> <f2,c3,f3> <g2,d3,g3>')
      .s('sine')
      .attack(1.0)
      .release(2.0)
      .gain(0.15)
      .room(0.7)
      .roomsize(6)
      .lpf(1800)
      .slow(2),
    note('~ g5 ~ ~ ~ e5 ~ ~')
      .s('triangle')
      .slow(4)
      .gain(0.06)
      .delay(0.5)
      .delaytime(0.6)
      .delayfeedback(0.55)
      .room(0.5)
      .lpf(2500),
    note('c2 ~ ~ ~ ~ ~ g1 ~')
      .s('sine')
      .gain(0.12)
      .slow(4)
      .lpf(300)
  ).slow(2).cpm(100).play();
}

export function gameplayBGM() {
  return stack(
    note('c4 e4 g4 e4 c4 d4 e4 c4')
      .s('square')
      .gain(0.14)
      .lpf(2200)
      .decay(0.12)
      .sustain(0.25),
    note('~ c5 ~ ~ ~ e5 ~ ~')
      .s('square')
      .gain(0.06)
      .lpf(3000)
      .decay(0.15)
      .sustain(0),
    note('c2 c2 g2 g2 f2 f2 c2 c2')
      .s('triangle')
      .gain(0.18)
      .lpf(500),
    s('bd ~ sd ~, hh*8')
      .gain(0.22),
    note('c3 e3 g3 c4')
      .s('square')
      .fast(4)
      .gain(0.04)
      .lpf(1000)
      .decay(0.06)
      .sustain(0)
  ).cpm(130).play();
}

export function gameOverTheme() {
  return stack(
    note('b4 ~ a4 ~ g4 ~ e4 ~ d4 ~ c4 ~ ~ ~ ~ ~')
      .s('triangle')
      .gain(0.18)
      .decay(0.6)
      .sustain(0.1)
      .release(1.0)
      .room(0.6)
      .roomsize(5)
      .lpf(1800),
    note('a2,c3,e3')
      .s('sine')
      .attack(0.5)
      .release(2.5)
      .gain(0.12)
      .room(0.7)
      .roomsize(6)
      .lpf(1200)
  ).slow(3).cpm(60).play();
}

import { stack, note, s } from '@strudel/web';

// Background music patterns for Flappy Bird
// Style: chiptune / retro 8-bit

export function menuTheme() {
  return stack(
    // Chiptune melody — bouncy square wave
    note("c4 e4 g4 e4 f4 a4 g4 e4")
      .s("square")
      .gain(0.2)
      .lpf(2000)
      .decay(0.12)
      .sustain(0.2),
    // Bass — triangle pulse
    note("c2 c3 g2 g3 f2 f3 c2 c3")
      .s("triangle")
      .gain(0.25)
      .lpf(600),
    // Light hi-hat groove
    s("~ hh ~ hh, ~ ~ bd ~")
      .gain(0.25)
  ).cpm(100).play();
}

export function gameplayBGM() {
  return stack(
    // Lead melody — square wave, upbeat 8-bit
    note("e4 g4 a4 g4 e4 d4 e4 c4")
      .s("square")
      .gain(0.22)
      .lpf(2200)
      .decay(0.1)
      .sustain(0.25),
    // Counter melody — higher register, sparse
    note("~ c5 ~ ~ ~ e5 ~ ~")
      .s("square")
      .gain(0.1)
      .lpf(3000)
      .decay(0.15)
      .sustain(0),
    // Bass — triangle, driving
    note("c2 c2 g2 g2 a2 a2 g2 g2")
      .s("triangle")
      .gain(0.3)
      .lpf(500),
    // Drums — tight kit
    s("bd ~ sd ~, hh*8")
      .gain(0.35),
    // Arp shimmer
    note("c3 e3 g3 c4")
      .s("square")
      .fast(4)
      .gain(0.07)
      .lpf(1000)
      .decay(0.06)
      .sustain(0)
  ).cpm(130).play();
}

export function gameOverTheme() {
  return stack(
    // Descending melody — somber square
    note("e4 d4 c4 b3 a3 ~ ~ ~")
      .s("square")
      .gain(0.2)
      .decay(0.3)
      .sustain(0.1)
      .lpf(1500),
    // Low bass
    note("a2 ~ ~ ~ c3 ~ ~ ~")
      .s("triangle")
      .gain(0.2)
      .lpf(400)
  ).slow(2).cpm(60).play();
}

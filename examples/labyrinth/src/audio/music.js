import { stack, note, s } from '@strudel/web';

// Gameplay BGM — chill ambient puzzle music, slow and mellow
// Long evolving phrases so it doesn't feel repetitive
export function gameplayBGM() {
  return stack(
    // Melody — gentle sine arpeggios, 16-step phrases across two octaves
    note('a3 ~ c4 ~ e4 ~ d4 ~ c4 ~ a3 ~ g3 ~ a3 ~  e3 ~ g3 ~ a3 ~ c4 ~ d4 ~ e4 ~ c4 ~ a3 ~')
      .s('sine')
      .gain(0.07)
      .lpf(1800)
      .attack(0.1)
      .decay(0.4)
      .sustain(0.15)
      .release(0.8)
      .room(0.6)
      .roomsize(5)
      .delay(0.3)
      .delaytime(0.75)
      .delayfeedback(0.35),
    // High shimmer — sparse bell-like tones with long delay tail
    note('~ ~ e5 ~ ~ ~ ~ ~ ~ ~ a5 ~ ~ ~ ~ ~  ~ ~ ~ ~ g5 ~ ~ ~ ~ ~ ~ ~ d5 ~ ~ ~')
      .s('sine')
      .gain(0.03)
      .lpf(3000)
      .attack(0.05)
      .decay(0.6)
      .sustain(0)
      .release(1.2)
      .delay(0.5)
      .delaytime(0.8)
      .delayfeedback(0.5)
      .room(0.7)
      .roomsize(7),
    // Bass — slow-moving root notes, breathes with the harmony
    note('a2 ~ ~ ~ e2 ~ ~ ~ f2 ~ ~ ~ d2 ~ ~ ~  a2 ~ ~ ~ g2 ~ ~ ~ f2 ~ ~ ~ e2 ~ ~ ~')
      .s('sine')
      .gain(0.1)
      .lpf(350)
      .attack(0.3)
      .release(0.6),
    // Pad — evolving chord wash, slow cycle through Am - Em - F - Dm
    note('<a2,c3,e3> <e2,g2,b2> <f2,a2,c3> <d2,f2,a2>')
      .s('sine')
      .attack(2.0)
      .release(3.0)
      .gain(0.05)
      .room(0.8)
      .roomsize(8)
      .lpf(1000)
      .slow(4),
    // Texture — very quiet filtered noise patter, like distant rain
    s('~ ~ hh ~ ~ ~ ~ ~')
      .gain(0.04)
      .lpf(800)
  ).slow(2).cpm(80).play();
}

// Game over — slow, somber, reflective with longer phrase
export function gameOverTheme() {
  return stack(
    // Descending melody — melancholic, extended phrase
    note('e4 ~ ~ d4 ~ ~ c4 ~ ~ a3 ~ ~ g3 ~ ~ ~ ~ ~ e3 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~')
      .s('triangle')
      .gain(0.1)
      .decay(0.8)
      .sustain(0.05)
      .release(2.0)
      .room(0.8)
      .roomsize(8)
      .lpf(1400),
    // Pad — minor chord wash
    note('a2,c3,e3')
      .s('sine')
      .attack(1.2)
      .release(4.0)
      .gain(0.08)
      .room(0.9)
      .roomsize(10)
      .lpf(900)
  ).slow(4).cpm(50).play();
}

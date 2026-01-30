// =============================================================================
// Barn Defense - BGM (Background Music)
// Eerie "horror at the barn" atmosphere using Strudel.cc.
// Soft, melodic, unsettling — haunted farmland at dusk.
// Each function returns stack(...).cpm(N).play().
// =============================================================================

import { stack, note, s } from '@strudel/web';

/**
 * Menu Theme - Haunted barn at twilight.
 * Eerie pads, music-box melody, low drone. Dm/Am/Em territory.
 */
export function menuTheme() {
  return stack(
    // Dark ambient pad — Dm → Am → Em → Bdim
    note('<d3,f3,a3> <a2,c3,e3> <e3,g3,b3> <b2,d3,f3>')
      .s('sine')
      .attack(1.5)
      .release(2.5)
      .gain(0.08)
      .room(0.9)
      .roomsize(8)
      .lpf(1200)
      .slow(2),
    // Music-box melody — sparse, lonely, minor pentatonic
    note('~ a4 ~ ~ e4 ~ ~ ~ ~ d5 ~ ~ ~ c5 ~ ~')
      .s('triangle')
      .gain(0.05)
      .decay(0.4)
      .sustain(0.05)
      .release(1.2)
      .delay(0.5)
      .delaytime(0.6)
      .delayfeedback(0.55)
      .room(0.7)
      .lpf(2000)
      .slow(2),
    // Sub drone — ominous low pulse
    note('d1')
      .s('sine')
      .gain(0.06)
      .attack(2.0)
      .release(3.0)
      .lpf(150)
      .room(0.4),
    // Distant wind-like texture — detuned sine wobble
    note('~ ~ ~ ~ ~ a5 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~')
      .s('sine')
      .gain(0.02)
      .slow(4)
      .delay(0.7)
      .delaytime(0.8)
      .delayfeedback(0.6)
      .room(0.95)
      .roomsize(10)
      .lpf(3000)
  ).slow(2).cpm(55).play();
}

/**
 * Gameplay BGM - Tense barn defense. Creepy but driving.
 * Minor key with subtle pulse. Soft melodic lead over dark bass.
 * Keeps tension without overwhelming gameplay.
 */
export function gameplayBGM() {
  return stack(
    // Eerie lead melody — Am pentatonic, sparse and haunting
    note('a3 ~ c4 ~ e4 ~ d4 c4 ~ a3 ~ ~ e4 ~ c4 ~')
      .s('triangle')
      .gain(0.09)
      .lpf(1800)
      .decay(0.25)
      .sustain(0.15)
      .release(0.6)
      .room(0.4)
      .delay(0.15)
      .delaytime(0.375)
      .delayfeedback(0.3),
    // Dark pad — Am → Dm → Em → Am
    note('<a2,c3,e3> <d3,f3,a3> <e3,g3,b3> <a2,c3,e3>')
      .s('sine')
      .attack(0.8)
      .release(1.5)
      .gain(0.06)
      .room(0.6)
      .roomsize(5)
      .lpf(1000),
    // Heartbeat bass — slow pulse, unsettling
    note('a1 ~ ~ a1 ~ ~ ~ ~ d1 ~ ~ d1 ~ ~ ~ ~')
      .s('triangle')
      .gain(0.1)
      .lpf(300)
      .decay(0.3)
      .sustain(0),
    // Soft percussion — tick-tock urgency
    s('~ hh ~ ~ ~ hh ~ ~, bd ~ ~ ~ ~ ~ ~ ~')
      .gain(0.12),
    // High dissonant whisper — occasional tension
    note('~ ~ ~ ~ ~ ~ ~ f5 ~ ~ ~ ~ ~ ~ ~ ~')
      .s('sine')
      .gain(0.025)
      .decay(0.5)
      .sustain(0)
      .room(0.8)
      .roomsize(7)
      .lpf(2500)
  ).cpm(85).play();
}

/**
 * Game Over Theme - The barn has fallen. Deep dread.
 * Descending minor melody, low drone, hollow reverb.
 */
export function gameOverTheme() {
  return stack(
    // Descending lament — chromatic descent
    note('e4 ~ ~ d4 ~ ~ c4 ~ ~ b3 ~ ~ a3 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~')
      .s('triangle')
      .gain(0.1)
      .decay(0.8)
      .sustain(0.05)
      .release(1.5)
      .room(0.85)
      .roomsize(8)
      .lpf(1400),
    // Hollow minor pad — Am with added 9th for unease
    note('a2,c3,e3,b3')
      .s('sine')
      .attack(1.0)
      .release(3.0)
      .gain(0.06)
      .room(0.9)
      .roomsize(9)
      .lpf(800),
    // Deep death drone
    note('a0')
      .s('sine')
      .gain(0.05)
      .attack(2.0)
      .release(4.0)
      .lpf(120)
      .room(0.3),
    // Ghost whisper — barely audible high tone
    note('~ ~ ~ ~ e6 ~ ~ ~ ~ ~ ~ ~')
      .s('sine')
      .gain(0.015)
      .slow(3)
      .delay(0.6)
      .delaytime(0.9)
      .delayfeedback(0.5)
      .room(0.95)
      .roomsize(10)
      .lpf(3500)
  ).slow(3).cpm(40).play();
}

/**
 * Level Complete Theme - Relief from horror. The barn survives... for now.
 * Bittersweet major over minor foundation. Hopeful but uneasy.
 */
export function levelCompleteTheme() {
  return stack(
    // Relief melody — rising from minor to major, tentative hope
    note('a3 ~ c4 ~ e4 ~ ~ g4 ~ a4 ~ ~ ~ ~ ~ ~')
      .s('triangle')
      .gain(0.1)
      .decay(0.4)
      .sustain(0.2)
      .release(1.0)
      .room(0.7)
      .roomsize(6)
      .lpf(2200),
    // Warm-ish pad — Am → C → F → G (minor to major shift)
    note('<a2,c3,e3> <c3,e3,g3> <f3,a3,c4> <g3,b3,d4>')
      .s('sine')
      .attack(0.8)
      .release(2.0)
      .gain(0.07)
      .room(0.8)
      .roomsize(7)
      .lpf(1600)
      .slow(2),
    // Gentle bass
    note('a2 ~ c2 ~ f2 ~ g2 ~')
      .s('triangle')
      .gain(0.08)
      .lpf(350)
      .slow(2),
    // Music box shimmer — sparse and delicate
    note('~ e5 ~ ~ ~ a5 ~ ~ ~ c5 ~ ~ ~ ~ ~ ~')
      .s('sine')
      .gain(0.03)
      .delay(0.4)
      .delaytime(0.4)
      .delayfeedback(0.45)
      .room(0.6)
      .lpf(3500)
      .slow(2)
  ).cpm(65).play();
}

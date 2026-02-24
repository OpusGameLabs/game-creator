// =============================================================================
// music.js — BGM patterns for Castle Siege Defense (Strudel)
// Medieval siege theme: war drums, brass-like sawtooth, tension.
// All patterns use synth oscillators only (no sample names).
//
// Anti-repetition techniques used:
// - <...> cycle alternation so melodies/chords change each loop
// - Different .slow() values per layer so they phase against each other
// - Long base patterns (32+ steps) stretched with .slow()
// - Probabilistic notes with ? for organic variation
// - Key changes across cycles in the chord progression
// =============================================================================

import { stack, note } from '@strudel/web';
import { AUDIO } from '../core/Constants.js';

/**
 * Gameplay BGM — Epic medieval battle theme
 * Multi-section composition with phasing layers.
 * Effective loop length: ~45 seconds before exact repeat.
 */
export function gameplayBGM() {
  return stack(
    // War drums — 3 alternating patterns so the groove shifts each cycle
    note('<[c1 ~ c1 ~ c1 c1 ~ ~ c1 ~ ~ c1 c1 ~ c1 ~] [c1 c1 ~ c1 ~ ~ c1 ~ c1 ~ c1 ~ ~ c1 ~ ~] [c1 ~ ~ c1 c1 ~ c1 ~ ~ c1 ~ ~ c1 c1 ~ c1]>')
      .s('sine')
      .gain(AUDIO.BGM_DRUMS_GAIN)
      .decay(0.18)
      .sustain(0)
      .lpf(300),
    // Snare hits — 2 alternating patterns, phased against the kick
    note('<[~ ~ ~ ~ c3 ~ ~ ~ ~ ~ ~ ~ c3 ~ ~ c3] [~ ~ c3 ~ ~ ~ c3 ~ ~ ~ ~ c3 ~ ~ c3 ~]>')
      .s('square')
      .gain(AUDIO.BGM_DRUMS_GAIN * 0.5)
      .decay(0.06)
      .sustain(0)
      .lpf(1800),
    // Brass lead — 4 alternating melodies, each a different phrase
    note('<[e3 ~ g3 a3 ~ ~ g3 ~ e3 ~ d3 e3 ~ ~ ~ ~] [g3 ~ a3 b3 ~ ~ a3 ~ g3 ~ e3 g3 ~ ~ ~ ~] [a3 ~ g3 e3 ~ ~ d3 ~ e3 ~ g3 a3 ~ ~ ~ ~] [b3 ~ a3 g3 ~ ~ e3 ~ d3 ~ e3 ~ g3 ~ a3 ~]>')
      .s('sawtooth')
      .gain(AUDIO.BGM_LEAD_GAIN)
      .lpf(1600)
      .decay(0.25)
      .sustain(0.3)
      .release(0.4)
      .room(0.3)
      .roomsize(3),
    // Counter melody — sparse answering phrase, 3 alternations on a slower cycle
    note('<[~ ~ ~ ~ ~ b3 ~ ~ ~ a3 ~ ~ ~ ~ ~ ~] [~ ~ ~ ~ ~ ~ d4 ~ ~ ~ ~ c4 ~ ~ ~ ~] [~ ~ g3 ~ ~ ~ ~ ~ ~ ~ e3 ~ ~ ~ ~ ~]>')
      .s('triangle')
      .gain(AUDIO.BGM_LEAD_GAIN * 0.5)
      .lpf(2000)
      .decay(0.4)
      .sustain(0.15)
      .release(0.6)
      .room(0.4)
      .delay(0.15)
      .delaytime(0.375)
      .delayfeedback(0.25)
      .slow(1.5),
    // Bass — 3 alternating root progressions for key variation
    note('<[e1 e1 ~ ~ a1 a1 ~ ~ d1 d1 ~ ~ a1 ~ e1 ~] [a1 a1 ~ ~ d1 d1 ~ ~ g1 g1 ~ ~ d1 ~ a1 ~] [d1 d1 ~ ~ g1 g1 ~ ~ c1 c1 ~ ~ g1 ~ d1 ~]>')
      .s('triangle')
      .gain(AUDIO.BGM_BASS_GAIN)
      .lpf(400),
    // Tension arp — filter sweep alternates across 4 cycles for movement
    note('e4 g4 b4 e5')
      .s('square')
      .fast(4)
      .gain(AUDIO.BGM_ARP_GAIN)
      .lpf('<1200 800 1600 1000>')
      .decay(0.06)
      .sustain(0),
    // Power chord pad — 4-bar progression with key changes, slowest layer
    // This layer takes 4x longer to repeat than the melody, creating phasing
    note('<e2,g2,b2> <e2,g2,b2> <a1,c2,e2> <a1,c2,e2> <d2,f2,a2> <d2,f2,a2> <a1,c2,e2> <a1,c2,e2> <g1,b1,d2> <g1,b1,d2> <c2,e2,g2> <c2,e2,g2> <d2,f2,a2> <d2,f2,a2> <e2,g2,b2> <e2,g2,b2>')
      .s('sawtooth')
      .gain(AUDIO.BGM_PAD_GAIN)
      .lpf(800)
      .attack(0.3)
      .release(0.8)
      .room(0.4)
      .roomsize(4)
      .slow(4),
    // Atmospheric texture — very quiet delayed notes that drift independently
    note('b4 ~ ~ ~ e5 ~ ~ ~ g4? ~ ~ ~ a4? ~ ~ ~')
      .s('sine')
      .gain(0.03)
      .lpf(1800)
      .decay(0.3)
      .sustain(0)
      .delay(0.4)
      .delaytime(0.5)
      .delayfeedback(0.45)
      .room(0.5)
      .slow(3)
  ).cpm(AUDIO.GAMEPLAY_CPM).play();
}

/**
 * Game Over BGM — Somber defeat theme
 * Slow descending melody, dark minor pads, mournful atmosphere.
 * Multiple melodic phrases alternate so it doesn't loop identically.
 */
export function gameOverTheme() {
  return stack(
    // Descending mournful melody — 3 alternating phrases
    note('<[b4 ~ a4 ~ g4 ~ e4 ~ d4 ~ c4 ~ b3 ~ ~ ~] [e4 ~ d4 ~ c4 ~ b3 ~ a3 ~ g3 ~ ~ ~ ~ ~] [g4 ~ e4 ~ d4 ~ c4 ~ e4 ~ d4 ~ b3 ~ ~ ~]>')
      .s('triangle')
      .gain(AUDIO.BGM_LEAD_GAIN)
      .decay(0.8)
      .sustain(0.1)
      .release(1.2)
      .room(0.6)
      .roomsize(5)
      .lpf(1600),
    // Dark minor pad — alternating chords
    note('<[a2,c3,e3] [d2,f2,a2] [e2,g2,b2]>')
      .s('sine')
      .attack(0.6)
      .release(2.5)
      .gain(AUDIO.BGM_PAD_GAIN)
      .room(0.7)
      .roomsize(6)
      .lpf(1000)
      .slow(2),
    // Funeral bass — alternating root notes
    note('<[a1 ~ ~ ~ e1 ~ ~ ~ d1 ~ ~ ~ a1 ~ ~ ~] [d1 ~ ~ ~ a1 ~ ~ ~ g1 ~ ~ ~ d1 ~ ~ ~]>')
      .s('sine')
      .gain(AUDIO.BGM_BASS_GAIN)
      .lpf(250)
      .slow(2),
    // Ghostly high notes — very sparse and quiet
    note('~ ~ ~ ~ ~ e5? ~ ~ ~ ~ ~ ~ ~ b4? ~ ~')
      .s('sine')
      .gain(0.03)
      .delay(0.5)
      .delaytime(0.6)
      .delayfeedback(0.5)
      .room(0.7)
      .lpf(2000)
      .slow(3)
  ).slow(3).cpm(AUDIO.GAMEOVER_CPM).play();
}

/**
 * Wave complete fanfare — Brief victorious stinger
 * Ascending brass-like arpeggio. This loops, but the AudioBridge
 * will stop it after a short duration and resume gameplay BGM.
 */
export function waveCompleteFanfare() {
  return stack(
    // Ascending victory notes
    note('c4 e4 g4 c5 e5 ~ ~ ~')
      .s('sawtooth')
      .gain(AUDIO.BGM_LEAD_GAIN + 0.02)
      .lpf(2000)
      .decay(0.2)
      .sustain(0.2)
      .release(0.5)
      .room(0.4)
      .roomsize(3),
    // Supporting chord
    note('<c3,e3,g3> ~ ~ ~ ~ ~ ~ ~')
      .s('sine')
      .gain(AUDIO.BGM_PAD_GAIN + 0.02)
      .attack(0.1)
      .release(1.5)
      .room(0.5)
      .lpf(1400)
  ).cpm(AUDIO.GAMEPLAY_CPM).play();
}

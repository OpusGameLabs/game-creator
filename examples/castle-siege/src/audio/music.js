// =============================================================================
// music.js — BGM patterns for Castle Siege Defense (Strudel)
// Medieval siege theme: war drums, brass-like sawtooth, tension.
// All patterns use synth oscillators only (no sample names).
// =============================================================================

import { stack, note } from '@strudel/web';
import { AUDIO } from '../core/Constants.js';

/**
 * Gameplay BGM — Epic medieval battle theme
 * War drums (low sine), brass-like sawtooth lead, driving bass, tension arp.
 * ~120 cpm for driving urgency without being frenetic.
 */
export function gameplayBGM() {
  return stack(
    // War drums — deep sine kicks with fast decay
    note('c1 ~ c1 ~ c1 c1 ~ ~ c1 ~ ~ c1 c1 ~ c1 ~')
      .s('sine')
      .gain(AUDIO.BGM_DRUMS_GAIN)
      .decay(0.18)
      .sustain(0)
      .lpf(300),
    // Snare-like hits — mid-frequency square bursts
    note('~ ~ ~ ~ c3 ~ ~ ~ ~ ~ ~ ~ c3 ~ ~ c3')
      .s('square')
      .gain(AUDIO.BGM_DRUMS_GAIN * 0.5)
      .decay(0.06)
      .sustain(0)
      .lpf(1800),
    // Brass lead — sawtooth with filter for brass-like tone
    note('e3 ~ g3 a3 ~ ~ g3 ~ e3 ~ d3 e3 ~ ~ ~ ~')
      .s('sawtooth')
      .gain(AUDIO.BGM_LEAD_GAIN)
      .lpf(1600)
      .decay(0.25)
      .sustain(0.3)
      .release(0.4)
      .room(0.3)
      .roomsize(3),
    // Bass — heavy triangle foundation
    note('e1 e1 ~ ~ a1 a1 ~ ~ d1 d1 ~ ~ a1 ~ e1 ~')
      .s('triangle')
      .gain(AUDIO.BGM_BASS_GAIN)
      .lpf(400),
    // Tension arp — quiet fast notes for energy
    note('e4 g4 b4 e5')
      .s('square')
      .fast(4)
      .gain(AUDIO.BGM_ARP_GAIN)
      .lpf(1200)
      .decay(0.06)
      .sustain(0),
    // Power chord pad — sustained minor chords for dark mood
    note('<e2,g2,b2> <e2,g2,b2> <a1,c2,e2> <a1,c2,e2> <d2,f2,a2> <d2,f2,a2> <a1,c2,e2> <a1,c2,e2>')
      .s('sawtooth')
      .gain(AUDIO.BGM_PAD_GAIN)
      .lpf(800)
      .attack(0.3)
      .release(0.8)
      .room(0.4)
      .roomsize(4)
      .slow(2)
  ).cpm(AUDIO.GAMEPLAY_CPM).play();
}

/**
 * Game Over BGM — Somber defeat theme
 * Slow descending melody, dark minor pads, mournful atmosphere.
 * ~60 cpm for heaviness and finality.
 */
export function gameOverTheme() {
  return stack(
    // Descending mournful melody
    note('b4 ~ a4 ~ g4 ~ e4 ~ d4 ~ c4 ~ b3 ~ ~ ~')
      .s('triangle')
      .gain(AUDIO.BGM_LEAD_GAIN)
      .decay(0.8)
      .sustain(0.1)
      .release(1.2)
      .room(0.6)
      .roomsize(5)
      .lpf(1600),
    // Dark minor pad
    note('a2,c3,e3')
      .s('sine')
      .attack(0.6)
      .release(2.5)
      .gain(AUDIO.BGM_PAD_GAIN)
      .room(0.7)
      .roomsize(6)
      .lpf(1000),
    // Funeral bass — very slow, heavy
    note('a1 ~ ~ ~ e1 ~ ~ ~ d1 ~ ~ ~ a1 ~ ~ ~')
      .s('sine')
      .gain(AUDIO.BGM_BASS_GAIN)
      .lpf(250)
      .slow(2)
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

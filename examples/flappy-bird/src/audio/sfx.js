import { note, s } from '@strudel/web';

// Sound effects for Flappy Bird
// Style: chiptune / retro 8-bit, short envelopes

export function flapSfx() {
  note("c4").s("square")
    .penv(8).pdecay(0.1)
    .decay(0.1).sustain(0).gain(0.2)
    .lpf(3000).play();
}

export function scoreSfx() {
  note("e5 b5").s("square")
    .fast(6).decay(0.1).sustain(0).gain(0.3)
    .lpf(4000).play();
}

export function deathSfx() {
  note("g4 e4 c4 a3").s("square")
    .fast(3).decay(0.2).sustain(0)
    .crush(8).gain(0.25).play();
}

export function buttonClickSfx() {
  note("c5").s("sine")
    .decay(0.12).sustain(0)
    .gain(0.2).play();
}

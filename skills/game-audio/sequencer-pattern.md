# BGM Sequencer Pattern

BGM uses a step sequencer that schedules oscillator notes ahead of time in a recurring loop. This gives sample-accurate timing with zero drift.

```js
// music.js — BGM patterns using Web Audio API sequencer

const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, R: 0, // R = rest
};

/**
 * Simple step sequencer — schedules notes in a loop using Web Audio API.
 * Returns { stop() } to cancel the loop.
 *
 * @param {AudioContext} ctx
 * @param {GainNode} dest - destination node (master gain)
 * @param {Array<Array<{freq, type, gain, duration}>>} layers - parallel note sequences
 * @param {number} bpm - beats per minute
 * @param {number} stepsPerBeat - subdivisions per beat (default 2 = eighth notes)
 */
function sequencer(ctx, dest, layers, bpm, stepsPerBeat = 2) {
  const stepDuration = 60 / bpm / stepsPerBeat;
  let nextStepTime = ctx.currentTime + 0.05; // small initial buffer
  let stepIndex = 0;
  let stopped = false;
  let timerId = null;

  function scheduleStep() {
    if (stopped) return;

    // Schedule notes while we're ahead of the playback cursor
    while (nextStepTime < ctx.currentTime + 0.1) {
      for (const layer of layers) {
        const note = layer[stepIndex % layer.length];
        if (note && note.freq > 0) {
          const osc = ctx.createOscillator();
          osc.type = note.type || 'square';
          osc.frequency.setValueAtTime(note.freq, nextStepTime);

          if (note.freqEnd) {
            osc.frequency.exponentialRampToValueAtTime(note.freqEnd, nextStepTime + (note.duration || stepDuration));
          }

          const g = ctx.createGain();
          const noteGain = note.gain ?? 0.15;
          g.gain.setValueAtTime(noteGain, nextStepTime);
          g.gain.exponentialRampToValueAtTime(0.001, nextStepTime + (note.duration || stepDuration * 0.9));

          const f = ctx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.setValueAtTime(note.lpf || 3000, nextStepTime);

          osc.connect(f).connect(g).connect(dest);
          osc.start(nextStepTime);
          osc.stop(nextStepTime + (note.duration || stepDuration));
        }
      }

      stepIndex++;
      nextStepTime += stepDuration;
    }

    timerId = setTimeout(scheduleStep, 25); // check every 25ms
  }

  scheduleStep();
  return { stop() { stopped = true; clearTimeout(timerId); } };
}

// Helper: convert a string pattern like "C4 R E4 G4" into note objects
function parsePattern(str, type = 'square', gain = 0.15, lpf = 3000) {
  return str.split(' ').map(n => {
    if (n === 'R' || n === '~') return { freq: 0 };
    return { freq: NOTES[n] || 0, type, gain, lpf };
  });
}

// --- Example BGM patterns ---

export function gameplayBGM(ctx, dest) {
  return sequencer(ctx, dest, [
    // Melody — square wave
    parsePattern('C4 E4 G4 E4 C4 D4 E4 C4 D4 F4 A4 F4 D4 E4 F4 D4', 'square', 0.14, 2200),
    // Bass — triangle wave
    parsePattern('C3 R C3 R G3 R G3 R F3 R F3 R C3 R C3 R', 'triangle', 0.18, 500),
    // Arpeggio texture — quiet square
    parsePattern('C5 E5 G5 E5 C5 E5 G5 E5 D5 F4 A4 F4 D5 F4 A4 F4', 'square', 0.04, 1000),
    // Kick drum — low sine
    parsePattern('C3 R R R C3 R R R C3 R R R C3 R R R', 'sine', 0.25, 200),
  ], 130, 2);
}

export function gameOverTheme(ctx, dest) {
  return sequencer(ctx, dest, [
    // Slow descending melody
    parsePattern('B4 R A4 R G4 R E4 R D4 R C4 R R R R R', 'triangle', 0.18, 1800),
    // Pad chord
    parsePattern('A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3', 'sine', 0.10, 1200),
  ], 60, 2);
}
```

## Anti-Repetition Techniques

The #1 complaint about procedural game music is repetitiveness. Use these techniques:

1. **Multiple phrase variations** — Write 2-4 melody arrays and cycle through them:
```js
const melodies = [
  parsePattern('C4 E4 G4 E4 C4 D4 E4 C4'),
  parsePattern('G4 A4 B4 A4 G4 E4 D4 E4'),
  parsePattern('E4 G4 A4 G4 E4 D4 C4 D4'),
];
// In sequencer, index melody layers by Math.floor(stepIndex / stepsPerPhrase) % melodies.length
```

2. **Different layer lengths** — Make bass 12 steps while melody is 16. They realign after LCM(12,16)=48 steps.

3. **Random note omission** — In the sequencer loop, skip notes with `Math.random() > 0.85` for organic variation.

4. **Filter sweep** — Gradually change `lpf` values over time for timbral movement.

**Rule of thumb**: Effective loop length should be 30+ seconds before exact repetition.

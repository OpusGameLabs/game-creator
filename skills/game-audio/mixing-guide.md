# Volume Mixing Guide

Game audio should never overpower gameplay. BGM gains are lower than you think.

## Volume Levels

| Element | Gain | Notes |
|---------|------|-------|
| BGM Lead melody | 0.10-0.18 | Must not distract from gameplay |
| BGM Pad / chords | 0.08-0.15 | Background wash |
| BGM Bass | 0.15-0.22 | Foundation, felt not heard |
| BGM Drums | 0.20-0.30 | Only if game style demands it |
| BGM Arp/Texture | 0.03-0.08 | Barely audible movement |
| SFX (score, jump) | 0.2-0.3 | Should cut through BGM |
| SFX (death, hit) | 0.2-0.3 | Impactful but not ear-piercing |
| SFX (button, UI) | 0.15-0.25 | Subtle confirmation |

## Style Guidelines

### Retro / Chiptune (platformers, arcade)
- Use `square` and `triangle` oscillators
- Short `.decay()`, `.sustain(0)` for percussive feel
- `.crush(8-12)` for lo-fi crunch
- `.lpf(1000-3000)` to tame harshness
- Simple melodies: pentatonic or major scale
- Tempo: 100-140 cpm (not 160+ — that's frenetic)

### Ambient / Atmospheric (flight sims, puzzle, exploration)
- Use `sine` and `triangle` oscillators
- Long `.attack(0.3-1.0)` and `.release(1.0-2.5)`
- Heavy `.room(0.4-0.7)` and `.delay(0.2-0.5)`
- Stacked chords with `.slow(2-4)`
- Lots of rests (`~`) — silence is part of the music
- Tempo: 50-80 cpm

### Minimal / Casual (mobile games)
- Light percussion only: `s("hh*4, ~ sd")`
- Sparse melody: mostly rests
- `.gain(0.10-0.20)` — keep it very quiet
- Heavy `.room()` for space
- Tempo: 70-100 cpm

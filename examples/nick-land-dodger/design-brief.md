# Nick Land Dodger - Design Brief

## Concept Summary

Nick Land Dodger is a survival/dodger game themed around accelerationism. The player controls Nick Land (the accelerationist philosopher) at the bottom of the screen, dodging falling "bits" -- data fragments, binary digits, philosophical symbols, and code snippets that rain down from above. The core mechanic mirrors accelerationism itself: the bits get faster and more frequent over time, creating an ever-intensifying cascade that the player must navigate.

The aesthetic is dark cyberpunk: near-black backgrounds with a subtle grid pattern, neon-colored text characters falling like a corrupted Matrix rain, and Nick Land rendered as a dark-cloaked philosopher silhouette with glowing green eyes.

## Core Mechanics

### Dodging
- Player moves left/right at the bottom of the screen
- Keyboard: Arrow keys or WASD (A/D)
- Mobile: Left half of screen = move left, right half = move right (tap zones)
- No jumping -- pure horizontal dodging

### Acceleration (The Central Theme)
- Bits start falling at a base speed (150 * PX pixels/sec)
- Every second, the speed multiplier increases by +0.03
- Spawn rate also increases over time (interval decays by 0.985x per second)
- Maximum speed caps at 4x the base speed
- Speed milestones (2x, 3x, 4x) trigger SPEED_INCREASED events for visual effects

### Scoring
- Time-based: +1 point per second survived
- No in-game HUD -- Play.fun widget displays the score
- Score milestones every 10 points trigger SPECTACLE_HIT events

### Near-Miss Detection
- When a bit passes below the player without hitting
- If the bit's horizontal distance was within 20% of player width from player center, it counts as a "near miss"
- Near-misses emit SPECTACLE_NEAR_MISS for visual feedback
- All dodged bits increment the combo counter

### Fail Condition
- Any collision between Nick Land and a bit ends the game
- Brief 400ms pause with red flash before transitioning to Game Over screen

## Entity Interactions

### Nick Land (Player)
- Dark cloaked silhouette with pale face and glowing green eyes
- Width: 12% of screen width, height: width * 1.5 aspect ratio
- Positioned at 88% of screen height (near bottom)
- Physics body with world bounds collision (cannot leave screen)
- No gravity -- stays fixed at bottom row

### Bits (Falling Obstacles)
- Text characters: 0, 1, infinity, Omega, Delta, section sign, //, {}, <>
- Neon colors: green (#00ff88), cyan (#00e5ff), magenta (#ff00ff), yellow (#ffff00), pink (#ff3366)
- Size range: 4-6% of screen width
- Glow shadow effect matching their color
- Slight random rotation for visual variety
- Object-pooled (40 max) for performance

### Background Grid
- Near-black background (0x0a0a0f)
- Subtle grid lines in dark blue-grey (0x1a1a2e) at 30% alpha
- Grid spacing: 40 * PX pixels

## Expression Map for Nick Land

| Expression | Trigger | Visual Change |
|-----------|---------|---------------|
| Normal | Default gameplay state | Dark cloak, pale face, glowing green eyes |
| Happy | Score milestones (every 10 pts) | Eyes glow brighter, slight yellow tint (future: design pass) |
| Angry/Hit | Collision with a bit | Cloak flashes red, eyes turn red |
| Surprised | Near-miss detection | Eyes widen, brief cyan flash (future: design pass) |

## Color Palette

- **Background**: #0a0a0f (near-black)
- **Grid**: #1a1a2e at 30% alpha
- **Player cloak**: #1a1a2e
- **Player face**: #d4c5a9 (pale)
- **Player eyes**: #00ff88 (neon green glow)
- **Bit text**: Randomized from neon palette
- **UI text**: Courier New monospace, neon colors with glow shadows
- **Game Over**: Dark purple gradient (#0a0a0f to #1a0a2e)
- **Buttons**: Purple (#6c00ff) with hover/press states

## Technical Notes

- Phaser 3 with Arcade Physics
- Zero gravity (GAME.GRAVITY = 0) -- bits use custom velocity
- Object pooling for bits (40 pool size)
- Safe zone at top 8% for Play.fun widget
- EventBus pub/sub for all cross-module communication
- All magic numbers in Constants.js

# Progress

## Game Concept
- **Name**: example-game (Asteroid Dodger)
- **Engine**: Phaser 3
- **Description**: Asteroid Dodger — dodge falling asteroids in a spaceship. Side-to-side movement at bottom of screen, asteroids fall from top with increasing speed and frequency, collision = death, score increases by dodging.

## Step 1: Scaffold
- **Entities**: Ship (src/entities/Ship.js), Asteroid (src/entities/Asteroid.js)
- **Events**: ship:move, ship:hit, asteroid:spawn, asteroid:passed, game:start, game:over, game:restart, score:changed, particles:emit, audio:init, music:menu, music:gameplay, music:gameover, music:stop
- **Constants keys**: GAME (dimensions), SAFE_ZONE (Play.fun widget), SHIP (size/speed/position/colors), ASTEROID (radius/speed/spawn/pool/colors), SCORING (points per dodge), STARS (background starfield), COLORS (space theme + UI), UI (fonts/buttons), TRANSITION (fade durations)
- **Scoring system**: +1 point for each asteroid that passes the bottom of the screen without hitting the ship. Difficulty scales with score: asteroid speed increases by SPEED_PER_SCORE per point, spawn interval decreases by SPAWN_INTERVAL_PER_SCORE ms per point, both capped.
- **Fail condition**: Ship collides with any asteroid -> game over -> camera shake -> transition to GameOverScene
- **Input scheme**: Mobile-first tap zones (left half = move left, right half = move right) + keyboard (arrow keys / A+D). No jump — horizontal movement only.

## Decisions / Known Issues
- No gravity system: Ship stays fixed at Y position near bottom, asteroids use explicit downward velocity instead of global gravity
- Asteroid pool size of 30 prevents runaway object creation at high difficulty
- Ship hitbox shrunk to 70% for forgiving collision feel
- Asteroid textures are procedurally generated (5 variants) with jagged circles and craters
- Scrolling starfield background for space atmosphere
- Score system wired via EventBus: asteroid deactivates at bottom -> emits asteroid:passed -> ScoreSystem increments -> emits score:changed
- isMuted added to GameState for future audio integration
- No title screen — boots directly into gameplay per conventions
- No in-game score HUD — Play.fun widget handles display

# Progress

## Game Concept
- **Name**: nick-land-dodger
- **Engine**: Phaser 3
- **Description**: Nick Land (accelerationist philosopher) dodges accelerating falling bits — binary digits, code symbols, and philosophical glyphs that speed up over time. Cyberpunk aesthetic with dark background and neon colors.

## Step 1: Scaffold
- **Entities**: Player.js (Nick Land — dark cloaked philosopher with green glowing eyes), Bit.js (falling text character with neon glow)
- **Events**: GAME_START, GAME_OVER, GAME_RESTART, PLAYER_MOVE, PLAYER_HIT, PLAYER_DIED, BIT_SPAWNED, BIT_DODGED, SPEED_INCREASED, SCORE_CHANGED, PARTICLES_EMIT, SPECTACLE_ENTRANCE/ACTION/HIT/COMBO/STREAK/NEAR_MISS, AUDIO_INIT, MUSIC_MENU/GAMEPLAY/GAMEOVER/STOP, AUDIO_TOGGLE_MUTE
- **Constants keys**: GAME, SAFE_ZONE, PLAYER, BIT, ACCELERATION, COLORS, UI, TRANSITION, NEAR_MISS
- **Scoring system**: Time-based (+1 point per second survived)
- **Fail condition**: Collision with a falling bit
- **Input scheme**: Left/right arrow keys + A/D, mobile tap zones (left half = left, right half = right)
- **Acceleration**: Speed multiplier starts at 1.0, +0.03/sec, caps at 4.0x. Spawn rate decays by 0.985x/sec.

## Characters
- nick-land: NOT in character library — will need photo search or pixel art fallback (Tier 2-5)

## Step 1.5: Assets
- **Character**: nick-land — Tier 3 (3 unique photos, 1 duplicate, photo-composite spritesheet)
- **Spritesheet**: `public/assets/characters/nick-land/nick-land-expressions.png` (800x300, 4 frames at 200x300 each)
- **Frame indices**: 0=normal, 1=happy, 2=angry, 3=surprised
- **Expression wiring**: SCORE_CHANGED->happy, PLAYER_HIT->angry, SPECTACLE_NEAR_MISS->surprised, SPEED_INCREASED->surprised (1000ms hold)
- **Expression auto-revert**: Non-normal expressions revert to normal after EXPRESSION_HOLD_MS (600ms default, 1000ms for speed milestones)
- **Player sprite**: Replaced Graphics-based drawing with spritesheet-based physics sprite using setDisplaySize() and setFlipX() for direction
- **Background**: Enhanced grid at depth -10 + matrix rain effect at depth -5 (20 pooled text objects, 0.1-0.2 alpha, recycling on off-screen)
- **Bits**: Kept as neon text rendering with glow shadows (no change needed — text IS their visual identity)
- **Depth layering**: Background grid at -10, matrix rain at -5, gameplay entities at 0+, player at 1
- **Scene cleanup**: Added shutdown() to GameScene with EventBus listener removal and object destruction to prevent leaks on restart
- **Constants added**: EXPRESSION, EXPRESSION_HOLD_MS, MATRIX_RAIN

## Step 2: Design (Visual Polish — Spectacle-First)

### New System
- **SpectacleSystem** (`src/systems/SpectacleSystem.js`): Dedicated visual effects system managing all particles, screen shakes, flash overlays, floating text, combos, streaks, speed milestone announcements, and the opening entrance sequence. All effects wired via EventBus listeners. Full cleanup in `destroy()`.

### Opening Moment (first 3 seconds)
- Camera flash with neon green tint (300ms) on scene start
- Player slam-in: Nick Land starts above screen, tweens to position with `Bounce.easeOut` (600ms)
- Landing shake (0.012 intensity) + 20-particle neon burst on landing
- 15 ambient floating neon motes active from frame 1 (slowly drifting upward, pulsing alpha, ADD blend mode, depth -2)
- "ACCELERATE" text slams in at 300ms with `Elastic.easeOut` (scale 2.0 -> 1.0), holds 1s, fades out over 400ms

### Every-Action Effects
- **Action particles**: 14-particle neon spark burst on `SPECTACLE_ACTION` at player position (150ms cooldown to prevent spam)
- **Player trail**: Persistent neon particle emitter following player container, ADD blend mode, 0.25 alpha, green/cyan tint
- **Score popup**: "+1" floating text (28px, scale 1.8, `Elastic.easeOut`) rises from player on `SCORE_CHANGED`
- **Background pulse**: Brief neon green flash (alpha 0.15, 300ms) on `SCORE_CHANGED`
- **Near-miss shake**: Screen shake (0.01 base + speed factor, capped at 0.025) on `SPECTACLE_NEAR_MISS`
- **Near-miss text**: "CLOSE!" floating text in neon magenta at near-miss location

### Combo & Streak System
- Combo counter (`Nx`) floating text above player on every dodge (scales with combo milestones: +2px per 5 dodges)
- Streak milestone announcements at 5x, 10x, 25x, 50x, 100x dodges: full-screen text slam ("5x DODGE!") + 30-particle burst + medium shake
- Shake intensity scales with speed multiplier (0.008 + currentSpeed * 0.002, capped at 0.025)

### Speed Milestone Effects (2X, 3X, 4X)
- Full-screen neon magenta flash (alpha 0.3, 200ms) via flash overlay
- "2X SPEED" / "3X SPEED" / "4X SPEED" text slam center screen with `Elastic.easeOut`
- Grid lines pulse brighter (alpha 0.3 -> 0.8 -> 0.3 over 500ms)
- Screen shake (0.02)
- Background hue shift (neon magenta pulse, alpha 0.2, 500ms)

### Bit Destruction Effects
- Bits near screen bottom trigger dissolve effect: alpha fade + scale down to 0.5 over 300ms
- Killing bit (game over): flash white (text + shadow) + expand to 2x scale, fade out over 200ms
- Bit containers reset scale on reactivation to prevent dissolve tween from persisting

### Game Over Enhancement
- 60ms hit freeze (physics pause) on collision
- Red screen flash (255, 0, 50) on death
- Slow-motion (timeScale 0.3 for 300ms) before transition
- 40-particle death explosion from player position (1.5x larger/faster than standard burst)
- Camera zoom-in to 1.1x over 300ms
- Scene transition delayed to 700ms (was 400ms) to let death sequence complete

### Constants Added (SPECTACLE section in Constants.js)
- Entrance: ENTRANCE_FLASH_DURATION/COLOR, ENTRANCE_SLAM_DURATION/EASE, ENTRANCE_LANDING_SHAKE/PARTICLES, ENTRANCE_TEXT/SCALE/EASE/HOLD/FADE
- Ambient motes: AMBIENT_MOTE_COUNT/SPEED/SIZE/ALPHA
- Action: ACTION_PARTICLE_COUNT/SPEED/LIFESPAN/SIZE/ALPHA/COOLDOWN
- Trail: TRAIL_ALPHA/LIFESPAN/FREQUENCY/SIZE
- Score: SCORE_TEXT_SIZE/START_SCALE/EASE/RISE/DURATION
- Background pulse: BG_PULSE_ALPHA/DURATION
- Near-miss: NEAR_MISS_SHAKE/TEXT_SIZE/TEXT/DURATION
- Combo: COMBO_TEXT_SIZE_BASE/STEP/DURATION, STREAK_MILESTONES/PARTICLE_COUNT/TEXT_SIZE/DURATION
- Shake: SHAKE_LIGHT/MEDIUM/HEAVY/MAX/SPEED_FACTOR, HIT_FREEZE_DURATION
- Speed: SPEED_FLASH_ALPHA/DURATION, SPEED_TEXT_SIZE/DURATION, SPEED_GRID_PULSE_ALPHA/DURATION, SPEED_SHAKE
- Bit destruction: BIT_DISSOLVE_DURATION, BIT_HIT_FLASH_DURATION, BIT_HIT_EXPAND_SCALE
- Death: DEATH_FLASH_COLOR/DURATION, DEATH_SLOWMO_SCALE/DURATION, DEATH_PARTICLE_COUNT, DEATH_ZOOM_TARGET/DURATION, DEATH_TRANSITION_DELAY
- General: PARTICLE_MIN_COUNT/BURST_SPEED/LIFESPAN/SIZE, FLOAT_TEXT_MIN_SIZE, FLASH_ALPHA_MIN/MAX

### Files Changed
- `src/core/Constants.js` — Added SPECTACLE section (80+ effect configuration values)
- `src/systems/SpectacleSystem.js` — New file (full visual effects system)
- `src/scenes/GameScene.js` — Integrated SpectacleSystem, updated grid to return reference, added bit dissolve detection, updated triggerGameOver to use death sequence, cleanup of SpectacleSystem in shutdown(), camera zoom reset
- `src/entities/Bit.js` — Added `_dissolvePlayed` flag, reset scale on activate

### Design Decisions
- All effects use EventBus (no direct coupling between SpectacleSystem and game entities)
- Particle texture created programmatically (no external assets needed)
- Action particle burst has 150ms cooldown to prevent overwhelming GPU on rapid keyboard input
- Ambient motes are independent from matrix rain (different depth layer, different behavior)
- Death sequence uses physics pause for hit-freeze rather than time.timeScale (cleaner for the brief 60ms window)
- Camera zoom resets in shutdown() to prevent carry-over between scenes

## Decisions / Known Issues
- No gravity (GAME.GRAVITY = 0) — bits fall via custom velocity
- Player moves horizontally only at bottom of screen
- Architecture validator flagged minor magic numbers in Bit.js, Player.js, GameOverScene.js (cosmetic constants)
- Monospace font ("Courier New") used for cyberpunk aesthetic

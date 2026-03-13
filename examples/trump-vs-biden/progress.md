# Progress

## Game Concept
- **Name**: trump-vs-biden
- **Engine**: Three.js (3D)
- **Description**: 3D arena battle — player controls Trump, throws projectiles at AI-controlled Biden. Dodge Biden's attacks, score on hits, game over when health depletes.

## Step 1: Scaffold
- **Entities**: Player.js (Trump), Opponent.js (Biden), Projectile.js, ProjectileManager.js
- **Events**: GAME_START, GAME_OVER, GAME_RESTART, PLAYER_THROW, PLAYER_HIT, PLAYER_MOVE, OPPONENT_THROW, OPPONENT_HIT, HEALTH_CHANGED, SCORE_CHANGED, COMBO_CHANGED, SPECTACLE_ENTRANCE/ACTION/HIT/COMBO/STREAK/NEAR_MISS, AUDIO_INIT, MUSIC_MENU/GAMEPLAY/GAMEOVER/STOP
- **Constants keys**: GAME, SAFE_ZONE, ARENA, PLAYER, OPPONENT, PROJECTILE, CAMERA, COLORS, SCORING, TRUMP_CLIPS, BIDEN_CLIPS, ASSET_PATHS, MODEL_CONFIG
- **Scoring system**: +1 per Biden hit, combo bonus (+2) at 3+ consecutive hits within 3s timeout
- **Fail condition**: Health drops to 0 (starts at 5 hearts)
- **Input scheme**: A/D or Arrow keys for left/right dodge, Space to throw. Touch: left/right halves for movement, quick tap to throw.

## Characters (3D)
- **Trump (player)**: Tier 1 — pre-built in assets/3d-characters (idle/clap/dance/point/talk/twist)
- **Biden (opponent)**: Tier 1 — pre-built in assets/3d-characters (idle only)

## Decisions / Known Issues
- Both models are "gesture" type (no walk/run) — characters slide while playing idle animation
- Trump facing offset: Math.PI (faces -Z by default)
- Biden facing offset: Math.PI (configured in MODEL_CONFIG)
- Placeholder colored boxes used until Step 1.5 loads GLB models
- HUD hearts/score positioned in Play.fun safe zone area — will adjust during SDK integration

## Step 2: Design (Visual Polish)
- **New file**: `src/systems/EffectsSystem.js` — centralized visual effects system wired entirely through EventBus
- **New constants**: `EFFECTS` object added to `Constants.js` with 40+ tuning values for particles, camera shake, flash, trails, combo text, slow-mo, entrance animation, and arena glow

### Effects implemented
1. **Opening moment**: White camera flash on game start + characters rise from y=-2 with easeOutBounce over 0.8s + landing shake. Ambient dust/spark particles active from frame 1 (60 particles, additive blending, drifting upward).
2. **Hit effects**: 18-particle burst at impact point colored by projectile team (red/blue), additive blending with gravity. Screen flash (red for player damage, red-tinted for opponent hit). Camera shake on both hit types (stronger on player damage).
3. **Throw effects**: Muzzle flash (PointLight, intensity 2.0, fades over 200ms) + small 5-particle burst at throw origin.
4. **Projectile trails**: Small transparent spheres spawned every 30ms along projectile path, fade out over 250ms with scale reduction.
5. **Combo text**: HTML overlay "Nx COMBO!" text that scales from 0.3 to 1.3 and fades out. Font size grows with combo count (48px base + 6px per combo, max 80px). Gold color with glow text-shadow.
6. **Streak milestones**: At combo 5/10/25, full-screen text slam ("ON FIRE!", "UNSTOPPABLE!", "DOMINATION!") with scale-in animation + 40-particle burst + strong camera shake.
7. **Damage feedback**: Red flash overlay (alpha 0.4, 300ms), strong camera shake (0.18 intensity), HUD heart scale-up + shake animation.
8. **Arena glow pulse**: Edge glow strips oscillate opacity sinusoidally (period 2s, range 0.3-0.7).
9. **Game over**: Slow-motion (delta multiplied by 0.2 for 1 second, only affects gameplay entities), 35-particle explosion, red flash, camera zoom toward center (z offset -2 over 0.8s).
10. **Clean reset**: All effects (camera position, slow-mo, particles, trails, muzzle flashes, zoom) properly cleaned up on restart.

### Files modified
- `src/core/Constants.js` — added EFFECTS object
- `src/core/Game.js` — integrated EffectsSystem (construction, entrance trigger, animate loop with slow-mo + trail updates, reset on restart)
- `src/systems/EffectsSystem.js` — new file (full effects system)

### Architecture notes
- EffectsSystem uses raw delta for its own animations (particles always smooth) but provides `getDeltaMultiplier()` for gameplay slow-mo
- All 3D particles use THREE.Points with BufferGeometry for GPU efficiency, additive blending, and proper disposal
- HTML overlays used for screen flash and text (more reliable than post-processing, no shader overhead)
- Particle bursts capped at 40 per burst for mobile performance
- All geometries and materials disposed when particles expire

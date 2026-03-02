# GigaChad Gym Simulator — Progress

## Original Prompt
GigaChad Gym Simulator - endless gym workout simulator where GigaChad catches falling weights to build Chad Score. Rhythm/timing game meets weightlifting sim in a 3D gym environment.

## Step 1: Scaffold (Complete)

### What was built
- Full Three.js game with event-driven modular architecture
- GigaChad character built from box primitives (wide torso, thick arms, small head)
- Three weight types: dumbbell (blue, 1pt), barbell (red, 3pt), kettlebell (gold, 5pt)
- Protein shake powerup (green glow, 2x multiplier for 8s)
- 3-life system with screen shake on miss
- Combo tracking with visual feedback
- Flex mechanic (Space key) for bonus points during catch
- Difficulty ramp: speed/frequency increase every 10s up to level 15
- Entrance animation: GigaChad bounces in from off-screen
- Gym environment: dark rubber floor, walls with accent stripes, ceiling, dramatic lighting
- Mobile support: virtual joystick + flex button
- Full `render_game_to_text()` with all game state
- `advanceTime(ms)` for testing
- Game over overlay with score, best, combo stats + keyboard restart
- Play.fun safe zone respected on all overlays

### Architecture
- `core/` — Game.js (orchestrator), EventBus.js (18 events), GameState.js, Constants.js
- `gameplay/` — Player.js, WeightManager.js, PowerupManager.js
- `systems/` — InputSystem.js (keyboard + touch)
- `level/` — LevelBuilder.js (gym environment), AssetLoader.js (for future GLB models)
- `ui/` — Menu.js (game over + HUD lives/multiplier/combo)

### Decisions
- Fixed camera (no OrbitControls) — keeps focus on falling weights
- Auto-catch mechanic (no button press needed) — more accessible, especially on mobile
- Flex is optional bonus mechanic, not required to play
- Player built from boxes (Step 2 will replace with 3D models)
- Weights built from basic geometries (Step 2 will improve)

### TODOs for next steps
- [x] Step 1.5: Replace primitives with Meshy AI GLB models
- [x] Step 2: Visual design — particles, transitions, screen effects, juice
- [ ] Step 4: Record promo video
- [ ] Step 5: Add BGM (gym beats) + SFX (catch clank, miss thud, powerup chime, flex grunt)
- [ ] Step 6: Deploy to here.now
- [ ] Step 7: Monetize with Play.fun

## Step 1.5: 3D Assets (Complete)

### Models used (all Meshy AI-generated)
- **gigachad.glb** (1.6 MB) — Rigged character with skeleton, base pose
- **gigachad-walk.glb** (1.6 MB) — Walking animation clip
- **gigachad-run.glb** (1.6 MB) — Running animation clip
- **barbell.glb** (1.7 MB) — Red barbell weight prop
- **dumbbell.glb** (715 KB) — Blue dumbbell weight prop
- **kettlebell.glb** (719 KB) — Gold kettlebell weight prop
- **protein-shake.glb** (588 KB) — Green protein shake powerup

### What was changed
- **Constants.js** — Added `MODELS` config section with paths, scales, and rotation for all 7 GLB files
- **Player.js** — Replaced primitive box character with rigged GLB model using `SkeletonUtils.clone()` via `loadAnimatedModel()`. Walk/run animations loaded from separate GLB files. `AnimationMixer` drives smooth `fadeToAction()` transitions between idle and walk states. Primitive box model retained as `.catch()` fallback
- **WeightManager.js** — All 3 weight types (dumbbell, barbell, kettlebell) now load GLB models via `loadModel()`. Models are cloned per spawn with independent materials for opacity fading on catch. Primitive geometries retained as fallback
- **PowerupManager.js** — Protein shake GLB loaded and cloned per spawn. Green glow sphere preserved around the model. Primitive cylinder fallback retained
- **Game.js** — Added `preloadAll()` call before `startGame()` that loads all 7 GLB paths in parallel. Render loop starts immediately (gym environment visible during load). Game begins after preload completes (or gracefully falls back on failure)

### Scale/orientation adjustments
- GigaChad: scale 2.0, rotationY = Math.PI (Meshy models face +Z, flipped to face camera)
- Weights: dumbbell 0.8, barbell 0.5, kettlebell 0.7 (scaled to match game proportions)
- Protein shake: scale 0.8
- All models auto-aligned to floor via bounding box calculation (`position.y = -bbox.min.y`)

### Issues / Notes
- Animation clip names from Meshy vary per model — clips logged to console on load for debugging
- Walk/run clips loaded from separate GLB files (Meshy exports animations as separate files)
- All model loads have `.catch()` fallback to original primitive geometries — game fully playable even if all GLBs fail to load
- Materials cloned per instance for weight fade-out animation (opacity changes must be independent)

## Step 2: Design (Complete)

### What was added
Three new effect systems under `src/effects/`, plus Constants and Game.js integration.

### New files
- **`src/effects/ParticleManager.js`** — GPU particle system using `THREE.Points` with a pre-allocated pool of 200 particles. Supports burst emissions at arbitrary positions with configurable count, color, and speed. Also manages ambient floating dust/chalk particles (30 always-active motes drifting through the gym) and expanding shockwave rings on the floor.
- **`src/effects/FloatingText.js`** — CSS-based floating score text. Projects 3D catch positions to screen coordinates and shows "+N" text that rises upward and fades over 1 second. Font size scales with combo level (28px base + 4px per combo, capped at 56px). Colors match weight types: blue for dumbbell, red for barbell, gold for kettlebell. Also shows "2x POWER!" for powerup collection and streak milestone labels ("ON FIRE!", "UNSTOPPABLE!", "LEGENDARY!", "GODLIKE!", "GIGACHAD!").
- **`src/effects/ScreenEffects.js`** — Full-screen visual effects manager. Handles flash overlays (white on entrance, red on miss, green on powerup, gold on streak), camera FOV pulse (60 to 55 degrees on catch, 0.1s in / 0.2s out), directional light intensity pulse (+0.3 for 0.2s on catch/powerup/streak), hit freeze (60ms gameplay pause on damage), and combo-scaled screen shake (base 0.15 + combo * 0.03, capped at 0.5).

### Modified files
- **`src/core/Constants.js`** — Added `EFFECTS` configuration object with 35+ tuning values: particle pool size, burst counts per event type (catch: 15, miss: 10, powerup: 20, streak: 40, entrance: 20), particle physics (size, speed, lifetime, gravity), ambient particle settings (count: 30, drift speed, size, opacity), floating text parameters (duration, rise, font sizes), flash overlay durations/alphas, hit freeze duration (60ms), FOV pulse amounts/timing, light pulse amount/duration, shockwave ring settings, and per-weight-type particle colors.
- **`src/core/Game.js`** — Integrated all three effects systems. Creates `ParticleManager`, `FloatingText`, and `ScreenEffects` instances during construction. The animate loop now: (1) updates screen effects first to get freeze/shake state, (2) updates particles and floating text every frame (even during freeze for visual continuity), (3) skips gameplay updates during hit freeze, (4) applies screen shake offsets to camera position. Removed the old manual screen shake implementation (`_shakeTimer`, `_shakeIntensity`, `_triggerScreenShake()`, `PLAYER_HIT` listener) in favor of the ScreenEffects system.
- **`src/level/LevelBuilder.js`** — Exposed the directional light as `this.dirLight` (was a local variable) so Game.js can pass it to ScreenEffects for the light pulse effect.

### Event-to-effect mapping
| Event | Particles | Floating Text | Screen Effect |
|-------|-----------|---------------|---------------|
| `WEIGHT_CAUGHT` | 15-40 particles (color by type, count scales with combo) | "+N" score popup (color by type, size by combo) | FOV pulse + light pulse. White flash at combo >= 3 |
| `WEIGHT_MISSED` | 10 red particles at floor + shockwave ring | - | Red flash + screen shake |
| `POWERUP_COLLECTED` | 20 green spiral particles | "2x POWER!" centered text | Green flash + light pulse |
| `SPECTACLE_COMBO` | 10 + combo*3 gold particles | - | Combo-scaled micro-shake |
| `SPECTACLE_STREAK` | 40 orange particles + gold shockwave ring | Milestone label (ON FIRE!/UNSTOPPABLE!/etc.) | Gold flash + strong shake + light pulse |
| `SPECTACLE_ENTRANCE` | 20 white particles (delayed 1s for landing) | - | White flash + small shake (delayed 1s) |
| `PLAYER_HIT` | - | - | 60ms hit freeze |

### Ambient effects (always active)
- 30 floating dust/chalk particles drifting slowly through the gym volume with sinusoidal motion
- Particles wrap around gym boundaries for seamless loop
- Opacity gently pulses over time

### Design decisions
- All effects are non-blocking and degrade gracefully via try/catch
- Particle pool is pre-allocated (zero GC during gameplay)
- Ambient particles use separate THREE.Points instance (always rendered, not pooled)
- Floating text uses CSS positioned divs (not Three.js sprites) for crisp rendering at all resolutions
- Shockwave rings are individual meshes created and disposed per instance (low frequency events)
- Hit freeze skips gameplay updates but continues rendering particles/effects for visual continuity
- Screen shake is managed entirely by ScreenEffects (old manual shake removed from Game.js)
- All magic numbers in Constants.js under the EFFECTS object

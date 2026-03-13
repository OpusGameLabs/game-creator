---
name: add-3d-assets
description: Replace primitive 3D shapes with real GLB models — animated characters, world props, buildings, and scenery for Three.js games. Use when the user says "add 3D models", "replace the boxes with real models", "add GLB assets", or "make the 3D game look real". For 2D pixel art, use add-assets instead. Do NOT use for 2D pixel art (use add-assets) or gameplay changes (use add-feature).
argument-hint: "[path-to-game]"
license: MIT
metadata:
  author: OpusGameLabs
  version: 1.3.0
  tags: [game, 3d, assets, glb, models, threejs]
---

## Performance Notes

- Take your time to do this thoroughly
- Quality is more important than speed
- Do not skip validation steps

# Add 3D Assets

Replace basic geometric shapes (BoxGeometry, SphereGeometry) with real 3D models. Characters get custom Meshy AI-generated models with rigging and animation. World objects get generated or sourced from free libraries.

## Instructions

Analyze the game at `$ARGUMENTS` (or the current directory if no path given).

First, load the game-3d-assets skill and the meshyai skill for the full model pipeline, AssetLoader pattern, Meshy generation, and integration patterns.

### Step 1: Get Meshy API Key

Check if `MESHY_API_KEY` is set. First check `.env`:
`test -f .env && grep -q '^MESHY_API_KEY=.' .env && echo "found"`
If found, export it with `set -a; . .env; set +a` and skip the prompt.

If not set, ask the user:

> I'll generate custom 3D models with Meshy AI for the best results. You can get a free API key in 30 seconds:
> 1. Sign up at https://app.meshy.ai
> 2. Go to Settings → API Keys
> 3. Create a new API key
>
> Paste your key below like: `MESHY_API_KEY=your-key-here`
> (It will be saved to .env and redacted from this conversation automatically.)
>
> Or type "skip" to use free model libraries instead.

### Step 2: Audit

- Read `package.json` to confirm this is a Three.js game (not Phaser — use `/add-assets` for 2D games)
- Read `src/core/Constants.js` for entity types, sizes, colors
- Read entity files (`src/gameplay/*.js`, `src/entities/*.js`) — find `BoxGeometry`, `SphereGeometry`, etc.
- Read `src/level/LevelBuilder.js` for environment primitives
- List every entity using geometric shapes
- Identify which entity is the **player character** (needs animated model)

### Step 3: Plan

Split entities into two categories:

**Animated characters** (player, enemies with AI) — generate with Meshy AI:

| Entity | Meshy Prompt | Notes |
|--------|-------------|-------|
| Player | "a heroic knight, low poly game character, full body, t-pose" | Generate → rig → animate |
| Enemy | "a goblin warrior with a club, low poly game character" | Generate → rig → animate |

If Meshy unavailable, fall back to `assets/3d-characters/`:
- **Soldier** — realistic military (Idle, Walk, Run) — best default
- **Xbot** — stylized mannequin (idle, walk, run + additive poses)
- **RobotExpressive** — cartoon robot (Idle, Walking, Running, Dance, Jump + 8 more)
- **Fox** — low-poly animal (Survey, Walk, Run) — scale 0.02

**World objects** (buildings, props, scenery, collectibles) — generate with Meshy or search free libraries:

| Entity | Meshy Prompt | Fallback Source |
|--------|-------------|-----------------|
| Tree | "a low poly stylized tree, game asset" | Poly Haven |
| House | "a medieval house, low poly game asset" | Poly Haven |
| Barrel | "a wooden barrel, low poly game asset" | Poly Haven |
| Coin | "a gold coin, game collectible item" | Sketchfab |

### Step 4: Generate / Download

**With Meshy (preferred):**
```bash
# Generate characters
MESHY_API_KEY=<key> node <plugin-root>/scripts/meshy-generate.mjs \
  --mode text-to-3d \
  --prompt "a heroic knight, low poly game character, full body" \
  --polycount 15000 --pbr \
  --output public/assets/models/ --slug player

# Rig characters for animation
MESHY_API_KEY=<key> node <plugin-root>/scripts/meshy-generate.mjs \
  --mode rig --task-id <refine-task-id> --height 1.7 \
  --output public/assets/models/ --slug player-rigged

# Generate static props
MESHY_API_KEY=<key> node <plugin-root>/scripts/meshy-generate.mjs \
  --mode text-to-3d \
  --prompt "a wooden barrel, low poly game asset" \
  --polycount 5000 \
  --output public/assets/models/ --slug barrel
```

**Without Meshy (fallback):**
```bash
# Characters — copy from library
cp <plugin-root>/assets/3d-characters/models/Soldier.glb public/assets/models/

# World objects — search and download
node <plugin-root>/scripts/find-3d-asset.mjs --query "barrel" --source polyhaven \
  --output public/assets/models/ --slug barrel
```

### Step 5: Integrate

1. Create `src/level/AssetLoader.js` — **use `SkeletonUtils.clone()` for animated models** (import from `three/addons/utils/SkeletonUtils.js`). Regular `.clone()` breaks skeleton → T-pose.
2. Add `CHARACTER` to Constants.js with `path`, `scale`, `facingOffset`, `clipMap`
3. Add `ASSET_PATHS` and `MODEL_CONFIG` for static models
4. Update `Player.js`:
   - `THREE.Group` as position anchor
   - `loadAnimatedModel()` + `AnimationMixer`
   - `fadeToAction()` for idle/walk/run crossfade
   - Camera-relative WASD via `applyAxisAngle(_up, cameraAzimuth)`
   - Model facing: `atan2(v.x, v.z) + CHARACTER.facingOffset`
   - `model.quaternion.rotateTowards(targetQuat, turnSpeed * delta)`
5. Update `Game.js`:
   - Add `OrbitControls` — third-person camera orbiting player
   - Camera follows: move `orbitControls.target` + `camera.position` by player delta
   - Pass `orbitControls.getAzimuthalAngle()` to Player for camera-relative movement
6. Replace environment primitives with `loadModel()` calls + `.catch()` fallback
7. Add `THREE.GridHelper` for visible movement reference
8. Preload all models on startup with `preloadAll()` for instant loading

### Step 6: Tune & Verify

- Run `npm run dev` — walk around with WASD, orbit camera with mouse
- Confirm character animates (Idle when stopped, Walk when moving, Run with Shift)
- Adjust `MODEL_CONFIG` values (scale, rotationY, offsetY) per model
- Run `npm run build` to confirm no errors
- Generate `ATTRIBUTION.md` from `.meta.json` files

## Example Usage

### With Meshy AI
```
/add-3d-assets examples/space-explorer
```
Result: Generates custom knight model via Meshy → rigs and animates (Idle/Walk/Run) → replaces BoxGeometry player with animated GLB → adds OrbitControls camera → world props from free libraries.

### Without Meshy (fallback)
```
/add-3d-assets examples/3d-platformer
```
Result: Copies Soldier.glb from character library → configures SkeletonUtils.clone() → fadeToAction animation crossfade → replaces all primitives with library/downloaded models.

## Troubleshooting

### Model stuck in T-pose (not animating)
**Cause:** Using `.clone(true)` instead of `SkeletonUtils.clone()` breaks skeleton bindings on animated GLB models.
**Fix:** Always use `SkeletonUtils.clone()` from `three/addons/utils/SkeletonUtils.js` for any model with animations. Regular `.clone()` copies the mesh but not the skeleton bindings.

### Meshy AI generation fails or returns low quality
**Cause:** Vague prompts or wrong generation mode selected.
**Fix:** Use specific, descriptive prompts (e.g., "low-poly medieval wooden treasure chest, game asset" not "chest"). For characters, use image-to-3D mode with a reference image. Set art style to "game-asset" or "low-poly" for better game integration.

### Rigging fails on generated model
**Cause:** The model geometry is not suitable for auto-rigging (too complex, non-manifold, or not humanoid).
**Fix:** Simplify the prompt to produce cleaner geometry. Ensure the model is a single connected mesh in a humanoid pose. Non-humanoid models (props, vehicles) should not be rigged — use them as static assets instead.

### meshopt decoder error on load
**Cause:** Some GLB files use meshopt compression which requires a decoder not loaded by default.
**Fix:** Add the meshopt decoder before loading: `import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'; loader.setMeshoptDecoder(MeshoptDecoder);`

### Model facing wrong direction
**Cause:** Different model sources use different forward directions. Mixamo models face -Z, some others face +Z.
**Fix:** Store a `facingOffset` per character model. Apply it as `model.rotation.y = facingOffset + movementAngle`. Common values: Soldier/Xbot need `+Math.PI`, Robot/Fox need `+0`.

## Next Step

Tell the user:

> Your 3D game now has custom models! Characters were generated with Meshy AI (or sourced from the model library), rigged, and animated. World objects are loaded from GLB files.
>
> **Files created:**
> - `src/level/AssetLoader.js` — model loader with SkeletonUtils
> - `public/assets/models/` — generated and downloaded GLB models
> - OrbitControls third-person camera
>
> **Controls:** WASD to move, Shift to run, mouse drag to orbit camera, scroll to zoom.
> Run the game to see everything in action. Adjust `MODEL_CONFIG` in Constants.js to fine-tune scale and orientation.

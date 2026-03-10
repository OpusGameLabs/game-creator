# Meshy AI — Rigging Pipeline

**Every humanoid character MUST be rigged.** Static models require hacky programmatic animation (moving wrapper groups) that looks artificial. Rigged models get proper skeletal animation — walk, run, punch, etc.

## When to Rig

| Model type | Rig? | Why |
|-----------|------|-----|
| Humanoid character (player, NPC, enemy) | **YES — always** | Skeletal animation for walk/run/idle/attack |
| Animal with legs | **YES** | Walk/run animations |
| Vehicle, prop, building | No | Static or simple rotation |
| Abstract shape, particle | No | Procedural animation |

## Full Pipeline: Generate -> Rig -> Animate -> Integrate

**Step 1: Generate the model**
```bash
MESHY_API_KEY=<key> node scripts/meshy-generate.mjs \
  --mode text-to-3d \
  --prompt "a stylized robot boxer, low poly game character, full body" \
  --pbr --polycount 15000 \
  --output public/assets/models/ --slug robot
```

**Step 2: Rig** (reads refineTaskId from meta.json automatically)
```bash
MESHY_API_KEY=<key> node scripts/meshy-generate.mjs \
  --mode rig \
  --task-id <refine-task-id-from-meta.json> \
  --height 1.7 \
  --output public/assets/models/ --slug robot-rigged
```

Rigging returns:
- `rigged_character_glb_url` — rigged GLB with skeleton (use this as the base model)
- `basic_animations.walking` — walking animation GLB (free, included)
- `basic_animations.running` — running animation GLB (free, included)

**Step 3: Add custom animations** (optional, for game-specific actions)
```bash
# Each action_id corresponds to a different animation
MESHY_API_KEY=<key> node scripts/meshy-generate.mjs \
  --mode animate \
  --task-id <rig-task-id> \
  --action-id <id> \
  --output public/assets/models/ --slug robot-punch
```

**Step 4: Integrate** with `loadAnimatedModel()` + `AnimationMixer`:
```js
import { loadAnimatedModel } from './level/AssetLoader.js';
import * as THREE from 'three';

// Load rigged model (SkeletonUtils.clone preserves bone bindings)
const { model, clips } = await loadAnimatedModel('assets/models/robot-rigged.glb');
const mixer = new THREE.AnimationMixer(model);

// Log clip names — they vary per model
console.log('Clips:', clips.map(c => c.name));

// Load additional animation GLBs and add their clips to the same mixer
const walkData = await loadAnimatedModel('assets/models/robot-walk.glb');
const walkClip = walkData.clips[0];
const walkAction = mixer.clipAction(walkClip);

// fadeToAction pattern for smooth transitions
function fadeToAction(nextAction, duration = 0.3) {
  if (activeAction) activeAction.fadeOut(duration);
  nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();
  activeAction = nextAction;
}

// In update loop:
mixer.update(delta);
```

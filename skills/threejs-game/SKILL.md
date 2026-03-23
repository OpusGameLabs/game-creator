---
name: threejs-game
description: Build 3D browser games with Three.js using event-driven modular architecture. Use when creating a new 3D game, adding 3D game features, setting up Three.js scenes, or working on any Three.js game project.
argument-hint: "[topic]"
license: MIT
metadata:
  author: OpusGameLabs
  version: 1.3.0
  tags: [game, 3d, threejs, webgl, event-driven, modular]
---

# Three.js Game Development

You are an expert Three.js game developer. Follow these opinionated patterns when building 3D browser games.

> **Reference**: See `reference/llms.txt` (quick guide) and `reference/llms-full.txt` (full API + TSL) for official Three.js LLM documentation. Prefer patterns from those files when they conflict with this skill.

## Performance Notes

- Take your time with each step. Quality is more important than speed.
- Do not skip validation steps — they catch issues early.
- Read the full context of each file before making changes.
- Profile before optimizing. The bottleneck is rarely where you think.

## Reference Files

For detailed reference, see companion files in this directory:
- `core-patterns.md` — Full EventBus, GameState, Constants, and Game.js orchestrator code
- `tsl-guide.md` — Three.js Shading Language reference (NodeMaterial classes, when to use TSL)
- `input-patterns.md` — Gyroscope input, virtual joystick, unified analog InputSystem, input priority system

## Tech Stack

- **Renderer**: Three.js (`three@0.183.0+`, ESM imports)
- **Build Tool**: Vite
- **Language**: JavaScript (not TypeScript) for game templates — TypeScript optional
- **Package Manager**: npm

## Project Setup

When scaffolding a new Three.js game:

```bash
mkdir <game-name> && cd <game-name>
npm init -y
npm install three@^0.183.0
npm install -D vite
```

Create `vite.config.js`:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: { port: 3000, open: true },
  build: { outDir: 'dist' },
});
```

Add to `package.json` scripts:

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Modern Import Patterns

### Vite / npm (default — used in our templates)

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
```

### Import Maps / CDN (standalone HTML games, no build step)

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.183.0/examples/jsm/"
  }
}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
</script>
```

Use import maps when shipping a single HTML file with no build tooling. Pin the version in the import map URL.

## Required Architecture

Every Three.js game MUST use this directory structure:

```
src/
├── core/
│   ├── Game.js          # Main orchestrator - init systems, render loop
│   ├── EventBus.js      # Singleton pub/sub for all module communication
│   ├── GameState.js     # Centralized state singleton
│   └── Constants.js     # ALL config values, balance numbers, asset paths
├── systems/             # Low-level engine systems
│   ├── InputSystem.js   # Keyboard/mouse/gamepad input
│   ├── PhysicsSystem.js # Collision detection
│   └── ...              # Audio, particles, etc.
├── gameplay/            # Game mechanics
│   └── ...              # Player, enemies, weapons, etc.
├── level/               # Level/world building
│   ├── LevelBuilder.js  # Constructs the game world
│   └── AssetLoader.js   # Loads models, textures, audio
├── ui/                  # User interface
│   └── ...              # Game over, overlays
└── main.js              # Entry point - creates Game instance
```

## Core Principles

1. **Core loop first** — Implement one camera, one scene, one gameplay loop. Add player input and a terminal condition (win/lose) **before** adding visual polish. Keep initial scope small: 1 mechanic, 1 fail condition, 1 scoring system.
2. **Gameplay clarity > visual complexity** — Treat 3D as a style choice, not a complexity mandate. A readable game with simple materials beats a visually complex but confusing one.
3. **Restart-safe** — Gameplay must be fully restart-safe. `GameState.reset()` must restore a clean slate. Dispose geometries/materials/textures on cleanup. No stale references or leaked listeners across restarts.

## Core Patterns (Non-Negotiable)

Every Three.js game requires these four core modules. Full implementation code is in `core-patterns.md`.

### 1. EventBus Singleton

ALL inter-module communication goes through an EventBus (`core/EventBus.js`). Modules never import each other directly for communication. Provides `on`, `once`, `off`, `emit`, and `clear` methods. Events use `domain:action` naming (e.g., `player:hit`, `game:over`). See `core-patterns.md` for the full implementation.

### 2. Centralized GameState

One singleton (`core/GameState.js`) holds ALL game state. Systems read from it, events update it. Must include a `reset()` method that restores a clean slate for restarts. See `core-patterns.md` for the full implementation.

### 3. Constants File

Every magic number, balance value, asset path, and configuration goes in `core/Constants.js`. Never hardcode values in game logic. Organize by domain: `PLAYER_CONFIG`, `ENEMY_CONFIG`, `WORLD`, `CAMERA`, `COLORS`, `ASSET_PATHS`. See `core-patterns.md` for the full implementation.

### 4. Game.js Orchestrator

The Game class (`core/Game.js`) initializes everything and runs the render loop. Uses `renderer.setAnimationLoop()` -- the official Three.js pattern (handles WebGPU async correctly and pauses when the tab is hidden). Sets up renderer, scene, camera, systems, UI, and event listeners in `init()`. See `core-patterns.md` for the full implementation.

## Renderer Selection

### WebGLRenderer (default — use for all game templates)

Maximum browser compatibility. Well-established, most examples and tutorials use this. Our templates default to WebGLRenderer.

```js
import * as THREE from 'three';
const renderer = new THREE.WebGLRenderer({ antialias: true });
```

### WebGPURenderer (when you need TSL or compute shaders)

Required for custom node-based materials (TSL), compute shaders, and advanced rendering. Note: import path changes to `'three/webgpu'` and init is async.

```js
import * as THREE from 'three/webgpu';
const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init();
```

**When to pick WebGPU**: You need TSL custom shaders, compute shaders, or node-based materials. Otherwise, stick with WebGL. See `tsl-guide.md` for TSL details.

## Play.fun Safe Zone

When games run inside the Play.fun dashboard on mobile Safari, the SDK sets CSS custom properties on the game iframe's `document.documentElement`:

- `--ogp-safe-top-inset` — space below the Play.fun header bubbles (~68px on mobile)
- `--ogp-safe-bottom-inset` — space above Safari bottom controls (~148px on mobile)

Both default to `0px` when not running inside the dashboard (desktop, standalone).

### Constants

```js
// In Constants.js — reads SDK CSS vars with static fallbacks
function _readSafeInsets() {
  const s = getComputedStyle(document.documentElement);
  return {
    top: parseInt(s.getPropertyValue('--ogp-safe-top-inset')) || 0,
    bottom: parseInt(s.getPropertyValue('--ogp-safe-bottom-inset')) || 0,
  };
}
const _insets = _readSafeInsets();

export const SAFE_ZONE = {
  TOP_PX: Math.max(75, _insets.top),
  BOTTOM_PX: _insets.bottom,
  TOP_PERCENT: 8,
};
```

### CSS Rule

All `.overlay` elements (game-over, pause, menus) must use the CSS variables for padding:

```css
.overlay {
  padding-top: max(20px, 8vh, var(--ogp-safe-top-inset, 0px));
  padding-bottom: var(--ogp-safe-bottom-inset, 0px);
}
```

Bottom-positioned UI (joysticks, action buttons) must also respect the bottom inset:

```css
#joystick-zone {
  bottom: max(20px, 3vh, var(--ogp-safe-bottom-inset, 0px));
}
.bottom-hud {
  margin-bottom: var(--ogp-safe-bottom-inset, 0px);
}
```

### What to Check

- No text, buttons, or interactive elements in the top or bottom inset areas
- Game-over overlays center content in the **usable area** (between both insets), not the full viewport
- Score displays, titles, and restart buttons are all visible and not hidden behind browser chrome
- Bottom-positioned controls (joysticks, action buttons) are not clipped by Safari bottom bar

**Note**: The 3D canvas itself renders behind the chrome, which is fine — the game should bleed to fill the full viewport. Only HTML overlay UI needs the safe zone offset. In-world 3D elements (HUD textures, floating text) should avoid the top 8% and bottom inset of screen space.

## Performance Rules

- **Use `renderer.setAnimationLoop()`** instead of manual `requestAnimationFrame`. It pauses when the tab is hidden and handles WebGPU async correctly.
- **Cap delta time**: `Math.min(clock.getDelta(), 0.1)` to prevent death spirals
- **Cap pixel ratio**: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` — avoids GPU overload on high-DPI screens
- **Object pooling**: Reuse `Vector3`, `Box3`, temp objects in hot loops to minimize GC. Avoid per-frame allocations — preallocate and reuse.
- **Disable shadows on first pass** — Only enable shadow maps when specifically needed and tested on mobile. Dynamic shadows are the single most expensive rendering feature.
- **Keep draw calls low** — Fewer unique materials and geometries = fewer draw calls. Merge static geometry where possible. Use instanced meshes for repeated objects.
- **Prefer simple materials** — Use `MeshBasicMaterial` or `MeshStandardMaterial`. Avoid `MeshPhysicalMaterial`, custom shaders, or complex material setups unless specifically needed.
- **No postprocessing by default** — Skip bloom, SSAO, motion blur, and other postprocessing passes on first implementation. These tank mobile performance. Add only after gameplay is solid and perf budget allows.
- **Keep geometry/material count small** — A game with 10 unique materials renders faster than one with 100. Reuse materials across objects with the same appearance.
- **Use `powerPreference: 'high-performance'`** on the renderer
- **Dispose properly**: Call `.dispose()` on geometries, materials, textures when removing objects
- **Frustum culling**: Let Three.js handle it (enabled by default) but set bounding spheres on custom geometry

## Asset Loading

- Place static assets in `/public/` for Vite
- Use GLB format for 3D models (smaller, single file)
- Use `THREE.TextureLoader`, `GLTFLoader` from `three/addons`
- Show loading progress via callbacks to UI

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

function loadModel(path) {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => reject(error),
    );
  });
}
```

## Input Handling (Mobile-First)

All games MUST work on desktop AND mobile unless explicitly specified otherwise. Allocate 60% effort to mobile / 40% desktop when making tradeoffs. Choose the best mobile input for each game concept:

| Game Type | Primary Mobile Input | Fallback |
|-----------|---------------------|----------|
| Marble/tilt/balance | Gyroscope (DeviceOrientation) | Virtual joystick |
| Runner/endless | Tap zones (left/right half) | Swipe gestures |
| Puzzle/turn-based | Tap targets (44px min) | Drag & drop |
| Shooter/aim | Virtual joystick + tap-to-fire | Dual joysticks |
| Platformer | Virtual D-pad + jump button | Tilt for movement |

### Unified Analog InputSystem

Use a dedicated InputSystem that merges keyboard, gyroscope, and touch into a single analog interface. Game logic reads `moveX`/`moveZ` (-1..1) and never knows the source. Keyboard input is always active as an override; on mobile, the system initializes gyroscope (with iOS 13+ permission request) or falls back to a virtual joystick. See `input-patterns.md` for the full implementation, including GyroscopeInput, VirtualJoystick, and input priority patterns.

## When Adding Features

1. Create a new module in the appropriate `src/` subdirectory
2. Define new events in `EventBus.js` Events object using `domain:action` naming
3. Add configuration to `Constants.js`
4. Add state to `GameState.js` if needed
5. Wire it up in `Game.js` orchestrator
6. Communicate with other systems ONLY through EventBus

## Pre-Ship Validation Checklist

Before considering a game complete, verify:

- [ ] **Core loop works** — Player can start, play, lose/win, and see the result
- [ ] **Restart works cleanly** — `GameState.reset()` restores a clean slate, all Three.js resources disposed
- [ ] **Touch + keyboard input** — Game works on mobile (gyro/joystick/tap) and desktop (keyboard/mouse)
- [ ] **Responsive canvas** — Renderer resizes on window resize, camera aspect updated
- [ ] **All values in Constants** — Zero hardcoded magic numbers in game logic
- [ ] **EventBus only** — No direct cross-module imports for communication
- [ ] **Resource cleanup** — Geometries, materials, textures disposed when removed from scene
- [ ] **No postprocessing** — Unless explicitly needed and tested on mobile
- [ ] **Shadows disabled** — Unless explicitly needed and budget allows
- [ ] **Delta-capped movement** — `Math.min(clock.getDelta(), 0.1)` on every frame
- [ ] **Mute toggle** — Audio can be muted/unmuted; `isMuted` state is respected
- [ ] **Safe zone respected** — All HTML overlay UI uses `var(--ogp-safe-top-inset)` / `var(--ogp-safe-bottom-inset)` for Play.fun safe area; bottom controls offset above the bottom inset
- [ ] **Build passes** — `npm run build` succeeds with no errors
- [ ] **No console errors** — Game runs without uncaught exceptions or WebGL failures

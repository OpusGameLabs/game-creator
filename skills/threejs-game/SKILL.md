---
name: threejs-game
description: Build 3D browser games with Three.js using event-driven modular architecture. Use when creating a new 3D game, adding 3D game features, setting up Three.js scenes, or working on any Three.js game project.
---

# Three.js Game Development

You are an expert Three.js game developer. Follow these opinionated patterns when building 3D browser games.

## Tech Stack

- **Renderer**: Three.js (latest stable, ESM imports)
- **Build Tool**: Vite
- **Language**: TypeScript
- **Package Manager**: npm

## Project Setup

When scaffolding a new Three.js game:

```bash
mkdir <game-name> && cd <game-name>
npm init -y
npm install three
npm install -D vite typescript @types/three
```

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: { port: 3000, open: true },
  build: { outDir: 'dist' },
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

Add to `package.json` scripts:

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

## Required Architecture

Every Three.js game MUST use this directory structure:

```
src/
├── core/
│   ├── Game.ts          # Main orchestrator - init systems, render loop
│   ├── EventBus.ts      # Singleton pub/sub for all module communication
│   ├── GameState.ts     # Centralized state singleton
│   └── Constants.ts     # ALL config values, balance numbers, asset paths
├── systems/             # Low-level engine systems
│   ├── InputSystem.ts   # Keyboard/mouse/gamepad input
│   ├── PhysicsSystem.ts # Collision detection
│   └── ...              # Audio, particles, etc.
├── gameplay/            # Game mechanics
│   └── ...              # Player, enemies, weapons, etc.
├── level/               # Level/world building
│   ├── LevelBuilder.ts  # Constructs the game world
│   └── AssetLoader.ts   # Loads models, textures, audio
├── ui/                  # User interface
│   └── ...              # Menus, HUD, overlays
└── main.ts              # Entry point - creates Game instance
```

## Core Principles

1. **Core loop first** — Implement one camera, one scene, one gameplay loop. Add player input and a terminal condition (win/lose) **before** adding visual polish. Keep initial scope small: 1 mechanic, 1 fail condition, 1 scoring system.
2. **Gameplay clarity > visual complexity** — Treat 3D as a style choice, not a complexity mandate. A readable game with simple materials beats a visually complex but confusing one.
3. **Restart-safe** — Gameplay must be fully restart-safe. `GameState.reset()` must restore a clean slate. Dispose geometries/materials/textures on cleanup. No stale references or leaked listeners across restarts.

## Core Patterns (Non-Negotiable)

### 1. EventBus Singleton

ALL inter-module communication goes through an EventBus. Modules never import each other directly for communication.

```typescript
type EventCallback = (data?: any) => void;

class EventBus {
  private listeners = new Map<string, Set<EventCallback>>();

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  once(event: string, callback: EventCallback): void {
    const wrapper: EventCallback = (...args) => {
      this.off(event, wrapper);
      callback(...args);
    };
    this.on(event, wrapper);
  }

  off(event: string, callback: EventCallback): void {
    const cbs = this.listeners.get(event);
    if (cbs) {
      cbs.delete(callback);
      if (cbs.size === 0) this.listeners.delete(event);
    }
  }

  emit(event: string, data?: unknown): void {
    const cbs = this.listeners.get(event);
    if (cbs) cbs.forEach(cb => {
      try { cb(data); } catch (e) { console.error(`EventBus error [${event}]:`, e); }
    });
  }

  clear(event?: string): void {
    event ? this.listeners.delete(event) : this.listeners.clear();
  }
}

export const eventBus = new EventBus();

// Define ALL events as constants — use domain:action naming
export const Events = {
  // Group by domain: player:*, enemy:*, game:*, ui:*, etc.
} as const;
```

### 2. Centralized GameState

One singleton holds ALL game state. Systems read from it, events update it.

```typescript
import { PLAYER_CONFIG } from './Constants';

interface PlayerState {
  health: number;
  score: number;
}

interface GameFlags {
  started: boolean;
  paused: boolean;
  isPlaying: boolean;
  menuState: string;
}

class GameState {
  player: PlayerState = {
    health: PLAYER_CONFIG.HEALTH,
    score: 0,
  };

  game: GameFlags = {
    started: false,
    paused: false,
    isPlaying: false,
    menuState: 'main',
  };

  reset(): void {
    this.player.health = PLAYER_CONFIG.HEALTH;
    this.player.score = 0;
    this.game.started = false;
    this.game.paused = false;
    this.game.isPlaying = false;
    this.game.menuState = 'main';
  }
}

export const gameState = new GameState();
```

### 3. Constants File

Every magic number, balance value, asset path, and configuration goes in `Constants.ts`. Never hardcode values in game logic.

```typescript
export const PLAYER_CONFIG = {
  HEALTH: 100,
  SPEED: 5,
  JUMP_FORCE: 8,
} as const;

export const ENEMY_CONFIG = {
  SPEED: 3,
  HEALTH: 50,
  SPAWN_RATE: 2000,
} as const;

export const WORLD = {
  WIDTH: 100,
  HEIGHT: 50,
  GRAVITY: 9.8,
  FOG_DENSITY: 0.04,
} as const;

export const CAMERA = {
  FOV: 75,
  NEAR: 0.01,
  FAR: 100,
} as const;

export const COLORS = {
  AMBIENT: 0x404040,
  DIRECTIONAL: 0xffffff,
  FOG: 0x000000,
} as const;

export const ASSET_PATHS = {
  // model paths, texture paths, etc.
} as const;
```

### 4. Game.ts Orchestrator

The Game class initializes everything and runs the render loop:

```typescript
import * as THREE from 'three';
import { CAMERA, COLORS, WORLD } from './Constants';

class Game {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock = new THREE.Clock();

  constructor() {
    this.init();
  }

  private init(): void {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupSystems();
    this.setupUI();
    this.setupEventListeners();
    this.animate();
  }

  private setupRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container')!.appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupScene(): void {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.FOG, WORLD.FOG_DENSITY);

    this.scene.add(new THREE.AmbientLight(COLORS.AMBIENT, 0.5));
    const dirLight = new THREE.DirectionalLight(COLORS.DIRECTIONAL, 1);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);
  }

  private setupCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CAMERA.NEAR,
      CAMERA.FAR,
    );
  }

  private setupSystems(): void {
    // Initialize game systems
  }

  private setupUI(): void {
    // Initialize UI overlays
  }

  private setupEventListeners(): void {
    // Subscribe to EventBus events
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.1); // Cap delta to prevent spiral
    // Update all systems with delta
    this.renderer.render(this.scene, this.camera);
  }
}

export default Game;
```

## Performance Rules

- **Cap delta time**: `Math.min(clock.getDelta(), 0.1)` to prevent death spirals
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

```typescript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

function loadModel(path: string): Promise<THREE.Group> {
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

Use a dedicated InputSystem that merges keyboard, gyroscope, and touch into a single analog interface. Game logic reads `moveX`/`moveZ` (-1..1) and never knows the source:

```typescript
class InputSystem {
  private keys: Record<string, boolean> = {};
  moveX = 0;  // -1..1
  moveZ = 0;  // -1..1
  isMobile: boolean;

  constructor() {
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1);
    document.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }

  /** Call from a user gesture (e.g. PLAY button) to init gyro/joystick. */
  async initMobile(): Promise<void> {
    // Request gyroscope permission (required on iOS 13+)
    // If denied/unavailable, show virtual joystick fallback
  }

  /** Call once per frame. Merges all sources into moveX/moveZ. */
  update(): void {
    let mx = 0, mz = 0;
    // Keyboard (always active, acts as override)
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) mx -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) mx += 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) mz -= 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) mz += 1;
    const kbActive = mx !== 0 || mz !== 0;
    if (!kbActive) {
      // Read from gyro or joystick (whichever is active)
    }
    this.moveX = Math.max(-1, Math.min(1, mx));
    this.moveZ = Math.max(-1, Math.min(1, mz));
  }
}
```

### Gyroscope Input Pattern

For tilt-controlled games (marble, balance, racing):

```typescript
class GyroscopeInput {
  available = false;
  moveX = 0;
  moveZ = 0;
  private calibBeta: number | null = null;
  private calibGamma: number | null = null;

  async requestPermission(): Promise<boolean> {
    // iOS 13+: DeviceOrientationEvent.requestPermission()
    // Must be called from a user gesture handler
  }

  recalibrate(): void {
    // Capture current orientation as neutral position
  }

  update(): void {
    // Apply deadzone, normalize to -1..1, smooth with EMA
  }
}
```

### Virtual Joystick Pattern

DOM-based circle-in-circle touch joystick for non-gyro devices:

```typescript
class VirtualJoystick {
  active = false;
  moveX = 0;  // -1..1
  moveZ = 0;  // -1..1

  show(): void {
    // Create outer circle + inner knob DOM elements
    // Track touch by identifier to handle multi-touch correctly
    // Clamp knob movement to maxDistance from center
    // Normalize displacement to -1..1
  }

  hide(): void { /* Remove DOM, reset values */ }
}
```

### Input Priority

1. On mobile: try gyroscope first (request permission from PLAY button tap)
2. If gyro denied/unavailable: show virtual joystick
3. Keyboard always active as fallback/override on any platform
4. Game logic consumes only `input.moveX` and `input.moveZ` -- never knows the source

## When Adding Features

1. Create a new module in the appropriate `src/` subdirectory
2. Define new events in `EventBus.ts` Events enum using `domain:action` naming
3. Add configuration to `Constants.ts`
4. Add state to `GameState.ts` if needed
5. Wire it up in `Game.ts` orchestrator
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
- [ ] **Build passes** — `npm run build` succeeds with no errors
- [ ] **No console errors** — Game runs without uncaught exceptions or WebGL failures

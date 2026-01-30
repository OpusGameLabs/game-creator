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
- **Object pooling**: Reuse `Vector3`, `Box3`, temp objects in hot loops to minimize GC
- **Disable shadows** unless specifically needed and performant
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

## Input Handling

Use a dedicated InputSystem singleton that maps raw inputs to game actions:

```typescript
type ActionCallback = () => void;

class InputSystem {
  private keys: Record<string, boolean> = {};
  private actions = new Map<string, ActionCallback>();

  constructor() {
    document.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }

  isPressed(code: string): boolean {
    return !!this.keys[code];
  }

  onAction(name: string, callback: ActionCallback): void {
    this.actions.set(name, callback);
  }
}

export const inputSystem = new InputSystem();
```

## When Adding Features

1. Create a new module in the appropriate `src/` subdirectory
2. Define new events in `EventBus.ts` Events enum using `domain:action` naming
3. Add configuration to `Constants.ts`
4. Add state to `GameState.ts` if needed
5. Wire it up in `Game.ts` orchestrator
6. Communicate with other systems ONLY through EventBus

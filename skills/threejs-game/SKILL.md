---
name: threejs-game
description: Build 3D browser games with Three.js using event-driven modular architecture. Use when creating a new 3D game, adding 3D game features, setting up Three.js scenes, or working on any Three.js game project.
---

# Three.js Game Development

You are an expert Three.js game developer. Follow these opinionated patterns when building 3D browser games.

## Tech Stack

- **Renderer**: Three.js (latest stable, ESM imports)
- **Build Tool**: Vite
- **Language**: JavaScript ES modules (no TypeScript unless requested)
- **Package Manager**: npm

## Project Setup

When scaffolding a new Three.js game:

```bash
mkdir <game-name> && cd <game-name>
npm init -y
npm install three
npm install -D vite
```

Create `vite.config.js`:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: { port: 3000, open: true },
  build: { outDir: 'dist' }
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
│   └── ...              # Menus, HUD, overlays
└── main.js              # Entry point - creates Game instance
```

## Core Patterns (Non-Negotiable)

### 1. EventBus Singleton

ALL inter-module communication goes through an EventBus. Modules never import each other directly for communication.

```js
class EventBus {
  constructor() { this.listeners = new Map(); }
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }
  once(event, callback) {
    const wrapper = (...args) => { this.off(event, wrapper); callback(...args); };
    this.on(event, wrapper);
  }
  off(event, callback) {
    const cbs = this.listeners.get(event);
    if (cbs) { cbs.delete(callback); if (cbs.size === 0) this.listeners.delete(event); }
  }
  emit(event, data) {
    const cbs = this.listeners.get(event);
    if (cbs) cbs.forEach(cb => { try { cb(data); } catch (e) { console.error(`EventBus error [${event}]:`, e); } });
  }
  clear(event) { event ? this.listeners.delete(event) : this.listeners.clear(); }
}

export const eventBus = new EventBus();

// Define ALL events as constants
export const Events = {
  // Group by domain: player:*, enemy:*, game:*, ui:*, etc.
};
```

### 2. Centralized GameState

One singleton holds ALL game state. Systems read from it, events update it.

```js
class GameState {
  constructor() {
    this.player = { health: 100, /* ... */ };
    this.combat = { /* wave/enemy tracking */ };
    this.game = { started: false, paused: false, isPlaying: false, menuState: 'main' };
    this.setupEventListeners();
  }
  setupEventListeners() { /* subscribe to events that modify state */ }
  reset() { /* restore all state to defaults */ }
}
export const gameState = new GameState();
```

### 3. Constants File

Every magic number, balance value, asset path, and configuration goes in `Constants.js`. Never hardcode values in game logic.

```js
export const PLAYER_CONFIG = { health: 100, speed: 5, /* ... */ };
export const ENEMY_CONFIG = { /* ... */ };
export const ASSET_PATHS = { /* ... */ };
```

### 4. Game.js Orchestrator

The Game class initializes everything and runs the render loop:

```js
class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.init();
  }
  init() {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupSystems();
    this.setupUI();
    this.setupEventListeners();
    this.animate();
  }
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this.onWindowResize());
  }
  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.1); // Cap delta to prevent spiral
    // Update all systems with delta
    this.renderer.render(this.scene, this.camera);
  }
}
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

## Common Three.js Setup

```js
// Scene with fog
this.scene = new THREE.Scene();
this.scene.fog = new THREE.FogExp2(0x000000, 0.04);

// Camera
this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);

// Lighting - always add ambient + directional minimum
this.scene.add(new THREE.AmbientLight(0x404040, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
this.scene.add(dirLight);
```

## Input Handling

Use a dedicated InputSystem singleton that maps raw inputs to game actions:

```js
class InputSystem {
  constructor() {
    this.keys = {};
    this.actions = new Map();
    document.addEventListener('keydown', e => this.keys[e.code] = true);
    document.addEventListener('keyup', e => this.keys[e.code] = false);
  }
  isPressed(code) { return !!this.keys[code]; }
  onAction(name, callback) { this.actions.set(name, callback); }
}
export const inputSystem = new InputSystem();
```

## When Adding Features

1. Create a new module in the appropriate `src/` subdirectory
2. Define new events in `EventBus.js` Events enum
3. Add configuration to `Constants.js`
4. Add state to `GameState.js` if needed
5. Wire it up in `Game.js` orchestrator
6. Communicate with other systems ONLY through EventBus

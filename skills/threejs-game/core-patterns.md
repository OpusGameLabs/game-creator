# Core Patterns -- EventBus, GameState, Constants, Game.js Orchestrator

Full implementation code for the four non-negotiable core modules in every Three.js game. These are referenced from the main SKILL.md.

## 1. EventBus Singleton

ALL inter-module communication goes through an EventBus. Modules never import each other directly for communication.

```js
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback(...args);
    };
    this.on(event, wrapper);
  }

  off(event, callback) {
    const cbs = this.listeners.get(event);
    if (cbs) {
      cbs.delete(callback);
      if (cbs.size === 0) this.listeners.delete(event);
    }
  }

  emit(event, data) {
    const cbs = this.listeners.get(event);
    if (cbs) cbs.forEach(cb => {
      try { cb(data); } catch (e) { console.error(`EventBus error [${event}]:`, e); }
    });
  }

  clear(event) {
    event ? this.listeners.delete(event) : this.listeners.clear();
  }
}

export const eventBus = new EventBus();

// Define ALL events as constants — use domain:action naming
export const Events = {
  // Group by domain: player:*, enemy:*, game:*, ui:*, etc.
};
```

## 2. Centralized GameState

One singleton holds ALL game state. Systems read from it, events update it.

```js
import { PLAYER_CONFIG } from './Constants.js';

class GameState {
  constructor() {
    this.player = {
      health: PLAYER_CONFIG.HEALTH,
      score: 0,
    };
    this.game = {
      started: false,
      paused: false,
      isPlaying: false,
    };
  }

  reset() {
    this.player.health = PLAYER_CONFIG.HEALTH;
    this.player.score = 0;
    this.game.started = false;
    this.game.paused = false;
    this.game.isPlaying = false;
  }
}

export const gameState = new GameState();
```

## 3. Constants File

Every magic number, balance value, asset path, and configuration goes in `Constants.js`. Never hardcode values in game logic.

```js
export const PLAYER_CONFIG = {
  HEALTH: 100,
  SPEED: 5,
  JUMP_FORCE: 8,
};

export const ENEMY_CONFIG = {
  SPEED: 3,
  HEALTH: 50,
  SPAWN_RATE: 2000,
};

export const WORLD = {
  WIDTH: 100,
  HEIGHT: 50,
  GRAVITY: 9.8,
  FOG_DENSITY: 0.04,
};

export const CAMERA = {
  FOV: 75,
  NEAR: 0.01,
  FAR: 100,
};

export const COLORS = {
  AMBIENT: 0x404040,
  DIRECTIONAL: 0xffffff,
  FOG: 0x000000,
};

export const ASSET_PATHS = {
  // model paths, texture paths, etc.
};
```

## 4. Game.js Orchestrator

The Game class initializes everything and runs the render loop. Uses `renderer.setAnimationLoop()` -- the official Three.js pattern (handles WebGPU async correctly and pauses when the tab is hidden):

```js
import * as THREE from 'three';
import { CAMERA, COLORS, WORLD } from './Constants.js';

class Game {
  constructor() {
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
    this.renderer.setAnimationLoop(() => this.animate());
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.FOG, WORLD.FOG_DENSITY);

    this.scene.add(new THREE.AmbientLight(COLORS.AMBIENT, 0.5));
    const dirLight = new THREE.DirectionalLight(COLORS.DIRECTIONAL, 1);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CAMERA.NEAR,
      CAMERA.FAR,
    );
  }

  setupSystems() {
    // Initialize game systems
  }

  setupUI() {
    // Initialize UI overlays
  }

  setupEventListeners() {
    // Subscribe to EventBus events
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.1); // Cap delta to prevent spiral
    // Update all systems with delta
    this.renderer.render(this.scene, this.camera);
  }
}

export default Game;
```

// =============================================================================
// Game.js — Main orchestrator
// Initializes all systems, manages the render loop, wires up EventBus.
// Preloads all GLB models before starting gameplay.
// Third-person camera behind and above GigaChad, fixed position.
// Integrates visual effects: particles, floating text, screen effects.
// =============================================================================

import * as THREE from 'three';
import { GAME, CAMERA, COLORS, ARENA, MODELS } from './Constants.js';
import { eventBus, Events } from './EventBus.js';
import { gameState } from './GameState.js';
import { InputSystem } from '../systems/InputSystem.js';
import { Player } from '../gameplay/Player.js';
import { WeightManager } from '../gameplay/WeightManager.js';
import { PowerupManager } from '../gameplay/PowerupManager.js';
import { LevelBuilder } from '../level/LevelBuilder.js';
import { Menu } from '../ui/Menu.js';
import { preloadAll } from '../level/AssetLoader.js';
import { ParticleManager } from '../effects/ParticleManager.js';
import { FloatingText } from '../effects/FloatingText.js';
import { ScreenEffects } from '../effects/ScreenEffects.js';

export class Game {
  constructor() {
    this.clock = new THREE.Clock();

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GAME.MAX_DPR));
    this.renderer.setClearColor(COLORS.SKY);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.prepend(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.SKY);

    // Camera — fixed third-person behind and above
    this.camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      GAME.NEAR,
      GAME.FAR
    );
    this.camera.position.set(0, CAMERA.HEIGHT, CAMERA.DISTANCE);
    this.camera.lookAt(0, CAMERA.LOOK_AT_Y, 0);

    // Systems
    this.input = new InputSystem();
    this.level = new LevelBuilder(this.scene);
    this.menu = new Menu();

    // Gameplay managers
    this.player = null;
    this.weightManager = null;
    this.powerupManager = null;

    // Camera base position for shake
    this._baseCameraPos = this.camera.position.clone();

    // --- Visual effects systems ---
    // ParticleManager handles burst particles, ambient dust, and shockwaves
    this.particleManager = new ParticleManager(this.scene);

    // FloatingText handles CSS-based "+N" score popups
    this.floatingText = new FloatingText(this.camera, this.renderer);

    // ScreenEffects handles flash overlay, FOV pulse, light pulse, freeze, shake
    this.screenEffects = new ScreenEffects(this.camera, this.level.dirLight);

    // Events
    eventBus.on(Events.GAME_RESTART, () => this.restart());
    eventBus.on(Events.WEIGHT_CAUGHT, () => {
      if (this.player) this.player.triggerLift();
    });

    // Resize
    window.addEventListener('resize', () => this.onResize());

    // Preload all models, then start the game
    this._preloadAndStart();

    // Start render loop immediately (scene renders even during loading)
    this.renderer.setAnimationLoop(() => this.animate());
  }

  async _preloadAndStart() {
    // Collect all model paths to preload
    const paths = [
      MODELS.GIGACHAD.path,
      MODELS.GIGACHAD.walkPath,
      MODELS.GIGACHAD.runPath,
      MODELS.WEIGHTS.dumbbell.path,
      MODELS.WEIGHTS.barbell.path,
      MODELS.WEIGHTS.kettlebell.path,
      MODELS.POWERUP.path,
    ];

    console.log(`Preloading ${paths.length} GLB models...`);

    try {
      await preloadAll(paths, (loaded, total) => {
        console.log(`Models loaded: ${loaded}/${total}`);
      });
      console.log('All models preloaded successfully');
    } catch (err) {
      console.warn('Some models failed to preload (game will use fallbacks):', err.message);
    }

    // Start game after preloading (or after failure — fallbacks will handle it)
    this.startGame();
  }

  startGame() {
    gameState.reset();
    gameState.started = true;

    this.player = new Player(this.scene);
    this.weightManager = new WeightManager(this.scene);
    this.powerupManager = new PowerupManager(this.scene);

    this.input.setGameActive(true);
    this.menu.resetHUD();

    eventBus.emit(Events.GAME_START);
    eventBus.emit(Events.MUSIC_GAMEPLAY);
  }

  restart() {
    // Clean up old game objects
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    if (this.weightManager) {
      this.weightManager.destroy();
      this.weightManager = null;
    }
    if (this.powerupManager) {
      this.powerupManager.destroy();
      this.powerupManager = null;
    }

    this.startGame();
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), GAME.MAX_DELTA);

    // --- Update screen effects (flash, FOV pulse, light pulse, freeze, shake) ---
    const fx = this.screenEffects.update(delta);

    // --- Update particles and floating text (always, even during freeze) ---
    this.particleManager.update(delta);
    this.floatingText.update(delta);

    // --- Gameplay updates (skipped during hit freeze) ---
    if (!fx.frozen) {
      this.input.update();

      if (gameState.started && !gameState.gameOver) {
        if (this.player) {
          this.player.update(delta, this.input);
        }

        if (this.weightManager && this.player) {
          this.weightManager.update(delta, this.player.getPosition());
        }

        if (this.powerupManager && this.player) {
          this.powerupManager.update(delta, this.player.getPosition());
        }
      }
    }

    // --- Apply screen shake from ScreenEffects ---
    this.camera.position.x = this._baseCameraPos.x + fx.shakeX;
    this.camera.position.y = this._baseCameraPos.y + fx.shakeY;

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

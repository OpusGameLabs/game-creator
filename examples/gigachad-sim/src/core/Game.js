// =============================================================================
// Game.js — Main orchestrator
// Initializes all systems, manages the render loop, wires up EventBus.
// Third-person camera behind and above GigaChad, fixed position.
// =============================================================================

import * as THREE from 'three';
import { GAME, CAMERA, COLORS, ARENA } from './Constants.js';
import { eventBus, Events } from './EventBus.js';
import { gameState } from './GameState.js';
import { InputSystem } from '../systems/InputSystem.js';
import { Player } from '../gameplay/Player.js';
import { WeightManager } from '../gameplay/WeightManager.js';
import { PowerupManager } from '../gameplay/PowerupManager.js';
import { LevelBuilder } from '../level/LevelBuilder.js';
import { Menu } from '../ui/Menu.js';

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

    // Screen shake state
    this._shakeTimer = 0;
    this._shakeIntensity = 0;
    this._baseCameraPos = this.camera.position.clone();

    // Events
    eventBus.on(Events.GAME_RESTART, () => this.restart());
    eventBus.on(Events.PLAYER_HIT, () => this._triggerScreenShake());
    eventBus.on(Events.WEIGHT_CAUGHT, () => {
      if (this.player) this.player.triggerLift();
    });

    // Resize
    window.addEventListener('resize', () => this.onResize());

    // Auto-start (no title screen — Play.fun handles chrome)
    this.startGame();

    // Start render loop
    this.renderer.setAnimationLoop(() => this.animate());
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

    // Screen shake
    if (this._shakeTimer > 0) {
      this._shakeTimer -= delta;
      const shakeX = (Math.random() - 0.5) * this._shakeIntensity * 2;
      const shakeY = (Math.random() - 0.5) * this._shakeIntensity * 2;
      this.camera.position.x = this._baseCameraPos.x + shakeX;
      this.camera.position.y = this._baseCameraPos.y + shakeY;
    } else {
      this.camera.position.x = this._baseCameraPos.x;
      this.camera.position.y = this._baseCameraPos.y;
    }

    this.renderer.render(this.scene, this.camera);
  }

  _triggerScreenShake() {
    this._shakeTimer = 0.2;
    this._shakeIntensity = 0.15;
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

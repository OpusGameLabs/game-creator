// =============================================================================
// Game.js — Orchestrator: init all systems, manage game loop
// One entry point that initializes all systems and manages the game lifecycle.
// =============================================================================

import * as THREE from 'three';
import { GAME, CAMERA, COLORS } from './Constants.js';
import { eventBus, Events } from './EventBus.js';
import { gameState } from './GameState.js';
import { InputSystem } from '../systems/InputSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { CameraShake } from '../systems/CameraShake.js';
import { ScreenEffects } from '../systems/ScreenEffects.js';
import { LevelBuilder } from '../level/LevelBuilder.js';
import { Castle } from '../gameplay/Castle.js';
import { EnemyCastle } from '../gameplay/EnemyCastle.js';
import { EnemyManager } from '../gameplay/EnemyManager.js';
import { ProjectileManager } from '../gameplay/ProjectileManager.js';
import { Menu } from '../ui/Menu.js';
import { HUD } from '../ui/HUD.js';

export class Game {
  constructor() {
    this.clock = new THREE.Clock();

    // Renderer (DPR capped for mobile GPU performance)
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GAME.MAX_DPR));
    this.renderer.setClearColor(COLORS.SKY);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    document.body.prepend(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera — isometric-like perspective behind and above the castle
    this.camera = new THREE.PerspectiveCamera(
      GAME.FOV,
      window.innerWidth / window.innerHeight,
      GAME.NEAR,
      GAME.FAR
    );
    this.camera.position.set(CAMERA.POSITION_X, CAMERA.POSITION_Y, CAMERA.POSITION_Z);
    this.camera.lookAt(CAMERA.LOOK_AT_X, CAMERA.LOOK_AT_Y, CAMERA.LOOK_AT_Z);

    // Systems
    this.input = new InputSystem();
    this.input.setCamera(this.camera);
    this.level = new LevelBuilder(this.scene);
    this.particleSystem = new ParticleSystem(this.scene);
    this.cameraShake = new CameraShake(this.camera);
    this.screenEffects = new ScreenEffects();

    // UI
    this.menu = new Menu();
    this.hud = new HUD();

    // Gameplay objects (created in startGame)
    this.castle = null;
    this.enemyCastle = null;
    this.enemyManager = null;
    this.projectileManager = null;

    // Events
    eventBus.on(Events.GAME_RESTART, () => this.restart());
    eventBus.on(Events.CASTLE_DESTROYED, () => this.onGameOver());

    // Resize
    window.addEventListener('resize', () => this.onResize());

    // Auto-start game (no title screen — Play.fun handles the chrome)
    this.startGame();

    // Start render loop (official Three.js pattern — pauses when tab hidden)
    this.renderer.setAnimationLoop(() => this.animate());
  }

  startGame() {
    gameState.reset();
    gameState.started = true;

    // Create gameplay objects
    this.castle = new Castle(this.scene);
    this.enemyCastle = new EnemyCastle(this.scene);
    this.enemyManager = new EnemyManager(this.scene);
    this.projectileManager = new ProjectileManager(
      this.scene, this.enemyManager, this.particleSystem
    );

    // Wire up input
    this.input.setEnemyManager(this.enemyManager);
    this.input.setGameActive(true);

    // Start first wave
    this.enemyManager.startFirstWave();

    eventBus.emit(Events.GAME_START);
    eventBus.emit(Events.MUSIC_GAMEPLAY);
  }

  onGameOver() {
    if (gameState.gameOver) return;
    gameState.gameOver = true;
    this.input.setGameActive(false);
    eventBus.emit(Events.GAME_OVER, { score: gameState.score });
    eventBus.emit(Events.MUSIC_STOP);
    eventBus.emit(Events.MUSIC_GAMEOVER);
  }

  restart() {
    // Clean up old gameplay objects
    if (this.castle) {
      this.castle.destroy();
      this.castle = null;
    }
    if (this.enemyCastle) {
      this.enemyCastle.destroy();
      this.enemyCastle = null;
    }
    if (this.enemyManager) {
      this.enemyManager.destroyAll();
      this.enemyManager = null;
    }
    if (this.projectileManager) {
      this.projectileManager.destroyAll();
      this.projectileManager = null;
    }
    // Particle system persists but deactivates all particles
    if (this.particleSystem) {
      this.particleSystem.destroy();
      this.particleSystem = new ParticleSystem(this.scene);
    }

    this.startGame();
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), GAME.MAX_DELTA);

    this.input.update();

    if (gameState.started && !gameState.gameOver) {
      // Update all gameplay systems
      if (this.castle) this.castle.update(delta);
      if (this.enemyCastle) this.enemyCastle.update(delta);
      if (this.enemyManager) this.enemyManager.update(delta);
      if (this.projectileManager) this.projectileManager.update(delta);
    }

    // Visual systems always update (particles can still fade out after game over)
    if (this.particleSystem) this.particleSystem.update(delta);
    if (this.cameraShake) this.cameraShake.update(delta);
    if (this.screenEffects) this.screenEffects.update(delta);

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

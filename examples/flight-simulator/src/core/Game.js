import * as THREE from 'three';
import { GAME, CAMERA, COLORS, TRANSITION } from './Constants.js';
import { eventBus, Events } from './EventBus.js';
import { gameState } from './GameState.js';
import { InputSystem } from '../systems/InputSystem.js';
import { RingSystem } from '../systems/RingSystem.js';
import { SkyDome } from '../systems/SkyDome.js';
import { ExhaustSystem } from '../systems/ExhaustSystem.js';
import { ParticleBurst } from '../systems/ParticleBurst.js';
import { SpeedLines } from '../systems/SpeedLines.js';
import { CameraEffects } from '../systems/CameraEffects.js';
import { Player } from '../gameplay/Player.js';
import { LevelBuilder } from '../level/LevelBuilder.js';
import { HUD } from '../ui/HUD.js';
import { Menu } from '../ui/Menu.js';

export class Game {
  constructor() {
    this.clock = new THREE.Clock();

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(COLORS.SKY);
    document.body.prepend(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      GAME.FOV,
      window.innerWidth / window.innerHeight,
      GAME.NEAR,
      GAME.FAR
    );
    this.camera.position.set(0, 35, CAMERA.OFFSET_BACK);
    this.camera.lookAt(0, 30, 0);

    // Smooth camera position
    this._camTarget = new THREE.Vector3();
    this._camLookAt = new THREE.Vector3();

    // Persistent systems (exist before game starts)
    this.input = new InputSystem();
    this.level = new LevelBuilder(this.scene);
    this.skyDome = new SkyDome(this.scene);
    this.particleBurst = new ParticleBurst(this.scene);
    this.cameraEffects = new CameraEffects(this.camera);
    this.hud = new HUD();
    this.menu = new Menu();

    // Per-session systems (created on game start)
    this.player = null;
    this.ringSystem = null;
    this.exhaust = null;
    this.speedLines = null;

    // Events
    eventBus.on(Events.GAME_START, () => this.startGame());
    eventBus.on(Events.GAME_RESTART, () => this.restart());
    eventBus.on(Events.PLAYER_DIED, () => this.onCrash());

    // Resize
    window.addEventListener('resize', () => this.onResize());

    // Start render loop
    this.animate();
  }

  startGame() {
    gameState.reset();
    gameState.started = true;

    this.player = new Player(this.scene);
    this.ringSystem = new RingSystem(this.scene);
    this.exhaust = new ExhaustSystem(this.scene);
    this.speedLines = new SpeedLines(this.scene);

    this.hud.show();
  }

  onCrash() {
    if (gameState.gameOver) return;
    gameState.gameOver = true;

    // Crash visual effects
    eventBus.emit(Events.CAMERA_SHAKE, {
      intensity: CAMERA.SHAKE_INTENSITY,
      duration: CAMERA.SHAKE_DURATION,
    });
    eventBus.emit(Events.SCREEN_FLASH, { color: '#ff4422' });

    if (this.player) {
      this.particleBurst.emitCrash(this.player.getPosition());
    }

    // Delay before showing game over screen
    setTimeout(() => {
      eventBus.emit(Events.GAME_OVER, { score: gameState.score });
    }, TRANSITION.CRASH_DELAY);
  }

  restart() {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    if (this.ringSystem) {
      this.ringSystem.destroy();
      this.ringSystem = null;
    }
    if (this.exhaust) {
      this.exhaust.destroy();
      this.exhaust = null;
    }
    if (this.speedLines) {
      this.speedLines.destroy();
      this.speedLines = null;
    }

    gameState.reset();
    this.hud.updateScore(0);
    this.menu.showStart();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), GAME.MAX_DELTA);

    // Always update persistent visual systems
    this.skyDome.update(this.camera.position);
    this.particleBurst.update(delta);
    this.cameraEffects.update(delta);

    if (gameState.started && !gameState.gameOver && this.player) {
      this.player.update(delta, this.input);

      // Ring collection
      if (this.ringSystem) {
        this.ringSystem.update(delta, this.player.getPosition());
      }

      // Engine exhaust
      if (this.exhaust) {
        this.exhaust.update(delta, this.player.mesh);
      }

      // Speed lines
      if (this.speedLines) {
        this.speedLines.update(delta, this.player.mesh, this.player.speed);
      }

      // Update HUD instruments
      this.hud.updateAltitude(this.player.getPosition().y);
      this.hud.updateSpeed(this.player.speed * 3.6);

      // Chase camera
      this.updateCamera(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateCamera(delta) {
    const playerPos = this.player.getPosition();
    const playerForward = this.player.getForward();

    // Target position: behind and above the aircraft
    this._camTarget.copy(playerPos);
    this._camTarget.addScaledVector(playerForward, -CAMERA.OFFSET_BACK);
    this._camTarget.y = playerPos.y + CAMERA.OFFSET_UP;

    // Smoothly lerp camera to target
    const lerpFactor = 1 - Math.exp(-CAMERA.LERP_SPEED * delta);
    this.camera.position.lerp(this._camTarget, lerpFactor);

    // Look ahead of the plane
    this._camLookAt.copy(playerPos);
    this._camLookAt.addScaledVector(playerForward, CAMERA.LOOK_AHEAD);
    this.camera.lookAt(this._camLookAt);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

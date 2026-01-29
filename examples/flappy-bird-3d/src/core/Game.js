import * as THREE from 'three';
import { GAME, CAMERA, COLORS, LEVEL, BIRD, TRANSITIONS } from './Constants.js';
import { eventBus, Events } from './EventBus.js';
import { gameState } from './GameState.js';
import { InputSystem } from '../systems/InputSystem.js';
import { Bird } from '../entities/Bird.js';
import { LevelBuilder } from '../level/LevelBuilder.js';
import { PipeSpawner } from '../systems/PipeSpawner.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { CameraShake } from '../systems/CameraShake.js';
import { SkyDome } from '../systems/SkyDome.js';
import { GroundDetail } from '../systems/GroundDetail.js';
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

    // Systems
    this.input = new InputSystem();
    this.level = new LevelBuilder(this.scene);
    this.hud = new HUD();
    this.menu = new Menu();
    this.particles = new ParticleSystem(this.scene);
    this.cameraShake = new CameraShake(this.camera);
    this.skyDome = new SkyDome(this.scene);
    this.groundDetail = new GroundDetail(this.scene);

    // Death flash overlay
    this.flashEl = document.createElement('div');
    this.flashEl.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:15;transition:opacity 0.1s;';
    document.body.appendChild(this.flashEl);

    this.bird = null;
    this.pipeSpawner = null;
    this.slowMoTimer = 0;
    this.deathPauseTimer = 0;

    // Events
    eventBus.on(Events.GAME_START, () => this.startGame());
    eventBus.on(Events.GAME_RESTART, () => this.restart());

    // Resize
    window.addEventListener('resize', () => this.onResize());

    // Initial camera position
    this.camera.position.set(-6, BIRD.START_Y + CAMERA.OFFSET_Y, CAMERA.OFFSET_Z);
    this.camera.lookAt(CAMERA.LOOK_AHEAD, BIRD.START_Y, 0);

    // Start render loop
    this.animate();
  }

  startGame() {
    gameState.reset();
    gameState.started = true;

    this.bird = new Bird(this.scene);
    this.pipeSpawner = new PipeSpawner(this.scene);
    this.pipeSpawner.spawnInitial();
    this.slowMoTimer = 0;
    this.deathPauseTimer = 0;

    this.hud.show();
    eventBus.emit(Events.MUSIC_GAMEPLAY);
  }

  restart() {
    if (this.bird) {
      this.bird.destroy();
      this.bird = null;
    }
    if (this.pipeSpawner) {
      this.pipeSpawner.destroyAll();
      this.pipeSpawner = null;
    }
    this.particles.destroyAll();

    gameState.reset();
    this.hud.updateScore(0);

    this.startGame();
  }

  gameOver() {
    if (gameState.gameOver) return;
    gameState.gameOver = true;

    this.bird.die();
    this.slowMoTimer = TRANSITIONS.DEATH_SLOWMO_DURATION;

    // White flash on death
    this.flashEl.style.opacity = '0.6';
    setTimeout(() => { this.flashEl.style.opacity = '0'; }, 150);

    eventBus.emit(Events.MUSIC_STOP);

    // Delay game over screen to let slow-mo + particles play
    this.deathPauseTimer = TRANSITIONS.DEATH_SLOWMO_DURATION + 0.5;
  }

  showGameOverScreen() {
    eventBus.emit(Events.GAME_OVER, { score: gameState.score });
    eventBus.emit(Events.MUSIC_GAMEOVER);
    this.hud.hide();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const rawDelta = Math.min(this.clock.getDelta(), GAME.MAX_DELTA);
    let delta = rawDelta;

    // Slow motion on death
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= rawDelta;
      delta = rawDelta * TRANSITIONS.DEATH_SLOWMO_SCALE;
    }

    // Death pause countdown (uses real time, not slow-mo time)
    if (this.deathPauseTimer > 0) {
      this.deathPauseTimer -= rawDelta;
      if (this.deathPauseTimer <= 0) {
        this.showGameOverScreen();
      }
    }

    if (gameState.started && this.bird) {
      if (!gameState.gameOver) {
        // Process input
        if (this.input.consumeFlap()) {
          this.bird.flap();
        }

        // Update bird
        this.bird.update(delta);

        // Move pipes
        this.pipeSpawner.update(delta);

        // Check collisions
        const birdBox = this.bird.getBoundingBox();
        const birdPos = this.bird.getPosition();

        // Ground and ceiling
        if (birdPos.y - BIRD.RADIUS <= LEVEL.GROUND_Y || birdPos.y + BIRD.RADIUS >= LEVEL.CEILING_Y) {
          this.gameOver();
        }

        // Pipes
        if (this.pipeSpawner.checkCollision(birdBox)) {
          this.gameOver();
        }
      }

      // Update camera to follow bird (even during death)
      const birdPos = this.bird.getPosition();
      const targetX = birdPos.x + CAMERA.OFFSET_X;
      const targetY = birdPos.y + CAMERA.OFFSET_Y;
      this.camera.position.x += (targetX - this.camera.position.x) * CAMERA.FOLLOW_LERP * delta;
      this.camera.position.y += (targetY - this.camera.position.y) * CAMERA.FOLLOW_LERP * delta;
      this.camera.position.z = CAMERA.OFFSET_Z;
      this.camera.lookAt(birdPos.x + CAMERA.LOOK_AHEAD, birdPos.y, 0);

      // Camera shake
      this.cameraShake.update(delta);

      // Sky follows bird
      this.skyDome.update(birdPos.x);
    }

    // Particles always update
    this.particles.update(delta);

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

import * as THREE from 'three';
import { GAME, CAMERA, COLORS, RUNNER, COLLECTIBLE, EFFECTS, OBSTACLE } from './Constants.js';
import { eventBus, Events } from './EventBus.js';
import { gameState } from './GameState.js';
import { InputSystem } from '../systems/InputSystem.js';
import { Player } from '../gameplay/Player.js';
import { ObstacleManager } from '../gameplay/ObstacleManager.js';
import { LevelBuilder } from '../level/LevelBuilder.js';
import { Menu } from '../ui/Menu.js';
import { MatrixRain } from '../systems/MatrixRain.js';
import { ParticleEffects } from '../systems/ParticleEffects.js';
import { TrailEffect } from '../systems/TrailEffect.js';

export class Game {
  constructor() {
    this.clock = new THREE.Clock();

    // Renderer (DPR capped for mobile GPU performance)
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GAME.MAX_DPR));
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
    this.menu = new Menu();
    this.obstacles = new ObstacleManager(this.scene);
    this.player = null;

    // Visual effects systems
    this.matrixRain = new MatrixRain(this.scene);
    this.particleEffects = new ParticleEffects(this.scene);
    this.trailEffect = new TrailEffect(this.scene);

    // Score accumulator for fractional distance
    this._scoreAccumulator = 0;

    // Death camera shake state
    this._shakeTimer = 0;
    this._shakeIntensity = 0;
    this._cameraBasePos = new THREE.Vector3();

    // Death slow-mo state
    this._slowmoTimer = 0;
    this._slowmoActive = false;
    this._deathAnimDone = false;

    // Events
    eventBus.on(Events.GAME_RESTART, () => this.restart());

    // Resize
    window.addEventListener('resize', () => this.onResize());

    // Auto-start game (no title screen -- Play.fun handles the chrome)
    this.startGame();

    // Start render loop (official Three.js pattern -- pauses when tab hidden)
    this.renderer.setAnimationLoop(() => this.animate());
  }

  startGame() {
    gameState.reset();
    gameState.started = true;
    gameState.currentSpeed = RUNNER.START_SPEED;

    this.player = new Player(this.scene);
    this._scoreAccumulator = 0;
    this._shakeTimer = 0;
    this._shakeIntensity = 0;
    this._slowmoTimer = 0;
    this._slowmoActive = false;
    this._deathAnimDone = false;
    this.input.setGameActive(true);

    // Position camera behind player
    this._updateCamera(true);

    eventBus.emit(Events.GAME_START);
    eventBus.emit(Events.SPEED_CHANGED, { speed: gameState.currentSpeed });
  }

  restart() {
    // Clean up existing objects
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    this.obstacles.clear();
    this.level.reset();

    // Reset visual effects
    this.matrixRain.reset();
    this.particleEffects.reset();
    this.trailEffect.reset();

    this.startGame();
  }

  animate() {
    let delta = Math.min(this.clock.getDelta(), GAME.MAX_DELTA);

    this.input.update();

    // Apply slow-mo during death sequence
    if (this._slowmoActive) {
      this._slowmoTimer -= delta;
      if (this._slowmoTimer <= 0) {
        this._slowmoActive = false;
        this._deathAnimDone = true;
      } else {
        // Ease game speed down during slow-mo
        const slowFactor = this._slowmoTimer / EFFECTS.DEATH_SLOWMO_DURATION;
        delta *= slowFactor * 0.3; // Dramatically slow everything
      }
    }

    if (gameState.started && !gameState.gameOver && this.player) {
      // Increase speed over time
      if (gameState.currentSpeed < RUNNER.MAX_SPEED) {
        gameState.currentSpeed += RUNNER.ACCELERATION * delta;
        if (gameState.currentSpeed > RUNNER.MAX_SPEED) {
          gameState.currentSpeed = RUNNER.MAX_SPEED;
        }
      }

      // Move player forward
      const distance = gameState.currentSpeed * delta;
      this.player.moveForward(distance);

      // Update player (lane switching, jumping, sliding)
      this.player.update(delta, this.input);

      // Update distance traveled and score (1 point per unit)
      gameState.distanceTraveled += distance;
      this._scoreAccumulator += distance;
      if (this._scoreAccumulator >= 1) {
        const points = Math.floor(this._scoreAccumulator);
        this._scoreAccumulator -= points;
        gameState.addScore(points);
        eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score, delta: points });
      }

      // Update obstacles
      this.obstacles.update(delta, this.player.runZ, gameState.currentSpeed);

      // Check collisions with obstacles
      const playerBox = this.player.getCollisionBox();
      const obstacleBoxes = this.obstacles.getObstacleBoxes();
      for (const box of obstacleBoxes) {
        if (playerBox.intersectsBox(box)) {
          this._onPlayerDied();
          break;
        }
      }

      // Check collectible collisions
      if (!gameState.gameOver) {
        const collected = this.obstacles.checkCollectibleCollision(playerBox);
        if (collected) {
          gameState.addScore(COLLECTIBLE.POINTS);
          eventBus.emit(Events.COLLECTIBLE_PICKED, {
            points: COLLECTIBLE.POINTS,
            position: {
              x: collected.mesh.position.x,
              y: collected.mesh.position.y,
              z: collected.mesh.position.z,
            },
          });
          eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score, delta: COLLECTIBLE.POINTS });
        }
      }

      // Update tunnel/level to follow player
      this.level.update(this.player.runZ);

      // Obstacle warning glow: brighten obstacles as player approaches
      this._updateObstacleWarning();

      // Update camera
      this._updateCamera(false);

    } else if (this._slowmoActive && this.player) {
      // During slow-mo after death, keep updating movement at reduced speed
      const distance = gameState.currentSpeed * delta;
      this.player.moveForward(distance);
      this.level.update(this.player.runZ);
      this._updateCamera(false);
    }

    // --- Always-running visual effects ---
    const playerZ = this.player ? this.player.runZ : 0;

    // Matrix rain runs always (background ambiance)
    this.matrixRain.update(delta, playerZ);

    // Particle effects (pickup bursts + speed lines)
    this.particleEffects.update(
      delta,
      playerZ,
      this.camera.position,
      gameState.currentSpeed
    );

    // Trail effect
    if (this.player) {
      this.trailEffect.update(delta, this.player.mesh.position, gameState.gameOver);
    }

    // Camera shake (runs during death)
    if (this._shakeTimer > 0) {
      // Use real (unscaled) delta for shake so it runs at normal speed even during slow-mo
      const realDelta = Math.min(this.clock.getDelta !== undefined ? 1 / 60 : delta, GAME.MAX_DELTA);
      this._shakeTimer -= 1 / 60;
      const shakeT = Math.max(0, this._shakeTimer / EFFECTS.DEATH_SHAKE_DURATION);
      const intensity = this._shakeIntensity * shakeT;
      this.camera.position.x += (Math.random() - 0.5) * intensity;
      this.camera.position.y += (Math.random() - 0.5) * intensity * 0.5;
    }

    this.renderer.render(this.scene, this.camera);
  }

  _updateCamera(instant) {
    if (!this.player) return;

    const p = this.player.mesh.position;
    const targetX = p.x;
    const targetY = p.y + CAMERA.OFFSET_Y;
    const targetZ = p.z + CAMERA.OFFSET_Z;

    if (instant) {
      this.camera.position.set(targetX, targetY, targetZ);
    } else {
      // Smooth camera follow
      this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
      this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
      this.camera.position.z += (targetZ - this.camera.position.z) * 0.15;
    }

    this.camera.lookAt(p.x, p.y + 1, p.z + CAMERA.LOOK_AHEAD);
  }

  _onPlayerDied() {
    gameState.gameOver = true;
    this.input.setGameActive(false);

    // Start death camera shake
    this._shakeTimer = EFFECTS.DEATH_SHAKE_DURATION;
    this._shakeIntensity = EFFECTS.DEATH_SHAKE_INTENSITY;

    // Start slow-mo before fully stopping
    this._slowmoActive = true;
    this._slowmoTimer = EFFECTS.DEATH_SLOWMO_DURATION;

    eventBus.emit(Events.PLAYER_DIED);
    eventBus.emit(Events.MUSIC_STOP);

    // Delay the game over UI slightly to let the shake/slowmo play out
    setTimeout(() => {
      eventBus.emit(Events.GAME_OVER, { score: gameState.score });
    }, (EFFECTS.DEATH_SHAKE_DURATION + EFFECTS.DEATH_SLOWMO_DURATION) * 500);
  }

  /** Make obstacles glow/pulse as player approaches */
  _updateObstacleWarning() {
    if (!this.player) return;
    const playerZ = this.player.runZ;

    // Since all obstacles share the same material, find the closest obstacle
    // and set the shared material's emissive intensity based on proximity.
    // This creates a global "danger approaching" pulse effect.
    let closestDist = Infinity;
    for (const obs of this.obstacles.obstacles) {
      const dist = Math.abs(obs.z - playerZ);
      if (dist < closestDist) {
        closestDist = dist;
      }
    }

    const obstacleMat = this.obstacles.getObstacleMaterial();
    if (obstacleMat) {
      if (closestDist < OBSTACLE.WARN_DISTANCE) {
        const t = 1 - (closestDist / OBSTACLE.WARN_DISTANCE);
        const baseIntensity = 0.3;
        obstacleMat.emissiveIntensity =
          baseIntensity + t * (OBSTACLE.WARN_GLOW_INTENSITY - baseIntensity);
      } else {
        obstacleMat.emissiveIntensity = 0.3;
      }
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

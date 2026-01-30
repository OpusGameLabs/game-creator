import * as THREE from 'three';
import { GAME, CAMERA, COLORS, BALL, GEMS } from './Constants.js';
import { eventBus, Events } from './EventBus.js';
import { gameState } from './GameState.js';
import { InputSystem } from '../systems/InputSystem.js';
import { Ball } from '../gameplay/Ball.js';
import { MazeBuilder } from '../level/MazeBuilder.js';
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
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.prepend(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera -- top-down angled view (marble labyrinth style)
    this.camera = new THREE.PerspectiveCamera(
      GAME.FOV,
      window.innerWidth / window.innerHeight,
      GAME.NEAR,
      GAME.FAR
    );
    this.camera.position.set(CAMERA.OFFSET_X, CAMERA.OFFSET_Y, CAMERA.OFFSET_Z);
    this.camera.lookAt(0, CAMERA.LOOK_OFFSET_Y, 0);

    // Camera target for smooth lerp
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    // Systems
    this.input = new InputSystem();
    this.maze = new MazeBuilder(this.scene);
    this.hud = new HUD();
    this.menu = new Menu();
    this.ball = null;

    // Level info
    this.startPos = null;
    this.falling = false;

    // Events
    eventBus.on(Events.GAME_START, () => this.startGame());
    eventBus.on(Events.GAME_RESTART, () => this.restart());

    // Resize
    window.addEventListener('resize', () => this.onResize());

    // Start render loop
    this.animate();
  }

  startGame() {
    gameState.reset();
    gameState.started = true;
    this.falling = false;
    this.loadLevel(gameState.level);
  }

  loadLevel(levelNumber) {
    // Clean up previous ball if any
    if (this.ball) {
      this.ball.destroy();
      this.ball = null;
    }

    // Generate new maze
    const result = this.maze.generate(levelNumber);
    this.startPos = result.startWorldPos;
    gameState.totalGems = result.totalGems;
    gameState.gems = 0;

    // Create ball at start position
    this.ball = new Ball(this.scene);
    this.ball.setPosition(this.startPos);

    // Center camera immediately on ball
    this.cameraTarget.set(this.startPos.x, 0, this.startPos.z);
    this.camera.position.set(
      this.startPos.x + CAMERA.OFFSET_X,
      CAMERA.OFFSET_Y,
      this.startPos.z + CAMERA.OFFSET_Z
    );
    this.camera.lookAt(this.startPos.x, CAMERA.LOOK_OFFSET_Y, this.startPos.z);

    this.falling = false;

    // Notify HUD
    this.hud.show();
    eventBus.emit(Events.LEVEL_START, { level: levelNumber });
    eventBus.emit(Events.HUD_UPDATE, {
      level: gameState.level,
      gems: gameState.gems,
      totalGems: gameState.totalGems,
      lives: gameState.lives,
    });
  }

  restart() {
    if (this.ball) {
      this.ball.destroy();
      this.ball = null;
    }
    this.maze.destroy();
    // Clear fog so it can be re-created on next level
    this.scene.fog = null;
    gameState.reset();
    this.falling = false;
    this.hud.hide();
    this.menu.showStart();
  }

  respawnBall() {
    this.falling = false;
    if (this.ball) {
      this.ball.setPosition(this.startPos);
      this.ball.mesh.visible = true;
    }
    eventBus.emit(Events.BALL_RESPAWN);
    eventBus.emit(Events.HUD_UPDATE, {
      level: gameState.level,
      gems: gameState.gems,
      totalGems: gameState.totalGems,
      lives: gameState.lives,
    });
  }

  onBallFell() {
    if (this.falling) return;
    this.falling = true;

    eventBus.emit(Events.BALL_FELL);

    this.ball.animateFall(() => {
      const isDead = gameState.loseLife();

      if (isDead) {
        gameState.gameOver = true;
        eventBus.emit(Events.GAME_OVER, {
          score: gameState.score,
          level: gameState.level,
          gems: gameState.gems,
        });
      } else {
        this.respawnBall();
      }
    });
  }

  onLevelComplete() {
    gameState.addScore(GEMS.POINTS * 5); // Bonus for completing level
    gameState.advanceLevel();

    // Clean up old maze
    if (this.ball) {
      this.ball.destroy();
      this.ball = null;
    }
    this.maze.destroy();
    this.scene.fog = null;

    eventBus.emit(Events.LEVEL_COMPLETE, { level: gameState.level - 1 });

    // Load next level after a brief pause
    setTimeout(() => {
      this.loadLevel(gameState.level);
    }, 500);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), GAME.MAX_DELTA);

    if (gameState.started && !gameState.gameOver && this.ball && !this.falling) {
      // Update ball physics
      this.ball.update(delta, this.input);

      // Wall collision
      const pos = this.ball.mesh.position;
      const corrected = this.maze.checkWallCollision(pos, BALL.RADIUS);
      if (corrected.x !== pos.x || corrected.z !== pos.z) {
        // Dampen velocity on collision
        if (Math.abs(corrected.x - pos.x) > 0.001) this.ball.vx *= -0.3;
        if (Math.abs(corrected.z - pos.z) > 0.001) this.ball.vz *= -0.3;
        pos.x = corrected.x;
        pos.z = corrected.z;
      }

      // Hole collision
      if (this.maze.checkHoleCollision(pos)) {
        this.onBallFell();
      }

      // Gem collision
      const gem = this.maze.checkGemCollision(pos, BALL.RADIUS);
      if (gem) {
        gameState.collectGem();
        gameState.addScore(GEMS.POINTS);
        eventBus.emit(Events.GEM_COLLECTED, { gems: gameState.gems, totalGems: gameState.totalGems });
        eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });
        eventBus.emit(Events.HUD_UPDATE, {
          level: gameState.level,
          gems: gameState.gems,
          totalGems: gameState.totalGems,
          lives: gameState.lives,
        });
      }

      // Exit collision
      if (this.maze.checkExitCollision(pos, BALL.RADIUS)) {
        this.onLevelComplete();
      }

      // Smooth camera follow
      this.cameraTarget.set(pos.x, 0, pos.z);
    }

    // Lerp camera toward target
    if (gameState.started && this.ball) {
      const lerpFactor = 1 - Math.exp(-CAMERA.LERP_SPEED * delta);
      const targetCamX = this.cameraTarget.x + CAMERA.OFFSET_X;
      const targetCamZ = this.cameraTarget.z + CAMERA.OFFSET_Z;

      this.camera.position.x += (targetCamX - this.camera.position.x) * lerpFactor;
      this.camera.position.y = CAMERA.OFFSET_Y;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * lerpFactor;

      this.camera.lookAt(
        this.cameraTarget.x,
        CAMERA.LOOK_OFFSET_Y,
        this.cameraTarget.z
      );
    }

    // Update maze animations (gems, exit)
    this.maze.update(delta);

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

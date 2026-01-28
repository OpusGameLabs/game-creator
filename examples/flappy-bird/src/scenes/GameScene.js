import Phaser from 'phaser';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { GAME_CONFIG, GROUND_CONFIG, BIRD_CONFIG, COLORS, TRANSITION_CONFIG } from '../core/Constants.js';
import Bird from '../entities/Bird.js';
import PipeSpawner from '../systems/PipeSpawner.js';
import ScoreSystem from '../systems/ScoreSystem.js';
import Background from '../systems/Background.js';
import Particles from '../systems/Particles.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    gameState.reset();
    this.unsubscribers = [];

    // Fade in
    this.cameras.main.fadeIn(TRANSITION_CONFIG.fadeDuration, 0, 0, 0);

    // Background (gradient sky + clouds + ground with grass)
    this.background = new Background(this);
    this.background.create();

    // Ground physics body
    const groundY = GAME_CONFIG.height - GROUND_CONFIG.height;
    this.ground = this.add.zone(GAME_CONFIG.width / 2, groundY + GROUND_CONFIG.height / 2, GAME_CONFIG.width, GROUND_CONFIG.height);
    this.physics.add.existing(this.ground, true);

    // Bird
    this.bird = new Bird(this, BIRD_CONFIG.x, BIRD_CONFIG.startY);
    this.bird.setDepth(5);

    // Pipe spawner
    this.pipeSpawner = new PipeSpawner(this);

    // Score system
    this.scoreSystem = new ScoreSystem();
    this.scoreSystem.start();

    // Particle system
    this.particles = new Particles(this);
    this.particles.start();

    // Launch UI overlay
    this.scene.launch('UIScene');

    // Emit flap dust particles on every flap
    this.unsubscribers.push(
      eventBus.on(Events.BIRD_FLAP, () => {
        eventBus.emit(Events.PARTICLES_FLAP, { x: this.bird.x - 10, y: this.bird.y + 8 });
      }),
    );

    // Emit score particles when scoring
    this.unsubscribers.push(
      eventBus.on(Events.BIRD_PASSED_PIPE, () => {
        eventBus.emit(Events.PARTICLES_SCORE, { x: this.bird.x + 20, y: this.bird.y - 10 });
      }),
    );

    // Input
    this.input.on('pointerdown', () => this.handleInput());
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Collision check timer
    this.collisionActive = false;

    // Start with a "get ready" state
    this.ready = false;
    this.showGetReady();
  }

  showGetReady() {
    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2 - 50;

    this.getReadyText = this.add.text(centerX, centerY, 'GET READY', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial',
      color: COLORS.scoreText,
      stroke: COLORS.textStroke,
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20);

    this.tapText = this.add.text(centerX, centerY + 60, 'TAP TO FLAP', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: COLORS.scoreText,
      stroke: COLORS.textStroke,
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: this.tapText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Bob the bird while waiting
    this.tweens.add({
      targets: this.bird,
      y: BIRD_CONFIG.startY - 10,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  startPlaying() {
    this.ready = true;
    gameState.started = true;

    // Remove get ready text
    if (this.getReadyText) this.getReadyText.destroy();
    if (this.tapText) this.tapText.destroy();

    // Stop bob tween
    this.tweens.killTweensOf(this.bird);

    // Start gameplay music
    eventBus.emit(Events.MUSIC_GAMEPLAY);

    // Enable bird gravity
    this.bird.enableGravity();
    this.bird.flap();

    // Start spawning pipes
    this.pipeSpawner.start();

    // Enable collisions
    this.collisionActive = true;
  }

  handleInput() {
    if (gameState.gameOver) return;

    if (!this.ready) {
      this.startPlaying();
      return;
    }

    this.bird.flap();
  }

  update(time, delta) {
    if (gameState.gameOver) return;

    // Space key
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.handleInput();
    }

    if (!this.ready) {
      this.background.update(delta);
      return;
    }

    this.bird.update(time, delta);
    this.pipeSpawner.update();
    this.background.update(delta);

    // Check collisions
    if (this.collisionActive) {
      this.checkCollisions();
    }

    // Check if bird fell below ground
    const groundY = GAME_CONFIG.height - GROUND_CONFIG.height;
    if (this.bird.y >= groundY - BIRD_CONFIG.size) {
      this.bird.y = groundY - BIRD_CONFIG.size;
      this.handleGameOver();
    }

    // Check if bird flew too high
    if (this.bird.y < -BIRD_CONFIG.size * 2) {
      this.handleGameOver();
    }
  }

  checkCollisions() {
    const birdBounds = this.bird.body;
    const birdLeft = this.bird.x + birdBounds.offset.x;
    const birdRight = birdLeft + birdBounds.width;
    const birdTop = this.bird.y + birdBounds.offset.y;
    const birdBottom = birdTop + birdBounds.height;

    for (const pipe of this.pipeSpawner.pipes) {
      // Check score zone
      if (!pipe.scored) {
        const sz = pipe.scoreZone;
        if (birdLeft > sz.x) {
          pipe.scored = true;
          eventBus.emit(Events.BIRD_PASSED_PIPE);
        }
      }

      // Check pipe collision (top)
      const tz = pipe.topZone;
      if (this.rectsOverlap(birdLeft, birdTop, birdRight, birdBottom,
        tz.x - tz.width / 2, tz.y - tz.height / 2, tz.x + tz.width / 2, tz.y + tz.height / 2)) {
        this.handleGameOver();
        return;
      }

      // Check pipe collision (bottom)
      const bz = pipe.bottomZone;
      if (this.rectsOverlap(birdLeft, birdTop, birdRight, birdBottom,
        bz.x - bz.width / 2, bz.y - bz.height / 2, bz.x + bz.width / 2, bz.y + bz.height / 2)) {
        this.handleGameOver();
        return;
      }
    }
  }

  rectsOverlap(l1, t1, r1, b1, l2, t2, r2, b2) {
    return l1 < r2 && r1 > l2 && t1 < b2 && b1 > t2;
  }

  handleGameOver() {
    if (gameState.gameOver) return;
    gameState.gameOver = true;

    this.bird.die();
    this.pipeSpawner.stop();
    this.collisionActive = false;

    // Death effects
    this.cameras.main.flash(200, 255, 255, 255);
    this.cameras.main.shake(300, 0.015);
    eventBus.emit(Events.PARTICLES_DEATH, { x: this.bird.x, y: this.bird.y });
    eventBus.emit(Events.BIRD_DIED);
    eventBus.emit(Events.MUSIC_STOP);

    // Brief slow-mo for dramatic effect
    this.time.timeScale = TRANSITION_CONFIG.deathSlowMoScale;
    this.time.delayedCall(TRANSITION_CONFIG.deathSlowMoDuration * TRANSITION_CONFIG.deathSlowMoScale, () => {
      this.time.timeScale = 1;
    });

    eventBus.emit(Events.GAME_OVER);

    this.time.delayedCall(800, () => {
      this.scene.stop('UIScene');
      // Fade out before transitioning
      this.cameras.main.fadeOut(TRANSITION_CONFIG.fadeDuration, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameOverScene');
      });
    });
  }

  shutdown() {
    this.unsubscribers.forEach(unsub => unsub());
    this.pipeSpawner.destroy();
    this.scoreSystem.destroy();
    this.particles.destroy();
    this.background.destroy();
    eventBus.clear();
  }
}

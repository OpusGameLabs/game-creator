import Phaser from 'phaser';
import { GAME, BIRD, PIPE, GROUND, TRANSITION } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { Bird } from '../entities/Bird.js';
import { PipeSpawner } from '../systems/PipeSpawner.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { Background } from '../systems/Background.js';
import { ParticleSystem } from '../systems/Particles.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    gameState.reset();
    this.playing = false;

    // Background (sky, clouds, ground)
    this.background = new Background(this);

    // Ground physics collider (invisible, at ground surface)
    this.groundCollider = this.add.rectangle(GAME.WIDTH / 2, GROUND.Y + 2, GAME.WIDTH, 8, 0x000000, 0);
    this.physics.add.existing(this.groundCollider, true);

    // Bird
    this.bird = new Bird(this);

    // Ground collision — must wire bird to ground with physics.add.collider
    this.physics.add.collider(this.bird.sprite, this.groundCollider, () => {
      this.triggerGameOver();
    });

    // Pipe spawner
    this.pipeSpawner = new PipeSpawner(this);

    // Score system
    this.scoreSystem = new ScoreSystem();

    // Particles
    this.particles = new ParticleSystem(this);

    // GET READY overlay
    this.showGetReady();

    // Input
    this.input.keyboard.on('keydown-SPACE', () => this.handleInput());
    this.input.on('pointerdown', () => this.handleInput());

    // Music
    eventBus.emit(Events.MUSIC_GAMEPLAY);

    gameState.started = true;
  }

  showGetReady() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2 - 60;

    this.getReadyText = this.add.text(cx, cy, 'GET READY', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50);

    this.tapText = this.add.text(cx, cy + 60, 'Tap or Press SPACE', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: this.tapText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  hideGetReady() {
    if (this.getReadyText) {
      this.tweens.add({
        targets: [this.getReadyText, this.tapText],
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.getReadyText.destroy();
          this.tapText.destroy();
          this.getReadyText = null;
          this.tapText = null;
        },
      });
    }
  }

  startPlaying() {
    this.playing = true;
    this.bird.enableGravity();
    this.bird.flap();
    this.pipeSpawner.start();
    this.hideGetReady();
  }

  handleInput() {
    if (gameState.gameOver) return;

    if (!this.playing) {
      this.startPlaying();
      return;
    }

    this.bird.flap();
  }

  update(time, delta) {
    if (this.background) {
      if (!gameState.gameOver) {
        this.background.update(delta);
      }
    }

    if (!this.playing || gameState.gameOver) return;

    this.bird.update();
    this.pipeSpawner.update();

    // Check pipe collisions (AABB)
    this.checkPipeCollisions();

    // Check score zones
    this.checkScoreZones();
  }

  checkPipeCollisions() {
    const birdBounds = this.bird.sprite.getBounds();
    // Shrink bird hitbox slightly for fairness
    const shrink = 4;
    birdBounds.x += shrink;
    birdBounds.y += shrink;
    birdBounds.width -= shrink * 2;
    birdBounds.height -= shrink * 2;

    const allPipes = [
      ...this.pipeSpawner.getAllTopPipes(),
      ...this.pipeSpawner.getAllBottomPipes(),
    ];

    for (const pipe of allPipes) {
      const pipeBounds = pipe.getBounds();
      if (Phaser.Geom.Intersects.RectangleToRectangle(birdBounds, pipeBounds)) {
        this.triggerGameOver();
        return;
      }
    }
  }

  checkScoreZones() {
    const birdX = this.bird.sprite.x;
    const pipes = this.pipeSpawner.getScoreZones();

    for (const pipe of pipes) {
      if (birdX > pipe.scoreZone.x && !pipe.scored) {
        pipe.scored = true;
        this.scoreSystem.onAddScore(1);
        eventBus.emit(Events.PARTICLES_EMIT, {
          type: 'score',
          x: this.bird.sprite.x,
          y: this.bird.sprite.y,
        });
      }
    }
  }

  triggerGameOver() {
    if (gameState.gameOver) return;
    gameState.gameOver = true;

    // Stop pipes
    this.pipeSpawner.stop();

    // Death effects
    this.bird.die();
    this.cameras.main.flash(TRANSITION.DEATH_FLASH_DURATION, 255, 255, 255);
    this.cameras.main.shake(TRANSITION.DEATH_SHAKE_DURATION, TRANSITION.DEATH_SHAKE_INTENSITY);

    eventBus.emit(Events.PARTICLES_EMIT, {
      type: 'death',
      x: this.bird.sprite.x,
      y: this.bird.sprite.y,
    });

    eventBus.emit(Events.MUSIC_STOP);
    eventBus.emit(Events.GAME_OVER, { score: gameState.score });

    // Transition to game over after a brief pause
    this.time.delayedCall(800, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene');
    });
  }

  shutdown() {
    if (this.pipeSpawner) this.pipeSpawner.destroy();
    if (this.particles) this.particles.destroy();
    if (this.background) this.background.destroy();
  }
}

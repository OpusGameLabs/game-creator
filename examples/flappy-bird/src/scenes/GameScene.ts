import Phaser from 'phaser';
import { eventBus, Events } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { GAME_CONFIG, GROUND_CONFIG, BIRD_CONFIG, COLORS, TRANSITION_CONFIG, DIFFICULTY_CONFIG } from '../core/Constants';
import Bird from '../entities/Bird';
import PipeSpawner from '../systems/PipeSpawner';
import ScoreSystem from '../systems/ScoreSystem';
import Background from '../systems/Background';
import Particles from '../systems/Particles';

export default class GameScene extends Phaser.Scene {
  private unsubscribers: Array<() => void> = [];
  private background!: Background;
  private ground!: Phaser.GameObjects.Zone;
  private bird!: Bird;
  private pipeSpawner!: PipeSpawner;
  private scoreSystem!: ScoreSystem;
  private particles!: Particles;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private collisionActive: boolean = false;
  private ready: boolean = false;
  private getReadyText?: Phaser.GameObjects.Text;
  private tapText?: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create(): void {
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

    // Emit score particles when scoring + update sky color
    this.unsubscribers.push(
      eventBus.on(Events.BIRD_PASSED_PIPE, () => {
        eventBus.emit(Events.PARTICLES_SCORE, { x: this.bird.x + 20, y: this.bird.y - 10 });
        this.updateSkyGradient();
      }),
    );

    // Input
    this.input.on('pointerdown', () => this.handleInput());
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Collision check timer
    this.collisionActive = false;

    // Start with a "get ready" state
    this.ready = false;
    this.showGetReady();
  }

  showGetReady(): void {
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

  startPlaying(): void {
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

  handleInput(): void {
    if (gameState.gameOver) return;

    if (!this.ready) {
      this.startPlaying();
      return;
    }

    this.bird.flap();
  }

  update(time: number, delta: number): void {
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

  checkCollisions(): void {
    const birdBody = this.bird.body as Phaser.Physics.Arcade.Body;
    const birdLeft = this.bird.x + birdBody.offset.x;
    const birdRight = birdLeft + birdBody.width;
    const birdTop = this.bird.y + birdBody.offset.y;
    const birdBottom = birdTop + birdBody.height;

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

  rectsOverlap(l1: number, t1: number, r1: number, b1: number, l2: number, t2: number, r2: number, b2: number): boolean {
    return l1 < r2 && r1 > l2 && t1 < b2 && b1 > t2;
  }

  handleGameOver(): void {
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

  updateSkyGradient(): void {
    const t = gameState.getDifficulty();
    if (t <= 0) return;
    const bg = this.background;
    if (!bg || !bg.skyGfx) return;

    const groundY = GAME_CONFIG.height - GROUND_CONFIG.height;
    const sTopR = (DIFFICULTY_CONFIG.skyStartTop >> 16) & 0xff;
    const sTopG = (DIFFICULTY_CONFIG.skyStartTop >> 8) & 0xff;
    const sTopB = DIFFICULTY_CONFIG.skyStartTop & 0xff;
    const eTopR = (DIFFICULTY_CONFIG.skyEndTop >> 16) & 0xff;
    const eTopG = (DIFFICULTY_CONFIG.skyEndTop >> 8) & 0xff;
    const eTopB = DIFFICULTY_CONFIG.skyEndTop & 0xff;
    const sBotR = (DIFFICULTY_CONFIG.skyStartBottom >> 16) & 0xff;
    const sBotG = (DIFFICULTY_CONFIG.skyStartBottom >> 8) & 0xff;
    const sBotB = DIFFICULTY_CONFIG.skyStartBottom & 0xff;
    const eBotR = (DIFFICULTY_CONFIG.skyEndBottom >> 16) & 0xff;
    const eBotG = (DIFFICULTY_CONFIG.skyEndBottom >> 8) & 0xff;
    const eBotB = DIFFICULTY_CONFIG.skyEndBottom & 0xff;

    const topR = Math.round(sTopR + (eTopR - sTopR) * t);
    const topG = Math.round(sTopG + (eTopG - sTopG) * t);
    const topB = Math.round(sTopB + (eTopB - sTopB) * t);
    const botR = Math.round(sBotR + (eBotR - sBotR) * t);
    const botG = Math.round(sBotG + (eBotG - sBotG) * t);
    const botB = Math.round(sBotB + (eBotB - sBotB) * t);

    bg.skyGfx.clear();
    for (let y = 0; y < groundY; y++) {
      const yt = y / groundY;
      const r = Math.round(topR + (botR - topR) * yt);
      const g = Math.round(topG + (botG - topG) * yt);
      const b = Math.round(topB + (botB - topB) * yt);
      bg.skyGfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      bg.skyGfx.fillRect(0, y, GAME_CONFIG.width, 1);
    }
  }

  shutdown(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.pipeSpawner.destroy();
    this.scoreSystem.destroy();
    this.particles.destroy();
    this.background.destroy();
  }
}

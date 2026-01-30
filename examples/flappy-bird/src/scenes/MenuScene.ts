import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, TRANSITION_CONFIG } from '../core/Constants';
import { gameState } from '../core/GameState';
import { eventBus, Events } from '../core/EventBus';
import Background from '../systems/Background';

export default class MenuScene extends Phaser.Scene {
  private background!: Background;
  private audioStarted: boolean = false;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    gameState.reset();

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    // Fade in
    this.cameras.main.fadeIn(TRANSITION_CONFIG.fadeDuration, 0, 0, 0);

    // Background (gradient sky + clouds + ground with grass)
    this.background = new Background(this);
    this.background.create();

    // Title — drops in from above with bounce
    const titleFlappy = this.add.text(centerX, -60, 'FLAPPY', {
      fontSize: '52px',
      fontFamily: 'Arial Black, Arial',
      color: COLORS.scoreText,
      stroke: COLORS.textStroke,
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(20);

    const titleBird = this.add.text(centerX, -60, 'BIRD', {
      fontSize: '52px',
      fontFamily: 'Arial Black, Arial',
      color: COLORS.scoreText,
      stroke: COLORS.textStroke,
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(20);

    // Bounce-in title animation
    this.tweens.add({
      targets: titleFlappy,
      y: centerY - 120,
      duration: 700,
      ease: 'Bounce.easeOut',
      delay: 100,
    });

    this.tweens.add({
      targets: titleBird,
      y: centerY - 65,
      duration: 700,
      ease: 'Bounce.easeOut',
      delay: 250,
    });

    // Bird preview — flies in from the left
    const birdGfx = this.add.graphics().setDepth(20);
    birdGfx.fillStyle(COLORS.bird, 1);
    birdGfx.fillEllipse(0, 0, 40, 32);
    birdGfx.fillStyle(COLORS.birdWing, 1);
    birdGfx.fillEllipse(-2, 2, 20, 14);
    birdGfx.fillStyle(COLORS.birdEye, 1);
    birdGfx.fillCircle(8, -4, 6);
    birdGfx.fillStyle(COLORS.birdPupil, 1);
    birdGfx.fillCircle(10, -4, 3);
    birdGfx.fillStyle(COLORS.birdBeak, 1);
    birdGfx.fillTriangle(12, 0, 24, 3, 12, 6);

    birdGfx.setPosition(-50, centerY + 10);

    // Fly in from left
    this.tweens.add({
      targets: birdGfx,
      x: centerX,
      duration: 600,
      ease: 'Cubic.easeOut',
      delay: 500,
      onComplete: () => {
        // Bob animation after landing
        this.tweens.add({
          targets: birdGfx,
          y: centerY,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });

    // Instructions — fade in after bird arrives
    const tapText = this.add.text(centerX, centerY + 80, 'TAP OR PRESS SPACE', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: COLORS.scoreText,
      stroke: COLORS.textStroke,
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20).setAlpha(0);

    this.tweens.add({
      targets: tapText,
      alpha: 1,
      duration: 400,
      delay: 900,
      onComplete: () => {
        // Pulse after appearing
        this.tweens.add({
          targets: tapText,
          alpha: 0.3,
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
      },
    });

    // Best score — slide up from bottom
    if (gameState.bestScore > 0) {
      const bestText = this.add.text(centerX, GAME_CONFIG.height + 30, `BEST: ${gameState.bestScore}`, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: COLORS.scoreText,
        stroke: COLORS.textStroke,
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(20);

      this.tweens.add({
        targets: bestText,
        y: centerY + 130,
        duration: 500,
        ease: 'Back.easeOut',
        delay: 1100,
      });
    }

    // Input — first tap inits audio + plays menu music, second tap starts game
    this.audioStarted = false;
    this.input.on('pointerdown', () => this.handleInput());
    this.input.keyboard!.on('keydown-SPACE', () => this.handleInput());
  }

  update(_time: number, delta: number): void {
    this.background.update(delta);
  }

  handleInput(): void {
    if (!this.audioStarted) {
      // First interaction: init audio and start menu music (browser autoplay policy)
      this.audioStarted = true;
      eventBus.emit(Events.AUDIO_INIT);
      eventBus.emit(Events.MUSIC_MENU);
      return;
    }
    eventBus.emit(Events.SFX_BUTTON_CLICK);
    this.startGame();
  }

  startGame(): void {
    eventBus.emit(Events.MUSIC_STOP);
    this.cameras.main.fadeOut(TRANSITION_CONFIG.fadeDuration, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  shutdown(): void {
    this.background.destroy();
  }
}

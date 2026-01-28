import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, TRANSITION_CONFIG } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import Background from '../systems/Background.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    gameState.reset();

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    // Fade in
    this.cameras.main.fadeIn(TRANSITION_CONFIG.fadeDuration, 0, 0, 0);

    // Background (gradient sky + clouds + ground with grass)
    this.background = new Background(this);
    this.background.create();

    // Title
    this.add.text(centerX, centerY - 120, 'FLAPPY', {
      fontSize: '52px',
      fontFamily: 'Arial Black, Arial',
      color: COLORS.scoreText,
      stroke: COLORS.textStroke,
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(20);

    this.add.text(centerX, centerY - 65, 'BIRD', {
      fontSize: '52px',
      fontFamily: 'Arial Black, Arial',
      color: COLORS.scoreText,
      stroke: COLORS.textStroke,
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(20);

    // Bird preview
    const birdGfx = this.add.graphics().setDepth(20);
    birdGfx.fillStyle(COLORS.bird, 1);
    birdGfx.fillEllipse(centerX, centerY + 10, 40, 32);
    birdGfx.fillStyle(COLORS.birdWing, 1);
    birdGfx.fillEllipse(centerX - 2, centerY + 12, 20, 14);
    birdGfx.fillStyle(COLORS.birdEye, 1);
    birdGfx.fillCircle(centerX + 8, centerY + 6, 6);
    birdGfx.fillStyle(COLORS.birdPupil, 1);
    birdGfx.fillCircle(centerX + 10, centerY + 6, 3);
    birdGfx.fillStyle(COLORS.birdBeak, 1);
    birdGfx.fillTriangle(centerX + 12, centerY + 10, centerX + 24, centerY + 13, centerX + 12, centerY + 16);

    // Bob animation
    this.tweens.add({
      targets: birdGfx,
      y: -10,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Instructions
    const tapText = this.add.text(centerX, centerY + 80, 'TAP OR PRESS SPACE', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: COLORS.scoreText,
      stroke: COLORS.textStroke,
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: tapText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Best score
    if (gameState.bestScore > 0) {
      this.add.text(centerX, centerY + 130, `BEST: ${gameState.bestScore}`, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: COLORS.scoreText,
        stroke: COLORS.textStroke,
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(20);
    }

    // Input — first tap inits audio + plays menu music, second tap starts game
    this.audioStarted = false;
    this.input.on('pointerdown', () => this.handleInput());
    this.input.keyboard.on('keydown-SPACE', () => this.handleInput());
  }

  update(time, delta) {
    this.background.update(delta);
  }

  handleInput() {
    if (!this.audioStarted) {
      // First interaction: init audio and start menu music (browser autoplay policy)
      this.audioStarted = true;
      eventBus.emit(Events.AUDIO_INIT);
      eventBus.emit(Events.MUSIC_MENU);
      return;
    }
    this.startGame();
  }

  startGame() {
    eventBus.emit(Events.MUSIC_STOP);
    this.cameras.main.fadeOut(TRANSITION_CONFIG.fadeDuration, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  shutdown() {
    this.background.destroy();
  }
}

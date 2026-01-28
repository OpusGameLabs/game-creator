import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, TRANSITION_CONFIG } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import Background from '../systems/Background.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    // Fade in
    this.cameras.main.fadeIn(TRANSITION_CONFIG.fadeDuration, 0, 0, 0);

    // Play game over theme
    eventBus.emit(Events.MUSIC_GAMEOVER);

    // Background (gradient sky + clouds + ground with grass)
    this.background = new Background(this);
    this.background.create();

    // Score panel background
    const panel = this.add.graphics().setDepth(20);
    panel.fillStyle(COLORS.panelFill, 1);
    panel.fillRoundedRect(centerX - 110, centerY - 90, 220, 160, 12);
    panel.lineStyle(3, COLORS.panelBorder, 1);
    panel.strokeRoundedRect(centerX - 110, centerY - 90, 220, 160, 12);

    // Game Over text
    this.add.text(centerX, centerY - 140, 'GAME OVER', {
      fontSize: '40px',
      fontFamily: 'Arial Black, Arial',
      color: COLORS.scoreText,
      stroke: COLORS.textStroke,
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20);

    // Score
    this.add.text(centerX - 80, centerY - 60, 'SCORE', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: COLORS.panelText,
    }).setDepth(20);

    this.add.text(centerX + 80, centerY - 60, gameState.score.toString(), {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(20);

    // Best score
    this.add.text(centerX - 80, centerY - 10, 'BEST', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: COLORS.panelText,
    }).setDepth(20);

    this.add.text(centerX + 80, centerY - 10, gameState.bestScore.toString(), {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(20);

    // New badge
    if (gameState.score === gameState.bestScore && gameState.score > 0) {
      const newBadge = this.add.text(centerX, centerY - 35, 'NEW!', {
        fontSize: '14px',
        fontFamily: 'Arial Black, Arial',
        color: '#ff3333',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(20);

      this.tweens.add({
        targets: newBadge,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Restart button
    const btnY = centerY + 100;
    const btn = this.add.graphics().setDepth(20);
    btn.fillStyle(COLORS.btnFill, 1);
    btn.fillRoundedRect(centerX - 60, btnY - 20, 120, 40, 8);
    btn.lineStyle(2, COLORS.btnBorder, 1);
    btn.strokeRoundedRect(centerX - 60, btnY - 20, 120, 40, 8);

    const btnText = this.add.text(centerX, btnY, 'PLAY', {
      fontSize: '22px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);

    // Interactive button with hover/press feel
    const hitZone = this.add.zone(centerX, btnY, 120, 40).setInteractive({ useHandCursor: true }).setDepth(20);

    hitZone.on('pointerover', () => {
      this.tweens.add({
        targets: [btn, btnText],
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 100,
        ease: 'Quad.easeOut',
      });
    });

    hitZone.on('pointerout', () => {
      this.tweens.add({
        targets: [btn, btnText],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Quad.easeOut',
      });
    });

    hitZone.on('pointerdown', () => {
      this.tweens.add({
        targets: [btn, btnText],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
      });
    });

    hitZone.on('pointerup', () => {
      this.restartGame();
    });

    // Also space to restart
    this.input.keyboard.on('keydown-SPACE', () => this.restartGame());

    // Slide-in animation for panel
    panel.setAlpha(0);
    panel.y = 30;
    this.tweens.add({
      targets: panel,
      alpha: 1,
      y: 0,
      duration: 400,
      delay: 150,
      ease: 'Back.easeOut',
    });
  }

  update(time, delta) {
    this.background.update(delta);
  }

  restartGame() {
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

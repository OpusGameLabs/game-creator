import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, TRANSITION_CONFIG, MEDAL_CONFIG } from '../core/Constants.js';
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

    // Game Over text — drops in from above
    const gameOverText = this.add.text(centerX, centerY - 140, 'GAME OVER', {
      fontSize: '40px',
      fontFamily: 'Arial Black, Arial',
      color: COLORS.scoreText,
      stroke: COLORS.textStroke,
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20).setAlpha(0).setY(centerY - 200);

    this.tweens.add({
      targets: gameOverText,
      y: centerY - 140,
      alpha: 1,
      duration: 500,
      ease: 'Bounce.easeOut',
    });

    // Score panel background
    const panel = this.add.graphics().setDepth(20);
    panel.fillStyle(COLORS.panelFill, 1);
    panel.fillRoundedRect(centerX - 110, centerY - 90, 220, 180, 12);
    panel.lineStyle(3, COLORS.panelBorder, 1);
    panel.strokeRoundedRect(centerX - 110, centerY - 90, 220, 180, 12);

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

    // Medal
    const medal = this.getMedal(gameState.score);
    if (medal) {
      const medalY = centerY + 50;

      // Medal circle
      const medalGfx = this.add.graphics().setDepth(21);
      medalGfx.fillStyle(medal.color, 1);
      medalGfx.fillCircle(centerX - 50, medalY, 22);
      medalGfx.lineStyle(2, 0x000000, 0.3);
      medalGfx.strokeCircle(centerX - 50, medalY, 22);
      // Star on medal
      medalGfx.fillStyle(0xffffff, 0.5);
      this.drawStar(medalGfx, centerX - 50, medalY, 5, 10, 5);

      // Medal label
      const medalText = this.add.text(centerX + 10, medalY, medal.label, {
        fontSize: '18px',
        fontFamily: 'Arial Black, Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0, 0.5).setDepth(21);

      // Pop-in animation
      medalGfx.setScale(0);
      medalText.setScale(0);
      this.tweens.add({
        targets: [medalGfx, medalText],
        scaleX: 1,
        scaleY: 1,
        duration: 400,
        delay: 400,
        ease: 'Back.easeOut',
      });

      // Shimmer on medal
      this.tweens.add({
        targets: medalGfx,
        alpha: 0.8,
        duration: 800,
        delay: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Restart button
    const btnY = centerY + 120;
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
      eventBus.emit(Events.SFX_BUTTON_CLICK);
      this.restartGame();
    });

    // Also space to restart
    this.input.keyboard.on('keydown-SPACE', () => {
      eventBus.emit(Events.SFX_BUTTON_CLICK);
      this.restartGame();
    });

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

  getMedal(score) {
    const { platinum, gold, silver, bronze } = MEDAL_CONFIG;
    if (score >= platinum.threshold) return platinum;
    if (score >= gold.threshold) return gold;
    if (score >= silver.threshold) return silver;
    if (score >= bronze.threshold) return bronze;
    return null;
  }

  drawStar(gfx, cx, cy, points, outerR, innerR) {
    const step = Math.PI / points;
    gfx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * step - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) gfx.moveTo(x, y);
      else gfx.lineTo(x, y);
    }
    gfx.closePath();
    gfx.fillPath();
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

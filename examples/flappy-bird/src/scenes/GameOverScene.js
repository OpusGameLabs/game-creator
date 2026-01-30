import Phaser from 'phaser';
import { GAME, COLORS, TRANSITION } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    this.cameras.main.setBackgroundColor(COLORS.GAMEOVER_BG);
    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);

    eventBus.emit(Events.MUSIC_GAMEOVER);

    // Game Over title
    const title = this.add.text(cx, cy - 140, 'GAME OVER', {
      fontSize: '40px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Slide in from top
    title.setAlpha(0);
    title.y -= 30;
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: title.y + 30,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Score panel
    const panelW = 240;
    const panelH = 140;
    const panelY = cy - 20;

    // Panel background
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.PANEL_BG, 1);
    panel.fillRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 10);
    panel.lineStyle(3, COLORS.PANEL_BORDER, 1);
    panel.strokeRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 10);

    // Score
    this.add.text(cx - 90, panelY - 35, 'Score', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#5a3e00',
    });

    this.add.text(cx + 90, panelY - 35, `${gameState.score}`, {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#5a3e00',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    // Best
    this.add.text(cx - 90, panelY + 10, 'Best', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#5a3e00',
    });

    this.add.text(cx + 90, panelY + 10, `${gameState.bestScore}`, {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#5a3e00',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    // Medal
    if (gameState.score >= 5) {
      const medalColor = gameState.score >= 20 ? COLORS.MEDAL_GOLD :
                          gameState.score >= 10 ? COLORS.MEDAL_SILVER :
                          COLORS.MEDAL_BRONZE;
      const medal = this.add.circle(cx - 60, panelY + 5, 18, medalColor, 1);
      this.add.text(cx - 60, panelY + 5, gameState.score >= 20 ? 'G' : gameState.score >= 10 ? 'S' : 'B', {
        fontSize: '16px',
        fontFamily: 'Arial Black, Arial, sans-serif',
        color: '#5a3e00',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // Restart button — use a visible rectangle as the interactive element
    const btnY = cy + 80;
    const btn = this.add.rectangle(cx, btnY, 180, 48, COLORS.BUTTON, 1)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(cx, btnY, 'RESTART', {
      fontSize: '22px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: COLORS.BUTTON_TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Button hover
    btn.on('pointerover', () => {
      btn.setFillStyle(COLORS.BUTTON_HOVER);
      this.tweens.add({ targets: [btn, btnText], scaleX: 1.05, scaleY: 1.05, duration: 80 });
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(COLORS.BUTTON);
      this.tweens.add({ targets: [btn, btnText], scaleX: 1, scaleY: 1, duration: 80 });
    });
    btn.on('pointerdown', () => this.restartGame());

    // Space to restart
    this.input.keyboard.once('keydown-SPACE', () => this.restartGame());
  }

  restartGame() {
    eventBus.emit(Events.MUSIC_STOP);
    eventBus.emit(Events.GAME_RESTART);
    this.scene.start('MenuScene');
  }
}

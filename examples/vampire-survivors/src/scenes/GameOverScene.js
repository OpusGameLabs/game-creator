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

    // Title
    const titleText = gameState.won ? 'YOU SURVIVED!' : 'GAME OVER';
    const titleColor = gameState.won ? '#ffcc00' : '#ff4444';

    const title = this.add.text(cx, cy - 160, titleText, {
      fontSize: '44px', fontFamily: 'Arial Black, Arial, sans-serif',
      color: titleColor, stroke: '#000000', strokeThickness: 6, fontStyle: 'bold',
    }).setOrigin(0.5);

    title.setAlpha(0);
    title.y -= 30;
    this.tweens.add({ targets: title, alpha: 1, y: title.y + 30, duration: 400, ease: 'Back.easeOut' });

    // Stats panel
    const panelW = 300;
    const panelH = 180;
    const panelY = cy - 10;

    const panel = this.add.graphics();
    panel.fillStyle(0x1a0a2e, 0.9);
    panel.fillRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 12);
    panel.lineStyle(2, 0x6644cc, 1);
    panel.strokeRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 12);

    const elapsed = gameState.elapsedTime;
    const m = Math.floor(elapsed / 60);
    const s = Math.floor(elapsed % 60);

    const stats = [
      { label: 'Time', value: `${m}:${s.toString().padStart(2, '0')}` },
      { label: 'Kills', value: `${gameState.kills}` },
      { label: 'Level', value: `${gameState.level}` },
      { label: 'Best Time', value: formatTime(gameState.bestTime) },
    ];

    stats.forEach((stat, i) => {
      const y = panelY - 55 + i * 35;
      this.add.text(cx - 110, y, stat.label, {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#aaaacc',
      });
      this.add.text(cx + 110, y, stat.value, {
        fontSize: '20px', fontFamily: 'Arial Black, Arial, sans-serif',
        color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(1, 0);
    });

    // Restart button
    const btnY = cy + 120;
    const btn = this.add.rectangle(cx, btnY, 200, 50, COLORS.BUTTON, 1)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(cx, btnY, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'Arial Black, Arial, sans-serif',
      color: COLORS.BUTTON_TEXT, fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setFillStyle(COLORS.BUTTON_HOVER);
      this.tweens.add({ targets: [btn, btnText], scaleX: 1.05, scaleY: 1.05, duration: 80 });
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(COLORS.BUTTON);
      this.tweens.add({ targets: [btn, btnText], scaleX: 1, scaleY: 1, duration: 80 });
    });
    btn.on('pointerdown', () => this.restartGame());

    this.input.keyboard.once('keydown-SPACE', () => this.restartGame());
  }

  restartGame() {
    eventBus.emit(Events.MUSIC_STOP);
    eventBus.emit(Events.GAME_RESTART);
    this.scene.start('MenuScene');
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

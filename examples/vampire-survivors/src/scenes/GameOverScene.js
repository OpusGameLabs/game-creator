import Phaser from 'phaser';
import { GAME, COLORS, TRANSITION, SAFE_ZONE, UI, PX } from '../core/Constants.js';
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

    // Title — positioned below SAFE_ZONE
    const titleText = gameState.won ? 'YOU SURVIVED!' : 'GAME OVER';
    const titleColor = gameState.won ? '#ffcc00' : '#ff4444';
    const titleFontSize = Math.round(GAME.HEIGHT * UI.TITLE_RATIO);

    const title = this.add.text(cx, SAFE_ZONE.TOP + 40 * PX, titleText, {
      fontSize: `${titleFontSize}px`,
      fontFamily: UI.FONT,
      color: titleColor, stroke: '#000000', strokeThickness: 6 * PX, fontStyle: 'bold',
    }).setOrigin(0.5);

    title.setAlpha(0);
    title.y -= 30 * PX;
    this.tweens.add({ targets: title, alpha: 1, y: title.y + 30 * PX, duration: 400, ease: 'Back.easeOut' });

    // Stats panel
    const panelW = 300 * PX;
    const panelH = 180 * PX;
    const panelY = cy;

    const panel = this.add.graphics();
    panel.fillStyle(0x1a0a2e, 0.9);
    panel.fillRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 12 * PX);
    panel.lineStyle(2 * PX, 0x6644cc, 1);
    panel.strokeRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 12 * PX);

    const elapsed = gameState.elapsedTime;
    const m = Math.floor(elapsed / 60);
    const s = Math.floor(elapsed % 60);

    const labelSize = Math.round(GAME.HEIGHT * UI.BODY_RATIO);
    const valueSize = Math.round(GAME.HEIGHT * UI.HEADING_RATIO);

    const stats = [
      { label: 'Time', value: `${m}:${s.toString().padStart(2, '0')}` },
      { label: 'Kills', value: `${gameState.kills}` },
      { label: 'Level', value: `${gameState.level}` },
      { label: 'Best Time', value: formatTime(gameState.bestTime) },
    ];

    stats.forEach((stat, i) => {
      const y = panelY - panelH * 0.3 + i * 35 * PX;
      this.add.text(cx - panelW * 0.37, y, stat.label, {
        fontSize: `${labelSize}px`, fontFamily: UI.FONT, color: '#aaaacc',
      });
      this.add.text(cx + panelW * 0.37, y, stat.value, {
        fontSize: `${valueSize}px`, fontFamily: UI.FONT,
        color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(1, 0);
    });

    // Restart button
    const btnW = GAME.WIDTH * UI.BTN_W_RATIO * 0.6;
    const btnH = GAME.HEIGHT * UI.BTN_H_RATIO;
    const btnY = panelY + panelH / 2 + 40 * PX;
    const btnFontSize = Math.round(GAME.HEIGHT * UI.BODY_RATIO);

    const btn = this.add.rectangle(cx, btnY, btnW, btnH, COLORS.BUTTON, 1)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(cx, btnY, 'PLAY AGAIN', {
      fontSize: `${btnFontSize}px`, fontFamily: UI.FONT,
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
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

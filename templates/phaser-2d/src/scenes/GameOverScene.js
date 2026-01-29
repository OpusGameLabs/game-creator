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

    // Game Over title
    this.add.text(cx, cy - 100, 'GAME OVER', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Score
    this.add.text(cx, cy - 20, `Score: ${gameState.score}`, {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: COLORS.UI_TEXT,
    }).setOrigin(0.5);

    // Best score
    this.add.text(cx, cy + 20, `Best: ${gameState.bestScore}`, {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Restart button
    const btn = this.add.rectangle(cx, cy + 100, 200, 50, COLORS.BUTTON).setInteractive({ useHandCursor: true });
    const btnText = this.add.text(cx, cy + 100, 'RESTART', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(COLORS.BUTTON_HOVER));
    btn.on('pointerout', () => btn.setFillStyle(COLORS.BUTTON));
    btn.on('pointerdown', () => this.restartGame());

    // Space to restart
    this.input.keyboard.once('keydown-SPACE', () => this.restartGame());
  }

  restartGame() {
    eventBus.emit(Events.GAME_RESTART);
    this.scene.start('MenuScene');
  }
}

import Phaser from 'phaser';
import { GAME, COLORS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    // Background
    this.cameras.main.setBackgroundColor(COLORS.MENU_BG);

    // Title
    this.add.text(cx, cy - 80, 'MY GAME', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Instruction
    const prompt = this.add.text(cx, cy + 40, 'Press SPACE to Start', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: COLORS.UI_TEXT,
    }).setOrigin(0.5);

    // Blink the prompt
    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Input
    this.input.keyboard.once('keydown-SPACE', () => {
      eventBus.emit(Events.GAME_START);
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });
  }
}

import Phaser from 'phaser';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { GAME_CONFIG, COLORS } from '../core/Constants.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    const centerX = GAME_CONFIG.width / 2;

    this.scoreText = this.add.text(centerX, 50, '0', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      color: COLORS.scoreText,
      stroke: COLORS.textStroke,
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(100);

    this.unsubscribers = [
      eventBus.on(Events.SCORE_CHANGED, ({ score }) => {
        this.scoreText.setText(score.toString());

        // Pop animation
        this.tweens.add({
          targets: this.scoreText,
          scaleX: 1.4,
          scaleY: 1.4,
          duration: 80,
          yoyo: true,
          ease: 'Quad.easeOut',
        });

        // Floating "+1" text
        const floater = this.add.text(centerX + 40, 40, '+1', {
          fontSize: '22px',
          fontFamily: 'Arial Black, Arial',
          color: COLORS.scoreFloat,
          stroke: COLORS.scoreFloatStroke,
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
          targets: floater,
          y: floater.y - 40,
          alpha: 0,
          duration: 600,
          ease: 'Quad.easeOut',
          onComplete: () => floater.destroy(),
        });
      }),
    ];
  }

  shutdown() {
    this.unsubscribers.forEach(unsub => unsub());
  }
}

import Phaser from 'phaser';
import { COLORS, TRANSITION } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: COLORS.UI_TEXT,
      stroke: COLORS.UI_SHADOW,
      strokeThickness: 3,
    });

    this.onScoreChanged = ({ score }) => {
      this.scoreText.setText(`Score: ${score}`);
      // Pop animation
      this.tweens.add({
        targets: this.scoreText,
        scaleX: TRANSITION.SCORE_POP_SCALE,
        scaleY: TRANSITION.SCORE_POP_SCALE,
        duration: TRANSITION.SCORE_POP_DURATION,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    };

    eventBus.on(Events.SCORE_CHANGED, this.onScoreChanged);

    this.events.on('shutdown', () => {
      eventBus.off(Events.SCORE_CHANGED, this.onScoreChanged);
    });
  }
}

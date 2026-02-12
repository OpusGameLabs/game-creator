import Phaser from 'phaser';
import { GAME, COLORS, UI, TRANSITION } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    const scoreSize = Math.round(GAME.HEIGHT * UI.SCORE_SIZE_RATIO);
    const padding = GAME.WIDTH * 0.03;

    this.scoreText = this.add.text(padding, padding, 'Score: 0', {
      fontSize: scoreSize + 'px',
      fontFamily: UI.FONT,
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
      stroke: COLORS.UI_SHADOW,
      strokeThickness: UI.SCORE_STROKE,
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

// =============================================================================
// Barn Defense - WaveIndicator
// Shows current wave progress and provides "Start Wave" button.
// =============================================================================

import { GAME, COLORS, UI, EFFECTS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class WaveIndicator {
  constructor(scene) {
    this.scene = scene;
    this.create();

    // Listen for wave updates (smooth text transition)
    this.onWaveUpdated = ({ current, total }) => {
      // Brief scale pop on wave change
      this.scene.tweens.add({
        targets: this.waveText,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut',
        onYoyo: () => {
          this.waveText.setText(`Wave ${current}/${total}`);
        },
      });
      this.updateStartButton();
    };
    eventBus.on(Events.WAVE_UPDATED, this.onWaveUpdated);

    // Listen for wave complete
    this.onWaveComplete = () => {
      this.updateStartButton();
    };
    eventBus.on(Events.WAVE_COMPLETE, this.onWaveComplete);

    // Listen for all waves complete
    this.onAllWavesComplete = () => {
      this.startBtn.setVisible(false);
      this.startBtnText.setVisible(false);
      this.waveText.setText('All Waves Cleared!');
      this.waveText.setColor(COLORS.UI_GREEN_TEXT);
    };
    eventBus.on(Events.WAVE_ALL_COMPLETE, this.onAllWavesComplete);

    // Listen for game over
    this.onGameOver = () => {
      this.startBtn.setVisible(false);
      this.startBtnText.setVisible(false);
    };
    eventBus.on(Events.GAME_OVER, this.onGameOver);
  }

  create() {
    // Wave text - positioned in top bar area (with text stroke)
    this.waveText = this.scene.add.text(GAME.WIDTH / 2, 10, `Wave 0/${gameState.totalWaves}`, {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: EFFECTS.TEXT_STROKE_THICKNESS,
    }).setOrigin(0.5, 0);

    // Start Wave button
    this.startBtn = this.scene.add.rectangle(
      GAME.WIDTH / 2, UI.PANEL_Y - 22,
      140, 28,
      COLORS.BUTTON, 0.9
    );
    this.startBtn.setStrokeStyle(1, COLORS.BUTTON_HOVER);
    this.startBtn.setInteractive({ useHandCursor: true });

    this.startBtnText = this.scene.add.text(
      GAME.WIDTH / 2, UI.PANEL_Y - 22,
      'Start Wave',
      {
        fontSize: UI.FONT_SIZE_MEDIUM,
        fontFamily: UI.FONT_FAMILY,
        color: COLORS.UI_TEXT,
        fontStyle: 'bold',
        stroke: EFFECTS.TEXT_STROKE_COLOR,
        strokeThickness: EFFECTS.TEXT_STROKE_THICKNESS,
      }
    ).setOrigin(0.5);

    this.startBtn.on('pointerover', () => {
      this.startBtn.setFillStyle(COLORS.BUTTON_HOVER, 1);
    });
    this.startBtn.on('pointerout', () => {
      this.startBtn.setFillStyle(COLORS.BUTTON, 0.9);
    });
    this.startBtn.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      if (!gameState.waveInProgress && !gameState.gameOver && !gameState.levelComplete) {
        eventBus.emit(Events.WAVE_START);
      }
    });

    this.updateStartButton();
  }

  updateStartButton() {
    const canStart = !gameState.waveInProgress &&
                     !gameState.gameOver &&
                     !gameState.levelComplete &&
                     gameState.currentWave < gameState.totalWaves;

    this.startBtn.setVisible(canStart);
    this.startBtnText.setVisible(canStart);

    if (canStart) {
      this.startBtnText.setText(`Start Wave ${gameState.currentWave + 1}`);
    }
  }

  destroy() {
    eventBus.off(Events.WAVE_UPDATED, this.onWaveUpdated);
    eventBus.off(Events.WAVE_COMPLETE, this.onWaveComplete);
    eventBus.off(Events.WAVE_ALL_COMPLETE, this.onAllWavesComplete);
    eventBus.off(Events.GAME_OVER, this.onGameOver);
  }
}

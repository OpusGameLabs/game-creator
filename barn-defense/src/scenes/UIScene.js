// =============================================================================
// Barn Defense - UIScene
// HUD overlay (parallel scene) showing corn, lives, wave info, tower panel,
// and game speed controls.
// =============================================================================

import Phaser from 'phaser';
import { GAME, COLORS, UI, SPEED, TRANSITION, EFFECTS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { TowerPanel } from '../ui/TowerPanel.js';
import { WaveIndicator } from '../ui/WaveIndicator.js';
import { LEVELS } from '../systems/MapSystem.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    // Top bar background
    this.add.rectangle(
      GAME.WIDTH / 2, UI.TOP_BAR_HEIGHT / 2,
      GAME.WIDTH, UI.TOP_BAR_HEIGHT,
      UI.TOP_BAR_BG, UI.TOP_BAR_ALPHA
    );

    // Level name (with text shadow)
    const levelName = LEVELS[gameState.currentLevel]
      ? LEVELS[gameState.currentLevel].name
      : 'Unknown';

    this.levelText = this.add.text(10, 10, `Level ${gameState.currentLevel + 1}: ${levelName}`, {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_GOLD_TEXT,
      fontStyle: 'bold',
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: EFFECTS.TEXT_STROKE_THICKNESS,
    });

    // Corn display (with text shadow)
    this.cornText = this.add.text(GAME.WIDTH - 200, 10, `Corn: ${gameState.corn}`, {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_GOLD_TEXT,
      fontStyle: 'bold',
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: EFFECTS.TEXT_STROKE_THICKNESS,
    });
    this.cornBaseX = GAME.WIDTH - 200;

    // Lives display (with text shadow)
    this.livesText = this.add.text(GAME.WIDTH - 80, 10, `Lives: ${gameState.lives}`, {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: EFFECTS.TEXT_STROKE_THICKNESS,
    });
    this.livesBaseX = GAME.WIDTH - 80;

    // Speed button
    this.speedBtn = this.add.rectangle(
      GAME.WIDTH - 40, UI.PANEL_Y - 22,
      60, 24,
      COLORS.UI_BUTTON, 0.8
    );
    this.speedBtn.setInteractive({ useHandCursor: true });
    this.speedBtnText = this.add.text(
      GAME.WIDTH - 40, UI.PANEL_Y - 22,
      '1x',
      {
        fontSize: UI.FONT_SIZE_SMALL,
        fontFamily: UI.FONT_FAMILY,
        color: COLORS.UI_TEXT,
        fontStyle: 'bold',
        stroke: EFFECTS.TEXT_STROKE_COLOR,
        strokeThickness: 1,
      }
    ).setOrigin(0.5);

    this.speedBtn.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      this.toggleSpeed();
    });

    // Tower panel
    this.towerPanel = new TowerPanel(this);

    // Wave indicator
    this.waveIndicator = new WaveIndicator(this);

    // Listen for corn changes -- flash gold + bounce
    this.onCornChanged = ({ corn }) => {
      this.cornText.setText(`Corn: ${corn}`);
      // Flash white briefly then back to gold
      this.cornText.setColor(EFFECTS.CORN_FLASH_COLOR);
      this.time.delayedCall(EFFECTS.CORN_FLASH_DURATION, () => {
        if (this.cornText) this.cornText.setColor(COLORS.UI_GOLD_TEXT);
      });
      // Pop animation
      this.tweens.add({
        targets: this.cornText,
        scaleX: TRANSITION.SCORE_POP_SCALE,
        scaleY: TRANSITION.SCORE_POP_SCALE,
        duration: TRANSITION.SCORE_POP_DURATION,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    };
    eventBus.on(Events.CORN_CHANGED, this.onCornChanged);

    // Listen for lives changes -- flash red + shake
    this.onLivesChanged = ({ lives }) => {
      this.livesText.setText(`Lives: ${lives}`);
      this.livesText.setColor(COLORS.UI_RED_TEXT);
      // Flash red then back
      this.time.delayedCall(300, () => {
        if (this.livesText) {
          this.livesText.setColor(lives <= 5 ? COLORS.UI_RED_TEXT : COLORS.UI_TEXT);
        }
      });
      // Enhanced shake animation
      const shkCfg = EFFECTS.LIVES_SHAKE;
      this.tweens.add({
        targets: this.livesText,
        x: { from: this.livesBaseX - shkCfg.OFFSET, to: this.livesBaseX + shkCfg.OFFSET },
        duration: shkCfg.DURATION,
        yoyo: true,
        repeat: shkCfg.REPEATS,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          if (this.livesText) this.livesText.setX(this.livesBaseX);
        },
      });
    };
    eventBus.on(Events.LIVES_CHANGED, this.onLivesChanged);

    // Cleanup on shutdown
    this.events.on('shutdown', () => {
      eventBus.off(Events.CORN_CHANGED, this.onCornChanged);
      eventBus.off(Events.LIVES_CHANGED, this.onLivesChanged);
      if (this.towerPanel) this.towerPanel.destroy();
      if (this.waveIndicator) this.waveIndicator.destroy();
    });
  }

  toggleSpeed() {
    if (gameState.gameSpeed === SPEED.NORMAL) {
      gameState.gameSpeed = SPEED.FAST;
      this.speedBtnText.setText('2x');
      this.speedBtn.setFillStyle(COLORS.UI_BUTTON_HOVER, 0.9);
    } else {
      gameState.gameSpeed = SPEED.NORMAL;
      this.speedBtnText.setText('1x');
      this.speedBtn.setFillStyle(COLORS.UI_BUTTON, 0.8);
    }
    // Spin effect on speed toggle
    const rotCfg = EFFECTS.SPEED_TOGGLE_ROTATION;
    this.tweens.add({
      targets: this.speedBtnText,
      angle: { from: 0, to: rotCfg.ANGLE },
      duration: rotCfg.DURATION,
      ease: 'Quad.easeOut',
    });
    eventBus.emit(Events.UI_SPEED_CHANGE, { speed: gameState.gameSpeed });
  }
}

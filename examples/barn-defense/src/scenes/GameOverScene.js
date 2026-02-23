// =============================================================================
// Barn Defense - GameOverScene
// Shown when the barn is destroyed (lives reach 0).
// =============================================================================

import Phaser from 'phaser';
import { GAME, COLORS, UI, TRANSITION, PARTICLES, EFFECTS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { LEVELS } from '../systems/MapSystem.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    // Start game over music
    eventBus.emit(Events.MUSIC_GAMEOVER);

    this.cameras.main.setBackgroundColor(COLORS.GAMEOVER_BG);

    // Dark red gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x3a0e0e, 0x3a0e0e, 0x1a0505, 0x1a0505, 1);
    bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Somber falling ember particles
    this.createEmbers();

    // Game Over title with shake effect
    const title = this.add.text(cx, cy - 120, 'GAME OVER', {
      fontSize: UI.FONT_SIZE_TITLE,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_RED_TEXT,
      fontStyle: 'bold',
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 4,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: EFFECTS.TEXT_SHADOW_COLOR,
        blur: EFFECTS.TEXT_SHADOW_BLUR,
        fill: true,
      },
    }).setOrigin(0.5);

    // Title shake on appear
    const shk = EFFECTS.GAMEOVER_TITLE_SHAKE;
    this.time.delayedCall(shk.DELAY, () => {
      this.tweens.add({
        targets: title,
        x: { from: cx - shk.OFFSET, to: cx + shk.OFFSET },
        duration: shk.DURATION,
        yoyo: true,
        repeat: shk.REPEATS,
        ease: 'Sine.easeInOut',
        onComplete: () => title.setX(cx),
      });
    });

    // Barn destroyed message -- fade in with delay
    const fadeCfg = EFFECTS.STATS_FADE_IN;
    const stats = [];

    const msgText = this.add.text(cx, cy - 60, 'The barn has been overrun!', {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5).setAlpha(0);
    stats.push(msgText);

    // Stats
    const levelName = LEVELS[gameState.currentLevel]
      ? LEVELS[gameState.currentLevel].name
      : 'Unknown';

    const stat1 = this.add.text(cx, cy - 20, `Level: ${gameState.currentLevel + 1} - ${levelName}`, {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_GOLD_TEXT,
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5).setAlpha(0);
    stats.push(stat1);

    const stat2 = this.add.text(cx, cy + 10, `Wave reached: ${gameState.currentWave}/${gameState.totalWaves}`, {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5).setAlpha(0);
    stats.push(stat2);

    const stat3 = this.add.text(cx, cy + 40, `Towers placed: ${gameState.towersPlaced.length}`, {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5).setAlpha(0);
    stats.push(stat3);

    // Staggered fade-in for stats
    stats.forEach((text, index) => {
      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: fadeCfg.DURATION,
        delay: fadeCfg.STAGGER_DELAY * (index + 1),
        ease: 'Quad.easeOut',
      });
    });

    // Retry button with hover scale
    const retryBtn = this.add.rectangle(cx, cy + 110, 140, 44, COLORS.BUTTON, 0.9);
    retryBtn.setStrokeStyle(2, COLORS.BUTTON_HOVER);
    retryBtn.setInteractive({ useHandCursor: true });

    const retryText = this.add.text(cx, cy + 110, 'RETRY', {
      fontSize: UI.FONT_SIZE_LARGE,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: EFFECTS.TEXT_STROKE_THICKNESS,
    }).setOrigin(0.5);

    retryBtn.on('pointerover', () => {
      retryBtn.setFillStyle(COLORS.BUTTON_HOVER, 1);
      this.tweens.add({
        targets: [retryBtn, retryText],
        scaleX: EFFECTS.BUTTON_HOVER_SCALE,
        scaleY: EFFECTS.BUTTON_HOVER_SCALE,
        duration: EFFECTS.BUTTON_HOVER_DURATION,
        ease: 'Quad.easeOut',
      });
    });
    retryBtn.on('pointerout', () => {
      retryBtn.setFillStyle(COLORS.BUTTON, 0.9);
      this.tweens.add({
        targets: [retryBtn, retryText],
        scaleX: 1,
        scaleY: 1,
        duration: EFFECTS.BUTTON_HOVER_DURATION,
        ease: 'Quad.easeOut',
      });
    });
    retryBtn.on('pointerdown', () => this.retryLevel());


    // Fade in
    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION);
  }

  createEmbers() {
    const cfg = PARTICLES.GAMEOVER_EMBERS;

    for (let i = 0; i < cfg.COUNT; i++) {
      const x = Math.random() * GAME.WIDTH;
      const startY = -20 - Math.random() * 100;
      const size = cfg.MIN_SIZE + Math.random() * (cfg.MAX_SIZE - cfg.MIN_SIZE);
      const color = cfg.COLORS[Math.floor(Math.random() * cfg.COLORS.length)];
      const duration = cfg.MIN_DURATION + Math.random() * (cfg.MAX_DURATION - cfg.MIN_DURATION);

      const ember = this.add.circle(x, startY, size, color, 0.6);
      ember.setDepth(1);

      this.tweens.add({
        targets: ember,
        y: GAME.HEIGHT + 20,
        x: x + (Math.random() - 0.5) * 100,
        alpha: 0,
        duration: duration,
        delay: Math.random() * 2000,
        repeat: -1,
        onRepeat: () => {
          ember.setPosition(Math.random() * GAME.WIDTH, -20);
          ember.setAlpha(0.6);
        },
        ease: 'Sine.easeIn',
      });
    }
  }

  retryLevel() {
    eventBus.emit(Events.MUSIC_STOP);
    eventBus.emit(Events.GAME_RESTART);
    const level = gameState.currentLevel;
    gameState.setLevel(level);
    this.cameras.main.fadeOut(TRANSITION.FADE_DURATION, 0, 0, 0, (camera, progress) => {
      if (progress === 1) {
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
      }
    });
  }

}

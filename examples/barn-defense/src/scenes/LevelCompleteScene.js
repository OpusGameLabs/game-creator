// =============================================================================
// Barn Defense - LevelCompleteScene
// Shown when all waves in a level are cleared.
// =============================================================================

import Phaser from 'phaser';
import { GAME, COLORS, UI, TRANSITION, PARTICLES, EFFECTS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { LEVELS } from '../systems/MapSystem.js';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelCompleteScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    // Start level complete music
    eventBus.emit(Events.MUSIC_LEVELCOMPLETE);

    this.cameras.main.setBackgroundColor(COLORS.LEVELCOMPLETE_BG);

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0e3a1a, 0x0e3a1a, 0x1a5a2a, 0x1a5a2a, 1);
    bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Unlock next level
    gameState.unlockNextLevel();

    // White flash for level complete
    this.cameras.main.flash(
      EFFECTS.LEVEL_COMPLETE_FLASH.DURATION,
      EFFECTS.LEVEL_COMPLETE_FLASH.R,
      EFFECTS.LEVEL_COMPLETE_FLASH.G,
      EFFECTS.LEVEL_COMPLETE_FLASH.B
    );

    // Victory title with pulse
    const title = this.add.text(cx, cy - 120, 'LEVEL COMPLETE!', {
      fontSize: UI.FONT_SIZE_TITLE,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_GREEN_TEXT,
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

    // Celebrate pulse animation
    this.tweens.add({
      targets: title,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Star burst at center
    this.createStarBurst(cx, cy - 120);

    // Level info -- slides in from left
    const levelName = LEVELS[gameState.currentLevel]
      ? LEVELS[gameState.currentLevel].name
      : 'Unknown';

    const slideCfg = EFFECTS.STATS_SLIDE_IN;
    const statsItems = [];

    const levelInfo = this.add.text(cx, cy - 60, `${levelName} - Defended!`, {
      fontSize: UI.FONT_SIZE_LARGE,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_GOLD_TEXT,
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5);
    statsItems.push(levelInfo);

    // Stats
    const stat1 = this.add.text(cx, cy - 20, `Waves survived: ${gameState.currentWave}`, {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5);
    statsItems.push(stat1);

    const stat2 = this.add.text(cx, cy + 10, `Corn remaining: ${gameState.corn}`, {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_GOLD_TEXT,
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5);
    statsItems.push(stat2);

    const stat3 = this.add.text(cx, cy + 40, `Lives remaining: ${gameState.lives}`, {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5);
    statsItems.push(stat3);

    // Staggered slide-in from left
    statsItems.forEach((text, index) => {
      const targetX = text.x;
      text.setX(targetX + slideCfg.OFFSET_X);
      text.setAlpha(0);
      this.tweens.add({
        targets: text,
        x: targetX,
        alpha: 1,
        duration: slideCfg.DURATION,
        delay: slideCfg.STAGGER_DELAY * (index + 1),
        ease: slideCfg.EASE,
      });
    });

    // Next level button (if there is a next level)
    const hasNextLevel = gameState.currentLevel + 1 < LEVELS.length;

    if (hasNextLevel) {
      const nextBtn = this.add.rectangle(cx, cy + 110, 150, 44, COLORS.BUTTON, 0.9);
      nextBtn.setStrokeStyle(2, COLORS.BUTTON_HOVER);
      nextBtn.setInteractive({ useHandCursor: true });

      const nextText = this.add.text(cx, cy + 110, 'NEXT LEVEL', {
        fontSize: UI.FONT_SIZE_MEDIUM,
        fontFamily: UI.FONT_FAMILY,
        color: COLORS.UI_TEXT,
        fontStyle: 'bold',
        stroke: EFFECTS.TEXT_STROKE_COLOR,
        strokeThickness: EFFECTS.TEXT_STROKE_THICKNESS,
      }).setOrigin(0.5);

      nextBtn.on('pointerover', () => {
        nextBtn.setFillStyle(COLORS.BUTTON_HOVER, 1);
        this.tweens.add({
          targets: [nextBtn, nextText],
          scaleX: EFFECTS.BUTTON_HOVER_SCALE,
          scaleY: EFFECTS.BUTTON_HOVER_SCALE,
          duration: EFFECTS.BUTTON_HOVER_DURATION,
          ease: 'Quad.easeOut',
        });
      });
      nextBtn.on('pointerout', () => {
        nextBtn.setFillStyle(COLORS.BUTTON, 0.9);
        this.tweens.add({
          targets: [nextBtn, nextText],
          scaleX: 1,
          scaleY: 1,
          duration: EFFECTS.BUTTON_HOVER_DURATION,
          ease: 'Quad.easeOut',
        });
      });
      nextBtn.on('pointerdown', () => this.nextLevel());
    } else {
      const againBtn = this.add.rectangle(cx, cy + 110, 150, 44, COLORS.BUTTON, 0.9);
      againBtn.setStrokeStyle(2, COLORS.BUTTON_HOVER);
      againBtn.setInteractive({ useHandCursor: true });

      const againText = this.add.text(cx, cy + 110, 'PLAY AGAIN', {
        fontSize: UI.FONT_SIZE_MEDIUM,
        fontFamily: UI.FONT_FAMILY,
        color: COLORS.UI_TEXT,
        fontStyle: 'bold',
        stroke: EFFECTS.TEXT_STROKE_COLOR,
        strokeThickness: EFFECTS.TEXT_STROKE_THICKNESS,
      }).setOrigin(0.5);

      againBtn.on('pointerover', () => {
        againBtn.setFillStyle(COLORS.BUTTON_HOVER, 1);
        this.tweens.add({
          targets: [againBtn, againText],
          scaleX: EFFECTS.BUTTON_HOVER_SCALE,
          scaleY: EFFECTS.BUTTON_HOVER_SCALE,
          duration: EFFECTS.BUTTON_HOVER_DURATION,
          ease: 'Quad.easeOut',
        });
      });
      againBtn.on('pointerout', () => {
        againBtn.setFillStyle(COLORS.BUTTON, 0.9);
        this.tweens.add({
          targets: [againBtn, againText],
          scaleX: 1,
          scaleY: 1,
          duration: EFFECTS.BUTTON_HOVER_DURATION,
          ease: 'Quad.easeOut',
        });
      });
      againBtn.on('pointerdown', () => this.restartGame());
    }

    // Confetti celebration effect
    this.createCelebration();

    // Fade in
    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION);
  }

  createStarBurst(cx, cy) {
    const cfg = PARTICLES.LEVELCOMPLETE_STARBURST;

    for (let i = 0; i < cfg.COUNT; i++) {
      const angle = (i / cfg.COUNT) * Math.PI * 2;
      const speed = cfg.MIN_SPEED + Math.random() * (cfg.MAX_SPEED - cfg.MIN_SPEED);
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;

      const star = this.add.circle(cx, cy, cfg.SIZE, cfg.COLOR, 0.9);
      star.setDepth(10);

      this.tweens.add({
        targets: star,
        x: cx + dx * (cfg.DURATION / 1000),
        y: cy + dy * (cfg.DURATION / 1000),
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: cfg.DURATION,
        ease: 'Quad.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  createCelebration() {
    // Confetti particles falling from top
    const cfg = PARTICLES.LEVELCOMPLETE_CONFETTI;

    for (let i = 0; i < cfg.COUNT; i++) {
      const x = Math.random() * GAME.WIDTH;
      const y = -20 - Math.random() * 200;
      const color = cfg.COLORS[Math.floor(Math.random() * cfg.COLORS.length)];
      const size = cfg.MIN_SIZE + Math.random() * (cfg.MAX_SIZE - cfg.MIN_SIZE);
      const duration = cfg.MIN_DURATION + Math.random() * (cfg.MAX_DURATION - cfg.MIN_DURATION);

      // Use rectangles for confetti look
      const confetti = (i % 2 === 0)
        ? this.add.circle(x, y, size, color)
        : this.add.rectangle(x, y, size * 2, size, color);
      confetti.setDepth(5);

      this.tweens.add({
        targets: confetti,
        y: GAME.HEIGHT + 20,
        x: x + (Math.random() - 0.5) * 200,
        angle: (Math.random() - 0.5) * 720,
        alpha: 0,
        duration: duration,
        delay: Math.random() * 1500,
        repeat: -1,
        onRepeat: () => {
          confetti.setPosition(Math.random() * GAME.WIDTH, -20);
          confetti.setAlpha(1);
          confetti.setAngle(0);
        },
        ease: 'Sine.easeIn',
      });
    }
  }

  nextLevel() {
    eventBus.emit(Events.MUSIC_STOP);
    const nextLevelIndex = gameState.currentLevel + 1;
    gameState.setLevel(nextLevelIndex);
    eventBus.emit(Events.LEVEL_SELECT, { level: nextLevelIndex });
    eventBus.emit(Events.GAME_START);

    this.cameras.main.fadeOut(TRANSITION.FADE_DURATION, 0, 0, 0, (camera, progress) => {
      if (progress === 1) {
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
      }
    });
  }

  restartGame() {
    eventBus.emit(Events.MUSIC_STOP);
    gameState.setLevel(0);
    eventBus.emit(Events.GAME_RESTART);

    this.cameras.main.fadeOut(TRANSITION.FADE_DURATION, 0, 0, 0, (camera, progress) => {
      if (progress === 1) {
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
      }
    });
  }

}

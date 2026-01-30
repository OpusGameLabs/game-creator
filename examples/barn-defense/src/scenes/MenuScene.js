// =============================================================================
// Barn Defense - MenuScene
// Main menu with title, instructions, and level select buttons.
// =============================================================================

import Phaser from 'phaser';
import { GAME, COLORS, UI, TRANSITION, PARTICLES, EFFECTS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { LEVELS } from '../systems/MapSystem.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    // Background
    this.cameras.main.setBackgroundColor(COLORS.MENU_BG);

    // Gradient background (dark green top to darker bottom)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0e2a08, 0x0e2a08, 0x2d5a1a, 0x2d5a1a, 1);
    bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // First click inits audio (browser autoplay policy)
    this.input.once('pointerdown', () => {
      eventBus.emit(Events.AUDIO_INIT);
      // Small delay then start menu music
      this.time.delayedCall(200, () => {
        eventBus.emit(Events.MUSIC_MENU);
      });
    });

    // Floating firefly particles in background
    this.createFireflies();

    // Title with bounce-in animation
    const title = this.add.text(cx, 80, 'BARN DEFENSE', {
      fontSize: UI.FONT_SIZE_TITLE,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
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

    // Title bounce-in from scale 0
    title.setScale(EFFECTS.TITLE_BOUNCE.FROM_SCALE);
    this.tweens.add({
      targets: title,
      scaleX: EFFECTS.TITLE_BOUNCE.TO_SCALE,
      scaleY: EFFECTS.TITLE_BOUNCE.TO_SCALE,
      duration: EFFECTS.TITLE_BOUNCE.DURATION,
      ease: EFFECTS.TITLE_BOUNCE.EASE,
    });

    // Subtitle
    const subtitle = this.add.text(cx, 130, 'Defend your barn from the farm animals!', {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_GOLD_TEXT,
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5);
    subtitle.setAlpha(0);
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 400,
      delay: 300,
    });

    // Decorative barn with glow pulse
    this.drawDecorativeBarn(cx, 200);

    // Level select label
    this.add.text(cx, 280, 'SELECT LEVEL', {
      fontSize: UI.FONT_SIZE_LARGE,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: EFFECTS.TEXT_STROKE_THICKNESS,
    }).setOrigin(0.5);

    // Level buttons
    const buttonY = 340;
    const buttonSpacing = 80;
    const startX = cx - (LEVELS.length - 1) * buttonSpacing / 2;

    for (let i = 0; i < LEVELS.length; i++) {
      const bx = startX + i * buttonSpacing;
      const unlocked = i < gameState.levelsUnlocked;

      const btn = this.add.rectangle(
        bx, buttonY, 64, 64,
        unlocked ? COLORS.BUTTON : COLORS.UI_BUTTON_DISABLED,
        0.9
      );
      btn.setStrokeStyle(2, unlocked ? COLORS.BUTTON_HOVER : 0x666666);

      // Level number
      const levelNum = this.add.text(bx, buttonY - 8, String(i + 1), {
        fontSize: UI.FONT_SIZE_LARGE,
        fontFamily: UI.FONT_FAMILY,
        color: unlocked ? COLORS.UI_TEXT : '#666666',
        fontStyle: 'bold',
        stroke: EFFECTS.TEXT_STROKE_COLOR,
        strokeThickness: 1,
      }).setOrigin(0.5);

      // Level name (small)
      const levelName = this.add.text(bx, buttonY + 14, LEVELS[i].name.split(' ').slice(1).join(' '), {
        fontSize: '9px',
        fontFamily: UI.FONT_FAMILY,
        color: unlocked ? COLORS.UI_GOLD_TEXT : '#555555',
      }).setOrigin(0.5);

      if (unlocked) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => {
          btn.setFillStyle(COLORS.BUTTON_HOVER, 1);
          this.tweens.add({
            targets: [btn, levelNum, levelName],
            scaleX: EFFECTS.BUTTON_HOVER_SCALE,
            scaleY: EFFECTS.BUTTON_HOVER_SCALE,
            duration: EFFECTS.BUTTON_HOVER_DURATION,
            ease: 'Quad.easeOut',
          });
        });
        btn.on('pointerout', () => {
          btn.setFillStyle(COLORS.BUTTON, 0.9);
          this.tweens.add({
            targets: [btn, levelNum, levelName],
            scaleX: 1,
            scaleY: 1,
            duration: EFFECTS.BUTTON_HOVER_DURATION,
            ease: 'Quad.easeOut',
          });
        });
        btn.on('pointerdown', () => {
          this.startLevel(i);
        });
      }
    }

    // Instructions with text shadows
    this.add.text(cx, 440, 'Click towers to place them on grass tiles', {
      fontSize: UI.FONT_SIZE_SMALL,
      fontFamily: UI.FONT_FAMILY,
      color: '#aaaaaa',
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5);

    this.add.text(cx, 460, 'Stop animals from reaching the barn!', {
      fontSize: UI.FONT_SIZE_SMALL,
      fontFamily: UI.FONT_FAMILY,
      color: '#aaaaaa',
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5);

    // Version info
    this.add.text(GAME.WIDTH - 10, GAME.HEIGHT - 10, 'v1.0', {
      fontSize: '10px',
      fontFamily: UI.FONT_FAMILY,
      color: '#555555',
    }).setOrigin(1);

    // Fade in
    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION);
  }

  createFireflies() {
    const cfg = PARTICLES.MENU_FIREFLIES;

    for (let i = 0; i < cfg.COUNT; i++) {
      const x = Math.random() * GAME.WIDTH;
      const y = Math.random() * GAME.HEIGHT;
      const size = cfg.MIN_SIZE + Math.random() * (cfg.MAX_SIZE - cfg.MIN_SIZE);

      const firefly = this.add.circle(x, y, size, cfg.COLOR, 0.4 + Math.random() * 0.4);
      firefly.setDepth(1);

      // Gentle floating animation
      const duration = cfg.MIN_DURATION + Math.random() * (cfg.MAX_DURATION - cfg.MIN_DURATION);
      const driftX = (Math.random() - 0.5) * cfg.DRIFT * 2;
      const driftY = (Math.random() - 0.5) * cfg.DRIFT * 2;

      this.tweens.add({
        targets: firefly,
        x: x + driftX,
        y: y + driftY,
        alpha: { from: 0.2, to: 0.8 },
        duration: duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 2000,
      });
    }
  }

  drawDecorativeBarn(cx, cy) {
    // Glow behind barn
    const glow = this.add.circle(cx, cy, 50, 0xffee88, 0.1);
    glow.setDepth(2);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.05, to: 0.18 },
      scaleX: { from: 1, to: 1.15 },
      scaleY: { from: 1, to: 1.15 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const g = this.add.graphics();
    g.setDepth(3);
    const w = 60;
    const h = 50;

    // Barn body
    g.fillStyle(COLORS.BARN_COLOR, 1);
    g.fillRect(cx - w / 2, cy - h / 4, w, h * 0.75);

    // Roof
    g.fillStyle(COLORS.BARN_ROOF, 1);
    g.fillTriangle(
      cx - w / 2 - 5, cy - h / 4,
      cx, cy - h / 2 - 10,
      cx + w / 2 + 5, cy - h / 4
    );

    // Door
    g.fillStyle(0x663322, 1);
    g.fillRect(cx - 8, cy + h * 0.15, 16, h * 0.35);

    // Windows
    g.fillStyle(0xffee88, 0.7);
    g.fillRect(cx - w / 2 + 6, cy - h / 8, 10, 10);
    g.fillRect(cx + w / 2 - 16, cy - h / 8, 10, 10);
  }

  startLevel(levelIndex) {
    eventBus.emit(Events.MUSIC_STOP);
    gameState.setLevel(levelIndex);
    eventBus.emit(Events.LEVEL_SELECT, { level: levelIndex });
    eventBus.emit(Events.GAME_START);

    this.cameras.main.fadeOut(TRANSITION.FADE_DURATION, 0, 0, 0, (camera, progress) => {
      if (progress === 1) {
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
      }
    });
  }
}

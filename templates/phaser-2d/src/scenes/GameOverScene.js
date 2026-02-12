import Phaser from 'phaser';
import { GAME, COLORS, UI, TRANSITION } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    const w = GAME.WIDTH;
    const h = GAME.HEIGHT;
    const cx = w / 2;

    this._transitioning = false;

    // --- Gradient background ---
    this.drawGradient(w, h, COLORS.BG_TOP, COLORS.BG_BOTTOM);

    // --- "GAME OVER" title ---
    const titleSize = Math.round(h * UI.TITLE_RATIO);
    const title = this.add.text(cx, h * 0.22, 'GAME OVER', {
      fontSize: titleSize + 'px',
      fontFamily: UI.FONT,
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 3, color: 'rgba(0,0,0,0.5)', blur: 8, fill: true },
    }).setOrigin(0.5);


    // --- Score panel ---
    const panelW = w * 0.6;
    const panelH = h * 0.2;
    const panelY = h * 0.4;

    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.35);
    panel.fillRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);
    panel.lineStyle(2, 0x6c63ff, 0.6);
    panel.strokeRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);

    // Score label
    const labelSize = Math.round(h * UI.SMALL_RATIO);
    const scoreLabel = this.add.text(cx, panelY - panelH * 0.22, 'SCORE', {
      fontSize: labelSize + 'px',
      fontFamily: UI.FONT,
      color: COLORS.MUTED_TEXT,
      letterSpacing: 4,
    }).setOrigin(0.5);


    // Score value (large, gold)
    const scoreSize = Math.round(h * UI.HEADING_RATIO * 1.2);
    const scoreText = this.add.text(cx, panelY + panelH * 0.05, `${gameState.score}`, {
      fontSize: scoreSize + 'px',
      fontFamily: UI.FONT,
      color: COLORS.SCORE_GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);


    // Scale-in animation for score
    scoreText.setScale(0);
    this.tweens.add({
      targets: scoreText,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      delay: 200,
      ease: 'Back.easeOut',
    });

    // Best score
    const bestSize = Math.round(h * UI.SMALL_RATIO);
    const best = this.add.text(cx, panelY + panelH * 0.35, `Best: ${gameState.bestScore}`, {
      fontSize: bestSize + 'px',
      fontFamily: UI.FONT,
      color: COLORS.MUTED_TEXT,
    }).setOrigin(0.5);


    // --- Play Again button ---
    this.createButton(cx, h * 0.65, 'PLAY AGAIN', () => this.restartGame());

    // --- Keyboard shortcut ---
    this.input.keyboard.once('keydown-SPACE', () => this.restartGame());

    // --- Fade in ---
    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);
  }

  restartGame() {
    if (this._transitioning) return;
    this._transitioning = true;

    eventBus.emit(Events.GAME_RESTART);
    this.cameras.main.fadeOut(TRANSITION.FADE_DURATION, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  // --- Helpers (same as MenuScene) ---

  drawGradient(w, h, topColor, bottomColor) {
    const bg = this.add.graphics();
    const top = Phaser.Display.Color.IntegerToColor(topColor);
    const bot = Phaser.Display.Color.IntegerToColor(bottomColor);
    const steps = 64;
    const bandH = Math.ceil(h / steps);

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(top.red + (bot.red - top.red) * t);
      const g = Math.round(top.green + (bot.green - top.green) * t);
      const b = Math.round(top.blue + (bot.blue - top.blue) * t);
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      bg.fillRect(0, i * bandH, w, bandH + 1);
    }
  }

  createButton(x, y, label, callback) {
    const btnW = Math.max(GAME.WIDTH * UI.BTN_W_RATIO, 160);
    const btnH = Math.max(GAME.HEIGHT * UI.BTN_H_RATIO, UI.MIN_TOUCH);
    const radius = UI.BTN_RADIUS;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    this.fillBtn(bg, btnW, btnH, radius, COLORS.BTN_PRIMARY);
    container.add(bg);

    const fontSize = Math.round(GAME.HEIGHT * UI.BODY_RATIO);
    const text = this.add.text(0, 0, label, {
      fontSize: fontSize + 'px',
      fontFamily: UI.FONT,
      color: COLORS.BTN_TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add(text);

    container.setSize(btnW, btnH);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      this.fillBtn(bg, btnW, btnH, radius, COLORS.BTN_PRIMARY_HOVER);
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 80 });
    });

    container.on('pointerout', () => {
      this.fillBtn(bg, btnW, btnH, radius, COLORS.BTN_PRIMARY);
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 });
    });

    container.on('pointerdown', () => {
      this.fillBtn(bg, btnW, btnH, radius, COLORS.BTN_PRIMARY_PRESS);
      container.setScale(0.95);
    });

    container.on('pointerup', () => {
      container.setScale(1);
      callback();
    });

    return container;
  }

  fillBtn(gfx, w, h, radius, color) {
    gfx.clear();
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  }
}

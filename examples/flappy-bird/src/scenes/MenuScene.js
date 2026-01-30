import Phaser from 'phaser';
import { GAME, BIRD, SKY, GROUND, COLORS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { Background } from '../systems/Background.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.audioInitialized = false;
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    // Background with sky gradient, clouds, ground
    this.background = new Background(this);

    // Title
    this.add.text(cx, cy - 120, 'FLAPPY', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(30);

    this.add.text(cx, cy - 70, 'BIRD', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#f5d742',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(30);

    // Draw a preview bird
    this.drawPreviewBird(cx, cy + 10);

    // Instruction
    const prompt = this.add.text(cx, cy + 80, 'TAP or SPACE to Start', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);

    // Blink
    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Best score display
    const bestScore = window.__GAME_STATE__?.bestScore || 0;
    if (bestScore > 0) {
      this.add.text(cx, cy + 130, `Best: ${bestScore}`, {
        fontSize: '20px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(30);
    }

    // Input: first tap inits audio, second tap starts game
    this.input.keyboard.on('keydown-SPACE', () => this.handleTap());
    this.input.on('pointerdown', () => this.handleTap());
  }

  drawPreviewBird(x, y) {
    const gfx = this.add.graphics();
    gfx.setDepth(30);
    gfx.setPosition(x, y);

    // Body
    gfx.fillStyle(BIRD.BODY_COLOR, 1);
    gfx.fillEllipse(0, 0, BIRD.WIDTH * 1.5, BIRD.HEIGHT * 1.5);
    gfx.fillStyle(BIRD.BODY_LIGHT, 1);
    gfx.fillEllipse(2, 4, BIRD.WIDTH, BIRD.HEIGHT * 0.7);
    gfx.fillStyle(BIRD.WING_COLOR, 1);
    gfx.fillEllipse(-6, -1, 22, 14);
    gfx.fillStyle(BIRD.EYE_COLOR, 1);
    gfx.fillCircle(12, -6, 7);
    gfx.fillStyle(BIRD.PUPIL_COLOR, 1);
    gfx.fillCircle(14, -6, 3.5);
    gfx.fillStyle(BIRD.BEAK_COLOR, 1);
    gfx.fillTriangle(20, 0, 32, 4, 20, 8);

    // Bob animation
    this.tweens.add({
      targets: gfx,
      y: y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  handleTap() {
    if (!this.audioInitialized) {
      this.audioInitialized = true;
      eventBus.emit(Events.AUDIO_INIT);
      eventBus.emit(Events.MUSIC_MENU);
      return;
    }

    eventBus.emit(Events.MUSIC_STOP);
    eventBus.emit(Events.GAME_START);
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }

  update(time, delta) {
    if (this.background) {
      this.background.update(delta);
    }
  }
}

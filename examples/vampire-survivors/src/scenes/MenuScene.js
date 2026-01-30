import Phaser from 'phaser';
import { GAME, COLORS, PLAYER } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.audioInitialized = false;
  }

  create() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    this.cameras.main.setBackgroundColor(COLORS.MENU_BG);

    // Floating particles background
    for (let i = 0; i < 30; i++) {
      const px = Math.random() * GAME.WIDTH;
      const py = Math.random() * GAME.HEIGHT;
      const dot = this.add.circle(px, py, 1 + Math.random() * 2, 0x6644cc, 0.3 + Math.random() * 0.4);
      this.tweens.add({
        targets: dot,
        y: py - 20 - Math.random() * 30,
        alpha: 0,
        duration: 2000 + Math.random() * 3000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }

    // Title
    this.add.text(cx, cy - 120, 'VAMPIRE', {
      fontSize: '52px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 60, 'SURVIVORS', {
      fontSize: '40px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 5,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, cy + 10, 'Survive the night. Slay the horde.', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaacc',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Controls
    this.add.text(cx, cy + 60, 'WASD / Arrow Keys to move', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#8888aa',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 82, 'Weapons attack automatically!', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#8888aa',
    }).setOrigin(0.5);

    // Start prompt
    const prompt = this.add.text(cx, cy + 140, 'TAP or SPACE to Start', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Best stats
    if (gameState.bestScore > 0) {
      this.add.text(cx, cy + 190, `Best: ${gameState.bestScore} kills | ${formatTime(gameState.bestTime)}`, {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#aaaacc',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
    }

    // Input
    this.input.keyboard.on('keydown-SPACE', () => this.handleTap());
    this.input.on('pointerdown', () => this.handleTap());
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
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

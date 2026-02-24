import Phaser from 'phaser';
import { GAME, COLORS, DPR } from './Constants.js';
import { BootScene } from '../scenes/BootScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';

export const GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.BG_DARK,
  roundPixels: true,
  antialias: true,
  render: {
    preserveDrawingBuffer: true,  // Needed for iterate-client screenshots
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / DPR,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GAME.GRAVITY }, // 0 — bits fall with custom velocity
      debug: false,
    },
  },
  scene: [BootScene, GameScene, GameOverScene],
};

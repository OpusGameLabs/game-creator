import Phaser from 'phaser';
import { GAME, COLORS } from './Constants.js';
import { BootScene } from '../scenes/BootScene.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { UIScene } from '../scenes/UIScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';

export const GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.SKY,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GAME.GRAVITY },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, GameOverScene],
};

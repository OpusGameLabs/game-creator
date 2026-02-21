// =============================================================================
// Barn Defense - GameConfig
// Phaser configuration. Registers all scenes. No physics gravity needed.
// =============================================================================

import Phaser from 'phaser';
import { GAME, COLORS } from './Constants.js';
import { BootScene } from '../scenes/BootScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { UIScene } from '../scenes/UIScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';
import { LevelCompleteScene } from '../scenes/LevelCompleteScene.js';

export const GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  parent: 'game-container',
  backgroundColor: 0x1a3a0e,
  scene: [BootScene, GameScene, UIScene, GameOverScene, LevelCompleteScene],
};

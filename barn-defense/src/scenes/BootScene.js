// =============================================================================
// Barn Defense - BootScene
// Boots the game, generates pixel art textures programmatically, then
// transitions to menu.
// =============================================================================

import Phaser from 'phaser';
import { renderPixelArt, renderSpriteSheet } from '../core/PixelRenderer.js';
import { ENEMY_SPRITES } from '../sprites/enemies.js';
import { TOWER_SPRITES } from '../sprites/towers.js';
import { PROJECTILE_SPRITES } from '../sprites/projectiles.js';
import { TILE_SPRITES, DECORATION_SPRITES } from '../sprites/tiles.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // --- Register enemy spritesheets ---
    for (const [key, data] of Object.entries(ENEMY_SPRITES)) {
      renderSpriteSheet(this, data.frames, data.palette, `enemy-${key}`, data.scale);
    }

    // --- Register tower textures ---
    for (const [key, data] of Object.entries(TOWER_SPRITES)) {
      renderPixelArt(this, data.pixels, data.palette, `tower-${key}`, data.scale);
    }

    // --- Register projectile textures ---
    for (const [key, data] of Object.entries(PROJECTILE_SPRITES)) {
      renderPixelArt(this, data.pixels, data.palette, `proj-${key}`, data.scale);
    }

    // --- Register tile textures (scale 2.5 for 40px tiles) ---
    for (const [key, data] of Object.entries(TILE_SPRITES)) {
      renderPixelArt(this, data.pixels, data.palette, `tile-${key}`, data.scale);
    }

    // --- Register decoration textures ---
    for (const [key, data] of Object.entries(DECORATION_SPRITES)) {
      renderPixelArt(this, data.pixels, data.palette, `deco-${key}`, data.scale);
    }

    // --- Create walk animations for all enemies ---
    for (const [key, data] of Object.entries(ENEMY_SPRITES)) {
      const texKey = `enemy-${key}`;
      if (!this.anims.exists(`${texKey}-walk`)) {
        const animFrames = [];
        for (let i = 0; i < data.frames.length; i++) {
          animFrames.push({ key: texKey, frame: i });
        }
        this.anims.create({
          key: `${texKey}-walk`,
          frames: animFrames,
          frameRate: data.animRate,
          repeat: -1,
        });
      }
    }

    // Transition to menu
    this.scene.start('MenuScene');
  }
}

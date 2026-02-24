import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.spritesheet('nick-land', 'assets/characters/nick-land/nick-land-expressions.png', {
      frameWidth: 200,
      frameHeight: 300,
    });
  }

  create() {
    this.scene.start('GameScene');
  }
}

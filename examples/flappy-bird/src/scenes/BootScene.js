import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // No external assets to load - using procedural graphics
    this.scene.start('MenuScene');
  }
}

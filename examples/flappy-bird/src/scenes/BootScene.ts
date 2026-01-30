import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    // No external assets to load - using procedural graphics
    this.scene.start('MenuScene');
  }
}

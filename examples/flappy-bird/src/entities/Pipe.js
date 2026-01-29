import Phaser from 'phaser';
import { PIPE_CONFIG, GAME_CONFIG, GROUND_CONFIG, COLORS } from '../core/Constants.js';

export default class Pipe extends Phaser.GameObjects.Container {
  constructor(scene, x, gapSize, speed) {
    super(scene, x, 0);

    this.scored = false;

    const gap = gapSize || PIPE_CONFIG.gapSize;
    const pipeSpeed = speed || PIPE_CONFIG.speed;

    const playableHeight = GAME_CONFIG.height - GROUND_CONFIG.height;
    const gapY = Phaser.Math.Between(
      PIPE_CONFIG.minTopHeight + gap / 2,
      playableHeight - PIPE_CONFIG.minTopHeight - gap / 2
    );

    const topPipeHeight = gapY - gap / 2;
    const bottomPipeY = gapY + gap / 2;
    const bottomPipeHeight = playableHeight - bottomPipeY;

    // Top pipe
    this.topPipe = this.createPipeGraphics(topPipeHeight, true);
    this.topPipe.setPosition(0, topPipeHeight / 2);
    this.add(this.topPipe);

    // Bottom pipe
    this.bottomPipe = this.createPipeGraphics(bottomPipeHeight, false);
    this.bottomPipe.setPosition(0, bottomPipeY + bottomPipeHeight / 2);
    this.add(this.bottomPipe);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.allowGravity = false;
    this.body.setVelocityX(-pipeSpeed);
    this.body.setImmovable(true);

    // Physics bodies for individual pipes (for collision)
    this.topZone = scene.add.zone(x, topPipeHeight / 2, PIPE_CONFIG.width, topPipeHeight);
    scene.physics.add.existing(this.topZone, true);

    this.bottomZone = scene.add.zone(x, bottomPipeY + bottomPipeHeight / 2, PIPE_CONFIG.width, bottomPipeHeight);
    scene.physics.add.existing(this.bottomZone, true);

    this.scoreZone = scene.add.zone(x + PIPE_CONFIG.width / 2, gapY, 4, gap);
    scene.physics.add.existing(this.scoreZone, true);
  }

  createPipeGraphics(height, isTop) {
    const gfx = this.scene.add.graphics();
    const w = PIPE_CONFIG.width;
    const capH = PIPE_CONFIG.capHeight;
    const capExtra = PIPE_CONFIG.capExtraWidth;

    // Pipe body
    gfx.fillStyle(COLORS.pipe, 1);
    gfx.fillRect(-w / 2, -height / 2, w, height);

    // Pipe cap
    gfx.fillStyle(COLORS.pipeCap, 1);
    if (isTop) {
      gfx.fillRect(-w / 2 - capExtra / 2, height / 2 - capH, w + capExtra, capH);
    } else {
      gfx.fillRect(-w / 2 - capExtra / 2, -height / 2, w + capExtra, capH);
    }

    // Highlight
    gfx.fillStyle(COLORS.pipeHighlight, 0.4);
    gfx.fillRect(-w / 2 + 4, -height / 2, 8, height);

    return gfx;
  }

  update() {
    // Move collision zones along with the container
    this.topZone.x = this.x;
    this.bottomZone.x = this.x;
    this.scoreZone.x = this.x + PIPE_CONFIG.width / 2;
  }

  isOffScreen() {
    return this.x < -PIPE_CONFIG.width;
  }

  destroy() {
    this.topZone.destroy();
    this.bottomZone.destroy();
    this.scoreZone.destroy();
    super.destroy();
  }
}

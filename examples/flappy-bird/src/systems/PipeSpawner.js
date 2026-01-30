import Phaser from 'phaser';
import { PIPE, GAME, GROUND } from '../core/Constants.js';
import { Pipe } from '../entities/Pipe.js';

export class PipeSpawner {
  constructor(scene) {
    this.scene = scene;
    this.pipes = [];
    this.timer = null;
  }

  start() {
    this.timer = this.scene.time.addEvent({
      delay: PIPE.SPAWN_INTERVAL,
      callback: this.spawnPipe,
      callbackScope: this,
      loop: true,
    });
  }

  spawnPipe() {
    const playableHeight = GROUND.Y - PIPE.GAP;
    const minCenter = PIPE.MIN_TOP_HEIGHT + PIPE.GAP / 2;
    const maxCenter = GROUND.Y - PIPE.MIN_TOP_HEIGHT - PIPE.GAP / 2;
    const gapCenterY = Phaser.Math.Between(minCenter, maxCenter);

    const pipe = new Pipe(this.scene, GAME.WIDTH + PIPE.WIDTH, gapCenterY);
    this.pipes.push(pipe);
  }

  update() {
    // Remove off-screen pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      if (this.pipes[i].isOffScreen()) {
        this.pipes[i].destroy();
        this.pipes.splice(i, 1);
      }
    }
  }

  stop() {
    if (this.timer) {
      this.timer.remove();
      this.timer = null;
    }
    // Stop all pipes
    this.pipes.forEach(pipe => {
      pipe.top.body.setVelocityX(0);
      pipe.bottom.body.setVelocityX(0);
      pipe.scoreZone.body.setVelocityX(0);
    });
  }

  destroy() {
    this.stop();
    this.pipes.forEach(pipe => pipe.destroy());
    this.pipes = [];
  }

  getAllTopPipes() {
    return this.pipes.map(p => p.top);
  }

  getAllBottomPipes() {
    return this.pipes.map(p => p.bottom);
  }

  getScoreZones() {
    return this.pipes.filter(p => !p.scored).map(p => p);
  }
}

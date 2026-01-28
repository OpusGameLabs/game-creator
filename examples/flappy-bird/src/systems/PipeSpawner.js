import { PIPE_CONFIG, GAME_CONFIG } from '../core/Constants.js';
import Pipe from '../entities/Pipe.js';

export default class PipeSpawner {
  constructor(scene) {
    this.scene = scene;
    this.pipes = [];
    this.timer = null;
  }

  start() {
    this.timer = this.scene.time.addEvent({
      delay: PIPE_CONFIG.spawnInterval,
      callback: this.spawnPipe,
      callbackScope: this,
      loop: true,
    });

    // Spawn first pipe sooner
    this.scene.time.delayedCall(800, () => this.spawnPipe());
  }

  spawnPipe() {
    const pipe = new Pipe(this.scene, GAME_CONFIG.width + PIPE_CONFIG.width);
    this.pipes.push(pipe);
  }

  update() {
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.update();

      if (pipe.isOffScreen()) {
        pipe.destroy();
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
      pipe.body.setVelocityX(0);
    });
  }

  getCollisionZones() {
    const tops = [];
    const bottoms = [];
    const scores = [];
    this.pipes.forEach(pipe => {
      tops.push(pipe.topZone);
      bottoms.push(pipe.bottomZone);
      scores.push(pipe.scoreZone);
    });
    return { tops, bottoms, scores };
  }

  destroy() {
    this.stop();
    this.pipes.forEach(pipe => pipe.destroy());
    this.pipes = [];
  }
}

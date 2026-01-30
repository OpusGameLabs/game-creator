import { PIPE_CONFIG, GAME_CONFIG } from '../core/Constants';
import { gameState } from '../core/GameState';
import Pipe from '../entities/Pipe';

export default class PipeSpawner {
  private scene: Phaser.Scene;
  pipes: Pipe[];
  private timer: Phaser.Time.TimerEvent | null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.pipes = [];
    this.timer = null;
  }

  start(): void {
    this.scheduleNext();

    // Spawn first pipe sooner
    this.scene.time.delayedCall(800, () => this.spawnPipe());
  }

  private scheduleNext(): void {
    const interval = gameState.getCurrentInterval();
    this.timer = this.scene.time.delayedCall(interval, () => {
      this.spawnPipe();
      if (!gameState.gameOver) {
        this.scheduleNext();
      }
    });
  }

  private spawnPipe(): void {
    const gap = gameState.getCurrentGap();
    const speed = gameState.getCurrentSpeed();
    const pipe = new Pipe(this.scene, GAME_CONFIG.width + PIPE_CONFIG.width, gap, speed);
    this.pipes.push(pipe);
  }

  update(): void {
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.update();

      if (pipe.isOffScreen()) {
        pipe.destroy();
        this.pipes.splice(i, 1);
      }
    }
  }

  stop(): void {
    if (this.timer) {
      this.timer.remove();
      this.timer = null;
    }
    // Stop all pipes
    this.pipes.forEach(pipe => {
      pipe.body.setVelocityX(0);
    });
  }

  getCollisionZones(): { tops: Phaser.GameObjects.Zone[]; bottoms: Phaser.GameObjects.Zone[]; scores: Phaser.GameObjects.Zone[] } {
    const tops: Phaser.GameObjects.Zone[] = [];
    const bottoms: Phaser.GameObjects.Zone[] = [];
    const scores: Phaser.GameObjects.Zone[] = [];
    this.pipes.forEach(pipe => {
      tops.push(pipe.topZone);
      bottoms.push(pipe.bottomZone);
      scores.push(pipe.scoreZone);
    });
    return { tops, bottoms, scores };
  }

  destroy(): void {
    this.stop();
    this.pipes.forEach(pipe => pipe.destroy());
    this.pipes = [];
  }
}

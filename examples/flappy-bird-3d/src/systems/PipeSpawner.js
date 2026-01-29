import { PIPE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { Pipe } from '../entities/Pipe.js';

export class PipeSpawner {
  constructor(scene) {
    this.scene = scene;
    this.pipes = [];
    this.distanceTraveled = 0;
  }

  spawnInitial() {
    for (let i = 0; i < PIPE.INITIAL_COUNT; i++) {
      const x = PIPE.SPACING * 2 + i * PIPE.SPACING;
      this.spawnAt(x);
    }
    this.distanceTraveled = 0;
  }

  spawnAt(x) {
    const gapCenterY = PIPE.MIN_CENTER_Y + Math.random() * (PIPE.MAX_CENTER_Y - PIPE.MIN_CENTER_Y);
    const pipe = new Pipe(this.scene, x, gapCenterY);
    this.pipes.push(pipe);
  }

  update(delta) {
    this.distanceTraveled += PIPE.SPEED * delta;

    // Move pipes and check for despawn
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.update(delta);

      // Score when bird passes pipe (bird is at x=0)
      if (!pipe.scored && pipe.x < 0) {
        pipe.scored = true;
        gameState.addScore(1);
        eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });
        eventBus.emit(Events.PIPE_PASSED, { x: pipe.x, y: pipe.gapCenterY });
      }

      // Remove pipes that scrolled off screen
      if (pipe.x < PIPE.DESPAWN_DISTANCE) {
        pipe.destroy();
        this.pipes.splice(i, 1);
      }
    }

    // Spawn new pipes: keep rightmost pipe within SPAWN_DISTANCE
    const rightmost = this.pipes.length > 0
      ? Math.max(...this.pipes.map(p => p.x))
      : 0;
    if (rightmost < PIPE.SPAWN_DISTANCE) {
      this.spawnAt(rightmost + PIPE.SPACING);
    }
  }

  checkCollision(birdBox) {
    for (const pipe of this.pipes) {
      const boxes = pipe.getBoundingBoxes();
      if (this.aabbOverlap(birdBox, boxes.top) || this.aabbOverlap(birdBox, boxes.bottom)) {
        return true;
      }
    }
    return false;
  }

  aabbOverlap(a, b) {
    return (
      a.minX < b.maxX &&
      a.maxX > b.minX &&
      a.minY < b.maxY &&
      a.maxY > b.minY
    );
  }

  destroyAll() {
    for (const pipe of this.pipes) {
      pipe.destroy();
    }
    this.pipes = [];
    this.nextSpawnX = PIPE.SPACING * 2;
  }
}

import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class InputSystem {
  constructor() {
    this.keys = {};
    this.flapQueued = false;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.queueFlap();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Click/touch to flap
    window.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      this.queueFlap();
    });

    window.addEventListener('touchstart', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      this.queueFlap();
    });
  }

  queueFlap() {
    if (gameState.started && !gameState.gameOver) {
      this.flapQueued = true;
    }
  }

  consumeFlap() {
    if (this.flapQueued) {
      this.flapQueued = false;
      return true;
    }
    return false;
  }

  isDown(code) {
    return !!this.keys[code];
  }
}

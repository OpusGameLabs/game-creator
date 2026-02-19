import { initStrudel, hush } from '@strudel/web';
import { gameState } from '../core/GameState.js';

class AudioManager {
  constructor() {
    this.initialized = false;
    this.currentMusic = null;
  }

  init() {
    if (this.initialized) return;
    try {
      initStrudel();
      this.initialized = true;
    } catch (e) {
      console.warn('[Audio] Strudel init failed:', e);
    }
  }

  playMusic(patternFn) {
    if (gameState.isMuted || !this.initialized) return;
    this.stopMusic();
    // hush() needs a scheduler tick to process before new pattern starts
    setTimeout(() => {
      try {
        this.currentMusic = patternFn();
      } catch (e) {
        console.warn('[Audio] BGM error:', e);
      }
    }, 100);
  }

  stopMusic() {
    if (!this.initialized) return;
    try { hush(); } catch (e) { /* noop */ }
    this.currentMusic = null;
  }
}

export const audioManager = new AudioManager();

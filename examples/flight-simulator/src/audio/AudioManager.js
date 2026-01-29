import { initStrudel, hush } from '@strudel/web';

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
    if (!this.initialized) return;
    this.stopMusic();
    // Brief delay to let hush() clear the scheduler before starting new pattern
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
    hush();
    this.currentMusic = null;
  }

  playSfx(patternFn) {
    if (!this.initialized) return;
    patternFn();
  }
}

export const audioManager = new AudioManager();

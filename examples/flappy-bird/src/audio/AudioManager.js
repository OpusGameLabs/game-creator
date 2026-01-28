import { initStrudel, hush } from '@strudel/web';

class AudioManager {
  constructor() {
    this.initialized = false;
    this.muted = false;
    this.currentBGM = null;
  }

  init() {
    if (this.initialized) return;
    try {
      initStrudel();
      this.initialized = true;
      console.log('[Audio] Strudel initialized');
    } catch (e) {
      console.warn('[Audio] Strudel init failed:', e);
    }
  }

  playBGM(patternFn) {
    if (!this.initialized || this.muted) return;
    // Stop any existing patterns first
    try { hush(); } catch (e) { /* noop */ }
    this.currentBGM = null;
    // Give Strudel's scheduler a tick to process the hush
    setTimeout(() => {
      try {
        this.currentBGM = patternFn();
        console.log('[Audio] BGM started');
      } catch (e) {
        console.warn('[Audio] BGM error:', e);
      }
    }, 100);
  }

  stopBGM() {
    if (!this.initialized) return;
    try { hush(); } catch (e) { /* noop */ }
    this.currentBGM = null;
  }

  playSFX(patternFn) {
    if (!this.initialized || this.muted) return;
    try {
      patternFn();
    } catch (e) {
      console.warn('[Audio] SFX error:', e);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBGM();
    }
    return this.muted;
  }
}

export const audioManager = new AudioManager();

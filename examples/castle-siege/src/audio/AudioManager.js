// =============================================================================
// AudioManager.js — Strudel BGM wrapper for Castle Siege Defense
// Handles init (must be from user gesture), play/stop music, mute state.
// SFX use Web Audio API separately (see sfx.js).
// =============================================================================

import { initStrudel, hush } from '@strudel/web';
import { gameState } from '../core/GameState.js';

class AudioManager {
  constructor() {
    this.initialized = false;
    this.currentMusic = null;
    this._pendingPatternFn = null;
  }

  /** Call from a user gesture (click/tap/keydown) to unlock audio */
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

  /**
   * Play a BGM pattern. Stops any current music first.
   * @param {Function} patternFn — returns a Strudel pattern via .play()
   */
  playMusic(patternFn) {
    if (!this.initialized || gameState.isMuted) return;
    this.stopMusic();
    // hush() needs a scheduler tick (~100ms) to process before new pattern starts
    setTimeout(() => {
      try {
        this.currentMusic = patternFn();
        this._pendingPatternFn = patternFn;
      } catch (e) {
        console.warn('[Audio] BGM error:', e);
      }
    }, 100);
  }

  /** Stop all Strudel patterns */
  stopMusic() {
    if (!this.initialized) return;
    try { hush(); } catch (e) { /* noop */ }
    this.currentMusic = null;
  }

  /** Toggle mute — stops music if muting, resumes if unmuting */
  toggleMute() {
    gameState.isMuted = !gameState.isMuted;
    if (gameState.isMuted) {
      this.stopMusic();
    } else if (this._pendingPatternFn) {
      // Resume the last pattern that was playing
      this.playMusic(this._pendingPatternFn);
    }
    // Persist preference
    try {
      localStorage.setItem('castle-siege-muted', gameState.isMuted ? '1' : '0');
    } catch (e) { /* noop — localStorage may be unavailable */ }
  }

  /** Restore mute preference from localStorage */
  restoreMutePreference() {
    try {
      const stored = localStorage.getItem('castle-siege-muted');
      if (stored === '1') {
        gameState.isMuted = true;
      }
    } catch (e) { /* noop */ }
  }
}

export const audioManager = new AudioManager();

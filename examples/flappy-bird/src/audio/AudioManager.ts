// @ts-ignore -- @strudel/web has no type declarations
import { initStrudel, hush } from '@strudel/web';

class AudioManager {
  private initialized: boolean;
  private muted: boolean;
  private currentBGM: any;
  private _initPromise: Promise<void> | null;

  constructor() {
    this.initialized = false;
    this.muted = false;
    this.currentBGM = null;
    this._initPromise = null;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      try {
        await initStrudel();
        this.initialized = true;
        console.log('[Audio] Strudel initialized');
      } catch (e) {
        console.warn('[Audio] Strudel init failed:', e);
      }
    })();
    return this._initPromise;
  }

  async playBGM(patternFn: () => any): Promise<void> {
    if (this.muted) return;
    // Wait for Strudel to finish initializing
    if (this._initPromise) await this._initPromise;
    if (!this.initialized) return;
    // Stop any existing patterns first
    try { hush(); } catch (_e) { /* noop */ }
    this.currentBGM = null;
    // Give Strudel's scheduler a tick to process the hush
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          this.currentBGM = patternFn();
          console.log('[Audio] BGM started');
        } catch (e) {
          console.warn('[Audio] BGM error:', e);
        }
        resolve();
      }, 100);
    });
  }

  stopBGM(): void {
    if (!this.initialized) return;
    try { hush(); } catch (_e) { /* noop */ }
    this.currentBGM = null;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBGM();
    }
    return this.muted;
  }
}

export const audioManager = new AudioManager();

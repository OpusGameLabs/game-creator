import { eventBus, Events } from '../core/EventBus.js';
import { audioManager } from './AudioManager.js';
import { menuTheme, gameplayBGM, gameOverTheme } from './music.js';
import { ringCollectSfx, crashSfx } from './sfx.js';

export function initAudioBridge() {
  // Initialize Strudel audio on first user interaction (browser autoplay policy)
  eventBus.on(Events.AUDIO_INIT, () => {
    audioManager.init();
  });

  // Music transitions (Strudel BGM)
  eventBus.on(Events.MUSIC_MENU, () => {
    audioManager.playMusic(menuTheme);
  });

  eventBus.on(Events.MUSIC_GAMEPLAY, () => {
    audioManager.playMusic(gameplayBGM);
  });

  eventBus.on(Events.MUSIC_GAMEOVER, () => {
    audioManager.playMusic(gameOverTheme);
  });

  eventBus.on(Events.MUSIC_STOP, () => {
    audioManager.stopMusic();
  });

  // SFX (Web Audio API — true one-shot, no looping)
  eventBus.on(Events.RING_COLLECTED, () => {
    ringCollectSfx();
  });

  eventBus.on(Events.PLAYER_DIED, () => {
    crashSfx();
  });
}

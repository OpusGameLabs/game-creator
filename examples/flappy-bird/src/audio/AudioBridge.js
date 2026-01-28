// Wires EventBus game events to AudioManager playback
import { eventBus, Events } from '../core/EventBus.js';
import { audioManager } from './AudioManager.js';
import { menuTheme, gameplayBGM, gameOverTheme } from './music.js';
import { flapSfx, scoreSfx, deathSfx, buttonClickSfx } from './sfx.js';

export function initAudioBridge() {
  // Init audio on first user interaction
  eventBus.on(Events.AUDIO_INIT, () => {
    audioManager.init();
  });

  // Music transitions
  eventBus.on(Events.MUSIC_MENU, () => {
    audioManager.playBGM(menuTheme);
  });

  eventBus.on(Events.MUSIC_GAMEPLAY, () => {
    audioManager.playBGM(gameplayBGM);
  });

  eventBus.on(Events.MUSIC_GAMEOVER, () => {
    audioManager.playBGM(gameOverTheme);
  });

  eventBus.on(Events.MUSIC_STOP, () => {
    audioManager.stopBGM();
  });

  // SFX wired to game events
  eventBus.on(Events.BIRD_FLAP, () => {
    audioManager.playSFX(flapSfx);
  });

  eventBus.on(Events.SCORE_CHANGED, () => {
    audioManager.playSFX(scoreSfx);
  });

  eventBus.on(Events.BIRD_DIED, () => {
    audioManager.playSFX(deathSfx);
  });
}

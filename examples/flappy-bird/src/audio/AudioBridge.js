import { eventBus, Events } from '../core/EventBus.js';
import { audioManager } from './AudioManager.js';
import { menuTheme, gameplayBGM, gameOverTheme } from './music.js';
import { flapSfx, scoreSfx, deathSfx, clickSfx } from './sfx.js';

export function initAudioBridge() {
  eventBus.on(Events.AUDIO_INIT, () => audioManager.init());

  // BGM transitions
  eventBus.on(Events.MUSIC_MENU, () => audioManager.playMusic(menuTheme));
  eventBus.on(Events.MUSIC_GAMEPLAY, () => audioManager.playMusic(gameplayBGM));
  eventBus.on(Events.MUSIC_GAMEOVER, () => audioManager.playMusic(gameOverTheme));
  eventBus.on(Events.MUSIC_STOP, () => audioManager.stopMusic());

  // SFX
  eventBus.on(Events.BIRD_FLAP, () => flapSfx());
  eventBus.on(Events.SCORE_CHANGED, () => scoreSfx());
  eventBus.on(Events.BIRD_DIED, () => deathSfx());
}

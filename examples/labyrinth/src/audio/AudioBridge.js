import { eventBus, Events } from '../core/EventBus.js';
import { audioManager } from './AudioManager.js';
import { gameplayBGM, gameOverTheme } from './music.js';
import { gemSfx, fallSfx, levelCompleteSfx, gameOverSfx } from './sfx.js';

export function initAudioBridge() {
  // Init Strudel from user gesture context (GAME_START fires from PLAY button click)
  eventBus.on(Events.AUDIO_INIT, () => audioManager.init());

  // BGM transitions
  eventBus.on(Events.MUSIC_GAMEPLAY, () => audioManager.playMusic(gameplayBGM));
  eventBus.on(Events.MUSIC_GAMEOVER, () => audioManager.playMusic(gameOverTheme));
  eventBus.on(Events.MUSIC_STOP, () => audioManager.stopMusic());

  // SFX hooks
  eventBus.on(Events.GEM_COLLECTED, () => gemSfx());
  eventBus.on(Events.BALL_FELL, () => fallSfx());
  eventBus.on(Events.LEVEL_COMPLETE, () => levelCompleteSfx());
  eventBus.on(Events.GAME_OVER, () => gameOverSfx());
}

// =============================================================================
// Barn Defense - AudioBridge
// Wires EventBus events to audio playback (BGM via Strudel, SFX via Web Audio).
// =============================================================================

import { eventBus, Events } from '../core/EventBus.js';
import { audioManager } from './AudioManager.js';
import { menuTheme, gameplayBGM, gameOverTheme, levelCompleteTheme } from './music.js';
import {
  towerFireSfx,
  enemyDeathSfx,
  cornEarnedSfx,
  barnHitSfx,
  waveStartSfx,
  waveCompleteSfx,
  towerPlaceSfx,
  buttonClickSfx,
  levelCompleteSfx,
  gameOverSfx,
} from './sfx.js';

export function initAudioBridge() {
  // Init Strudel on first user interaction (browser autoplay policy)
  eventBus.on(Events.AUDIO_INIT, () => audioManager.init());

  // BGM transitions
  eventBus.on(Events.MUSIC_MENU, () => audioManager.playMusic(menuTheme));
  eventBus.on(Events.MUSIC_GAMEPLAY, () => audioManager.playMusic(gameplayBGM));
  eventBus.on(Events.MUSIC_GAMEOVER, () => audioManager.playMusic(gameOverTheme));
  eventBus.on(Events.MUSIC_LEVELCOMPLETE, () => audioManager.playMusic(levelCompleteTheme));
  eventBus.on(Events.MUSIC_STOP, () => audioManager.stopMusic());

  // SFX (Web Audio API -- never Strudel)
  eventBus.on(Events.TOWER_FIRED, () => towerFireSfx());
  eventBus.on(Events.ENEMY_DIED, () => enemyDeathSfx());
  eventBus.on(Events.CORN_EARNED, () => cornEarnedSfx());
  eventBus.on(Events.BARN_HIT, () => barnHitSfx());
  eventBus.on(Events.WAVE_START, () => waveStartSfx());
  eventBus.on(Events.WAVE_COMPLETE, () => waveCompleteSfx());
  eventBus.on(Events.TOWER_PLACED, () => towerPlaceSfx());
  eventBus.on(Events.GAME_OVER, () => gameOverSfx());
  eventBus.on(Events.LEVEL_COMPLETE, () => levelCompleteSfx());
}

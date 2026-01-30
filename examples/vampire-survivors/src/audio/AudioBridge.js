import { eventBus, Events } from '../core/EventBus.js';
import { audioManager } from './AudioManager.js';
import { menuTheme, gameplayBGM, gameOverTheme } from './music.js';
import { whipSfx, projectileSfx, enemyDeathSfx, xpPickupSfx, playerHitSfx, levelUpSfx } from './sfx.js';

export function initAudioBridge() {
  eventBus.on(Events.AUDIO_INIT, () => audioManager.init());

  // BGM
  eventBus.on(Events.MUSIC_MENU, () => audioManager.playMusic(menuTheme));
  eventBus.on(Events.MUSIC_GAMEPLAY, () => audioManager.playMusic(gameplayBGM));
  eventBus.on(Events.MUSIC_GAMEOVER, () => audioManager.playMusic(gameOverTheme));
  eventBus.on(Events.MUSIC_STOP, () => audioManager.stopMusic());

  // SFX
  eventBus.on(Events.WEAPON_FIRE, ({ weapon }) => {
    if (weapon === 'WHIP') whipSfx();
    else projectileSfx();
  });
  eventBus.on(Events.ENEMY_KILLED, () => enemyDeathSfx());
  eventBus.on(Events.XP_GAINED, () => xpPickupSfx());
  eventBus.on(Events.PLAYER_DAMAGED, () => playerHitSfx());
  eventBus.on(Events.LEVEL_UP, () => levelUpSfx());
}

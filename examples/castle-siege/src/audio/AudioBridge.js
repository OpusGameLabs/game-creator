// =============================================================================
// AudioBridge.js — Wires EventBus events to audio playback
// BGM transitions use AudioManager (Strudel). SFX use Web Audio API directly.
// This is the glue layer — no game logic here.
// =============================================================================

import { eventBus, Events } from '../core/EventBus.js';
import { audioManager } from './AudioManager.js';
import { gameplayBGM, gameOverTheme, waveCompleteFanfare } from './music.js';
import {
  catapultLaunchSfx,
  explosionSfx,
  enemyDeathSfx,
  castleHitSfx,
  warHornSfx,
  castleDestroyedSfx,
  scoreSfx,
} from './sfx.js';

let fanfareTimeout = null;

export function initAudioBridge() {
  // Restore mute preference from localStorage
  audioManager.restoreMutePreference();

  // --- Strudel init (must be from user gesture) ---
  eventBus.on(Events.AUDIO_INIT, () => audioManager.init());

  // --- BGM transitions ---
  eventBus.on(Events.MUSIC_GAMEPLAY, () => {
    if (fanfareTimeout) {
      clearTimeout(fanfareTimeout);
      fanfareTimeout = null;
    }
    audioManager.playMusic(gameplayBGM);
  });

  eventBus.on(Events.MUSIC_GAMEOVER, () => {
    if (fanfareTimeout) {
      clearTimeout(fanfareTimeout);
      fanfareTimeout = null;
    }
    audioManager.playMusic(gameOverTheme);
  });

  eventBus.on(Events.MUSIC_STOP, () => {
    if (fanfareTimeout) {
      clearTimeout(fanfareTimeout);
      fanfareTimeout = null;
    }
    audioManager.stopMusic();
  });

  // --- Wave complete fanfare ---
  // Play a brief victory stinger, then resume gameplay BGM
  eventBus.on(Events.WAVE_COMPLETE, () => {
    audioManager.playMusic(waveCompleteFanfare);
    fanfareTimeout = setTimeout(() => {
      audioManager.playMusic(gameplayBGM);
      fanfareTimeout = null;
    }, 2500); // fanfare plays for ~2.5 seconds, then back to battle music
  });

  // --- SFX (Web Audio API — instant one-shot) ---
  eventBus.on(Events.PROJECTILE_LAUNCHED, () => catapultLaunchSfx());
  eventBus.on(Events.PROJECTILE_IMPACT, () => explosionSfx());
  eventBus.on(Events.ENEMY_KILLED, () => enemyDeathSfx());
  eventBus.on(Events.CASTLE_HIT, () => castleHitSfx());
  eventBus.on(Events.WAVE_START, () => warHornSfx());
  eventBus.on(Events.CASTLE_DESTROYED, () => castleDestroyedSfx());
  eventBus.on(Events.SCORE_CHANGED, () => scoreSfx());

  // --- Mute toggle ---
  eventBus.on(Events.AUDIO_TOGGLE_MUTE, () => {
    audioManager.toggleMute();
  });
}

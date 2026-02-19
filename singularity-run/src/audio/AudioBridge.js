// AudioBridge — wires EventBus events to audio playback
// BGM via Strudel (AudioManager), SFX via Web Audio API (sfx.js)
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { audioManager } from './AudioManager.js';
import { gameplayBGM, gameOverBGM } from './music.js';
import { jumpSfx, slideSfx, collectSfx, deathSfx, laneChangeSfx, restartSfx } from './sfx.js';

export function initAudioBridge() {
  // Init Strudel on first user interaction (browser autoplay policy)
  eventBus.on(Events.AUDIO_INIT, () => audioManager.init());

  // BGM transitions (Strudel)
  eventBus.on(Events.MUSIC_GAMEPLAY, () => audioManager.playMusic(gameplayBGM));
  eventBus.on(Events.MUSIC_GAMEOVER, () => audioManager.playMusic(gameOverBGM));
  eventBus.on(Events.MUSIC_STOP, () => audioManager.stopMusic());

  // SFX (Web Audio API one-shots)
  eventBus.on(Events.PLAYER_JUMP, () => jumpSfx());
  eventBus.on(Events.PLAYER_SLIDE, () => slideSfx());
  eventBus.on(Events.COLLECTIBLE_PICKED, () => collectSfx());
  eventBus.on(Events.PLAYER_DIED, () => deathSfx());
  eventBus.on(Events.PLAYER_LANE_CHANGE, () => laneChangeSfx());
  eventBus.on(Events.GAME_RESTART, () => restartSfx());

  // Mute toggle
  eventBus.on(Events.AUDIO_TOGGLE_MUTE, () => {
    gameState.isMuted = !gameState.isMuted;
    if (gameState.isMuted) {
      audioManager.stopMusic();
    }
    // Update mute button visual
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
      muteBtn.textContent = gameState.isMuted ? 'MUTED' : 'SND';
      muteBtn.style.opacity = gameState.isMuted ? '0.3' : '0.6';
    }
    // Persist preference
    try { localStorage.setItem('singularity-run-muted', gameState.isMuted); } catch (e) { /* noop */ }
  });
}

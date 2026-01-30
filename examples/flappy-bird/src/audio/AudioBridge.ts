// Wires EventBus game events to AudioManager playback
import { eventBus, Events } from '../core/EventBus';
import { audioManager } from './AudioManager';
import { menuTheme, gameplayBGM, gameOverTheme } from './music';
import { flapSfx, scoreSfx, deathSfx, buttonClickSfx } from './sfx';

export function initAudioBridge(): void {
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

  // SFX (Web Audio API -- true one-shot, no looping)
  eventBus.on(Events.BIRD_FLAP, () => {
    flapSfx();
  });

  eventBus.on(Events.SCORE_CHANGED, () => {
    scoreSfx();
  });

  eventBus.on(Events.BIRD_DIED, () => {
    deathSfx();
  });

  eventBus.on(Events.SFX_BUTTON_CLICK, () => {
    buttonClickSfx();
  });
}

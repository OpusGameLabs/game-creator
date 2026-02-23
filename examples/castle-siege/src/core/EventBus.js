// =============================================================================
// EventBus.js — Pub/sub singleton for all cross-module communication
// Modules never import each other directly. Events use domain:action naming.
// =============================================================================

export const Events = {
  // Game lifecycle
  GAME_START: 'game:start',
  GAME_OVER: 'game:over',
  GAME_RESTART: 'game:restart',

  // Castle
  CASTLE_HIT: 'castle:hit',
  CASTLE_DESTROYED: 'castle:destroyed',

  // Enemies
  ENEMY_SPAWNED: 'enemy:spawned',
  ENEMY_KILLED: 'enemy:killed',
  ENEMY_REACHED_CASTLE: 'enemy:reached_castle',

  // Projectiles
  PROJECTILE_LAUNCHED: 'projectile:launched',
  PROJECTILE_IMPACT: 'projectile:impact',

  // Waves
  WAVE_START: 'wave:start',
  WAVE_COMPLETE: 'wave:complete',

  // Score
  SCORE_CHANGED: 'score:changed',

  // Visual effects
  CAMERA_SHAKE: 'camera:shake',
  SPAWN_PARTICLES: 'particles:spawn',
  ENEMY_DUST: 'enemy:dust',
  KILL_COMBO: 'ui:kill_combo',

  // Audio (used by /add-audio)
  AUDIO_INIT: 'audio:init',
  AUDIO_TOGGLE_MUTE: 'audio:toggle_mute',
  MUSIC_MENU: 'music:menu',
  MUSIC_GAMEPLAY: 'music:gameplay',
  MUSIC_GAMEOVER: 'music:gameover',
  MUSIC_STOP: 'music:stop',
};

class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (!this.listeners[event]) return this;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    return this;
  }

  emit(event, data) {
    if (!this.listeners[event]) return this;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`EventBus error in ${event}:`, err);
      }
    });
    return this;
  }

  removeAll() {
    this.listeners = {};
    return this;
  }
}

export const eventBus = new EventBus();

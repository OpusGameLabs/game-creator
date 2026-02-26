export const Events = {
  // Game lifecycle
  GAME_START: 'game:start',
  GAME_OVER: 'game:over',
  GAME_RESTART: 'game:restart',

  // Player
  PLAYER_MOVE: 'player:move',
  PLAYER_JUMP: 'player:jump',
  PLAYER_DIED: 'player:died',
  PLAYER_HIT: 'player:hit',

  // Score
  SCORE_CHANGED: 'score:changed',

  // Envelope throwing
  ENVELOPE_THROWN: 'envelope:thrown',

  // House hits
  HOUSE_HIT: 'house:hit',

  // Homeowner spawning
  HOMEOWNER_SPAWNED: 'homeowner:spawned',

  // Panic point collection
  PANIC_COLLECTED: 'panic:collected',

  // Agent (enemy) collision
  AGENT_COLLISION: 'agent:collision',

  // Lives
  LIVES_CHANGED: 'lives:changed',

  // Combo system
  COMBO_CHANGED: 'combo:changed',

  // Speed changes
  SPEED_CHANGED: 'speed:changed',

  // Spectacle events (future visual polish hooks)
  SPECTACLE_ENTRANCE: 'spectacle:entrance',
  SPECTACLE_ACTION: 'spectacle:action',
  SPECTACLE_HIT: 'spectacle:hit',
  SPECTACLE_COMBO: 'spectacle:combo',
  SPECTACLE_STREAK: 'spectacle:streak',
  SPECTACLE_NEAR_MISS: 'spectacle:near_miss',

  // Audio (used by /add-audio)
  AUDIO_INIT: 'audio:init',
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

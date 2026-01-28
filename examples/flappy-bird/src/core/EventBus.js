class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  emit(event, data) {
    const cbs = this.listeners.get(event);
    if (cbs) cbs.forEach(cb => {
      try { cb(data); } catch (e) { console.error(`EventBus error [${event}]:`, e); }
    });
  }

  off(event, callback) {
    const cbs = this.listeners.get(event);
    if (cbs) {
      cbs.delete(callback);
      if (cbs.size === 0) this.listeners.delete(event);
    }
  }

  clear(event) {
    event ? this.listeners.delete(event) : this.listeners.clear();
  }
}

export const eventBus = new EventBus();

export const Events = {
  BIRD_FLAP: 'bird:flap',
  BIRD_DIED: 'bird:died',
  BIRD_PASSED_PIPE: 'bird:passedPipe',
  SCORE_CHANGED: 'score:changed',
  GAME_START: 'game:start',
  GAME_OVER: 'game:over',
  GAME_RESTART: 'game:restart',
  // Visual events
  PARTICLES_SCORE: 'particles:score',
  PARTICLES_FLAP: 'particles:flap',
  PARTICLES_DEATH: 'particles:death',
  // Audio events
  AUDIO_INIT: 'audio:init',
  MUSIC_MENU: 'audio:music:menu',
  MUSIC_GAMEPLAY: 'audio:music:gameplay',
  MUSIC_GAMEOVER: 'audio:music:gameover',
  MUSIC_STOP: 'audio:music:stop',
};

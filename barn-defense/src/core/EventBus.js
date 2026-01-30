// =============================================================================
// Barn Defense - EventBus
// Singleton pub/sub for all cross-module communication.
// Modules never import each other directly -- only EventBus.
// =============================================================================

export const Events = {
  // Game lifecycle
  GAME_START: 'game:start',
  GAME_OVER: 'game:over',
  GAME_RESTART: 'game:restart',
  LEVEL_SELECT: 'level:select',
  LEVEL_COMPLETE: 'level:complete',

  // Wave management
  WAVE_START: 'wave:start',
  WAVE_COMPLETE: 'wave:complete',
  WAVE_ALL_COMPLETE: 'wave:allComplete',
  WAVE_UPDATED: 'wave:updated',

  // Economy
  CORN_CHANGED: 'corn:changed',
  CORN_EARNED: 'corn:earned',
  CORN_SPENT: 'corn:spent',

  // Lives / Barn
  LIVES_CHANGED: 'lives:changed',
  BARN_HIT: 'barn:hit',

  // Enemies
  ENEMY_SPAWNED: 'enemy:spawned',
  ENEMY_DIED: 'enemy:died',
  ENEMY_REACHED_BARN: 'enemy:reachedBarn',
  ENEMY_DAMAGED: 'enemy:damaged',
  ENEMY_SLOWED: 'enemy:slowed',

  // Towers
  TOWER_SELECTED: 'tower:selected',
  TOWER_DESELECTED: 'tower:deselected',
  TOWER_PLACED: 'tower:placed',
  TOWER_UPGRADED: 'tower:upgraded',
  TOWER_SOLD: 'tower:sold',
  TOWER_FIRED: 'tower:fired',

  // Projectiles
  PROJECTILE_HIT: 'projectile:hit',
  PROJECTILE_SPLASH: 'projectile:splash',

  // UI
  UI_TOWER_PANEL_SELECT: 'ui:towerPanelSelect',
  UI_SPEED_CHANGE: 'ui:speedChange',
  UI_TOWER_INFO: 'ui:towerInfo',
  UI_TOWER_INFO_HIDE: 'ui:towerInfoHide',

  // Particles
  PARTICLES_EMIT: 'particles:emit',

  // Audio (used by /add-audio)
  AUDIO_INIT: 'audio:init',
  MUSIC_MENU: 'music:menu',
  MUSIC_GAMEPLAY: 'music:gameplay',
  MUSIC_GAMEOVER: 'music:gameover',
  MUSIC_LEVELCOMPLETE: 'music:levelcomplete',
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

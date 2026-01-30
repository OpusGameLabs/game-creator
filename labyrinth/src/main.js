import { Game } from './core/Game.js';
import { eventBus, Events } from './core/EventBus.js';
import { gameState } from './core/GameState.js';

const game = new Game();

// Expose for Playwright testing
window.__GAME__ = game;
window.__GAME_STATE__ = gameState;
window.__EVENT_BUS__ = eventBus;
window.__EVENTS__ = Events;

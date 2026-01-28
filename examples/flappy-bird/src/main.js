import Phaser from 'phaser';
import config from './core/GameConfig.js';
import { gameState } from './core/GameState.js';
import { eventBus, Events } from './core/EventBus.js';
import { initAudioBridge } from './audio/AudioBridge.js';

// Wire audio events before game starts
initAudioBridge();

const game = new Phaser.Game(config);

// Expose for Playwright QA
window.__GAME__ = game;
window.__GAME_STATE__ = gameState;
window.__EVENT_BUS__ = eventBus;
window.__EVENTS__ = Events;

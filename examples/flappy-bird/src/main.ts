import Phaser from 'phaser';
import config from './core/GameConfig';
import { gameState } from './core/GameState';
import { eventBus, Events } from './core/EventBus';
import { initAudioBridge } from './audio/AudioBridge';

// Wire audio events before game starts
initAudioBridge();

const game = new Phaser.Game(config);

// Expose for Playwright QA
(window as any).__GAME__ = game;
(window as any).__GAME_STATE__ = gameState;
(window as any).__EVENT_BUS__ = eventBus;
(window as any).__EVENTS__ = Events;

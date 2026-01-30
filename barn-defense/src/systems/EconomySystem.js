// =============================================================================
// Barn Defense - EconomySystem
// Manages corn currency. Listens for earn/spend events and updates GameState.
// =============================================================================

import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class EconomySystem {
  constructor() {
    // The economy is mostly managed directly by other systems
    // (WaveSystem awards corn on kill, TowerSystem spends on placement)
    // This system exists for any additional economy logic if needed.

    // Emit initial corn state
    eventBus.emit(Events.CORN_CHANGED, { corn: gameState.corn });
    eventBus.emit(Events.LIVES_CHANGED, { lives: gameState.lives });
  }

  destroy() {
    // No listeners to clean up for now
  }
}

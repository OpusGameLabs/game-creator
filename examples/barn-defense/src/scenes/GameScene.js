// =============================================================================
// Barn Defense - GameScene
// Main tower defense gameplay scene.
// Renders the map, manages systems, handles tower placement, and runs the
// game loop that updates enemies, towers, and projectiles each frame.
// =============================================================================

import Phaser from 'phaser';
import { GAME, COLORS, TRANSITION, EFFECTS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { MapSystem } from '../systems/MapSystem.js';
import { PathSystem } from '../systems/PathSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { TowerSystem } from '../systems/TowerSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    // Initialize systems
    this.mapSystem = new MapSystem();
    this.mapSystem.loadLevel(gameState.currentLevel);

    // Render map
    this.pathSystem = new PathSystem(this, this.mapSystem);
    this.pathSystem.renderMap();

    // Wave system (spawns and manages enemies)
    this.waveSystem = new WaveSystem(this, this.mapSystem);

    // Tower system (placement, targeting, firing)
    this.towerSystem = new TowerSystem(this, this.mapSystem);

    // Economy system
    this.economySystem = new EconomySystem();

    // Particle system (visual effects driven by EventBus)
    this.particleSystem = new ParticleSystem(this);

    // Game state
    gameState.started = true;

    // Listen for game over
    this.onGameOver = () => {
      this.time.delayedCall(1000, () => {
        this.scene.stop('UIScene');
        this.scene.start('GameOverScene');
      });
    };
    eventBus.on(Events.GAME_OVER, this.onGameOver);

    // Listen for level complete
    this.onLevelComplete = () => {
      this.time.delayedCall(1500, () => {
        this.scene.stop('UIScene');
        this.scene.start('LevelCompleteScene');
      });
    };
    eventBus.on(Events.LEVEL_COMPLETE, this.onLevelComplete);

    // Listen for tower sold (need to remove from TowerSystem grid)
    this.onTowerSold = ({ tower }) => {
      this.towerSystem.removeTower(tower);
    };
    eventBus.on(Events.TOWER_SOLD, this.onTowerSold);

    // Fade in
    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION);

    // Start gameplay BGM
    eventBus.emit(Events.MUSIC_GAMEPLAY);

    // Screen flash + shake on barn hit (uses EFFECTS constants)
    this.onBarnHit = () => {
      this.cameras.main.flash(
        EFFECTS.BARN_HIT_FLASH.DURATION,
        EFFECTS.BARN_HIT_FLASH.R,
        EFFECTS.BARN_HIT_FLASH.G,
        EFFECTS.BARN_HIT_FLASH.B
      );
      this.cameras.main.shake(
        EFFECTS.BARN_HIT_SHAKE.DURATION,
        EFFECTS.BARN_HIT_SHAKE.INTENSITY
      );
    };
    eventBus.on(Events.BARN_HIT, this.onBarnHit);
  }

  update(time, delta) {
    if (gameState.gameOver || gameState.levelComplete) return;

    // Cap delta to prevent huge jumps
    const cappedDelta = Math.min(delta, GAME.DELTA_CAP);

    // Update wave system (spawns and moves enemies)
    this.waveSystem.update(cappedDelta);

    // Get alive enemies for tower targeting
    const aliveEnemies = this.waveSystem.getAliveEnemies();

    // Update tower system (targeting, firing, projectiles)
    this.towerSystem.update(time, cappedDelta, aliveEnemies);
  }

  shutdown() {
    // Stop BGM on scene shutdown
    eventBus.emit(Events.MUSIC_STOP);

    // Clean up event listeners
    eventBus.off(Events.GAME_OVER, this.onGameOver);
    eventBus.off(Events.LEVEL_COMPLETE, this.onLevelComplete);
    eventBus.off(Events.TOWER_SOLD, this.onTowerSold);
    eventBus.off(Events.BARN_HIT, this.onBarnHit);

    // Destroy systems
    if (this.waveSystem) this.waveSystem.destroy();
    if (this.towerSystem) this.towerSystem.destroy();
    if (this.economySystem) this.economySystem.destroy();
    if (this.pathSystem) this.pathSystem.destroy();
    if (this.particleSystem) this.particleSystem.destroy();
  }
}

// =============================================================================
// Barn Defense - TowerSystem
// Manages tower placement, targeting, firing, and upgrades.
// =============================================================================

import { GAME, TOWERS, TOWER_ORDER, COLORS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { Tower } from '../entities/Tower.js';
import { Projectile } from '../entities/Projectile.js';

export class TowerSystem {
  constructor(scene, mapSystem) {
    this.scene = scene;
    this.mapSystem = mapSystem;
    this.towers = [];
    this.projectiles = [];

    // Grid to track placed towers (col x row -> tower)
    this.towerGrid = {};

    // Ghost tower for placement preview
    this.ghostGraphic = null;
    this.ghostRange = null;

    // Listen for tower panel selection
    this.onTowerPanelSelect = ({ towerType }) => {
      if (gameState.selectedPlacedTower) {
        gameState.selectedPlacedTower.deselect();
      }
      gameState.selectedTowerType = towerType;
      this.showGhost(true);
    };
    eventBus.on(Events.UI_TOWER_PANEL_SELECT, this.onTowerPanelSelect);

    // Listen for tower deselect
    this.onTowerDeselected = () => {
      gameState.selectedTowerType = null;
      gameState.selectedPlacedTower = null;
      this.showGhost(false);
    };
    eventBus.on(Events.TOWER_DESELECTED, this.onTowerDeselected);

    // Setup mouse input for placement
    this.setupInput();
  }

  setupInput() {
    this.scene.input.on('pointermove', (pointer) => {
      if (!gameState.selectedTowerType) return;
      this.updateGhostPosition(pointer.x, pointer.y);
    });

    this.scene.input.on('pointerdown', (pointer) => {
      // Right click or already handled by tower selection
      if (pointer.rightButtonDown()) {
        this.cancelSelection();
        return;
      }

      if (gameState.selectedTowerType) {
        this.tryPlaceTower(pointer.x, pointer.y);
      } else if (!gameState.selectedPlacedTower) {
        // Click on empty space - deselect
        // (Tower selection is handled by Tower entity itself)
      }
    });

    // Escape to cancel
    this.scene.input.keyboard.on('keydown-ESC', () => {
      this.cancelSelection();
    });
  }

  cancelSelection() {
    if (gameState.selectedPlacedTower) {
      gameState.selectedPlacedTower.deselect();
    }
    gameState.selectedTowerType = null;
    gameState.selectedPlacedTower = null;
    this.showGhost(false);
    eventBus.emit(Events.TOWER_DESELECTED);
    eventBus.emit(Events.UI_TOWER_INFO_HIDE);
  }

  showGhost(visible) {
    if (!visible) {
      if (this.ghostGraphic) {
        this.ghostGraphic.destroy();
        this.ghostGraphic = null;
      }
      if (this.ghostRange) {
        this.ghostRange.destroy();
        this.ghostRange = null;
      }
      return;
    }

    if (!gameState.selectedTowerType) return;
    const config = TOWERS[gameState.selectedTowerType];
    if (!config) return;

    // Create ghost graphic
    if (!this.ghostGraphic) {
      this.ghostGraphic = this.scene.add.rectangle(
        0, 0, GAME.TILE_SIZE - 2, GAME.TILE_SIZE - 2,
        COLORS.VALID_PLACEMENT, COLORS.PLACEMENT_ALPHA
      );
    }

    if (!this.ghostRange) {
      this.ghostRange = this.scene.add.circle(
        0, 0, config.range,
        COLORS.RANGE_FILL, COLORS.RANGE_ALPHA
      );
      this.ghostRange.setStrokeStyle(1, COLORS.RANGE_STROKE, COLORS.RANGE_STROKE_ALPHA);
    } else {
      this.ghostRange.setRadius(config.range);
    }
  }

  updateGhostPosition(px, py) {
    const { col, row } = this.mapSystem.pixelToGrid(px, py);
    const { x, y } = this.mapSystem.gridToPixel(col, row);

    if (this.ghostGraphic) {
      this.ghostGraphic.setPosition(x, y);
      const canPlace = this.canPlaceTower(col, row);
      this.ghostGraphic.setFillStyle(
        canPlace ? COLORS.VALID_PLACEMENT : COLORS.INVALID_PLACEMENT,
        COLORS.PLACEMENT_ALPHA
      );
    }
    if (this.ghostRange) {
      this.ghostRange.setPosition(x, y);
    }
  }

  canPlaceTower(col, row) {
    // Must be grass tile and not already occupied
    if (!this.mapSystem.canPlaceTower(col, row)) return false;
    const key = `${col},${row}`;
    if (this.towerGrid[key]) return false;
    return true;
  }

  tryPlaceTower(px, py) {
    const { col, row } = this.mapSystem.pixelToGrid(px, py);

    if (!this.canPlaceTower(col, row)) return;

    const towerType = gameState.selectedTowerType;
    const config = TOWERS[towerType];
    if (!config) return;

    // Check if player can afford
    if (gameState.corn < config.cost) return;

    // Spend corn
    gameState.spendCorn(config.cost);
    eventBus.emit(Events.CORN_CHANGED, { corn: gameState.corn });
    eventBus.emit(Events.CORN_SPENT, { amount: config.cost });

    // Place tower
    const tower = new Tower(this.scene, towerType, col, row);
    this.towers.push(tower);
    this.towerGrid[`${col},${row}`] = tower;
    gameState.towersPlaced.push(tower);

    eventBus.emit(Events.TOWER_PLACED, {
      tower,
      towerType,
      col,
      row,
    });

    // Keep same tower type selected for quick placement
    // But update ghost color based on remaining corn
  }

  update(time, delta, enemies) {
    // Update towers - find targets and fire
    for (const tower of this.towers) {
      const fireData = tower.update(time, enemies);
      if (fireData) {
        const projectile = new Projectile(this.scene, fireData);
        this.projectiles.push(projectile);
      }
    }

    // Update projectiles
    for (const proj of this.projectiles) {
      if (proj.isAlive()) {
        proj.update(delta, enemies);
      }
    }

    // Clean up dead projectiles
    this.projectiles = this.projectiles.filter(p => p.isAlive());
  }

  removeTower(tower) {
    const key = `${tower.col},${tower.row}`;
    delete this.towerGrid[key];
    this.towers = this.towers.filter(t => t !== tower);
    gameState.towersPlaced = gameState.towersPlaced.filter(t => t !== tower);
  }

  destroy() {
    eventBus.off(Events.UI_TOWER_PANEL_SELECT, this.onTowerPanelSelect);
    eventBus.off(Events.TOWER_DESELECTED, this.onTowerDeselected);

    for (const tower of this.towers) {
      tower.destroy();
    }
    for (const proj of this.projectiles) {
      proj.destroy();
    }
    this.towers = [];
    this.projectiles = [];
    this.towerGrid = {};

    if (this.ghostGraphic) {
      this.ghostGraphic.destroy();
      this.ghostGraphic = null;
    }
    if (this.ghostRange) {
      this.ghostRange.destroy();
      this.ghostRange = null;
    }
  }
}

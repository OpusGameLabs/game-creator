// =============================================================================
// Barn Defense - Tower Entity
// Towers are placed on the grid and auto-target enemies in range.
// They fire projectiles at regular intervals.
// Uses pixel art textures for visuals.
// =============================================================================

import { GAME, TOWERS, COLORS, EFFECTS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Tower {
  constructor(scene, towerType, col, row) {
    this.scene = scene;
    this.towerTypeKey = towerType;
    this.config = TOWERS[towerType];
    this.col = col;
    this.row = row;
    this.level = 1;

    // Computed stats (can change with upgrades)
    this.damage = this.config.damage;
    this.range = this.config.range;
    this.fireRate = this.config.fireRate;

    // Position in pixels (center of tile)
    this.x = col * GAME.TILE_SIZE + GAME.TILE_SIZE / 2;
    this.y = row * GAME.TILE_SIZE + GAME.TILE_SIZE / 2;

    // Timing
    this.lastFired = 0;
    this.target = null;

    // Create visual
    this.container = scene.add.container(this.x, this.y);

    // Tower body (pixel art image)
    const texKey = `tower-${this.config.key}`;
    this.bodyImage = scene.add.image(0, 0, texKey);
    this.container.add(this.bodyImage);

    // Level indicator (with text stroke for readability)
    this.levelText = scene.add.text(
      GAME.TILE_SIZE / 2 - 6, -GAME.TILE_SIZE / 2 + 1,
      '1',
      {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#ffffff',
        stroke: EFFECTS.TEXT_STROKE_COLOR,
        strokeThickness: EFFECTS.TEXT_STROKE_THICKNESS,
      }
    );
    this.container.add(this.levelText);

    // Range indicator (hidden by default)
    this.rangeCircle = scene.add.circle(0, 0, this.range, COLORS.RANGE_FILL, COLORS.RANGE_ALPHA);
    this.rangeCircle.setStrokeStyle(1, COLORS.RANGE_STROKE, COLORS.RANGE_STROKE_ALPHA);
    this.rangeCircle.setVisible(false);
    this.container.add(this.rangeCircle);
    this.container.sendToBack(this.rangeCircle);

    // Make interactive for selection
    const hitArea = scene.add.rectangle(0, 0, GAME.TILE_SIZE, GAME.TILE_SIZE, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.container.add(hitArea);
    hitArea.on('pointerdown', (pointer) => {
      // Only handle if not placing a tower
      if (!gameState.selectedTowerType) {
        this.select();
        pointer.event.stopPropagation();
      }
    });
    this.hitArea = hitArea;
  }

  select() {
    eventBus.emit(Events.TOWER_SELECTED, { tower: this });
    gameState.selectedPlacedTower = this;
    this.showRange(true);
  }

  deselect() {
    gameState.selectedPlacedTower = null;
    this.showRange(false);
  }

  showRange(visible) {
    this.rangeCircle.setVisible(visible);
  }

  update(time, enemies) {
    if (!enemies || enemies.length === 0) return null;

    // Check fire rate
    const effectiveFireRate = this.fireRate / gameState.gameSpeed;
    if (time - this.lastFired < effectiveFireRate) return null;

    // Find nearest enemy in range
    let nearest = null;
    let nearestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.isAlive()) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= this.range && dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    }

    if (!nearest) return null;

    this.lastFired = time;
    this.target = nearest;

    eventBus.emit(Events.TOWER_FIRED, {
      tower: this,
      target: nearest,
      x: this.x,
      y: this.y,
    });

    // Return fire data for projectile creation
    return {
      fromX: this.x,
      fromY: this.y,
      target: nearest,
      damage: this.damage,
      speed: this.config.projectileSpeed,
      color: this.config.projectileColor,
      size: this.config.projectileSize,
      splash: this.config.splash || false,
      splashRadius: this.config.splashRadius || 0,
      slowEffect: this.config.slowEffect || false,
      slowAmount: this.config.slowAmount || 1,
      slowDuration: this.config.slowDuration || 0,
      towerTypeKey: this.config.key,
    };
  }

  getUpgradeCost() {
    if (this.level >= this.config.maxLevel) return -1;
    return Math.floor(this.config.cost * this.config.upgradeCostMultiplier * this.level);
  }

  getSellValue() {
    // Sell for 60% of total spent
    let totalSpent = this.config.cost;
    for (let i = 1; i < this.level; i++) {
      totalSpent += Math.floor(this.config.cost * this.config.upgradeCostMultiplier * i);
    }
    return Math.floor(totalSpent * 0.6);
  }

  upgrade() {
    if (this.level >= this.config.maxLevel) return false;

    const cost = this.getUpgradeCost();
    if (!gameState.spendCorn(cost)) return false;

    this.level++;
    this.damage = Math.floor(this.config.damage * Math.pow(this.config.upgradeDamageMultiplier, this.level - 1));
    this.range = Math.floor(this.config.range * Math.pow(this.config.upgradeRangeMultiplier, this.level - 1));

    // Update visuals
    this.levelText.setText(String(this.level));
    this.rangeCircle.setRadius(this.range);

    eventBus.emit(Events.TOWER_UPGRADED, { tower: this });
    eventBus.emit(Events.CORN_CHANGED, { corn: gameState.corn });

    return true;
  }

  sell() {
    const value = this.getSellValue();
    gameState.addCorn(value);
    eventBus.emit(Events.CORN_CHANGED, { corn: gameState.corn });
    eventBus.emit(Events.TOWER_SOLD, { tower: this, value });
    this.destroy();
    return value;
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}

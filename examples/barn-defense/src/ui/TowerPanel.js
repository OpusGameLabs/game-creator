// =============================================================================
// Barn Defense - TowerPanel
// Bottom panel for selecting towers to place.
// Shows tower icons with costs and names.
// =============================================================================

import { GAME, TOWERS, TOWER_ORDER, COLORS, UI, EFFECTS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class TowerPanel {
  constructor(scene) {
    this.scene = scene;
    this.buttons = [];
    this.selectedType = null;
    this.infoContainer = null;
    this.upgradeBtn = null;
    this.sellBtn = null;

    this.create();

    // Listen for corn changes to update affordability
    this.onCornChanged = () => this.updateAffordability();
    eventBus.on(Events.CORN_CHANGED, this.onCornChanged);

    // Listen for tower selection (placed tower)
    this.onTowerSelected = ({ tower }) => this.showTowerInfo(tower);
    eventBus.on(Events.TOWER_SELECTED, this.onTowerSelected);

    // Listen for tower deselect
    this.onTowerDeselected = () => this.hideTowerInfo();
    eventBus.on(Events.TOWER_DESELECTED, this.onTowerDeselected);

    // Listen for tower info hide
    this.onTowerInfoHide = () => this.hideTowerInfo();
    eventBus.on(Events.UI_TOWER_INFO_HIDE, this.onTowerInfoHide);

    // Listen for tower sold (update grid & hide info)
    this.onTowerSold = () => this.hideTowerInfo();
    eventBus.on(Events.TOWER_SOLD, this.onTowerSold);

    // Listen for tower upgraded
    this.onTowerUpgraded = ({ tower }) => this.showTowerInfo(tower);
    eventBus.on(Events.TOWER_UPGRADED, this.onTowerUpgraded);
  }

  create() {
    // Panel background
    this.panelBg = this.scene.add.rectangle(
      GAME.WIDTH / 2, UI.PANEL_Y + UI.PANEL_HEIGHT / 2,
      UI.PANEL_WIDTH, UI.PANEL_HEIGHT,
      UI.TOP_BAR_BG, UI.TOP_BAR_ALPHA
    );
    this.panelBg.setStrokeStyle(2, COLORS.UI_PANEL_BORDER);

    // Tower buttons
    const startX = 60;
    const spacing = 140;

    TOWER_ORDER.forEach((typeKey, index) => {
      const config = TOWERS[typeKey];
      const x = startX + index * spacing;
      const y = UI.PANEL_Y + UI.PANEL_HEIGHT / 2;

      // Affordable glow behind button (subtle pulsing)
      const glowCfg = EFFECTS.TOWER_GLOW;
      const glow = this.scene.add.rectangle(x, y, 134, 56, glowCfg.COLOR, 0);
      glow.setDepth(0);

      // Button background
      const btn = this.scene.add.rectangle(x, y, 130, 52, COLORS.UI_BUTTON, 0.8);
      btn.setStrokeStyle(1, COLORS.UI_PANEL_BORDER);
      btn.setInteractive({ useHandCursor: true });

      // Tower icon (small colored square)
      const icon = this.scene.add.rectangle(x - 45, y, 24, 24, config.color);

      // Tower name (with text stroke)
      const nameText = this.scene.add.text(x - 28, y - 14, config.name, {
        fontSize: UI.FONT_SIZE_SMALL,
        fontFamily: UI.FONT_FAMILY,
        color: COLORS.UI_TEXT,
        stroke: EFFECTS.TEXT_STROKE_COLOR,
        strokeThickness: 1,
      });

      // Cost text (with text stroke)
      const costText = this.scene.add.text(x - 28, y + 2, `${config.cost} corn`, {
        fontSize: UI.FONT_SIZE_SMALL,
        fontFamily: UI.FONT_FAMILY,
        color: COLORS.UI_GOLD_TEXT,
        stroke: EFFECTS.TEXT_STROKE_COLOR,
        strokeThickness: 1,
      });

      // Hover effects
      btn.on('pointerover', () => {
        btn.setFillStyle(COLORS.UI_BUTTON_HOVER, 0.9);
      });
      btn.on('pointerout', () => {
        if (this.selectedType === typeKey) {
          btn.setFillStyle(COLORS.UI_BUTTON_HOVER, 0.9);
        } else {
          btn.setFillStyle(COLORS.UI_BUTTON, 0.8);
        }
      });

      btn.on('pointerdown', (pointer) => {
        pointer.event.stopPropagation();
        this.selectTowerType(typeKey);
      });

      // Glow pulse tween (starts paused; toggled by affordability)
      const glowTween = this.scene.tweens.add({
        targets: glow,
        alpha: { from: glowCfg.MIN_ALPHA, to: glowCfg.MAX_ALPHA },
        duration: glowCfg.PULSE_DURATION,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        paused: true,
      });

      this.buttons.push({
        typeKey,
        config,
        btn,
        icon,
        nameText,
        costText,
        glow,
        glowTween,
      });
    });

    // Create info panel (hidden by default)
    this.createInfoPanel();
  }

  createInfoPanel() {
    this.infoContainer = this.scene.add.container(GAME.WIDTH / 2, GAME.HEIGHT / 2);
    this.infoContainer.setVisible(false);

    // Background
    const bg = this.scene.add.rectangle(0, 0, 220, 140, UI.TOP_BAR_BG, 0.95);
    bg.setStrokeStyle(2, COLORS.UI_PANEL_BORDER);
    this.infoContainer.add(bg);

    // Title
    this.infoTitle = this.scene.add.text(-100, -60, '', {
      fontSize: UI.FONT_SIZE_MEDIUM,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    });
    this.infoContainer.add(this.infoTitle);

    // Stats
    this.infoStats = this.scene.add.text(-100, -35, '', {
      fontSize: UI.FONT_SIZE_SMALL,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      lineSpacing: 4,
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    });
    this.infoContainer.add(this.infoStats);

    // Upgrade button
    this.upgradeBtn = this.scene.add.rectangle(-30, 45, 100, 28, COLORS.UI_BUTTON, 0.9);
    this.upgradeBtn.setInteractive({ useHandCursor: true });
    this.infoContainer.add(this.upgradeBtn);

    this.upgradeBtnText = this.scene.add.text(-30, 45, 'Upgrade', {
      fontSize: UI.FONT_SIZE_SMALL,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.infoContainer.add(this.upgradeBtnText);

    this.upgradeBtn.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      if (gameState.selectedPlacedTower) {
        gameState.selectedPlacedTower.upgrade();
      }
    });

    // Sell button
    this.sellBtn = this.scene.add.rectangle(70, 45, 70, 28, 0xaa3333, 0.9);
    this.sellBtn.setInteractive({ useHandCursor: true });
    this.infoContainer.add(this.sellBtn);

    this.sellBtnText = this.scene.add.text(70, 45, 'Sell', {
      fontSize: UI.FONT_SIZE_SMALL,
      fontFamily: UI.FONT_FAMILY,
      color: COLORS.UI_TEXT,
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.infoContainer.add(this.sellBtnText);

    this.sellBtn.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      if (gameState.selectedPlacedTower) {
        const tower = gameState.selectedPlacedTower;
        // Need to tell TowerSystem to remove it
        tower.sell();
        eventBus.emit(Events.TOWER_DESELECTED);
      }
    });
  }

  selectTowerType(typeKey) {
    // Deselect any placed tower
    if (gameState.selectedPlacedTower) {
      gameState.selectedPlacedTower.deselect();
    }
    this.hideTowerInfo();

    if (this.selectedType === typeKey) {
      // Toggle off
      this.selectedType = null;
      gameState.selectedTowerType = null;
      eventBus.emit(Events.TOWER_DESELECTED);
    } else {
      this.selectedType = typeKey;
      eventBus.emit(Events.UI_TOWER_PANEL_SELECT, { towerType: typeKey });
    }

    this.updateButtonStates();
  }

  updateButtonStates() {
    for (const button of this.buttons) {
      if (button.typeKey === this.selectedType) {
        button.btn.setFillStyle(COLORS.UI_BUTTON_HOVER, 0.9);
        button.btn.setStrokeStyle(2, 0xffff00);
      } else {
        button.btn.setFillStyle(COLORS.UI_BUTTON, 0.8);
        button.btn.setStrokeStyle(1, COLORS.UI_PANEL_BORDER);
      }
    }
  }

  updateAffordability() {
    for (const button of this.buttons) {
      const canAfford = gameState.corn >= button.config.cost;
      button.btn.setAlpha(canAfford ? 1 : 0.5);
      button.costText.setColor(canAfford ? COLORS.UI_GOLD_TEXT : COLORS.UI_RED_TEXT);

      // Toggle glow on affordable towers
      if (button.glow && button.glowTween) {
        if (canAfford) {
          if (!button.glowTween.isPlaying()) {
            button.glowTween.resume();
          }
        } else {
          button.glowTween.pause();
          button.glow.setAlpha(0);
        }
      }
    }
  }

  showTowerInfo(tower) {
    this.hideTowerInfo();
    this.selectedType = null;
    this.updateButtonStates();

    this.infoContainer.setPosition(tower.x, Math.max(tower.y - 100, 100));
    this.infoContainer.setVisible(true);

    this.infoTitle.setText(`${tower.config.name} Lv.${tower.level}`);

    const stats = [
      `Damage: ${tower.damage}`,
      `Range: ${tower.range}`,
      `Fire Rate: ${tower.fireRate}ms`,
    ];
    if (tower.config.splash) {
      stats.push(`Splash: ${tower.config.splashRadius}px`);
    }
    if (tower.config.slowEffect) {
      stats.push(`Slow: ${Math.round((1 - tower.config.slowAmount) * 100)}%`);
    }
    this.infoStats.setText(stats.join('\n'));

    // Update upgrade button
    const upgradeCost = tower.getUpgradeCost();
    if (upgradeCost < 0) {
      this.upgradeBtnText.setText('MAX');
      this.upgradeBtn.setFillStyle(COLORS.UI_BUTTON_DISABLED, 0.7);
    } else {
      this.upgradeBtnText.setText(`Up: ${upgradeCost}`);
      const canAfford = gameState.corn >= upgradeCost;
      this.upgradeBtn.setFillStyle(
        canAfford ? COLORS.UI_BUTTON : COLORS.UI_BUTTON_DISABLED,
        0.9
      );
    }

    // Update sell button
    this.sellBtnText.setText(`Sell: ${tower.getSellValue()}`);
  }

  hideTowerInfo() {
    if (this.infoContainer) {
      this.infoContainer.setVisible(false);
    }
  }

  destroy() {
    eventBus.off(Events.CORN_CHANGED, this.onCornChanged);
    eventBus.off(Events.TOWER_SELECTED, this.onTowerSelected);
    eventBus.off(Events.TOWER_DESELECTED, this.onTowerDeselected);
    eventBus.off(Events.UI_TOWER_INFO_HIDE, this.onTowerInfoHide);
    eventBus.off(Events.TOWER_SOLD, this.onTowerSold);
    eventBus.off(Events.TOWER_UPGRADED, this.onTowerUpgraded);
  }
}

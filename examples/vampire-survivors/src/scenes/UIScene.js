import Phaser from 'phaser';
import { GAME, COLORS, WEAPONS, TRANSITION, SAFE_ZONE, UI, PX } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    const pad = 10 * PX;
    const hpBarW = 200 * PX;
    const hpBarH = 16 * PX;
    const xpBarH = 8 * PX;

    // HP Bar (bottom left)
    const hpY = GAME.HEIGHT - 30 * PX;
    this.hpBarWidth = hpBarW;
    this.hpBg = this.add.rectangle(pad, hpY, hpBarW, hpBarH, COLORS.HP_BAR_BG).setOrigin(0, 0.5).setScrollFactor(0);
    this.hpBar = this.add.rectangle(pad, hpY, hpBarW, hpBarH, COLORS.HP_BAR).setOrigin(0, 0.5).setScrollFactor(0);
    this.hpText = this.add.text(pad + hpBarW / 2, hpY, '100/100', {
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      fontFamily: UI.FONT,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2 * PX,
    }).setOrigin(0.5).setScrollFactor(0);

    // XP Bar (below SAFE_ZONE.TOP, full width)
    const xpY = SAFE_ZONE.TOP;
    this.xpBg = this.add.rectangle(0, xpY, GAME.WIDTH, xpBarH, COLORS.XP_BAR_BG).setOrigin(0, 0).setScrollFactor(0);
    this.xpBar = this.add.rectangle(0, xpY, 0, xpBarH, COLORS.XP_BAR).setOrigin(0, 0).setScrollFactor(0);

    // Level text (below XP bar)
    const levelY = xpY + xpBarH + pad;
    this.levelText = this.add.text(GAME.WIDTH / 2, levelY, 'LV 1', {
      fontSize: `${Math.round(GAME.HEIGHT * UI.BODY_RATIO)}px`,
      fontFamily: UI.FONT,
      color: '#00ccff',
      stroke: '#000000',
      strokeThickness: 3 * PX,
    }).setOrigin(0.5, 0).setScrollFactor(0);

    // Timer (top right, below SAFE_ZONE)
    this.timerText = this.add.text(GAME.WIDTH - pad, levelY, '0:00', {
      fontSize: `${Math.round(GAME.HEIGHT * UI.HEADING_RATIO)}px`,
      fontFamily: UI.FONT,
      color: COLORS.TIMER_TEXT,
      stroke: '#000000',
      strokeThickness: 3 * PX,
    }).setOrigin(1, 0).setScrollFactor(0);

    // Kill count (top left, below SAFE_ZONE)
    this.killText = this.add.text(pad, levelY, 'Kills: 0', {
      fontSize: `${Math.round(GAME.HEIGHT * UI.BODY_RATIO)}px`,
      fontFamily: UI.FONT,
      color: COLORS.KILL_TEXT,
      stroke: '#000000',
      strokeThickness: 2 * PX,
    }).setOrigin(0, 0).setScrollFactor(0);

    // Event listeners
    this.onDamaged = () => this.updateHP();
    this.onXp = () => this.updateXP();
    this.onScore = ({ kills }) => { if (kills !== undefined) this.killText.setText(`Kills: ${kills}`); };
    this.onLevelUp = ({ level }) => { this.levelText.setText(`LV ${level}`); };

    eventBus.on(Events.PLAYER_DAMAGED, this.onDamaged);
    eventBus.on(Events.XP_GAINED, this.onXp);
    eventBus.on(Events.SCORE_CHANGED, this.onScore);
    eventBus.on(Events.LEVEL_UP, this.onLevelUp);

    // Level up panel listener
    this.events.on('showLevelUp', () => this.showLevelUpPanel());

    // Set all UI to top depth
    this.children.each(c => c.setDepth(200));
  }

  update() {
    // Timer
    const elapsed = gameState.elapsedTime;
    const m = Math.floor(elapsed / 60);
    const s = Math.floor(elapsed % 60);
    this.timerText.setText(`${m}:${s.toString().padStart(2, '0')}`);
  }

  updateHP() {
    const pct = gameState.hp / gameState.maxHp;
    this.hpBar.width = this.hpBarWidth * pct;
    this.hpBar.setFillStyle(pct < 0.3 ? COLORS.HP_BAR_DANGER : COLORS.HP_BAR);
    this.hpText.setText(`${Math.ceil(gameState.hp)}/${gameState.maxHp}`);
  }

  updateXP() {
    const pct = gameState.xp / gameState.xpToNext;
    this.xpBar.width = GAME.WIDTH * pct;
  }

  showLevelUpPanel() {
    // Dim background
    this.levelUpBg = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.7)
      .setScrollFactor(0).setDepth(300);

    const titleFontSize = Math.round(GAME.HEIGHT * UI.TITLE_RATIO);
    this.add.text(GAME.WIDTH / 2, SAFE_ZONE.TOP + 40 * PX, 'LEVEL UP!', {
      fontSize: `${titleFontSize}px`,
      fontFamily: UI.FONT,
      color: '#ffcc00', stroke: '#000000', strokeThickness: 5 * PX,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    // Generate choices
    const choices = this.generateChoices();
    const startY = SAFE_ZONE.TOP + 120 * PX;
    const cardH = 100 * PX;
    const cardW = 400 * PX;
    const gap = 15 * PX;
    const iconR = 16 * PX;
    const headingSize = Math.round(GAME.HEIGHT * UI.BODY_RATIO);
    const bodySize = Math.round(GAME.HEIGHT * UI.SMALL_RATIO);

    choices.forEach((choice, i) => {
      const y = startY + i * (cardH + gap);
      const card = this.add.rectangle(GAME.WIDTH / 2, y, cardW, cardH, COLORS.LEVEL_UP_BG, 1)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0).setDepth(301);
      this.add.rectangle(GAME.WIDTH / 2, y, cardW, cardH)
        .setStrokeStyle(2 * PX, COLORS.LEVEL_UP_BORDER)
        .setScrollFactor(0).setDepth(301);

      const icon = this.add.circle(GAME.WIDTH / 2 - cardW * 0.4, y, iconR, choice.color || 0xffffff, 1)
        .setScrollFactor(0).setDepth(302);

      this.add.text(GAME.WIDTH / 2 - cardW * 0.3, y - 15 * PX, choice.title, {
        fontSize: `${headingSize}px`,
        fontFamily: UI.FONT,
        color: '#ffffff', stroke: '#000000', strokeThickness: 2 * PX,
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(302);

      this.add.text(GAME.WIDTH / 2 - cardW * 0.3, y + 12 * PX, choice.desc, {
        fontSize: `${bodySize}px`,
        fontFamily: UI.FONT,
        color: '#aaaacc',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(302);

      card.on('pointerover', () => card.setFillStyle(COLORS.LEVEL_UP_BORDER));
      card.on('pointerout', () => card.setFillStyle(COLORS.LEVEL_UP_BG));
      card.on('pointerdown', () => {
        this.clearLevelUpPanel();
        this.scene.get('GameScene').onLevelUpChoice(choice);
      });
    });

    this.levelUpElements = this.children.list.filter(c => c.depth >= 300);
  }

  generateChoices() {
    const choices = [];
    const allWeapons = Object.keys(WEAPONS);
    const owned = gameState.weapons;

    // Upgrades for owned weapons
    for (const key of owned) {
      const cfg = WEAPONS[key];
      const lvl = gameState.weaponLevels[key] || 1;
      if (lvl < 8) {
        choices.push({
          type: 'upgrade', key,
          title: `${cfg.name} LV ${lvl + 1}`,
          desc: `Upgrade ${cfg.name}: more damage & faster`,
          color: cfg.color,
        });
      }
    }

    // New weapons
    for (const key of allWeapons) {
      if (!owned.includes(key)) {
        const cfg = WEAPONS[key];
        choices.push({
          type: 'newWeapon', key,
          title: `NEW: ${cfg.name}`,
          desc: `Gain ${cfg.name} as a new weapon`,
          color: cfg.color,
        });
      }
    }

    // Heal option
    if (gameState.hp < gameState.maxHp) {
      choices.push({
        type: 'heal', key: 'heal',
        title: 'Heal +30 HP',
        desc: `Restore health (${Math.ceil(gameState.hp)}/${gameState.maxHp})`,
        color: 0x44ff44,
      });
    }

    // Shuffle and pick 3
    Phaser.Utils.Array.Shuffle(choices);
    return choices.slice(0, 3);
  }

  clearLevelUpPanel() {
    if (this.levelUpElements) {
      this.levelUpElements.forEach(el => el.destroy());
      this.levelUpElements = null;
    }
  }

  shutdown() {
    eventBus.off(Events.PLAYER_DAMAGED, this.onDamaged);
    eventBus.off(Events.XP_GAINED, this.onXp);
    eventBus.off(Events.SCORE_CHANGED, this.onScore);
    eventBus.off(Events.LEVEL_UP, this.onLevelUp);
  }
}

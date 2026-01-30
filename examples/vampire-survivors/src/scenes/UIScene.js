import Phaser from 'phaser';
import { GAME, COLORS, WEAPONS, TRANSITION } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    // HP Bar (bottom left)
    this.hpBg = this.add.rectangle(10, GAME.HEIGHT - 30, 200, 16, COLORS.HP_BAR_BG).setOrigin(0, 0.5).setScrollFactor(0);
    this.hpBar = this.add.rectangle(10, GAME.HEIGHT - 30, 200, 16, COLORS.HP_BAR).setOrigin(0, 0.5).setScrollFactor(0);
    this.hpText = this.add.text(110, GAME.HEIGHT - 30, '100/100', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0);

    // XP Bar (top, full width)
    this.xpBg = this.add.rectangle(0, 0, GAME.WIDTH, 8, COLORS.XP_BAR_BG).setOrigin(0, 0).setScrollFactor(0);
    this.xpBar = this.add.rectangle(0, 0, 0, 8, COLORS.XP_BAR).setOrigin(0, 0).setScrollFactor(0);

    // Level text
    this.levelText = this.add.text(GAME.WIDTH / 2, 16, 'LV 1', {
      fontSize: '14px', fontFamily: 'Arial Black, Arial, sans-serif', color: '#00ccff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0);

    // Timer (top right)
    this.timerText = this.add.text(GAME.WIDTH - 10, 16, '0:00', {
      fontSize: '20px', fontFamily: 'Arial Black, Arial, sans-serif', color: COLORS.TIMER_TEXT,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(1, 0.5).setScrollFactor(0);

    // Kill count (top left)
    this.killText = this.add.text(10, 16, 'Kills: 0', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: COLORS.KILL_TEXT,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0.5).setScrollFactor(0);

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
    this.hpBar.width = 200 * pct;
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

    this.add.text(GAME.WIDTH / 2, 80, 'LEVEL UP!', {
      fontSize: '36px', fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffcc00', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    // Generate choices
    const choices = this.generateChoices();
    const startY = 180;
    const cardH = 100;
    const gap = 15;

    choices.forEach((choice, i) => {
      const y = startY + i * (cardH + gap);
      const card = this.add.rectangle(GAME.WIDTH / 2, y, 400, cardH, COLORS.LEVEL_UP_BG, 1)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0).setDepth(301);
      this.add.rectangle(GAME.WIDTH / 2, y, 400, cardH)
        .setStrokeStyle(2, COLORS.LEVEL_UP_BORDER)
        .setScrollFactor(0).setDepth(301);

      const icon = this.add.circle(GAME.WIDTH / 2 - 160, y, 16, choice.color || 0xffffff, 1)
        .setScrollFactor(0).setDepth(302);

      this.add.text(GAME.WIDTH / 2 - 120, y - 15, choice.title, {
        fontSize: '18px', fontFamily: 'Arial Black, Arial, sans-serif',
        color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(302);

      this.add.text(GAME.WIDTH / 2 - 120, y + 12, choice.desc, {
        fontSize: '13px', fontFamily: 'Arial, sans-serif',
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

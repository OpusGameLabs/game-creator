import { XP } from './Constants.js';

class GameState {
  constructor() {
    this.bestScore = 0;
    this.bestTime = 0;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.kills = 0;
    this.started = false;
    this.gameOver = false;
    this.won = false;
    this.paused = false;
    this.hp = 100;
    this.maxHp = 100;
    this.xp = 0;
    this.level = 1;
    this.xpToNext = XP.LEVELS[1] || 5;
    this.elapsedTime = 0;
    this.weapons = ['WHIP'];
    this.weaponLevels = { WHIP: 1 };
  }

  addScore(points = 1) {
    this.score += points;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
  }

  addKill() {
    this.kills++;
    this.addScore(1);
  }

  addXp(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      const nextIdx = Math.min(this.level, XP.LEVELS.length - 1);
      this.xpToNext = XP.LEVELS[nextIdx] || this.xpToNext * 1.2;
      return true; // leveled up
    }
    return false;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addWeapon(weaponKey) {
    if (!this.weapons.includes(weaponKey)) {
      this.weapons.push(weaponKey);
      this.weaponLevels[weaponKey] = 1;
    }
  }

  upgradeWeapon(weaponKey) {
    if (this.weaponLevels[weaponKey]) {
      this.weaponLevels[weaponKey]++;
    }
  }

  updateTime(elapsed) {
    this.elapsedTime = elapsed;
    if (elapsed > this.bestTime) {
      this.bestTime = elapsed;
    }
  }
}

export const gameState = new GameState();

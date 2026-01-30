import Phaser from 'phaser';
import { GAME, PLAYER, ENEMY, COLORS, TRANSITION, XP } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { Player } from '../entities/Player.js';
import { XpGem } from '../entities/XpGem.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { ParticleSystem } from '../systems/Particles.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    gameState.reset();
    gameState.started = true;
    this.startTime = this.time.now;
    this.xpGems = [];
    this.levelingUp = false;

    // World bounds
    this.physics.world.setBounds(0, 0, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);

    // Draw ground grid
    this.drawArena();

    // Player
    this.player = new Player(this);

    // Camera follows player
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);

    // Systems
    this.enemySpawner = new EnemySpawner(this);
    this.weaponSystem = new WeaponSystem(this);
    this.particles = new ParticleSystem(this);

    // Listen for enemy kills to drop XP
    this.onEnemyKilled = ({ x, y, xp, typeKey }) => {
      gameState.addKill();
      eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score, kills: gameState.kills });
      eventBus.emit(Events.PARTICLES_EMIT, {
        type: 'enemyDeath', x, y,
        color: ENEMY.TYPES[typeKey]?.color || 0xff4444,
      });
      // Drop XP gem
      const gem = new XpGem(this, x, y, xp);
      this.xpGems.push(gem);
    };
    eventBus.on(Events.ENEMY_KILLED, this.onEnemyKilled);

    // Music
    eventBus.emit(Events.MUSIC_GAMEPLAY);
  }

  drawArena() {
    const gfx = this.add.graphics();
    gfx.setDepth(0);

    // Ground
    gfx.fillStyle(COLORS.GROUND, 1);
    gfx.fillRect(0, 0, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);

    // Grid lines
    gfx.lineStyle(1, COLORS.GRID_LINE, 0.3);
    const gridSize = 80;
    for (let x = 0; x <= GAME.WORLD_WIDTH; x += gridSize) {
      gfx.lineBetween(x, 0, x, GAME.WORLD_HEIGHT);
    }
    for (let y = 0; y <= GAME.WORLD_HEIGHT; y += gridSize) {
      gfx.lineBetween(0, y, GAME.WORLD_WIDTH, y);
    }
  }

  update(time, delta) {
    if (gameState.gameOver || this.levelingUp) return;

    const elapsed = (time - this.startTime) / 1000;
    gameState.updateTime(elapsed);

    // Player
    this.player.update();
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    // Enemy spawner
    this.enemySpawner.update(px, py, delta, elapsed);

    // Weapons (auto-attack)
    const enemies = this.enemySpawner.getEnemies();
    this.weaponSystem.update(px, py, enemies, delta);

    // XP gems — magnet and collect
    for (let i = this.xpGems.length - 1; i >= 0; i--) {
      const gem = this.xpGems[i];
      if (gem.collected) {
        this.xpGems.splice(i, 1);
        continue;
      }
      gem.magnetTo(px, py, delta);

      // Check pickup
      const dx = px - gem.sprite.x;
      const dy = py - gem.sprite.y;
      if (Math.sqrt(dx * dx + dy * dy) < PLAYER.SIZE + 8) {
        gem.collect();
        eventBus.emit(Events.PARTICLES_EMIT, { type: 'xpPickup', x: gem.sprite.x, y: gem.sprite.y });
        const leveled = gameState.addXp(gem.amount);
        eventBus.emit(Events.XP_GAINED, { xp: gameState.xp, xpToNext: gameState.xpToNext, level: gameState.level });
        if (leveled) {
          this.triggerLevelUp();
        }
        this.xpGems.splice(i, 1);
      }
    }

    // Enemy-player collision (damage)
    for (const enemy of enemies) {
      const dx = px - enemy.sprite.x;
      const dy = py - enemy.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitDist = PLAYER.SIZE + (enemy.sprite.width / 2) - 5;
      if (dist < hitDist) {
        this.player.takeDamage(enemy.damage);
        if (gameState.hp <= 0) {
          this.triggerGameOver();
          return;
        }
      }
    }

    // Win condition
    if (elapsed >= GAME.SURVIVE_TIME) {
      this.triggerWin();
    }
  }

  triggerLevelUp() {
    this.levelingUp = true;
    gameState.paused = true;
    eventBus.emit(Events.PARTICLES_EMIT, { type: 'levelUp', x: this.player.sprite.x, y: this.player.sprite.y });
    eventBus.emit(Events.LEVEL_UP, { level: gameState.level });

    // Freeze enemies
    this.enemySpawner.stopAll();

    // Show level up choices via UIScene
    this.scene.get('UIScene').events.emit('showLevelUp');
  }

  onLevelUpChoice(choice) {
    if (choice.type === 'newWeapon') {
      gameState.addWeapon(choice.key);
    } else if (choice.type === 'upgrade') {
      gameState.upgradeWeapon(choice.key);
    } else if (choice.type === 'heal') {
      gameState.heal(30);
    }
    eventBus.emit(Events.WEAPON_UPGRADE, { weapons: gameState.weapons });
    this.levelingUp = false;
    gameState.paused = false;
  }

  triggerGameOver() {
    if (gameState.gameOver) return;
    gameState.gameOver = true;

    this.cameras.main.flash(TRANSITION.DEATH_FLASH_DURATION, 255, 0, 0);
    this.cameras.main.shake(TRANSITION.DEATH_SHAKE_DURATION, TRANSITION.DEATH_SHAKE_INTENSITY);

    eventBus.emit(Events.MUSIC_STOP);
    eventBus.emit(Events.PLAYER_DIED);
    eventBus.emit(Events.GAME_OVER, { score: gameState.score, kills: gameState.kills, time: gameState.elapsedTime });

    this.time.delayedCall(1500, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene');
    });
  }

  triggerWin() {
    if (gameState.gameOver) return;
    gameState.gameOver = true;
    gameState.won = true;

    eventBus.emit(Events.MUSIC_STOP);
    eventBus.emit(Events.GAME_WIN, { score: gameState.score, kills: gameState.kills, time: gameState.elapsedTime });

    this.time.delayedCall(1000, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene');
    });
  }

  shutdown() {
    eventBus.off(Events.ENEMY_KILLED, this.onEnemyKilled);
    if (this.enemySpawner) this.enemySpawner.destroy();
    if (this.weaponSystem) this.weaponSystem.destroy();
    if (this.particles) this.particles.destroy();
    this.xpGems.forEach(g => g.destroy());
    this.xpGems = [];
  }
}

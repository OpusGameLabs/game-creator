import Phaser from 'phaser';
import { WEAPONS, PLAYER } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class WeaponSystem {
  constructor(scene) {
    this.scene = scene;
    this.cooldowns = {};
    this.projectiles = [];
    this.aoeEffects = [];
  }

  update(playerX, playerY, enemies, delta) {
    // Fire each equipped weapon
    for (const weaponKey of gameState.weapons) {
      const cfg = WEAPONS[weaponKey];
      if (!cfg) continue;

      if (!this.cooldowns[weaponKey]) this.cooldowns[weaponKey] = 0;
      this.cooldowns[weaponKey] -= delta;

      if (this.cooldowns[weaponKey] <= 0) {
        const level = gameState.weaponLevels[weaponKey] || 1;
        this.fireWeapon(weaponKey, cfg, level, playerX, playerY, enemies);
        // Reduce cooldown per level (10% faster per level)
        this.cooldowns[weaponKey] = cfg.cooldown * Math.pow(0.9, level - 1);
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= delta;
      if (proj.life <= 0 || !proj.sprite.active) {
        proj.sprite.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with enemies
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dx = enemy.sprite.x - proj.sprite.x;
        const dy = enemy.sprite.y - proj.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitDist = (proj.size || 6) + (enemy.sprite.width / 2);

        if (dist < hitDist) {
          const level = gameState.weaponLevels[proj.weaponKey] || 1;
          const dmg = proj.damage + (level - 1) * 3;
          enemy.hit(dmg, dx / dist * 100, dy / dist * 100);
          proj.pierceLeft--;
          if (proj.pierceLeft <= 0) {
            proj.sprite.destroy();
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }

    // Update AOE effects
    for (let i = this.aoeEffects.length - 1; i >= 0; i--) {
      const aoe = this.aoeEffects[i];
      aoe.life -= delta;
      if (aoe.life <= 0) {
        if (aoe.gfx) aoe.gfx.destroy();
        this.aoeEffects.splice(i, 1);
        continue;
      }

      // Damage enemies in radius
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dx = enemy.sprite.x - aoe.x;
        const dy = enemy.sprite.y - aoe.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < aoe.radius) {
          if (!aoe.hitEnemies.has(enemy)) {
            aoe.hitEnemies.add(enemy);
            const level = gameState.weaponLevels[aoe.weaponKey] || 1;
            const dmg = aoe.damage + (level - 1) * 2;
            const kb = aoe.knockback || 0;
            enemy.hit(dmg, kb ? (dx / dist * kb) : 0, kb ? (dy / dist * kb) : 0);
          }
        }
      }
    }
  }

  fireWeapon(weaponKey, cfg, level, px, py, enemies) {
    eventBus.emit(Events.WEAPON_FIRE, { weapon: weaponKey });

    switch (weaponKey) {
      case 'WHIP':
        this.fireWhip(cfg, level, px, py, enemies);
        break;
      case 'MAGIC_WAND':
        this.fireMagicWand(cfg, level, px, py, enemies);
        break;
      case 'GARLIC':
        this.fireGarlic(cfg, level, px, py);
        break;
      case 'FIREBALL':
        this.fireFireball(cfg, level, px, py, enemies);
        break;
    }
  }

  fireWhip(cfg, level, px, py, enemies) {
    // Find nearest enemy
    let nearest = null;
    let nearDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Phaser.Math.Distance.Between(px, py, e.sprite.x, e.sprite.y);
      if (d < nearDist && d < cfg.range * (1 + level * 0.2)) {
        nearDist = d;
        nearest = e;
      }
    }

    // Visual arc
    const dir = nearest ? Math.atan2(nearest.sprite.y - py, nearest.sprite.x - px) : 0;
    const gfx = this.scene.add.graphics();
    gfx.setDepth(15);
    gfx.lineStyle(3, cfg.color, 0.8);
    gfx.beginPath();
    gfx.arc(px, py, cfg.range, dir - 0.8, dir + 0.8, false);
    gfx.strokePath();

    // Damage enemies in arc
    const range = cfg.range * (1 + level * 0.2);
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Phaser.Math.Distance.Between(px, py, e.sprite.x, e.sprite.y);
      if (d < range) {
        const angle = Math.atan2(e.sprite.y - py, e.sprite.x - px);
        const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - dir));
        if (angleDiff < 0.9) {
          const dmg = cfg.damage + (level - 1) * 4;
          const dx = e.sprite.x - px;
          const dy = e.sprite.y - py;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          enemy_hit_with_knockback(e, dmg, dx / dist * cfg.knockback, dy / dist * cfg.knockback);
        }
      }
    }

    // Fade out
    this.scene.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 200,
      onComplete: () => gfx.destroy(),
    });
  }

  fireMagicWand(cfg, level, px, py, enemies) {
    // Find nearest enemy
    let nearest = null;
    let nearDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Phaser.Math.Distance.Between(px, py, e.sprite.x, e.sprite.y);
      if (d < nearDist && d < cfg.range * 1.5) {
        nearDist = d;
        nearest = e;
      }
    }
    if (!nearest) return;

    const dx = nearest.sprite.x - px;
    const dy = nearest.sprite.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Create projectile
    const projGfx = this.scene.add.circle(px, py, cfg.size, cfg.color, 1);
    projGfx.setDepth(15);
    const projBody = this.scene.physics.add.existing(projGfx);
    projGfx.body.setAllowGravity(false);
    projGfx.body.setVelocity(
      (dx / dist) * cfg.speed,
      (dy / dist) * cfg.speed
    );

    this.projectiles.push({
      sprite: projGfx,
      weaponKey: 'MAGIC_WAND',
      damage: cfg.damage,
      size: cfg.size,
      life: 2000,
      pierceLeft: cfg.pierce + Math.floor(level / 2),
    });
  }

  fireGarlic(cfg, level, px, py) {
    const radius = cfg.radius + level * 10;
    const gfx = this.scene.add.graphics();
    gfx.setDepth(4);
    gfx.fillStyle(cfg.color, 0.2);
    gfx.fillCircle(px, py, radius);
    gfx.lineStyle(2, cfg.color, 0.5);
    gfx.strokeCircle(px, py, radius);

    this.aoeEffects.push({
      x: px, y: py,
      radius,
      damage: cfg.damage,
      knockback: cfg.knockback,
      weaponKey: 'GARLIC',
      life: cfg.duration,
      gfx,
      hitEnemies: new Set(),
    });

    this.scene.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: cfg.duration,
      onComplete: () => gfx.destroy(),
    });
  }

  fireFireball(cfg, level, px, py, enemies) {
    // Aim at nearest enemy
    let nearest = null;
    let nearDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Phaser.Math.Distance.Between(px, py, e.sprite.x, e.sprite.y);
      if (d < nearDist) { nearDist = d; nearest = e; }
    }
    if (!nearest) return;

    const dx = nearest.sprite.x - px;
    const dy = nearest.sprite.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const projGfx = this.scene.add.circle(px, py, cfg.size, cfg.color, 1);
    projGfx.setDepth(15);
    this.scene.physics.add.existing(projGfx);
    projGfx.body.setAllowGravity(false);
    projGfx.body.setVelocity(
      (dx / dist) * cfg.speed,
      (dy / dist) * cfg.speed
    );

    this.projectiles.push({
      sprite: projGfx,
      weaponKey: 'FIREBALL',
      damage: cfg.damage,
      size: cfg.size,
      life: 3000,
      pierceLeft: cfg.pierce + level,
    });
  }

  destroy() {
    this.projectiles.forEach(p => { if (p.sprite) p.sprite.destroy(); });
    this.aoeEffects.forEach(a => { if (a.gfx) a.gfx.destroy(); });
    this.projectiles = [];
    this.aoeEffects = [];
  }
}

// Helper to avoid calling method on enemy directly
function enemy_hit_with_knockback(enemy, dmg, kbx, kby) {
  enemy.hit(dmg, kbx, kby);
}

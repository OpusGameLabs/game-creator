import Phaser from 'phaser';
import { ENEMY, WAVE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class Enemy {
  constructor(scene, x, y, typeKey, hpScale) {
    this.scene = scene;
    this.typeKey = typeKey;
    const cfg = ENEMY.TYPES[typeKey];
    this.hp = Math.ceil(cfg.hp * hpScale);
    this.maxHp = this.hp;
    this.damage = cfg.damage;
    this.speed = cfg.speed;
    this.xpValue = cfg.xp;
    this.alive = true;
    this.damageFlashTime = 0;

    // Generate texture if not cached
    const texKey = `enemy-${typeKey}`;
    if (!scene.textures.exists(texKey)) {
      const gfx = scene.add.graphics();
      gfx.fillStyle(cfg.color, 1);
      gfx.fillCircle(cfg.size, cfg.size, cfg.size);
      // Eyes
      gfx.fillStyle(0xff0000, 1);
      gfx.fillCircle(cfg.size - 4, cfg.size - 4, 2);
      gfx.fillCircle(cfg.size + 4, cfg.size - 4, 2);
      gfx.generateTexture(texKey, cfg.size * 2, cfg.size * 2);
      gfx.destroy();
    }

    this.sprite = scene.physics.add.sprite(x, y, texKey);
    this.sprite.setCircle(cfg.size);
    this.sprite.body.setAllowGravity(false);
    this.sprite.setDepth(5);
    this.sprite.setData('enemy', this);
  }

  update(playerX, playerY, delta) {
    if (!this.alive) return;

    // Chase player
    const dx = playerX - this.sprite.x;
    const dy = playerY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.sprite.setVelocity(
        (dx / dist) * this.speed,
        (dy / dist) * this.speed
      );
    }

    // Flip based on direction
    this.sprite.setFlipX(dx < 0);

    // Damage flash fade
    if (this.damageFlashTime > 0) {
      this.damageFlashTime -= delta;
      if (this.damageFlashTime <= 0) {
        this.sprite.setTint(0xffffff);
      }
    }
  }

  hit(damage, knockbackX, knockbackY) {
    if (!this.alive) return;
    this.hp -= damage;

    // White flash
    this.sprite.setTint(0xffffff);
    this.damageFlashTime = 100;

    // Knockback
    if (knockbackX !== undefined) {
      this.sprite.body.setVelocity(knockbackX, knockbackY);
    }

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    eventBus.emit(Events.ENEMY_KILLED, {
      x: this.sprite.x,
      y: this.sprite.y,
      xp: this.xpValue,
      typeKey: this.typeKey,
    });
    this.sprite.destroy();
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
  }
}

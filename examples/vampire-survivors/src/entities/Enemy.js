import Phaser from 'phaser';
import { ENEMY, WAVE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { renderSpriteSheet } from '../core/PixelRenderer.js';
import { ENEMY_SPRITES } from '../sprites/enemies.js';
import { PALETTE } from '../sprites/palette.js';

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

    // Generate pixel art spritesheet if not cached
    const texKey = `enemy-${typeKey}`;
    const spriteData = ENEMY_SPRITES[typeKey];
    const scale = 2;
    renderSpriteSheet(scene, spriteData.frames, PALETTE, texKey, scale);

    const animKey = `${typeKey}-anim`;
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(texKey, { start: 0, end: spriteData.frames.length - 1 }),
        frameRate: spriteData.animRate,
        repeat: -1,
      });
    }

    this.sprite = scene.physics.add.sprite(x, y, texKey, 0);
    this.sprite.play(animKey);
    const bodySize = spriteData.frames[0][0].length * scale * 0.7;
    this.sprite.body.setSize(bodySize, bodySize);
    this.sprite.body.setOffset(
      (this.sprite.width - bodySize) / 2,
      (this.sprite.height - bodySize) / 2
    );
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

import Phaser from 'phaser';
import { GAME, SKY, GROUND } from '../core/Constants.js';

export class Background {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];

    this.drawSkyGradient(scene);
    this.createClouds(scene);
    this.drawGround(scene);
  }

  drawSkyGradient(scene) {
    const bg = scene.add.graphics();
    bg.setDepth(0);
    const topR = (SKY.TOP_COLOR >> 16) & 0xff;
    const topG = (SKY.TOP_COLOR >> 8) & 0xff;
    const topB = SKY.TOP_COLOR & 0xff;
    const botR = (SKY.BOTTOM_COLOR >> 16) & 0xff;
    const botG = (SKY.BOTTOM_COLOR >> 8) & 0xff;
    const botB = SKY.BOTTOM_COLOR & 0xff;

    for (let y = 0; y < GROUND.Y; y++) {
      const t = y / GROUND.Y;
      const r = Math.round(topR + (botR - topR) * t);
      const g = Math.round(topG + (botG - topG) * t);
      const b = Math.round(topB + (botB - topB) * t);
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      bg.fillRect(0, y, GAME.WIDTH, 1);
    }
  }

  createClouds(scene) {
    for (let i = 0; i < SKY.CLOUD_COUNT; i++) {
      const x = Math.random() * (GAME.WIDTH + 100);
      const y = SKY.CLOUD_MIN_Y + Math.random() * (SKY.CLOUD_MAX_Y - SKY.CLOUD_MIN_Y);
      const scale = 0.5 + Math.random() * 0.8;
      this.clouds.push(this.createCloud(scene, x, y, scale));
    }
  }

  createCloud(scene, x, y, scale) {
    const gfx = scene.add.graphics();
    gfx.setDepth(1);
    const color = Phaser.Utils.Array.GetRandom(SKY.CLOUD_COLORS);
    gfx.fillStyle(color, SKY.CLOUD_ALPHA * scale);
    gfx.fillEllipse(0, 0, 60 * scale, 30 * scale);
    gfx.fillEllipse(25 * scale, -5 * scale, 50 * scale, 25 * scale);
    gfx.fillEllipse(-20 * scale, 5 * scale, 40 * scale, 20 * scale);
    gfx.setPosition(x, y);
    return { gfx, speed: SKY.CLOUD_SPEED * scale };
  }

  drawGround(scene) {
    // Ground base — two copies for infinite scrolling
    this.groundGfx1 = this.createGroundStrip(scene, 0);
    this.groundGfx2 = this.createGroundStrip(scene, GAME.WIDTH);
  }

  createGroundStrip(scene, startX) {
    const gfx = scene.add.graphics();
    gfx.setDepth(20);
    gfx.setPosition(startX, GROUND.Y);

    // Main fill
    gfx.fillStyle(GROUND.COLOR, 1);
    gfx.fillRect(0, 0, GAME.WIDTH, GROUND.HEIGHT);

    // Grass line along top
    gfx.fillStyle(GROUND.GRASS_COLOR, 1);
    gfx.fillRect(0, 0, GAME.WIDTH, 4);

    // Dark line
    gfx.lineStyle(2, GROUND.DARK_COLOR, 1);
    gfx.lineBetween(0, 4, GAME.WIDTH, 4);

    // Diagonal stripes for texture
    gfx.fillStyle(GROUND.STRIPE_COLOR, 0.3);
    for (let x = -GROUND.HEIGHT; x < GAME.WIDTH + GROUND.HEIGHT; x += 24) {
      gfx.fillRect(x, 8, 12, GROUND.HEIGHT);
    }

    return gfx;
  }

  update(delta) {
    // Scroll clouds
    this.clouds.forEach(cloud => {
      cloud.gfx.x -= cloud.speed * (delta / 1000);
      if (cloud.gfx.x < -80) {
        cloud.gfx.x = GAME.WIDTH + 80;
      }
    });

    // Scroll ground
    if (this.groundGfx1 && this.groundGfx2) {
      const shift = GROUND.SPEED * (delta / 1000);
      this.groundGfx1.x -= shift;
      this.groundGfx2.x -= shift;
      if (this.groundGfx1.x <= -GAME.WIDTH) {
        this.groundGfx1.x = this.groundGfx2.x + GAME.WIDTH;
      }
      if (this.groundGfx2.x <= -GAME.WIDTH) {
        this.groundGfx2.x = this.groundGfx1.x + GAME.WIDTH;
      }
    }
  }

  stopScrolling() {
    // Freeze ground scrolling (clouds continue)
    this.groundStopped = true;
  }

  destroy() {
    this.clouds.forEach(c => c.gfx.destroy());
    this.clouds = [];
    if (this.groundGfx1) this.groundGfx1.destroy();
    if (this.groundGfx2) this.groundGfx2.destroy();
  }
}

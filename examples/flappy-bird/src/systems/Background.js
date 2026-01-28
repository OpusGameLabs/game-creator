import Phaser from 'phaser';
import { GAME_CONFIG, GROUND_CONFIG, SKY_CONFIG, COLORS } from '../core/Constants.js';

/**
 * Draws a vertical sky gradient with parallax scrolling clouds
 * and detailed ground with grass tufts.
 * Reusable across scenes — call create() in scene.create(), update() in scene.update().
 */
export default class Background {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
  }

  create() {
    const { width, height } = GAME_CONFIG;
    const groundY = height - GROUND_CONFIG.height;

    // Sky gradient
    this.skyGfx = this.scene.add.graphics().setDepth(0);
    const topR = (SKY_CONFIG.topColor >> 16) & 0xff;
    const topG = (SKY_CONFIG.topColor >> 8) & 0xff;
    const topB = SKY_CONFIG.topColor & 0xff;
    const botR = (SKY_CONFIG.bottomColor >> 16) & 0xff;
    const botG = (SKY_CONFIG.bottomColor >> 8) & 0xff;
    const botB = SKY_CONFIG.bottomColor & 0xff;

    for (let y = 0; y < groundY; y++) {
      const t = y / groundY;
      const r = Math.round(topR + (botR - topR) * t);
      const g = Math.round(topG + (botG - topG) * t);
      const b = Math.round(topB + (botB - topB) * t);
      this.skyGfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      this.skyGfx.fillRect(0, y, width, 1);
    }

    // Clouds
    for (let i = 0; i < SKY_CONFIG.cloudCount; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(SKY_CONFIG.cloudMinY, SKY_CONFIG.cloudMaxY);
      const scale = 0.5 + Math.random() * 0.7;
      this.clouds.push(this.createCloud(x, y, scale));
    }

    // Ground with detail
    this.drawGround(groundY);
  }

  createCloud(x, y, scale) {
    const gfx = this.scene.add.graphics().setDepth(1);
    const color = Phaser.Utils.Array.GetRandom(SKY_CONFIG.cloudColors);
    const alpha = SKY_CONFIG.cloudAlpha * (0.6 + scale * 0.4);

    gfx.fillStyle(color, alpha);
    gfx.fillEllipse(0, 0, 60 * scale, 26 * scale);
    gfx.fillEllipse(22 * scale, -4 * scale, 48 * scale, 22 * scale);
    gfx.fillEllipse(-18 * scale, 4 * scale, 38 * scale, 18 * scale);
    gfx.fillEllipse(10 * scale, 6 * scale, 32 * scale, 16 * scale);

    gfx.setPosition(x, y);

    return { gfx, speed: SKY_CONFIG.cloudSpeed * scale, scale };
  }

  drawGround(groundY) {
    const { width } = GAME_CONFIG;

    this.groundGfx = this.scene.add.graphics().setDepth(10);

    // Main ground fill
    this.groundGfx.fillStyle(COLORS.ground, 1);
    this.groundGfx.fillRect(0, groundY, width, GROUND_CONFIG.height);

    // Grass tufts along top edge
    this.groundGfx.fillStyle(COLORS.grassGreen, 1);
    for (let x = 0; x < width; x += 10) {
      const h = 4 + Math.random() * 7;
      this.groundGfx.fillTriangle(x, groundY, x + 5, groundY - h, x + 10, groundY);
    }

    // Darker grass accents
    this.groundGfx.fillStyle(COLORS.grassDarkGreen, 0.5);
    for (let x = 5; x < width; x += 20) {
      const h = 3 + Math.random() * 5;
      this.groundGfx.fillTriangle(x, groundY, x + 3, groundY - h, x + 6, groundY);
    }

    // Ground top edge line
    this.groundGfx.lineStyle(2, COLORS.groundDark, 1);
    this.groundGfx.lineBetween(0, groundY, width, groundY);

    // Subtle dirt texture lines
    this.groundGfx.lineStyle(1, COLORS.groundDark, 0.3);
    for (let y = groundY + 15; y < GAME_CONFIG.height; y += 12) {
      const startX = Math.random() * 40;
      this.groundGfx.lineBetween(startX, y, startX + 30 + Math.random() * 60, y);
    }
  }

  update(delta) {
    const { width } = GAME_CONFIG;
    for (const cloud of this.clouds) {
      cloud.gfx.x -= cloud.speed * (delta / 1000);
      if (cloud.gfx.x < -80 * cloud.scale) {
        cloud.gfx.x = width + 80 * cloud.scale;
        cloud.gfx.y = Phaser.Math.Between(SKY_CONFIG.cloudMinY, SKY_CONFIG.cloudMaxY);
      }
    }
  }

  destroy() {
    this.clouds.forEach(c => c.gfx.destroy());
    this.clouds = [];
  }
}

import Phaser from 'phaser';
import { GAME_CONFIG, GROUND_CONFIG, SKY_CONFIG, PARALLAX_CONFIG, COLORS } from '../core/Constants.js';

/**
 * Multi-layer background with parallax scrolling:
 * Layer 0: Sky gradient (static)
 * Layer 1: Clouds (slow parallax)
 * Layer 2: Far mountains (medium parallax)
 * Layer 3: Near hills (faster parallax)
 * Layer 4: Ground with grass (scrolls at pipe speed)
 */
export default class Background {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.groundOffset = 0;
  }

  create() {
    const { width, height } = GAME_CONFIG;
    const groundY = height - GROUND_CONFIG.height;

    // Layer 0: Sky gradient
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

    // Layer 1: Clouds
    for (let i = 0; i < SKY_CONFIG.cloudCount; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(SKY_CONFIG.cloudMinY, SKY_CONFIG.cloudMaxY);
      const scale = 0.5 + Math.random() * 0.7;
      this.clouds.push(this.createCloud(x, y, scale));
    }

    // Layer 2: Far mountains
    this.farMountains = this.createMountainStrip(
      PARALLAX_CONFIG.farBaseY,
      PARALLAX_CONFIG.farPeakMin,
      PARALLAX_CONFIG.farPeakMax,
      PARALLAX_CONFIG.farSegmentWidth,
      PARALLAX_CONFIG.farColor,
      PARALLAX_CONFIG.farAlpha,
      2
    );

    // Layer 3: Near hills
    this.nearHills = this.createMountainStrip(
      PARALLAX_CONFIG.nearBaseY,
      PARALLAX_CONFIG.nearPeakMin,
      PARALLAX_CONFIG.nearPeakMax,
      PARALLAX_CONFIG.nearSegmentWidth,
      PARALLAX_CONFIG.nearColor,
      PARALLAX_CONFIG.nearAlpha,
      3
    );

    // Layer 4: Ground (two segments for seamless scroll)
    this.groundGfxA = this.scene.add.graphics().setDepth(10);
    this.groundGfxB = this.scene.add.graphics().setDepth(10);
    this.drawGroundSegment(this.groundGfxA, 0, groundY);
    this.drawGroundSegment(this.groundGfxB, width, groundY);
    this.groundY = groundY;
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

  createMountainStrip(baseY, peakMin, peakMax, segW, color, alpha, depth) {
    const { width } = GAME_CONFIG;
    // Create two strips (A + B) for seamless wrapping
    const stripWidth = width + segW * 2;

    const gfxA = this.scene.add.graphics().setDepth(depth);
    const gfxB = this.scene.add.graphics().setDepth(depth);

    const drawStrip = (gfx) => {
      gfx.fillStyle(color, alpha);
      const points = [{ x: 0, y: baseY }];
      for (let x = 0; x <= stripWidth; x += segW) {
        const peakH = peakMin + Math.random() * (peakMax - peakMin);
        points.push({ x, y: baseY - peakH });
        points.push({ x: x + segW * 0.5, y: baseY - peakH * 0.4 });
      }
      points.push({ x: stripWidth, y: baseY });

      gfx.beginPath();
      gfx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        gfx.lineTo(points[i].x, points[i].y);
      }
      gfx.closePath();
      gfx.fillPath();
    };

    drawStrip(gfxA);
    drawStrip(gfxB);
    gfxB.x = stripWidth;

    return { gfxA, gfxB, stripWidth };
  }

  drawGroundSegment(gfx, xOffset, groundY) {
    const { width } = GAME_CONFIG;

    // Main ground fill
    gfx.fillStyle(COLORS.ground, 1);
    gfx.fillRect(0, groundY, width, GROUND_CONFIG.height);

    // Grass tufts along top edge
    gfx.fillStyle(COLORS.grassGreen, 1);
    for (let x = 0; x < width; x += 10) {
      const h = 4 + Math.random() * 7;
      gfx.fillTriangle(x, groundY, x + 5, groundY - h, x + 10, groundY);
    }

    // Darker grass accents
    gfx.fillStyle(COLORS.grassDarkGreen, 0.5);
    for (let x = 5; x < width; x += 20) {
      const h = 3 + Math.random() * 5;
      gfx.fillTriangle(x, groundY, x + 3, groundY - h, x + 6, groundY);
    }

    // Ground top edge line
    gfx.lineStyle(2, COLORS.groundDark, 1);
    gfx.lineBetween(0, groundY, width, groundY);

    // Subtle dirt texture lines
    gfx.lineStyle(1, COLORS.groundDark, 0.3);
    for (let y = groundY + 15; y < GAME_CONFIG.height; y += 12) {
      const startX = Math.random() * 40;
      gfx.lineBetween(startX, y, startX + 30 + Math.random() * 60, y);
    }

    gfx.x = xOffset;
  }

  update(delta) {
    const { width } = GAME_CONFIG;
    const dt = delta / 1000;

    // Layer 1: Clouds
    for (const cloud of this.clouds) {
      cloud.gfx.x -= cloud.speed * dt;
      if (cloud.gfx.x < -80 * cloud.scale) {
        cloud.gfx.x = width + 80 * cloud.scale;
        cloud.gfx.y = Phaser.Math.Between(SKY_CONFIG.cloudMinY, SKY_CONFIG.cloudMaxY);
      }
    }

    // Layer 2: Far mountains
    this.scrollStrip(this.farMountains, PARALLAX_CONFIG.farSpeed, dt);

    // Layer 3: Near hills
    this.scrollStrip(this.nearHills, PARALLAX_CONFIG.nearSpeed, dt);

    // Layer 4: Ground scroll
    this.groundOffset -= PARALLAX_CONFIG.groundScrollSpeed * dt;
    if (this.groundOffset <= -width) {
      this.groundOffset += width;
    }
    this.groundGfxA.x = this.groundOffset;
    this.groundGfxB.x = this.groundOffset + width;
  }

  scrollStrip(strip, speed, dt) {
    strip.gfxA.x -= speed * dt;
    strip.gfxB.x -= speed * dt;

    if (strip.gfxA.x <= -strip.stripWidth) {
      strip.gfxA.x = strip.gfxB.x + strip.stripWidth;
    }
    if (strip.gfxB.x <= -strip.stripWidth) {
      strip.gfxB.x = strip.gfxA.x + strip.stripWidth;
    }
  }

  destroy() {
    this.clouds.forEach(c => c.gfx.destroy());
    this.clouds = [];
  }
}

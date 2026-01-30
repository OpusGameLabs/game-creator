import Phaser from 'phaser';
import { PIPE, GAME, GROUND } from '../core/Constants.js';

export class Pipe {
  constructor(scene, x, gapCenterY) {
    this.scene = scene;
    this.scored = false;

    const halfGap = PIPE.GAP / 2;
    const topPipeHeight = gapCenterY - halfGap;
    const bottomPipeY = gapCenterY + halfGap;
    const bottomPipeHeight = GROUND.Y - bottomPipeY;

    // Generate textures once (cached by key)
    this.ensureTextures(scene, topPipeHeight, bottomPipeHeight);

    // Top pipe (flipped)
    this.top = scene.physics.add.image(x, topPipeHeight / 2, `pipe-top-${topPipeHeight}`);
    this.top.body.setAllowGravity(false);
    this.top.body.setImmovable(true);
    this.top.body.setVelocityX(-PIPE.SPEED);
    this.top.setDepth(5);

    // Bottom pipe
    this.bottom = scene.physics.add.image(x, bottomPipeY + bottomPipeHeight / 2, `pipe-bot-${bottomPipeHeight}`);
    this.bottom.body.setAllowGravity(false);
    this.bottom.body.setImmovable(true);
    this.bottom.body.setVelocityX(-PIPE.SPEED);
    this.bottom.setDepth(5);

    // Score zone (invisible trigger between pipes)
    this.scoreZone = scene.add.zone(x + PIPE.WIDTH / 2 + 2, gapCenterY, 4, PIPE.GAP);
    scene.physics.add.existing(this.scoreZone, false);
    this.scoreZone.body.setAllowGravity(false);
    this.scoreZone.body.setVelocityX(-PIPE.SPEED);
  }

  ensureTextures(scene, topH, botH) {
    const topKey = `pipe-top-${topH}`;
    const botKey = `pipe-bot-${botH}`;

    if (!scene.textures.exists(topKey)) {
      const g = scene.add.graphics();
      this.drawPipe(g, PIPE.WIDTH, topH, true);
      g.generateTexture(topKey, PIPE.WIDTH + PIPE.CAP_OVERHANG * 2, topH);
      g.destroy();
    }

    if (!scene.textures.exists(botKey)) {
      const g = scene.add.graphics();
      this.drawPipe(g, PIPE.WIDTH, botH, false);
      g.generateTexture(botKey, PIPE.WIDTH + PIPE.CAP_OVERHANG * 2, botH);
      g.destroy();
    }
  }

  drawPipe(gfx, width, height, flipped) {
    const capH = PIPE.CAP_HEIGHT;
    const overhang = PIPE.CAP_OVERHANG;
    const totalW = width + overhang * 2;

    // Pipe body
    gfx.fillStyle(PIPE.BODY_COLOR, 1);
    gfx.fillRect(overhang, 0, width, height);

    // Highlight stripe
    gfx.fillStyle(PIPE.HIGHLIGHT_COLOR, 1);
    gfx.fillRect(overhang + 4, 0, 6, height);

    // Dark edge
    gfx.fillStyle(PIPE.BODY_DARK, 1);
    gfx.fillRect(overhang + width - 6, 0, 6, height);

    // Cap
    const capY = flipped ? height - capH : 0;
    gfx.fillStyle(PIPE.CAP_COLOR, 1);
    gfx.fillRect(0, capY, totalW, capH);

    // Cap highlight
    gfx.fillStyle(PIPE.HIGHLIGHT_COLOR, 1);
    gfx.fillRect(2, capY + 2, 6, capH - 4);

    // Cap dark edge
    gfx.fillStyle(PIPE.BODY_DARK, 1);
    gfx.fillRect(totalW - 6, capY, 6, capH);
  }

  isOffScreen() {
    return this.top.x < -PIPE.WIDTH - 20;
  }

  destroy() {
    this.top.destroy();
    this.bottom.destroy();
    this.scoreZone.destroy();
  }
}

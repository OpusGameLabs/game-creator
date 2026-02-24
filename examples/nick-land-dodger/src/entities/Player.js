import Phaser from 'phaser';
import { PLAYER, GAME, PX, CHARACTER, EXPRESSION, EXPRESSION_HOLD_MS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

const C = CHARACTER;
const OL = C.OUTLINE;

/**
 * Nick Land player entity with South Park-style bobblehead body.
 * Giant photo head on a tiny cartoon body (dark sweater/pants philosopher outfit).
 * Uses a 4-frame expression spritesheet (normal, happy, angry, surprised).
 * Moves horizontally at the bottom of the screen.
 */
export class Player {
  constructor(scene) {
    this.scene = scene;
    this.currentExpression = EXPRESSION.NORMAL;
    this._expressionTimer = null;
    this._facingLeft = false;

    const x = PLAYER.START_X;
    const y = PLAYER.START_Y;

    // Create the container as the root physics object
    this.container = scene.add.container(x, y);

    // Draw the body (stubby bobblehead proportions)
    this.bodyGfx = scene.add.graphics();
    this.drawBody(this.bodyGfx);

    // Arms as separate graphics (layered behind body)
    this.leftArmGfx = scene.add.graphics();
    this.rightArmGfx = scene.add.graphics();
    this.drawArm(this.leftArmGfx, -1);
    this.drawArm(this.rightArmGfx, 1);

    // Position arms pinned to shoulders
    const armX = C.SHOULDER_W * 0.5 + C.UPPER_ARM_W * 0.1;
    const armY = -C.TORSO_H * 0.38;
    this.leftArmGfx.setPosition(-armX, armY);
    this.rightArmGfx.setPosition(armX, armY);

    // Head -- spritesheet with 4 expression frames
    const headY = -C.TORSO_H * 0.5 - C.NECK_H - C.HEAD_H * 0.35;
    this.headSprite = scene.add.sprite(0, headY, 'nick-land', EXPRESSION.NORMAL);

    // Scale head to bobblehead size, preserving aspect ratio
    const headScale = C.HEAD_H / C.FRAME_H;
    this.headSprite.setScale(headScale);

    // Layer order: arms behind body, head on top
    this.container.add([
      this.leftArmGfx,
      this.rightArmGfx,
      this.bodyGfx,
      this.headSprite,
    ]);

    // Enable physics on the container
    scene.physics.world.enable(this.container);
    const bodyW = PLAYER.WIDTH * 0.7;
    const bodyH = PLAYER.HEIGHT * 0.85;
    this.container.body.setSize(bodyW, bodyH);
    // Offset so the physics body is centered on the visible character
    this.container.body.setOffset(-bodyW * 0.5, -C.HEAD_H * 0.7);
    this.container.body.setCollideWorldBounds(true);
    this.container.body.setAllowGravity(false);

    // Depth: gameplay entities at 0+
    this.container.setDepth(1);

    // Idle breathing bob
    this.bobTween = scene.tweens.add({
      targets: this.container,
      y: y - 2 * PX,
      duration: 1400 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // --- Body Drawing ---

  /**
   * Draw the torso, legs, shoes, collar, and neck using Graphics.
   * Nick Land wears a dark casual outfit (sweater, no tie, no lapels).
   */
  drawBody(g) {
    g.clear();

    const suit = C.SUIT;
    const suitL = C.SUIT_LIGHT;
    const shirt = C.SHIRT;
    const pants = C.PANTS;
    const shoes = C.SHOES;
    const skin = C.SKIN;

    // === SHOES (bottom) ===
    const shoeY = C.TORSO_H * 0.5 + C.LEG_H;
    g.fillStyle(shoes);
    g.lineStyle(OL, 0x000000);
    g.fillRoundedRect(-C.LEG_GAP - C.SHOE_W, shoeY - C.SHOE_H * 0.3, C.SHOE_W, C.SHOE_H, C.SHOE_H * 0.3);
    g.strokeRoundedRect(-C.LEG_GAP - C.SHOE_W, shoeY - C.SHOE_H * 0.3, C.SHOE_W, C.SHOE_H, C.SHOE_H * 0.3);
    g.fillRoundedRect(C.LEG_GAP, shoeY - C.SHOE_H * 0.3, C.SHOE_W, C.SHOE_H, C.SHOE_H * 0.3);
    g.strokeRoundedRect(C.LEG_GAP, shoeY - C.SHOE_H * 0.3, C.SHOE_W, C.SHOE_H, C.SHOE_H * 0.3);

    // === LEGS (pants) ===
    const legTop = C.TORSO_H * 0.5 - C.U;
    g.fillStyle(pants);
    g.lineStyle(OL, 0x000000);
    g.fillRoundedRect(-C.LEG_GAP - C.LEG_W, legTop, C.LEG_W, C.LEG_H + C.U, C.U * 0.5);
    g.strokeRoundedRect(-C.LEG_GAP - C.LEG_W, legTop, C.LEG_W, C.LEG_H + C.U, C.U * 0.5);
    g.fillRoundedRect(C.LEG_GAP, legTop, C.LEG_W, C.LEG_H + C.U, C.U * 0.5);
    g.strokeRoundedRect(C.LEG_GAP, legTop, C.LEG_W, C.LEG_H + C.U, C.U * 0.5);

    // === TORSO (sweater -- trapezoidal, smaller for bobblehead) ===
    g.fillStyle(suit);
    g.lineStyle(OL, 0x000000);
    g.beginPath();
    const sW = C.SHOULDER_W * 0.5;
    const wW = C.WAIST_W * 0.5;
    const tH = C.TORSO_H * 0.5;
    g.moveTo(-sW, -tH);
    g.lineTo(sW, -tH);
    g.lineTo(sW, -tH + C.U * 1.2);
    g.lineTo(wW + C.U * 0.5, tH * 0.3);
    g.lineTo(wW, tH);
    g.lineTo(-wW, tH);
    g.lineTo(-wW - C.U * 0.5, tH * 0.3);
    g.lineTo(-sW, -tH + C.U * 1.2);
    g.closePath();
    g.fillPath();
    g.strokePath();

    // === SWEATER DETAIL -- lighter panel for depth ===
    g.fillStyle(suitL);
    g.beginPath();
    const pW = C.SHOULDER_W * 0.15;
    g.moveTo(-sW + C.U * 0.5, -tH + C.U * 0.3);
    g.lineTo(-pW, -tH + C.U * 0.3);
    g.lineTo(-pW, tH - C.U * 0.5);
    g.lineTo(-wW + C.U * 0.5, tH - C.U * 0.5);
    g.lineTo(-wW - C.U * 0.3, tH * 0.3);
    g.lineTo(-sW + C.U * 0.5, -tH + C.U * 1.5);
    g.closePath();
    g.fillPath();

    // === COLLAR V-NECK (visible dark shirt underneath sweater) ===
    g.fillStyle(shirt);
    g.lineStyle(OL, 0x000000);
    g.beginPath();
    g.moveTo(-C.NECK_W * 0.7, -tH);
    g.lineTo(C.NECK_W * 0.7, -tH);
    g.lineTo(C.U * 0.6, -tH + C.U * 1.8);
    g.lineTo(0, -tH + C.U * 2.2);
    g.lineTo(-C.U * 0.6, -tH + C.U * 1.8);
    g.closePath();
    g.fillPath();
    g.strokePath();

    // === NECK ===
    g.fillStyle(skin);
    g.lineStyle(OL, 0x000000);
    g.fillRoundedRect(-C.NECK_W * 0.5, -tH - C.NECK_H, C.NECK_W, C.NECK_H + C.U * 0.5, C.U * 0.3);
    g.strokeRoundedRect(-C.NECK_W * 0.5, -tH - C.NECK_H, C.NECK_W, C.NECK_H + C.U * 0.5, C.U * 0.3);
  }

  /**
   * Draw one arm (sweater sleeve + mitten hand).
   * @param {Phaser.GameObjects.Graphics} g
   * @param {number} side - -1 for left, 1 for right
   */
  drawArm(g, side) {
    g.clear();

    // Upper arm (sweater sleeve)
    g.fillStyle(C.SUIT);
    g.lineStyle(OL, 0x000000);
    g.fillRoundedRect(-C.UPPER_ARM_W * 0.5, 0, C.UPPER_ARM_W, C.UPPER_ARM_H, C.U * 0.4);
    g.strokeRoundedRect(-C.UPPER_ARM_W * 0.5, 0, C.UPPER_ARM_W, C.UPPER_ARM_H, C.U * 0.4);

    // Hand (mitten shape -- South Park style, no cuff needed for a sweater)
    g.fillStyle(C.SKIN);
    g.lineStyle(OL, 0x000000);
    const handY = C.UPPER_ARM_H + C.U * 0.1;
    g.fillRoundedRect(-C.HAND_W * 0.5, handY, C.HAND_W, C.HAND_H, C.HAND_H * 0.4);
    g.strokeRoundedRect(-C.HAND_W * 0.5, handY, C.HAND_W, C.HAND_H, C.HAND_H * 0.4);
  }

  // --- Expression System ---

  /**
   * Change the displayed expression frame.
   * Automatically reverts to NORMAL after holdMs.
   * Includes squash-stretch juice on expression change.
   * @param {number} expression - Frame index from EXPRESSION constants
   * @param {number} [holdMs=EXPRESSION_HOLD_MS] - Duration to hold before reverting
   */
  setExpression(expression, holdMs = EXPRESSION_HOLD_MS) {
    // Clear any pending revert timer
    if (this._expressionTimer) {
      this.scene.time.removeEvent(this._expressionTimer);
      this._expressionTimer = null;
    }

    this.currentExpression = expression;
    this.headSprite.setFrame(expression);

    // Squash-stretch juice on expression change
    if (expression !== EXPRESSION.NORMAL) {
      this.scene.tweens.add({
        targets: this.headSprite,
        scaleX: this.headSprite.scaleX * 1.15,
        scaleY: this.headSprite.scaleY * 0.9,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }

    // Auto-revert to normal after hold duration (unless already normal)
    if (expression !== EXPRESSION.NORMAL) {
      this._expressionTimer = this.scene.time.delayedCall(holdMs, () => {
        this.currentExpression = EXPRESSION.NORMAL;
        this.headSprite.setFrame(EXPRESSION.NORMAL);
        this._expressionTimer = null;
      });
    }
  }

  // --- Movement ---

  update(left, right) {
    const body = this.container.body;

    // Horizontal movement only
    if (left) {
      body.setVelocityX(-PLAYER.SPEED);
      if (!this._facingLeft) {
        this.container.setScale(-1, 1);
        this._facingLeft = true;
      }
      eventBus.emit(Events.SPECTACLE_ACTION, { direction: 'left' });
    } else if (right) {
      body.setVelocityX(PLAYER.SPEED);
      if (this._facingLeft) {
        this.container.setScale(1, 1);
        this._facingLeft = false;
      }
      eventBus.emit(Events.SPECTACLE_ACTION, { direction: 'right' });
    } else {
      body.setVelocityX(0);
    }

    // No vertical movement -- player stays at bottom
    body.setVelocityY(0);
  }

  // --- Reset / Destroy ---

  reset() {
    this.container.setPosition(PLAYER.START_X, PLAYER.START_Y);
    this.container.body.setVelocity(0, 0);
    this.container.setScale(1, 1);
    this._facingLeft = false;
    this.setExpression(EXPRESSION.NORMAL);
  }

  destroy() {
    if (this._expressionTimer) {
      this.scene.time.removeEvent(this._expressionTimer);
      this._expressionTimer = null;
    }
    if (this.bobTween) {
      this.bobTween.destroy();
      this.bobTween = null;
    }
    this.container.destroy();
  }
}

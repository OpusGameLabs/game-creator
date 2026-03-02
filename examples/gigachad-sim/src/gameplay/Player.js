// =============================================================================
// Player.js — GigaChad character
// Large imposing figure: broad shoulders, small head, massive arms.
// Built from primitives (wide torso, thick limbs, skin tone + dark hair).
// Entrance animation: slides in from off-screen with a bounce.
// =============================================================================

import * as THREE from 'three';
import { PLAYER, ARENA, SPECTACLE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

const _tmpVec = new THREE.Vector3();

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.mesh.position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.ENTRANCE_START_Z);
    this.scene.add(this.mesh);

    this._buildModel();

    // Entrance animation state
    this._entranceTime = 0;
    this._isEntering = true;

    // Lift animation
    this._liftAnimTimer = 0;
    this._isLifting = false;

    // Flex animation
    this._flexTimer = 0;
    this._isFlexing = false;

    // Scale pop effect
    this._popTimer = 0;
    this._baseScale = 1;

    // Emit entrance event
    eventBus.emit(Events.SPECTACLE_ENTRANCE);
  }

  _buildModel() {
    // GigaChad is built from box/cylinder primitives
    // Proportions: very wide torso, thick arms, small head, massive overall

    const skinMat = new THREE.MeshLambertMaterial({ color: PLAYER.SKIN_COLOR });
    const hairMat = new THREE.MeshLambertMaterial({ color: PLAYER.HAIR_COLOR });
    const shortsMat = new THREE.MeshLambertMaterial({ color: PLAYER.SHORTS_COLOR });
    const shoeMat = new THREE.MeshLambertMaterial({ color: PLAYER.SHOE_COLOR });

    // Torso — wide and thick
    const torsoGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.8, PLAYER.HEIGHT * 0.35, PLAYER.DEPTH);
    const torso = new THREE.Mesh(torsoGeo, skinMat);
    torso.position.y = PLAYER.HEIGHT * 0.55;
    this.mesh.add(torso);

    // Chest (slightly wider at top)
    const chestGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.85, PLAYER.HEIGHT * 0.15, PLAYER.DEPTH * 1.1);
    const chest = new THREE.Mesh(chestGeo, skinMat);
    chest.position.y = PLAYER.HEIGHT * 0.7;
    this.mesh.add(chest);

    // Head — small relative to body (the GigaChad look)
    const headGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.25, PLAYER.HEIGHT * 0.15, PLAYER.DEPTH * 0.7);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = PLAYER.HEIGHT * 0.88;
    this.mesh.add(head);

    // Hair
    const hairGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.27, PLAYER.HEIGHT * 0.06, PLAYER.DEPTH * 0.75);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = PLAYER.HEIGHT * 0.96;
    this.mesh.add(hair);

    // Left arm — thick
    this.leftArm = new THREE.Group();
    const upperArmGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.2, PLAYER.HEIGHT * 0.25, PLAYER.DEPTH * 0.6);
    const leftUpper = new THREE.Mesh(upperArmGeo, skinMat);
    leftUpper.position.y = -PLAYER.HEIGHT * 0.1;
    this.leftArm.add(leftUpper);
    const leftForeGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.18, PLAYER.HEIGHT * 0.2, PLAYER.DEPTH * 0.5);
    const leftFore = new THREE.Mesh(leftForeGeo, skinMat);
    leftFore.position.y = -PLAYER.HEIGHT * 0.3;
    this.leftArm.add(leftFore);
    this.leftArm.position.set(-PLAYER.WIDTH * 0.55, PLAYER.HEIGHT * 0.65, 0);
    this.mesh.add(this.leftArm);

    // Right arm — thick
    this.rightArm = new THREE.Group();
    const rightUpper = new THREE.Mesh(upperArmGeo.clone(), skinMat);
    rightUpper.position.y = -PLAYER.HEIGHT * 0.1;
    this.rightArm.add(rightUpper);
    const rightFore = new THREE.Mesh(leftForeGeo.clone(), skinMat);
    rightFore.position.y = -PLAYER.HEIGHT * 0.3;
    this.rightArm.add(rightFore);
    this.rightArm.position.set(PLAYER.WIDTH * 0.55, PLAYER.HEIGHT * 0.65, 0);
    this.mesh.add(this.rightArm);

    // Shorts / legs
    const legGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.25, PLAYER.HEIGHT * 0.25, PLAYER.DEPTH * 0.6);
    const leftLeg = new THREE.Mesh(legGeo, shortsMat);
    leftLeg.position.set(-PLAYER.WIDTH * 0.2, PLAYER.HEIGHT * 0.2, 0);
    this.mesh.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo.clone(), shortsMat);
    rightLeg.position.set(PLAYER.WIDTH * 0.2, PLAYER.HEIGHT * 0.2, 0);
    this.mesh.add(rightLeg);

    // Lower legs (skin)
    const lowerLegGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.2, PLAYER.HEIGHT * 0.15, PLAYER.DEPTH * 0.55);
    const leftLower = new THREE.Mesh(lowerLegGeo, skinMat);
    leftLower.position.set(-PLAYER.WIDTH * 0.2, PLAYER.HEIGHT * 0.07, 0);
    this.mesh.add(leftLower);

    const rightLower = new THREE.Mesh(lowerLegGeo.clone(), skinMat);
    rightLower.position.set(PLAYER.WIDTH * 0.2, PLAYER.HEIGHT * 0.07, 0);
    this.mesh.add(rightLower);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.22, PLAYER.HEIGHT * 0.05, PLAYER.DEPTH * 0.7);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-PLAYER.WIDTH * 0.2, PLAYER.HEIGHT * 0.02, 0);
    this.mesh.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeo.clone(), shoeMat);
    rightShoe.position.set(PLAYER.WIDTH * 0.2, PLAYER.HEIGHT * 0.02, 0);
    this.mesh.add(rightShoe);

    // Store arm rest rotations
    this._armRestRotZ = 0;
    this._armLiftRotZ = -Math.PI * 0.35; // arms up for lifting pose
    this._armFlexRotZ = -Math.PI * 0.55; // arms up and bent for flex
  }

  update(delta, input) {
    // Entrance animation
    if (this._isEntering) {
      this._entranceTime += delta;
      const t = Math.min(this._entranceTime / PLAYER.ENTRANCE_DURATION, 1);

      // Smooth ease-out
      const ease = 1 - Math.pow(1 - t, 3);
      const targetZ = PLAYER.START_Z;
      this.mesh.position.z = PLAYER.ENTRANCE_START_Z + (targetZ - PLAYER.ENTRANCE_START_Z) * ease;

      // Bounce on Y
      const bounce = Math.sin(t * Math.PI) * PLAYER.ENTRANCE_BOUNCE_HEIGHT;
      this.mesh.position.y = bounce;

      if (t >= 1) {
        this._isEntering = false;
        this.mesh.position.z = targetZ;
        this.mesh.position.y = PLAYER.START_Y;
        gameState.entranceDone = true;
      }
      return;
    }

    // Movement — left/right only
    if (!gameState.gameOver) {
      const moveAmount = input.moveX * PLAYER.SPEED * delta;
      this.mesh.position.x += moveAmount;

      // Clamp to arena bounds
      const halfBound = ARENA.HALF_WIDTH - PLAYER.WIDTH * 0.5;
      this.mesh.position.x = Math.max(-halfBound, Math.min(halfBound, this.mesh.position.x));

      if (Math.abs(input.moveX) > 0.1) {
        eventBus.emit(Events.PLAYER_MOVE, { x: this.mesh.position.x });
        eventBus.emit(Events.SPECTACLE_ACTION);
      }

      // Handle flex
      if (input.flexPressed && !this._isFlexing && !this._isLifting) {
        this._startFlex();
        input.consumeFlex();
        eventBus.emit(Events.PLAYER_FLEX);
        eventBus.emit(Events.SPECTACLE_ACTION);
      }
    }

    // Update flex timer
    if (this._isFlexing) {
      this._flexTimer -= delta;
      if (this._flexTimer <= 0) {
        this._isFlexing = false;
        gameState.isFlexing = false;
      }
    }

    // Update lift animation
    if (this._isLifting) {
      this._liftAnimTimer -= delta;
      if (this._liftAnimTimer <= 0) {
        this._isLifting = false;
      }
    }

    // Scale pop effect (juice)
    if (this._popTimer > 0) {
      this._popTimer -= delta;
      const popT = this._popTimer / SPECTACLE.CATCH_POP_DURATION;
      const s = this._baseScale + (SPECTACLE.CATCH_SCALE_POP - this._baseScale) * popT;
      this.mesh.scale.setScalar(s);
    } else {
      this.mesh.scale.setScalar(this._baseScale);
    }

    // Arm animations
    this._updateArms(delta);
  }

  _updateArms(delta) {
    let targetRotZ = this._armRestRotZ;
    if (this._isLifting) {
      targetRotZ = this._armLiftRotZ;
    } else if (this._isFlexing) {
      targetRotZ = this._armFlexRotZ;
    }

    // Smooth arm rotation
    const speed = 8;
    if (this.leftArm) {
      this.leftArm.rotation.z += (targetRotZ - this.leftArm.rotation.z) * speed * 0.016;
    }
    if (this.rightArm) {
      this.rightArm.rotation.z += (-targetRotZ - this.rightArm.rotation.z) * speed * 0.016;
    }
  }

  _startFlex() {
    this._isFlexing = true;
    this._flexTimer = PLAYER.FLEX_DURATION;
    gameState.isFlexing = true;
    gameState.flexTimer = PLAYER.FLEX_DURATION;
  }

  triggerLift() {
    this._isLifting = true;
    this._liftAnimTimer = PLAYER.FLEX_DURATION;
    // Scale pop
    this._popTimer = SPECTACLE.CATCH_POP_DURATION;
  }

  getPosition() {
    return this.mesh.position;
  }

  reset() {
    this.mesh.position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.START_Z);
    this._isEntering = false;
    this._isLifting = false;
    this._isFlexing = false;
    this.mesh.scale.setScalar(1);
    gameState.entranceDone = true;
  }

  destroy() {
    this.mesh.traverse((c) => {
      if (c.isMesh) {
        c.geometry.dispose();
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
    });
    this.scene.remove(this.mesh);
  }
}

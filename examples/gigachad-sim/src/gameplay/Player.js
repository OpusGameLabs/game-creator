// =============================================================================
// Player.js — GigaChad character
// Loads rigged GLB model with walk/run animations via SkeletonUtils.clone().
// Falls back to primitive box model if GLB loading fails.
// =============================================================================

import * as THREE from 'three';
import { PLAYER, ARENA, SPECTACLE, MODELS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { loadAnimatedModel } from '../level/AssetLoader.js';

const _tmpVec = new THREE.Vector3();

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.mesh.position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.ENTRANCE_START_Z);
    this.scene.add(this.mesh);

    // Animation state
    this._mixer = null;
    this._actions = {};    // { idle: Action, walk: Action, run: Action }
    this._activeAction = null;
    this._modelLoaded = false;

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

    // Primitive arm refs (only used in fallback)
    this.leftArm = null;
    this.rightArm = null;
    this._armRestRotZ = 0;
    this._armLiftRotZ = -Math.PI * 0.35;
    this._armFlexRotZ = -Math.PI * 0.55;

    // Try loading GLB model, fall back to primitives
    this._loadGLBModel().catch((err) => {
      console.warn('GigaChad GLB failed to load, using primitive fallback:', err.message);
      this._buildPrimitiveModel();
    });

    // Emit entrance event
    eventBus.emit(Events.SPECTACLE_ENTRANCE);
  }

  async _loadGLBModel() {
    const cfg = MODELS.GIGACHAD;

    // Load main model (has skeleton + possibly idle animation)
    const { model, clips } = await loadAnimatedModel(cfg.path);
    console.log('GigaChad base clips:', clips.map(c => c.name));

    // SkinnedMesh bounding boxes are unreliable (bind-pose vertices near origin).
    // Instead, compute bounds from the raw geometry positions of all child meshes.
    let minY = Infinity, maxY = -Infinity;
    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.geometry.computeBoundingBox();
        const gb = child.geometry.boundingBox;
        if (gb) {
          // Account for the child's local position offset
          minY = Math.min(minY, gb.min.y + child.position.y);
          maxY = Math.max(maxY, gb.max.y + child.position.y);
        }
      }
    });
    const geoHeight = maxY - minY;
    console.log('GigaChad geometry height:', geoHeight.toFixed(3), 'minY:', minY.toFixed(3));

    // Scale to target height
    const targetHeight = PLAYER.HEIGHT;
    const scaleFactor = geoHeight > 0.01 ? (targetHeight / geoHeight) * cfg.scale : cfg.scale;
    model.scale.setScalar(scaleFactor);
    console.log('GigaChad scale factor:', scaleFactor.toFixed(2));

    // Align feet to floor after scaling
    model.position.y = -minY * scaleFactor;

    // Face the camera (Meshy models typically face +Z)
    model.rotation.y = cfg.rotationY;

    // Fix PBR materials — Meshy exports MeshPhysicalMaterial that appears black
    // without environment maps. Convert to Lambert for reliable scene lighting.
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material;
        if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
          const newMat = new THREE.MeshLambertMaterial({
            color: mat.color ?? new THREE.Color(PLAYER.SKIN_COLOR),
            map: mat.map,
          });
          child.material = newMat;
          mat.dispose();
        }
      }
    });

    this.mesh.add(model);
    this._glbModel = model;

    // Set up animation mixer
    this._mixer = new THREE.AnimationMixer(model);

    // Collect all clips from the base model (may contain idle/T-pose)
    const allClips = [...clips];

    // Load walk animation from separate GLB
    try {
      const walkData = await loadAnimatedModel(cfg.walkPath);
      console.log('GigaChad walk clips:', walkData.clips.map(c => c.name));
      allClips.push(...walkData.clips.map(c => {
        c.name = 'walk_' + c.name;
        return c;
      }));

      // Use the first clip from the walk file as the walk action
      if (walkData.clips.length > 0) {
        const walkAction = this._mixer.clipAction(walkData.clips[0]);
        this._actions.walk = walkAction;
      }
    } catch (err) {
      console.warn('Walk animation failed to load:', err.message);
    }

    // Load run animation from separate GLB
    try {
      const runData = await loadAnimatedModel(cfg.runPath);
      console.log('GigaChad run clips:', runData.clips.map(c => c.name));

      if (runData.clips.length > 0) {
        const runAction = this._mixer.clipAction(runData.clips[0]);
        this._actions.run = runAction;
      }
    } catch (err) {
      console.warn('Run animation failed to load:', err.message);
    }

    // Use base model clips for idle (first clip if available)
    if (clips.length > 0) {
      const idleAction = this._mixer.clipAction(clips[0]);
      this._actions.idle = idleAction;
      // Start with idle
      idleAction.play();
      this._activeAction = idleAction;
    }

    this._modelLoaded = true;
    console.log('GigaChad GLB model loaded successfully. Actions:', Object.keys(this._actions));
  }

  _buildPrimitiveModel() {
    // GigaChad is built from box/cylinder primitives (fallback)
    const skinMat = new THREE.MeshLambertMaterial({ color: PLAYER.SKIN_COLOR });
    const hairMat = new THREE.MeshLambertMaterial({ color: PLAYER.HAIR_COLOR });
    const shortsMat = new THREE.MeshLambertMaterial({ color: PLAYER.SHORTS_COLOR });
    const shoeMat = new THREE.MeshLambertMaterial({ color: PLAYER.SHOE_COLOR });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.8, PLAYER.HEIGHT * 0.35, PLAYER.DEPTH);
    const torso = new THREE.Mesh(torsoGeo, skinMat);
    torso.position.y = PLAYER.HEIGHT * 0.55;
    this.mesh.add(torso);

    // Chest
    const chestGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.85, PLAYER.HEIGHT * 0.15, PLAYER.DEPTH * 1.1);
    const chest = new THREE.Mesh(chestGeo, skinMat);
    chest.position.y = PLAYER.HEIGHT * 0.7;
    this.mesh.add(chest);

    // Head
    const headGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.25, PLAYER.HEIGHT * 0.15, PLAYER.DEPTH * 0.7);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = PLAYER.HEIGHT * 0.88;
    this.mesh.add(head);

    // Hair
    const hairGeo = new THREE.BoxGeometry(PLAYER.WIDTH * 0.27, PLAYER.HEIGHT * 0.06, PLAYER.DEPTH * 0.75);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = PLAYER.HEIGHT * 0.96;
    this.mesh.add(hair);

    // Left arm
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

    // Right arm
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

    // Lower legs
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
  }

  /**
   * Smooth transition between animation actions (fadeToAction pattern).
   */
  _fadeToAction(name, duration = 0.3) {
    if (!this._actions[name] || this._activeAction === this._actions[name]) return;

    const next = this._actions[name];
    if (this._activeAction) {
      this._activeAction.fadeOut(duration);
    }
    next.reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();
    this._activeAction = next;
  }

  update(delta, input) {
    // Update animation mixer
    if (this._mixer) {
      this._mixer.update(delta);
    }

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
    const isMoving = !gameState.gameOver && Math.abs(input.moveX) > 0.1;

    if (!gameState.gameOver) {
      const moveAmount = input.moveX * PLAYER.SPEED * delta;
      this.mesh.position.x += moveAmount;

      // Clamp to arena bounds
      const halfBound = ARENA.HALF_WIDTH - PLAYER.WIDTH * 0.5;
      this.mesh.position.x = Math.max(-halfBound, Math.min(halfBound, this.mesh.position.x));

      if (isMoving) {
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

    // Animation transitions (GLB model)
    if (this._modelLoaded && this._mixer) {
      if (isMoving) {
        // Switch to walk animation when moving
        this._fadeToAction('walk');
      } else {
        // Switch back to idle when stationary
        this._fadeToAction('idle');
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

    // Arm animations (primitive fallback only)
    if (!this._modelLoaded) {
      this._updateArms(delta);
    }
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

    // Reset animation to idle
    if (this._modelLoaded && this._actions.idle) {
      this._fadeToAction('idle', 0.1);
    }
  }

  destroy() {
    // Stop mixer
    if (this._mixer) {
      this._mixer.stopAllAction();
      this._mixer = null;
    }

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

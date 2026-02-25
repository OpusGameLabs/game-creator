import * as THREE from 'three';
import { PLAYER, CHARACTER } from '../core/Constants.js';
import { loadAnimatedModel } from '../level/AssetLoader.js';

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;
    this.model = null;
    this.ready = false;

    // Group is the position anchor — camera follows this
    this.mesh = new THREE.Group();
    this.mesh.position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.START_Z);
    this.scene.add(this.mesh);

    this._loadModel();
  }

  async _loadModel() {
    try {
      const { model, clips } = await loadAnimatedModel(CHARACTER.path);
      model.scale.setScalar(CHARACTER.scale);
      model.position.y = CHARACTER.offsetY;

      this.model = model;
      this.mesh.add(model);

      // Set up mixer
      this.mixer = new THREE.AnimationMixer(model);
      for (const clip of clips) {
        this.actions[clip.name] = this.mixer.clipAction(clip);
      }

      // Start idle
      const idleClip = CHARACTER.clipMap.idle;
      if (this.actions[idleClip]) {
        this.actions[idleClip].play();
        this.activeAction = this.actions[idleClip];
      }

      this.ready = true;
      console.log('Player animations:', Object.keys(this.actions).join(', '));
    } catch (err) {
      console.warn('Player model failed, using fallback:', err.message);
      // Fallback: colored box
      const geo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
      const mat = new THREE.MeshLambertMaterial({ color: PLAYER.COLOR });
      const box = new THREE.Mesh(geo, mat);
      box.castShadow = true;
      box.position.y = 0.9;
      this.mesh.add(box);
      this.ready = true;
    }
  }

  fadeToAction(key, duration = 0.3) {
    const clipName = CHARACTER.clipMap[key];
    const next = this.actions[clipName];
    if (!next || next === this.activeAction) return;

    if (this.activeAction) this.activeAction.fadeOut(duration);
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();
    this.activeAction = next;
  }

  /**
   * @param {number} delta
   * @param {InputSystem} input
   * @param {number} cameraAzimuth — from OrbitControls.getAzimuthalAngle()
   */
  update(delta, input, cameraAzimuth) {
    if (this.mixer) this.mixer.update(delta);
    if (!this.ready) return;

    let ix = 0, iz = 0;
    if (input.forward) iz -= 1;
    if (input.backward) iz += 1;
    if (input.left) ix -= 1;
    if (input.right) ix += 1;

    const isMoving = ix !== 0 || iz !== 0;

    if (isMoving) {
      // Camera-relative movement
      _v.set(ix, 0, iz).normalize();
      _v.applyAxisAngle(_up, cameraAzimuth);

      this.mesh.position.addScaledVector(_v, PLAYER.SPEED * delta);

      // Rotate model to face movement direction
      if (this.model) {
        const angle = Math.atan2(_v.x, _v.z) + (CHARACTER.facingOffset || 0);
        _q.setFromAxisAngle(_up, angle);
        this.model.quaternion.rotateTowards(_q, PLAYER.TURN_SPEED * delta);
      }

      this.fadeToAction(input.shift ? 'run' : 'walk');
    } else {
      this.fadeToAction('idle');
    }
  }

  reset() {
    this.mesh.position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.START_Z);
  }

  destroy() {
    if (this.mixer) this.mixer.stopAllAction();
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

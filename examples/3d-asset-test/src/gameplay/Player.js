import * as THREE from 'three';
import { PLAYER, CHARACTERS } from '../core/Constants.js';
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
    this.charIndex = 0;
    this.clipMap = null;
    this.facingOffset = 0;

    // Group is the position anchor — camera follows this
    this.group = new THREE.Group();
    this.group.position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.START_Z);
    this.scene.add(this.group);
    this.mesh = this.group; // backward compat

    this._loadCharacter(0);

    // C key to cycle characters
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyC') this.cycleCharacter();
    });
  }

  async _loadCharacter(index) {
    const charDef = CHARACTERS[index];
    this.ready = false;

    // Remove old model
    if (this.model) {
      if (this.mixer) this.mixer.stopAllAction();
      this.group.remove(this.model);
      this.model.traverse((c) => {
        if (c.isMesh) {
          c.geometry.dispose();
          if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
          else c.material.dispose();
        }
      });
      this.model = null;
      this.mixer = null;
      this.actions = {};
      this.activeAction = null;
    }

    try {
      const { model, clips } = await loadAnimatedModel(charDef.path);
      model.scale.setScalar(charDef.scale);
      model.position.y = charDef.offsetY;

      this.model = model;
      this.clipMap = charDef.clipMap;
      this.facingOffset = charDef.facingOffset || 0;
      this.group.add(model);

      // Set up mixer + actions
      this.mixer = new THREE.AnimationMixer(model);
      for (const clip of clips) {
        this.actions[clip.name] = this.mixer.clipAction(clip);
      }

      // Start idle
      const idleClip = charDef.clipMap.idle;
      if (this.actions[idleClip]) {
        this.actions[idleClip].play();
        this.activeAction = this.actions[idleClip];
      }

      this.charIndex = index;
      this.ready = true;
      console.log(`Switched to: ${charDef.name} (${clips.map(c => c.name).join(', ')})`);
    } catch (err) {
      console.warn(`Failed to load ${charDef.name}:`, err.message);
    }
  }

  cycleCharacter() {
    const next = (this.charIndex + 1) % CHARACTERS.length;
    this._loadCharacter(next);
  }

  get characterName() {
    return CHARACTERS[this.charIndex]?.name || '?';
  }

  fadeToAction(key, duration = 0.3) {
    if (!this.clipMap) return;
    const clipName = this.clipMap[key];
    const next = this.actions[clipName];
    if (!next || next === this.activeAction) return;

    if (this.activeAction) this.activeAction.fadeOut(duration);
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();
    this.activeAction = next;
  }

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
      _v.set(ix, 0, iz).normalize();
      _v.applyAxisAngle(_up, cameraAzimuth);

      this.group.position.addScaledVector(_v, PLAYER.SPEED * delta);

      // Rotate model to face movement direction (offset varies per model)
      const angle = Math.atan2(_v.x, _v.z) + this.facingOffset;
      _q.setFromAxisAngle(_up, angle);
      this.model.quaternion.rotateTowards(_q, PLAYER.TURN_SPEED * delta);

      this.fadeToAction(input.shift ? 'run' : 'walk');
    } else {
      this.fadeToAction('idle');
    }
  }

  reset() {
    this.group.position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.START_Z);
  }

  destroy() {
    if (this.mixer) this.mixer.stopAllAction();
    this.group.traverse((c) => {
      if (c.isMesh) {
        c.geometry.dispose();
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
    });
    this.scene.remove(this.group);
  }
}

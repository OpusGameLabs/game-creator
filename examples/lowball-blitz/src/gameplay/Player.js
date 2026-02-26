import * as THREE from 'three';
import { PLAYER, CHARACTER, STREET, ENVELOPE, GAMEPLAY } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { loadAnimatedModel } from '../level/AssetLoader.js';
import { Envelope } from '../entities/Envelope.js';

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

    // Throwing
    this.envelopes = [];
    this._throwCooldown = 0;
    this._throwAnimTimer = 0;
    this._isThrowAnim = false;

    // Invincibility
    this._invincibleTimer = 0;
    this._flashAccum = 0;

    // Group is the position anchor -- camera follows this
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

      // Start running (auto-runner)
      const runClip = CHARACTER.clipMap.run;
      if (this.actions[runClip]) {
        this.actions[runClip].play();
        this.activeAction = this.actions[runClip];
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

  throwEnvelope() {
    if (this._throwCooldown > 0) return;
    if (gameState.gameOver) return;

    this._throwCooldown = ENVELOPE.COOLDOWN;
    gameState.totalThrown++;

    // Create envelope flying forward (negative Z)
    const dir = new THREE.Vector3(0, 0, -1);
    const envelope = new Envelope(this.mesh.position, dir);
    this.scene.add(envelope.mesh);
    this.envelopes.push(envelope);

    // Play throw (Punch) animation briefly
    this._isThrowAnim = true;
    this._throwAnimTimer = GAMEPLAY.THROW_ANIMATION_DURATION;
    this.fadeToAction('throw', 0.1);

    eventBus.emit(Events.ENVELOPE_THROWN, {
      x: this.mesh.position.x,
      z: this.mesh.position.z,
    });
    eventBus.emit(Events.SPECTACLE_ACTION, { type: 'throw' });
  }

  takeDamage() {
    if (this._invincibleTimer > 0) return;

    const isDead = gameState.loseLife();
    this._invincibleTimer = PLAYER.INVINCIBILITY_DURATION;
    this._flashAccum = 0;

    eventBus.emit(Events.PLAYER_HIT, { lives: gameState.lives });
    eventBus.emit(Events.LIVES_CHANGED, { lives: gameState.lives });

    if (isDead) {
      eventBus.emit(Events.PLAYER_DIED);
      gameState.gameOver = true;
      eventBus.emit(Events.GAME_OVER, {
        score: gameState.score,
        housesHit: gameState.housesHit,
        bestCombo: gameState.bestCombo,
      });
    }
  }

  update(delta, input) {
    if (this.mixer) this.mixer.update(delta);
    if (!this.ready) return;

    // Throw cooldown
    if (this._throwCooldown > 0) {
      this._throwCooldown -= delta;
    }

    // Throw animation timer -- return to run after throw completes
    if (this._isThrowAnim) {
      this._throwAnimTimer -= delta;
      if (this._throwAnimTimer <= 0) {
        this._isThrowAnim = false;
        this.fadeToAction('run', 0.2);
      }
    }

    // Auto-run forward (negative Z direction)
    this.mesh.position.z -= gameState.currentSpeed * delta;

    // Left/right lane movement
    let ix = 0;
    if (input.left) ix -= 1;
    if (input.right) ix += 1;

    if (ix !== 0) {
      this.mesh.position.x += ix * PLAYER.LANE_SPEED * delta;
      // Clamp to street boundaries
      this.mesh.position.x = Math.max(STREET.LANE_MIN, Math.min(STREET.LANE_MAX, this.mesh.position.x));
    }

    // Face the model forward (-Z) with slight lean for lateral movement
    if (this.model) {
      const targetAngle = (CHARACTER.facingOffset || 0) + Math.PI + ix * 0.2;
      _q.setFromAxisAngle(_up, targetAngle);
      this.model.quaternion.rotateTowards(_q, PLAYER.TURN_SPEED * delta);
    }

    // Invincibility flash
    if (this._invincibleTimer > 0) {
      this._invincibleTimer -= delta;
      this._flashAccum += delta;
      // Toggle visibility for flashing effect
      const visible = Math.floor(this._flashAccum * PLAYER.FLASH_RATE) % 2 === 0;
      this.mesh.visible = visible;
      if (this._invincibleTimer <= 0) {
        this.mesh.visible = true;
      }
    }

    // Update envelopes
    for (const env of this.envelopes) {
      env.update(delta);
    }

    // Remove dead envelopes
    for (let i = this.envelopes.length - 1; i >= 0; i--) {
      if (!this.envelopes[i].alive) {
        this.envelopes[i].dispose(this.scene);
        this.envelopes.splice(i, 1);
      }
    }

    // Throw on input
    if (input.throwPressed) {
      this.throwEnvelope();
    }

    // Increase speed over time
    if (gameState.currentSpeed < GAMEPLAY.MAX_SPEED) {
      gameState.currentSpeed += GAMEPLAY.SPEED_INCREASE_RATE * delta;
      if (gameState.currentSpeed > GAMEPLAY.MAX_SPEED) {
        gameState.currentSpeed = GAMEPLAY.MAX_SPEED;
      }
    }

    // Update combo timer
    const comboExpired = gameState.updateComboTimer(delta * 1000);
    if (comboExpired) {
      eventBus.emit(Events.COMBO_CHANGED, { combo: 0 });
    }
  }

  get isInvincible() {
    return this._invincibleTimer > 0;
  }

  reset() {
    this.mesh.position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.START_Z);
    this.mesh.visible = true;
    this._invincibleTimer = 0;
    this._throwCooldown = 0;
    this._isThrowAnim = false;
    // Clean up envelopes
    for (const env of this.envelopes) {
      env.dispose(this.scene);
    }
    this.envelopes = [];
    // Restart run animation
    if (this.ready) {
      this.fadeToAction('run', 0.1);
    }
  }

  destroy() {
    if (this.mixer) this.mixer.stopAllAction();
    for (const env of this.envelopes) {
      env.dispose(this.scene);
    }
    this.envelopes = [];
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

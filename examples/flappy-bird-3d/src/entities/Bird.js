import * as THREE from 'three';
import { BIRD } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class Bird {
  constructor(scene) {
    this.scene = scene;
    this.velocity = 0;
    this.dead = false;

    this.group = new THREE.Group();

    // Body — stretched sphere
    const bodyGeo = new THREE.SphereGeometry(BIRD.RADIUS, 16, 12);
    const bodyMat = new THREE.MeshLambertMaterial({ color: BIRD.COLOR });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.scale.set(BIRD.BODY_SCALE_X, BIRD.BODY_SCALE_Y, BIRD.BODY_SCALE_Z);
    this.group.add(this.body);

    // Beak — small cone
    const beakGeo = new THREE.ConeGeometry(0.1, 0.25, 8);
    const beakMat = new THREE.MeshLambertMaterial({ color: BIRD.BEAK_COLOR });
    this.beak = new THREE.Mesh(beakGeo, beakMat);
    this.beak.rotation.z = -Math.PI / 2;
    this.beak.position.set(BIRD.RADIUS * BIRD.BODY_SCALE_X + 0.1, 0, 0);
    this.group.add(this.beak);

    // Eye — white sphere with black pupil
    const eyeWhiteGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeWhiteMat = new THREE.MeshLambertMaterial({ color: BIRD.EYE_WHITE_COLOR });
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeWhite.position.set(BIRD.RADIUS * 0.6, BIRD.RADIUS * 0.4, BIRD.RADIUS * 0.5);
    this.group.add(eyeWhite);

    const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const pupilMat = new THREE.MeshLambertMaterial({ color: BIRD.EYE_COLOR });
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(BIRD.RADIUS * 0.7, BIRD.RADIUS * 0.4, BIRD.RADIUS * 0.55);
    this.group.add(pupil);

    // Wing
    const wingGeo = new THREE.SphereGeometry(0.2, 8, 6);
    const wingMat = new THREE.MeshLambertMaterial({ color: BIRD.WING_COLOR });
    this.wing = new THREE.Mesh(wingGeo, wingMat);
    this.wing.scale.set(1.2, 0.4, 1.5);
    this.wing.position.set(-0.05, 0, BIRD.RADIUS * 0.7);
    this.group.add(this.wing);

    this.group.position.set(BIRD.START_X, BIRD.START_Y, BIRD.START_Z);
    this.scene.add(this.group);

    this.wingTime = 0;
    this.squashTimer = 0;
  }

  flap() {
    if (this.dead) return;
    this.velocity = BIRD.FLAP_VELOCITY;
    // Squash/stretch on flap
    this.squashTimer = 0.15;
    eventBus.emit(Events.BIRD_FLAP, {
      x: this.group.position.x,
      y: this.group.position.y,
      z: this.group.position.z,
    });
  }

  update(delta) {
    if (this.dead) return;

    // Gravity
    this.velocity += BIRD.GRAVITY * delta;
    if (this.velocity < BIRD.MAX_FALL_SPEED) {
      this.velocity = BIRD.MAX_FALL_SPEED;
    }

    this.group.position.y += this.velocity * delta;

    // Tilt based on velocity
    const targetTilt = this.velocity > 0 ? BIRD.TILT_UP : BIRD.TILT_DOWN * Math.min(1, Math.abs(this.velocity) / Math.abs(BIRD.MAX_FALL_SPEED));
    this.group.rotation.z += (targetTilt - this.group.rotation.z) * BIRD.TILT_LERP * delta;

    // Wing flap animation
    this.wingTime += delta * 10;
    this.wing.rotation.x = Math.sin(this.wingTime) * 0.4;

    // Squash/stretch
    if (this.squashTimer > 0) {
      this.squashTimer -= delta;
      const t = this.squashTimer / 0.15;
      const squash = 1 + t * 0.3;
      const stretch = 1 - t * 0.15;
      this.body.scale.set(BIRD.BODY_SCALE_X * stretch, BIRD.BODY_SCALE_Y * squash, BIRD.BODY_SCALE_Z);
    } else {
      this.body.scale.set(BIRD.BODY_SCALE_X, BIRD.BODY_SCALE_Y, BIRD.BODY_SCALE_Z);
    }
  }

  die() {
    this.dead = true;
    eventBus.emit(Events.BIRD_DIED, {
      x: this.group.position.x,
      y: this.group.position.y,
      z: this.group.position.z,
    });
  }

  getPosition() {
    return this.group.position;
  }

  getBoundingBox() {
    const p = this.group.position;
    const r = BIRD.RADIUS * 0.8; // Slightly smaller hitbox for fairness
    return {
      minX: p.x - r,
      maxX: p.x + r,
      minY: p.y - r,
      maxY: p.y + r,
    };
  }

  destroy() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
    this.scene.remove(this.group);
  }
}

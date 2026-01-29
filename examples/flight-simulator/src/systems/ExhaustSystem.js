import * as THREE from 'three';
import { EXHAUST } from '../core/Constants.js';

export class ExhaustSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.emitTimer = 0;

    // Shared geometry
    this.geo = new THREE.SphereGeometry(EXHAUST.PARTICLE_SIZE, 4, 4);

    // Pre-allocate particle pool
    for (let i = 0; i < EXHAUST.PARTICLE_COUNT; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: EXHAUST.COLOR_START,
        transparent: true,
        opacity: 0,
        fog: false,
      });
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0,
      });
    }

    this.poolIndex = 0;
    this.startColor = new THREE.Color(EXHAUST.COLOR_START);
    this.endColor = new THREE.Color(EXHAUST.COLOR_END);

    // Pre-allocate reusable vectors for emit()
    this._tailOffset = new THREE.Vector3();
    this._backward = new THREE.Vector3();
  }

  update(delta, playerGroup) {
    if (!playerGroup) return;

    // Emit new particles
    this.emitTimer += delta;
    const emitInterval = 1 / EXHAUST.EMIT_RATE;
    while (this.emitTimer >= emitInterval) {
      this.emitTimer -= emitInterval;
      this.emit(playerGroup);
    }

    // Update existing particles
    for (const p of this.particles) {
      if (p.life <= 0) continue;

      p.life -= delta;
      if (p.life <= 0) {
        p.mesh.visible = false;
        continue;
      }

      // Move
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Fade and color shift
      const t = 1 - (p.life / p.maxLife);
      p.mesh.material.opacity = THREE.MathUtils.lerp(EXHAUST.OPACITY_START, EXHAUST.OPACITY_END, t);
      p.mesh.material.color.lerpColors(this.startColor, this.endColor, t);

      // Grow slightly
      const scale = 1 + t * 2;
      p.mesh.scale.setScalar(scale);
    }
  }

  emit(playerGroup) {
    const p = this.particles[this.poolIndex];
    this.poolIndex = (this.poolIndex + 1) % this.particles.length;

    // Position at the tail of the aircraft
    this._tailOffset.set(0, 0, 1.2).applyQuaternion(playerGroup.quaternion);
    p.mesh.position.copy(playerGroup.position).add(this._tailOffset);

    // Velocity: backward from aircraft + spread
    const backward = this._backward.set(0, 0, 1);
    backward.applyQuaternion(playerGroup.quaternion);
    backward.multiplyScalar(EXHAUST.SPEED);
    backward.x += (Math.random() - 0.5) * EXHAUST.SPREAD;
    backward.y += (Math.random() - 0.5) * EXHAUST.SPREAD;
    backward.z += (Math.random() - 0.5) * EXHAUST.SPREAD;
    p.velocity.copy(backward);

    p.life = EXHAUST.LIFETIME;
    p.maxLife = EXHAUST.LIFETIME;
    p.mesh.visible = true;
    p.mesh.scale.setScalar(1);
    p.mesh.material.opacity = EXHAUST.OPACITY_START;
    p.mesh.material.color.copy(this.startColor);
  }

  destroy() {
    for (const p of this.particles) {
      p.mesh.material.dispose();
      this.scene.remove(p.mesh);
    }
    this.geo.dispose();
    this.particles = [];
  }
}

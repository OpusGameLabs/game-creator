import * as THREE from 'three';
import { VFX } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

/**
 * ParticleSystem -- manages gem-collection sparkle bursts and the ball trail.
 * All particles are simple small meshes managed in pools for performance.
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // Sparkle burst particles (pooled)
    this.sparkles = [];

    // Ball trail particles
    this.trail = [];
    this._trailTimer = 0;

    // Shared materials (created once, reused)
    this._sparkleMaterial = new THREE.MeshBasicMaterial({
      color: VFX.GEM_PARTICLE_COLOR,
      transparent: true,
      opacity: 1.0,
    });
    this._sparkleGeometry = new THREE.SphereGeometry(VFX.GEM_PARTICLE_SIZE, 6, 6);

    this._trailMaterial = new THREE.MeshBasicMaterial({
      color: VFX.BALL_TRAIL_COLOR,
      transparent: true,
      opacity: VFX.BALL_TRAIL_OPACITY,
    });
    this._trailGeometry = new THREE.SphereGeometry(VFX.BALL_TRAIL_SIZE, 4, 4);

    // Listen for gem collection to spawn sparkle burst
    eventBus.on(Events.VFX_GEM_SPARKLE, (data) => this._spawnSparkles(data));
  }

  /**
   * Spawn a burst of sparkle particles at the given world position.
   */
  _spawnSparkles({ x, y, z }) {
    const count = VFX.GEM_PARTICLE_COUNT;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this._sparkleGeometry, this._sparkleMaterial.clone());
      mesh.position.set(x, y, z);

      // Random spherical direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = VFX.GEM_PARTICLE_SPEED * (0.5 + Math.random() * 0.5);

      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.abs(Math.sin(phi) * Math.sin(theta)) * speed * 0.8 + 1.0;
      const vz = Math.cos(phi) * speed;

      this.scene.add(mesh);
      this.sparkles.push({
        mesh,
        vx, vy, vz,
        life: VFX.GEM_PARTICLE_LIFE,
        maxLife: VFX.GEM_PARTICLE_LIFE,
      });
    }
  }

  /**
   * Spawn a trail dot at the ball position if speed is high enough.
   */
  spawnTrailDot(ballPos, speed) {
    if (speed < VFX.BALL_TRAIL_SPEED_THRESHOLD) return;

    const mesh = new THREE.Mesh(this._trailGeometry, this._trailMaterial.clone());
    mesh.position.set(ballPos.x, ballPos.y * 0.3, ballPos.z);

    // Size based on speed
    const s = 0.5 + Math.min(speed / 20, 1.0) * 0.5;
    mesh.scale.set(s, s, s);

    this.scene.add(mesh);
    this.trail.push({
      mesh,
      life: 0.4,
      maxLife: 0.4,
    });

    // Trim trail pool
    while (this.trail.length > VFX.BALL_TRAIL_LENGTH) {
      const old = this.trail.shift();
      this.scene.remove(old.mesh);
      old.mesh.material.dispose();
    }
  }

  /**
   * Update all active particles. Called each frame from Game.animate().
   */
  update(delta) {
    // Update sparkle particles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const p = this.sparkles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.sparkles.splice(i, 1);
        continue;
      }

      // Move
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;

      // Gravity
      p.vy -= 6.0 * delta;

      // Fade out
      const t = p.life / p.maxLife;
      p.mesh.material.opacity = t;
      const scale = 0.5 + t * 0.5;
      p.mesh.scale.set(scale, scale, scale);
    }

    // Update trail particles
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const p = this.trail[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.trail.splice(i, 1);
        continue;
      }

      // Fade and shrink
      const t = p.life / p.maxLife;
      p.mesh.material.opacity = VFX.BALL_TRAIL_OPACITY * t;
      const s = t * p.mesh.scale.x;
      p.mesh.scale.set(s, s, s);
    }
  }

  /**
   * Clean up all particles.
   */
  destroy() {
    for (const p of this.sparkles) {
      this.scene.remove(p.mesh);
      p.mesh.material.dispose();
    }
    this.sparkles = [];

    for (const p of this.trail) {
      this.scene.remove(p.mesh);
      p.mesh.material.dispose();
    }
    this.trail = [];
  }
}

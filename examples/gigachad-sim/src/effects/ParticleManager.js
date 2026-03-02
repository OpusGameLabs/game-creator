// =============================================================================
// ParticleManager.js — GPU particle system using THREE.Points
// Pre-allocated pool of particles for zero-GC bursts on game events.
// Also manages ambient floating dust/chalk particles.
// =============================================================================

import * as THREE from 'three';
import { EFFECTS, ARENA } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

// Particle states
const DEAD = 0;
const ALIVE = 1;

export class ParticleManager {
  constructor(scene) {
    this.scene = scene;

    // --- Burst particle pool (THREE.Points) ---
    this._poolSize = EFFECTS.PARTICLE_POOL_SIZE;

    // Per-particle data arrays
    this._states = new Float32Array(this._poolSize);        // 0=dead, 1=alive
    this._lifetimes = new Float32Array(this._poolSize);     // remaining life
    this._maxLifetimes = new Float32Array(this._poolSize);  // total lifetime
    this._velocities = new Float32Array(this._poolSize * 3);

    // Geometry
    const positions = new Float32Array(this._poolSize * 3);
    const colors = new Float32Array(this._poolSize * 3);
    const sizes = new Float32Array(this._poolSize);

    // Hide all particles off-screen initially
    for (let i = 0; i < this._poolSize; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
      sizes[i] = EFFECTS.PARTICLE_SIZE;
      this._states[i] = DEAD;
    }

    this._geometry = new THREE.BufferGeometry();
    this._geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this._geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Material: additive blending for glow effect
    this._material = new THREE.PointsMaterial({
      size: EFFECTS.PARTICLE_SIZE,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this._points = new THREE.Points(this._geometry, this._material);
    this._points.frustumCulled = false;
    this.scene.add(this._points);

    // Next available index for pool allocation
    this._nextIndex = 0;

    // --- Shockwave rings ---
    this._shockwaves = [];

    // --- Ambient particles (dust/chalk motes) ---
    this._setupAmbientParticles();

    // --- Wire events ---
    this._wireEvents();
  }

  // =========================================================================
  // Ambient particles — always-on drifting dust motes
  // =========================================================================

  _setupAmbientParticles() {
    const count = EFFECTS.AMBIENT_PARTICLE_COUNT;
    const positions = new Float32Array(count * 3);
    const opacities = new Float32Array(count);
    this._ambientVelocities = new Float32Array(count * 3);
    this._ambientPhases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random position within the gym volume
      positions[i * 3] = (Math.random() - 0.5) * ARENA.WIDTH;
      positions[i * 3 + 1] = Math.random() * 14 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * ARENA.DEPTH;

      // Slow drift velocity
      this._ambientVelocities[i * 3] = (Math.random() - 0.5) * EFFECTS.AMBIENT_DRIFT_SPEED;
      this._ambientVelocities[i * 3 + 1] = (Math.random() - 0.5) * EFFECTS.AMBIENT_DRIFT_SPEED * 0.5;
      this._ambientVelocities[i * 3 + 2] = (Math.random() - 0.5) * EFFECTS.AMBIENT_DRIFT_SPEED;

      this._ambientPhases[i] = Math.random() * Math.PI * 2;
      opacities[i] = EFFECTS.AMBIENT_OPACITY * (0.5 + Math.random() * 0.5);
    }

    const ambientGeo = new THREE.BufferGeometry();
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const ambientMat = new THREE.PointsMaterial({
      size: EFFECTS.AMBIENT_SIZE,
      color: 0xccccaa,
      transparent: true,
      opacity: EFFECTS.AMBIENT_OPACITY,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this._ambientPoints = new THREE.Points(ambientGeo, ambientMat);
    this._ambientPoints.frustumCulled = false;
    this.scene.add(this._ambientPoints);
    this._ambientTime = 0;
  }

  // =========================================================================
  // Event wiring
  // =========================================================================

  _wireEvents() {
    eventBus.on(Events.WEIGHT_CAUGHT, (data) => {
      try {
        const color = EFFECTS.WEIGHT_COLORS[data.type] || 0xffffff;
        const combo = data.combo || 0;
        const count = EFFECTS.CATCH_PARTICLES + Math.min(combo, 10) * EFFECTS.COMBO_PARTICLE_GROWTH;
        this.burst(
          new THREE.Vector3(data.x, 2.5, 0),
          Math.min(count, 40),
          color,
          EFFECTS.PARTICLE_SPEED_MAX
        );
      } catch (e) { /* graceful degradation */ }
    });

    eventBus.on(Events.WEIGHT_MISSED, (data) => {
      try {
        this.burst(
          new THREE.Vector3(data.x, 0.2, 0),
          EFFECTS.MISS_PARTICLES,
          EFFECTS.MISS_COLOR,
          EFFECTS.PARTICLE_SPEED_MIN + 1
        );
        this._spawnShockwave(data.x, EFFECTS.SHOCKWAVE_COLOR);
      } catch (e) { /* graceful degradation */ }
    });

    eventBus.on(Events.POWERUP_COLLECTED, () => {
      try {
        // Spiral burst in green
        this.burst(
          new THREE.Vector3(0, 3, 0),
          EFFECTS.POWERUP_PARTICLES,
          EFFECTS.POWERUP_COLOR,
          EFFECTS.PARTICLE_SPEED_MAX,
          true  // spiral mode
        );
      } catch (e) { /* graceful degradation */ }
    });

    eventBus.on(Events.SPECTACLE_COMBO, ({ combo }) => {
      try {
        const count = EFFECTS.COMBO_BASE_PARTICLES + combo * EFFECTS.COMBO_PARTICLE_GROWTH;
        this.burst(
          new THREE.Vector3(0, 4, 0),
          Math.min(count, 35),
          0xffdd44,
          EFFECTS.PARTICLE_SPEED_MAX
        );
      } catch (e) { /* graceful degradation */ }
    });

    eventBus.on(Events.SPECTACLE_STREAK, ({ combo }) => {
      try {
        this.burst(
          new THREE.Vector3(0, 3, 0),
          EFFECTS.STREAK_PARTICLES,
          0xff8844,
          EFFECTS.PARTICLE_SPEED_MAX * 1.5
        );
        this._spawnShockwave(0, EFFECTS.SHOCKWAVE_STREAK_COLOR);
      } catch (e) { /* graceful degradation */ }
    });

    eventBus.on(Events.SPECTACLE_ENTRANCE, () => {
      try {
        // Delayed particle burst (fires after GigaChad lands)
        setTimeout(() => {
          this.burst(
            new THREE.Vector3(0, 0.5, 0),
            EFFECTS.ENTRANCE_PARTICLES,
            EFFECTS.ENTRANCE_COLOR,
            EFFECTS.PARTICLE_SPEED_MAX
          );
        }, 1000);
      } catch (e) { /* graceful degradation */ }
    });
  }

  // =========================================================================
  // Burst — emit N particles at a position
  // =========================================================================

  burst(position, count, colorHex, speed, spiral = false) {
    const posAttr = this._geometry.getAttribute('position');
    const colAttr = this._geometry.getAttribute('color');
    const sizeAttr = this._geometry.getAttribute('size');

    const color = new THREE.Color(colorHex);

    for (let n = 0; n < count; n++) {
      const i = this._acquireParticle();
      if (i === -1) break; // pool exhausted

      // Position
      posAttr.array[i * 3] = position.x + (Math.random() - 0.5) * 0.3;
      posAttr.array[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.3;
      posAttr.array[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.3;

      // Color with slight variation
      colAttr.array[i * 3] = Math.min(1, color.r + (Math.random() - 0.5) * 0.2);
      colAttr.array[i * 3 + 1] = Math.min(1, color.g + (Math.random() - 0.5) * 0.2);
      colAttr.array[i * 3 + 2] = Math.min(1, color.b + (Math.random() - 0.5) * 0.2);

      // Size variation
      sizeAttr.array[i] = EFFECTS.PARTICLE_SIZE * (0.5 + Math.random() * 1.0);

      // Velocity
      let vx, vy, vz;
      if (spiral) {
        const angle = (n / count) * Math.PI * 4;
        const r = speed * (0.5 + Math.random() * 0.5);
        vx = Math.cos(angle) * r;
        vy = speed * (0.5 + Math.random());
        vz = Math.sin(angle) * r * 0.5;
      } else {
        // Random spherical burst
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = speed * (0.3 + Math.random() * 0.7);
        vx = Math.sin(phi) * Math.cos(theta) * r;
        vy = Math.abs(Math.cos(phi) * r) + 1; // bias upward
        vz = Math.sin(phi) * Math.sin(theta) * r * 0.5;
      }

      this._velocities[i * 3] = vx;
      this._velocities[i * 3 + 1] = vy;
      this._velocities[i * 3 + 2] = vz;

      const lifetime = EFFECTS.PARTICLE_LIFETIME * (0.5 + Math.random() * 0.5);
      this._lifetimes[i] = lifetime;
      this._maxLifetimes[i] = lifetime;
      this._states[i] = ALIVE;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }

  // =========================================================================
  // Shockwave ring on floor
  // =========================================================================

  _spawnShockwave(x, colorHex) {
    const geometry = new THREE.RingGeometry(
      EFFECTS.SHOCKWAVE_RADIUS_START,
      EFFECTS.SHOCKWAVE_RADIUS_START + 0.1,
      32
    );
    const material = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.05, 0);
    this.scene.add(ring);

    this._shockwaves.push({
      mesh: ring,
      time: 0,
      duration: EFFECTS.SHOCKWAVE_DURATION,
    });
  }

  // =========================================================================
  // Pool management
  // =========================================================================

  _acquireParticle() {
    // Search from nextIndex for a dead particle
    for (let attempts = 0; attempts < this._poolSize; attempts++) {
      const i = (this._nextIndex + attempts) % this._poolSize;
      if (this._states[i] === DEAD) {
        this._nextIndex = (i + 1) % this._poolSize;
        return i;
      }
    }
    return -1; // pool fully allocated
  }

  // =========================================================================
  // Update — called every frame from Game.js animate loop
  // =========================================================================

  update(delta) {
    this._updateBurstParticles(delta);
    this._updateAmbientParticles(delta);
    this._updateShockwaves(delta);
  }

  _updateBurstParticles(delta) {
    const posAttr = this._geometry.getAttribute('position');
    const sizeAttr = this._geometry.getAttribute('size');
    let anyAlive = false;

    for (let i = 0; i < this._poolSize; i++) {
      if (this._states[i] !== ALIVE) continue;
      anyAlive = true;

      this._lifetimes[i] -= delta;
      if (this._lifetimes[i] <= 0) {
        // Kill particle — move off-screen
        this._states[i] = DEAD;
        posAttr.array[i * 3 + 1] = -100;
        continue;
      }

      // Apply velocity + gravity
      const vi = i * 3;
      this._velocities[vi + 1] += EFFECTS.PARTICLE_GRAVITY * delta;

      posAttr.array[vi] += this._velocities[vi] * delta;
      posAttr.array[vi + 1] += this._velocities[vi + 1] * delta;
      posAttr.array[vi + 2] += this._velocities[vi + 2] * delta;

      // Floor bounce (don't let particles go below floor)
      if (posAttr.array[vi + 1] < 0.05) {
        posAttr.array[vi + 1] = 0.05;
        this._velocities[vi + 1] *= -0.3;
      }

      // Fade out via size reduction (cheaper than per-particle alpha)
      const lifeFrac = this._lifetimes[i] / this._maxLifetimes[i];
      sizeAttr.array[i] = EFFECTS.PARTICLE_SIZE * lifeFrac * (0.5 + Math.random() * 0.1);
    }

    if (anyAlive) {
      posAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }
  }

  _updateAmbientParticles(delta) {
    this._ambientTime += delta;
    const posAttr = this._ambientPoints.geometry.getAttribute('position');
    const count = EFFECTS.AMBIENT_PARTICLE_COUNT;

    for (let i = 0; i < count; i++) {
      const vi = i * 3;
      const phase = this._ambientPhases[i];

      // Gentle sinusoidal drift
      posAttr.array[vi] += this._ambientVelocities[vi] * delta + Math.sin(this._ambientTime * 0.5 + phase) * 0.002;
      posAttr.array[vi + 1] += this._ambientVelocities[vi + 1] * delta + Math.cos(this._ambientTime * 0.3 + phase) * 0.001;
      posAttr.array[vi + 2] += this._ambientVelocities[vi + 2] * delta;

      // Wrap around gym boundaries
      if (posAttr.array[vi] > ARENA.HALF_WIDTH + 1) posAttr.array[vi] = -ARENA.HALF_WIDTH - 1;
      if (posAttr.array[vi] < -ARENA.HALF_WIDTH - 1) posAttr.array[vi] = ARENA.HALF_WIDTH + 1;
      if (posAttr.array[vi + 1] > 16) posAttr.array[vi + 1] = 1;
      if (posAttr.array[vi + 1] < 0.5) posAttr.array[vi + 1] = 14;
      if (posAttr.array[vi + 2] > ARENA.DEPTH / 2 + 1) posAttr.array[vi + 2] = -ARENA.DEPTH / 2;
      if (posAttr.array[vi + 2] < -ARENA.DEPTH / 2 - 1) posAttr.array[vi + 2] = ARENA.DEPTH / 2;
    }

    // Pulse ambient opacity gently
    this._ambientPoints.material.opacity = EFFECTS.AMBIENT_OPACITY + Math.sin(this._ambientTime * 0.8) * 0.05;

    posAttr.needsUpdate = true;
  }

  _updateShockwaves(delta) {
    for (let i = this._shockwaves.length - 1; i >= 0; i--) {
      const sw = this._shockwaves[i];
      sw.time += delta;
      const t = sw.time / sw.duration;

      if (t >= 1) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mesh.material.dispose();
        this._shockwaves.splice(i, 1);
        continue;
      }

      // Expand ring
      const radius = EFFECTS.SHOCKWAVE_RADIUS_START +
        (EFFECTS.SHOCKWAVE_RADIUS_END - EFFECTS.SHOCKWAVE_RADIUS_START) * t;
      sw.mesh.scale.setScalar(radius / EFFECTS.SHOCKWAVE_RADIUS_START);

      // Fade out
      sw.mesh.material.opacity = 0.8 * (1 - t);
    }
  }

  // =========================================================================
  // Cleanup
  // =========================================================================

  destroy() {
    this.scene.remove(this._points);
    this._geometry.dispose();
    this._material.dispose();

    this.scene.remove(this._ambientPoints);
    this._ambientPoints.geometry.dispose();
    this._ambientPoints.material.dispose();

    for (const sw of this._shockwaves) {
      this.scene.remove(sw.mesh);
      sw.mesh.geometry.dispose();
      sw.mesh.material.dispose();
    }
    this._shockwaves = [];
  }
}

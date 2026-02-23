// =============================================================================
// ParticleSystem.js — Object-pooled particle system for all visual effects
// Explosion bursts, enemy death fragments, dust clouds, castle debris,
// projectile fire trails, impact flashes, and ground scorch marks.
// Communicates via EventBus only.
// =============================================================================

import * as THREE from 'three';
import { PARTICLES, LEVEL, CASTLE, PROJECTILE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

// ---------------------------------------------------------------------------
// Single particle — reusable from pool
// ---------------------------------------------------------------------------
class Particle {
  constructor(mesh) {
    this.mesh = mesh;
    this.alive = false;
    this.velocity = new THREE.Vector3();
    this.lifetime = 0;
    this.maxLifetime = 0;
    this.gravity = 0;
    this.fadeOut = true;
    this.shrink = false;
    this.initialScale = 1;
  }

  activate(position, velocity, size, color, lifetime, gravity, fadeOut = true, shrink = false) {
    this.alive = true;
    this.mesh.visible = true;
    this.mesh.position.copy(position);
    this.velocity.copy(velocity);
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.gravity = gravity;
    this.fadeOut = fadeOut;
    this.shrink = shrink;
    this.initialScale = size;
    this.mesh.scale.setScalar(size);
    this.mesh.material.color.setHex(color);
    this.mesh.material.opacity = 1;
  }

  update(delta) {
    if (!this.alive) return;

    this.lifetime -= delta;
    if (this.lifetime <= 0) {
      this.deactivate();
      return;
    }

    // Move
    this.mesh.position.addScaledVector(this.velocity, delta);
    this.velocity.y += this.gravity * delta;

    // Fade
    const t = this.lifetime / this.maxLifetime;
    if (this.fadeOut) {
      this.mesh.material.opacity = t;
    }
    if (this.shrink) {
      this.mesh.scale.setScalar(this.initialScale * t);
    }
  }

  deactivate() {
    this.alive = false;
    this.mesh.visible = false;
  }
}

// ---------------------------------------------------------------------------
// Impact flash — bright sphere that expands and fades quickly
// ---------------------------------------------------------------------------
class ImpactFlash {
  constructor(scene) {
    this.scene = scene;
    const geo = new THREE.SphereGeometry(1, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: PARTICLES.IMPACT_FLASH_COLOR,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.visible = false;
    this.scene.add(this.mesh);
    this.alive = false;
    this.timer = 0;
  }

  activate(position) {
    this.alive = true;
    this.mesh.visible = true;
    this.mesh.position.copy(position);
    this.mesh.position.y = 1;
    this.mesh.scale.setScalar(0.1);
    this.mesh.material.opacity = 1;
    this.timer = PARTICLES.IMPACT_FLASH_DURATION;
  }

  update(delta) {
    if (!this.alive) return;
    this.timer -= delta;
    const t = 1 - (this.timer / PARTICLES.IMPACT_FLASH_DURATION);
    const scale = PARTICLES.IMPACT_FLASH_SIZE * t;
    this.mesh.scale.setScalar(scale);
    this.mesh.material.opacity = 1 - t;
    if (this.timer <= 0) {
      this.alive = false;
      this.mesh.visible = false;
    }
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

// ---------------------------------------------------------------------------
// Scorch mark — dark circle on the ground that slowly fades
// ---------------------------------------------------------------------------
class ScorchMark {
  constructor(scene) {
    this.scene = scene;
    const geo = new THREE.CircleGeometry(LEVEL.SCORCH_RADIUS, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: LEVEL.SCORCH_COLOR,
      transparent: true,
      opacity: LEVEL.SCORCH_OPACITY,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.visible = false;
    this.scene.add(this.mesh);
    this.alive = false;
  }

  activate(position) {
    this.alive = true;
    this.mesh.visible = true;
    this.mesh.position.set(position.x, 0.02, position.z);
    this.mesh.material.opacity = LEVEL.SCORCH_OPACITY;
    // Random rotation for variety
    this.mesh.rotation.z = Math.random() * Math.PI * 2;
    const scale = 0.8 + Math.random() * 0.4;
    this.mesh.scale.setScalar(scale);
  }

  update(delta) {
    if (!this.alive) return;
    this.mesh.material.opacity -= LEVEL.SCORCH_FADE_SPEED * delta;
    if (this.mesh.material.opacity <= 0) {
      this.alive = false;
      this.mesh.visible = false;
    }
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

// ---------------------------------------------------------------------------
// Trail particle — follows a projectile, leaving fire wisps
// ---------------------------------------------------------------------------
class TrailSegment {
  constructor(scene) {
    this.scene = scene;
    const geo = new THREE.SphereGeometry(1, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.visible = false;
    this.scene.add(this.mesh);
    this.alive = false;
    this.lifetime = 0;
    this.maxLifetime = 0;
    this.initialScale = 1;
  }

  activate(position, color, size, lifetime) {
    this.alive = true;
    this.mesh.visible = true;
    this.mesh.position.copy(position);
    // Add small random spread
    this.mesh.position.x += (Math.random() - 0.5) * PROJECTILE.TRAIL_SPREAD;
    this.mesh.position.y += (Math.random() - 0.5) * PROJECTILE.TRAIL_SPREAD;
    this.mesh.position.z += (Math.random() - 0.5) * PROJECTILE.TRAIL_SPREAD;
    this.mesh.material.color.setHex(color);
    this.mesh.material.opacity = 0.8;
    this.mesh.scale.setScalar(size);
    this.initialScale = size;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
  }

  update(delta) {
    if (!this.alive) return;
    this.lifetime -= delta;
    if (this.lifetime <= 0) {
      this.alive = false;
      this.mesh.visible = false;
      return;
    }
    const t = this.lifetime / this.maxLifetime;
    this.mesh.material.opacity = t * 0.8;
    this.mesh.scale.setScalar(this.initialScale * t);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

// ---------------------------------------------------------------------------
// Main ParticleSystem
// ---------------------------------------------------------------------------
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // Shared geometry for all particles (one allocation)
    this.sharedGeo = new THREE.BoxGeometry(1, 1, 1);

    // Object pool
    this.pool = [];
    for (let i = 0; i < PARTICLES.MAX_PARTICLES; i++) {
      const mat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 1,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.sharedGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.pool.push(new Particle(mesh));
    }

    // Impact flashes (small pool of 5)
    this.flashes = [];
    for (let i = 0; i < 5; i++) {
      this.flashes.push(new ImpactFlash(this.scene));
    }

    // Scorch marks (ring buffer)
    this.scorchMarks = [];
    for (let i = 0; i < LEVEL.MAX_SCORCH_MARKS; i++) {
      this.scorchMarks.push(new ScorchMark(this.scene));
    }
    this.scorchIndex = 0;

    // Trail segments pool
    this.trailSegments = [];
    for (let i = 0; i < 60; i++) {
      this.trailSegments.push(new TrailSegment(this.scene));
    }

    // Subscribe to events
    eventBus.on(Events.PROJECTILE_IMPACT, (data) => this._onProjectileImpact(data));
    eventBus.on(Events.ENEMY_KILLED, (data) => this._onEnemyKilled(data));
    eventBus.on(Events.CASTLE_HIT, () => this._onCastleHit());
    eventBus.on(Events.ENEMY_DUST, (data) => this._onEnemyDust(data));
    eventBus.on(Events.SPAWN_PARTICLES, (data) => this._onSpawnParticles(data));
  }

  // --- Get a free particle from pool ---
  _getParticle() {
    for (const p of this.pool) {
      if (!p.alive) return p;
    }
    return null; // pool exhausted
  }

  _getFlash() {
    for (const f of this.flashes) {
      if (!f.alive) return f;
    }
    return null;
  }

  _getTrailSegment() {
    for (const t of this.trailSegments) {
      if (!t.alive) return t;
    }
    return null;
  }

  // --- Event handlers ---

  _onProjectileImpact(data) {
    const pos = data.position;

    // Explosion burst
    for (let i = 0; i < PARTICLES.EXPLOSION_COUNT; i++) {
      const p = this._getParticle();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const upAngle = Math.random() * Math.PI * 0.5;
      const speed = PARTICLES.EXPLOSION_SPEED_MIN +
        Math.random() * (PARTICLES.EXPLOSION_SPEED_MAX - PARTICLES.EXPLOSION_SPEED_MIN);
      const velocity = new THREE.Vector3(
        Math.cos(angle) * Math.cos(upAngle) * speed,
        Math.sin(upAngle) * speed,
        Math.sin(angle) * Math.cos(upAngle) * speed,
      );

      const color = PARTICLES.EXPLOSION_COLORS[
        Math.floor(Math.random() * PARTICLES.EXPLOSION_COLORS.length)
      ];
      const size = PARTICLES.EXPLOSION_SIZE_MIN +
        Math.random() * (PARTICLES.EXPLOSION_SIZE_MAX - PARTICLES.EXPLOSION_SIZE_MIN);

      p.activate(
        new THREE.Vector3(pos.x, pos.y || 0.5, pos.z),
        velocity, size, color,
        PARTICLES.EXPLOSION_LIFETIME * (0.6 + Math.random() * 0.4),
        PARTICLES.EXPLOSION_GRAVITY,
        true, true
      );
    }

    // Impact flash
    const flash = this._getFlash();
    if (flash) {
      flash.activate(pos);
    }

    // Scorch mark on ground
    const scorch = this.scorchMarks[this.scorchIndex % LEVEL.MAX_SCORCH_MARKS];
    scorch.activate(pos);
    this.scorchIndex++;

    // Camera shake
    eventBus.emit(Events.CAMERA_SHAKE, { type: 'impact' });
  }

  _onEnemyKilled(data) {
    if (!data || !data.position) return;
    const pos = data.position;

    // Death fragments
    for (let i = 0; i < PARTICLES.DEATH_COUNT; i++) {
      const p = this._getParticle();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const upAngle = Math.random() * Math.PI * 0.4 + 0.2;
      const speed = PARTICLES.DEATH_SPEED_MIN +
        Math.random() * (PARTICLES.DEATH_SPEED_MAX - PARTICLES.DEATH_SPEED_MIN);
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed * 0.7,
        Math.sin(upAngle) * speed,
        Math.sin(angle) * speed * 0.7,
      );

      const color = PARTICLES.DEATH_COLORS[
        Math.floor(Math.random() * PARTICLES.DEATH_COLORS.length)
      ];
      const size = PARTICLES.DEATH_SIZE_MIN +
        Math.random() * (PARTICLES.DEATH_SIZE_MAX - PARTICLES.DEATH_SIZE_MIN);

      p.activate(
        new THREE.Vector3(pos.x, pos.y || 1.0, pos.z),
        velocity, size, color,
        PARTICLES.DEATH_LIFETIME * (0.6 + Math.random() * 0.4),
        PARTICLES.DEATH_GRAVITY,
        true, false
      );
    }
  }

  _onCastleHit() {
    // Stone debris from castle front
    const castleZ = CASTLE.POSITION_Z - CASTLE.TOWER_SPREAD_Z;
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * CASTLE.KEEP_WIDTH,
      CASTLE.WALL_HEIGHT * 0.5 + Math.random() * CASTLE.WALL_HEIGHT * 0.5,
      castleZ
    );

    for (let i = 0; i < PARTICLES.CASTLE_HIT_COUNT; i++) {
      const p = this._getParticle();
      if (!p) break;

      const angle = Math.random() * Math.PI - Math.PI / 2; // forward hemisphere
      const upAngle = Math.random() * Math.PI * 0.3;
      const speed = PARTICLES.CASTLE_HIT_SPEED_MIN +
        Math.random() * (PARTICLES.CASTLE_HIT_SPEED_MAX - PARTICLES.CASTLE_HIT_SPEED_MIN);
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(upAngle) * speed * 0.5 + 2,
        -Math.abs(Math.sin(angle)) * speed, // fly away from castle (negative Z)
      );

      const color = PARTICLES.CASTLE_HIT_COLORS[
        Math.floor(Math.random() * PARTICLES.CASTLE_HIT_COLORS.length)
      ];
      const size = PARTICLES.CASTLE_HIT_SIZE_MIN +
        Math.random() * (PARTICLES.CASTLE_HIT_SIZE_MAX - PARTICLES.CASTLE_HIT_SIZE_MIN);

      p.activate(pos.clone(), velocity, size, color,
        PARTICLES.CASTLE_HIT_LIFETIME * (0.6 + Math.random() * 0.4),
        PARTICLES.CASTLE_HIT_GRAVITY,
        true, false
      );
    }

    // Larger camera shake for castle hit
    eventBus.emit(Events.CAMERA_SHAKE, { type: 'castle_hit' });
  }

  _onEnemyDust(data) {
    if (!data || !data.position) return;
    const pos = data.position;

    for (let i = 0; i < PARTICLES.DUST_COUNT; i++) {
      const p = this._getParticle();
      if (!p) break;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * PARTICLES.DUST_SPEED,
        PARTICLES.DUST_RISE_SPEED * (0.5 + Math.random() * 0.5),
        (Math.random() - 0.5) * PARTICLES.DUST_SPEED,
      );

      p.activate(
        new THREE.Vector3(pos.x + (Math.random() - 0.5) * 0.5, 0.1, pos.z),
        velocity, PARTICLES.DUST_SIZE, PARTICLES.DUST_COLOR,
        PARTICLES.DUST_LIFETIME * (0.7 + Math.random() * 0.3),
        0, // no gravity for dust — it rises
        true, true
      );
    }
  }

  _onSpawnParticles(data) {
    // Generic particle spawn for custom effects
    if (!data) return;
    const { position, count, colors, speedMin, speedMax, size, lifetime, gravity } = data;
    for (let i = 0; i < (count || 5); i++) {
      const p = this._getParticle();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const upAngle = Math.random() * Math.PI * 0.5;
      const speed = (speedMin || 2) + Math.random() * ((speedMax || 6) - (speedMin || 2));
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(upAngle) * speed,
        Math.sin(angle) * speed,
      );

      const colorArray = colors || [0xffffff];
      const color = colorArray[Math.floor(Math.random() * colorArray.length)];

      p.activate(
        position.clone(), velocity, size || 0.2, color,
        (lifetime || 0.5) * (0.6 + Math.random() * 0.4),
        gravity || -10,
        true, true
      );
    }
  }

  // --- Spawn trail for a projectile (called from ProjectileManager) ---
  spawnTrail(position) {
    const seg = this._getTrailSegment();
    if (!seg) return;
    const colors = PROJECTILE.TRAIL_COLORS;
    const color = colors[Math.floor(Math.random() * colors.length)];
    seg.activate(position, color, PROJECTILE.TRAIL_SIZE, 1 / PROJECTILE.TRAIL_FADE_SPEED);
  }

  // --- Update all active particles ---
  update(delta) {
    for (const p of this.pool) {
      if (p.alive) p.update(delta);
    }
    for (const f of this.flashes) {
      if (f.alive) f.update(delta);
    }
    for (const s of this.scorchMarks) {
      if (s.alive) s.update(delta);
    }
    for (const t of this.trailSegments) {
      if (t.alive) t.update(delta);
    }
  }

  // --- Cleanup ---
  destroy() {
    // Deactivate all
    for (const p of this.pool) {
      p.deactivate();
      this.scene.remove(p.mesh);
      p.mesh.material.dispose();
    }
    this.sharedGeo.dispose();

    for (const f of this.flashes) {
      f.dispose();
    }
    for (const s of this.scorchMarks) {
      s.dispose();
    }
    for (const t of this.trailSegments) {
      t.dispose();
    }

    this.pool = [];
    this.flashes = [];
    this.scorchMarks = [];
    this.trailSegments = [];
  }
}

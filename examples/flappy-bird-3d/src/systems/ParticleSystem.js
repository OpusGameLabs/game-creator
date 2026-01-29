import * as THREE from 'three';
import { PARTICLES } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

class Particle {
  constructor(scene, x, y, z, vx, vy, vz, life, size, color) {
    const geo = new THREE.SphereGeometry(size, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, z);
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.life = life;
    this.maxLife = life;
    scene.add(this.mesh);
    this.scene = scene;
  }

  update(delta) {
    this.life -= delta;
    this.mesh.position.x += this.vx * delta;
    this.mesh.position.y += this.vy * delta;
    this.mesh.position.z += this.vz * delta;
    // Fade out by scaling down
    const scale = Math.max(0, this.life / this.maxLife);
    this.mesh.scale.setScalar(scale);
    return this.life > 0;
  }

  destroy() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.scene.remove(this.mesh);
  }
}

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    eventBus.on(Events.BIRD_FLAP, (data) => this.emitFlap(data));
    eventBus.on(Events.BIRD_DIED, (data) => this.emitDeath(data));
    eventBus.on(Events.PIPE_PASSED, (data) => this.emitScore(data));
  }

  emitFlap({ x, y, z }) {
    for (let i = 0; i < PARTICLES.FLAP_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = PARTICLES.FLAP_SPEED * (0.5 + Math.random() * 0.5);
      this.particles.push(new Particle(
        this.scene, x, y - 0.2, z,
        Math.cos(angle) * speed * 0.3,
        -speed * 0.5,
        Math.sin(angle) * speed * 0.3,
        PARTICLES.FLAP_LIFE,
        PARTICLES.FLAP_SIZE,
        PARTICLES.FLAP_COLOR
      ));
    }
  }

  emitDeath({ x, y, z }) {
    for (let i = 0; i < PARTICLES.DEATH_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI;
      const speed = PARTICLES.DEATH_SPEED * (0.3 + Math.random() * 0.7);
      this.particles.push(new Particle(
        this.scene, x, y, z,
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed,
        Math.sin(angle) * Math.cos(elevation) * speed,
        PARTICLES.DEATH_LIFE,
        PARTICLES.DEATH_SIZE,
        PARTICLES.DEATH_COLOR
      ));
    }
  }

  emitScore({ x, y }) {
    for (let i = 0; i < PARTICLES.SCORE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = PARTICLES.SCORE_SPEED * (0.3 + Math.random() * 0.7);
      this.particles.push(new Particle(
        this.scene, x, y, 0,
        Math.cos(angle) * speed * 0.5,
        speed * 0.5 + Math.random() * speed * 0.5,
        Math.sin(angle) * speed * 0.5,
        PARTICLES.SCORE_LIFE,
        PARTICLES.SCORE_SIZE,
        PARTICLES.SCORE_COLOR
      ));
    }
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (!this.particles[i].update(delta)) {
        this.particles[i].destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  destroyAll() {
    for (const p of this.particles) {
      p.destroy();
    }
    this.particles = [];
  }
}

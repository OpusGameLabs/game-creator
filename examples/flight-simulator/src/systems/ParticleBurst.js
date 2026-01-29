import * as THREE from 'three';
import { RING, PARTICLE_BURST } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class ParticleBurst {
  constructor(scene) {
    this.scene = scene;
    this.bursts = [];
    this.geo = new THREE.SphereGeometry(0.15, 4, 4);

    eventBus.on(Events.RING_COLLECTED, ({ ring }) => {
      this.emit(ring.position);
    });

  }

  emit(position, color = RING.COLOR, count = RING.BURST_COUNT) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
        fog: false,
      });
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.position.copy(position);

      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI - Math.PI / 2;
      const speed = RING.BURST_SPEED * (0.5 + Math.random() * 0.5);
      const velocity = new THREE.Vector3(
        Math.cos(angle1) * Math.cos(angle2) * speed,
        Math.sin(angle2) * speed * 0.6 + 2,
        Math.sin(angle1) * Math.cos(angle2) * speed
      );

      this.scene.add(mesh);
      particles.push({
        mesh,
        velocity,
        life: RING.BURST_LIFETIME,
        maxLife: RING.BURST_LIFETIME,
      });
    }
    this.bursts.push(...particles);
  }

  emitCrash(position) {
    this.emit(position, PARTICLE_BURST.CRASH_COLOR_PRIMARY, PARTICLE_BURST.CRASH_COUNT_PRIMARY);
    this.emit(position, PARTICLE_BURST.CRASH_COLOR_SECONDARY, PARTICLE_BURST.CRASH_COUNT_SECONDARY);
  }

  update(delta) {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const p = this.bursts[i];
      p.life -= delta;

      if (p.life <= 0) {
        p.mesh.material.dispose();
        this.scene.remove(p.mesh);
        this.bursts.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= PARTICLE_BURST.GRAVITY * delta;

      const t = 1 - (p.life / p.maxLife);
      p.mesh.material.opacity = 1 - t;
      const scale = 1 + t;
      p.mesh.scale.setScalar(scale);
    }
  }

  destroy() {
    for (const p of this.bursts) {
      p.mesh.material.dispose();
      this.scene.remove(p.mesh);
    }
    this.bursts = [];
    this.geo.dispose();
  }
}

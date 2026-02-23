// =============================================================================
// Enemy.js — Single enemy entity: spawn, march toward castle, reach castle
// Larger soldier/knight built from composed geometries (body box, head sphere,
// shield, sword). Has death flash+fade animation and emits dust while marching.
// =============================================================================

import * as THREE from 'three';
import { ENEMY, CASTLE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class Enemy {
  constructor(scene, x, speed, wave) {
    this.scene = scene;
    this.alive = true;
    this.reachedCastle = false;
    this.speed = speed;
    this.dying = false;
    this.deathTimer = 0;

    this.group = new THREE.Group();

    // Pick body color based on wave
    const waveIndex = ((wave || 1) - 1) % ENEMY.WAVE_COLORS.length;
    const bodyColor = ENEMY.WAVE_COLORS[waveIndex];

    // Body
    const bodyGeo = new THREE.BoxGeometry(ENEMY.BODY_WIDTH, ENEMY.BODY_HEIGHT, ENEMY.BODY_DEPTH);
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = ENEMY.BODY_HEIGHT / 2;
    this.body.castShadow = true;
    this.group.add(this.body);

    // Head
    const headGeo = new THREE.SphereGeometry(ENEMY.HEAD_RADIUS, 8, 6);
    const headMat = new THREE.MeshLambertMaterial({ color: ENEMY.HEAD_COLOR });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = ENEMY.HEAD_Y_OFFSET;
    this.head.castShadow = true;
    this.group.add(this.head);

    // Shield on front
    const shieldGeo = new THREE.BoxGeometry(ENEMY.SHIELD_WIDTH, ENEMY.SHIELD_HEIGHT, 0.1);
    const shieldMat = new THREE.MeshLambertMaterial({ color: ENEMY.SHIELD_COLOR });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(-0.35, 0.8, ENEMY.BODY_DEPTH / 2 + 0.1);
    this.group.add(shield);

    // Sword on right side
    const swordGeo = new THREE.BoxGeometry(0.08, ENEMY.SWORD_LENGTH, 0.08);
    const swordMat = new THREE.MeshLambertMaterial({ color: ENEMY.SWORD_COLOR });
    const sword = new THREE.Mesh(swordGeo, swordMat);
    sword.position.set(0.4, 0.9, 0);
    sword.rotation.z = -0.3; // slight angle
    this.group.add(sword);

    // Sword handle
    const handleGeo = new THREE.BoxGeometry(0.12, 0.25, 0.12);
    const handleMat = new THREE.MeshLambertMaterial({ color: ENEMY.SWORD_HANDLE_COLOR });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.35, 0.35, 0);
    this.group.add(handle);

    // Collect all meshes for death animation
    this.meshes = [this.body, this.head, shield, sword, handle];

    // Position at spawn
    this.group.position.set(x, 0, ENEMY.SPAWN_Z);

    // Dust timer
    this.dustTimer = Math.random() * ENEMY.DUST_INTERVAL;

    this.scene.add(this.group);
  }

  update(delta) {
    // Death fade animation
    if (this.dying) {
      this.deathTimer -= delta;
      const t = Math.max(0, this.deathTimer / ENEMY.DEATH_FADE_DURATION);

      for (const mesh of this.meshes) {
        mesh.material.opacity = t;
        mesh.material.transparent = true;
      }

      // Sink and rotate during death
      this.group.position.y -= delta * 2;
      this.group.rotation.x += delta * 1.5;

      if (this.deathTimer <= 0) {
        this.alive = false;
      }
      return;
    }

    if (!this.alive) return;

    // March toward castle (positive Z direction)
    this.group.position.z += this.speed * delta;

    // Walking bob — more pronounced with larger enemies
    this.group.position.y = Math.abs(Math.sin(this.group.position.z * 2)) * 0.2;

    // Arm/sword swing during walk
    const swingAngle = Math.sin(this.group.position.z * 3) * 0.15;
    this.group.rotation.y = swingAngle * 0.3;

    // Emit dust particles periodically
    this.dustTimer -= delta;
    if (this.dustTimer <= 0) {
      this.dustTimer = ENEMY.DUST_INTERVAL;
      eventBus.emit(Events.ENEMY_DUST, {
        position: this.group.position.clone(),
      });
    }

    // Check if reached castle zone
    const castleZone = CASTLE.POSITION_Z - CASTLE.TOWER_SPREAD_Z - 1;
    if (this.group.position.z >= castleZone) {
      this.reachedCastle = true;
      this.alive = false;
    }
  }

  kill() {
    if (this.dying) return;
    this.dying = true;
    this.deathTimer = ENEMY.DEATH_FADE_DURATION;

    // Flash white
    for (const mesh of this.meshes) {
      mesh.material.color.setHex(ENEMY.DEATH_FLASH_COLOR);
    }
  }

  getPosition() {
    return this.group.position;
  }

  destroy() {
    this.scene.remove(this.group);
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
  }
}

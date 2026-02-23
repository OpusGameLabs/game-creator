// =============================================================================
// ProjectileManager.js — Launch projectiles, manage active projectiles
// Handles cooldown, impact detection (splash damage), and visual effects.
// Now spawns fire trail particles via the ParticleSystem.
// =============================================================================

import * as THREE from 'three';
import { PROJECTILE, CASTLE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { Projectile } from './Projectile.js';

export class ProjectileManager {
  constructor(scene, enemyManager, particleSystem) {
    this.scene = scene;
    this.enemyManager = enemyManager;
    this.particleSystem = particleSystem;
    this.projectiles = [];
    this.impactEffects = [];
    this.cooldownTimer = 0;

    // Listen for launch events
    eventBus.on(Events.PROJECTILE_LAUNCHED, (data) => this.launch(data.target));
  }

  launch(targetPos) {
    if (gameState.gameOver) return;
    if (this.cooldownTimer > 0) return;

    // Launch from top of castle
    const startPos = new THREE.Vector3(
      0,
      PROJECTILE.LAUNCH_Y,
      PROJECTILE.LAUNCH_Z
    );

    const projectile = new Projectile(this.scene, startPos, targetPos);
    this.projectiles.push(projectile);
    this.cooldownTimer = PROJECTILE.COOLDOWN;
  }

  update(delta) {
    // Cooldown
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta;
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(delta);

      // Spawn fire trail particles while projectile is alive
      if (proj.alive && this.particleSystem) {
        this.particleSystem.spawnTrail(proj.getPosition().clone());
      }

      if (!proj.alive) {
        if (proj.impacted) {
          this._onImpact(proj.getTargetPosition());
        }
        proj.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    // Update impact effects
    for (let i = this.impactEffects.length - 1; i >= 0; i--) {
      const effect = this.impactEffects[i];
      effect.timer -= delta;
      const t = 1 - (effect.timer / PROJECTILE.IMPACT_DURATION);

      // Expand and fade
      const scale = 1 + t * 3;
      effect.mesh.scale.set(scale, scale, scale);
      effect.mesh.material.opacity = 1 - t;

      if (effect.timer <= 0) {
        this.scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        effect.mesh.material.dispose();
        this.impactEffects.splice(i, 1);
      }
    }
  }

  _onImpact(position) {
    // Visual impact effect
    const impactGeo = new THREE.SphereGeometry(PROJECTILE.IMPACT_RADIUS, 8, 8);
    const impactMat = new THREE.MeshBasicMaterial({
      color: PROJECTILE.IMPACT_COLOR,
      transparent: true,
      opacity: 0.8,
    });
    const impactMesh = new THREE.Mesh(impactGeo, impactMat);
    impactMesh.position.copy(position);
    impactMesh.position.y = 0.5;
    this.scene.add(impactMesh);

    this.impactEffects.push({
      mesh: impactMesh,
      timer: PROJECTILE.IMPACT_DURATION,
    });

    // Splash damage — check all alive enemies within radius
    const aliveEnemies = this.enemyManager.getAliveEnemies();
    let killedCount = 0;

    for (const enemy of aliveEnemies) {
      const enemyPos = enemy.getPosition();
      const dx = enemyPos.x - position.x;
      const dz = enemyPos.z - position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= PROJECTILE.SPLASH_RADIUS) {
        enemy.kill();
        killedCount++;
        eventBus.emit(Events.ENEMY_KILLED, { position: enemyPos.clone() });
      }
    }

    eventBus.emit(Events.PROJECTILE_IMPACT, {
      position: position.clone(),
      killed: killedCount,
    });
  }

  destroyAll() {
    for (const proj of this.projectiles) {
      proj.destroy();
    }
    this.projectiles = [];

    for (const effect of this.impactEffects) {
      this.scene.remove(effect.mesh);
      effect.mesh.geometry.dispose();
      effect.mesh.material.dispose();
    }
    this.impactEffects = [];
  }
}

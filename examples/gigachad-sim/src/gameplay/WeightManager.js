// =============================================================================
// WeightManager.js — Spawns and manages falling weights
// Weights fall from above. Player positions under them to auto-catch.
// Types: dumbbell (small/blue), barbell (large/red), kettlebell (gold).
// Difficulty ramps speed and frequency over time.
// =============================================================================

import * as THREE from 'three';
import { WEIGHTS, ARENA, DIFFICULTY, PLAYER, SPECTACLE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class WeightManager {
  constructor(scene) {
    this.scene = scene;
    this.activeWeights = [];
    this._geometries = new Map();
    this._materials = new Map();

    this._prepareGeometries();
  }

  _prepareGeometries() {
    // Dumbbell: two spheres connected by a cylinder
    // We approximate with a horizontal capsule shape
    for (const wType of WEIGHTS.TYPES) {
      const group = new THREE.Group();
      const s = wType.scale;
      const mat = new THREE.MeshLambertMaterial({ color: wType.color });
      this._materials.set(wType.name, mat);

      if (wType.name === 'dumbbell') {
        // Bar
        const barGeo = new THREE.CylinderGeometry(s * 0.08, s * 0.08, s * 1.0, 8);
        const bar = new THREE.Mesh(barGeo, mat);
        bar.rotation.z = Math.PI / 2;
        group.add(bar);
        // End plates
        const plateGeo = new THREE.CylinderGeometry(s * 0.25, s * 0.25, s * 0.15, 8);
        const leftPlate = new THREE.Mesh(plateGeo, mat);
        leftPlate.rotation.z = Math.PI / 2;
        leftPlate.position.x = -s * 0.5;
        group.add(leftPlate);
        const rightPlate = new THREE.Mesh(plateGeo.clone(), mat);
        rightPlate.rotation.z = Math.PI / 2;
        rightPlate.position.x = s * 0.5;
        group.add(rightPlate);
      } else if (wType.name === 'barbell') {
        // Long bar with big plates
        const barGeo = new THREE.CylinderGeometry(s * 0.06, s * 0.06, s * 1.8, 8);
        const bar = new THREE.Mesh(barGeo, mat);
        bar.rotation.z = Math.PI / 2;
        group.add(bar);
        const plateGeo = new THREE.CylinderGeometry(s * 0.35, s * 0.35, s * 0.1, 12);
        for (const xOff of [-0.7, -0.55, 0.55, 0.7]) {
          const plate = new THREE.Mesh(plateGeo.clone(), mat);
          plate.rotation.z = Math.PI / 2;
          plate.position.x = s * xOff;
          group.add(plate);
        }
      } else if (wType.name === 'kettlebell') {
        // Ball body + handle
        const bodyGeo = new THREE.SphereGeometry(s * 0.3, 12, 8);
        const body = new THREE.Mesh(bodyGeo, mat);
        group.add(body);
        const handleGeo = new THREE.TorusGeometry(s * 0.18, s * 0.04, 8, 12, Math.PI);
        const handle = new THREE.Mesh(handleGeo, mat);
        handle.position.y = s * 0.28;
        handle.rotation.x = Math.PI;
        group.add(handle);
      }

      this._geometries.set(wType.name, group);
    }
  }

  update(delta, playerPos) {
    if (!gameState.entranceDone || gameState.gameOver) return;

    // Difficulty ramp
    gameState.difficultyTimer += delta;
    if (gameState.difficultyTimer >= DIFFICULTY.RAMP_INTERVAL && gameState.difficulty < DIFFICULTY.MAX_LEVEL) {
      gameState.difficultyTimer = 0;
      gameState.difficulty++;
    }

    // Spawn timer
    gameState.spawnTimer -= delta;
    if (gameState.spawnTimer <= 0 && this.activeWeights.length < WEIGHTS.MAX_ACTIVE) {
      this._spawnWeight();
      const interval = Math.max(
        WEIGHTS.SPAWN_INTERVAL_MIN,
        WEIGHTS.SPAWN_INTERVAL_BASE - gameState.difficulty * DIFFICULTY.INTERVAL_DECREMENT
      );
      gameState.spawnTimer = interval;
    }

    // Update falling weights
    const fallSpeed = Math.min(
      WEIGHTS.FALL_SPEED_MAX,
      WEIGHTS.FALL_SPEED_BASE + gameState.difficulty * DIFFICULTY.SPEED_INCREMENT
    );

    for (let i = this.activeWeights.length - 1; i >= 0; i--) {
      const w = this.activeWeights[i];

      // Fall
      w.group.position.y -= fallSpeed * delta;

      // Gentle rotation for visual interest
      w.group.rotation.z += delta * 0.5;

      // Check auto-catch: weight is at catch height and player is close
      if (w.group.position.y <= WEIGHTS.CATCH_Y_THRESHOLD && !w.caught) {
        const dx = Math.abs(w.group.position.x - playerPos.x);
        if (dx < PLAYER.CATCH_RADIUS) {
          this._catchWeight(w, i);
          continue;
        }
      }

      // Weight hit the floor
      if (w.group.position.y <= WEIGHTS.FLOOR_Y && !w.caught) {
        this._missWeight(w, i);
        continue;
      }

      // Caught weight lift animation — rise up and fade
      if (w.caught) {
        w.catchTimer -= delta;
        w.group.position.y += 5 * delta;
        const opacity = Math.max(0, w.catchTimer / WEIGHTS.LIFT_ANIMATION_DURATION);
        w.group.traverse((c) => {
          if (c.isMesh) {
            c.material.transparent = true;
            c.material.opacity = opacity;
          }
        });
        if (w.catchTimer <= 0) {
          this._removeWeight(i);
        }
      }
    }
  }

  _spawnWeight() {
    // Pick random type, weighted toward easier at low difficulty
    const typeIdx = this._pickWeightType();
    const wType = WEIGHTS.TYPES[typeIdx];

    // Clone the template geometry group
    const group = this._geometries.get(wType.name).clone(true);

    // Random X position within arena
    const x = (Math.random() - 0.5) * (ARENA.WIDTH - 2);
    group.position.set(x, WEIGHTS.SPAWN_HEIGHT, 0);

    this.scene.add(group);

    const weight = {
      group,
      type: wType,
      caught: false,
      catchTimer: 0,
    };

    this.activeWeights.push(weight);
    eventBus.emit(Events.WEIGHT_SPAWN, { type: wType.name, x });
  }

  _pickWeightType() {
    // At low difficulty, mostly dumbbells. At high, more barbells and kettlebells.
    const r = Math.random();
    const d = gameState.difficulty / DIFFICULTY.MAX_LEVEL;

    if (r < 0.6 - d * 0.3) return 0; // dumbbell
    if (r < 0.85 - d * 0.1) return 1; // barbell
    return 2; // kettlebell
  }

  _catchWeight(w, index) {
    w.caught = true;
    w.catchTimer = WEIGHTS.LIFT_ANIMATION_DURATION;

    const points = w.type.points;
    const flexBonus = gameState.isFlexing ? PLAYER.FLEX_BONUS : 0;
    const totalPoints = points + flexBonus;

    gameState.addScore(totalPoints);
    gameState.incrementCombo();
    gameState.totalLifts++;

    eventBus.emit(Events.WEIGHT_CAUGHT, {
      type: w.type.name,
      points: totalPoints,
      combo: gameState.combo,
      x: w.group.position.x,
    });
    eventBus.emit(Events.PLAYER_LIFT, { points: totalPoints });
    eventBus.emit(Events.SPECTACLE_HIT, { points: totalPoints });

    // Check combo thresholds
    if (SPECTACLE.COMBO_THRESHOLDS.includes(gameState.combo)) {
      eventBus.emit(Events.SPECTACLE_STREAK, { combo: gameState.combo });
    }
    if (gameState.combo > 1) {
      eventBus.emit(Events.SPECTACLE_COMBO, { combo: gameState.combo });
    }
  }

  _missWeight(w, index) {
    gameState.resetCombo();
    gameState.loseLife();

    eventBus.emit(Events.WEIGHT_MISSED, { type: w.type.name, x: w.group.position.x });
    eventBus.emit(Events.PLAYER_HIT, { lives: gameState.lives });

    this._removeWeight(index);
  }

  _removeWeight(index) {
    const w = this.activeWeights[index];
    w.group.traverse((c) => {
      if (c.isMesh) {
        c.geometry.dispose();
        if (c.material.dispose) c.material.dispose();
      }
    });
    this.scene.remove(w.group);
    this.activeWeights.splice(index, 1);
  }

  clearAll() {
    for (let i = this.activeWeights.length - 1; i >= 0; i--) {
      this._removeWeight(i);
    }
  }

  destroy() {
    this.clearAll();
    // Dispose template geometries
    this._geometries.forEach((group) => {
      group.traverse((c) => {
        if (c.isMesh) {
          c.geometry.dispose();
        }
      });
    });
    this._materials.forEach((mat) => mat.dispose());
  }
}

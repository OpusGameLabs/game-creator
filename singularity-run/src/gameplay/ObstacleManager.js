import * as THREE from 'three';
import { OBSTACLE, COLLECTIBLE, RUNNER } from '../core/Constants.js';

// Obstacle types
const ObstacleType = {
  GROUND: 'ground',
  OVERHEAD: 'overhead',
  DOUBLE: 'double',
};

export class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = []; // { group, type, lane, z, box }
    this.collectibles = []; // { mesh, z, lane, baseY, time }
    this.lastSpawnZ = 0;

    // Shared geometries for performance
    this._groundGeo = new THREE.BoxGeometry(
      OBSTACLE.BARRIER_WIDTH,
      OBSTACLE.GROUND_OBSTACLE_HEIGHT,
      OBSTACLE.BARRIER_WIDTH * 0.4
    );
    this._overheadGeo = new THREE.BoxGeometry(
      OBSTACLE.BARRIER_WIDTH,
      OBSTACLE.OVERHEAD_HEIGHT,
      OBSTACLE.BARRIER_WIDTH * 0.4
    );
    this._collectibleGeo = new THREE.BoxGeometry(
      COLLECTIBLE.SIZE,
      COLLECTIBLE.SIZE,
      COLLECTIBLE.SIZE
    );

    // Shared materials
    this._obstacleMat = new THREE.MeshPhongMaterial({
      color: OBSTACLE.COLOR,
      emissive: 0xff1111,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    this._collectibleMat = new THREE.MeshPhongMaterial({
      color: COLLECTIBLE.COLOR,
      emissive: COLLECTIBLE.GLOW_COLOR,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
    });
  }

  /** Spawn obstacles/collectibles ahead of the player as needed */
  update(delta, playerZ, currentSpeed) {
    // Determine spawn frontier
    const spawnFrontier = playerZ - OBSTACLE.SPAWN_DISTANCE;
    const despawnLine = playerZ - OBSTACLE.DESPAWN_DISTANCE;

    // Spawn new obstacles if needed
    while (this.lastSpawnZ > spawnFrontier) {
      this.lastSpawnZ -= OBSTACLE.MIN_GAP + Math.random() * OBSTACLE.MIN_GAP * 0.5;
      this._spawnObstacle(this.lastSpawnZ);

      // Possibly spawn a collectible between obstacles
      if (Math.random() < COLLECTIBLE.SPAWN_CHANCE) {
        const collectibleZ = this.lastSpawnZ + OBSTACLE.MIN_GAP * 0.5;
        this._spawnCollectible(collectibleZ);
      }
    }

    // Update collectibles (rotation + hover)
    for (const c of this.collectibles) {
      c.time += delta;
      c.mesh.rotation.y += COLLECTIBLE.ROTATION_SPEED * delta;
      c.mesh.rotation.x += COLLECTIBLE.ROTATION_SPEED * 0.5 * delta;
      c.mesh.position.y = c.baseY + Math.sin(c.time * COLLECTIBLE.HOVER_SPEED) * COLLECTIBLE.HOVER_AMPLITUDE;
    }

    // Remove obstacles that passed behind the player
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      if (this.obstacles[i].z > despawnLine) {
        this._removeObstacle(i);
      }
    }

    // Remove collectibles that passed behind
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      if (this.collectibles[i].z > despawnLine) {
        this._removeCollectible(i);
      }
    }
  }

  /** Get collision boxes for all active obstacles */
  getObstacleBoxes() {
    const boxes = [];
    for (const obs of this.obstacles) {
      boxes.push(obs.box);
    }
    return boxes;
  }

  /** Get collectible data for collision checking */
  getCollectibles() {
    return this.collectibles;
  }

  /** Get the shared obstacle material (for warning glow effect) */
  getObstacleMaterial() {
    return this._obstacleMat;
  }

  /** Check if a collectible intersects the given box. Returns removed collectible or null. */
  checkCollectibleCollision(playerBox) {
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      const cBox = new THREE.Box3().setFromObject(c.mesh);
      if (playerBox.intersectsBox(cBox)) {
        const collected = this.collectibles[i];
        this.scene.remove(collected.mesh);
        this.collectibles.splice(i, 1);
        return collected;
      }
    }
    return null;
  }

  /** Get the nearest obstacle ahead of the player for AI state reporting */
  getNearestObstacle(playerZ) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const obs of this.obstacles) {
      // Obstacles ahead have smaller (more negative) Z than player
      const dist = obs.z - playerZ; // negative means ahead
      if (dist < 0 && Math.abs(dist) < nearestDist) {
        nearestDist = Math.abs(dist);
        nearest = obs;
      }
    }
    return nearest;
  }

  /** Remove all obstacles and collectibles (for restart) */
  clear() {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this._removeObstacle(i);
    }
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      this._removeCollectible(i);
    }
    this.lastSpawnZ = 0;
  }

  // --- Internal spawning ---

  _spawnObstacle(z) {
    const typeRoll = Math.random();
    let type;
    if (typeRoll < 0.4) {
      type = ObstacleType.GROUND;
    } else if (typeRoll < 0.7) {
      type = ObstacleType.OVERHEAD;
    } else {
      type = ObstacleType.DOUBLE;
    }

    if (type === ObstacleType.GROUND) {
      this._spawnGroundObstacle(z);
    } else if (type === ObstacleType.OVERHEAD) {
      this._spawnOverheadObstacle(z);
    } else {
      this._spawnDoubleObstacle(z);
    }
  }

  _spawnGroundObstacle(z) {
    const lane = RUNNER.LANES[Math.floor(Math.random() * RUNNER.LANES.length)];
    const x = lane * RUNNER.LANE_WIDTH;

    const mesh = new THREE.Mesh(this._groundGeo, this._obstacleMat);
    mesh.position.set(x, OBSTACLE.GROUND_OBSTACLE_HEIGHT * 0.5, z);
    this.scene.add(mesh);

    const halfW = OBSTACLE.BARRIER_WIDTH * 0.5;
    const halfD = OBSTACLE.BARRIER_WIDTH * 0.2;
    const box = new THREE.Box3(
      new THREE.Vector3(x - halfW, 0, z - halfD),
      new THREE.Vector3(x + halfW, OBSTACLE.GROUND_OBSTACLE_HEIGHT, z + halfD)
    );

    this.obstacles.push({ mesh, type: ObstacleType.GROUND, lane, z, box });
  }

  _spawnOverheadObstacle(z) {
    // Overhead beam spans all lanes — player must slide
    const mesh = new THREE.Mesh(this._overheadGeo, this._obstacleMat);
    // Scale width to span entire corridor
    const corridorWidth = RUNNER.LANE_WIDTH * 3;
    mesh.scale.x = corridorWidth / OBSTACLE.BARRIER_WIDTH;
    mesh.position.set(0, OBSTACLE.OVERHEAD_Y + OBSTACLE.OVERHEAD_HEIGHT * 0.5, z);
    this.scene.add(mesh);

    const halfW = corridorWidth * 0.5;
    const halfD = OBSTACLE.BARRIER_WIDTH * 0.2;
    const box = new THREE.Box3(
      new THREE.Vector3(-halfW, OBSTACLE.OVERHEAD_Y, z - halfD),
      new THREE.Vector3(halfW, OBSTACLE.OVERHEAD_Y + OBSTACLE.OVERHEAD_HEIGHT, z + halfD)
    );

    this.obstacles.push({ mesh, type: ObstacleType.OVERHEAD, lane: 0, z, box });
  }

  _spawnDoubleObstacle(z) {
    // Block two lanes, leave one open
    const openLaneIdx = Math.floor(Math.random() * 3);
    for (let i = 0; i < 3; i++) {
      if (i === openLaneIdx) continue;
      const lane = RUNNER.LANES[i];
      const x = lane * RUNNER.LANE_WIDTH;

      const mesh = new THREE.Mesh(this._groundGeo, this._obstacleMat);
      mesh.position.set(x, OBSTACLE.GROUND_OBSTACLE_HEIGHT * 0.5, z);
      this.scene.add(mesh);

      const halfW = OBSTACLE.BARRIER_WIDTH * 0.5;
      const halfD = OBSTACLE.BARRIER_WIDTH * 0.2;
      const box = new THREE.Box3(
        new THREE.Vector3(x - halfW, 0, z - halfD),
        new THREE.Vector3(x + halfW, OBSTACLE.GROUND_OBSTACLE_HEIGHT, z + halfD)
      );

      this.obstacles.push({ mesh, type: ObstacleType.DOUBLE, lane, z, box });
    }
  }

  _spawnCollectible(z) {
    const lane = RUNNER.LANES[Math.floor(Math.random() * RUNNER.LANES.length)];
    const x = lane * RUNNER.LANE_WIDTH;
    const baseY = 1.0;

    const mesh = new THREE.Mesh(this._collectibleGeo, this._collectibleMat);
    mesh.position.set(x, baseY, z);
    this.scene.add(mesh);

    this.collectibles.push({ mesh, z, lane, baseY, time: Math.random() * Math.PI * 2 });
  }

  _removeObstacle(index) {
    const obs = this.obstacles[index];
    this.scene.remove(obs.mesh);
    this.obstacles.splice(index, 1);
  }

  _removeCollectible(index) {
    const c = this.collectibles[index];
    this.scene.remove(c.mesh);
    this.collectibles.splice(index, 1);
  }

  /** Dispose shared resources */
  dispose() {
    this.clear();
    this._groundGeo.dispose();
    this._overheadGeo.dispose();
    this._collectibleGeo.dispose();
    this._obstacleMat.dispose();
    this._collectibleMat.dispose();
  }
}

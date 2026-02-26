import * as THREE from 'three';
import { STREET, HOUSE, AGENT, LEVEL } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { House } from '../entities/House.js';
import { Agent } from '../entities/Agent.js';

export class StreetGenerator {
  constructor(scene) {
    this.scene = scene;
    this.houses = [];
    this.agents = [];
    this.streetSegments = [];

    // Track how far we have generated (houses)
    this._generatedZ = 10;
    // Track how far ahead street surface extends
    this._lastStreetEnd = -HOUSE.SPAWN_DISTANCE - 20;
    this._agentTimer = AGENT.SPAWN_INTERVAL;

    // Shared materials (reuse for performance)
    this._streetMat = new THREE.MeshLambertMaterial({ color: LEVEL.STREET_COLOR });
    this._sidewalkMat = new THREE.MeshLambertMaterial({ color: LEVEL.SIDEWALK_COLOR });
    this._grassMat = new THREE.MeshLambertMaterial({ color: LEVEL.GROUND_COLOR });
    this._lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this._generateInitial();
  }

  _generateInitial() {
    // Generate house rows from z=+10 to z=-SPAWN_DISTANCE
    while (this._generatedZ > -HOUSE.SPAWN_DISTANCE) {
      this._generateRow(this._generatedZ);
      this._generatedZ -= HOUSE.SPACING_Z;
    }
    // Generate initial street surface
    this._generateStreetSurface(20, this._lastStreetEnd);
  }

  _generateStreetSurface(startZ, endZ) {
    const length = startZ - endZ;
    const centerZ = (startZ + endZ) / 2;

    // Main road
    const roadGeo = new THREE.PlaneGeometry(STREET.WIDTH, length);
    const road = new THREE.Mesh(roadGeo, this._streetMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, centerZ);
    road.receiveShadow = true;
    this.scene.add(road);
    this.streetSegments.push(road);

    // Left sidewalk
    const swGeo = new THREE.PlaneGeometry(STREET.SIDEWALK_WIDTH, length);
    const swLeft = new THREE.Mesh(swGeo, this._sidewalkMat);
    swLeft.rotation.x = -Math.PI / 2;
    swLeft.position.set(-(STREET.WIDTH / 2 + STREET.SIDEWALK_WIDTH / 2), 0.02, centerZ);
    swLeft.receiveShadow = true;
    this.scene.add(swLeft);
    this.streetSegments.push(swLeft);

    // Right sidewalk
    const swRight = new THREE.Mesh(swGeo, this._sidewalkMat);
    swRight.rotation.x = -Math.PI / 2;
    swRight.position.set(STREET.WIDTH / 2 + STREET.SIDEWALK_WIDTH / 2, 0.02, centerZ);
    swRight.receiveShadow = true;
    this.scene.add(swRight);
    this.streetSegments.push(swRight);

    // Left grass strip
    const grassGeo = new THREE.PlaneGeometry(8, length);
    const grassLeft = new THREE.Mesh(grassGeo, this._grassMat);
    grassLeft.rotation.x = -Math.PI / 2;
    grassLeft.position.set(-(STREET.WIDTH / 2 + STREET.SIDEWALK_WIDTH + 4), 0, centerZ);
    grassLeft.receiveShadow = true;
    this.scene.add(grassLeft);
    this.streetSegments.push(grassLeft);

    // Right grass strip
    const grassRight = new THREE.Mesh(grassGeo, this._grassMat);
    grassRight.rotation.x = -Math.PI / 2;
    grassRight.position.set(STREET.WIDTH / 2 + STREET.SIDEWALK_WIDTH + 4, 0, centerZ);
    grassRight.receiveShadow = true;
    this.scene.add(grassRight);
    this.streetSegments.push(grassRight);

    // Lane markings (dashed center line)
    for (let z = startZ; z > endZ; z -= (STREET.LANE_MARKING_LENGTH + STREET.LANE_MARKING_GAP)) {
      const lineGeo = new THREE.PlaneGeometry(STREET.LANE_MARKING_WIDTH, STREET.LANE_MARKING_LENGTH);
      const line = new THREE.Mesh(lineGeo, this._lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.03, z);
      this.scene.add(line);
      this.streetSegments.push(line);
    }
  }

  _generateRow(z) {
    // Left house (random chance to skip for gaps)
    if (Math.random() > 0.2) {
      const house = new House(-STREET.HOUSE_OFFSET_X, z, 'left');
      this.scene.add(house.mesh);
      this.houses.push(house);
    }

    // Right house
    if (Math.random() > 0.2) {
      const house = new House(STREET.HOUSE_OFFSET_X, z, 'right');
      this.scene.add(house.mesh);
      this.houses.push(house);
    }
  }

  update(delta, playerZ) {
    // Generate new houses ahead of player
    while (this._generatedZ > playerZ - HOUSE.SPAWN_DISTANCE) {
      this._generateRow(this._generatedZ);
      this._generatedZ -= HOUSE.SPACING_Z;
    }

    // Extend street surface as player advances
    if (playerZ - 40 < this._lastStreetEnd) {
      const newEnd = this._lastStreetEnd - STREET.SEGMENT_LENGTH;
      this._generateStreetSurface(this._lastStreetEnd, newEnd);
      this._lastStreetEnd = newEnd;
    }

    // Update houses
    for (const house of this.houses) {
      house.update(delta);
    }

    // Spawn agents
    this._agentTimer -= delta;
    if (this._agentTimer <= 0) {
      this._spawnAgent(playerZ);
      // Decrease interval as speed increases, but clamp
      const speedRatio = gameState.currentSpeed / 25;
      const interval = Math.max(
        AGENT.MIN_SPAWN_INTERVAL,
        AGENT.SPAWN_INTERVAL * (1 - speedRatio * 0.5)
      );
      this._agentTimer = interval + (Math.random() - 0.5) * interval * 0.5;
    }

    // Update agents
    for (const agent of this.agents) {
      agent.update(delta, playerZ);
    }

    // Cleanup entities behind the player
    this._cleanup(playerZ);
  }

  _spawnAgent(playerZ) {
    // Spawn on a random lane position ahead of player
    const laneX = (Math.random() - 0.5) * (STREET.WIDTH - 1);
    const spawnZ = playerZ - AGENT.SPAWN_DISTANCE;
    const agent = new Agent(laneX, spawnZ);
    this.scene.add(agent.mesh);
    this.agents.push(agent);
  }

  _cleanup(playerZ) {
    // Remove houses far behind the player
    for (let i = this.houses.length - 1; i >= 0; i--) {
      if (this.houses[i].mesh.position.z > playerZ + HOUSE.CLEANUP_DISTANCE) {
        this.houses[i].dispose(this.scene);
        this.houses.splice(i, 1);
      }
    }

    // Remove dead agents
    for (let i = this.agents.length - 1; i >= 0; i--) {
      if (!this.agents[i].alive) {
        this.agents[i].dispose(this.scene);
        this.agents.splice(i, 1);
      }
    }

    // Remove street segments far behind player
    for (let i = this.streetSegments.length - 1; i >= 0; i--) {
      const seg = this.streetSegments[i];
      if (seg.position.z > playerZ + 40) {
        seg.geometry.dispose();
        this.scene.remove(seg);
        this.streetSegments.splice(i, 1);
      }
    }
  }

  /** Get houses within range for collision checks */
  getHousesInRange(z, range) {
    return this.houses.filter(h =>
      !h.isHit && Math.abs(h.mesh.position.z - z) < range
    );
  }

  /** Get agents within range for collision checks */
  getAgentsInRange(z, range) {
    return this.agents.filter(a =>
      a.alive && !a.hasCollided && Math.abs(a.mesh.position.z - z) < range
    );
  }

  reset() {
    for (const house of this.houses) house.dispose(this.scene);
    for (const agent of this.agents) agent.dispose(this.scene);
    for (const seg of this.streetSegments) {
      seg.geometry.dispose();
      this.scene.remove(seg);
    }
    this.houses = [];
    this.agents = [];
    this.streetSegments = [];
    this._generatedZ = 10;
    this._lastStreetEnd = -HOUSE.SPAWN_DISTANCE - 20;
    this._agentTimer = AGENT.SPAWN_INTERVAL;
    this._generateInitial();
  }
}

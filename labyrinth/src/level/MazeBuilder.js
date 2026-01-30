import * as THREE from 'three';
import { MAZE, HOLES, GEMS, EXIT, COLORS, LEVELS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

// Directions: top, right, bottom, left
const DIR = {
  TOP: 0,
  RIGHT: 1,
  BOTTOM: 2,
  LEFT: 3,
};

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
const OPPOSITE = [2, 3, 0, 1];

export class MazeBuilder {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.gems = [];
    this.holes = [];
    this.exitMesh = null;
    this.exitPosition = null;
    this.grid = null;
    this.width = 0;
    this.height = 0;
    this.time = 0;

    // Wall collision data (world-space AABBs)
    this.wallBoxes = [];
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Generate a maze for the given level number (1-based).
   * Returns { startWorldPos, exitWorldPos, totalGems }
   */
  generate(levelNumber) {
    this.destroy();

    const cfg = LEVELS[Math.min(levelNumber - 1, LEVELS.length - 1)];
    this.width = cfg.mazeWidth;
    this.height = cfg.mazeHeight;

    // Generate maze grid using recursive backtracking
    this.grid = this._generateGrid(this.width, this.height);

    // Find solution path (for placing exit at the farthest point from start)
    const distances = this._bfs(0, 0);
    let maxDist = 0;
    let exitRow = 0;
    let exitCol = 0;
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        if (distances[r][c] > maxDist) {
          maxDist = distances[r][c];
          exitRow = r;
          exitCol = c;
        }
      }
    }

    // Collect dead-end cells and path cells for placing items
    const deadEnds = [];
    const pathCells = [];
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        if (r === 0 && c === 0) continue; // skip start
        if (r === exitRow && c === exitCol) continue; // skip exit
        const cell = this.grid[r][c];
        const openWalls = cell.filter(w => !w).length;
        if (openWalls === 1) {
          deadEnds.push({ row: r, col: c, dist: distances[r][c] });
        } else {
          pathCells.push({ row: r, col: c, dist: distances[r][c] });
        }
      }
    }

    // Build the 3D representation
    this._buildFloor();
    this._buildWalls();
    this._buildLighting();

    // Place exit
    this.exitPosition = this._cellToWorld(exitRow, exitCol);
    this._buildExit(this.exitPosition);

    // Place gems -- prefer dead-ends then fall back to path cells
    const shuffledDeadEnds = this._shuffle([...deadEnds]);
    const shuffledPath = this._shuffle([...pathCells]);
    const gemCandidates = [...shuffledDeadEnds, ...shuffledPath];
    const gemCount = Math.min(cfg.gems, gemCandidates.length);
    for (let i = 0; i < gemCount; i++) {
      const cell = gemCandidates[i];
      const pos = this._cellToWorld(cell.row, cell.col);
      this._buildGem(pos);
    }

    // Place holes -- use path cells (not dead-ends, to be fair)
    // Avoid placing holes too close to start or exit
    const holeCandidates = shuffledPath.filter(
      c => c.dist > 2 && c.dist < maxDist - 1
    );
    const holeCount = Math.min(cfg.holes, holeCandidates.length);
    // Also remove cells that already have gems
    const gemPositions = new Set(
      this.gems.map(g => `${Math.round(g.position.x * 10)},${Math.round(g.position.z * 10)}`)
    );
    let holesPlaced = 0;
    for (let i = 0; i < holeCandidates.length && holesPlaced < holeCount; i++) {
      const cell = holeCandidates[i];
      const pos = this._cellToWorld(cell.row, cell.col);
      const key = `${Math.round(pos.x * 10)},${Math.round(pos.z * 10)}`;
      if (!gemPositions.has(key)) {
        this._buildHole(pos);
        holesPlaced++;
      }
    }

    const startPos = this._cellToWorld(0, 0);
    return {
      startWorldPos: startPos,
      exitWorldPos: this.exitPosition,
      totalGems: this.gems.length,
    };
  }

  /**
   * Update animated objects (gems bobbing/rotating, exit pulsing).
   */
  update(delta) {
    this.time += delta;

    // Animate gems
    for (const gem of this.gems) {
      if (!gem.userData.collected) {
        gem.rotation.y += GEMS.ROTATION_SPEED * delta;
        gem.position.y =
          GEMS.FLOAT_Y + Math.sin(this.time * GEMS.BOB_SPEED + gem.userData.phase) * GEMS.BOB_HEIGHT;
      }
    }

    // Animate exit
    if (this.exitMesh) {
      this.exitMesh.rotation.y += EXIT.ROTATION_SPEED * delta;
      this.exitMesh.position.y =
        EXIT.FLOAT_Y + Math.sin(this.time * EXIT.BOB_SPEED) * EXIT.BOB_HEIGHT;
    }
  }

  /**
   * Check if a sphere at `position` with given `radius` collides with any wall.
   * Returns the corrected position that slides along walls.
   */
  checkWallCollision(position, radius) {
    let corrected = position.clone();

    for (const box of this.wallBoxes) {
      // Find closest point on AABB to sphere center
      const closestX = Math.max(box.minX, Math.min(corrected.x, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(corrected.z, box.maxZ));

      const dx = corrected.x - closestX;
      const dz = corrected.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = radius - dist;
        const nx = dx / dist;
        const nz = dz / dist;
        corrected.x += nx * overlap;
        corrected.z += nz * overlap;
      }
    }

    return corrected;
  }

  /**
   * Check if the ball center is over a hole.
   * Returns true if ball fell.
   */
  checkHoleCollision(position) {
    for (const hole of this.holes) {
      const dx = position.x - hole.x;
      const dz = position.z - hole.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < HOLES.RADIUS * HOLES.RADIUS * 0.6) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if ball touches a gem. Returns gem data or null.
   */
  checkGemCollision(position, radius) {
    const collectRadius = radius + GEMS.RADIUS;
    for (const gem of this.gems) {
      if (gem.userData.collected) continue;
      const dx = position.x - gem.position.x;
      const dz = position.z - gem.position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < collectRadius * collectRadius) {
        gem.userData.collected = true;
        gem.visible = false;
        return gem;
      }
    }
    return null;
  }

  /**
   * Check if ball reached the exit.
   */
  checkExitCollision(position, radius) {
    if (!this.exitPosition) return false;
    const dx = position.x - this.exitPosition.x;
    const dz = position.z - this.exitPosition.z;
    const distSq = dx * dx + dz * dz;
    const exitRadius = EXIT.SIZE + radius;
    return distSq < exitRadius * exitRadius;
  }

  /**
   * Clean up all Three.js objects.
   */
  destroy() {
    for (const mesh of this.meshes) {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      this.scene.remove(mesh);
    }
    this.meshes = [];
    this.gems = [];
    this.holes = [];
    this.wallBoxes = [];
    this.exitMesh = null;
    this.exitPosition = null;
    this.grid = null;
    this.time = 0;
  }

  // ---------------------------------------------------------------------------
  // Maze generation (recursive backtracking)
  // ---------------------------------------------------------------------------

  _generateGrid(width, height) {
    // Each cell has 4 walls: [top, right, bottom, left] = true means wall exists
    const grid = [];
    for (let r = 0; r < height; r++) {
      grid[r] = [];
      for (let c = 0; c < width; c++) {
        grid[r][c] = [true, true, true, true];
      }
    }

    const visited = [];
    for (let r = 0; r < height; r++) {
      visited[r] = [];
      for (let c = 0; c < width; c++) {
        visited[r][c] = false;
      }
    }

    // Recursive backtracking with explicit stack (avoid call stack overflow)
    const stack = [];
    visited[0][0] = true;
    stack.push({ row: 0, col: 0 });

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = [];

      for (let d = 0; d < 4; d++) {
        const nr = current.row + DY[d];
        const nc = current.col + DX[d];
        if (nr >= 0 && nr < height && nc >= 0 && nc < width && !visited[nr][nc]) {
          neighbors.push({ row: nr, col: nc, dir: d });
        }
      }

      if (neighbors.length === 0) {
        stack.pop();
      } else {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        // Remove wall between current and next
        grid[current.row][current.col][next.dir] = false;
        grid[next.row][next.col][OPPOSITE[next.dir]] = false;
        visited[next.row][next.col] = true;
        stack.push({ row: next.row, col: next.col });
      }
    }

    return grid;
  }

  // ---------------------------------------------------------------------------
  // BFS for finding distances from start
  // ---------------------------------------------------------------------------

  _bfs(startRow, startCol) {
    const dist = [];
    for (let r = 0; r < this.height; r++) {
      dist[r] = [];
      for (let c = 0; c < this.width; c++) {
        dist[r][c] = -1;
      }
    }

    const queue = [{ row: startRow, col: startCol }];
    dist[startRow][startCol] = 0;

    while (queue.length > 0) {
      const { row, col } = queue.shift();
      for (let d = 0; d < 4; d++) {
        if (!this.grid[row][col][d]) {
          // wall is open
          const nr = row + DY[d];
          const nc = col + DX[d];
          if (nr >= 0 && nr < this.height && nc >= 0 && nc < this.width && dist[nr][nc] === -1) {
            dist[nr][nc] = dist[row][col] + 1;
            queue.push({ row: nr, col: nc });
          }
        }
      }
    }

    return dist;
  }

  // ---------------------------------------------------------------------------
  // Coordinate helpers
  // ---------------------------------------------------------------------------

  _cellToWorld(row, col) {
    const totalW = this.width * MAZE.CELL_SIZE;
    const totalH = this.height * MAZE.CELL_SIZE;
    return new THREE.Vector3(
      col * MAZE.CELL_SIZE - totalW / 2 + MAZE.CELL_SIZE / 2,
      0,
      row * MAZE.CELL_SIZE - totalH / 2 + MAZE.CELL_SIZE / 2
    );
  }

  // ---------------------------------------------------------------------------
  // 3D construction
  // ---------------------------------------------------------------------------

  _buildFloor() {
    const totalW = this.width * MAZE.CELL_SIZE + MAZE.WALL_THICKNESS * 2;
    const totalH = this.height * MAZE.CELL_SIZE + MAZE.WALL_THICKNESS * 2;

    const geometry = new THREE.PlaneGeometry(totalW, totalH);
    const material = new THREE.MeshStandardMaterial({
      color: MAZE.FLOOR_COLOR,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.meshes.push(floor);
  }

  _buildWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: MAZE.WALL_COLOR,
      roughness: 0.7,
      metalness: 0.2,
    });

    const totalW = this.width * MAZE.CELL_SIZE;
    const totalH = this.height * MAZE.CELL_SIZE;
    const offsetX = -totalW / 2;
    const offsetZ = -totalH / 2;
    const cs = MAZE.CELL_SIZE;
    const wt = MAZE.WALL_THICKNESS;
    const wh = MAZE.WALL_HEIGHT;

    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        const cell = this.grid[r][c];
        const cx = offsetX + c * cs;
        const cz = offsetZ + r * cs;

        // Top wall (row = 0 boundary or internal)
        if (cell[DIR.TOP]) {
          this._addWall(
            cx + cs / 2, wh / 2, cz,
            cs + wt, wh, wt,
            wallMaterial
          );
        }

        // Left wall
        if (cell[DIR.LEFT]) {
          this._addWall(
            cx, wh / 2, cz + cs / 2,
            wt, wh, cs + wt,
            wallMaterial
          );
        }

        // Right wall (only for last column -- rightmost boundary)
        if (c === this.width - 1 && cell[DIR.RIGHT]) {
          this._addWall(
            cx + cs, wh / 2, cz + cs / 2,
            wt, wh, cs + wt,
            wallMaterial
          );
        }

        // Bottom wall (only for last row -- bottom boundary)
        if (r === this.height - 1 && cell[DIR.BOTTOM]) {
          this._addWall(
            cx + cs / 2, wh / 2, cz + cs,
            cs + wt, wh, wt,
            wallMaterial
          );
        }
      }
    }
  }

  _addWall(x, y, z, sx, sy, sz, material) {
    const geometry = new THREE.BoxGeometry(sx, sy, sz);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.meshes.push(mesh);

    // Store AABB for collision
    this.wallBoxes.push({
      minX: x - sx / 2,
      maxX: x + sx / 2,
      minZ: z - sz / 2,
      maxZ: z + sz / 2,
    });
  }

  _buildLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, COLORS.AMBIENT_INTENSITY);
    this.scene.add(ambient);
    this.meshes.push(ambient);

    // Directional (sun-like)
    const dir = new THREE.DirectionalLight(COLORS.DIR_LIGHT, COLORS.DIR_INTENSITY);
    dir.position.set(COLORS.DIR_POSITION_X, COLORS.DIR_POSITION_Y, COLORS.DIR_POSITION_Z);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 1024;
    dir.shadow.mapSize.height = 1024;
    const totalSize = Math.max(this.width, this.height) * MAZE.CELL_SIZE;
    dir.shadow.camera.left = -totalSize;
    dir.shadow.camera.right = totalSize;
    dir.shadow.camera.top = totalSize;
    dir.shadow.camera.bottom = -totalSize;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 50;
    this.scene.add(dir);
    this.meshes.push(dir);

    // Fog
    this.scene.fog = new THREE.Fog(COLORS.FOG_COLOR, COLORS.FOG_NEAR, COLORS.FOG_FAR);
  }

  _buildGem(pos) {
    const geometry = new THREE.OctahedronGeometry(GEMS.RADIUS, 0);
    const material = new THREE.MeshStandardMaterial({
      color: GEMS.COLOR,
      emissive: GEMS.EMISSIVE,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.2,
    });
    const gem = new THREE.Mesh(geometry, material);
    gem.position.set(pos.x, GEMS.FLOAT_Y, pos.z);
    gem.userData.collected = false;
    gem.userData.phase = Math.random() * Math.PI * 2;
    gem.castShadow = true;
    this.scene.add(gem);
    this.meshes.push(gem);
    this.gems.push(gem);
  }

  _buildHole(pos) {
    const geometry = new THREE.CircleGeometry(HOLES.RADIUS, 24);
    const material = new THREE.MeshStandardMaterial({
      color: HOLES.COLOR,
      roughness: 1.0,
      metalness: 0.0,
    });
    const hole = new THREE.Mesh(geometry, material);
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(pos.x, 0.01, pos.z);
    this.scene.add(hole);
    this.meshes.push(hole);

    // Store hole position for collision
    this.holes.push({ x: pos.x, z: pos.z });
  }

  _buildExit(pos) {
    // A glowing ring / torus as the exit portal
    const geometry = new THREE.TorusGeometry(EXIT.SIZE, 0.15, 8, 24);
    const material = new THREE.MeshStandardMaterial({
      color: EXIT.COLOR,
      emissive: EXIT.EMISSIVE,
      emissiveIntensity: 0.8,
      metalness: 0.4,
      roughness: 0.3,
    });
    this.exitMesh = new THREE.Mesh(geometry, material);
    this.exitMesh.position.set(pos.x, EXIT.FLOAT_Y, pos.z);
    this.exitMesh.rotation.x = -Math.PI / 2;
    this.exitMesh.castShadow = true;
    this.scene.add(this.exitMesh);
    this.meshes.push(this.exitMesh);

    // Add a point light at the exit for a glow effect
    const light = new THREE.PointLight(EXIT.GLOW_COLOR, 1.0, 6);
    light.position.set(pos.x, 1.5, pos.z);
    this.scene.add(light);
    this.meshes.push(light);
  }

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// =============================================================================
// EnemyCastle.js — Dark menacing fortress at the far end of the battlefield
// Enemies emerge from its gate and march toward the player's castle.
// Built with the same techniques as Castle.js but darker, wider, and sinister.
// =============================================================================

import * as THREE from 'three';
import { ENEMY_CASTLE } from '../core/Constants.js';

export class EnemyCastle {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(0, ENEMY_CASTLE.POSITION_Y, ENEMY_CASTLE.POSITION_Z);

    this.allMeshes = [];
    this.torchLights = [];
    this.banners = [];
    this.windowMeshes = [];
    this.gateGlowLight = null;
    this.elapsedTime = 0;

    this.buildKeep();
    this.buildTowers();
    this.buildWalls();
    this.buildBattlements();
    this.buildGate();
    this.buildBanners();
    this.buildTorches();
    this.buildGateGlow();
    this.buildWindows();
    this.buildSkullDecorations();

    this.scene.add(this.group);
  }

  // --- Build Methods ---

  buildKeep() {
    const geo = new THREE.BoxGeometry(
      ENEMY_CASTLE.KEEP_WIDTH, ENEMY_CASTLE.KEEP_HEIGHT, ENEMY_CASTLE.KEEP_DEPTH
    );
    const mat = new THREE.MeshLambertMaterial({ color: ENEMY_CASTLE.KEEP_COLOR });
    const keep = new THREE.Mesh(geo, mat);
    keep.position.y = ENEMY_CASTLE.KEEP_HEIGHT / 2;
    keep.castShadow = true;
    keep.receiveShadow = true;
    this.group.add(keep);
    this._trackMesh(keep);

    // Keep roof — dark flat top with jagged edge feel
    const roofGeo = new THREE.BoxGeometry(
      ENEMY_CASTLE.KEEP_WIDTH + 0.8, 0.6, ENEMY_CASTLE.KEEP_DEPTH + 0.8
    );
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = ENEMY_CASTLE.KEEP_HEIGHT + 0.3;
    roof.castShadow = true;
    this.group.add(roof);
    this._trackMesh(roof);
  }

  buildTowers() {
    const positions = [
      [-ENEMY_CASTLE.TOWER_SPREAD_X, 0, -ENEMY_CASTLE.TOWER_SPREAD_Z],
      [ENEMY_CASTLE.TOWER_SPREAD_X, 0, -ENEMY_CASTLE.TOWER_SPREAD_Z],
      [-ENEMY_CASTLE.TOWER_SPREAD_X, 0, ENEMY_CASTLE.TOWER_SPREAD_Z],
      [ENEMY_CASTLE.TOWER_SPREAD_X, 0, ENEMY_CASTLE.TOWER_SPREAD_Z],
    ];

    const towerGeo = new THREE.CylinderGeometry(
      ENEMY_CASTLE.TOWER_RADIUS, ENEMY_CASTLE.TOWER_RADIUS + 0.4,
      ENEMY_CASTLE.TOWER_HEIGHT, ENEMY_CASTLE.TOWER_SEGMENTS
    );
    const towerMat = new THREE.MeshLambertMaterial({ color: ENEMY_CASTLE.TOWER_COLOR });

    const roofGeo = new THREE.ConeGeometry(
      ENEMY_CASTLE.TOWER_RADIUS + 0.6, ENEMY_CASTLE.TOWER_ROOF_HEIGHT, ENEMY_CASTLE.TOWER_SEGMENTS
    );
    const roofMat = new THREE.MeshLambertMaterial({ color: ENEMY_CASTLE.TOWER_ROOF_COLOR });

    for (const [x, y, z] of positions) {
      const tower = new THREE.Mesh(towerGeo, towerMat.clone());
      tower.position.set(x, ENEMY_CASTLE.TOWER_HEIGHT / 2, z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      this.group.add(tower);
      this._trackMesh(tower);

      const roof = new THREE.Mesh(roofGeo, roofMat.clone());
      roof.position.set(x, ENEMY_CASTLE.TOWER_HEIGHT + ENEMY_CASTLE.TOWER_ROOF_HEIGHT / 2, z);
      roof.castShadow = true;
      this.group.add(roof);
      this._trackMesh(roof);
    }
  }

  buildWalls() {
    const wallMat = new THREE.MeshLambertMaterial({ color: ENEMY_CASTLE.WALL_COLOR });

    // Front wall (facing player castle, positive Z side) — has gate opening
    const frontWallWidth = ENEMY_CASTLE.TOWER_SPREAD_X * 2;
    this._addWall(frontWallWidth, 0, ENEMY_CASTLE.TOWER_SPREAD_Z, wallMat, false);

    // Back wall (far side, negative Z)
    this._addWall(frontWallWidth, 0, -ENEMY_CASTLE.TOWER_SPREAD_Z, wallMat, false);

    // Left wall
    const sideWallWidth = ENEMY_CASTLE.TOWER_SPREAD_Z * 2;
    this._addWall(sideWallWidth, -ENEMY_CASTLE.TOWER_SPREAD_X, 0, wallMat, true);

    // Right wall
    this._addWall(sideWallWidth, ENEMY_CASTLE.TOWER_SPREAD_X, 0, wallMat, true);
  }

  _addWall(width, x, z, material, rotated) {
    const geo = new THREE.BoxGeometry(width, ENEMY_CASTLE.WALL_HEIGHT, ENEMY_CASTLE.WALL_THICKNESS);
    const wall = new THREE.Mesh(geo, material.clone());
    wall.position.set(x, ENEMY_CASTLE.WALL_HEIGHT / 2, z);
    if (rotated) {
      wall.rotation.y = Math.PI / 2;
    }
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.group.add(wall);
    this._trackMesh(wall);
  }

  buildBattlements() {
    const merlonGeo = new THREE.BoxGeometry(
      ENEMY_CASTLE.MERLON_SIZE, ENEMY_CASTLE.MERLON_SIZE, ENEMY_CASTLE.MERLON_SIZE
    );
    const merlonMat = new THREE.MeshLambertMaterial({ color: ENEMY_CASTLE.MERLON_COLOR });

    // Front wall battlements (positive Z side, facing player)
    const halfSpread = ENEMY_CASTLE.TOWER_SPREAD_X;
    for (let x = -halfSpread + 1; x < halfSpread; x += ENEMY_CASTLE.MERLON_SPACING) {
      const merlon = new THREE.Mesh(merlonGeo, merlonMat.clone());
      merlon.position.set(
        x,
        ENEMY_CASTLE.WALL_HEIGHT + ENEMY_CASTLE.MERLON_SIZE / 2,
        ENEMY_CASTLE.TOWER_SPREAD_Z
      );
      merlon.castShadow = true;
      this.group.add(merlon);
      this._trackMesh(merlon);
    }

    // Back wall battlements
    for (let x = -halfSpread + 1; x < halfSpread; x += ENEMY_CASTLE.MERLON_SPACING) {
      const merlon = new THREE.Mesh(merlonGeo, merlonMat.clone());
      merlon.position.set(
        x,
        ENEMY_CASTLE.WALL_HEIGHT + ENEMY_CASTLE.MERLON_SIZE / 2,
        -ENEMY_CASTLE.TOWER_SPREAD_Z
      );
      merlon.castShadow = true;
      this.group.add(merlon);
      this._trackMesh(merlon);
    }

    // Side wall battlements
    const halfSide = ENEMY_CASTLE.TOWER_SPREAD_Z;
    for (let z = -halfSide + 1; z < halfSide; z += ENEMY_CASTLE.MERLON_SPACING) {
      // Left
      const mL = new THREE.Mesh(merlonGeo, merlonMat.clone());
      mL.position.set(
        -ENEMY_CASTLE.TOWER_SPREAD_X,
        ENEMY_CASTLE.WALL_HEIGHT + ENEMY_CASTLE.MERLON_SIZE / 2,
        z
      );
      mL.castShadow = true;
      this.group.add(mL);
      this._trackMesh(mL);

      // Right
      const mR = new THREE.Mesh(merlonGeo, merlonMat.clone());
      mR.position.set(
        ENEMY_CASTLE.TOWER_SPREAD_X,
        ENEMY_CASTLE.WALL_HEIGHT + ENEMY_CASTLE.MERLON_SIZE / 2,
        z
      );
      mR.castShadow = true;
      this.group.add(mR);
      this._trackMesh(mR);
    }
  }

  buildGate() {
    // Gate on front wall (positive Z side, facing player castle)
    const gateGeo = new THREE.BoxGeometry(
      ENEMY_CASTLE.GATE_WIDTH, ENEMY_CASTLE.GATE_HEIGHT, ENEMY_CASTLE.WALL_THICKNESS + 0.1
    );
    const gateMat = new THREE.MeshLambertMaterial({ color: ENEMY_CASTLE.GATE_COLOR });
    const gate = new THREE.Mesh(gateGeo, gateMat);
    gate.position.set(0, ENEMY_CASTLE.GATE_HEIGHT / 2, ENEMY_CASTLE.TOWER_SPREAD_Z);
    this.group.add(gate);
    this._trackMesh(gate);

    // Gate arch
    const archGeo = new THREE.CylinderGeometry(
      ENEMY_CASTLE.GATE_WIDTH / 2, ENEMY_CASTLE.GATE_WIDTH / 2,
      ENEMY_CASTLE.WALL_THICKNESS + 0.2,
      8, 1, false, 0, Math.PI
    );
    const archMat = new THREE.MeshLambertMaterial({ color: ENEMY_CASTLE.GATE_COLOR });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.rotation.x = Math.PI / 2;
    arch.rotation.z = Math.PI / 2;
    arch.position.set(0, ENEMY_CASTLE.GATE_HEIGHT, ENEMY_CASTLE.TOWER_SPREAD_Z);
    this.group.add(arch);
    this._trackMesh(arch);
  }

  buildBanners() {
    // Dark banners on front towers (the ones facing the player)
    const bannerGeo = new THREE.PlaneGeometry(1.4, 2.5, 4, 4);
    const bannerMat = new THREE.MeshLambertMaterial({
      color: ENEMY_CASTLE.BANNER_COLOR,
      side: THREE.DoubleSide,
    });

    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.5, 4);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

    const towerPositions = [
      [-ENEMY_CASTLE.TOWER_SPREAD_X, ENEMY_CASTLE.TOWER_SPREAD_Z],
      [ENEMY_CASTLE.TOWER_SPREAD_X, ENEMY_CASTLE.TOWER_SPREAD_Z],
    ];

    for (const [x, z] of towerPositions) {
      const poleY = ENEMY_CASTLE.TOWER_HEIGHT + ENEMY_CASTLE.TOWER_ROOF_HEIGHT + 1.5;
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, poleY, z);
      this.group.add(pole);

      const banner = new THREE.Mesh(bannerGeo.clone(), bannerMat.clone());
      banner.position.set(x + 0.8, poleY + 0.5, z);
      this.group.add(banner);
      this._trackMesh(banner);
      this.banners.push(banner);
    }
  }

  buildTorches() {
    // Eerie flickering red/orange lights on tower tops
    const towerPositions = [
      [-ENEMY_CASTLE.TOWER_SPREAD_X, ENEMY_CASTLE.TOWER_HEIGHT + 1, -ENEMY_CASTLE.TOWER_SPREAD_Z],
      [ENEMY_CASTLE.TOWER_SPREAD_X, ENEMY_CASTLE.TOWER_HEIGHT + 1, -ENEMY_CASTLE.TOWER_SPREAD_Z],
      [-ENEMY_CASTLE.TOWER_SPREAD_X, ENEMY_CASTLE.TOWER_HEIGHT + 1, ENEMY_CASTLE.TOWER_SPREAD_Z],
      [ENEMY_CASTLE.TOWER_SPREAD_X, ENEMY_CASTLE.TOWER_HEIGHT + 1, ENEMY_CASTLE.TOWER_SPREAD_Z],
    ];

    for (const [x, y, z] of towerPositions) {
      const light = new THREE.PointLight(
        ENEMY_CASTLE.TORCH_COLOR,
        ENEMY_CASTLE.TORCH_INTENSITY,
        ENEMY_CASTLE.TORCH_DISTANCE
      );
      light.position.set(x, y, z);
      this.group.add(light);
      this.torchLights.push({
        light,
        baseIntensity: ENEMY_CASTLE.TORCH_INTENSITY,
        phase: Math.random() * Math.PI * 2,
      });

      // Small flame mesh (emissive sphere) — red-tinged
      const flameGeo = new THREE.SphereGeometry(0.25, 4, 4);
      const flameMat = new THREE.MeshBasicMaterial({ color: ENEMY_CASTLE.TORCH_COLOR });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, y, z);
      this.group.add(flame);
    }
  }

  buildGateGlow() {
    // Menacing red glow emanating from the gate
    this.gateGlowLight = new THREE.PointLight(
      ENEMY_CASTLE.GATE_GLOW_COLOR,
      ENEMY_CASTLE.GATE_GLOW_INTENSITY,
      ENEMY_CASTLE.GATE_GLOW_DISTANCE
    );
    this.gateGlowLight.position.set(0, ENEMY_CASTLE.GATE_HEIGHT / 2, ENEMY_CASTLE.TOWER_SPREAD_Z + 1);
    this.group.add(this.gateGlowLight);
  }

  buildWindows() {
    // Glowing red/orange windows on the keep walls (front and sides)
    const windowGeo = new THREE.PlaneGeometry(ENEMY_CASTLE.WINDOW_SIZE, ENEMY_CASTLE.WINDOW_SIZE);
    const windowMat = new THREE.MeshBasicMaterial({
      color: ENEMY_CASTLE.WINDOW_COLOR,
    });

    const keepHalfWidth = ENEMY_CASTLE.KEEP_WIDTH / 2;
    const keepHalfDepth = ENEMY_CASTLE.KEEP_DEPTH / 2;

    // Front face windows (positive Z)
    for (let row = 0; row < ENEMY_CASTLE.WINDOW_ROWS; row++) {
      for (let col = 0; col < ENEMY_CASTLE.WINDOW_COLS; col++) {
        const x = -keepHalfWidth + keepHalfWidth * 2 * (col + 1) / (ENEMY_CASTLE.WINDOW_COLS + 1);
        const y = ENEMY_CASTLE.KEEP_HEIGHT * 0.4 + row * 2.2;
        const win = new THREE.Mesh(windowGeo, windowMat.clone());
        win.position.set(x, y, keepHalfDepth + 0.01);
        this.group.add(win);
        this._trackMesh(win);
        this.windowMeshes.push(win);
      }
    }

    // Left face windows
    for (let row = 0; row < ENEMY_CASTLE.WINDOW_ROWS; row++) {
      const y = ENEMY_CASTLE.KEEP_HEIGHT * 0.4 + row * 2.2;
      const win = new THREE.Mesh(windowGeo, windowMat.clone());
      win.rotation.y = Math.PI / 2;
      win.position.set(-keepHalfWidth - 0.01, y, 0);
      this.group.add(win);
      this._trackMesh(win);
      this.windowMeshes.push(win);
    }

    // Right face windows
    for (let row = 0; row < ENEMY_CASTLE.WINDOW_ROWS; row++) {
      const y = ENEMY_CASTLE.KEEP_HEIGHT * 0.4 + row * 2.2;
      const win = new THREE.Mesh(windowGeo, windowMat.clone());
      win.rotation.y = -Math.PI / 2;
      win.position.set(keepHalfWidth + 0.01, y, 0);
      this.group.add(win);
      this._trackMesh(win);
      this.windowMeshes.push(win);
    }
  }

  buildSkullDecorations() {
    // Simple skull shapes (sphere + jaw) above the gate and on towers
    const skullGeo = new THREE.SphereGeometry(ENEMY_CASTLE.SKULL_SIZE, 6, 5);
    const skullMat = new THREE.MeshLambertMaterial({ color: ENEMY_CASTLE.SKULL_COLOR });
    const jawGeo = new THREE.BoxGeometry(
      ENEMY_CASTLE.SKULL_SIZE * 0.8, ENEMY_CASTLE.SKULL_SIZE * 0.3, ENEMY_CASTLE.SKULL_SIZE * 0.6
    );

    // Above the gate — three skulls
    const gateSkullY = ENEMY_CASTLE.GATE_HEIGHT + ENEMY_CASTLE.SKULL_SIZE + 0.5;
    const gateSkullZ = ENEMY_CASTLE.TOWER_SPREAD_Z;
    for (let i = -1; i <= 1; i++) {
      const skull = new THREE.Mesh(skullGeo, skullMat.clone());
      skull.position.set(i * 1.5, gateSkullY, gateSkullZ + 0.3);
      this.group.add(skull);
      this._trackMesh(skull);

      const jaw = new THREE.Mesh(jawGeo, skullMat.clone());
      jaw.position.set(i * 1.5, gateSkullY - ENEMY_CASTLE.SKULL_SIZE * 0.5, gateSkullZ + 0.5);
      this.group.add(jaw);
      this._trackMesh(jaw);
    }

    // One skull on each front tower
    const towerSkullY = ENEMY_CASTLE.TOWER_HEIGHT * 0.7;
    const frontTowers = [
      [-ENEMY_CASTLE.TOWER_SPREAD_X, ENEMY_CASTLE.TOWER_SPREAD_Z],
      [ENEMY_CASTLE.TOWER_SPREAD_X, ENEMY_CASTLE.TOWER_SPREAD_Z],
    ];
    for (const [x, z] of frontTowers) {
      const skull = new THREE.Mesh(skullGeo, skullMat.clone());
      skull.position.set(x, towerSkullY, z + ENEMY_CASTLE.TOWER_RADIUS + 0.2);
      this.group.add(skull);
      this._trackMesh(skull);
    }
  }

  // --- Update ---

  update(delta) {
    this.elapsedTime += delta;

    // Torch flickering
    for (const torch of this.torchLights) {
      const flicker = Math.sin(this.elapsedTime * ENEMY_CASTLE.TORCH_FLICKER_SPEED + torch.phase) *
        ENEMY_CASTLE.TORCH_FLICKER_AMOUNT;
      const noise = Math.sin(this.elapsedTime * 19 + torch.phase * 3) * 0.2;
      torch.light.intensity = torch.baseIntensity + flicker + noise;
    }

    // Banner wave animation
    for (const banner of this.banners) {
      const geo = banner.geometry;
      const positions = geo.attributes.position;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const distFromPole = (x + 0.7);
        const wave = Math.sin(
          this.elapsedTime * ENEMY_CASTLE.BANNER_WAVE_SPEED + y * 2 + distFromPole * 3
        ) * ENEMY_CASTLE.BANNER_WAVE_AMOUNT * distFromPole;
        positions.setZ(i, wave);
      }
      positions.needsUpdate = true;
    }

    // Gate glow pulsing
    if (this.gateGlowLight) {
      const pulse = ENEMY_CASTLE.GATE_GLOW_INTENSITY +
        Math.sin(this.elapsedTime * 2.5) * 0.5;
      this.gateGlowLight.intensity = pulse;
    }

    // Window glow pulsing
    for (const win of this.windowMeshes) {
      const pulse = ENEMY_CASTLE.WINDOW_EMISSIVE_INTENSITY +
        Math.sin(this.elapsedTime * ENEMY_CASTLE.WINDOW_PULSE_SPEED + Math.random() * 0.01) *
        ENEMY_CASTLE.WINDOW_PULSE_AMOUNT;
      // Modulate the color brightness
      const r = ((ENEMY_CASTLE.WINDOW_COLOR >> 16) & 0xff) / 255;
      const g = ((ENEMY_CASTLE.WINDOW_COLOR >> 8) & 0xff) / 255;
      const b = (ENEMY_CASTLE.WINDOW_COLOR & 0xff) / 255;
      win.material.color.setRGB(r * pulse, g * pulse, b * pulse);
    }
  }

  _trackMesh(mesh) {
    this.allMeshes.push(mesh);
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

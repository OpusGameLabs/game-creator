// =============================================================================
// Castle.js — Build castle geometry, handle damage, visual feedback
// An impressive medieval castle built from composed Three.js geometries:
// main keep, 4 corner towers with cone roofs, connecting walls, battlements,
// gate, torches, banners. Damage darkens materials progressively.
// =============================================================================

import * as THREE from 'three';
import { CASTLE, ENEMY } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Castle {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(0, CASTLE.POSITION_Y, CASTLE.POSITION_Z);

    this.flashTimer = 0;
    this.originalMaterials = [];
    this.flashMaterials = [];
    this.allMeshes = [];
    this.torchLights = [];
    this.banners = [];
    this.gateGlowLight = null;
    this.elapsedTime = 0;

    // Store original colors for damage darkening
    this._origColors = [];

    this.buildKeep();
    this.buildTowers();
    this.buildWalls();
    this.buildBattlements();
    this.buildGate();
    this.buildBanners();
    this.buildTorches();
    this.buildGateGlow();

    this.scene.add(this.group);

    // Listen for castle damage
    eventBus.on(Events.ENEMY_REACHED_CASTLE, () => this.takeDamage());
  }

  // --- Build Methods ---

  buildKeep() {
    const geo = new THREE.BoxGeometry(CASTLE.KEEP_WIDTH, CASTLE.KEEP_HEIGHT, CASTLE.KEEP_DEPTH);
    const mat = new THREE.MeshLambertMaterial({ color: CASTLE.KEEP_COLOR });
    const keep = new THREE.Mesh(geo, mat);
    keep.position.y = CASTLE.KEEP_HEIGHT / 2;
    keep.castShadow = true;
    keep.receiveShadow = true;
    this.group.add(keep);
    this._trackMesh(keep);

    // Keep roof — flat top with small raised center
    const roofGeo = new THREE.BoxGeometry(CASTLE.KEEP_WIDTH + 0.5, 0.5, CASTLE.KEEP_DEPTH + 0.5);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = CASTLE.KEEP_HEIGHT + 0.25;
    roof.castShadow = true;
    this.group.add(roof);
    this._trackMesh(roof);
  }

  buildTowers() {
    const positions = [
      [-CASTLE.TOWER_SPREAD_X, 0, -CASTLE.TOWER_SPREAD_Z],
      [CASTLE.TOWER_SPREAD_X, 0, -CASTLE.TOWER_SPREAD_Z],
      [-CASTLE.TOWER_SPREAD_X, 0, CASTLE.TOWER_SPREAD_Z],
      [CASTLE.TOWER_SPREAD_X, 0, CASTLE.TOWER_SPREAD_Z],
    ];

    const towerGeo = new THREE.CylinderGeometry(
      CASTLE.TOWER_RADIUS, CASTLE.TOWER_RADIUS + 0.3,
      CASTLE.TOWER_HEIGHT, CASTLE.TOWER_SEGMENTS
    );
    const towerMat = new THREE.MeshLambertMaterial({ color: CASTLE.TOWER_COLOR });

    const roofGeo = new THREE.ConeGeometry(
      CASTLE.TOWER_RADIUS + 0.5, CASTLE.TOWER_ROOF_HEIGHT, CASTLE.TOWER_SEGMENTS
    );
    const roofMat = new THREE.MeshLambertMaterial({ color: CASTLE.TOWER_ROOF_COLOR });

    for (const [x, y, z] of positions) {
      const tower = new THREE.Mesh(towerGeo, towerMat.clone());
      tower.position.set(x, CASTLE.TOWER_HEIGHT / 2, z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      this.group.add(tower);
      this._trackMesh(tower);

      const roof = new THREE.Mesh(roofGeo, roofMat.clone());
      roof.position.set(x, CASTLE.TOWER_HEIGHT + CASTLE.TOWER_ROOF_HEIGHT / 2, z);
      roof.castShadow = true;
      this.group.add(roof);
      this._trackMesh(roof);
    }
  }

  buildWalls() {
    const wallMat = new THREE.MeshLambertMaterial({ color: CASTLE.WALL_COLOR });

    // Front wall (facing enemies, negative Z side)
    const frontWallWidth = CASTLE.TOWER_SPREAD_X * 2;
    this._addWall(frontWallWidth, 0, -CASTLE.TOWER_SPREAD_Z, wallMat, false);

    // Back wall
    this._addWall(frontWallWidth, 0, CASTLE.TOWER_SPREAD_Z, wallMat, false);

    // Left wall
    const sideWallWidth = CASTLE.TOWER_SPREAD_Z * 2;
    this._addWall(sideWallWidth, -CASTLE.TOWER_SPREAD_X, 0, wallMat, true);

    // Right wall
    this._addWall(sideWallWidth, CASTLE.TOWER_SPREAD_X, 0, wallMat, true);
  }

  _addWall(width, x, z, material, rotated) {
    const geo = new THREE.BoxGeometry(width, CASTLE.WALL_HEIGHT, CASTLE.WALL_THICKNESS);
    const wall = new THREE.Mesh(geo, material.clone());
    wall.position.set(x, CASTLE.WALL_HEIGHT / 2, z);
    if (rotated) {
      wall.rotation.y = Math.PI / 2;
    }
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.group.add(wall);
    this._trackMesh(wall);
  }

  buildBattlements() {
    const merlonGeo = new THREE.BoxGeometry(CASTLE.MERLON_SIZE, CASTLE.MERLON_SIZE, CASTLE.MERLON_SIZE);
    const merlonMat = new THREE.MeshLambertMaterial({ color: CASTLE.MERLON_COLOR });

    // Front wall battlements
    const halfSpread = CASTLE.TOWER_SPREAD_X;
    for (let x = -halfSpread + 1; x < halfSpread; x += CASTLE.MERLON_SPACING) {
      const merlon = new THREE.Mesh(merlonGeo, merlonMat.clone());
      merlon.position.set(x, CASTLE.WALL_HEIGHT + CASTLE.MERLON_SIZE / 2, -CASTLE.TOWER_SPREAD_Z);
      merlon.castShadow = true;
      this.group.add(merlon);
      this._trackMesh(merlon);
    }

    // Back wall battlements
    for (let x = -halfSpread + 1; x < halfSpread; x += CASTLE.MERLON_SPACING) {
      const merlon = new THREE.Mesh(merlonGeo, merlonMat.clone());
      merlon.position.set(x, CASTLE.WALL_HEIGHT + CASTLE.MERLON_SIZE / 2, CASTLE.TOWER_SPREAD_Z);
      merlon.castShadow = true;
      this.group.add(merlon);
      this._trackMesh(merlon);
    }

    // Side wall battlements
    const halfSide = CASTLE.TOWER_SPREAD_Z;
    for (let z = -halfSide + 1; z < halfSide; z += CASTLE.MERLON_SPACING) {
      // Left
      const mL = new THREE.Mesh(merlonGeo, merlonMat.clone());
      mL.position.set(-CASTLE.TOWER_SPREAD_X, CASTLE.WALL_HEIGHT + CASTLE.MERLON_SIZE / 2, z);
      mL.castShadow = true;
      this.group.add(mL);
      this._trackMesh(mL);

      // Right
      const mR = new THREE.Mesh(merlonGeo, merlonMat.clone());
      mR.position.set(CASTLE.TOWER_SPREAD_X, CASTLE.WALL_HEIGHT + CASTLE.MERLON_SIZE / 2, z);
      mR.castShadow = true;
      this.group.add(mR);
      this._trackMesh(mR);
    }
  }

  buildGate() {
    // Dark gate section on front wall
    const gateGeo = new THREE.BoxGeometry(CASTLE.GATE_WIDTH, CASTLE.GATE_HEIGHT, CASTLE.WALL_THICKNESS + 0.1);
    const gateMat = new THREE.MeshLambertMaterial({ color: CASTLE.GATE_COLOR });
    const gate = new THREE.Mesh(gateGeo, gateMat);
    gate.position.set(0, CASTLE.GATE_HEIGHT / 2, -CASTLE.TOWER_SPREAD_Z);
    this.group.add(gate);
    this._trackMesh(gate);

    // Gate arch (semicircle on top of the gate)
    const archGeo = new THREE.CylinderGeometry(
      CASTLE.GATE_WIDTH / 2, CASTLE.GATE_WIDTH / 2, CASTLE.WALL_THICKNESS + 0.2,
      8, 1, false, 0, Math.PI
    );
    const archMat = new THREE.MeshLambertMaterial({ color: CASTLE.GATE_COLOR });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.rotation.x = Math.PI / 2;
    arch.rotation.z = Math.PI / 2;
    arch.position.set(0, CASTLE.GATE_HEIGHT, -CASTLE.TOWER_SPREAD_Z);
    this.group.add(arch);
    this._trackMesh(arch);
  }

  buildBanners() {
    // Banner flags on tower tops — with wave animation
    const bannerGeo = new THREE.PlaneGeometry(1.2, 2, 4, 4); // segments for wave deformation
    const bannerMat = new THREE.MeshLambertMaterial({
      color: 0xcc0000,
      side: THREE.DoubleSide,
    });

    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 3, 4);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

    const towerPositions = [
      [-CASTLE.TOWER_SPREAD_X, CASTLE.TOWER_SPREAD_Z],
      [CASTLE.TOWER_SPREAD_X, CASTLE.TOWER_SPREAD_Z],
    ];

    for (const [x, z] of towerPositions) {
      const poleY = CASTLE.TOWER_HEIGHT + CASTLE.TOWER_ROOF_HEIGHT + 1.5;
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, poleY, z);
      this.group.add(pole);

      const banner = new THREE.Mesh(bannerGeo.clone(), bannerMat.clone());
      banner.position.set(x + 0.7, poleY + 0.5, z);
      this.group.add(banner);
      this._trackMesh(banner);
      this.banners.push(banner);
    }
  }

  buildTorches() {
    // Flickering point lights on tower tops
    const towerPositions = [
      [-CASTLE.TOWER_SPREAD_X, CASTLE.TOWER_HEIGHT + 1, -CASTLE.TOWER_SPREAD_Z],
      [CASTLE.TOWER_SPREAD_X, CASTLE.TOWER_HEIGHT + 1, -CASTLE.TOWER_SPREAD_Z],
      [-CASTLE.TOWER_SPREAD_X, CASTLE.TOWER_HEIGHT + 1, CASTLE.TOWER_SPREAD_Z],
      [CASTLE.TOWER_SPREAD_X, CASTLE.TOWER_HEIGHT + 1, CASTLE.TOWER_SPREAD_Z],
    ];

    for (const [x, y, z] of towerPositions) {
      const light = new THREE.PointLight(
        CASTLE.TORCH_COLOR,
        CASTLE.TORCH_INTENSITY,
        CASTLE.TORCH_DISTANCE
      );
      light.position.set(x, y, z);
      this.group.add(light);
      this.torchLights.push({
        light,
        baseIntensity: CASTLE.TORCH_INTENSITY,
        phase: Math.random() * Math.PI * 2, // random phase offset
      });

      // Small flame mesh (emissive sphere)
      const flameGeo = new THREE.SphereGeometry(0.2, 4, 4);
      const flameMat = new THREE.MeshBasicMaterial({ color: CASTLE.TORCH_COLOR });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, y, z);
      this.group.add(flame);
    }
  }

  buildGateGlow() {
    // Glow light at gate — activates when enemies approach
    this.gateGlowLight = new THREE.PointLight(
      CASTLE.GATE_GLOW_COLOR,
      0, // starts off
      CASTLE.GATE_GLOW_DISTANCE
    );
    this.gateGlowLight.position.set(0, CASTLE.GATE_HEIGHT / 2, -CASTLE.TOWER_SPREAD_Z - 1);
    this.group.add(this.gateGlowLight);
  }

  // --- Damage & Flash ---

  takeDamage() {
    if (gameState.gameOver) return;

    gameState.castleHealth -= ENEMY.CASTLE_DAMAGE;
    if (gameState.castleHealth < 0) gameState.castleHealth = 0;

    eventBus.emit(Events.CASTLE_HIT, { health: gameState.castleHealth });

    this.flashTimer = CASTLE.DAMAGE_FLASH_DURATION;

    // Flash all meshes red
    for (const mesh of this.allMeshes) {
      if (mesh._origColor === undefined) {
        mesh._origColor = mesh.material.color.getHex();
      }
      mesh.material.color.setHex(CASTLE.DAMAGE_FLASH_COLOR);
    }

    // Apply progressive darkening based on damage taken
    this._applyDamageDarkening();

    if (gameState.castleHealth <= 0) {
      eventBus.emit(Events.CASTLE_DESTROYED);
    }
  }

  _applyDamageDarkening() {
    const healthPct = gameState.castleHealth / gameState.maxCastleHealth;
    const darkenAmount = (1 - healthPct) * CASTLE.DAMAGE_DARKEN_FACTOR;

    for (let i = 0; i < this.allMeshes.length; i++) {
      const mesh = this.allMeshes[i];
      if (mesh._origColor === undefined) continue;

      // Store the darkened color so flash restore uses it
      const orig = new THREE.Color(mesh._origColor);
      const darkened = orig.clone().multiplyScalar(1 - darkenAmount);
      mesh._darkenedColor = darkened.getHex();
    }
  }

  update(delta) {
    this.elapsedTime += delta;

    // Damage flash timer
    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        // Restore to darkened colors (not original, if damaged)
        for (const mesh of this.allMeshes) {
          if (mesh._darkenedColor !== undefined) {
            mesh.material.color.setHex(mesh._darkenedColor);
          } else if (mesh._origColor !== undefined) {
            mesh.material.color.setHex(mesh._origColor);
          }
        }
      }
    }

    // Torch flickering
    for (const torch of this.torchLights) {
      const flicker = Math.sin(this.elapsedTime * CASTLE.TORCH_FLICKER_SPEED + torch.phase) *
        CASTLE.TORCH_FLICKER_AMOUNT;
      const noise = Math.sin(this.elapsedTime * 17 + torch.phase * 3) * 0.15;
      torch.light.intensity = torch.baseIntensity + flicker + noise;
    }

    // Banner wave animation
    for (const banner of this.banners) {
      const geo = banner.geometry;
      const positions = geo.attributes.position;
      const originalPositions = geo.attributes.position.array;

      // Only animate X vertices based on their distance from the pole
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        // Offset based on distance from left edge (pole attachment)
        const distFromPole = (x + 0.6); // plane goes from -0.6 to 0.6
        const wave = Math.sin(this.elapsedTime * CASTLE.BANNER_WAVE_SPEED + y * 2 + distFromPole * 3) *
          CASTLE.BANNER_WAVE_AMOUNT * distFromPole;
        positions.setZ(i, wave);
      }
      positions.needsUpdate = true;
    }

    // Gate glow — pulse when game is active
    if (this.gateGlowLight && gameState.started && !gameState.gameOver) {
      // Subtle pulsing glow
      const pulse = 0.3 + Math.sin(this.elapsedTime * 2) * 0.15;
      this.gateGlowLight.intensity = pulse;
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

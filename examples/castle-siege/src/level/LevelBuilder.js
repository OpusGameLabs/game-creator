// =============================================================================
// LevelBuilder.js — Terrain, path, lighting, fog, sky
// Builds the medieval battlefield environment with dramatic sunset atmosphere.
// =============================================================================

import * as THREE from 'three';
import { LEVEL, COLORS, SKY } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class LevelBuilder {
  constructor(scene) {
    this.scene = scene;

    this.buildGround();
    this.buildPath();
    this.buildLighting();
    this.buildFog();
    this.buildSunsetSky();
    this.buildDecor();

    // Increase fog density per wave
    eventBus.on(Events.WAVE_START, ({ wave }) => this._updateFogForWave(wave));
  }

  buildGround() {
    const geometry = new THREE.PlaneGeometry(LEVEL.GROUND_SIZE, LEVEL.GROUND_SIZE, 8, 8);
    const material = new THREE.MeshLambertMaterial({ color: LEVEL.GROUND_COLOR });
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.name = 'ground';
    this.scene.add(this.ground);
  }

  buildPath() {
    // Dirt path from spawn end to castle
    const pathGeo = new THREE.PlaneGeometry(LEVEL.PATH_WIDTH, LEVEL.GROUND_SIZE);
    const pathMat = new THREE.MeshLambertMaterial({ color: LEVEL.PATH_COLOR });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.01; // Slightly above ground to avoid z-fighting
    path.receiveShadow = true;
    this.scene.add(path);
  }

  buildLighting() {
    // Ambient fill — lower for dramatic sunset mood
    const ambient = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, COLORS.AMBIENT_INTENSITY);
    this.scene.add(ambient);

    // Main directional light (low sun) with shadows
    const directional = new THREE.DirectionalLight(COLORS.DIR_LIGHT, COLORS.DIR_INTENSITY);
    directional.position.set(-20, 15, -30); // Low angle sunset from the side/behind enemies
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 1;
    directional.shadow.camera.far = 120;
    directional.shadow.camera.left = -50;
    directional.shadow.camera.right = 50;
    directional.shadow.camera.top = 50;
    directional.shadow.camera.bottom = -50;
    directional.shadow.bias = -0.001;
    this.scene.add(directional);

    // Hemisphere light for sunset sky/ground color bleed
    const hemi = new THREE.HemisphereLight(
      COLORS.HEMISPHERE_SKY,
      COLORS.HEMISPHERE_GROUND,
      COLORS.HEMISPHERE_INTENSITY
    );
    this.scene.add(hemi);

    // Rim light from behind (backlight for enemy silhouettes)
    const rimLight = new THREE.DirectionalLight(0xff5522, 0.3);
    rimLight.position.set(0, 5, -50);
    this.scene.add(rimLight);
  }

  buildFog() {
    this.scene.fog = new THREE.FogExp2(LEVEL.FOG_COLOR, 0.008);
  }

  _updateFogForWave(wave) {
    // Fog gets denser as waves progress
    const density = 0.008 + (wave - 1) * 0.001;
    if (this.scene.fog) {
      this.scene.fog.density = Math.min(density, 0.02);
    }
  }

  buildSunsetSky() {
    // Dramatic sunset gradient sky dome using vertex colors
    const skyGeo = new THREE.SphereGeometry(150, 32, 16);
    skyGeo.computeBoundingBox();

    // Apply vertical gradient via vertex colors
    const positions = skyGeo.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    const zenithColor = new THREE.Color(SKY.ZENITH_COLOR_TOP);
    const midColor = new THREE.Color(SKY.ZENITH_COLOR_MID);
    const horizonColor = new THREE.Color(SKY.HORIZON_COLOR);
    const glowColor = new THREE.Color(SKY.HORIZON_GLOW);

    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      // Normalize y from [-150, 150] to [0, 1]
      const t = (y + 150) / 300;

      let color;
      if (t > 0.55) {
        // Upper sky: mid to zenith
        const upperT = (t - 0.55) / 0.45;
        color = new THREE.Color().lerpColors(midColor, zenithColor, upperT);
      } else if (t > 0.45) {
        // Horizon band: glow
        const horizonT = (t - 0.45) / 0.1;
        color = new THREE.Color().lerpColors(glowColor, midColor, horizonT);
      } else if (t > 0.35) {
        // Lower: horizon to glow
        const lowerT = (t - 0.35) / 0.1;
        color = new THREE.Color().lerpColors(horizonColor, glowColor, lowerT);
      } else {
        // Below horizon
        color = new THREE.Color().copy(horizonColor);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const skyMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  buildDecor() {
    // Scatter some simple trees (cylinders + cones) around the edges
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a3010 });
    const foliageGeo = new THREE.ConeGeometry(1.8, 4, 6);
    const foliageMat = new THREE.MeshLambertMaterial({ color: 0x1a3a15 }); // Darker trees for sunset

    const halfGround = LEVEL.GROUND_SIZE / 2;
    const treePositions = [
      [-25, -10], [-28, 5], [-22, -25], [-30, 15], [-26, 25],
      [25, -10], [28, 5], [22, -25], [30, 15], [26, 25],
      [-20, -35], [20, -35], [-15, 30], [15, 30],
    ];

    for (const [x, z] of treePositions) {
      if (Math.abs(x) > halfGround - 2 || Math.abs(z) > halfGround - 2) continue;

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, 1.5, z);
      trunk.castShadow = true;
      this.scene.add(trunk);

      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(x, 5, z);
      foliage.castShadow = true;
      this.scene.add(foliage);
    }

    // Add some rocks for variety
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const rockPositions = [
      [-18, -15], [16, -20], [-24, 10], [22, 8],
      [-12, -30], [14, 28], [-30, -5], [28, -12],
    ];

    for (const [x, z] of rockPositions) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const scale = 0.5 + Math.random() * 1.0;
      rock.scale.set(scale, scale * 0.6, scale);
      rock.position.set(x, scale * 0.3, z);
      rock.rotation.y = Math.random() * Math.PI;
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }
  }
}

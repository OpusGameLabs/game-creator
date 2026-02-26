import * as THREE from 'three';
import { LEVEL, COLORS } from '../core/Constants.js';

export class LevelBuilder {
  constructor(scene) {
    this.scene = scene;

    this.buildLighting();
    this.buildFog();
  }

  // Ground is handled by StreetGenerator (road + sidewalks + grass strips)
  // No static ground plane needed for an endless runner

  buildLighting() {
    const ambient = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, COLORS.AMBIENT_INTENSITY);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(COLORS.DIR_LIGHT, COLORS.DIR_INTENSITY);
    directional.position.set(5, 10, 7);
    directional.castShadow = true;
    // Extend shadow camera to cover more of the street
    directional.shadow.camera.left = -20;
    directional.shadow.camera.right = 20;
    directional.shadow.camera.top = 20;
    directional.shadow.camera.bottom = -20;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 50;
    this.directionalLight = directional;
    this.scene.add(directional);
  }

  buildFog() {
    this.scene.fog = new THREE.Fog(LEVEL.FOG_COLOR, LEVEL.FOG_NEAR, LEVEL.FOG_FAR);
  }

  /** Update light position to follow the player */
  updateLightTarget(playerPos) {
    if (this.directionalLight) {
      this.directionalLight.position.set(
        playerPos.x + 5,
        10,
        playerPos.z - 7
      );
      this.directionalLight.target.position.copy(playerPos);
      this.directionalLight.target.updateMatrixWorld();
    }
  }
}

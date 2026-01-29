import * as THREE from 'three';
import { LEVEL, COLORS } from '../core/Constants.js';

export class LevelBuilder {
  constructor(scene) {
    this.scene = scene;

    this.buildGround();
    this.buildLighting();
    this.buildFog();
  }

  buildGround() {
    const geometry = new THREE.PlaneGeometry(LEVEL.GROUND_SIZE, LEVEL.GROUND_SIZE);
    const material = new THREE.MeshLambertMaterial({ color: LEVEL.GROUND_COLOR });
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  buildLighting() {
    const ambient = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, COLORS.AMBIENT_INTENSITY);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(COLORS.DIR_LIGHT, COLORS.DIR_INTENSITY);
    directional.position.set(5, 10, 7);
    directional.castShadow = true;
    this.scene.add(directional);
  }

  buildFog() {
    this.scene.fog = new THREE.Fog(LEVEL.FOG_COLOR, LEVEL.FOG_NEAR, LEVEL.FOG_FAR);
  }
}

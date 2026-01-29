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
    const geometry = new THREE.PlaneGeometry(LEVEL.GROUND_LENGTH, LEVEL.GROUND_WIDTH);
    const material = new THREE.MeshLambertMaterial({ color: LEVEL.GROUND_COLOR });
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = LEVEL.GROUND_Y;
    this.ground.position.x = LEVEL.GROUND_LENGTH / 2 - 20;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  buildLighting() {
    const ambient = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, COLORS.AMBIENT_INTENSITY);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(COLORS.DIR_LIGHT, COLORS.DIR_INTENSITY);
    directional.position.set(COLORS.DIR_POSITION_X, COLORS.DIR_POSITION_Y, COLORS.DIR_POSITION_Z);
    directional.castShadow = true;
    this.scene.add(directional);
  }

  buildFog() {
    this.scene.fog = new THREE.Fog(LEVEL.FOG_COLOR, LEVEL.FOG_NEAR, LEVEL.FOG_FAR);
  }
}

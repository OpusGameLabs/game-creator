import * as THREE from 'three';
import { LEVEL } from '../core/Constants.js';

export class GroundDetail {
  constructor(scene) {
    this.scene = scene;
    this.decorations = [];

    this.buildGrassPatches();
  }

  buildGrassPatches() {
    const colors = [0x4a7c2e, 0x5a9e3a, 0x3d6b24, 0x6db34a];
    const mat = new THREE.MeshLambertMaterial({ color: 0x4a7c2e });

    for (let i = 0; i < 80; i++) {
      const geo = new THREE.BoxGeometry(
        0.3 + Math.random() * 0.6,
        0.1 + Math.random() * 0.3,
        0.3 + Math.random() * 0.6
      );
      const patchMat = new THREE.MeshLambertMaterial({
        color: colors[Math.floor(Math.random() * colors.length)]
      });
      const patch = new THREE.Mesh(geo, patchMat);
      patch.position.set(
        -10 + Math.random() * 250,
        LEVEL.GROUND_Y + 0.05,
        -8 + Math.random() * 16
      );
      this.scene.add(patch);
      this.decorations.push(patch);
    }
  }
}

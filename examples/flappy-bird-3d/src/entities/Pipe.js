import * as THREE from 'three';
import { PIPE, LEVEL } from '../core/Constants.js';

export class Pipe {
  constructor(scene, x, gapCenterY) {
    this.scene = scene;
    this.scored = false;

    this.group = new THREE.Group();
    this.group.position.x = x;

    const gapHalf = PIPE.GAP / 2;

    // Bottom pipe
    const bottomHeight = gapCenterY - gapHalf - LEVEL.GROUND_Y;
    if (bottomHeight > 0) {
      const bottomGeo = new THREE.CylinderGeometry(PIPE.RADIUS, PIPE.RADIUS, bottomHeight, PIPE.SEGMENTS);
      const bottomMat = new THREE.MeshLambertMaterial({ color: PIPE.COLOR_BOTTOM });
      this.bottom = new THREE.Mesh(bottomGeo, bottomMat);
      this.bottom.position.y = LEVEL.GROUND_Y + bottomHeight / 2;
      this.group.add(this.bottom);

      // Bottom cap
      const bottomCapGeo = new THREE.CylinderGeometry(PIPE.CAP_RADIUS, PIPE.CAP_RADIUS, PIPE.CAP_HEIGHT, PIPE.SEGMENTS);
      const bottomCapMat = new THREE.MeshLambertMaterial({ color: PIPE.CAP_COLOR });
      const bottomCap = new THREE.Mesh(bottomCapGeo, bottomCapMat);
      bottomCap.position.y = LEVEL.GROUND_Y + bottomHeight - PIPE.CAP_HEIGHT / 2;
      this.group.add(bottomCap);
    }

    // Top pipe
    const topStart = gapCenterY + gapHalf;
    const topHeight = LEVEL.CEILING_Y - topStart;
    if (topHeight > 0) {
      const topGeo = new THREE.CylinderGeometry(PIPE.RADIUS, PIPE.RADIUS, topHeight, PIPE.SEGMENTS);
      const topMat = new THREE.MeshLambertMaterial({ color: PIPE.COLOR_TOP });
      this.top = new THREE.Mesh(topGeo, topMat);
      this.top.position.y = topStart + topHeight / 2;
      this.group.add(this.top);

      // Top cap
      const topCapGeo = new THREE.CylinderGeometry(PIPE.CAP_RADIUS, PIPE.CAP_RADIUS, PIPE.CAP_HEIGHT, PIPE.SEGMENTS);
      const topCapMat = new THREE.MeshLambertMaterial({ color: PIPE.CAP_COLOR });
      const topCap = new THREE.Mesh(topCapGeo, topCapMat);
      topCap.position.y = topStart + PIPE.CAP_HEIGHT / 2;
      this.group.add(topCap);
    }

    this.gapCenterY = gapCenterY;
    this.scene.add(this.group);
  }

  get x() {
    return this.group.position.x;
  }

  update(delta) {
    this.group.position.x -= PIPE.SPEED * delta;
  }

  getBoundingBoxes() {
    const x = this.group.position.x;
    const gapHalf = PIPE.GAP / 2;
    return {
      top: {
        minX: x - PIPE.CAP_RADIUS,
        maxX: x + PIPE.CAP_RADIUS,
        minY: this.gapCenterY + gapHalf,
        maxY: LEVEL.CEILING_Y,
      },
      bottom: {
        minX: x - PIPE.CAP_RADIUS,
        maxX: x + PIPE.CAP_RADIUS,
        minY: LEVEL.GROUND_Y,
        maxY: this.gapCenterY - gapHalf,
      },
    };
  }

  destroy() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
    this.scene.remove(this.group);
  }
}

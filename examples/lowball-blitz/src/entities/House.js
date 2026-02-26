import * as THREE from 'three';
import { HOUSE } from '../core/Constants.js';

export class House {
  constructor(x, z, side) {
    this.isHit = false;
    this.side = side; // 'left' or 'right'
    this.width = HOUSE.WIDTH;

    // Pick random colors
    const bodyColor = HOUSE.COLORS[Math.floor(Math.random() * HOUSE.COLORS.length)];
    const roofColor = HOUSE.ROOF_COLORS[Math.floor(Math.random() * HOUSE.ROOF_COLORS.length)];

    // Container group
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, 0, z);

    // House body
    const bodyGeo = new THREE.BoxGeometry(HOUSE.WIDTH, HOUSE.HEIGHT, HOUSE.DEPTH);
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = HOUSE.HEIGHT / 2;
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.mesh.add(this.body);

    // Door (darker rectangle on front face)
    const doorGeo = new THREE.BoxGeometry(0.4, 0.8, 0.05);
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x5c3317 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.4, HOUSE.DEPTH / 2 + 0.02);
    // Rotate door to face the street
    if (side === 'left') {
      door.position.set(-HOUSE.WIDTH / 2 - 0.02, 0.4, 0);
      door.rotation.y = -Math.PI / 2;
    } else {
      door.position.set(HOUSE.WIDTH / 2 + 0.02, 0.4, 0);
      door.rotation.y = Math.PI / 2;
    }
    this.mesh.add(door);

    // Window (lighter square)
    const windowGeo = new THREE.BoxGeometry(0.4, 0.4, 0.05);
    const windowMat = new THREE.MeshLambertMaterial({ color: 0xadd8e6 });
    const win1 = new THREE.Mesh(windowGeo, windowMat);
    if (side === 'left') {
      win1.position.set(-HOUSE.WIDTH / 2 - 0.02, 1.5, -0.5);
      win1.rotation.y = -Math.PI / 2;
    } else {
      win1.position.set(HOUSE.WIDTH / 2 + 0.02, 1.5, -0.5);
      win1.rotation.y = Math.PI / 2;
    }
    this.mesh.add(win1);

    const win2 = win1.clone();
    if (side === 'left') {
      win2.position.set(-HOUSE.WIDTH / 2 - 0.02, 1.5, 0.5);
    } else {
      win2.position.set(HOUSE.WIDTH / 2 + 0.02, 1.5, 0.5);
    }
    this.mesh.add(win2);

    // Triangular roof using BufferGeometry
    const roofShape = this._createRoofGeometry();
    const roofMat = new THREE.MeshLambertMaterial({ color: roofColor, side: THREE.DoubleSide });
    this.roof = new THREE.Mesh(roofShape, roofMat);
    this.roof.position.y = HOUSE.HEIGHT;
    this.roof.castShadow = true;
    this.mesh.add(this.roof);

    // Shake/flash state
    this._shakeTimer = 0;
    this._flashTimer = 0;
    this._originalBodyColor = bodyColor;
    this._baseX = x;
  }

  _createRoofGeometry() {
    const hw = HOUSE.WIDTH / 2 + 0.2; // slight overhang
    const hd = HOUSE.DEPTH / 2 + 0.2;
    const rh = HOUSE.ROOF_HEIGHT;

    const vertices = new Float32Array([
      // Front face
      -hw, 0, hd,
       hw, 0, hd,
       0,  rh, 0,
      // Back face
      -hw, 0, -hd,
       hw, 0, -hd,
       0,  rh, 0,
      // Left face
      -hw, 0, hd,
      -hw, 0, -hd,
       0,  rh, 0,
      // Right face
       hw, 0, hd,
       hw, 0, -hd,
       0,  rh, 0,
      // Bottom face (two triangles)
      -hw, 0, hd,
       hw, 0, hd,
      -hw, 0, -hd,
       hw, 0, hd,
       hw, 0, -hd,
      -hw, 0, -hd,
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  hit() {
    if (this.isHit) return;
    this.isHit = true;
    this._shakeTimer = HOUSE.SHAKE_DURATION;
    this._flashTimer = HOUSE.FLASH_DURATION;
    this.body.material.color.setHex(0xffff00); // flash yellow
  }

  update(delta) {
    // Shake effect
    if (this._shakeTimer > 0) {
      this._shakeTimer -= delta;
      const intensity = HOUSE.SHAKE_INTENSITY * (this._shakeTimer / HOUSE.SHAKE_DURATION);
      this.mesh.position.x = this._baseX + (Math.random() - 0.5) * intensity * 2;
      if (this._shakeTimer <= 0) {
        this.mesh.position.x = this._baseX;
      }
    }

    // Flash effect — restore color after flash duration
    if (this._flashTimer > 0) {
      this._flashTimer -= delta;
      if (this._flashTimer <= 0) {
        // Dim the house color to show it's been "sold"
        this.body.material.color.setHex(0x999999);
      }
    }
  }

  dispose(scene) {
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
    scene.remove(this.mesh);
  }
}

import * as THREE from 'three';
import { AGENT } from '../core/Constants.js';

export class Agent {
  constructor(x, z) {
    this.alive = true;
    this.hasCollided = false;

    // Container
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, 0, z);

    // Body (dark suit)
    const bodyGeo = new THREE.BoxGeometry(AGENT.BODY_WIDTH, AGENT.BODY_HEIGHT, AGENT.BODY_DEPTH);
    const bodyMat = new THREE.MeshLambertMaterial({ color: AGENT.COLOR_BODY });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = AGENT.BODY_HEIGHT / 2 + 0.1;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);

    // Head
    const headGeo = new THREE.SphereGeometry(AGENT.HEAD_RADIUS, 8, 6);
    const headMat = new THREE.MeshLambertMaterial({ color: AGENT.COLOR_HEAD });
    this.headMesh = new THREE.Mesh(headGeo, headMat);
    this.headMesh.position.y = AGENT.BODY_HEIGHT + AGENT.HEAD_RADIUS + 0.15;
    this.mesh.add(this.headMesh);

    // FOR SALE sign (red rectangle held to the side)
    const signGeo = new THREE.BoxGeometry(AGENT.SIGN_WIDTH, AGENT.SIGN_HEIGHT, AGENT.SIGN_DEPTH);
    const signMat = new THREE.MeshLambertMaterial({ color: AGENT.COLOR_SIGN });
    this.sign = new THREE.Mesh(signGeo, signMat);
    this.sign.position.set(
      AGENT.BODY_WIDTH / 2 + AGENT.SIGN_WIDTH / 2 + 0.1,
      AGENT.BODY_HEIGHT * 0.6,
      0
    );
    this.mesh.add(this.sign);

    // Sign post (thin pole under sign)
    const postGeo = new THREE.BoxGeometry(0.04, 0.8, 0.04);
    const postMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(
      AGENT.BODY_WIDTH / 2 + AGENT.SIGN_WIDTH / 2 + 0.1,
      AGENT.BODY_HEIGHT * 0.6 - AGENT.SIGN_HEIGHT / 2 - 0.4,
      0
    );
    this.mesh.add(post);

    // Walking animation state
    this._walkTime = Math.random() * Math.PI * 2; // random start phase
  }

  update(delta, playerZ) {
    if (!this.alive) return;

    // Walk toward the player (positive Z direction, since player runs -Z)
    this.mesh.position.z += AGENT.SPEED * delta;

    // Walking animation — bob up/down and sway
    this._walkTime += delta * 8;
    this.mesh.position.y = Math.abs(Math.sin(this._walkTime)) * 0.08;
    this.bodyMesh.rotation.z = Math.sin(this._walkTime) * 0.05;
    this.sign.rotation.z = Math.sin(this._walkTime * 0.7) * 0.1;

    // Clean up if passed well behind the player
    if (this.mesh.position.z > playerZ + 10) {
      this.alive = false;
    }
  }

  checkPlayer(playerPos) {
    if (!this.alive || this.hasCollided) return false;
    const dx = this.mesh.position.x - playerPos.x;
    const dz = this.mesh.position.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist < AGENT.COLLISION_RADIUS;
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

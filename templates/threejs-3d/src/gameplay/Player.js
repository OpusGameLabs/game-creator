import * as THREE from 'three';
import { PLAYER } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class Player {
  constructor(scene) {
    this.scene = scene;

    const geometry = new THREE.BoxGeometry(PLAYER.SIZE, PLAYER.SIZE, PLAYER.SIZE);
    const material = new THREE.MeshLambertMaterial({ color: PLAYER.COLOR });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.START_Z);
    this.mesh.castShadow = true;

    this.scene.add(this.mesh);
  }

  update(delta, input) {
    const speed = PLAYER.SPEED * delta;

    if (input.forward) this.mesh.position.z -= speed;
    if (input.backward) this.mesh.position.z += speed;
    if (input.left) this.mesh.position.x -= speed;
    if (input.right) this.mesh.position.x += speed;
  }

  reset() {
    this.mesh.position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.START_Z);
  }

  destroy() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.scene.remove(this.mesh);
  }
}

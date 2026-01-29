import * as THREE from 'three';
import { PLAYER } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;
    this.speed = PLAYER.FORWARD_SPEED;

    // Pre-allocate reusable objects to avoid GC pressure in update loop
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this._forward = new THREE.Vector3();

    this.group = new THREE.Group();
    this.buildAircraft();
    this.group.position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.START_Z);
    this.scene.add(this.group);

    // Alias for camera tracking
    this.mesh = this.group;
  }

  buildAircraft() {
    // Fuselage
    const fuselageGeo = new THREE.CylinderGeometry(
      PLAYER.FUSELAGE_RADIUS * 0.6,
      PLAYER.FUSELAGE_RADIUS,
      PLAYER.FUSELAGE_LENGTH,
      8
    );
    fuselageGeo.rotateX(Math.PI / 2);
    const fuselageMat = new THREE.MeshLambertMaterial({ color: PLAYER.COLOR_FUSELAGE });
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    this.group.add(fuselage);

    // Cockpit
    const cockpitGeo = new THREE.SphereGeometry(PLAYER.FUSELAGE_RADIUS * 0.55, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMat = new THREE.MeshLambertMaterial({ color: PLAYER.COLOR_COCKPIT });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, PLAYER.FUSELAGE_RADIUS * 0.3, -PLAYER.FUSELAGE_LENGTH * 0.2);
    this.group.add(cockpit);

    // Main wings
    const wingGeo = new THREE.BoxGeometry(PLAYER.WING_SPAN, PLAYER.WING_THICKNESS, PLAYER.WING_DEPTH);
    const wingMat = new THREE.MeshLambertMaterial({ color: PLAYER.COLOR_WING });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0, 0);
    this.group.add(wings);

    // Tail horizontal stabilizer
    const tailGeo = new THREE.BoxGeometry(PLAYER.TAIL_SPAN, PLAYER.TAIL_THICKNESS, PLAYER.TAIL_DEPTH);
    const tailMat = new THREE.MeshLambertMaterial({ color: PLAYER.COLOR_TAIL });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0, PLAYER.FUSELAGE_LENGTH * 0.45);
    this.group.add(tail);

    // Tail vertical stabilizer
    const vTailGeo = new THREE.BoxGeometry(PLAYER.TAIL_THICKNESS, PLAYER.TAIL_HEIGHT, PLAYER.TAIL_DEPTH);
    const vTail = new THREE.Mesh(vTailGeo, tailMat);
    vTail.position.set(0, PLAYER.TAIL_HEIGHT * 0.4, PLAYER.FUSELAGE_LENGTH * 0.45);
    this.group.add(vTail);
  }

  update(delta, input) {
    // Pitch (up/down)
    if (input.forward) this.pitch -= PLAYER.PITCH_SPEED * delta;
    if (input.backward) this.pitch += PLAYER.PITCH_SPEED * delta;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -PLAYER.MAX_PITCH, PLAYER.MAX_PITCH);

    // Roll (left/right) and derived yaw
    if (input.left) this.roll += PLAYER.ROLL_SPEED * delta;
    if (input.right) this.roll -= PLAYER.ROLL_SPEED * delta;
    this.roll *= PLAYER.ROLL_DAMPING;

    this.yaw += this.roll * PLAYER.YAW_FROM_ROLL * delta;

    // Build orientation
    this._euler.set(this.pitch, this.yaw, this.roll);
    this.group.setRotationFromEuler(this._euler);

    // Forward direction from orientation
    const forward = this._forward.set(0, 0, -1);
    forward.applyEuler(this._euler);

    // Move
    this.group.position.addScaledVector(forward, this.speed * delta);

    // Clamp altitude
    if (this.group.position.y < PLAYER.MIN_ALTITUDE) {
      eventBus.emit(Events.PLAYER_DIED);
    }
    if (this.group.position.y > PLAYER.MAX_ALTITUDE) {
      this.group.position.y = PLAYER.MAX_ALTITUDE;
      this.pitch = Math.max(this.pitch, 0);
    }
  }

  getPosition() {
    return this.group.position;
  }

  getForward() {
    return this._forward.set(0, 0, -1).applyEuler(this.group.rotation);
  }

  reset() {
    this.group.position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.START_Z);
    this.group.rotation.set(0, 0, 0);
    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;
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

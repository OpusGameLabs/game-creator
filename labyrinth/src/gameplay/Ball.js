import * as THREE from 'three';
import { BALL } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class Ball {
  constructor(scene) {
    this.scene = scene;

    // Velocity
    this.vx = 0;
    this.vz = 0;

    // Mesh -- metallic marble sphere
    const geometry = new THREE.SphereGeometry(BALL.RADIUS, 24, 24);
    const material = new THREE.MeshStandardMaterial({
      color: BALL.COLOR,
      metalness: BALL.METALNESS,
      roughness: BALL.ROUGHNESS,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.position.set(0, BALL.RADIUS, 0);

    this.scene.add(this.mesh);
  }

  /**
   * Set ball to a world position (used on spawn / respawn).
   */
  setPosition(worldPos) {
    this.mesh.position.set(worldPos.x, BALL.RADIUS, worldPos.z);
    this.vx = 0;
    this.vz = 0;
  }

  /**
   * Main update: apply input forces, friction, move, then let Game handle collisions.
   */
  update(delta, input) {
    // Apply input as acceleration
    const accel = BALL.SPEED;

    if (input.forward) this.vz -= accel * delta;
    if (input.backward) this.vz += accel * delta;
    if (input.left) this.vx -= accel * delta;
    if (input.right) this.vx += accel * delta;

    // Clamp velocity
    const speed = Math.sqrt(this.vx * this.vx + this.vz * this.vz);
    if (speed > BALL.MAX_VELOCITY) {
      const scale = BALL.MAX_VELOCITY / speed;
      this.vx *= scale;
      this.vz *= scale;
    }

    // Apply friction
    this.vx *= BALL.FRICTION;
    this.vz *= BALL.FRICTION;

    // Stop very small velocities to prevent drifting
    if (Math.abs(this.vx) < 0.01) this.vx = 0;
    if (Math.abs(this.vz) < 0.01) this.vz = 0;

    // Move
    this.mesh.position.x += this.vx * delta;
    this.mesh.position.z += this.vz * delta;

    // Rolling animation -- rotate based on movement direction
    if (speed > 0.05) {
      const rollSpeed = speed * delta * 3;
      // Roll axis is perpendicular to movement direction
      const axis = new THREE.Vector3(-this.vz, 0, this.vx).normalize();
      this.mesh.rotateOnWorldAxis(axis, rollSpeed);
    }

    // Emit position for camera following
    eventBus.emit(Events.BALL_MOVE, {
      x: this.mesh.position.x,
      y: this.mesh.position.y,
      z: this.mesh.position.z,
    });
  }

  /**
   * Correct position after wall collision (called by Game).
   */
  correctPosition(correctedPos) {
    this.mesh.position.x = correctedPos.x;
    this.mesh.position.z = correctedPos.z;

    // Kill velocity component that pushed into the wall
    // Simple: if position was corrected, dampen velocity
    const dx = correctedPos.x - this.mesh.position.x;
    const dz = correctedPos.z - this.mesh.position.z;
    if (Math.abs(dx) > 0.001) this.vx *= -0.2;
    if (Math.abs(dz) > 0.001) this.vz *= -0.2;
  }

  /**
   * Animate ball falling into a hole.
   */
  animateFall(callback) {
    const startY = this.mesh.position.y;
    const duration = 0.4;
    let elapsed = 0;

    const fall = () => {
      elapsed += 0.016;
      const t = Math.min(elapsed / duration, 1);
      // Scale down and drop
      const scale = 1 - t * 0.8;
      this.mesh.scale.set(scale, scale, scale);
      this.mesh.position.y = startY - t * 1.5;

      if (t < 1) {
        requestAnimationFrame(fall);
      } else {
        // Reset scale
        this.mesh.scale.set(1, 1, 1);
        if (callback) callback();
      }
    };
    requestAnimationFrame(fall);
  }

  destroy() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.scene.remove(this.mesh);
  }
}

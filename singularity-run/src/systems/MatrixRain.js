// =============================================================================
// MatrixRain.js — Falling columns of green characters in the background
//
// Uses InstancedMesh for performance. Small green quads fall in columns at
// varying speeds and depths around the tunnel. Recycles characters that fall
// below the visible area.
// =============================================================================

import * as THREE from 'three';
import { MATRIX_RAIN } from '../core/Constants.js';

export class MatrixRain {
  constructor(scene) {
    this.scene = scene;
    this._playerZ = 0;
    this._time = 0;

    const totalInstances = MATRIX_RAIN.COLUMN_COUNT * MATRIX_RAIN.CHARS_PER_COLUMN;

    // Small plane geometry for each "character"
    this._geo = new THREE.PlaneGeometry(
      MATRIX_RAIN.CHARACTER_SIZE,
      MATRIX_RAIN.CHARACTER_SIZE * 1.4
    );

    // Additive blending for a glow effect
    this._mat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this._mesh = new THREE.InstancedMesh(this._geo, this._mat, totalInstances);
    this._mesh.frustumCulled = false;
    this.scene.add(this._mesh);

    // Per-instance data: x, z, y, speed, opacity phase
    this._columns = [];
    this._dummy = new THREE.Object3D();
    this._color = new THREE.Color();

    for (let col = 0; col < MATRIX_RAIN.COLUMN_COUNT; col++) {
      // Random column position in the world, spread around the tunnel
      const colX = (Math.random() - 0.5) * MATRIX_RAIN.SPREAD_X;
      const colZ = -Math.random() * MATRIX_RAIN.SPREAD_Z;
      const speed = MATRIX_RAIN.DROP_SPEED_MIN +
        Math.random() * (MATRIX_RAIN.DROP_SPEED_MAX - MATRIX_RAIN.DROP_SPEED_MIN);

      for (let ch = 0; ch < MATRIX_RAIN.CHARS_PER_COLUMN; ch++) {
        const idx = col * MATRIX_RAIN.CHARS_PER_COLUMN + ch;
        const y = Math.random() * MATRIX_RAIN.HEIGHT;
        // Depth-based opacity: characters farther on X are dimmer
        const depthFactor = 1 - (Math.abs(colX) / (MATRIX_RAIN.SPREAD_X * 0.5));
        const baseOpacity = MATRIX_RAIN.OPACITY_MIN +
          depthFactor * (MATRIX_RAIN.OPACITY_MAX - MATRIX_RAIN.OPACITY_MIN);

        this._columns.push({
          x: colX,
          z: colZ,
          y: y,
          speed: speed * (0.7 + Math.random() * 0.6), // per-char speed variation
          baseOpacity: Math.max(MATRIX_RAIN.OPACITY_MIN, baseOpacity),
          phase: Math.random() * Math.PI * 2, // for brightness flicker
        });

        // Set initial color intensity (varied green)
        const brightness = 0.3 + Math.random() * 0.7;
        this._color.setRGB(0, brightness, brightness * 0.2);
        this._mesh.setColorAt(idx, this._color);
      }
    }

    if (this._mesh.instanceColor) {
      this._mesh.instanceColor.needsUpdate = true;
    }

    this._updateTransforms();
  }

  /** Update all falling characters. Call every frame. */
  update(delta, playerZ) {
    this._time += delta;
    this._playerZ = playerZ;

    for (let i = 0; i < this._columns.length; i++) {
      const c = this._columns[i];

      // Fall downward
      c.y -= c.speed * delta;

      // Recycle when below ground
      if (c.y < -1) {
        c.y += MATRIX_RAIN.HEIGHT + 1;
        // Slight randomization on recycle for natural feel
        c.phase = Math.random() * Math.PI * 2;
      }

      // Flicker brightness
      const flicker = 0.7 + 0.3 * Math.sin(this._time * 3 + c.phase);
      const brightness = c.baseOpacity * flicker;
      this._color.setRGB(0, brightness, brightness * 0.3);
      this._mesh.setColorAt(i, this._color);
    }

    if (this._mesh.instanceColor) {
      this._mesh.instanceColor.needsUpdate = true;
    }

    this._updateTransforms();
  }

  _updateTransforms() {
    for (let i = 0; i < this._columns.length; i++) {
      const c = this._columns[i];
      this._dummy.position.set(c.x, c.y, c.z + this._playerZ);
      this._dummy.updateMatrix();
      this._mesh.setMatrixAt(i, this._dummy.matrix);
    }
    this._mesh.instanceMatrix.needsUpdate = true;
  }

  /** Reset positions for game restart */
  reset() {
    this._playerZ = 0;
    this._time = 0;
    for (let i = 0; i < this._columns.length; i++) {
      this._columns[i].y = Math.random() * MATRIX_RAIN.HEIGHT;
      this._columns[i].z = -Math.random() * MATRIX_RAIN.SPREAD_Z;
    }
    this._updateTransforms();
  }

  dispose() {
    this.scene.remove(this._mesh);
    this._geo.dispose();
    this._mat.dispose();
  }
}

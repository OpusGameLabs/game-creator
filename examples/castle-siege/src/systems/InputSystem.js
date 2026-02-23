// =============================================================================
// InputSystem.js — Raycasting tap-to-fire mechanic
//
// On click/tap: raycast to ground plane, emit projectile:launched with target.
// Space key: fire at a random alive enemy position (for testing).
// Mobile: tap anywhere on screen (not on game-over overlay) to fire.
// =============================================================================

import * as THREE from 'three';
import { IS_MOBILE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class InputSystem {
  constructor() {
    this.keys = {};
    this.gameActive = false;
    this.camera = null;
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this._spaceWasDown = false;

    // Keyboard
    window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    // Mouse / Touch — fire projectile
    window.addEventListener('click', (e) => this._onPointer(e));
    window.addEventListener('touchstart', (e) => this._onTouch(e), { passive: false });
  }

  setCamera(camera) {
    this.camera = camera;
  }

  /** Reference to enemy manager for Space key targeting */
  setEnemyManager(enemyManager) {
    this.enemyManager = enemyManager;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  setGameActive(active) {
    this.gameActive = active;
  }

  update() {
    if (!this.gameActive || gameState.gameOver) return;

    // Space key — fire at a random alive enemy
    const spaceDown = this.isDown('Space');
    if (spaceDown && !this._spaceWasDown) {
      this._fireAtRandomEnemy();
    }
    this._spaceWasDown = spaceDown;
  }

  _onPointer(e) {
    if (!this.gameActive || gameState.gameOver || !this.camera) return;

    // Ignore clicks on overlay elements or UI buttons
    if (e.target.closest('.overlay') || e.target.closest('#joystick-zone') || e.target.closest('#mute-btn')) return;

    const ndc = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );

    this._fireAtScreenPos(ndc);
  }

  _onTouch(e) {
    if (!this.gameActive || gameState.gameOver || !this.camera) return;
    if (!IS_MOBILE) return;

    // Ignore touches on overlay elements or UI buttons
    if (e.target.closest('.overlay') || e.target.closest('#joystick-zone') || e.target.closest('#mute-btn')) return;

    e.preventDefault();
    const touch = e.touches[0];
    const ndc = new THREE.Vector2(
      (touch.clientX / window.innerWidth) * 2 - 1,
      -(touch.clientY / window.innerHeight) * 2 + 1
    );

    this._fireAtScreenPos(ndc);
  }

  _fireAtScreenPos(ndc) {
    this.raycaster.setFromCamera(ndc, this.camera);

    const target = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, target);

    if (hit) {
      eventBus.emit(Events.PROJECTILE_LAUNCHED, { target });
    }
  }

  _fireAtRandomEnemy() {
    if (!this.enemyManager) return;

    const aliveEnemies = this.enemyManager.getAliveEnemies();
    if (aliveEnemies.length === 0) return;

    const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    const pos = randomEnemy.getPosition().clone();

    eventBus.emit(Events.PROJECTILE_LAUNCHED, { target: pos });
  }
}

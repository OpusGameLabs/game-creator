import * as THREE from 'three';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { SPECTACLE, CAMERA } from '../core/Constants.js';

// ---- Shared geometries / materials (allocated once) ----
const _speedLineGeo = new THREE.BoxGeometry(0.02, 0.02, SPECTACLE.COMBO_SPEED_LINE_LENGTH);
const _speedLineMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

/**
 * SpectacleSystem -- drives all screen-shake, particle bursts, flash overlays,
 * speed lines, floating score text, and combo HUD polish.
 *
 * Follows the project's EventBus-driven pattern: listens to spectacle events
 * and creates Three.js visual effects in response.
 */
export class SpectacleSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // ---- Particle pool (GPU points) ----
    this._maxParticles = SPECTACLE.PARTICLE_POOL_SIZE;
    this._positions = new Float32Array(this._maxParticles * 3);
    this._velocities = new Float32Array(this._maxParticles * 3);
    this._colors = new Float32Array(this._maxParticles * 4); // RGBA
    this._ages = new Float32Array(this._maxParticles);
    this._lifetimes = new Float32Array(this._maxParticles);
    this._aliveCount = 0;

    // Initialize all particles as dead
    this._ages.fill(999);
    this._lifetimes.fill(1);

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(this._positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(this._colors, 4));

    const mat = new THREE.PointsMaterial({
      size: SPECTACLE.PARTICLE_SIZE,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this._points = new THREE.Points(geom, mat);
    this._points.frustumCulled = false;
    this.scene.add(this._points);

    // ---- Flash overlay (parented to camera) ----
    const flashGeo = new THREE.PlaneGeometry(20, 20);
    this._flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });
    this._flashPlane = new THREE.Mesh(flashGeo, this._flashMat);
    this._flashPlane.position.set(0, 0, -0.5); // 0.5 units in front of camera
    this._flashPlane.renderOrder = 999;
    this.camera.add(this._flashPlane);
    this.scene.add(this.camera); // camera must be in scene graph for children to render

    // Flash state
    this._flashTimer = 0;
    this._flashDuration = 0;
    this._flashColor = new THREE.Color(0xffffff);
    this._flashStartAlpha = 0;

    // ---- Screen shake ----
    this._shakeTimer = 0;
    this._shakeDuration = 0;
    this._shakeIntensity = 0;
    this._shakeOffset = new THREE.Vector3();

    // ---- Camera entrance tween ----
    this._entranceTween = 0;
    this._entranceTweenDuration = 0;
    this._entranceExtraDistance = 0;

    // ---- Camera throw nudge ----
    this._nudgeTimer = 0;
    this._nudgeDuration = 0;
    this._nudgeAmount = 0;

    // ---- Camera zoom pulse (streak) ----
    this._zoomPulseTimer = 0;
    this._zoomPulseDuration = 0;
    this._zoomPulseAmount = 0;

    // ---- Temporary point lights ----
    this._tempLights = [];

    // ---- Floating score sprites ----
    this._floatingTexts = [];

    // ---- Speed lines (thin elongated meshes) ----
    this._speedLines = [];

    // ---- Persistent speed line spawn timer ----
    this._speedLineSpawnTimer = 0;

    // ---- Trail accumulator ----
    this._trailAccum = 0;

    // ---- Near-miss slow-mo ----
    this._slowMoTimer = 0;
    this._slowMoDuration = 0;
    this._slowMoOriginalSpeed = 0;

    // ---- Combo HUD element ----
    this._comboEl = document.getElementById('combo-display');

    // ---- Wire up events ----
    this._bindEvents();
  }

  // ============================================================
  //  EVENT BINDINGS
  // ============================================================
  _bindEvents() {
    eventBus.on(Events.SPECTACLE_ENTRANCE, () => this._onEntrance());
    eventBus.on(Events.SPECTACLE_ACTION, (data) => this._onAction(data));
    eventBus.on(Events.SPECTACLE_HIT, (data) => this._onHit(data));
    eventBus.on(Events.PANIC_COLLECTED, (data) => this._onPanicCollected(data));
    eventBus.on(Events.SPECTACLE_COMBO, (data) => this._onCombo(data));
    eventBus.on(Events.SPECTACLE_STREAK, (data) => this._onStreak(data));
    eventBus.on(Events.SPECTACLE_NEAR_MISS, () => this._onNearMiss());
    eventBus.on(Events.PLAYER_HIT, () => this._onPlayerHit());
    eventBus.on(Events.COMBO_CHANGED, (data) => this._onComboChanged(data));
    eventBus.on(Events.HOUSE_HIT, (data) => this._onHouseHit(data));
  }

  // ============================================================
  //  PARTICLE HELPERS
  // ============================================================

  /**
   * Burst a cluster of particles outward from a world-space position.
   */
  burst(pos, count, color, speed = 4, lifetime = 0.8) {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      this._spawnParticle(pos, c, speed, lifetime);
    }
  }

  /**
   * Spawn a single trailing particle at a position (for continuous streams).
   */
  trail(pos, color, lifetime) {
    const c = new THREE.Color(color);
    this._spawnParticle(pos, c, 0.5, lifetime || SPECTACLE.TRAIL_LIFETIME);
  }

  _spawnParticle(pos, color, speed, lifetime) {
    // Find a dead slot
    let idx = -1;
    for (let i = 0; i < this._maxParticles; i++) {
      if (this._ages[i] >= this._lifetimes[i]) {
        idx = i;
        break;
      }
    }
    if (idx === -1) return; // pool full

    const i3 = idx * 3;
    const i4 = idx * 4;

    this._positions[i3] = pos.x;
    this._positions[i3 + 1] = pos.y;
    this._positions[i3 + 2] = pos.z;

    // Random outward velocity
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI - Math.PI / 2;
    const spd = speed * (0.5 + Math.random() * 0.5);
    this._velocities[i3] = Math.cos(theta) * Math.cos(phi) * spd;
    this._velocities[i3 + 1] = Math.sin(phi) * spd * 0.8 + speed * 0.3; // slight upward bias
    this._velocities[i3 + 2] = Math.sin(theta) * Math.cos(phi) * spd;

    this._colors[i4] = color.r;
    this._colors[i4 + 1] = color.g;
    this._colors[i4 + 2] = color.b;
    this._colors[i4 + 3] = 1.0;

    this._ages[idx] = 0;
    this._lifetimes[idx] = lifetime;

    if (idx >= this._aliveCount) {
      this._aliveCount = idx + 1;
    }
  }

  _updateParticles(delta) {
    let maxAlive = 0;
    for (let i = 0; i < this._aliveCount; i++) {
      if (this._ages[i] >= this._lifetimes[i]) continue;

      this._ages[i] += delta;

      const i3 = i * 3;
      const i4 = i * 4;

      // Apply velocity + gravity
      this._velocities[i3 + 1] += SPECTACLE.PARTICLE_GRAVITY * delta;

      this._positions[i3] += this._velocities[i3] * delta;
      this._positions[i3 + 1] += this._velocities[i3 + 1] * delta;
      this._positions[i3 + 2] += this._velocities[i3 + 2] * delta;

      // Fade alpha over lifetime
      const t = this._ages[i] / this._lifetimes[i];
      this._colors[i4 + 3] = Math.max(0, 1 - t);

      if (this._ages[i] < this._lifetimes[i]) {
        maxAlive = i + 1;
      }
    }
    this._aliveCount = maxAlive;

    // Flag buffers dirty
    this._points.geometry.attributes.position.needsUpdate = true;
    this._points.geometry.attributes.color.needsUpdate = true;

    // Only draw the range that has live particles
    this._points.geometry.setDrawRange(0, this._aliveCount);
  }

  // ============================================================
  //  FLASH OVERLAY
  // ============================================================

  _triggerFlash(color, alpha, duration) {
    this._flashColor.set(color);
    this._flashMat.color.copy(this._flashColor);
    this._flashMat.opacity = alpha;
    this._flashStartAlpha = alpha;
    this._flashTimer = duration;
    this._flashDuration = duration;
  }

  _updateFlash(delta) {
    if (this._flashTimer <= 0) return;
    this._flashTimer -= delta;
    const t = Math.max(0, this._flashTimer / this._flashDuration);
    this._flashMat.opacity = this._flashStartAlpha * t;
    if (this._flashTimer <= 0) {
      this._flashMat.opacity = 0;
    }
  }

  // ============================================================
  //  SCREEN SHAKE
  // ============================================================

  _triggerShake(intensity, duration) {
    this._shakeIntensity = intensity;
    this._shakeDuration = duration;
    this._shakeTimer = duration;
  }

  _updateShake(delta) {
    if (this._shakeTimer <= 0) {
      this._shakeOffset.set(0, 0, 0);
      return;
    }
    this._shakeTimer -= delta;
    const t = Math.max(0, this._shakeTimer / this._shakeDuration);
    const mag = this._shakeIntensity * t;
    this._shakeOffset.set(
      (Math.random() - 0.5) * 2 * mag,
      (Math.random() - 0.5) * 2 * mag * 0.5,
      0
    );
  }

  // ============================================================
  //  TEMPORARY POINT LIGHTS
  // ============================================================

  _addTempLight(pos, color, intensity, distance, duration) {
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.copy(pos);
    light.position.y += 2;
    this.scene.add(light);
    this._tempLights.push({ light, timer: duration, duration });
  }

  _updateTempLights(delta) {
    for (let i = this._tempLights.length - 1; i >= 0; i--) {
      const entry = this._tempLights[i];
      entry.timer -= delta;
      const t = Math.max(0, entry.timer / entry.duration);
      entry.light.intensity = t * SPECTACLE.HIT_LIGHT_INTENSITY;
      if (entry.timer <= 0) {
        this.scene.remove(entry.light);
        entry.light.dispose();
        this._tempLights.splice(i, 1);
      }
    }
  }

  // ============================================================
  //  FLOATING SCORE TEXT
  // ============================================================

  _spawnFloatingText(worldPos, text, color = '#ffcc00') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 64);
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(text, 64, 32);
    ctx.fillText(text, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(worldPos);
    sprite.position.y += 1.5;
    sprite.scale.set(2, 1, 1);
    sprite.renderOrder = 998;
    this.scene.add(sprite);

    this._floatingTexts.push({
      sprite,
      timer: SPECTACLE.SCORE_FLOAT_DURATION,
      startY: sprite.position.y,
    });
  }

  _updateFloatingTexts(delta) {
    for (let i = this._floatingTexts.length - 1; i >= 0; i--) {
      const ft = this._floatingTexts[i];
      ft.timer -= delta;
      const t = 1 - Math.max(0, ft.timer / SPECTACLE.SCORE_FLOAT_DURATION);
      ft.sprite.position.y = ft.startY + t * SPECTACLE.SCORE_FLOAT_HEIGHT;
      ft.sprite.material.opacity = 1 - t;
      if (ft.timer <= 0) {
        this.scene.remove(ft.sprite);
        ft.sprite.material.map.dispose();
        ft.sprite.material.dispose();
        this._floatingTexts.splice(i, 1);
      }
    }
  }

  // ============================================================
  //  SPEED LINES
  // ============================================================

  _spawnSpeedLines(count, playerPos) {
    if (!playerPos) return;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(_speedLineGeo, _speedLineMat.clone());
      mesh.position.set(
        playerPos.x + (Math.random() - 0.5) * 6,
        0.5 + Math.random() * 3,
        playerPos.z - 2 - Math.random() * 4
      );
      mesh.renderOrder = 997;
      this.scene.add(mesh);
      this._speedLines.push({
        mesh,
        timer: SPECTACLE.COMBO_SPEED_LINE_LIFETIME,
      });
    }
  }

  _updateSpeedLines(delta) {
    for (let i = this._speedLines.length - 1; i >= 0; i--) {
      const sl = this._speedLines[i];
      sl.timer -= delta;
      sl.mesh.position.z += SPECTACLE.COMBO_SPEED_LINE_SPEED * delta;

      // Fade out
      const t = Math.max(0, sl.timer / SPECTACLE.COMBO_SPEED_LINE_LIFETIME);
      sl.mesh.material.opacity = t;

      if (sl.timer <= 0) {
        this.scene.remove(sl.mesh);
        sl.mesh.material.dispose();
        this._speedLines.splice(i, 1);
      }
    }
  }

  // ============================================================
  //  EVENT HANDLERS
  // ============================================================

  _onEntrance() {
    // Camera zoom-in: start further back, tween to normal
    this._entranceExtraDistance = SPECTACLE.ENTRANCE_CAMERA_EXTRA;
    this._entranceTween = SPECTACLE.ENTRANCE_CAMERA_TWEEN;
    this._entranceTweenDuration = SPECTACLE.ENTRANCE_CAMERA_TWEEN;

    // Burst white/gold particles at player start
    const pos = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < SPECTACLE.ENTRANCE_BURST_COUNT; i++) {
      const color = Math.random() > 0.5 ? 0xffffff : 0xffd700;
      this.burst(pos, 1, color, 5, 1.0);
    }

    // White flash
    this._triggerFlash(0xffffff, 0.4, SPECTACLE.ENTRANCE_FLASH_DURATION);
  }

  _onAction(data) {
    // Small burst at player on throw
    if (!this._lastPlayerPos) return;
    const pos = this._lastPlayerPos.clone();
    pos.y += 1;
    this.burst(pos, SPECTACLE.THROW_BURST_COUNT, 0xffffff, 2, 0.5);

    // Camera nudge forward
    this._nudgeAmount = SPECTACLE.THROW_CAMERA_NUDGE;
    this._nudgeTimer = SPECTACLE.THROW_CAMERA_NUDGE_DURATION;
    this._nudgeDuration = SPECTACLE.THROW_CAMERA_NUDGE_DURATION;
  }

  _onHit(data) {
    // The HOUSE_HIT event carries position -- this fires for spectacle effects only
    // We will handle positioned effects in _onHouseHit
  }

  _onHouseHit(data) {
    const pos = new THREE.Vector3(data.x, 1.5, data.z);

    // Yellow/orange particle burst
    for (let i = 0; i < SPECTACLE.HIT_BURST_COUNT; i++) {
      const color = Math.random() > 0.5 ? 0xffcc00 : 0xff8800;
      this.burst(pos, 1, color, 4, 0.7);
    }

    // Floating score text
    const earned = gameState.addScore(0); // read current multiplier without adding
    const combo = data.combo || 1;
    const displayScore = Math.max(1, combo);
    this._spawnFloatingText(pos, `+${displayScore}`, '#ffcc00');

    // Temp point light at house
    this._addTempLight(pos, 0xffcc00, SPECTACLE.HIT_LIGHT_INTENSITY, SPECTACLE.HIT_LIGHT_DISTANCE, SPECTACLE.HIT_FLASH_DURATION);

    // Screen shake
    this._triggerShake(SPECTACLE.HIT_SHAKE_INTENSITY, SPECTACLE.HIT_SHAKE_DURATION);
  }

  _onPanicCollected(data) {
    if (!this._lastPlayerPos) return;
    const pos = this._lastPlayerPos.clone();
    pos.y += 0.5;

    // Green burst
    this.burst(pos, SPECTACLE.PANIC_BURST_COUNT, 0x00ff00, 3, 0.6);

    // Green flash
    this._triggerFlash(0x00ff00, 0.15, SPECTACLE.PANIC_FLASH_DURATION);
  }

  _onCombo(data) {
    if (!this._lastPlayerPos) return;
    const pos = this._lastPlayerPos.clone();
    pos.y += 1.5;

    // Rainbow burst
    const rainbowColors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff, 0xff00ff];
    for (let i = 0; i < SPECTACLE.COMBO_BURST_COUNT; i++) {
      const color = rainbowColors[i % rainbowColors.length];
      this.burst(pos, 1, color, 5, 1.0);
    }

    // Stronger screen shake
    this._triggerShake(SPECTACLE.COMBO_SHAKE_INTENSITY, SPECTACLE.COMBO_SHAKE_DURATION);

    // Speed lines
    this._spawnSpeedLines(SPECTACLE.COMBO_SPEED_LINE_COUNT, this._lastPlayerPos);
  }

  _onStreak(data) {
    if (!this._lastPlayerPos) return;
    const pos = this._lastPlayerPos.clone();
    pos.y += 2;

    // Massive gold burst
    this.burst(pos, SPECTACLE.STREAK_BURST_COUNT, 0xffd700, 7, 1.2);

    // Full-screen gold flash
    this._triggerFlash(0xffd700, 0.35, SPECTACLE.STREAK_FLASH_DURATION);

    // Camera zoom pulse
    this._zoomPulseAmount = SPECTACLE.STREAK_ZOOM_AMOUNT;
    this._zoomPulseTimer = SPECTACLE.STREAK_ZOOM_DURATION;
    this._zoomPulseDuration = SPECTACLE.STREAK_ZOOM_DURATION;
  }

  _onNearMiss() {
    if (!this._lastPlayerPos) return;
    const pos = this._lastPlayerPos.clone();
    pos.y += 1;

    // Blue burst
    this.burst(pos, SPECTACLE.NEAR_MISS_BURST_COUNT, 0x4488ff, 4, 0.6);

    // Brief slow-motion
    if (this._slowMoTimer <= 0) {
      this._slowMoOriginalSpeed = gameState.currentSpeed;
      gameState.currentSpeed *= SPECTACLE.NEAR_MISS_SLOWMO_FACTOR;
      this._slowMoTimer = SPECTACLE.NEAR_MISS_SLOWMO_DURATION;
      this._slowMoDuration = SPECTACLE.NEAR_MISS_SLOWMO_DURATION;
    }
  }

  _onPlayerHit() {
    if (!this._lastPlayerPos) return;
    const pos = this._lastPlayerPos.clone();
    pos.y += 1;

    // Red burst
    this.burst(pos, SPECTACLE.DAMAGE_BURST_COUNT, 0xff0000, 5, 0.8);

    // Red flash
    this._triggerFlash(0xff0000, 0.35, 0.4);

    // Heavy screen shake
    this._triggerShake(SPECTACLE.DAMAGE_SHAKE_INTENSITY, SPECTACLE.DAMAGE_SHAKE_DURATION);
  }

  _onComboChanged(data) {
    if (!this._comboEl) return;

    if (data.combo > 0) {
      this._comboEl.textContent = `${data.combo}x COMBO!`;
      this._comboEl.classList.add('visible');

      if (data.combo >= 5) {
        this._comboEl.classList.add('mega');
      } else {
        this._comboEl.classList.remove('mega');
      }
    } else {
      this._comboEl.classList.remove('visible', 'mega');
    }
  }

  // ============================================================
  //  MAIN UPDATE (called from Game.animate)
  // ============================================================

  /**
   * @param {number} delta - frame delta in seconds
   * @param {THREE.Vector3|undefined} playerPos - current player world position
   * @param {Array} envelopes - array of Envelope entities (for envelope trails)
   */
  update(delta, playerPos, envelopes) {
    // Store latest player position for event handlers that fire between frames
    if (playerPos) {
      if (!this._lastPlayerPos) {
        this._lastPlayerPos = playerPos.clone();
      } else {
        this._lastPlayerPos.copy(playerPos);
      }
    }

    // ---- Particles ----
    this._updateParticles(delta);

    // ---- Flash overlay ----
    this._updateFlash(delta);

    // ---- Screen shake ----
    this._updateShake(delta);

    // ---- Temp lights ----
    this._updateTempLights(delta);

    // ---- Floating text ----
    this._updateFloatingTexts(delta);

    // ---- Speed lines ----
    this._updateSpeedLines(delta);

    // ---- Entrance camera tween ----
    if (this._entranceTween > 0) {
      this._entranceTween -= delta;
      const t = Math.max(0, this._entranceTween / this._entranceTweenDuration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - (1 - t), 3);
      this._entranceExtraDistance = SPECTACLE.ENTRANCE_CAMERA_EXTRA * (1 - eased);
    }

    // ---- Camera nudge (throw) ----
    let nudgeZ = 0;
    if (this._nudgeTimer > 0) {
      this._nudgeTimer -= delta;
      const t = Math.max(0, this._nudgeTimer / this._nudgeDuration);
      nudgeZ = -this._nudgeAmount * t; // push camera forward (negative Z)
    }

    // ---- Camera zoom pulse (streak) ----
    let zoomOffset = 0;
    if (this._zoomPulseTimer > 0) {
      this._zoomPulseTimer -= delta;
      const t = this._zoomPulseTimer / this._zoomPulseDuration;
      // Bounce: zoom in then back out
      zoomOffset = this._zoomPulseAmount * Math.sin(t * Math.PI);
    }

    // ---- Near-miss slow-mo recovery ----
    if (this._slowMoTimer > 0) {
      this._slowMoTimer -= delta;
      if (this._slowMoTimer <= 0) {
        gameState.currentSpeed = this._slowMoOriginalSpeed;
      }
    }

    // ---- Player trail particles ----
    if (playerPos && gameState.started && !gameState.gameOver) {
      this._trailAccum += delta;
      const trailInterval = 1 / SPECTACLE.TRAIL_PARTICLES_PER_SEC;
      while (this._trailAccum >= trailInterval) {
        this._trailAccum -= trailInterval;
        const trailPos = playerPos.clone();
        trailPos.y += 0.1;
        trailPos.z += 0.5; // behind player
        trailPos.x += (Math.random() - 0.5) * 0.3;
        this.trail(trailPos, SPECTACLE.TRAIL_COLOR, SPECTACLE.TRAIL_LIFETIME);
      }
    }

    // ---- Envelope trail particles ----
    if (envelopes && envelopes.length > 0) {
      for (const env of envelopes) {
        if (env.alive && env.mesh) {
          this.trail(env.mesh.position, 0xffffff, 0.4);
        }
      }
    }

    // ---- Persistent speed lines at high speed ----
    if (playerPos && gameState.currentSpeed > SPECTACLE.SPEED_LINE_THRESHOLD &&
        gameState.started && !gameState.gameOver) {
      this._speedLineSpawnTimer += delta;
      if (this._speedLineSpawnTimer >= SPECTACLE.SPEED_LINE_INTERVAL) {
        this._speedLineSpawnTimer -= SPECTACLE.SPEED_LINE_INTERVAL;
        this._spawnSpeedLines(2, playerPos);
      }
    }

    // ---- Apply camera offsets ----
    // These are additive adjustments applied AFTER Game._updateCamera sets base position
    this.cameraOffsetZ = (this._entranceExtraDistance || 0) + nudgeZ;
    this.cameraZoomOffset = zoomOffset;
    this.cameraShakeOffset = this._shakeOffset.clone();
  }

  /**
   * Apply spectacle-driven camera offsets. Call from Game._updateCamera()
   * AFTER setting the base camera position.
   */
  applyCameraEffects() {
    this.camera.position.z += (this.cameraOffsetZ || 0);
    this.camera.position.z -= (this.cameraZoomOffset || 0); // zoom in = closer = less Z
    if (this.cameraShakeOffset) {
      this.camera.position.x += this.cameraShakeOffset.x;
      this.camera.position.y += this.cameraShakeOffset.y;
    }
  }

  /**
   * Clean up all resources on game restart or disposal.
   */
  reset() {
    // Kill all particles
    this._ages.fill(999);
    this._aliveCount = 0;

    // Remove temp lights
    for (const entry of this._tempLights) {
      this.scene.remove(entry.light);
      entry.light.dispose();
    }
    this._tempLights = [];

    // Remove floating texts
    for (const ft of this._floatingTexts) {
      this.scene.remove(ft.sprite);
      ft.sprite.material.map.dispose();
      ft.sprite.material.dispose();
    }
    this._floatingTexts = [];

    // Remove speed lines
    for (const sl of this._speedLines) {
      this.scene.remove(sl.mesh);
      sl.mesh.material.dispose();
    }
    this._speedLines = [];

    // Reset timers
    this._flashTimer = 0;
    this._flashMat.opacity = 0;
    this._shakeTimer = 0;
    this._shakeOffset.set(0, 0, 0);
    this._entranceTween = 0;
    this._entranceExtraDistance = 0;
    this._nudgeTimer = 0;
    this._zoomPulseTimer = 0;
    this._slowMoTimer = 0;
    this._trailAccum = 0;
    this._speedLineSpawnTimer = 0;
  }
}

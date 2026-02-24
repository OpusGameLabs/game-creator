import Phaser from 'phaser';
import { GAME, COLORS, PX, UI, SPECTACLE, PLAYER } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

/**
 * SpectacleSystem -- manages all visual effects: particles, screen shakes,
 * flash overlays, floating text, combos, streaks, speed milestones,
 * and the opening entrance sequence.
 *
 * All effects are wired via EventBus listeners.
 * Cleanup happens in destroy().
 */
export class SpectacleSystem {
  constructor(scene) {
    this.scene = scene;
    this._listeners = [];
    this._actionCooldown = 0;

    // Create shared particle texture (small neon circle)
    this._createParticleTexture();

    // Flash overlay rectangle (reusable, depth above everything)
    this.flashOverlay = scene.add.rectangle(
      GAME.WIDTH / 2, GAME.HEIGHT / 2,
      GAME.WIDTH, GAME.HEIGHT,
      0x000000, 0
    ).setDepth(100).setVisible(false);

    // Background pulse overlay
    this.bgPulse = scene.add.rectangle(
      GAME.WIDTH / 2, GAME.HEIGHT / 2,
      GAME.WIDTH, GAME.HEIGHT,
      COLORS.NEON_GREEN_HEX, 0
    ).setDepth(99).setBlendMode(Phaser.BlendModes.ADD);

    // Grid overlay reference (set from GameScene after grid is drawn)
    this.gridGfx = null;

    // Ambient motes
    this.ambientMotes = [];

    // Player trail emitter (set up after player exists)
    this.trailEmitter = null;

    // Store active floating text objects for cleanup
    this._floatingTexts = [];

    // Wire EventBus listeners
    this._wireListeners();
  }

  // --- Particle Texture ---

  _createParticleTexture() {
    // Create a small glowing circle texture for particles
    if (this.scene.textures.exists('neon_particle')) return;

    const size = Math.max(8, Math.round(4 * PX));
    const gfx = this.scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(size / 2, size / 2, size / 2);
    gfx.generateTexture('neon_particle', size, size);
    gfx.destroy();
  }

  // --- EventBus Wiring ---

  _wireListeners() {
    this._listen(Events.SPECTACLE_ACTION, (data) => this._onAction(data));
    this._listen(Events.SCORE_CHANGED, (data) => this._onScoreChanged(data));
    this._listen(Events.SPECTACLE_NEAR_MISS, (data) => this._onNearMiss(data));
    this._listen(Events.SPECTACLE_COMBO, (data) => this._onCombo(data));
    this._listen(Events.BIT_DODGED, (data) => this._onBitDodged(data));
    this._listen(Events.SPEED_INCREASED, (data) => this._onSpeedIncreased(data));
  }

  _listen(event, callback) {
    eventBus.on(event, callback);
    this._listeners.push({ event, callback });
  }

  // --- Opening Moment ---

  /**
   * Play the full entrance sequence:
   * 1. Camera flash with neon green tint
   * 2. Player slams in from above with Bounce.easeOut
   * 3. Landing shake + neon particle burst
   * 4. Ambient floating motes start
   * 5. "ACCELERATE" text slams in
   */
  playEntrance(playerContainer) {
    const cam = this.scene.cameras.main;
    const S = SPECTACLE;

    // 1. Camera flash (neon green tint)
    cam.flash(
      S.ENTRANCE_FLASH_DURATION,
      S.ENTRANCE_FLASH_COLOR.r,
      S.ENTRANCE_FLASH_COLOR.g,
      S.ENTRANCE_FLASH_COLOR.b
    );

    // 2. Player slam-in from above
    const targetY = playerContainer.y;
    playerContainer.y = -PLAYER.HEIGHT; // start above screen

    this.scene.tweens.add({
      targets: playerContainer,
      y: targetY,
      duration: S.ENTRANCE_SLAM_DURATION,
      ease: S.ENTRANCE_SLAM_EASE,
      onComplete: () => {
        // 3. Landing shake + particle burst
        cam.shake(200, S.ENTRANCE_LANDING_SHAKE);
        this._emitParticleBurst(
          playerContainer.x,
          targetY + PLAYER.HEIGHT * 0.3,
          S.ENTRANCE_LANDING_PARTICLES,
          COLORS.NEON_COLORS
        );
      },
    });

    // 4. Start ambient floating motes immediately
    this._createAmbientMotes();

    // 5. "ACCELERATE" text slam-in (starts at 300ms after scene start)
    this.scene.time.delayedCall(300, () => {
      this._slamText(
        S.ENTRANCE_TEXT,
        GAME.WIDTH / 2,
        GAME.HEIGHT * 0.35,
        Math.round(GAME.HEIGHT * 0.08),
        COLORS.NEON_GREEN,
        S.ENTRANCE_TEXT_SCALE_FROM,
        S.ENTRANCE_TEXT_EASE,
        S.ENTRANCE_TEXT_HOLD,
        S.ENTRANCE_TEXT_FADE
      );
    });
  }

  // --- Ambient Floating Motes ---

  _createAmbientMotes() {
    const S = SPECTACLE;
    for (let i = 0; i < S.AMBIENT_MOTE_COUNT; i++) {
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(0, GAME.HEIGHT);
      const size = Phaser.Math.FloatBetween(S.AMBIENT_MOTE_SIZE_MIN, S.AMBIENT_MOTE_SIZE_MAX) * PX;
      const alpha = Phaser.Math.FloatBetween(S.AMBIENT_MOTE_ALPHA_MIN, S.AMBIENT_MOTE_ALPHA_MAX);
      const speed = Phaser.Math.FloatBetween(S.AMBIENT_MOTE_SPEED_MIN, S.AMBIENT_MOTE_SPEED_MAX) * PX;
      const color = Phaser.Utils.Array.GetRandom([
        COLORS.NEON_GREEN_HEX, COLORS.NEON_CYAN_HEX, COLORS.NEON_MAGENTA_HEX,
      ]);

      const mote = this.scene.add.circle(x, y, size, color, alpha);
      mote.setDepth(-2);
      mote.setBlendMode(Phaser.BlendModes.ADD);

      // Subtle horizontal drift
      const driftX = Phaser.Math.FloatBetween(-5, 5) * PX;

      // Pulsing alpha
      this.scene.tweens.add({
        targets: mote,
        alpha: alpha * 0.3,
        duration: Phaser.Math.Between(1500, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.ambientMotes.push({ mote, speed, driftX });
    }
  }

  updateAmbientMotes(delta) {
    const dt = delta / 1000;
    for (const m of this.ambientMotes) {
      m.mote.y -= m.speed * dt;
      m.mote.x += m.driftX * dt;

      // Recycle when off screen top
      if (m.mote.y < -20) {
        m.mote.y = GAME.HEIGHT + 20;
        m.mote.x = Phaser.Math.Between(0, GAME.WIDTH);
      }
      // Wrap horizontal
      if (m.mote.x < -20) m.mote.x = GAME.WIDTH + 20;
      if (m.mote.x > GAME.WIDTH + 20) m.mote.x = -20;
    }
  }

  // --- Player Trail ---

  setupTrail(playerContainer) {
    const S = SPECTACLE;
    this.trailEmitter = this.scene.add.particles(0, 0, 'neon_particle', {
      follow: playerContainer,
      followOffset: { x: 0, y: PLAYER.HEIGHT * 0.1 },
      frequency: S.TRAIL_FREQUENCY,
      lifespan: S.TRAIL_LIFESPAN,
      alpha: { start: S.TRAIL_ALPHA, end: 0 },
      scale: {
        start: S.TRAIL_SIZE_MAX / (4 * PX),
        end: S.TRAIL_SIZE_MIN / (4 * PX),
      },
      blendMode: Phaser.BlendModes.ADD,
      tint: [COLORS.NEON_GREEN_HEX, COLORS.NEON_CYAN_HEX],
      speed: { min: 5 * PX, max: 15 * PX },
      angle: { min: 250, max: 290 },
      quantity: 1,
    });
    this.trailEmitter.setDepth(0);
  }

  // --- Action Effects (player movement) ---

  _onAction(data) {
    const now = this.scene.time.now;
    if (now - this._actionCooldown < SPECTACLE.ACTION_COOLDOWN) return;
    this._actionCooldown = now;

    const player = this.scene.player;
    if (!player || !player.container) return;

    const S = SPECTACLE;
    const px = player.container.x;
    const py = player.container.y + PLAYER.HEIGHT * 0.2;

    // Small neon spark burst at player position
    this._emitParticleBurst(
      px, py,
      S.ACTION_PARTICLE_COUNT,
      COLORS.NEON_COLORS,
      S.ACTION_PARTICLE_SPEED_MIN,
      S.ACTION_PARTICLE_SPEED_MAX,
      S.ACTION_PARTICLE_LIFESPAN,
      S.ACTION_PARTICLE_SIZE_MIN,
      S.ACTION_PARTICLE_SIZE_MAX,
      S.ACTION_PARTICLE_ALPHA
    );
  }

  // --- Score Changed Effects ---

  _onScoreChanged(data) {
    const player = this.scene.player;
    if (!player || !player.container) return;

    const S = SPECTACLE;
    const px = player.container.x;
    const py = player.container.y - PLAYER.HEIGHT * 0.5;

    // Floating "+1" text
    this._floatText(
      '+1',
      px, py,
      S.SCORE_TEXT_SIZE,
      COLORS.SCORE_GOLD,
      S.SCORE_TEXT_START_SCALE,
      S.SCORE_TEXT_EASE,
      S.SCORE_TEXT_RISE,
      S.SCORE_TEXT_DURATION
    );

    // Background pulse
    this._bgPulse(COLORS.NEON_GREEN_HEX, S.BG_PULSE_ALPHA, S.BG_PULSE_DURATION);
  }

  // --- Near-miss Effects ---

  _onNearMiss(data) {
    const S = SPECTACLE;

    // Screen shake (scales with speed)
    const shakeIntensity = Math.min(
      S.NEAR_MISS_SHAKE + gameState.currentSpeed * S.SHAKE_SPEED_FACTOR,
      S.SHAKE_MAX
    );
    this.scene.cameras.main.shake(150, shakeIntensity);

    // "CLOSE!" floating text at near-miss location
    this._floatText(
      S.NEAR_MISS_TEXT,
      data.x,
      data.y,
      S.NEAR_MISS_TEXT_SIZE,
      COLORS.NEON_MAGENTA,
      1.5,
      'Back.easeOut',
      40 * PX,
      S.NEAR_MISS_DURATION
    );
  }

  // --- Combo / Streak Effects ---

  _onBitDodged(data) {
    // Show combo counter if combo > 1
    if (data.combo > 1) {
      this._showComboCounter(data.combo);
    }
  }

  _onCombo(data) {
    const combo = data.combo;
    const S = SPECTACLE;

    // Check if this is a streak milestone
    if (S.STREAK_MILESTONES.includes(combo)) {
      this._streakMilestone(combo);
    }
  }

  _showComboCounter(combo) {
    const S = SPECTACLE;
    const player = this.scene.player;
    if (!player || !player.container) return;

    const px = player.container.x;
    const py = player.container.y - PLAYER.HEIGHT * 0.7;

    // Size scales with combo milestones
    const milestoneBonus = Math.floor(combo / 5) * S.COMBO_TEXT_SIZE_STEP;
    const fontSize = S.COMBO_TEXT_SIZE_BASE + milestoneBonus;

    this._floatText(
      `${combo}x`,
      px, py,
      Math.round(fontSize),
      COLORS.NEON_CYAN,
      1.8,
      'Elastic.easeOut',
      30 * PX,
      S.COMBO_TEXT_DURATION
    );
  }

  _streakMilestone(combo) {
    const S = SPECTACLE;

    // Full-screen text slam
    this._slamText(
      `${combo}x DODGE!`,
      GAME.WIDTH / 2,
      GAME.HEIGHT * 0.35,
      S.STREAK_TEXT_SIZE,
      COLORS.NEON_YELLOW,
      2.0,
      'Elastic.easeOut',
      600,
      400
    );

    // Large particle burst at center
    this._emitParticleBurst(
      GAME.WIDTH / 2,
      GAME.HEIGHT * 0.4,
      S.STREAK_PARTICLE_COUNT,
      COLORS.NEON_COLORS
    );

    // Screen shake
    this.scene.cameras.main.shake(200, S.SHAKE_MEDIUM);
  }

  // --- Speed Milestone Effects ---

  _onSpeedIncreased(data) {
    const multiplier = data.multiplier;
    const S = SPECTACLE;

    // Full-screen flash in neon magenta
    this._flashOverlay(COLORS.NEON_MAGENTA_HEX, S.SPEED_FLASH_ALPHA, S.SPEED_FLASH_DURATION);

    // Speed text slam
    this._slamText(
      `${Math.round(multiplier)}X SPEED`,
      GAME.WIDTH / 2,
      GAME.HEIGHT * 0.3,
      S.SPEED_TEXT_SIZE,
      COLORS.NEON_MAGENTA,
      2.0,
      'Elastic.easeOut',
      600,
      400
    );

    // Screen shake
    this.scene.cameras.main.shake(250, S.SPEED_SHAKE);

    // Grid lines pulse brighter
    if (this.gridGfx) {
      this.scene.tweens.add({
        targets: this.gridGfx,
        alpha: S.SPEED_GRID_PULSE_ALPHA,
        duration: 100,
        yoyo: true,
        hold: 50,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // Fade grid back to normal alpha
          this.scene.tweens.add({
            targets: this.gridGfx,
            alpha: 0.3,
            duration: S.SPEED_GRID_PULSE_DURATION,
            ease: 'Quad.easeOut',
          });
        },
      });
    }

    // Brief background hue shift (pulse with the speed milestone color)
    this._bgPulse(COLORS.NEON_MAGENTA_HEX, 0.2, 500);
  }

  // --- Bit Destruction Effects ---

  /**
   * Called when a bit goes off-screen bottom -- brief neon dissolve.
   */
  bitDissolve(bitContainer, bitColor) {
    if (!bitContainer || !bitContainer.scene) return;

    const S = SPECTACLE;
    // Brief alpha fade + small particle puff
    this.scene.tweens.add({
      targets: bitContainer,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: S.BIT_DISSOLVE_DURATION,
      ease: 'Quad.easeIn',
    });
  }

  /**
   * Called when the killing bit hits the player -- flash white + expand.
   */
  bitHitFlash(bitContainer) {
    if (!bitContainer || !bitContainer.scene) return;

    const S = SPECTACLE;
    // Flash white by tinting
    const bitText = bitContainer.list?.[0];
    if (bitText) {
      bitText.setColor('#ffffff');
      bitText.setShadow(0, 0, '#ffffff', 12 * PX, true);
    }

    this.scene.tweens.add({
      targets: bitContainer,
      scaleX: S.BIT_HIT_EXPAND_SCALE,
      scaleY: S.BIT_HIT_EXPAND_SCALE,
      alpha: 0,
      duration: S.BIT_HIT_FLASH_DURATION,
      ease: 'Quad.easeOut',
    });
  }

  // --- Death / Game Over Effects ---

  /**
   * Play the full death sequence:
   * 1. Hit freeze (brief physics pause)
   * 2. Red screen flash
   * 3. Slow-motion
   * 4. Death particle explosion
   * 5. Camera zoom-in
   * Returns a Promise-like delayed call for scene transition timing.
   */
  playDeath(playerContainer, killingBitContainer) {
    const S = SPECTACLE;
    const cam = this.scene.cameras.main;
    const px = playerContainer.x;
    const py = playerContainer.y;

    // 1. Hit freeze -- pause physics briefly
    this.scene.physics.world.pause();
    this.scene.time.delayedCall(S.HIT_FREEZE_DURATION, () => {
      if (this.scene.physics?.world) {
        this.scene.physics.world.resume();
      }

      // 2. Red screen flash
      cam.flash(
        S.DEATH_FLASH_DURATION,
        S.DEATH_FLASH_COLOR.r,
        S.DEATH_FLASH_COLOR.g,
        S.DEATH_FLASH_COLOR.b
      );

      // 3. Slow-motion
      this.scene.time.timeScale = S.DEATH_SLOWMO_SCALE;
      this.scene.tweens.timeScale = S.DEATH_SLOWMO_SCALE;
      this.scene.time.delayedCall(S.DEATH_SLOWMO_DURATION / S.DEATH_SLOWMO_SCALE, () => {
        this.scene.time.timeScale = 1;
        this.scene.tweens.timeScale = 1;
      });

      // 4. Death particle explosion (large burst)
      this._emitParticleBurst(
        px, py,
        S.DEATH_PARTICLE_COUNT,
        COLORS.NEON_COLORS,
        S.PARTICLE_BURST_SPEED_MIN * 1.5,
        S.PARTICLE_BURST_SPEED_MAX * 1.5,
        700,
        S.PARTICLE_BURST_SIZE_MIN * 1.5,
        S.PARTICLE_BURST_SIZE_MAX * 1.5
      );

      // 5. Camera zoom-in (relative to current zoom level)
      const currentZoom = cam.zoom;
      this.scene.tweens.add({
        targets: cam,
        zoom: currentZoom * S.DEATH_ZOOM_TARGET,
        duration: S.DEATH_ZOOM_DURATION,
        ease: 'Quad.easeOut',
      });

      // Flash the killing bit
      if (killingBitContainer) {
        this.bitHitFlash(killingBitContainer);
      }
    });
  }

  // --- Utility: Particle Burst ---

  _emitParticleBurst(
    x, y, count,
    colors = COLORS.NEON_COLORS,
    speedMin = SPECTACLE.PARTICLE_BURST_SPEED_MIN,
    speedMax = SPECTACLE.PARTICLE_BURST_SPEED_MAX,
    lifespan = SPECTACLE.PARTICLE_BURST_LIFESPAN,
    sizeMin = SPECTACLE.PARTICLE_BURST_SIZE_MIN,
    sizeMax = SPECTACLE.PARTICLE_BURST_SIZE_MAX,
    startAlpha = 0.9
  ) {
    // Convert hex color strings to integer tints for Phaser particles
    const tints = colors.map(c => {
      if (typeof c === 'string') {
        return parseInt(c.replace('#', ''), 16);
      }
      return c;
    });

    const emitter = this.scene.add.particles(x, y, 'neon_particle', {
      speed: { min: speedMin, max: speedMax },
      angle: { min: 0, max: 360 },
      scale: {
        start: sizeMax / (4 * PX),
        end: sizeMin / (4 * PX),
      },
      alpha: { start: startAlpha, end: 0 },
      lifespan: lifespan,
      blendMode: Phaser.BlendModes.ADD,
      tint: tints,
      quantity: Math.max(count, SPECTACLE.PARTICLE_MIN_COUNT),
      emitting: false,
    });
    emitter.setDepth(50);

    emitter.explode(Math.max(count, SPECTACLE.PARTICLE_MIN_COUNT));

    // Auto-destroy after lifespan + buffer
    this.scene.time.delayedCall(lifespan + 200, () => {
      if (emitter && emitter.scene) {
        emitter.destroy();
      }
    });
  }

  // --- Utility: Floating Text ---

  _floatText(text, x, y, fontSize, color, startScale, ease, riseDistance, duration) {
    const txt = this.scene.add.text(x, y, text, {
      fontSize: Math.max(fontSize, SPECTACLE.FLOAT_TEXT_MIN_SIZE) + 'px',
      fontFamily: UI.FONT,
      fontStyle: 'bold',
      color: color,
      shadow: { offsetX: 0, offsetY: 0, color: color, blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(80);

    txt.setScale(startScale);
    this._floatingTexts.push(txt);

    // Scale down + rise + fade
    this.scene.tweens.add({
      targets: txt,
      scaleX: 1,
      scaleY: 1,
      y: y - riseDistance,
      alpha: 0,
      duration: duration,
      ease: ease,
      onComplete: () => {
        const idx = this._floatingTexts.indexOf(txt);
        if (idx > -1) this._floatingTexts.splice(idx, 1);
        txt.destroy();
      },
    });
  }

  // --- Utility: Slam Text (full-screen announcement) ---

  _slamText(text, x, y, fontSize, color, startScale, ease, holdMs, fadeMs) {
    const txt = this.scene.add.text(x, y, text, {
      fontSize: fontSize + 'px',
      fontFamily: UI.FONT,
      fontStyle: 'bold',
      color: color,
      shadow: { offsetX: 0, offsetY: 0, color: color, blur: 16, fill: true },
      stroke: '#000000',
      strokeThickness: Math.round(3 * PX),
    }).setOrigin(0.5).setDepth(90);

    txt.setScale(startScale);
    txt.setAlpha(1);
    this._floatingTexts.push(txt);

    // Scale in with elastic ease
    this.scene.tweens.add({
      targets: txt,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: ease,
      onComplete: () => {
        // Hold, then fade out
        this.scene.time.delayedCall(holdMs, () => {
          this.scene.tweens.add({
            targets: txt,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: fadeMs,
            ease: 'Quad.easeIn',
            onComplete: () => {
              const idx = this._floatingTexts.indexOf(txt);
              if (idx > -1) this._floatingTexts.splice(idx, 1);
              txt.destroy();
            },
          });
        });
      },
    });
  }

  // --- Utility: Flash Overlay ---

  _flashOverlay(color, alpha, duration) {
    this.flashOverlay.setFillStyle(color, alpha);
    this.flashOverlay.setVisible(true);
    this.flashOverlay.setAlpha(alpha);

    this.scene.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.flashOverlay.setVisible(false);
      },
    });
  }

  // --- Utility: Background Pulse ---

  _bgPulse(color, alpha, duration) {
    this.bgPulse.setFillStyle(color, alpha);
    this.bgPulse.setAlpha(alpha);

    this.scene.tweens.add({
      targets: this.bgPulse,
      alpha: 0,
      duration: duration,
      ease: 'Quad.easeOut',
    });
  }

  // --- Update Loop ---

  update(delta) {
    this.updateAmbientMotes(delta);
  }

  // --- Cleanup ---

  destroy() {
    // Remove all EventBus listeners
    for (const { event, callback } of this._listeners) {
      eventBus.off(event, callback);
    }
    this._listeners = [];

    // Destroy ambient motes
    for (const m of this.ambientMotes) {
      if (m.mote && m.mote.scene) m.mote.destroy();
    }
    this.ambientMotes = [];

    // Destroy trail emitter
    if (this.trailEmitter) {
      this.trailEmitter.destroy();
      this.trailEmitter = null;
    }

    // Destroy floating texts
    for (const txt of this._floatingTexts) {
      if (txt && txt.scene) txt.destroy();
    }
    this._floatingTexts = [];

    // Destroy overlays
    if (this.flashOverlay && this.flashOverlay.scene) {
      this.flashOverlay.destroy();
    }
    if (this.bgPulse && this.bgPulse.scene) {
      this.bgPulse.destroy();
    }
  }
}

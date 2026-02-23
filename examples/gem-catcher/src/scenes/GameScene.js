import Phaser from 'phaser';
import { GAME, PLAYER, COLORS, PX, TRANSITION, SAFE_ZONE, GEM, SKULL, DIFFICULTY, LIVES, UI, PARTICLES, EFFECTS, BACKGROUND } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { renderPixelArt } from '../core/PixelRenderer.js';
import { Player } from '../entities/Player.js';
import { Gem } from '../entities/Gem.js';
import { Skull } from '../entities/Skull.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { emitGemCatchBurst, emitSkullHitBurst, emitDifficultyUpShower, showFloatingText, createShootingStar } from '../systems/EffectsSystem.js';
import { SKY_BASE, SKY_VAR1, SKY_VAR2, STAR_CLUSTER, BRIGHT_STAR, NEBULA_PUFF, TILE_PALETTE } from '../sprites/tiles.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    gameState.reset();

    // Mobile detection
    this.isMobile = this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS || this.sys.game.device.os.iPad;

    // --- Night sky pixel art background ---
    this.drawBackground();

    // --- Player (basket) ---
    this.player = new Player(this);

    // --- Physics groups for falling objects ---
    this.gems = this.add.group();
    this.skulls = this.add.group();

    // --- Overlap detection ---
    // Player catches gem = +score
    this.physics.add.overlap(this.player.sprite, this.gems, this.catchGem, null, this);
    // Player catches skull = -life
    this.physics.add.overlap(this.player.sprite, this.skulls, this.catchSkull, null, this);

    // --- Score system ---
    this.scoreSystem = new ScoreSystem();

    // --- Difficulty tracking ---
    this.currentFallSpeed = GEM.FALL_SPEED;
    this.currentSkullFallSpeed = SKULL.FALL_SPEED;
    this.currentSpawnInterval = GEM.SPAWN_INTERVAL;
    this.lastDifficultyScore = 0;

    // --- Spawn timer ---
    this.spawnTimer = this.time.addEvent({
      delay: this.currentSpawnInterval,
      callback: this.spawnObject,
      callbackScope: this,
      loop: true,
    });

    // --- Lives display ---
    this.livesTexts = [];
    this.createLivesDisplay();

    // --- Keyboard input ---
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      });
    }

    // --- Touch input state ---
    this.touchLeft = false;
    this.touchRight = false;

    // Tap-zone input: left half = move left, right half = move right
    this.input.on('pointerdown', (pointer) => {
      if (pointer.x < GAME.WIDTH / 2) {
        this.touchLeft = true;
        this.touchRight = false;
      } else {
        this.touchRight = true;
        this.touchLeft = false;
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      if (pointer.x < GAME.WIDTH / 2) {
        this.touchLeft = true;
        this.touchRight = false;
      } else {
        this.touchRight = true;
        this.touchLeft = false;
      }
    });

    this.input.on('pointerup', () => {
      this.touchLeft = false;
      this.touchRight = false;
    });

    // --- Basket idle bob animation ---
    this.tweens.add({
      targets: this.player.sprite,
      y: PLAYER.START_Y - EFFECTS.BASKET_BOB_AMOUNT,
      duration: EFFECTS.BASKET_BOB_DURATION,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // --- Shooting star ambient timer ---
    this._scheduleShootingStar();

    gameState.started = true;

    // Fade in
    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);
  }

  update(time, delta) {
    // Parallax always runs (even during game over slow-mo)
    this.updateParallax(delta);

    if (gameState.gameOver) return;

    // Merge keyboard + touch into unified input state
    const left = (this.cursors && this.cursors.left.isDown) ||
                 (this.wasd && this.wasd.left.isDown) ||
                 this.touchLeft;
    const right = (this.cursors && this.cursors.right.isDown) ||
                  (this.wasd && this.wasd.right.isDown) ||
                  this.touchRight;

    this.player.update(left, right);

    // Clean up off-screen objects
    this.cleanOffScreen(this.gems);
    this.cleanOffScreen(this.skulls);

    // Check difficulty ramp
    this.checkDifficulty();
  }

  // --- Spawning ---

  spawnObject() {
    if (gameState.gameOver) return;

    // Random x position within playable area (with padding)
    const padding = GEM.SIZE;
    const x = Phaser.Math.Between(padding, GAME.WIDTH - padding);
    const y = -GEM.SIZE; // spawn just above the top edge

    // 15% chance to spawn a skull instead of a gem
    if (Math.random() < SKULL.SPAWN_CHANCE) {
      const skull = new Skull(this, x, y, this.currentSkullFallSpeed);
      this.skulls.add(skull);
    } else {
      const gem = new Gem(this, x, y, this.currentFallSpeed);
      this.gems.add(gem);
    }
  }

  // --- Collision handlers ---

  catchGem(playerSprite, gem) {
    const gx = gem.x;
    const gy = gem.y;
    const gemColor = gem.gemColor || COLORS.GEM_GLOW;

    gem.destroy();
    eventBus.emit(Events.GEM_CAUGHT);

    // Sparkle particle burst in the gem's color
    emitGemCatchBurst(this, gx, gy, gemColor);

    // Floating "+1" text that rises and fades
    showFloatingText(this, gx, gy - GEM.SIZE * 0.5, '+1', COLORS.SCORE_GOLD);
  }

  catchSkull(playerSprite, skull) {
    const sx = skull.x;
    const sy = skull.y;

    skull.destroy();
    eventBus.emit(Events.SKULL_CAUGHT);

    const remaining = gameState.loseLife();
    eventBus.emit(Events.LIFE_LOST, { lives: remaining });
    this.updateLivesDisplay();

    // Red/dark particle burst at skull location
    emitSkullHitBurst(this, sx, sy);

    // Camera flash red
    this.cameras.main.flash(EFFECTS.FLASH_DURATION, EFFECTS.FLASH_R, EFFECTS.FLASH_G, EFFECTS.FLASH_B);

    // Screen shake
    this.cameras.main.shake(EFFECTS.SHAKE_DURATION, EFFECTS.SHAKE_INTENSITY);

    if (remaining <= 0) {
      this.triggerGameOver();
    }
  }

  // --- Difficulty ramp ---

  checkDifficulty() {
    const threshold = this.lastDifficultyScore + DIFFICULTY.SCORE_THRESHOLD;
    if (gameState.score >= threshold && gameState.score > 0) {
      this.lastDifficultyScore = gameState.score - (gameState.score % DIFFICULTY.SCORE_THRESHOLD);
      gameState.difficulty += 1;

      // Increase fall speeds (capped)
      this.currentFallSpeed = Math.min(
        this.currentFallSpeed * DIFFICULTY.SPEED_MULTIPLIER,
        DIFFICULTY.MAX_FALL_SPEED
      );
      this.currentSkullFallSpeed = Math.min(
        this.currentSkullFallSpeed * DIFFICULTY.SPEED_MULTIPLIER,
        DIFFICULTY.MAX_FALL_SPEED
      );

      // Decrease spawn interval (capped)
      this.currentSpawnInterval = Math.max(
        this.currentSpawnInterval - DIFFICULTY.INTERVAL_REDUCTION,
        DIFFICULTY.MIN_SPAWN_INTERVAL
      );

      // Restart the timer with new interval
      this.spawnTimer.remove();
      this.spawnTimer = this.time.addEvent({
        delay: this.currentSpawnInterval,
        callback: this.spawnObject,
        callbackScope: this,
        loop: true,
      });

      eventBus.emit(Events.DIFFICULTY_UP, { difficulty: gameState.difficulty });

      // Golden shower particles across the screen
      emitDifficultyUpShower(this);

      // Brief "LEVEL UP!" floating text at screen center
      showFloatingText(
        this,
        GAME.WIDTH / 2,
        GAME.HEIGHT * 0.3,
        'LEVEL UP!',
        '#ffd700'
      );
    }
  }

  // --- Off-screen cleanup ---

  cleanOffScreen(group) {
    const children = group.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const obj = children[i];
      if (obj && obj.y > GAME.HEIGHT + GEM.SIZE * 2) {
        obj.destroy();
      }
    }
  }

  // --- Lives display ---

  createLivesDisplay() {
    const fontSize = Math.round(GAME.HEIGHT * UI.BODY_RATIO);
    const heartSize = fontSize * 1.2;
    const startX = 10 * PX;
    const startY = GAME.HEIGHT - 30 * PX;

    // Clear existing
    this.livesTexts.forEach(t => t.destroy());
    this.livesTexts = [];

    for (let i = 0; i < gameState.lives; i++) {
      const heart = this.add.text(
        startX + i * (heartSize + 4 * PX),
        startY,
        '\u2764', // heart character
        {
          fontSize: heartSize + 'px',
          fontFamily: UI.FONT,
          color: COLORS.LIVES_RED,
        }
      ).setOrigin(0, 0.5).setDepth(100);
      this.livesTexts.push(heart);
    }
  }

  updateLivesDisplay() {
    // Hide hearts that are lost with a pulse/shake animation
    for (let i = 0; i < this.livesTexts.length; i++) {
      if (i >= gameState.lives && this.livesTexts[i].alpha > 0.2) {
        const heart = this.livesTexts[i];

        // Pulse up then fade to dimmed
        this.tweens.add({
          targets: heart,
          scaleX: EFFECTS.HEART_PULSE_SCALE,
          scaleY: EFFECTS.HEART_PULSE_SCALE,
          duration: EFFECTS.HEART_PULSE_DURATION,
          yoyo: true,
          ease: 'Quad.easeOut',
          onComplete: () => {
            heart.setAlpha(0.2);
          },
        });

        // Quick horizontal shake
        this.tweens.add({
          targets: heart,
          x: heart.x + 4 * PX,
          duration: 50,
          yoyo: true,
          repeat: 3,
          ease: 'Linear',
        });
      }
    }
  }

  // --- Game over ---

  triggerGameOver() {
    if (gameState.gameOver) return;
    gameState.gameOver = true;

    // Stop spawning
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }

    // Stop player
    this.player.sprite.body.setVelocity(0, 0);

    eventBus.emit(Events.GAME_OVER, { score: gameState.score });

    // Slow-mo effect on final death: 0.3x speed for 500ms before transitioning
    this.time.timeScale = EFFECTS.SLOWMO_SCALE;
    this.physics.world.timeScale = 1 / EFFECTS.SLOWMO_SCALE; // physics slows too

    // Use real-time delay (not affected by timeScale) via scene.time
    this.time.delayedCall(EFFECTS.SLOWMO_DURATION / EFFECTS.SLOWMO_SCALE, () => {
      // Restore normal time before transition
      this.time.timeScale = 1;
      this.physics.world.timeScale = 1;
      this.scene.start('GameOverScene');
    });
  }

  // --- Shooting star timer ---

  _scheduleShootingStar() {
    const delay = Phaser.Math.Between(
      BACKGROUND.SHOOTING_STAR_INTERVAL_MIN,
      BACKGROUND.SHOOTING_STAR_INTERVAL_MAX
    );
    this.time.delayedCall(delay, () => {
      if (!gameState.gameOver) {
        createShootingStar(this, BACKGROUND);
      }
      this._scheduleShootingStar();
    });
  }

  // --- Background: Pixel art night sky ---

  drawBackground() {
    // Store parallax layers for update loop
    this._parallaxNear = [];
    this._parallaxFar = [];

    // 1. Draw a gradient base layer for smooth color transition
    const gradBg = this.add.graphics();
    const top = Phaser.Display.Color.IntegerToColor(COLORS.SKY_TOP);
    const bot = Phaser.Display.Color.IntegerToColor(COLORS.SKY_BOTTOM);
    const steps = 64;
    const bandH = Math.ceil(GAME.HEIGHT / steps);

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(top.red + (bot.red - top.red) * t);
      const g = Math.round(top.green + (bot.green - top.green) * t);
      const b = Math.round(top.blue + (bot.blue - top.blue) * t);
      gradBg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      gradBg.fillRect(0, i * bandH, GAME.WIDTH, bandH + 1);
    }
    gradBg.setDepth(-20);

    // 2. Render tile textures for the night sky overlay
    const tileScale = 2;
    renderPixelArt(this, SKY_BASE, TILE_PALETTE, 'tile-sky-0', tileScale);
    renderPixelArt(this, SKY_VAR1, TILE_PALETTE, 'tile-sky-1', tileScale);
    renderPixelArt(this, SKY_VAR2, TILE_PALETTE, 'tile-sky-2', tileScale);

    // 3. Lay a random tile grid over the gradient for texture
    const tileSize = 16 * tileScale;
    for (let y = 0; y < GAME.HEIGHT; y += tileSize) {
      for (let x = 0; x < GAME.WIDTH; x += tileSize) {
        const rnd = Math.random();
        const variant = rnd < 0.6 ? 'tile-sky-0'
                      : rnd < 0.85 ? 'tile-sky-1'
                      : 'tile-sky-2';
        const tile = this.add.image(x + tileSize / 2, y + tileSize / 2, variant);
        tile.setDepth(-15);
        tile.setAlpha(0.3); // subtle overlay, lets gradient show through
      }
    }

    // 4. Render decoration textures
    renderPixelArt(this, STAR_CLUSTER, TILE_PALETTE, 'deco-star-cluster', 2);
    renderPixelArt(this, BRIGHT_STAR, TILE_PALETTE, 'deco-bright-star', 2);
    renderPixelArt(this, NEBULA_PUFF, TILE_PALETTE, 'deco-nebula', 2);

    // 5. Scatter bright stars across the sky -- split into near/far parallax layers
    const starCount = Math.floor((GAME.WIDTH * GAME.HEIGHT) / 40000);
    for (let i = 0; i < starCount; i++) {
      const sx = Phaser.Math.Between(10, GAME.WIDTH - 10);
      const sy = Phaser.Math.Between(10, GAME.HEIGHT - 10);
      const type = Math.random() < 0.6 ? 'deco-star-cluster' : 'deco-bright-star';
      const star = this.add.image(sx, sy, type);
      star.setAlpha(0.4 + Math.random() * 0.5);
      const starScale = 0.5 + Math.random() * 1.0;
      star.setScale(starScale);

      // Assign to parallax layer: bigger/brighter = near, smaller/dimmer = far
      if (starScale > 0.9) {
        star.setDepth(-9);
        star._origX = sx;
        this._parallaxNear.push(star);
      } else {
        star.setDepth(-11);
        star._origX = sx;
        this._parallaxFar.push(star);
      }

      // Twinkle animation for bright stars
      if (type === 'deco-bright-star') {
        this.tweens.add({
          targets: star,
          alpha: { from: star.alpha, to: star.alpha * 0.3 },
          duration: 1500 + Math.random() * 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: Math.random() * 2000,
        });
      }
    }

    // 6. Scatter nebula puffs (fewer, larger, very faint)
    const nebulaCount = Math.floor(starCount * 0.15);
    for (let i = 0; i < nebulaCount; i++) {
      const nx = Phaser.Math.Between(50, GAME.WIDTH - 50);
      const ny = Phaser.Math.Between(50, GAME.HEIGHT - 50);
      const nebula = this.add.image(nx, ny, 'deco-nebula');
      nebula.setDepth(-8);
      nebula.setAlpha(0.15 + Math.random() * 0.15);
      nebula.setScale(2 + Math.random() * 3);
    }

    // Track time for parallax
    this._parallaxTime = 0;
  }

  // --- Parallax update (called from update loop) ---

  updateParallax(delta) {
    this._parallaxTime += delta / 1000; // seconds

    // Near stars drift slowly to the left
    for (const star of this._parallaxNear) {
      star.x = star._origX - (this._parallaxTime * BACKGROUND.PARALLAX_SPEED_NEAR) % GAME.WIDTH;
      if (star.x < -20) star.x += GAME.WIDTH + 40;
    }

    // Far stars drift even slower
    for (const star of this._parallaxFar) {
      star.x = star._origX - (this._parallaxTime * BACKGROUND.PARALLAX_SPEED_FAR) % GAME.WIDTH;
      if (star.x < -20) star.x += GAME.WIDTH + 40;
    }
  }
}

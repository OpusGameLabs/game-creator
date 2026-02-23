import Phaser from 'phaser';
import { GAME, SHIP, ASTEROID, STARS, COLORS, SAFE_ZONE, PX, TRANSITION } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { Ship } from '../entities/Ship.js';
import { Asteroid, createAsteroidTexture } from '../entities/Asteroid.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    gameState.reset();

    // --- Background: space gradient ---
    this.drawSpaceBackground();

    // --- Scrolling stars ---
    this.stars = [];
    this.createStarfield();

    // --- Generate asteroid textures (multiple variants for visual variety) ---
    this.asteroidTextureKeys = [];
    for (let i = 0; i < 5; i++) {
      const key = `asteroid_${i}`;
      // Destroy old texture if it exists (restart-safe)
      if (this.textures.exists(key)) {
        this.textures.remove(key);
      }
      createAsteroidTexture(this, key);
      this.asteroidTextureKeys.push(key);
    }

    // --- Generate ship texture (restart-safe) ---
    if (this.textures.exists('ship_tex')) {
      this.textures.remove('ship_tex');
    }

    // --- Ship (player) ---
    this.ship = new Ship(this);

    // --- Asteroid pool ---
    this.asteroids = this.physics.add.group({
      classType: Asteroid,
      maxSize: ASTEROID.POOL_SIZE,
      runChildUpdate: true,
    });

    // Pre-populate pool
    for (let i = 0; i < ASTEROID.POOL_SIZE; i++) {
      const key = Phaser.Utils.Array.GetRandom(this.asteroidTextureKeys);
      const a = new Asteroid(this, 0, 0, key);
      this.asteroids.add(a, true);
    }

    // --- Collision: ship vs asteroids ---
    this.physics.add.overlap(
      this.ship.sprite,
      this.asteroids,
      this.onShipHit,
      // Only collide with active asteroids
      (ship, asteroid) => asteroid.active,
      this
    );

    // --- Score system ---
    this.scoreSystem = new ScoreSystem();

    // --- Spawn timer ---
    this.spawnTimer = 0;
    this.currentSpawnInterval = ASTEROID.BASE_SPAWN_INTERVAL;

    // --- Input: keyboard ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // --- Input: touch (tap zones — works on ALL devices, not just mobile) ---
    // Left half of screen = move left, right half = move right
    this.touchLeft = false;
    this.touchRight = false;

    this._onPointerDown = (pointer) => {
      if (pointer.x < GAME.WIDTH / 2) {
        this.touchLeft = true;
      } else {
        this.touchRight = true;
      }
    };
    this._onPointerUp = () => {
      this.touchLeft = false;
      this.touchRight = false;
    };

    this.input.on('pointerdown', this._onPointerDown);
    this.input.on('pointerup', this._onPointerUp);
    this.input.on('pointerout', this._onPointerUp);

    // --- Start gameplay immediately ---
    gameState.started = true;
    eventBus.emit(Events.GAME_START);

    // --- EventBus listeners ---
    this._onGameRestart = () => {};
    eventBus.on(Events.GAME_RESTART, this._onGameRestart);

    // --- Scene cleanup ---
    this.events.on('shutdown', this.cleanup, this);

    // --- Fade in ---
    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);
  }

  update(time, delta) {
    if (gameState.gameOver) return;

    // --- Scroll stars ---
    this.updateStars(delta);

    // --- Merge keyboard + touch input ---
    const left = this.cursors.left.isDown || this.wasd.left.isDown || this.touchLeft;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchRight;

    this.ship.update(left, right, delta);

    // --- Spawn asteroids on interval ---
    this.spawnTimer += delta;
    this.currentSpawnInterval = Math.max(
      ASTEROID.MIN_SPAWN_INTERVAL,
      ASTEROID.BASE_SPAWN_INTERVAL - gameState.score * ASTEROID.SPAWN_INTERVAL_PER_SCORE
    );

    if (this.spawnTimer >= this.currentSpawnInterval) {
      this.spawnTimer = 0;
      this.spawnAsteroid();
    }

    // --- Check for asteroids that passed the bottom (scoring) ---
    this.checkAsteroidsPassed();
  }

  spawnAsteroid() {
    // Pick a random texture variant
    const key = Phaser.Utils.Array.GetRandom(this.asteroidTextureKeys);

    // Find an inactive asteroid in the pool
    let asteroid = this.asteroids.getChildren().find(a => !a.active);

    if (!asteroid) {
      // Pool exhausted — skip this spawn
      return;
    }

    // Re-assign texture for visual variety
    asteroid.setTexture(key);

    const radius = Phaser.Math.Between(
      Math.round(ASTEROID.MIN_RADIUS),
      Math.round(ASTEROID.MAX_RADIUS)
    );

    const x = Phaser.Math.Between(
      Math.round(ASTEROID.SPAWN_PADDING + radius),
      Math.round(GAME.WIDTH - ASTEROID.SPAWN_PADDING - radius)
    );

    const speed = Math.min(
      ASTEROID.MAX_SPEED,
      ASTEROID.BASE_SPEED + gameState.score * ASTEROID.SPEED_PER_SCORE
    );

    asteroid.launch(x, speed, radius);
    eventBus.emit(Events.ASTEROID_SPAWN, { x, speed, radius });
  }

  checkAsteroidsPassed() {
    const children = this.asteroids.getChildren();
    for (let i = 0; i < children.length; i++) {
      const a = children[i];
      if (a.active && !a.scored && a.y > GAME.HEIGHT + a.asteroidRadius) {
        a.scored = true;
        eventBus.emit(Events.ASTEROID_PASSED);
      }
    }
  }

  onShipHit(shipSprite, asteroid) {
    if (gameState.gameOver) return;
    if (!asteroid.active) return;

    gameState.gameOver = true;
    asteroid.deactivate();

    eventBus.emit(Events.SHIP_HIT, {
      x: shipSprite.x,
      y: shipSprite.y,
    });
    eventBus.emit(Events.GAME_OVER, { score: gameState.score });

    // Brief camera shake on death
    this.cameras.main.shake(200, 0.015);

    // Short delay then transition to game over
    this.time.delayedCall(600, () => {
      this.scene.start('GameOverScene');
    });
  }

  // --- Background helpers ---

  drawSpaceBackground() {
    const bg = this.add.graphics();
    const top = Phaser.Display.Color.IntegerToColor(COLORS.BG_SPACE_TOP);
    const bot = Phaser.Display.Color.IntegerToColor(COLORS.BG_SPACE_BOTTOM);
    const steps = 64;
    const bandH = Math.ceil(GAME.HEIGHT / steps);

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(top.red + (bot.red - top.red) * t);
      const g = Math.round(top.green + (bot.green - top.green) * t);
      const b = Math.round(top.blue + (bot.blue - top.blue) * t);
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      bg.fillRect(0, i * bandH, GAME.WIDTH, bandH + 1);
    }
    bg.setDepth(-100);
  }

  createStarfield() {
    for (let i = 0; i < STARS.COUNT; i++) {
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(0, GAME.HEIGHT);
      const size = Phaser.Math.FloatBetween(STARS.MIN_SIZE, STARS.MAX_SIZE);
      const speed = Phaser.Math.FloatBetween(STARS.MIN_SPEED, STARS.MAX_SPEED);
      const alpha = Phaser.Math.FloatBetween(0.3, 1.0);

      const star = this.add.circle(x, y, size, STARS.COLOR, alpha);
      star.setDepth(-90);
      this.stars.push({ obj: star, speed });
    }
  }

  updateStars(delta) {
    const dt = delta / 1000;
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s.obj.y += s.speed * dt;
      if (s.obj.y > GAME.HEIGHT + 5) {
        s.obj.y = -5;
        s.obj.x = Phaser.Math.Between(0, GAME.WIDTH);
      }
    }
  }

  // --- Cleanup ---

  cleanup() {
    if (this.scoreSystem) {
      this.scoreSystem.destroy();
      this.scoreSystem = null;
    }
    eventBus.off(Events.GAME_RESTART, this._onGameRestart);
    this.input.off('pointerdown', this._onPointerDown);
    this.input.off('pointerup', this._onPointerUp);
    this.input.off('pointerout', this._onPointerUp);
  }
}

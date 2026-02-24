import Phaser from 'phaser';
import { GAME, PLAYER, COLORS, PX, TRANSITION, SAFE_ZONE, NEAR_MISS, BIT, EXPRESSION, EXPRESSION_HOLD_MS, MATRIX_RAIN, SPECTACLE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { Player } from '../entities/Player.js';
import { BitSpawner } from '../systems/BitSpawner.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { SpectacleSystem } from '../systems/SpectacleSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    gameState.reset();
    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);

    // Mobile detection
    this.isMobile = this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS || this.sys.game.device.os.iPad;

    // --- Background grid (depth -10) ---
    this.gridGfx = this.drawGrid();

    // --- Matrix rain background effect (depth -5) ---
    this.matrixRainPool = [];
    this.createMatrixRain();

    // --- Player (Nick Land) ---
    this.player = new Player(this);

    // --- Bit Spawner ---
    this.bitSpawner = new BitSpawner(this);

    // --- Score System ---
    this.scoreSystem = new ScoreSystem();

    // --- Spectacle System (visual effects) ---
    this.spectacle = new SpectacleSystem(this);
    this.spectacle.gridGfx = this.gridGfx;
    this.spectacle.setupTrail(this.player.container);

    // --- Collision: player vs bits ---
    this.physics.add.overlap(
      this.player.container,
      this.bitSpawner.group,
      this.onPlayerHit,
      null,
      this
    );

    // --- Keyboard input ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // --- Touch input state ---
    this.touchLeft = false;
    this.touchRight = false;

    // Tap-zone input: left half = move left, right half = move right
    this.input.on('pointerdown', (pointer) => {
      if (gameState.gameOver) return;
      const gameX = pointer.x;
      if (gameX < GAME.WIDTH / 2) {
        this.touchLeft = true;
        this.touchRight = false;
      } else {
        this.touchRight = true;
        this.touchLeft = false;
      }
      eventBus.emit(Events.SPECTACLE_ACTION, { input: 'touch' });
    });

    this.input.on('pointermove', (pointer) => {
      if (gameState.gameOver || !pointer.isDown) return;
      const gameX = pointer.x;
      if (gameX < GAME.WIDTH / 2) {
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

    // --- Track bits that pass the player line for dodge/near-miss detection ---
    // The container origin is at the torso center; feet are roughly half the total height below
    this.dodgeCheckY = PLAYER.START_Y + PLAYER.HEIGHT * 0.4;

    // --- Wire EventBus to player expressions ---
    this._onScoreChanged = () => {
      this.player.setExpression(EXPRESSION.HAPPY);
    };
    this._onPlayerHit = () => {
      this.player.setExpression(EXPRESSION.ANGRY);
    };
    this._onNearMiss = () => {
      this.player.setExpression(EXPRESSION.SURPRISED);
    };
    this._onSpeedIncreased = () => {
      this.player.setExpression(EXPRESSION.SURPRISED, 1000);
    };

    eventBus.on(Events.SCORE_CHANGED, this._onScoreChanged);
    eventBus.on(Events.PLAYER_HIT, this._onPlayerHit);
    eventBus.on(Events.SPECTACLE_NEAR_MISS, this._onNearMiss);
    eventBus.on(Events.SPEED_INCREASED, this._onSpeedIncreased);

    gameState.started = true;

    // --- Play entrance sequence (replaces simple fade-in) ---
    this.spectacle.playEntrance(this.player.container);
  }

  update(time, delta) {
    if (gameState.gameOver) return;

    // Merge keyboard + touch into unified input state
    const left = this.cursors.left.isDown || this.wasd.left.isDown || this.touchLeft;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchRight;

    this.player.update(left, right);

    // Update systems
    this.bitSpawner.update(delta);
    this.scoreSystem.update(delta);

    // Check for dodged bits (bits that passed below player without hitting)
    this.checkDodgedBits();

    // Update matrix rain
    this.updateMatrixRain(delta);

    // Update spectacle system (ambient motes, etc.)
    this.spectacle.update(delta);
  }

  /**
   * Check for bits that have fallen past the player -- count as dodged.
   * Near-miss detection: bit x was within 20% of player width from player center.
   * Also triggers bit dissolve effect on off-screen bits.
   */
  checkDodgedBits() {
    const playerX = this.player.container.x;
    const playerW = PLAYER.WIDTH;
    const nearMissRange = playerW * NEAR_MISS.THRESHOLD;

    const activeBits = this.bitSpawner.getActiveBits();
    for (const bit of activeBits) {
      if (!bit.active) continue;

      // Check if bit has passed below the dodge check line
      if (bit.container.y > this.dodgeCheckY && !bit._dodgeCounted) {
        bit._dodgeCounted = true;

        const dx = Math.abs(bit.container.x - playerX);

        if (dx < nearMissRange + playerW * 0.5) {
          // Near-miss -- bit was very close
          eventBus.emit(Events.SPECTACLE_NEAR_MISS, {
            x: bit.container.x,
            y: bit.container.y,
            distance: dx,
          });
        }

        // Count as dodged
        gameState.addCombo();
        eventBus.emit(Events.BIT_DODGED, { combo: gameState.combo });

        // Emit combo spectacle every 5 dodges
        if (gameState.combo > 0 && gameState.combo % 5 === 0) {
          eventBus.emit(Events.SPECTACLE_COMBO, { combo: gameState.combo });
        }
      }

      // Trigger dissolve effect when bit is near screen bottom (before recycling)
      if (bit.container.y > GAME.HEIGHT - BIT.MAX_SIZE && !bit._dissolvePlayed) {
        bit._dissolvePlayed = true;
        this.spectacle.bitDissolve(bit.container, bit.text?.style?.color);
      }
    }
  }

  /**
   * Called when player overlaps with a bit.
   */
  onPlayerHit(playerContainer, bitContainer) {
    if (gameState.gameOver) return;

    // Find the bit object for this container
    const bit = this.bitSpawner.pool.find(b => b.container === bitContainer);
    if (bit && !bit.active) return; // Skip inactive bits

    this.triggerGameOver(bitContainer);
  }

  triggerGameOver(killingBitContainer) {
    if (gameState.gameOver) return;
    gameState.gameOver = true;

    // Flash player angry
    this.player.setExpression(EXPRESSION.ANGRY);

    eventBus.emit(Events.PLAYER_HIT, {
      score: gameState.score,
      combo: gameState.combo,
      survivalTime: gameState.survivalTime,
      speed: gameState.currentSpeed,
    });
    eventBus.emit(Events.GAME_OVER, { score: gameState.score });

    // Play death spectacle sequence (freeze, flash, slow-mo, particles, zoom)
    this.spectacle.playDeath(this.player.container, killingBitContainer);

    // Transition to GameOver scene after death sequence completes
    this.time.delayedCall(SPECTACLE.DEATH_TRANSITION_DELAY, () => {
      this.scene.start('GameOverScene');
    });
  }

  // --- Background Grid ---

  /**
   * Draw a subtle grid pattern on the background at depth -10.
   * Returns the graphics object so SpectacleSystem can pulse it.
   */
  drawGrid() {
    const gfx = this.add.graphics();
    gfx.lineStyle(1, COLORS.GRID_LINE, COLORS.GRID_ALPHA);

    const gridSpacing = 40 * PX;

    // Vertical lines
    for (let x = 0; x <= GAME.WIDTH; x += gridSpacing) {
      gfx.moveTo(x, 0);
      gfx.lineTo(x, GAME.HEIGHT);
    }

    // Horizontal lines
    for (let y = 0; y <= GAME.HEIGHT; y += gridSpacing) {
      gfx.moveTo(0, y);
      gfx.lineTo(GAME.WIDTH, y);
    }

    gfx.strokePath();
    gfx.setDepth(-10);

    return gfx;
  }

  // --- Matrix Rain Background Effect ---

  /**
   * Create a pool of slow-scrolling text characters for ambient matrix rain.
   * Depth -5, very low alpha -- creates atmosphere without distraction.
   */
  createMatrixRain() {
    for (let i = 0; i < MATRIX_RAIN.POOL_SIZE; i++) {
      const char = Phaser.Utils.Array.GetRandom(MATRIX_RAIN.CHARACTERS);
      const color = Phaser.Utils.Array.GetRandom(COLORS.NEON_COLORS);
      const alpha = Phaser.Math.FloatBetween(MATRIX_RAIN.ALPHA_MIN, MATRIX_RAIN.ALPHA_MAX);
      const fontSizeRatio = Phaser.Math.FloatBetween(MATRIX_RAIN.FONT_SIZE_MIN, MATRIX_RAIN.FONT_SIZE_MAX);
      const fontSize = Math.round(GAME.HEIGHT * fontSizeRatio);

      const text = this.add.text(0, 0, char, {
        fontSize: fontSize + 'px',
        fontFamily: '"Courier New", Courier, monospace',
        color: color,
        alpha: alpha,
      }).setOrigin(0.5);

      text.setDepth(MATRIX_RAIN.DEPTH);

      // Randomize initial position across entire screen
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(0, GAME.HEIGHT);
      text.setPosition(x, y);

      // Assign a fall speed in canvas-pixel space
      const speed = Phaser.Math.FloatBetween(MATRIX_RAIN.SPEED_MIN, MATRIX_RAIN.SPEED_MAX) * PX;

      this.matrixRainPool.push({
        text,
        speed,
      });
    }
  }

  /**
   * Update matrix rain -- move down, recycle when off-screen.
   */
  updateMatrixRain(delta) {
    const dt = delta / 1000; // convert ms to seconds
    for (const drop of this.matrixRainPool) {
      drop.text.y += drop.speed * dt;

      // Recycle when off screen bottom
      if (drop.text.y > GAME.HEIGHT + 50) {
        drop.text.y = -50;
        drop.text.x = Phaser.Math.Between(0, GAME.WIDTH);

        // Randomize character and appearance on recycle
        const char = Phaser.Utils.Array.GetRandom(MATRIX_RAIN.CHARACTERS);
        const color = Phaser.Utils.Array.GetRandom(COLORS.NEON_COLORS);
        const alpha = Phaser.Math.FloatBetween(MATRIX_RAIN.ALPHA_MIN, MATRIX_RAIN.ALPHA_MAX);
        drop.text.setText(char);
        drop.text.setColor(color);
        drop.text.setAlpha(alpha);

        // Re-randomize speed
        drop.speed = Phaser.Math.FloatBetween(MATRIX_RAIN.SPEED_MIN, MATRIX_RAIN.SPEED_MAX) * PX;
      }
    }
  }

  // --- Cleanup ---

  /**
   * Remove EventBus listeners on scene shutdown to prevent leaks on restart.
   */
  shutdown() {
    eventBus.off(Events.SCORE_CHANGED, this._onScoreChanged);
    eventBus.off(Events.PLAYER_HIT, this._onPlayerHit);
    eventBus.off(Events.SPECTACLE_NEAR_MISS, this._onNearMiss);
    eventBus.off(Events.SPEED_INCREASED, this._onSpeedIncreased);

    // Clean up spectacle system (removes its own EventBus listeners, particles, etc.)
    if (this.spectacle) {
      this.spectacle.destroy();
    }

    // Clean up player expression timer
    if (this.player) {
      this.player.destroy();
    }

    // Clean up bit spawner
    if (this.bitSpawner) {
      this.bitSpawner.destroy();
    }

    // Clean up score system
    if (this.scoreSystem) {
      this.scoreSystem.destroy();
    }

    // Clean up matrix rain text objects
    if (this.matrixRainPool) {
      for (const drop of this.matrixRainPool) {
        drop.text.destroy();
      }
      this.matrixRainPool = [];
    }

    // Reset camera zoom (in case death zoom was active)
    this.cameras.main.setZoom(1);
  }
}

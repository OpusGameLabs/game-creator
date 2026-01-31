import Phaser from 'phaser';
import { GAME, PLAYER, COLORS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { Player } from '../entities/Player.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    gameState.reset();
    this.cameras.main.setBackgroundColor(COLORS.SKY);

    // Mobile detection
    this.isMobile = this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS || this.sys.game.device.os.iPad;

    // Ground
    const ground = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT - 15, GAME.WIDTH, 30, COLORS.GROUND);
    this.physics.add.existing(ground, true);

    // Player
    this.player = new Player(this);

    // Collisions
    this.physics.add.collider(this.player.sprite, ground);

    // Score system
    this.scoreSystem = new ScoreSystem();

    // Keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Touch input state
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;

    // Tap-zone input: left half = left, right half = right, double-tap = jump
    if (this.isMobile) {
      this.input.on('pointerdown', (pointer) => {
        if (pointer.x < this.scale.width / 2) {
          this.touchLeft = true;
        } else {
          this.touchRight = true;
        }
      });
      this.input.on('pointerup', () => {
        this.touchLeft = false;
        this.touchRight = false;
      });
      // Swipe up or two-finger tap for jump
      this.input.on('pointerdown', (pointer) => {
        if (pointer.y < this.scale.height * 0.4) {
          this.touchJump = true;
        }
      });
      this.input.on('pointerup', () => {
        this.touchJump = false;
      });
    }

    gameState.started = true;
  }

  update() {
    if (gameState.gameOver) return;

    // Merge keyboard + touch into unified input state
    const left = this.cursors.left.isDown || this.wasd.left.isDown || this.touchLeft;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchRight;
    const jump = Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
                 Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                 Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
                 this.touchJump;

    this.player.update(left, right, jump);

    // Reset single-frame touch jump
    if (this.touchJump) this.touchJump = false;
  }

  triggerGameOver() {
    if (gameState.gameOver) return;
    gameState.gameOver = true;
    eventBus.emit(Events.GAME_OVER, { score: gameState.score });
    this.scene.stop('UIScene');
    this.scene.start('GameOverScene');
  }
}

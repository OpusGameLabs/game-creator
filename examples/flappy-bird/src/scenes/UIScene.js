import Phaser from 'phaser';
import { GAME, COLORS, TRANSITION, UI } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

const ICON_SIZE = 16;
const MUTE_MARGIN = 12;

function drawMuteIcon(gfx, muted, size) {
  gfx.clear();
  const s = size;

  gfx.fillStyle(0xffffff);
  gfx.fillRect(-s * 0.15, -s * 0.15, s * 0.15, s * 0.3);
  gfx.fillTriangle(-s * 0.15, -s * 0.3, -s * 0.15, s * 0.3, -s * 0.45, 0);

  if (!muted) {
    gfx.lineStyle(2, 0xffffff);
    gfx.beginPath();
    gfx.arc(0, 0, s * 0.2, -Math.PI / 4, Math.PI / 4);
    gfx.strokePath();
    gfx.beginPath();
    gfx.arc(0, 0, s * 0.35, -Math.PI / 4, Math.PI / 4);
    gfx.strokePath();
  } else {
    gfx.lineStyle(3, 0xff4444);
    gfx.lineBetween(s * 0.05, -s * 0.25, s * 0.35, s * 0.25);
    gfx.lineBetween(s * 0.05, s * 0.25, s * 0.35, -s * 0.25);
  }
}

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    const cx = GAME.WIDTH / 2;

    this.scoreText = this.add.text(cx, GAME.HEIGHT * UI.SCORE_Y_RATIO, '0', {
      fontSize: `${Math.round(GAME.HEIGHT * UI.SCORE_FONT_RATIO)}px`,
      fontFamily: UI.FONT,
      color: COLORS.UI_TEXT,
      stroke: COLORS.SCORE_STROKE,
      strokeThickness: UI.STROKE,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.onScoreChanged = ({ score }) => {
      this.scoreText.setText(`${score}`);
      this.tweens.add({
        targets: this.scoreText,
        scaleX: TRANSITION.SCORE_POP_SCALE,
        scaleY: TRANSITION.SCORE_POP_SCALE,
        duration: TRANSITION.SCORE_POP_DURATION,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    };

    eventBus.on(Events.SCORE_CHANGED, this.onScoreChanged);
    this._createMuteButton();

    this.events.on('shutdown', () => {
      eventBus.off(Events.SCORE_CHANGED, this.onScoreChanged);
    });
  }

  _createMuteButton() {
    const x = this.cameras.main.width - MUTE_MARGIN - ICON_SIZE;
    const y = this.cameras.main.height - MUTE_MARGIN - ICON_SIZE;

    this.muteBg = this.add.circle(x, y, ICON_SIZE + 4, 0x000000, 0.3)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);

    this.muteIcon = this.add.graphics().setDepth(100);
    this.muteIcon.setPosition(x, y);
    drawMuteIcon(this.muteIcon, gameState.isMuted, ICON_SIZE);

    this.muteBg.on('pointerdown', () => this._toggleMute());
    this.input.keyboard.on('keydown-M', () => this._toggleMute());
  }

  _toggleMute() {
    eventBus.emit(Events.AUDIO_TOGGLE_MUTE);
    drawMuteIcon(this.muteIcon, gameState.isMuted, ICON_SIZE);
  }
}

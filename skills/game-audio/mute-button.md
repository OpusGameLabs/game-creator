# Mute State Management

Store `isMuted` in GameState and respect it via the master gain node:

```js
// AudioBridge — handle mute toggle event
eventBus.on(Events.AUDIO_TOGGLE_MUTE, () => {
  gameState.isMuted = !gameState.isMuted;
  try { localStorage.setItem('muted', gameState.isMuted); } catch (_) {}
  audioManager.setMuted(gameState.isMuted);
  if (gameState.isMuted) audioManager.stopMusic();
});
```

Muting via `masterGain.gain.value = 0` silences both BGM and SFX through a single control point. No need to check mute state in every SFX function.

## Mute Button

Reference implementation for drawing a speaker icon with the Phaser Graphics API:

```js
function drawMuteIcon(gfx, muted, size) {
  gfx.clear();
  const s = size;

  // Speaker body — rectangle + triangle cone
  gfx.fillStyle(0xffffff);
  gfx.fillRect(-s * 0.15, -s * 0.15, s * 0.15, s * 0.3);
  gfx.fillTriangle(-s * 0.15, -s * 0.3, -s * 0.15, s * 0.3, -s * 0.45, 0);

  if (!muted) {
    // Sound waves — two arcs
    gfx.lineStyle(2, 0xffffff);
    gfx.beginPath();
    gfx.arc(0, 0, s * 0.2, -Math.PI / 4, Math.PI / 4);
    gfx.strokePath();
    gfx.beginPath();
    gfx.arc(0, 0, s * 0.35, -Math.PI / 4, Math.PI / 4);
    gfx.strokePath();
  } else {
    // X mark
    gfx.lineStyle(3, 0xff4444);
    gfx.lineBetween(s * 0.05, -s * 0.25, s * 0.35, s * 0.25);
    gfx.lineBetween(s * 0.05, s * 0.25, s * 0.35, -s * 0.25);
  }
}
```

Create the button in UIScene (runs as a parallel scene, visible on all screens):

```js
// In UIScene.create():
_createMuteButton() {
  const ICON_SIZE = 16;
  const MARGIN = 12;
  const x = this.cameras.main.width - MARGIN - ICON_SIZE;
  const y = this.cameras.main.height - MARGIN - ICON_SIZE;

  this.muteBg = this.add.circle(x, y, ICON_SIZE + 4, 0x000000, 0.3)
    .setInteractive({ useHandCursor: true })
    .setDepth(100);

  this.muteIcon = this.add.graphics().setDepth(100);
  this.muteIcon.setPosition(x, y);
  drawMuteIcon(this.muteIcon, gameState.isMuted, ICON_SIZE);

  this.muteBg.on('pointerdown', () => {
    eventBus.emit(Events.AUDIO_TOGGLE_MUTE);
    drawMuteIcon(this.muteIcon, gameState.isMuted, ICON_SIZE);
  });

  this.input.keyboard.on('keydown-M', () => {
    eventBus.emit(Events.AUDIO_TOGGLE_MUTE);
    drawMuteIcon(this.muteIcon, gameState.isMuted, ICON_SIZE);
  });
}
```

## localStorage Persistence

Persist preference via `localStorage`:

```js
// GameState — read on construct
constructor() {
  this.isMuted = localStorage.getItem('muted') === 'true';
}
```

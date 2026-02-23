# System Patterns

Reusable system patterns for browser games: object pooling, delta-time normalization, resource disposal, wave/spawn systems, and buff/powerup systems.

## Object Pooling

Reuse temporary math objects in hot loops:

```js
// Module-level reusable objects
const _tempVec = new THREE.Vector3();
const _tempBox = new THREE.Box3();

update(delta) {
  // Reuse instead of creating new
  _tempVec.set(x, y, z);
}
```

For Phaser, use Group-based pooling:

```js
this.bulletPool = this.physics.add.group({
  classType: Bullet,
  maxSize: 50,
  runChildUpdate: true
});

fire() {
  const bullet = this.bulletPool.get(x, y);
  if (bullet) bullet.fire(direction);
}
```

## Delta Time

Always cap delta to prevent death spirals after tab-out:

```js
const delta = Math.min(clock.getDelta(), 0.1);
```

## Resource Disposal

Clean up Three.js resources:

```js
// When removing objects
geometry.dispose();
material.dispose();
texture.dispose();
scene.remove(mesh);
```

Clean up Phaser event listeners:

```js
// Store unsubscribe functions
this.unsubs = [eventBus.on(Events.X, handler)];

// In shutdown
this.unsubs.forEach(fn => fn());
```

## Wave/Spawn System Pattern

For wave-based games, use configuration-driven scaling:

```js
export const WAVE_CONFIG = {
  initialSpawnInterval: 4,
  minSpawnInterval: 1.5,
  intervalReductionPerWave: 0.3,
  initialEnemiesPerWave: 6,
  enemiesIncreasePerWave: 2,
  maxEnemiesPerWave: 30,
  initialMaxConcurrent: 4,
  maxConcurrentPerWave: 1,
  maxConcurrentCap: 12
};
```

All wave difficulty math references these constants, never hardcoded numbers.

## Buff/Effect System

Use time-based buffs with multipliers:

```js
addBuff(stat, multiplier, durationSeconds) {
  this.player.buffs.push({
    stat, multiplier, duration: durationSeconds,
    endTime: Date.now() + durationSeconds * 1000
  });
}
updateBuffs() {
  this.player.buffs = this.player.buffs.filter(b => b.endTime > Date.now());
}
getBuffMultiplier(stat) {
  return this.player.buffs
    .filter(b => b.stat === stat || b.stat === 'all')
    .reduce((mult, b) => mult * b.multiplier, 1);
}
```

## Haptic Feedback (Mobile)

Use the Vibration API sparingly for key gameplay moments on mobile. Always check support and wrap in try/catch:

```js
function haptic(durationMs = 50) {
  try {
    if (navigator.vibrate) navigator.vibrate(durationMs);
  } catch (e) { /* noop — not all browsers support it */ }
}

// Wire to gameplay events
eventBus.on(Events.PLAYER_DIED, () => haptic(100));
eventBus.on(Events.SCORE_CHANGED, () => haptic(30));
eventBus.on(Events.GAME_OVER, () => haptic(200));
```

Use short pulses (20-50ms) for positive feedback (score, pickup) and longer pulses (100-200ms) for negative/impactful events (death, collision). Never use haptics for continuous events (every frame of movement).

## Asset Management

- 3D models: GLB format (compact, single file)
- 2D sprites: Spritesheets or texture atlases
- Audio: MP3 for music, WAV/OGG for short SFX
- Put assets in `/public/` for Vite serving
- Show loading progress to the player
- Preload everything before gameplay starts

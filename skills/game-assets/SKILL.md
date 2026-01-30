---
name: game-assets
description: Game asset engineer that creates pixel art sprites, animated characters, and visual entities for browser games. Use when a game needs better character art, enemy sprites, item visuals, or any upgrade from basic geometric shapes to recognizable pixel art.
---

# Game Asset Engineer (Pixel Art + Asset Pipeline)

You are an expert pixel art game artist. You create recognizable, stylish character sprites using code-only pixel art matrices — no external image files needed. You think in silhouettes, color contrast, and animation readability at small scales.

## Philosophy

Procedural circles and rectangles are fast to scaffold, but players can't tell a bat from a zombie. Pixel art sprites — even at 16x16 — give every entity a recognizable identity. The key insight: **pixel art IS code**. A 16x16 sprite is just a 2D array of palette indices, rendered to a Canvas texture at runtime.

This approach:
- **Zero external dependencies** — no image files, no downloads, no broken URLs
- **Legitimate art style** — 16x16 and 32x32 pixel art is a real aesthetic (Celeste, Shovel Knight, Vampire Survivors itself)
- **Unique per game** — Claude generates custom sprites matching each game's theme
- **Drops into existing architecture** — replaces `fillCircle()` + `generateTexture()` in entity constructors
- **Animation support** — multiple frames as separate matrices, wired to Phaser anims

## Pixel Art Rendering System

### Core Renderer

Add this to `src/core/PixelRenderer.js`:

```js
/**
 * Renders a 2D pixel matrix to a Phaser texture.
 *
 * @param {Phaser.Scene} scene - The scene to register the texture on
 * @param {number[][]} pixels - 2D array of palette indices (0 = transparent)
 * @param {(number|null)[]} palette - Array of hex colors indexed by pixel value
 * @param {string} key - Texture key to register
 * @param {number} scale - Pixel scale (2 = each pixel becomes 2x2)
 */
export function renderPixelArt(scene, pixels, palette, key, scale = 2) {
  if (scene.textures.exists(key)) return;

  const h = pixels.length;
  const w = pixels[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = pixels[y][x];
      if (idx === 0 || palette[idx] == null) continue;
      const color = palette[idx];
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  scene.textures.addCanvas(key, canvas);
}

/**
 * Renders multiple frames as a spritesheet texture.
 * Frames are laid out horizontally in a single row.
 *
 * @param {Phaser.Scene} scene
 * @param {number[][][]} frames - Array of pixel matrices (one per frame)
 * @param {(number|null)[]} palette
 * @param {string} key - Spritesheet texture key
 * @param {number} scale
 */
export function renderSpriteSheet(scene, frames, palette, key, scale = 2) {
  if (scene.textures.exists(key)) return;

  const h = frames[0].length;
  const w = frames[0][0].length;
  const frameW = w * scale;
  const frameH = h * scale;
  const canvas = document.createElement('canvas');
  canvas.width = frameW * frames.length;
  canvas.height = frameH;
  const ctx = canvas.getContext('2d');

  frames.forEach((pixels, fi) => {
    const offsetX = fi * frameW;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = pixels[y][x];
        if (idx === 0 || palette[idx] == null) continue;
        const color = palette[idx];
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(offsetX + x * scale, y * scale, scale, scale);
      }
    }
  });

  scene.textures.addSpriteSheet(key, scene.textures.addCanvas(`${key}-canvas`, canvas).source[0], {
    frameWidth: frameW,
    frameHeight: frameH,
  });
}
```

### Directory Structure

```
src/
  core/
    PixelRenderer.js    # renderPixelArt() + renderSpriteSheet()
  sprites/
    palette.js          # Shared color palette(s) for the game
    player.js           # Player sprite frames
    enemies.js          # Enemy sprite frames (one export per type)
    items.js            # Pickups, gems, weapons, etc.
    projectiles.js      # Bullets, fireballs, etc.
```

### Palette Definition

Define palettes in `src/sprites/palette.js`. Every sprite in the game references these palettes — never inline hex values in pixel matrices.

```js
// palette.js — all sprite colors live here
// Index 0 is ALWAYS transparent

export const PALETTE = {
  // Gothic / dark fantasy (vampire survivors, roguelikes)
  DARK: [
    null,       // 0: transparent
    0x1a1a2e,   // 1: dark outline
    0x16213e,   // 2: shadow
    0xe94560,   // 3: accent (blood red)
    0xf5d742,   // 4: highlight (gold)
    0x8b5e3c,   // 5: skin
    0x4a4a6a,   // 6: armor/cloth
    0x2d2d4a,   // 7: dark cloth
    0xffffff,   // 8: white (eyes, teeth)
    0x6b3fa0,   // 9: purple (magic)
    0x3fa04b,   // 10: green (poison/nature)
  ],

  // Bright / arcade (platformers, casual)
  BRIGHT: [
    null,
    0x222034,   // 1: outline
    0x45283c,   // 2: shadow
    0xd95763,   // 3: red
    0xfbf236,   // 4: yellow
    0xeec39a,   // 5: skin
    0x5fcde4,   // 6: blue
    0x639bff,   // 7: light blue
    0xffffff,   // 8: white
    0x76428a,   // 9: purple
    0x99e550,   // 10: green
  ],

  // Muted / retro (NES-inspired)
  RETRO: [
    null,
    0x000000,   // 1: black outline
    0x7c7c7c,   // 2: dark gray
    0xbcbcbc,   // 3: light gray
    0xf83800,   // 4: red
    0xfcfc00,   // 5: yellow
    0xa4e4fc,   // 6: sky blue
    0x3cbcfc,   // 7: blue
    0xfcfcfc,   // 8: white
    0x0078f8,   // 9: dark blue
    0x00b800,   // 10: green
  ],
};
```

## Sprite Archetypes

When creating sprites for a game, match the archetype to the entity type. All examples below use 16x16 grids at scale 2 (renders to 32x32 pixels on screen).

### Humanoid (Player, NPC, Warrior)

Key features: Head (2-3px wide), body (3-4px wide), legs (2 columns). Arms optional at 16x16. Distinguish characters via hair/hat color and body color.

```js
// sprites/player.js
import { PALETTE } from './palette.js';

export const PLAYER_PALETTE = PALETTE.DARK;

// Idle frame — standing, sword at side
export const PLAYER_IDLE = [
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,4,4,4,4,1,0,0,0,0,0],
  [0,0,0,0,0,1,4,4,4,4,1,0,0,0,0,0],
  [0,0,0,0,1,5,5,5,5,5,5,1,0,0,0,0],
  [0,0,0,0,1,5,1,5,5,1,5,1,0,0,0,0],
  [0,0,0,0,1,5,5,5,5,5,5,1,0,0,0,0],
  [0,0,0,0,0,1,5,3,5,5,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,6,6,6,6,6,6,1,0,0,0,0],
  [0,0,0,1,6,6,6,6,6,6,6,6,1,0,0,0],
  [0,0,0,1,6,6,6,6,6,6,6,6,1,0,0,0],
  [0,0,0,1,5,6,6,6,6,6,6,5,1,0,0,0],
  [0,0,0,0,1,6,6,6,6,6,6,1,0,0,0,0],
  [0,0,0,0,1,7,7,1,1,7,7,1,0,0,0,0],
  [0,0,0,0,1,7,7,1,1,7,7,1,0,0,0,0],
  [0,0,0,0,1,1,1,0,0,1,1,1,0,0,0,0],
];

// Walk frame 1 — left leg forward
export const PLAYER_WALK1 = [
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,4,4,4,4,1,0,0,0,0,0],
  [0,0,0,0,0,1,4,4,4,4,1,0,0,0,0,0],
  [0,0,0,0,1,5,5,5,5,5,5,1,0,0,0,0],
  [0,0,0,0,1,5,1,5,5,1,5,1,0,0,0,0],
  [0,0,0,0,1,5,5,5,5,5,5,1,0,0,0,0],
  [0,0,0,0,0,1,5,3,5,5,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,6,6,6,6,6,6,1,0,0,0,0],
  [0,0,0,1,6,6,6,6,6,6,6,6,1,0,0,0],
  [0,0,0,1,6,6,6,6,6,6,6,6,1,0,0,0],
  [0,0,0,1,5,6,6,6,6,6,6,5,1,0,0,0],
  [0,0,0,0,1,6,6,6,6,6,6,1,0,0,0,0],
  [0,0,0,1,7,7,1,0,0,1,7,7,1,0,0,0],
  [0,0,1,7,7,1,0,0,0,0,1,7,1,0,0,0],
  [0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0],
];

// Walk frame 2 — right leg forward (mirror of walk1)
export const PLAYER_WALK2 = [
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,4,4,4,4,1,0,0,0,0,0],
  [0,0,0,0,0,1,4,4,4,4,1,0,0,0,0,0],
  [0,0,0,0,1,5,5,5,5,5,5,1,0,0,0,0],
  [0,0,0,0,1,5,1,5,5,1,5,1,0,0,0,0],
  [0,0,0,0,1,5,5,5,5,5,5,1,0,0,0,0],
  [0,0,0,0,0,1,5,3,5,5,1,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,6,6,6,6,6,6,1,0,0,0,0],
  [0,0,0,1,6,6,6,6,6,6,6,6,1,0,0,0],
  [0,0,0,1,6,6,6,6,6,6,6,6,1,0,0,0],
  [0,0,0,1,5,6,6,6,6,6,6,5,1,0,0,0],
  [0,0,0,0,1,6,6,6,6,6,6,1,0,0,0,0],
  [0,0,0,1,7,1,0,0,1,7,7,1,0,0,0,0],
  [0,0,0,1,7,1,0,0,0,1,7,7,1,0,0,0],
  [0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0],
];

export const PLAYER_FRAMES = [PLAYER_IDLE, PLAYER_WALK1, PLAYER_IDLE, PLAYER_WALK2];
```

### Flying Creature (Bat, Ghost, Bird)

Key features: Wide silhouette (wings/wispy edges), small body, glowing eyes. Wings swap between up/down for animation.

```js
// In sprites/enemies.js
export const BAT_IDLE = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0],
  [0,1,9,9,1,0,0,0,0,0,1,9,9,1,0,0],
  [1,9,9,9,9,1,0,0,0,1,9,9,9,9,1,0],
  [1,9,9,9,9,9,1,1,1,9,9,9,9,9,1,0],
  [0,1,9,9,9,9,9,9,9,9,9,9,9,1,0,0],
  [0,0,1,9,9,3,9,9,9,3,9,9,1,0,0,0],
  [0,0,0,1,9,9,9,9,9,9,9,1,0,0,0,0],
  [0,0,0,0,1,9,9,8,9,9,1,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Wings down frame — alternate with idle for flapping
export const BAT_FLAP = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,9,9,9,9,9,1,0,0,0,0,0],
  [0,0,0,1,9,9,3,9,3,9,9,1,0,0,0,0],
  [0,0,1,9,9,9,9,9,9,9,9,9,1,0,0,0],
  [0,1,9,9,9,9,9,8,9,9,9,9,9,1,0,0],
  [1,9,9,9,9,9,1,1,1,9,9,9,9,9,1,0],
  [1,9,9,9,9,1,0,0,0,1,9,9,9,9,1,0],
  [0,1,9,9,1,0,0,0,0,0,1,9,9,1,0,0],
  [0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
```

### Ground Creature (Zombie, Slime, Skeleton)

Key features: Wider base, heavier silhouette, shambling posture. Animate by shifting body weight side to side.

```js
// Zombie — hunched, arms forward
export const ZOMBIE_IDLE = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,10,10,10,10,10,1,0,0,0,0,0],
  [0,0,0,0,1,10,3,10,3,10,1,0,0,0,0,0],
  [0,0,0,0,1,10,10,10,10,10,1,0,0,0,0,0],
  [0,0,0,0,0,1,10,1,10,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,1,7,7,7,7,7,1,0,0,0,0,0],
  [0,0,0,1,7,7,7,7,7,7,7,1,0,0,0,0],
  [0,0,1,10,7,7,7,7,7,7,10,10,1,0,0,0],
  [0,1,10,1,7,7,7,7,7,7,1,10,10,1,0,0],
  [0,0,0,0,1,7,7,7,7,7,1,0,0,0,0,0],
  [0,0,0,0,1,7,7,1,7,7,1,0,0,0,0,0],
  [0,0,0,0,1,7,1,0,1,7,1,0,0,0,0,0],
  [0,0,0,0,1,10,1,0,1,10,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],
];
```

### Item / Pickup (Gem, Coin, Heart, Orb)

Key features: Small (8x8 or 12x12), bright colors, simple symmetric shape. Often animated with a bob tween rather than frame animation.

```js
// XP Gem — diamond shape, 8x8
export const XP_GEM = [
  [0,0,0,4,4,0,0,0],
  [0,0,4,4,4,4,0,0],
  [0,4,4,8,4,4,4,0],
  [4,4,8,4,4,4,4,4],
  [4,4,4,4,4,8,4,4],
  [0,4,4,4,4,4,4,0],
  [0,0,4,4,4,4,0,0],
  [0,0,0,4,4,0,0,0],
];

// Heart — 8x8
export const HEART = [
  [0,0,3,3,0,3,3,0],
  [0,3,3,3,3,3,3,3],
  [0,3,8,3,3,3,3,3],
  [0,3,3,3,3,3,3,3],
  [0,0,3,3,3,3,3,0],
  [0,0,0,3,3,3,0,0],
  [0,0,0,0,3,0,0,0],
  [0,0,0,0,0,0,0,0],
];
```

### Projectile (Bullet, Fireball, Magic Bolt)

Key features: Very small (4x4 to 8x8), bright, high contrast. Often just a few pixels with a glow color.

```js
// Fireball — 8x8
export const FIREBALL = [
  [0,0,0,4,4,0,0,0],
  [0,0,4,4,4,4,0,0],
  [0,3,4,8,4,4,3,0],
  [3,3,4,4,4,4,3,3],
  [0,3,3,4,4,3,3,0],
  [0,0,3,3,3,3,0,0],
  [0,0,0,3,3,0,0,0],
  [0,0,0,0,0,0,0,0],
];

// Magic bolt — 6x6
export const MAGIC_BOLT = [
  [0,0,9,9,0,0],
  [0,9,8,9,9,0],
  [9,9,9,9,9,9],
  [9,9,9,9,9,9],
  [0,9,9,8,9,0],
  [0,0,9,9,0,0],
];
```

## Integration Pattern

### Replacing fillCircle Entities

Current pattern (procedural circle):
```js
// OLD: in entity constructor
const gfx = scene.add.graphics();
gfx.fillStyle(cfg.color, 1);
gfx.fillCircle(cfg.size, cfg.size, cfg.size);
gfx.generateTexture(texKey, cfg.size * 2, cfg.size * 2);
gfx.destroy();
this.sprite = scene.physics.add.sprite(x, y, texKey);
```

New pattern (pixel art):
```js
// NEW: in entity constructor
import { renderPixelArt } from '../core/PixelRenderer.js';
import { ZOMBIE_IDLE } from '../sprites/enemies.js';
import { PALETTE } from '../sprites/palette.js';

const texKey = `enemy-${typeKey}`;
renderPixelArt(scene, ZOMBIE_IDLE, PALETTE.DARK, texKey, 2);
this.sprite = scene.physics.add.sprite(x, y, texKey);
```

### Adding Animation

```js
import { renderSpriteSheet } from '../core/PixelRenderer.js';
import { PLAYER_FRAMES, PLAYER_PALETTE } from '../sprites/player.js';

// In entity constructor or BootScene
renderSpriteSheet(scene, PLAYER_FRAMES, PLAYER_PALETTE, 'player-sheet', 2);

// Create animation
scene.anims.create({
  key: 'player-walk',
  frames: scene.anims.generateFrameNumbers('player-sheet', { start: 0, end: 3 }),
  frameRate: 8,
  repeat: -1,
});

// Play animation
this.sprite = scene.physics.add.sprite(x, y, 'player-sheet', 0);
this.sprite.play('player-walk');

// Stop animation (idle)
this.sprite.stop();
this.sprite.setFrame(0);
```

### Multiple Enemy Types

When a game has multiple enemy types (like Vampire Survivors), define each type's sprite data alongside its config:

```js
// sprites/enemies.js
import { PALETTE } from './palette.js';

export const ENEMY_SPRITES = {
  BAT: { frames: [BAT_IDLE, BAT_FLAP], palette: PALETTE.DARK, animRate: 6 },
  ZOMBIE: { frames: [ZOMBIE_IDLE, ZOMBIE_WALK], palette: PALETTE.DARK, animRate: 4 },
  SKELETON: { frames: [SKELETON_IDLE, SKELETON_WALK], palette: PALETTE.DARK, animRate: 5 },
  GHOST: { frames: [GHOST_IDLE, GHOST_FADE], palette: PALETTE.DARK, animRate: 3 },
  DEMON: { frames: [DEMON_IDLE, DEMON_WALK], palette: PALETTE.DARK, animRate: 6 },
};

// In Enemy constructor:
const spriteData = ENEMY_SPRITES[typeKey];
const texKey = `enemy-${typeKey}`;
renderSpriteSheet(scene, spriteData.frames, spriteData.palette, texKey, 2);

this.sprite = scene.physics.add.sprite(x, y, texKey, 0);
scene.anims.create({
  key: `${typeKey}-anim`,
  frames: scene.anims.generateFrameNumbers(texKey, { start: 0, end: spriteData.frames.length - 1 }),
  frameRate: spriteData.animRate,
  repeat: -1,
});
this.sprite.play(`${typeKey}-anim`);
```

## Sprite Design Rules

When creating pixel art sprites, follow these rules:

### 1. Silhouette First
Every sprite must be recognizable from its outline alone. At 16x16, details are invisible — shape is everything:
- **Bat**: Wide horizontal wings, tiny body
- **Zombie**: Hunched, arms extended forward
- **Skeleton**: Thin, angular, visible gaps between bones
- **Ghost**: Wispy bottom edge, floaty posture
- **Warrior**: Square shoulders, weapon at side

### 2. Two-Tone Minimum
Every sprite needs at least:
- **Outline color** (palette index 1) — darkest, defines the shape
- **Fill color** — the character's primary color
- **Highlight** — a lighter spot for dimensionality (usually top-left)

### 3. Eyes Tell the Story
At 16x16, eyes are often just 1-2 pixels. Make them high-contrast:
- Red eyes (index 3) = hostile enemy
- White eyes (index 8) = neutral/friendly
- Glowing eyes = magic/supernatural

### 4. Animation Minimalism
At small scales, subtle changes read as smooth motion:
- **Walk**: Shift legs 1-2px per frame, 2-4 frames total
- **Fly**: Wings up/down, 2 frames
- **Idle**: Optional 1px bob (use Phaser tween instead of extra frame)
- **Attack**: Not needed at 16x16 — use screen effects (flash, shake) instead

### 5. Palette Discipline
- Every sprite in the game shares the same palette
- Differentiate enemies by which palette colors they use, not by adding new colors
- Bat = purple (index 9), Zombie = green (index 10), Skeleton = white (index 8), Demon = red (index 3)

### 6. Scale Appropriately
| Entity Size | Grid | Scale | Rendered Size |
|-------------|------|-------|---------------|
| Small (items, pickups) | 8x8 | 2 | 16x16px |
| Medium (player, enemies) | 16x16 | 2 | 32x32px |
| Large (boss, vehicle) | 24x24 or 32x32 | 2 | 48x48 or 64x64px |

## External Asset Download (Optional)

If the user explicitly requests real art assets instead of pixel art, use this workflow:

### Reliable Free Sources

| Source | License | Format | URL |
|--------|---------|--------|-----|
| Kenney.nl | CC0 (public domain) | PNG sprite sheets | kenney.nl/assets |
| OpenGameArt.org | Various (check each) | PNG, SVG | opengameart.org |
| itch.io (free assets) | Various (check each) | PNG | itch.io/game-assets/free |

### Download Workflow

1. **Search** for assets matching the game theme using WebSearch
2. **Verify license** — only CC0 or CC-BY are safe for any project
3. **Download** the sprite sheet PNG using `curl` or `wget`
4. **Place** in `public/assets/sprites/` (Vite serves `public/` as static)
5. **Load** in a Preloader scene:
   ```js
   // scenes/PreloaderScene.js
   preload() {
     this.load.spritesheet('player', 'assets/sprites/player.png', {
       frameWidth: 32,
       frameHeight: 32,
     });
   }
   ```
6. **Create animations** in the Preloader scene
7. **Add fallback** — if the asset fails to load, fall back to `renderPixelArt()`

### Graceful Fallback Pattern

```js
// Check if external asset loaded, otherwise use pixel art
if (scene.textures.exists('player-external')) {
  this.sprite = scene.physics.add.sprite(x, y, 'player-external');
} else {
  renderPixelArt(scene, PLAYER_IDLE, PLAYER_PALETTE, 'player-fallback', 2);
  this.sprite = scene.physics.add.sprite(x, y, 'player-fallback');
}
```

## Process

When invoked, follow this process:

### Step 1: Audit the game

- Read `package.json` to identify the engine
- Read `src/core/Constants.js` for entity types, colors, sizes
- Read all entity files to find `generateTexture()` or `fillCircle` calls
- List every entity that currently uses geometric shapes

### Step 2: Plan the sprites

Present a table of planned sprites:

| Entity | Type | Grid | Frames | Description |
|--------|------|------|--------|-------------|
| Player | Humanoid | 16x16 | 4 (idle + walk) | Cloaked warrior with golden hair |
| Bat | Flying | 16x16 | 2 (wings up/down) | Purple bat with red eyes |
| Zombie | Ground | 16x16 | 2 (shamble) | Green-skinned, arms forward |
| XP Gem | Item | 8x8 | 1 (static + bob tween) | Golden diamond |

Choose the appropriate palette for the game's theme.

### Step 3: Implement

1. Create `src/core/PixelRenderer.js` with `renderPixelArt()` and `renderSpriteSheet()`
2. Create `src/sprites/palette.js` with the chosen palette
3. Create sprite data files in `src/sprites/` — one per entity category
4. Update entity constructors to use `renderPixelArt()` / `renderSpriteSheet()` instead of `fillCircle()` + `generateTexture()`
5. Add animations where appropriate (walk cycles, wing flaps)
6. Verify physics bodies still align (adjust `setCircle()` / `setSize()` if sprite dimensions changed)

### Step 4: Verify

- Run `npm run build` to confirm no errors
- Check that physics colliders still work (sprite size may have changed)
- List all files created and modified
- Suggest running `/game-creator:qa-game` to update visual regression snapshots

## Checklist

When adding pixel art to a game, verify:

- [ ] `PixelRenderer.js` created in `src/core/`
- [ ] Palette defined in `src/sprites/palette.js` — matches game's theme
- [ ] All entities use `renderPixelArt()` or `renderSpriteSheet()` — no raw `fillCircle()` left
- [ ] Palette index 0 is transparent in every palette
- [ ] No inline hex colors in sprite matrices — all colors come from palette
- [ ] Physics bodies adjusted for new sprite dimensions
- [ ] Animations created for entities with multiple frames
- [ ] Static entities (items, pickups) use Phaser bob tweens for life
- [ ] Build succeeds with no errors
- [ ] Sprite scale matches game's visual style (scale 2 for retro, scale 1 for tiny)

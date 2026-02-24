---
name: add-assets
description: Replace geometric shapes with pixel art sprites — recognizable characters, enemies, and items with optional animation
argument-hint: "[path-to-game]"
disable-model-invocation: true
---

# Add Assets

Replace basic geometric shapes (circles, rectangles) with pixel art sprites for all game entities. Every character, enemy, item, and projectile gets a recognizable visual identity — all generated as code, no external image files needed.

## Instructions

Analyze the game at `$ARGUMENTS` (or the current directory if no path given).

First, load the game-assets skill to get the full pixel art system, archetypes, and integration patterns.

### Step 1: Audit

- Read `package.json` to identify the engine (Phaser or Three.js — this skill is Phaser-focused)
- Read `src/core/Constants.js` to understand entity types, colors, and sizes
- Read all entity files (`src/entities/*.js`) and find every `generateTexture()`, `fillCircle()`, `fillRect()`, or `fillEllipse()` call that creates an entity sprite
- Read scene files to check for inline shape drawing used as game entities
- List every entity that currently uses geometric shapes

### Step 2: Plan

Present a table of sprites to create:

| Entity | Archetype | Grid | Frames | Description |
|--------|-----------|------|--------|-------------|
| Player (personality) | Personality | 32x48 | 1-4 | Caricature of [name], scale 4 |
| Player (generic) | Humanoid | 16x16 | 4 | ... |
| Enemy X | Flying | 16x16 | 2 | ... |
| Pickup | Item | 8x8 | 1 | ... |

If the game features a real person or named personality, default to the **Personality** archetype for the player character. This uses a 32x48 grid at scale 4 (128x192px rendered, ~35% of canvas height) — large enough to recognize the personality at a glance.

Choose the palette that best matches the game's existing color scheme:
- **DARK** — gothic, horror, dark fantasy
- **BRIGHT** — arcade, platformer, casual
- **RETRO** — NES-style, muted tones

Grid sizes range from 8x8 (tiny pickups) through 16x16 (standard entities) to 32x48 (personality characters). Named characters always use the Personality archetype to ensure the meme hook — recognizing the person — lands immediately.

### Step 3: Implement

1. Create `src/core/PixelRenderer.js` — the `renderPixelArt()` and `renderSpriteSheet()` utility functions
2. Create `src/sprites/palette.js` — the shared color palette
3. Create sprite data files in `src/sprites/`:
   - `player.js` — player idle + walk frames
   - `enemies.js` — all enemy type sprites and frames
   - `items.js` — pickups, gems, hearts, etc.
   - `projectiles.js` — bullets, fireballs, bolts (if applicable)
4. Update each entity constructor:
   - Replace `fillCircle()` / `generateTexture()` with `renderPixelArt()` or `renderSpriteSheet()`
   - Add Phaser animations for entities with multiple frames
   - Adjust physics body dimensions if sprite size changed (`setCircle()` or `setSize()`)
5. For static items (gems, pickups), add a bob tween if not already present

### Step 4: Verify

- Run `npm run build` to confirm no errors
- Check that collision detection still works (physics bodies may need size adjustments)
- List all files created and modified
- Remind the user to run the game and check visuals
- Suggest running `/game-creator:qa-game` to update visual regression snapshots since all entities look different now

## Next Step

Tell the user:

> Your game entities now have pixel art sprites instead of geometric shapes! Each character, enemy, and item has a distinct visual identity.
>
> **Files created:**
> - `src/core/PixelRenderer.js` — rendering engine
> - `src/sprites/palette.js` — shared color palette
> - `src/sprites/player.js`, `enemies.js`, `items.js` — sprite data
>
> Run the game to see the new visuals. If you have Playwright tests, run `/game-creator:qa-game` to update the visual regression snapshots.

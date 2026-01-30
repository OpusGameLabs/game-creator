// =============================================================================
// Barn Defense - PathSystem
// Renders path visuals and manages path-related rendering.
// Paths data is defined in MapSystem; this draws them.
// Uses pixel art tiles and decorations.
// =============================================================================

import { GAME, TILE, COLORS } from '../core/Constants.js';

// Seeded random for deterministic tile/decoration placement
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class PathSystem {
  constructor(scene, mapSystem) {
    this.scene = scene;
    this.mapSystem = mapSystem;
  }

  /**
   * Render the entire map grid using pixel art tiles and decorations.
   * Called once when the level loads.
   */
  renderMap() {
    const grid = this.mapSystem.grid;
    if (!grid) return;

    const S = GAME.TILE_SIZE;
    const rng = mulberry32(42); // deterministic seed

    // Grass tile texture keys
    const grassKeys = ['tile-grass1', 'tile-grass2', 'tile-grass3'];
    const pathKeys = ['tile-path1', 'tile-path2'];
    const decoKeys = ['deco-hayStack', 'deco-fencePost', 'deco-flowerPatch', 'deco-rock'];

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const tile = grid[row][col];
        const x = col * S + S / 2;
        const y = row * S + S / 2;

        switch (tile) {
          case TILE.GRASS: {
            // Pick a random grass tile variant
            const grassIdx = Math.floor(rng() * grassKeys.length);
            const grassKey = grassKeys[grassIdx];
            if (this.scene.textures.exists(grassKey)) {
              this.scene.add.image(x, y, grassKey);
            } else {
              // Fallback
              const g = this.scene.add.graphics();
              const isLight = (row + col) % 2 === 0;
              g.fillStyle(isLight ? COLORS.GRASS_LIGHT : COLORS.GRASS_DARK, 1);
              g.fillRect(col * S, row * S, S, S);
            }

            // Scatter decorations on some grass tiles (low chance)
            if (rng() < 0.08) {
              const decoIdx = Math.floor(rng() * decoKeys.length);
              const decoKey = decoKeys[decoIdx];
              if (this.scene.textures.exists(decoKey)) {
                const deco = this.scene.add.image(x, y, decoKey);
                deco.setAlpha(0.5);
              }
            }
            break;
          }

          case TILE.PATH: {
            // Pick a random path tile variant
            const pathIdx = Math.floor(rng() * pathKeys.length);
            const pathKey = pathKeys[pathIdx];
            if (this.scene.textures.exists(pathKey)) {
              this.scene.add.image(x, y, pathKey);
            } else {
              const g = this.scene.add.graphics();
              g.fillStyle(COLORS.PATH_COLOR, 1);
              g.fillRect(col * S, row * S, S, S);
            }
            break;
          }

          case TILE.BARN:
            // Keep the barn drawn with Graphics for the complex shape
            this.drawBarn(col * S, row * S, S);
            break;

          case TILE.WATER: {
            const waterKey = 'tile-water';
            if (this.scene.textures.exists(waterKey)) {
              this.scene.add.image(x, y, waterKey);
            } else {
              const g = this.scene.add.graphics();
              g.fillStyle(COLORS.WATER_COLOR, 1);
              g.fillRect(col * S, row * S, S, S);
            }
            break;
          }

          case TILE.ENTRY: {
            const entryKey = 'tile-entry';
            if (this.scene.textures.exists(entryKey)) {
              this.scene.add.image(x, y, entryKey);
            } else {
              const g = this.scene.add.graphics();
              g.fillStyle(COLORS.ENTRY_COLOR, 1);
              g.fillRect(col * S, row * S, S, S);
            }
            break;
          }
        }
      }
    }

    // Draw path direction markers (small dots along paths)
    this.drawPathMarkers();
  }

  drawBarn(x, y, S) {
    const g = this.scene.add.graphics();

    // Barn body
    g.fillStyle(COLORS.BARN_COLOR, 1);
    g.fillRect(x + 2, y + S * 0.3, S - 4, S * 0.7 - 2);

    // Barn roof
    g.fillStyle(COLORS.BARN_ROOF, 1);
    g.fillTriangle(
      x, y + S * 0.3,
      x + S / 2, y + 2,
      x + S, y + S * 0.3
    );

    // Door
    g.fillStyle(0x663322, 1);
    g.fillRect(x + S / 2 - 5, y + S * 0.5, 10, S * 0.5 - 2);

    // X on door
    g.lineStyle(1, 0x442211, 1);
    g.lineBetween(x + S / 2 - 4, y + S * 0.52, x + S / 2 + 4, y + S - 4);
    g.lineBetween(x + S / 2 + 4, y + S * 0.52, x + S / 2 - 4, y + S - 4);
  }

  drawPathMarkers() {
    // Draw small dots along each path to show direction
    const paths = this.mapSystem.paths;
    if (!paths) return;

    const g = this.scene.add.graphics();
    g.fillStyle(0x887744, 0.3);
    for (const path of paths) {
      for (let i = 0; i < path.length; i += 3) {
        g.fillCircle(path[i].x, path[i].y, 2);
      }
    }
  }

  destroy() {
    // Graphics and images are part of the scene and auto-cleanup
  }
}

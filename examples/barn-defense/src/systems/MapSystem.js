// =============================================================================
// Barn Defense - MapSystem
// Defines all level layouts: grid data, path waypoints, and wave definitions.
// Each level is a 20x15 grid (800x600 at 40px tiles).
// =============================================================================

import { TILE, GAME, ENEMIES } from '../core/Constants.js';

const T = TILE;
const S = GAME.TILE_SIZE;

// Helper: convert grid coords to pixel center
function gp(col, row) {
  return { x: col * S + S / 2, y: row * S + S / 2 };
}

// ---------------------------------------------------------------------------
// Level 1: "The Front Yard" - Simple S-curve path
// ---------------------------------------------------------------------------
const level1Grid = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [4,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const level1Path = [
  gp(0,2), gp(1,2), gp(2,2), gp(3,2), gp(4,2), gp(5,2), gp(6,2), gp(7,2), gp(8,2), gp(9,2),
  gp(9,3), gp(9,4), gp(9,5),
  gp(10,5), gp(11,5), gp(12,5), gp(13,5), gp(14,5), gp(15,5), gp(16,5), gp(17,5),
  gp(17,6), gp(17,7), gp(17,8),
  gp(16,8), gp(15,8), gp(14,8), gp(13,8), gp(12,8), gp(11,8), gp(10,8), gp(9,8), gp(8,8), gp(7,8), gp(6,8), gp(5,8), gp(4,8), gp(3,8), gp(2,8),
  gp(2,9), gp(2,10), gp(2,11),
  gp(3,11), gp(4,11), gp(5,11), gp(6,11), gp(7,11), gp(8,11), gp(9,11), gp(10,11), gp(11,11), gp(12,11), gp(13,11), gp(14,11), gp(15,11),
];

const level1Waves = [
  // Wave 1: chickens only
  [{ type: ENEMIES.CHICKEN, count: 6, spawnDelay: 600 }],
  // Wave 2: more chickens
  [{ type: ENEMIES.CHICKEN, count: 10, spawnDelay: 500 }],
  // Wave 3: chickens + pigs
  [
    { type: ENEMIES.CHICKEN, count: 6, spawnDelay: 500 },
    { type: ENEMIES.PIG, count: 3, spawnDelay: 800 },
  ],
  // Wave 4: pigs + chickens
  [
    { type: ENEMIES.PIG, count: 5, spawnDelay: 700 },
    { type: ENEMIES.CHICKEN, count: 8, spawnDelay: 400 },
  ],
  // Wave 5: big mixed wave
  [
    { type: ENEMIES.CHICKEN, count: 10, spawnDelay: 400 },
    { type: ENEMIES.PIG, count: 6, spawnDelay: 600 },
  ],
];

// ---------------------------------------------------------------------------
// Level 2: "The Cornfield" - Narrow path through field
// ---------------------------------------------------------------------------
const level2Grid = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [4,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const level2Path = [
  gp(0,3), gp(1,3), gp(2,3), gp(3,3), gp(4,3),
  gp(4,4), gp(4,5),
  gp(5,5), gp(6,5), gp(7,5), gp(8,5), gp(9,5), gp(10,5),
  gp(10,6), gp(10,7),
  gp(11,7), gp(12,7), gp(13,7), gp(14,7),
  gp(14,8), gp(14,9),
  gp(15,9), gp(16,9), gp(17,9),
  gp(17,10), gp(17,11),
];

const level2Waves = [
  [{ type: ENEMIES.CHICKEN, count: 8, spawnDelay: 500 }],
  [{ type: ENEMIES.CHICKEN, count: 6, spawnDelay: 500 }, { type: ENEMIES.PIG, count: 3, spawnDelay: 800 }],
  [{ type: ENEMIES.PIG, count: 6, spawnDelay: 700 }],
  [{ type: ENEMIES.CHICKEN, count: 10, spawnDelay: 400 }, { type: ENEMIES.COW, count: 2, spawnDelay: 1200 }],
  [{ type: ENEMIES.PIG, count: 5, spawnDelay: 600 }, { type: ENEMIES.COW, count: 3, spawnDelay: 1000 }],
  [{ type: ENEMIES.CHICKEN, count: 12, spawnDelay: 350 }, { type: ENEMIES.PIG, count: 5, spawnDelay: 600 }],
  [{ type: ENEMIES.COW, count: 5, spawnDelay: 900 }, { type: ENEMIES.CHICKEN, count: 8, spawnDelay: 400 }],
];

// ---------------------------------------------------------------------------
// Level 3: "The Pasture" - Two paths that merge
// ---------------------------------------------------------------------------
const level3Grid = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [4,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,0],
  [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [4,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Two entry paths that merge at column 10
const level3PathA = [
  gp(0,1), gp(1,1), gp(2,1), gp(3,1), gp(4,1), gp(5,1), gp(6,1), gp(7,1),
  gp(7,2), gp(7,3), gp(7,4),
  gp(8,4), gp(9,4), gp(10,4),
  gp(10,5), gp(10,6), gp(10,7),
  gp(11,7), gp(12,7), gp(13,7), gp(14,7), gp(15,7), gp(16,7), gp(17,7),
];

const level3PathB = [
  gp(0,13), gp(1,13), gp(2,13), gp(3,13), gp(4,13), gp(5,13), gp(6,13), gp(7,13),
  gp(7,12), gp(7,11), gp(7,10),
  gp(8,10), gp(9,10), gp(10,10),
  gp(10,9), gp(10,8), gp(10,7),
  gp(11,7), gp(12,7), gp(13,7), gp(14,7), gp(15,7), gp(16,7), gp(17,7),
];

const level3Waves = [
  [{ type: ENEMIES.CHICKEN, count: 8, spawnDelay: 500 }],
  [{ type: ENEMIES.PIG, count: 4, spawnDelay: 700 }, { type: ENEMIES.CHICKEN, count: 6, spawnDelay: 500 }],
  [{ type: ENEMIES.COW, count: 3, spawnDelay: 1000 }],
  [{ type: ENEMIES.GOAT, count: 4, spawnDelay: 700 }, { type: ENEMIES.CHICKEN, count: 8, spawnDelay: 400 }],
  [{ type: ENEMIES.PIG, count: 6, spawnDelay: 600 }, { type: ENEMIES.GOAT, count: 3, spawnDelay: 700 }],
  [{ type: ENEMIES.COW, count: 4, spawnDelay: 900 }, { type: ENEMIES.CHICKEN, count: 10, spawnDelay: 350 }],
  [{ type: ENEMIES.GOAT, count: 6, spawnDelay: 600 }, { type: ENEMIES.PIG, count: 6, spawnDelay: 600 }],
  [{ type: ENEMIES.COW, count: 5, spawnDelay: 800 }, { type: ENEMIES.GOAT, count: 4, spawnDelay: 700 }, { type: ENEMIES.CHICKEN, count: 12, spawnDelay: 300 }],
];

// ---------------------------------------------------------------------------
// Level 4: "The Farm Road" - Long winding path
// ---------------------------------------------------------------------------
const level4Grid = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const level4Path = [
  gp(1,1), gp(2,1), gp(3,1), gp(4,1), gp(5,1), gp(6,1), gp(7,1), gp(8,1), gp(9,1), gp(10,1), gp(11,1), gp(12,1), gp(13,1), gp(14,1), gp(15,1), gp(16,1), gp(17,1),
  gp(17,2), gp(17,3),
  gp(16,3), gp(15,3), gp(14,3), gp(13,3), gp(12,3), gp(11,3), gp(10,3), gp(9,3), gp(8,3), gp(7,3), gp(6,3), gp(5,3), gp(4,3), gp(3,3), gp(2,3),
  gp(2,4), gp(2,5),
  gp(3,5), gp(4,5), gp(5,5), gp(6,5), gp(7,5), gp(8,5), gp(9,5), gp(10,5), gp(11,5), gp(12,5), gp(13,5), gp(14,5), gp(15,5), gp(16,5), gp(17,5),
  gp(17,6), gp(17,7),
  gp(16,7), gp(15,7), gp(14,7), gp(13,7), gp(12,7), gp(11,7), gp(10,7), gp(9,7), gp(8,7), gp(7,7), gp(6,7), gp(5,7), gp(4,7), gp(3,7), gp(2,7),
  gp(2,8), gp(2,9),
  gp(3,9), gp(4,9), gp(5,9), gp(6,9), gp(7,9), gp(8,9), gp(9,9), gp(10,9), gp(11,9), gp(12,9), gp(13,9), gp(14,9), gp(15,9), gp(16,9), gp(17,9),
  gp(17,10), gp(17,11), gp(17,12),
];

const level4Waves = [
  [{ type: ENEMIES.CHICKEN, count: 10, spawnDelay: 400 }],
  [{ type: ENEMIES.PIG, count: 6, spawnDelay: 600 }, { type: ENEMIES.CHICKEN, count: 8, spawnDelay: 400 }],
  [{ type: ENEMIES.COW, count: 4, spawnDelay: 900 }, { type: ENEMIES.GOAT, count: 3, spawnDelay: 700 }],
  [{ type: ENEMIES.CHICKEN, count: 15, spawnDelay: 300 }],
  [{ type: ENEMIES.PIG, count: 8, spawnDelay: 500 }, { type: ENEMIES.COW, count: 3, spawnDelay: 900 }],
  [{ type: ENEMIES.GOAT, count: 6, spawnDelay: 600 }, { type: ENEMIES.CHICKEN, count: 10, spawnDelay: 350 }],
  [{ type: ENEMIES.COW, count: 6, spawnDelay: 800 }, { type: ENEMIES.PIG, count: 6, spawnDelay: 600 }],
  [{ type: ENEMIES.CHICKEN, count: 20, spawnDelay: 250 }, { type: ENEMIES.GOAT, count: 5, spawnDelay: 600 }],
  [{ type: ENEMIES.COW, count: 5, spawnDelay: 800 }, { type: ENEMIES.PIG, count: 8, spawnDelay: 500 }, { type: ENEMIES.GOAT, count: 4, spawnDelay: 700 }],
  [{ type: ENEMIES.COW, count: 8, spawnDelay: 700 }, { type: ENEMIES.CHICKEN, count: 15, spawnDelay: 300 }, { type: ENEMIES.GOAT, count: 6, spawnDelay: 600 }],
];

// ---------------------------------------------------------------------------
// Level 5: "The Siege" - Three paths converging on barn
// ---------------------------------------------------------------------------
const level5Grid = [
  [0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
  [4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4],
  [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const level5PathA = [
  gp(9,0), gp(9,1), gp(9,2), gp(9,3), gp(9,4), gp(9,5), gp(9,6), gp(9,7), gp(9,8), gp(9,9),
];

const level5PathB = [
  gp(0,6), gp(1,6), gp(2,6), gp(3,6), gp(4,6), gp(5,6), gp(6,6), gp(7,6), gp(8,6), gp(9,6), gp(9,7), gp(9,8), gp(9,9),
];

const level5PathC = [
  gp(19,6), gp(18,6), gp(17,6), gp(16,6), gp(15,6), gp(14,6), gp(13,6), gp(12,6), gp(11,6), gp(10,6), gp(9,6), gp(9,7), gp(9,8), gp(9,9),
];

const level5Waves = [
  [{ type: ENEMIES.CHICKEN, count: 10, spawnDelay: 400 }],
  [{ type: ENEMIES.PIG, count: 6, spawnDelay: 600 }, { type: ENEMIES.CHICKEN, count: 8, spawnDelay: 400 }],
  [{ type: ENEMIES.COW, count: 4, spawnDelay: 900 }, { type: ENEMIES.GOAT, count: 4, spawnDelay: 700 }],
  [{ type: ENEMIES.CHICKEN, count: 15, spawnDelay: 300 }, { type: ENEMIES.PIG, count: 5, spawnDelay: 600 }],
  [{ type: ENEMIES.GOAT, count: 8, spawnDelay: 500 }, { type: ENEMIES.COW, count: 4, spawnDelay: 800 }],
  [{ type: ENEMIES.PIG, count: 10, spawnDelay: 450 }, { type: ENEMIES.CHICKEN, count: 12, spawnDelay: 350 }],
  [{ type: ENEMIES.COW, count: 6, spawnDelay: 700 }, { type: ENEMIES.GOAT, count: 6, spawnDelay: 600 }],
  [{ type: ENEMIES.CHICKEN, count: 20, spawnDelay: 250 }, { type: ENEMIES.PIG, count: 8, spawnDelay: 450 }],
  [{ type: ENEMIES.COW, count: 8, spawnDelay: 600 }, { type: ENEMIES.GOAT, count: 6, spawnDelay: 500 }, { type: ENEMIES.CHICKEN, count: 15, spawnDelay: 300 }],
  [{ type: ENEMIES.COW, count: 6, spawnDelay: 600 }, { type: ENEMIES.PIG, count: 10, spawnDelay: 400 }, { type: ENEMIES.GOAT, count: 8, spawnDelay: 500 }],
  [{ type: ENEMIES.COW, count: 10, spawnDelay: 500 }, { type: ENEMIES.CHICKEN, count: 20, spawnDelay: 200 }, { type: ENEMIES.GOAT, count: 8, spawnDelay: 400 }],
  // Boss wave
  [{ type: ENEMIES.BULL, count: 2, spawnDelay: 2000 }, { type: ENEMIES.COW, count: 6, spawnDelay: 700 }, { type: ENEMIES.GOAT, count: 6, spawnDelay: 600 }],
];

// ---------------------------------------------------------------------------
// Level definitions array
// ---------------------------------------------------------------------------
export const LEVELS = [
  {
    name: 'The Front Yard',
    grid: level1Grid,
    paths: [level1Path],
    waves: level1Waves,
  },
  {
    name: 'The Cornfield',
    grid: level2Grid,
    paths: [level2Path],
    waves: level2Waves,
  },
  {
    name: 'The Pasture',
    grid: level3Grid,
    paths: [level3PathA, level3PathB],
    waves: level3Waves,
  },
  {
    name: 'The Farm Road',
    grid: level4Grid,
    paths: [level4Path],
    waves: level4Waves,
  },
  {
    name: 'The Siege',
    grid: level5Grid,
    paths: [level5PathA, level5PathB, level5PathC],
    waves: level5Waves,
  },
];

// ---------------------------------------------------------------------------
// MapSystem class
// ---------------------------------------------------------------------------
export class MapSystem {
  constructor() {
    this.currentLevel = null;
    this.grid = null;
    this.paths = null;
    this.waves = null;
  }

  loadLevel(levelIndex) {
    const level = LEVELS[levelIndex];
    if (!level) return null;
    this.currentLevel = level;
    this.grid = level.grid;
    this.paths = level.paths;
    this.waves = level.waves;
    return level;
  }

  getTile(col, row) {
    if (!this.grid) return -1;
    if (row < 0 || row >= this.grid.length) return -1;
    if (col < 0 || col >= this.grid[0].length) return -1;
    return this.grid[row][col];
  }

  canPlaceTower(col, row) {
    const tile = this.getTile(col, row);
    return tile === TILE.GRASS;
  }

  pixelToGrid(x, y) {
    return {
      col: Math.floor(x / GAME.TILE_SIZE),
      row: Math.floor(y / GAME.TILE_SIZE),
    };
  }

  gridToPixel(col, row) {
    return {
      x: col * GAME.TILE_SIZE + GAME.TILE_SIZE / 2,
      y: row * GAME.TILE_SIZE + GAME.TILE_SIZE / 2,
    };
  }

  getRandomPath() {
    if (!this.paths || this.paths.length === 0) return [];
    const idx = Math.floor(Math.random() * this.paths.length);
    return this.paths[idx];
  }

  getLevelCount() {
    return LEVELS.length;
  }

  getLevelName(index) {
    return LEVELS[index] ? LEVELS[index].name : 'Unknown';
  }
}

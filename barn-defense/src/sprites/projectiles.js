// =============================================================================
// Barn Defense - Projectile Sprites
// Pixel art for all 5 projectile types (8x8 grid).
// =============================================================================

import { FARM_PALETTE } from './palette.js';

// ---- HAY BALE (8x8) ----
// Golden square shape, darker cross pattern

const HAY_BALE = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 4, 4, 3, 4, 1, 0],
  [1, 4, 4, 3, 3, 4, 4, 1],
  [1, 4, 3, 3, 3, 3, 4, 1],
  [1, 4, 3, 3, 3, 3, 4, 1],
  [1, 4, 4, 3, 3, 4, 4, 1],
  [0, 1, 4, 4, 3, 4, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];

// ---- PITCHFORK PROJECTILE (8x8) ----
// Gray fork shape, 3 prongs pointing right

const PITCHFORK_PROJ = [
  [0, 0, 0, 0, 0, 0,10,10],
  [0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0,10,10],
  [17,17,17,17,10,10,10, 1],
  [17, 2, 2,17,10,10,10, 1],
  [0, 0, 0, 0, 0, 0,10,10],
  [0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0,10,10],
];

// ---- CORN COB (8x8) ----
// Yellow elongated oval, green tip

const CORN_COB = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 0, 0],
  [0,14,14, 1, 5, 5, 1, 0],
  [14,14, 1, 5, 6, 5, 5, 1],
  [14,14, 1, 5, 5, 6, 5, 1],
  [0,14,14, 1, 5, 5, 1, 0],
  [0, 0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

// ---- WATER DROP (8x8) ----
// Blue teardrop shape, white highlight

const WATER_DROP = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 1,15, 1, 0, 0, 0],
  [0, 1, 8,15,15, 1, 0, 0],
  [0, 1,15,15,15,15, 1, 0],
  [0, 1,15,15,15,15, 1, 0],
  [0, 0, 1,15,15, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
];

// ---- TRACTOR BOLT (8x8) ----
// Green small bolt/gear shape

const TRACTOR_BOLT = [
  [0, 0, 0,13, 0, 0, 0, 0],
  [0, 0,13,13,13, 0, 0, 0],
  [0,13, 1,13, 1,13, 0, 0],
  [13,13,13, 1,13,13,13, 0],
  [0,13,13, 1,13,13, 0, 0],
  [0,13, 1,13, 1,13, 0, 0],
  [0, 0,13,13,13, 0, 0, 0],
  [0, 0, 0,13, 0, 0, 0, 0],
];

// ---- Export all projectile sprites ----

export const PROJECTILE_SPRITES = {
  scarecrow: { pixels: HAY_BALE, palette: FARM_PALETTE, scale: 2 },
  pitchfork: { pixels: PITCHFORK_PROJ, palette: FARM_PALETTE, scale: 2 },
  corn_cannon: { pixels: CORN_COB, palette: FARM_PALETTE, scale: 2 },
  sprinkler: { pixels: WATER_DROP, palette: FARM_PALETTE, scale: 2 },
  tractor: { pixels: TRACTOR_BOLT, palette: FARM_PALETTE, scale: 2 },
};

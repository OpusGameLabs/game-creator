// =============================================================================
// Constants.js -- All magic numbers for the Labyrinth game
// =============================================================================

export const GAME = {
  FOV: 50,
  NEAR: 0.1,
  FAR: 500,
  MAX_DELTA: 0.05,
};

// ---------------------------------------------------------------------------
// Maze geometry
// ---------------------------------------------------------------------------
export const MAZE = {
  CELL_SIZE: 2.0,
  WALL_HEIGHT: 1.6,
  WALL_THICKNESS: 0.2,
  WALL_COLOR: 0x7a7a7a,
  FLOOR_COLOR: 0x3a3a3a,
  FLOOR_BORDER_COLOR: 0x2a2a2a,
};

// ---------------------------------------------------------------------------
// Ball (player marble)
// ---------------------------------------------------------------------------
export const BALL = {
  RADIUS: 0.35,
  SPEED: 6.0,
  FRICTION: 0.88,
  MAX_VELOCITY: 8.0,
  COLOR: 0x4488cc,
  METALNESS: 0.7,
  ROUGHNESS: 0.2,
  START_ROW: 0,
  START_COL: 0,
};

// ---------------------------------------------------------------------------
// Holes
// ---------------------------------------------------------------------------
export const HOLES = {
  RADIUS: 0.55,
  COLOR: 0x111111,
  DEPTH: 0.15,
  BASE_COUNT: 2,
  PER_LEVEL: 1,
};

// ---------------------------------------------------------------------------
// Gems
// ---------------------------------------------------------------------------
export const GEMS = {
  RADIUS: 0.2,
  COLOR: 0x44ff88,
  EMISSIVE: 0x22aa44,
  ROTATION_SPEED: 2.0,
  BOB_HEIGHT: 0.15,
  BOB_SPEED: 3.0,
  FLOAT_Y: 0.6,
  POINTS: 10,
  BASE_COUNT: 3,
  PER_LEVEL: 2,
};

// ---------------------------------------------------------------------------
// Exit portal
// ---------------------------------------------------------------------------
export const EXIT = {
  SIZE: 0.8,
  COLOR: 0xffcc00,
  EMISSIVE: 0xffaa00,
  GLOW_COLOR: 0xffee66,
  ROTATION_SPEED: 1.5,
  BOB_HEIGHT: 0.1,
  BOB_SPEED: 2.0,
  FLOAT_Y: 0.5,
};

// ---------------------------------------------------------------------------
// Level configurations
// ---------------------------------------------------------------------------
export const LEVELS = [
  { mazeWidth: 5,  mazeHeight: 5,  holes: 2,  gems: 4  },
  { mazeWidth: 7,  mazeHeight: 7,  holes: 3,  gems: 6  },
  { mazeWidth: 9,  mazeHeight: 9,  holes: 5,  gems: 8  },
  { mazeWidth: 11, mazeHeight: 11, holes: 7,  gems: 10 },
  { mazeWidth: 13, mazeHeight: 13, holes: 9,  gems: 12 },
  { mazeWidth: 15, mazeHeight: 15, holes: 12, gems: 15 },
];

// ---------------------------------------------------------------------------
// Camera (top-down angled, like a marble labyrinth toy)
// ---------------------------------------------------------------------------
export const CAMERA = {
  OFFSET_X: 0,
  OFFSET_Y: 14,
  OFFSET_Z: 8,
  LOOK_OFFSET_Y: 0,
  LERP_SPEED: 4.0,
};

// ---------------------------------------------------------------------------
// Colors / lighting / fog
// ---------------------------------------------------------------------------
export const COLORS = {
  SKY: 0x1a1a2e,
  AMBIENT_LIGHT: 0x9999bb,
  AMBIENT_INTENSITY: 0.5,
  DIR_LIGHT: 0xffeedd,
  DIR_INTENSITY: 0.9,
  DIR_POSITION_X: 5,
  DIR_POSITION_Y: 12,
  DIR_POSITION_Z: 7,
  FOG_COLOR: 0x1a1a2e,
  FOG_NEAR: 25,
  FOG_FAR: 80,
  POINT_LIGHT: 0xffcc88,
  POINT_INTENSITY: 0.4,
};

// ---------------------------------------------------------------------------
// Lives
// ---------------------------------------------------------------------------
export const LIVES = {
  STARTING: 3,
};

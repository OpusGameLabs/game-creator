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
  WALL_COLOR: 0x556677,
  WALL_TOP_COLOR: 0x778899,
  FLOOR_COLOR: 0x3a1a1a,
  FLOOR_ACCENT: 0x4e2a2a,
  FLOOR_BORDER_COLOR: 0x2a2a2a,
};

// ---------------------------------------------------------------------------
// Ball (player marble)
// ---------------------------------------------------------------------------
export const BALL = {
  RADIUS: 0.35,
  SPEED: 22.0,
  FRICTION: 0.94,
  MAX_VELOCITY: 24.0,
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
  SKY: 0x87ceeb,
  AMBIENT_LIGHT: 0xccccee,
  AMBIENT_INTENSITY: 0.7,
  DIR_LIGHT: 0xfff8ee,
  DIR_INTENSITY: 1.1,
  DIR_POSITION_X: 5,
  DIR_POSITION_Y: 12,
  DIR_POSITION_Z: 7,
  FOG_COLOR: 0x87ceeb,
  FOG_NEAR: 30,
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

// ---------------------------------------------------------------------------
// Gyroscope input
// ---------------------------------------------------------------------------
export const GYRO = {
  DEADZONE: 2,          // degrees of tilt ignored
  MAX_TILT: 30,         // degrees for full -1..1 range
  SMOOTHING: 0.25,      // EMA factor (0 = no change, 1 = instant)
};

// ---------------------------------------------------------------------------
// Virtual joystick (touch fallback)
// ---------------------------------------------------------------------------
export const VIRTUAL_JOYSTICK = {
  BASE_SIZE: 120,       // px diameter of outer circle
  KNOB_SIZE: 50,        // px diameter of inner circle
  MAX_DISTANCE: 50,     // px max drag from center
  MARGIN_BOTTOM: 40,    // px from bottom of screen
  MARGIN_LEFT: 40,      // px from left of screen
};

// ---------------------------------------------------------------------------
// Input system
// ---------------------------------------------------------------------------
export const INPUT = {
  GYRO_WAIT_MS: 500,    // ms to wait for first deviceorientation event
};

// ---------------------------------------------------------------------------
// Visual effects -- particles, trails, screen flashes
// ---------------------------------------------------------------------------
export const VFX = {
  // Gem collection particles
  GEM_PARTICLE_COUNT: 18,
  GEM_PARTICLE_SPEED: 3.5,
  GEM_PARTICLE_LIFE: 0.7,
  GEM_PARTICLE_SIZE: 0.08,
  GEM_PARTICLE_COLOR: 0x44ff88,
  GEM_PARTICLE_EMISSIVE: 0x22ff66,

  // Ball trail
  BALL_TRAIL_LENGTH: 12,
  BALL_TRAIL_SIZE: 0.06,
  BALL_TRAIL_OPACITY: 0.4,
  BALL_TRAIL_COLOR: 0x66aaff,
  BALL_TRAIL_SPEED_THRESHOLD: 1.5,

  // Gem point lights
  GEM_LIGHT_COLOR: 0x44ff88,
  GEM_LIGHT_INTENSITY: 0.6,
  GEM_LIGHT_DISTANCE: 4,

  // Exit portal pulsing
  EXIT_PULSE_SPEED: 2.5,
  EXIT_PULSE_MIN: 0.6,
  EXIT_PULSE_MAX: 1.2,
  EXIT_LIGHT_INTENSITY: 1.5,
  EXIT_LIGHT_DISTANCE: 8,

  // Screen flash on gem collect
  FLASH_GEM_COLOR: 'rgba(68, 255, 136, 0.15)',
  FLASH_GEM_DURATION: 300,

  // Screen tint on hole fall
  FLASH_FALL_COLOR: 'rgba(255, 40, 40, 0.25)',
  FLASH_FALL_DURATION: 500,

  // Level transition fade
  FADE_DURATION: 600,
  FADE_COLOR: 'rgba(10, 10, 30, 1)',

  // Hole ambient light (subtle red underglow)
  HOLE_LIGHT_COLOR: 0xff2222,
  HOLE_LIGHT_INTENSITY: 0.3,
  HOLE_LIGHT_DISTANCE: 3,

  // Ball point light (subtle glow underneath)
  BALL_LIGHT_COLOR: 0x6699ff,
  BALL_LIGHT_INTENSITY: 0.4,
  BALL_LIGHT_DISTANCE: 4,
};

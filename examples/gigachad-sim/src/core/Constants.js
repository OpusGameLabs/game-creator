// =============================================================================
// Constants.js — All configuration, balance numbers, and magic values
// Zero hardcoded values in game logic. Everything tunable goes here.
// =============================================================================

export const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1);

// Play.fun SDK widget renders a 75px fixed bar at top:0, z-index:9999.
// All HTML overlays must account for this with padding-top or safe offset.
export const SAFE_ZONE = {
  TOP_PX: 75,
  TOP_PERCENT: 8,
};

export const GAME = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 200,
  MAX_DELTA: 0.05,
  MAX_DPR: 2,
  LIVES: 3,
};

// Arena dimensions
export const ARENA = {
  WIDTH: 20,           // total width (-10 to +10 on X axis)
  HALF_WIDTH: 10,      // player boundary
  DEPTH: 12,           // depth of the gym floor
  FLOOR_Y: 0,
};

// Player (GigaChad) configuration
export const PLAYER = {
  WIDTH: 2.0,          // broad shoulders
  HEIGHT: 3.0,         // imposing stature
  DEPTH: 1.2,
  SPEED: 12,           // units per second lateral movement
  START_X: 0,
  START_Y: 0,
  START_Z: 0,
  CATCH_RADIUS: 1.8,   // how close a weight needs to be to auto-catch
  FLEX_DURATION: 0.6,  // seconds the flex animation lasts
  FLEX_BONUS: 2,       // bonus points if flex timed during catch
  ENTRANCE_DURATION: 1.2, // seconds for entrance animation
  ENTRANCE_START_Z: -15,  // starts off-screen behind
  ENTRANCE_BOUNCE_HEIGHT: 1.5,
  // Body colors
  SKIN_COLOR: 0xd4a574,
  HAIR_COLOR: 0x2a1a0a,
  SHORTS_COLOR: 0x1a1a2e,
  SHOE_COLOR: 0x333333,
};

// Falling weights configuration
export const WEIGHTS = {
  SPAWN_HEIGHT: 15,       // Y position where weights appear
  FLOOR_Y: 0.5,          // Y position where they "hit the floor"
  FALL_SPEED_BASE: 4,    // base fall speed (units/sec)
  FALL_SPEED_MAX: 10,    // max fall speed at highest difficulty
  SPAWN_INTERVAL_BASE: 2.0,  // seconds between spawns at start
  SPAWN_INTERVAL_MIN: 0.6,   // minimum spawn interval at max difficulty
  CATCH_Y_THRESHOLD: 2.5,    // Y position where auto-catch triggers if close enough
  // Weight types: { name, scale, points, color }
  TYPES: [
    { name: 'dumbbell', scale: 0.8, points: 1, color: 0x4488ff },
    { name: 'barbell', scale: 1.2, points: 3, color: 0xff4444 },
    { name: 'kettlebell', scale: 1.0, points: 5, color: 0xffd700 },
  ],
  MAX_ACTIVE: 8,          // max weights on screen at once
  LIFT_ANIMATION_DURATION: 0.4,  // seconds to show lift animation
};

// Protein shake powerup
export const POWERUP = {
  SPAWN_CHANCE: 0.15,    // 15% chance each spawn cycle
  SPAWN_INTERVAL: 8,     // minimum seconds between powerup spawns
  FALL_SPEED: 3,
  RADIUS: 0.6,
  COLOR: 0x44ff44,
  GLOW_COLOR: 0x88ff88,
  MULTIPLIER: 2,
  DURATION: 8,           // seconds multiplier lasts
};

// Difficulty ramp
export const DIFFICULTY = {
  RAMP_INTERVAL: 10,     // seconds between difficulty increases
  SPEED_INCREMENT: 0.4,  // added to fall speed each ramp
  INTERVAL_DECREMENT: 0.12, // subtracted from spawn interval each ramp
  MAX_LEVEL: 15,
};

// Colors used across the game
export const COLORS = {
  SKY: 0x2a2a3e,
  FLOOR: 0x333340,
  FLOOR_LINES: 0x444455,
  WALL_BACK: 0x3a3a4e,
  WALL_SIDE: 0x353548,
  AMBIENT_LIGHT: 0xffffff,
  AMBIENT_INTENSITY: 0.5,
  DIR_LIGHT: 0xffffff,
  DIR_INTENSITY: 0.9,
  SPOT_LIGHT: 0xffffcc,
  SPOT_INTENSITY: 1.5,
  // UI colors
  LIFE_FULL: 0xff4444,
  LIFE_EMPTY: 0x444444,
  COMBO_COLOR: '#ffdd44',
  MULTIPLIER_COLOR: '#44ff44',
};

// Camera (third-person, behind and above)
export const CAMERA = {
  HEIGHT: 6,
  DISTANCE: 10,
  LOOK_AT_Y: 2,
  FOV: 60,
};

// 3D Models (all Meshy-generated GLBs)
export const MODELS = {
  GIGACHAD: {
    path: '/assets/models/gigachad.glb',
    walkPath: '/assets/models/gigachad-walk.glb',
    runPath: '/assets/models/gigachad-run.glb',
    scale: 1.0,           // model native 2u → 3u tall at PLAYER.HEIGHT
    rotationY: Math.PI,   // Meshy models face +Z, flip to face camera
  },
  WEIGHTS: {
    dumbbell: { path: '/assets/models/dumbbell.glb', scale: 0.8 },
    barbell: { path: '/assets/models/barbell.glb', scale: 0.5 },
    kettlebell: { path: '/assets/models/kettlebell.glb', scale: 0.7 },
  },
  POWERUP: {
    path: '/assets/models/protein-shake.glb',
    scale: 0.8,
  },
};

// Touch input configuration
export const TOUCH = {
  JOYSTICK_SIZE: 120,     // px
  JOYSTICK_MARGIN: 20,    // px from edge
  FLEX_BUTTON_SIZE: 80,   // px
  FLEX_BUTTON_MARGIN: 30, // px from right edge
  DEAD_ZONE: 0.15,
};

// Spectacle / juice events
export const SPECTACLE = {
  COMBO_THRESHOLDS: [5, 10, 25, 50, 100],
  SCREEN_SHAKE_INTENSITY: 0.15,
  SCREEN_SHAKE_DURATION: 0.2,
  CATCH_SCALE_POP: 1.3,   // scale player up briefly on catch
  CATCH_POP_DURATION: 0.2,
};

// Visual effects configuration
export const EFFECTS = {
  // Particle pool
  PARTICLE_POOL_SIZE: 200,

  // Burst counts per event
  CATCH_PARTICLES: 15,
  MISS_PARTICLES: 10,
  POWERUP_PARTICLES: 20,
  STREAK_PARTICLES: 40,
  ENTRANCE_PARTICLES: 20,
  COMBO_BASE_PARTICLES: 10,
  COMBO_PARTICLE_GROWTH: 3,     // extra particles per combo level

  // Particle physics
  PARTICLE_SIZE: 0.15,
  PARTICLE_SPEED_MIN: 2,
  PARTICLE_SPEED_MAX: 6,
  PARTICLE_LIFETIME: 0.8,
  PARTICLE_GRAVITY: -8,

  // Ambient particles (gym chalk / dust motes)
  AMBIENT_PARTICLE_COUNT: 30,
  AMBIENT_DRIFT_SPEED: 0.3,
  AMBIENT_SIZE: 0.06,
  AMBIENT_OPACITY: 0.25,

  // Floating score text
  FLOAT_TEXT_DURATION: 1.0,
  FLOAT_TEXT_RISE: 2.0,         // world units to rise
  FLOAT_TEXT_BASE_SIZE: 28,     // px
  FLOAT_TEXT_COMBO_GROWTH: 4,   // px per combo level
  FLOAT_TEXT_MAX_SIZE: 56,      // px

  // Flash overlay
  FLASH_DURATION: 0.3,
  FLASH_WHITE_ALPHA: 0.6,
  FLASH_RED_ALPHA: 0.4,
  FLASH_GREEN_ALPHA: 0.35,

  // Hit freeze (brief pause for impact)
  FREEZE_DURATION: 0.06,

  // Camera FOV pulse
  FOV_PULSE_AMOUNT: 5,         // degrees to decrease
  FOV_PULSE_IN: 0.1,           // seconds to zoom in
  FOV_PULSE_OUT: 0.2,          // seconds to zoom out

  // Light pulse
  LIGHT_PULSE_AMOUNT: 0.3,
  LIGHT_PULSE_DURATION: 0.2,

  // Shockwave ring (expanding ring on floor)
  SHOCKWAVE_RADIUS_START: 0.5,
  SHOCKWAVE_RADIUS_END: 3.0,
  SHOCKWAVE_DURATION: 0.5,
  SHOCKWAVE_COLOR: 0xff4444,
  SHOCKWAVE_STREAK_COLOR: 0xffdd44,

  // Weight type colors for particles
  WEIGHT_COLORS: {
    dumbbell: 0x4488ff,
    barbell: 0xff4444,
    kettlebell: 0xffd700,
  },
  POWERUP_COLOR: 0x44ff44,
  MISS_COLOR: 0xff2222,
  ENTRANCE_COLOR: 0xffffff,
};

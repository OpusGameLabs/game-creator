// =============================================================================
// Constants.js — All configuration for Rock 'Em Sock 'Em Robots
// Zero hardcoded values in game logic.
// =============================================================================

export const GAME = {
  FOV: 50,
  NEAR: 0.1,
  FAR: 100,
  MAX_DELTA: 0.05,
  MAX_DPR: 2,
};

export const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1);

// Play.fun SDK widget renders a 75px fixed bar at top:0, z-index:9999.
export const SAFE_ZONE = {
  TOP_PX: 75,
  TOP_PERCENT: 8,
};

// --- Camera (fixed behind player robot, looking at opponent) ---
export const CAMERA = {
  POSITION_X: 0,
  POSITION_Y: 3.5,
  POSITION_Z: 4.5,
  LOOK_AT_X: 0,
  LOOK_AT_Y: 1.8,
  LOOK_AT_Z: -1.0,
};

// --- Boxing Ring ---
export const RING = {
  PLATFORM_WIDTH: 6,
  PLATFORM_DEPTH: 6,
  PLATFORM_HEIGHT: 0.3,
  PLATFORM_COLOR: 0x8b7355,
  CANVAS_COLOR: 0xddddcc,
  CANVAS_HEIGHT: 0.05,
  ROPE_HEIGHT_1: 1.0,
  ROPE_HEIGHT_2: 1.6,
  ROPE_HEIGHT_3: 2.2,
  ROPE_COLOR: 0xffffff,
  ROPE_RADIUS: 0.02,
  POST_HEIGHT: 2.4,
  POST_RADIUS: 0.06,
  POST_COLOR: 0xcccccc,
  FLOOR_SIZE: 20,
  FLOOR_COLOR: 0x333333,
};

// --- Robot dimensions (built from primitives) ---
export const ROBOT = {
  // Body (box)
  BODY_WIDTH: 0.9,
  BODY_HEIGHT: 1.0,
  BODY_DEPTH: 0.6,
  BODY_Y: 1.3,

  // Head (box, slightly rounded look)
  HEAD_SIZE: 0.45,
  HEAD_Y: 2.15,
  HEAD_POP_DISTANCE: 0.6,   // How far head pops up when knocked out
  HEAD_POP_SPEED: 4.0,       // Animation speed for head pop

  // Arms (cylinders)
  ARM_RADIUS: 0.12,
  ARM_LENGTH: 0.5,
  ARM_Y: 1.5,
  ARM_OFFSET_X: 0.6,        // Distance from center

  // Gloves (spheres)
  GLOVE_RADIUS: 0.18,
  GLOVE_Y: 1.5,
  GLOVE_REST_X: 0.6,        // X offset at rest
  GLOVE_REST_Z: 0.3,        // Z offset at rest (forward)

  // Legs (cylinders)
  LEG_RADIUS: 0.13,
  LEG_LENGTH: 0.6,
  LEG_Y: 0.5,
  LEG_OFFSET_X: 0.25,

  // Eyes (small spheres)
  EYE_RADIUS: 0.06,
  EYE_Y: 2.2,
  EYE_OFFSET_X: 0.12,
  EYE_Z: 0.23,
  EYE_COLOR: 0xffffff,
  PUPIL_COLOR: 0x111111,
};

// --- Player (Blue Bomber) ---
export const PLAYER = {
  COLOR_BODY: 0x2266cc,
  COLOR_DARK: 0x1a4f99,
  COLOR_GLOVE: 0x3388ee,
  COLOR_ACCENT: 0x55aaff,
  POSITION_Z: 2.0,          // Player stands at +Z (closer to camera)
};

// --- AI Opponent (Red Rocker) ---
export const OPPONENT = {
  COLOR_BODY: 0xcc2222,
  COLOR_DARK: 0x991a1a,
  COLOR_GLOVE: 0xee3333,
  COLOR_ACCENT: 0xff5555,
  POSITION_Z: -2.0,         // Opponent stands at -Z (far side)
};

// --- Combat ---
export const COMBAT = {
  // Head health
  MAX_HEAD_HEALTH: 100,

  // Punch damage
  PUNCH_DAMAGE: 12,
  BLOCKED_DAMAGE: 3,         // Damage when opponent is blocking

  // Punch timing
  PUNCH_DURATION: 0.25,      // Seconds for punch animation
  PUNCH_COOLDOWN: 0.4,       // Seconds before next punch
  PUNCH_REACH: 0.7,          // How far fist extends forward

  // Block
  BLOCK_DAMAGE_REDUCTION: 0.75,  // 75% reduction

  // Hit detection
  HIT_RANGE: 2.0,            // Max Z-distance for a punch to connect

  // Combo
  COMBO_WINDOW: 1.5,         // Seconds to chain hits for combo

  // Round
  ROUND_RESET_DELAY: 2.0,    // Seconds before next round starts
  HEAD_RESET_SPEED: 2.0,     // Speed head returns to normal position
};

// --- AI behavior ---
export const AI = {
  // Timing patterns (seconds)
  MIN_PUNCH_INTERVAL: 0.8,
  MAX_PUNCH_INTERVAL: 2.0,
  BLOCK_CHANCE: 0.3,          // Chance to block after being hit
  BLOCK_DURATION_MIN: 0.5,
  BLOCK_DURATION_MAX: 1.5,
  REACTION_TIME: 0.3,         // Minimum reaction delay
  AGGRESSION: 0.5,            // 0-1, higher = more punching
};

// --- Lighting ---
export const COLORS = {
  SKY: 0x1a1a2e,
  AMBIENT_LIGHT: 0xffffff,
  AMBIENT_INTENSITY: 0.5,
  DIR_LIGHT: 0xffffff,
  DIR_INTENSITY: 0.9,
  SPOT_LIGHT: 0xffffee,
  SPOT_INTENSITY: 1.5,
  HEALTH_BAR_BG: 0x333333,
  HEALTH_BAR_PLAYER: 0x22cc66,
  HEALTH_BAR_OPPONENT: 0xcc6622,
  HEALTH_BAR_LOW: 0xff3333,
};

// --- Health bar (3D, floating above robots) ---
export const HEALTH_BAR = {
  WIDTH: 0.8,
  HEIGHT: 0.08,
  Y_OFFSET: 0.5,             // Above head
  LOW_THRESHOLD: 0.3,        // Below 30% = red
};

// --- 3D Model configuration ---
export const MODELS = {
  BLUE_BOMBER: {
    path: 'assets/models/blue-bomber.glb',
    scale: 1.0,
    rotationY: Math.PI,  // Meshy models face +Z; rotate to face -Z (toward opponent)
  },
  RED_ROCKER: {
    path: 'assets/models/red-rocker.glb',
    scale: 1.0,
    rotationY: 0,        // faces +Z by default (toward player) — correct
  },
  BOXING_RING: {
    path: 'assets/models/boxing-ring.glb',
    scale: 3.0,          // scaled up to contain both robots
    positionY: 0,
  },
};

export const ASSET_PATHS = {};
export const MODEL_CONFIG = {};

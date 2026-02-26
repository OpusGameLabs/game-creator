export const GAME = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 200,
  MAX_DELTA: 0.05,
  MAX_DPR: 2,
};

export const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1);

// Play.fun SDK widget renders a 75px fixed bar at top:0, z-index:9999.
// All HTML overlays must account for this with padding-top or safe offset.
export const SAFE_ZONE = {
  TOP_PX: 75,
  TOP_PERCENT: 8,
};

export const PLAYER = {
  SIZE: 1,
  LANE_SPEED: 8,       // lateral movement speed (left/right)
  TURN_SPEED: 10,
  START_X: 0,
  START_Y: 0,
  START_Z: 0,
  COLOR: 0x44aaff,
  COLLISION_RADIUS: 0.5,
  INVINCIBILITY_DURATION: 1.5, // seconds after getting hit
  FLASH_RATE: 10,              // flashes per second during invincibility
};

export const STREET = {
  WIDTH: 10,            // total street width
  LANE_LEFT: -2.5,      // left lane X position
  LANE_CENTER: 0,       // center lane X position
  LANE_RIGHT: 2.5,      // right lane X position
  LANE_MIN: -4,         // leftmost boundary
  LANE_MAX: 4,          // rightmost boundary
  HOUSE_OFFSET_X: 7,    // distance from center to house row
  SIDEWALK_WIDTH: 2,    // sidewalk between street and houses
  SEGMENT_LENGTH: 40,   // length of each street segment
  LANE_MARKING_WIDTH: 0.15,
  LANE_MARKING_LENGTH: 2,
  LANE_MARKING_GAP: 2,
};

export const ENVELOPE = {
  WIDTH: 0.3,
  HEIGHT: 0.02,
  DEPTH: 0.2,
  SPEED: 30,
  COOLDOWN: 0.35,       // seconds between throws
  MAX_DISTANCE: 40,     // auto-destroy after this distance
  COLOR: 0xffffff,
  SPIN_SPEED: 8,        // radians per second rotation
};

export const HOUSE = {
  WIDTH: 3,
  HEIGHT: 2.5,
  DEPTH: 3,
  ROOF_HEIGHT: 1.2,
  SPACING_Z: 6,         // distance between houses along Z
  SPAWN_DISTANCE: 80,   // how far ahead to generate houses
  CLEANUP_DISTANCE: 20, // how far behind to remove houses
  COLORS: [
    0x7eb8d8, // pastel blue
    0xf0e68c, // pastel yellow
    0xf4a6b8, // pastel pink
    0x90c695, // pastel green
    0xf5f5f5, // white
    0xd2b48c, // beige
    0xe8c4a0, // peach
    0xb0c4de, // light steel blue
  ],
  ROOF_COLORS: [
    0x8b4513, // saddle brown
    0x696969, // dim gray
    0xa0522d, // sienna
    0x556b2f, // dark olive
    0x800000, // maroon
  ],
  SHAKE_DURATION: 0.3,
  SHAKE_INTENSITY: 0.15,
  FLASH_DURATION: 0.2,
};

export const HOMEOWNER = {
  BODY_WIDTH: 0.3,
  BODY_HEIGHT: 0.5,
  BODY_DEPTH: 0.2,
  HEAD_RADIUS: 0.15,
  ARM_WIDTH: 0.08,
  ARM_HEIGHT: 0.35,
  SPEED: 3,
  PANIC_DURATION: 3,    // seconds the homeowner runs around
  DROP_INTERVAL: 0.4,   // seconds between panic point drops
  COLORS: [
    0xff6347, // tomato
    0x4169e1, // royal blue
    0x32cd32, // lime green
    0xff69b4, // hot pink
    0xffa500, // orange
  ],
};

export const PANIC_POINT = {
  RADIUS: 0.15,
  FLOAT_HEIGHT: 0.8,
  BOB_AMPLITUDE: 0.15,
  BOB_SPEED: 3,
  SPIN_SPEED: 4,
  COLLECT_RADIUS: 1.2,
  COLOR: 0x00ff00,
  GLOW_COLOR: 0x44ff44,
  LIFETIME: 8,          // seconds before auto-despawn
  FLASH_DURATION: 0.15,
};

export const AGENT = {
  BODY_WIDTH: 0.4,
  BODY_HEIGHT: 0.7,
  BODY_DEPTH: 0.3,
  HEAD_RADIUS: 0.18,
  SIGN_WIDTH: 0.5,
  SIGN_HEIGHT: 0.7,
  SIGN_DEPTH: 0.05,
  SPEED: 4,
  SPAWN_INTERVAL: 3,    // seconds between agent spawns (initial)
  SPAWN_DISTANCE: 50,   // how far ahead they spawn
  COLLISION_RADIUS: 0.7,
  COLOR_BODY: 0x1a1a2e,  // dark navy suit
  COLOR_HEAD: 0xffdab9,  // peach skin
  COLOR_SIGN: 0xff0000,  // red FOR SALE sign
  MIN_SPAWN_INTERVAL: 1, // fastest possible spawn rate
};

export const GAMEPLAY = {
  AUTO_SPEED: 8,          // initial forward speed (units/sec)
  SPEED_INCREASE_RATE: 0.15, // speed increase per second
  MAX_SPEED: 25,          // cap
  LIVES: 3,
  THROW_ANIMATION_DURATION: 0.4, // how long the punch animation plays
};

export const COMBO = {
  TIMEOUT_MS: 3000,      // ms before combo resets if no hits
  MULTIPLIER_CAP: 10,    // max combo multiplier
};

export const LEVEL = {
  GROUND_COLOR: 0x4a7c2e,   // grass color
  STREET_COLOR: 0x555555,   // asphalt
  SIDEWALK_COLOR: 0xccccbb, // concrete
  FOG_COLOR: 0x87ceeb,      // sky blue
  FOG_NEAR: 30,
  FOG_FAR: 100,
};

export const CAMERA = {
  HEIGHT: 5,
  DISTANCE: 8,
  LOOK_AHEAD: 6,        // how far ahead of player camera looks
  MIN_DISTANCE: 3,
  MAX_DISTANCE: 15,
};

export const COLORS = {
  SKY: 0x87ceeb,
  AMBIENT_LIGHT: 0xffffff,
  AMBIENT_INTENSITY: 0.7,
  DIR_LIGHT: 0xffffff,
  DIR_INTENSITY: 0.9,
  PLAYER: 0x44aaff,
};

// RobotExpressive character
export const CHARACTER = {
  path: 'assets/models/RobotExpressive.glb',
  scale: 1,
  offsetY: 0,
  facingOffset: 0, // RobotExpressive faces +Z
  clipMap: {
    idle: 'Idle',
    walk: 'Walking',
    run: 'Running',
    throw: 'Punch',
  },
};

export const ASSET_PATHS = {};
export const MODEL_CONFIG = {};

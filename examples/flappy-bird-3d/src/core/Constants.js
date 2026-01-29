// === Game Window ===
export const GAME = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 200,
  MAX_DELTA: 0.05,
};

// === Bird ===
export const BIRD = {
  RADIUS: 0.35,
  BODY_SCALE_X: 1.2,
  BODY_SCALE_Y: 0.9,
  BODY_SCALE_Z: 1.0,
  COLOR: 0xf5c842,
  BEAK_COLOR: 0xff6600,
  EYE_COLOR: 0x000000,
  EYE_WHITE_COLOR: 0xffffff,
  WING_COLOR: 0xe0a800,
  START_X: 0,
  START_Y: 5,
  START_Z: 0,
  GRAVITY: -18,
  FLAP_VELOCITY: 7,
  MAX_FALL_SPEED: -12,
  TILT_UP: 0.4,
  TILT_DOWN: -1.2,
  TILT_LERP: 4,
};

// === Pipes ===
export const PIPE = {
  RADIUS: 0.8,
  HEIGHT: 8,
  SEGMENTS: 16,
  COLOR_TOP: 0x33cc33,
  COLOR_BOTTOM: 0x228b22,
  CAP_COLOR: 0x2ebd2e,
  CAP_RADIUS: 1.0,
  CAP_HEIGHT: 0.4,
  GAP: 4.5,
  SPACING: 12,
  SPEED: 8,
  SPAWN_DISTANCE: 60,
  DESPAWN_DISTANCE: -15,
  MIN_CENTER_Y: 3,
  MAX_CENTER_Y: 7,
  INITIAL_COUNT: 6,
};

// === Camera ===
export const CAMERA = {
  OFFSET_X: -6,
  OFFSET_Y: 1.5,
  OFFSET_Z: 0,
  LOOK_AHEAD: 8,
  FOLLOW_LERP: 3,
};

// === Level ===
export const LEVEL = {
  GROUND_Y: -1,
  GROUND_WIDTH: 20,
  GROUND_LENGTH: 300,
  GROUND_COLOR: 0x5a8f3c,
  CEILING_Y: 12,
  SKY_COLOR: 0x64b5f6,
  FOG_COLOR: 0x64b5f6,
  FOG_NEAR: 30,
  FOG_FAR: 80,
};

// === Lighting ===
export const COLORS = {
  SKY: 0x64b5f6,
  AMBIENT_LIGHT: 0xffffff,
  AMBIENT_INTENSITY: 0.7,
  DIR_LIGHT: 0xffffff,
  DIR_INTENSITY: 0.9,
  DIR_POSITION_X: 5,
  DIR_POSITION_Y: 15,
  DIR_POSITION_Z: 10,
};

// === Scoring ===
export const SCORE = {
  POINTS_PER_PIPE: 1,
};

// === Particles ===
export const PARTICLES = {
  FLAP_COUNT: 5,
  FLAP_SPEED: 3,
  FLAP_LIFE: 0.4,
  FLAP_SIZE: 0.12,
  FLAP_COLOR: 0xffffff,
  DEATH_COUNT: 20,
  DEATH_SPEED: 6,
  DEATH_LIFE: 1.0,
  DEATH_SIZE: 0.2,
  DEATH_COLOR: 0xff4444,
  SCORE_COUNT: 8,
  SCORE_SPEED: 4,
  SCORE_LIFE: 0.6,
  SCORE_SIZE: 0.15,
  SCORE_COLOR: 0xffdd44,
};

// === Transitions ===
export const TRANSITIONS = {
  DEATH_SLOWMO_SCALE: 0.2,
  DEATH_SLOWMO_DURATION: 0.5,
  SHAKE_INTENSITY: 0.3,
  SHAKE_DURATION: 0.3,
};

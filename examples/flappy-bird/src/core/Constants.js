// =============================================================================
// Flappy Bird — All Configuration Values
// =============================================================================

export const GAME = {
  WIDTH: 400,
  HEIGHT: 600,
  GRAVITY: 1200,
};

export const BIRD = {
  START_X: 100,
  START_Y: 300,
  WIDTH: 34,
  HEIGHT: 24,
  FLAP_VELOCITY: -380,
  ROTATION_UP_DEG: -25,
  ROTATION_DOWN_DEG: 90,
  ROTATION_SPEED: 4,
  BODY_COLOR: 0xf5d742,
  BODY_LIGHT: 0xfce878,
  BODY_DARK: 0xc4a820,
  EYE_COLOR: 0xffffff,
  PUPIL_COLOR: 0x000000,
  BEAK_COLOR: 0xe87040,
  WING_COLOR: 0xdeb858,
};

export const PIPE = {
  WIDTH: 52,
  GAP: 150,
  SPEED: 160,
  SPAWN_INTERVAL: 1600,
  MIN_TOP_HEIGHT: 60,
  BODY_COLOR: 0x73bf2e,
  BODY_DARK: 0x5a9a23,
  CAP_COLOR: 0x5a9a23,
  CAP_HEIGHT: 26,
  CAP_OVERHANG: 4,
  HIGHLIGHT_COLOR: 0x8ad432,
};

export const GROUND = {
  HEIGHT: 80,
  Y: 600 - 80,
  COLOR: 0xded895,
  DARK_COLOR: 0xb8a850,
  GRASS_COLOR: 0x8ec63f,
  STRIPE_COLOR: 0xc8c080,
  SPEED: 160,
};

export const SKY = {
  TOP_COLOR: 0x4ec0ca,
  BOTTOM_COLOR: 0xa2d9e7,
  CLOUD_COUNT: 5,
  CLOUD_MIN_Y: 30,
  CLOUD_MAX_Y: 250,
  CLOUD_SPEED: 20,
  CLOUD_ALPHA: 0.6,
  CLOUD_COLORS: [0xffffff, 0xf0f0f0, 0xe8e8e8],
};

export const COLORS = {
  UI_TEXT: '#ffffff',
  UI_SHADOW: '#000000',
  MENU_BG: 0x4ec0ca,
  GAMEOVER_BG: 0x1a1a2e,
  BUTTON: 0xf5d742,
  BUTTON_HOVER: 0xfce878,
  BUTTON_TEXT: '#5a3e00',
  SCORE_STROKE: '#000000',
  PANEL_BG: 0xdeb858,
  PANEL_BORDER: 0x846830,
  MEDAL_GOLD: 0xffd700,
  MEDAL_SILVER: 0xc0c0c0,
  MEDAL_BRONZE: 0xcd7f32,
};

export const TRANSITION = {
  FADE_DURATION: 300,
  SCORE_POP_SCALE: 1.4,
  SCORE_POP_DURATION: 80,
  DEATH_FLASH_DURATION: 150,
  DEATH_SHAKE_DURATION: 250,
  DEATH_SHAKE_INTENSITY: 0.012,
};

export const PARTICLES = {
  SCORE_BURST_COUNT: 8,
  SCORE_BURST_COLOR: 0xffd700,
  DEATH_BURST_COUNT: 12,
  DEATH_BURST_COLORS: [0xf5d742, 0xfce878, 0xe87040, 0xffffff],
  FEATHER_COLORS: [0xf5d742, 0xfce878, 0xdeb858],
};

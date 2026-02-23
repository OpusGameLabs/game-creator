// --- Display ---

// Device pixel ratio (capped at 2 for mobile GPU performance)
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

// Orientation: landscape on desktop, portrait on mobile
const _isPortrait = window.innerHeight > window.innerWidth;

// Design dimensions (logical game units at 1x scale)
const _designW = _isPortrait ? 540 : 960;
const _designH = _isPortrait ? 960 : 540;
const _designAspect = _designW / _designH;

// Canvas dimensions = device pixel area, maintaining design aspect ratio.
// This ensures the canvas has enough resolution for the user's actual display
// so FIT mode never CSS-upscales (which causes blurriness on retina).
const _deviceW = window.innerWidth * DPR;
const _deviceH = window.innerHeight * DPR;

let _canvasW, _canvasH;
if (_deviceW / _deviceH > _designAspect) {
  // Viewport wider than design -> width-limited by FIT -> match device width
  _canvasW = _deviceW;
  _canvasH = Math.round(_deviceW / _designAspect);
} else {
  // Viewport taller than design -> width-limited by FIT -> match device width
  _canvasW = Math.round(_deviceH * _designAspect);
  _canvasH = _deviceH;
}

// PX = canvas pixels per design pixel. Scales all absolute values (sizes, speeds, etc.)
// from design space to canvas space. Gameplay proportions stay identical across all displays.
export const PX = _canvasW / _designW;

export const GAME = {
  WIDTH: _canvasW,
  HEIGHT: _canvasH,
  IS_PORTRAIT: _isPortrait,
  // No GRAVITY here -- gravity is set per-physics-body for falling objects only
};

// --- Safe Zone (Play.fun widget overlay) ---
// The Play.fun SDK widget renders a 75px fixed bar at top:0, z-index:9999.
// All UI text, buttons, and interactive elements must be positioned below SAFE_ZONE.TOP.
export const SAFE_ZONE = {
  TOP: GAME.HEIGHT * 0.08,
  BOTTOM: 0,
  LEFT: 0,
  RIGHT: 0,
};

// --- Player (basket/catcher) ---

export const PLAYER = {
  START_X: GAME.WIDTH * 0.5,
  START_Y: GAME.HEIGHT * 0.88,
  WIDTH: GAME.WIDTH * 0.14,
  HEIGHT: GAME.WIDTH * 0.10,   // proportional to width for the basket shape
  SPEED: 350 * PX,
  PIXEL_SCALE: 3,              // pixel art scale factor
};

// --- Gems ---

export const GEM = {
  SIZE: GAME.WIDTH * 0.06,     // increased for visibility
  FALL_SPEED: 150 * PX,
  SPAWN_INTERVAL: 1200,        // ms between spawns (initial)
  PIXEL_SCALE: 3,              // pixel art scale factor
};

// --- Skulls ---

export const SKULL = {
  SIZE: GAME.WIDTH * 0.06,     // increased for visibility
  FALL_SPEED: 120 * PX,        // slightly slower than gems
  SPAWN_CHANCE: 0.15,          // 15% chance per spawn cycle
  PIXEL_SCALE: 3,              // pixel art scale factor
};

// --- Difficulty ---

export const DIFFICULTY = {
  SCORE_THRESHOLD: 10,     // speed increases every N points
  SPEED_MULTIPLIER: 1.15,  // fall speed multiplied by this each ramp
  INTERVAL_REDUCTION: 100, // ms subtracted from spawn interval each ramp
  MIN_SPAWN_INTERVAL: 400, // ms floor for spawn interval
  MAX_FALL_SPEED: 400 * PX,
};

// --- Lives ---

export const LIVES = {
  STARTING: 3,
};

// --- Colors ---

export const COLORS = {
  // Gameplay -- night sky theme
  SKY_TOP: 0x0b0033,
  SKY_BOTTOM: 0x1a0066,
  SKY: 0x0f004d,

  // Player basket
  PLAYER: 0x8b5e3c,
  PLAYER_RIM: 0x6b3f1c,

  // Gems -- per-type colors for particles
  GEM_GLOW: 0xffd700,
  GEM_DIAMOND: 0xf5d742,
  GEM_EMERALD: 0x3fa04b,
  GEM_RUBY: 0xe94560,
  GEM_SAPPHIRE: 0x44ddff,

  // New best score
  NEW_BEST: '#ff6600',

  // Skulls
  SKULL: 0xff3333,
  SKULL_EYES: 0xffffff,

  // UI text
  UI_TEXT: '#ffffff',
  UI_SHADOW: '#000000',
  MUTED_TEXT: '#8888aa',
  SCORE_GOLD: '#ffd700',
  LIVES_RED: '#ff4444',

  // Menu / GameOver gradient backgrounds
  BG_TOP: 0x0b0033,
  BG_BOTTOM: 0x1a0066,

  // Buttons
  BTN_PRIMARY: 0x6c63ff,
  BTN_PRIMARY_HOVER: 0x857dff,
  BTN_PRIMARY_PRESS: 0x5a52d5,
  BTN_TEXT: '#ffffff',
};

// --- UI sizing (proportional to game dimensions) ---

export const UI = {
  FONT: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  TITLE_RATIO: 0.08,          // title font size as % of GAME.HEIGHT
  HEADING_RATIO: 0.05,        // heading font size
  BODY_RATIO: 0.035,          // body/button font size
  SMALL_RATIO: 0.025,         // hint/caption font size
  BTN_W_RATIO: 0.45,          // button width as % of GAME.WIDTH
  BTN_H_RATIO: 0.075,         // button height as % of GAME.HEIGHT
  BTN_RADIUS: 12 * PX,        // button corner radius
  MIN_TOUCH: 44 * PX,         // minimum touch target
  // Score HUD omitted -- Play.fun widget displays score in SAFE_ZONE.TOP area
};

// --- Transitions ---

export const TRANSITION = {
  FADE_DURATION: 350,
};

// --- Particles & Effects ---

export const PARTICLES = {
  // Gem catch burst
  GEM_CATCH_COUNT: 10,         // number of sparkle particles on gem catch
  GEM_CATCH_SPEED: 80 * PX,   // max outward travel distance
  GEM_CATCH_SIZE: 3 * PX,     // base particle radius
  GEM_CATCH_DURATION: 500,     // ms

  // Skull hit burst
  SKULL_HIT_COUNT: 12,
  SKULL_HIT_SPEED: 100 * PX,
  SKULL_HIT_SIZE: 4 * PX,
  SKULL_HIT_DURATION: 400,
  SKULL_HIT_COLORS: [0xff3333, 0x660000, 0x330011, 0xff0000],

  // Difficulty up golden shower
  DIFFICULTY_COUNT: 30,
  DIFFICULTY_SIZE: 3 * PX,
  DIFFICULTY_DURATION: 1200,
  DIFFICULTY_COLOR: 0xffd700,

  // Gem trail (glow particles while falling)
  GEM_TRAIL_INTERVAL: 120,     // ms between trail particles
  GEM_TRAIL_SIZE: 2 * PX,
  GEM_TRAIL_DURATION: 400,
  GEM_TRAIL_ALPHA: 0.6,
};

export const EFFECTS = {
  // Screen shake on skull hit
  SHAKE_DURATION: 150,         // ms
  SHAKE_INTENSITY: 0.008,      // camera shake intensity (0-1)

  // Slow-mo on final death
  SLOWMO_SCALE: 0.3,           // time scale multiplier
  SLOWMO_DURATION: 500,        // ms before game over transition

  // Camera flash on skull hit
  FLASH_DURATION: 200,         // ms
  FLASH_R: 255,
  FLASH_G: 50,
  FLASH_B: 50,

  // Floating score text
  FLOAT_RISE: 50 * PX,        // pixels to rise
  FLOAT_DURATION: 700,         // ms
  FLOAT_FONT_RATIO: 0.04,     // % of GAME.HEIGHT

  // Heart pulse on life lost
  HEART_PULSE_SCALE: 1.5,     // max scale during pulse
  HEART_PULSE_DURATION: 200,  // ms per half-cycle

  // Basket idle bob
  BASKET_BOB_AMOUNT: 2 * PX,  // pixels up/down
  BASKET_BOB_DURATION: 1500,  // ms full cycle

  // Score count-up on game over
  SCORE_COUNTUP_DURATION: 1000, // ms to count from 0 to final
  SCORE_COUNTUP_DELAY: 400,     // ms delay before starting count
};

export const BACKGROUND = {
  // Parallax star layers
  PARALLAX_SPEED_NEAR: 8 * PX,    // pixels/sec for near stars
  PARALLAX_SPEED_FAR: 3 * PX,     // pixels/sec for far stars

  // Shooting stars
  SHOOTING_STAR_INTERVAL_MIN: 3000,  // ms min between shooting stars
  SHOOTING_STAR_INTERVAL_MAX: 8000,  // ms max
  SHOOTING_STAR_SPEED: 400 * PX,    // pixels/sec
  SHOOTING_STAR_LENGTH: 60 * PX,    // trail length
  SHOOTING_STAR_DURATION: 800,      // ms
  SHOOTING_STAR_COLOR: 0xffffff,
  SHOOTING_STAR_ALPHA: 0.8,
};

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
  _canvasW = _deviceW;
  _canvasH = Math.round(_deviceW / _designAspect);
} else {
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

// --- Ship (player spaceship) ---

export const SHIP = {
  WIDTH: GAME.WIDTH * 0.07,
  HEIGHT: GAME.HEIGHT * 0.08,
  // Ship sits near the bottom of the screen
  START_X: GAME.WIDTH * 0.5,
  START_Y: GAME.HEIGHT * 0.88,
  SPEED: 450 * PX,
  COLOR: 0x44aaff,
  COCKPIT_COLOR: 0x88ddff,
  ENGINE_COLOR: 0xff6622,
  // Horizontal margin — ship cannot go beyond this from screen edges
  MARGIN: GAME.WIDTH * 0.03,
};

// --- Asteroids ---

export const ASTEROID = {
  MIN_RADIUS: GAME.WIDTH * 0.02,
  MAX_RADIUS: GAME.WIDTH * 0.045,
  // Initial falling speed (pixels per second)
  BASE_SPEED: 180 * PX,
  // Speed increase per point scored
  SPEED_PER_SCORE: 2.5 * PX,
  // Maximum falling speed cap
  MAX_SPEED: 500 * PX,
  // Initial spawn interval in ms
  BASE_SPAWN_INTERVAL: 1200,
  // Minimum spawn interval cap (ms)
  MIN_SPAWN_INTERVAL: 350,
  // Spawn interval decrease per point scored (ms)
  SPAWN_INTERVAL_PER_SCORE: 18,
  // Object pool max size
  POOL_SIZE: 30,
  // Color palette for asteroids (procedural variety)
  COLORS: [0x8b7355, 0x9e8c6c, 0x6b5b3e, 0xa0937a, 0x7a6b50],
  // Spawn y offset above top of screen
  SPAWN_Y: -GAME.HEIGHT * 0.05,
  // Horizontal spawn padding from edges
  SPAWN_PADDING: GAME.WIDTH * 0.05,
};

// --- Scoring ---

export const SCORING = {
  // Points earned when an asteroid passes the bottom without hitting the ship
  POINTS_PER_DODGE: 1,
};

// --- Stars background ---

export const STARS = {
  COUNT: 80,
  MIN_SIZE: 1 * PX,
  MAX_SIZE: 3 * PX,
  MIN_SPEED: 20 * PX,
  MAX_SPEED: 60 * PX,
  COLOR: 0xffffff,
};

// --- Colors ---

export const COLORS = {
  // Gameplay background (deep space)
  BG_SPACE_TOP: 0x0a0a1a,
  BG_SPACE_BOTTOM: 0x141432,

  // Ship
  SHIP: 0x44aaff,
  SHIP_COCKPIT: 0x88ddff,
  SHIP_ENGINE: 0xff6622,

  // UI text
  UI_TEXT: '#ffffff',
  UI_SHADOW: '#000000',
  MUTED_TEXT: '#8888aa',
  SCORE_GOLD: '#ffd700',

  // GameOver gradient backgrounds
  BG_TOP: 0x0f0c29,
  BG_BOTTOM: 0x302b63,

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
  // Score HUD omitted — Play.fun widget displays score in SAFE_ZONE.TOP area
};

// --- Transitions ---

export const TRANSITION = {
  FADE_DURATION: 350,
};

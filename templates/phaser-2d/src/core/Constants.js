// --- Display ---

// Device pixel ratio (capped at 2 for mobile GPU performance)
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

// Force portrait mode — set to true for vertical games (dodgers, runners, collectors).
// On desktop, Scale.FIT + CENTER_BOTH will pillarbox with black bars automatically.
// Set to false (default) for games that should adapt to device orientation.
const FORCE_PORTRAIT = false;
const _isPortrait = FORCE_PORTRAIT || window.innerHeight > window.innerWidth;

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
  // Viewport wider than design → width-limited by FIT → match device width
  _canvasW = _deviceW;
  _canvasH = Math.round(_deviceW / _designAspect);
} else {
  // Viewport taller than design → width-limited by FIT → match device width
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
  GRAVITY: 800 * PX,
};

// --- Safe Zone (Play.fun SDK insets) ---
// The Play.fun SDK sets CSS custom properties on the game iframe's document:
//   --ogp-safe-top-inset    (space below Play.fun header bubbles, ~68px on mobile)
//   --ogp-safe-bottom-inset (space above Safari bottom controls, ~148px on mobile)
// Both default to 0px when not running inside the Play.fun dashboard.
// All UI text, buttons, and interactive elements must stay within the safe area.
// Game canvas / backgrounds should fill the full viewport (bleed behind chrome).
function _readSafeInsets() {
  const s = getComputedStyle(document.documentElement);
  const top = parseInt(s.getPropertyValue('--ogp-safe-top-inset')) || 0;
  const bottom = parseInt(s.getPropertyValue('--ogp-safe-bottom-inset')) || 0;
  // CSS vars are in CSS pixels — multiply by DPR to convert to canvas pixels
  return { top: top * DPR, bottom: bottom * DPR };
}
const _insets = _readSafeInsets();

export const SAFE_ZONE = {
  TOP: Math.max(GAME.HEIGHT * 0.08, _insets.top),
  BOTTOM: _insets.bottom,
  LEFT: 0,
  RIGHT: 0,
};

// --- Player ---

const SPRITE_ASPECT = 1.5;

export const PLAYER = {
  START_X: GAME.WIDTH * 0.25,
  START_Y: GAME.HEIGHT * 0.65,
  WIDTH: GAME.WIDTH * 0.08,
  HEIGHT: GAME.WIDTH * 0.08 * SPRITE_ASPECT,
  SPEED: 200 * PX,
  JUMP_VELOCITY: -400 * PX,
  COLOR: 0x44aaff,
};

// --- Colors ---

export const COLORS = {
  // Gameplay
  SKY: 0x87ceeb,
  GROUND: 0x4a7c2e,
  GROUND_DARK: 0x3a6320,
  PLAYER: 0x44aaff,

  // UI text
  UI_TEXT: '#ffffff',
  UI_SHADOW: '#000000',
  MUTED_TEXT: '#8888aa',
  SCORE_GOLD: '#ffd700',

  // Menu / GameOver gradient backgrounds
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

// --- Visible Touch Controls ---
// Semi-transparent arrow indicators for touch-capable devices.
// Use capability detection: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)

export const TOUCH = {
  BUTTON_SIZE: GAME.WIDTH * 0.12,       // 12% of canvas width
  ALPHA_IDLE: 0.35,
  ALPHA_ACTIVE: 0.6,
  MARGIN_X: GAME.WIDTH * 0.08,          // Inset from screen edge
  MARGIN_BOTTOM: Math.max(GAME.HEIGHT * 0.06, SAFE_ZONE.BOTTOM + 10 * DPR),
  ARROW_COLOR: 0xffffff,
};

// --- Transitions ---

export const TRANSITION = {
  FADE_DURATION: 350,
};

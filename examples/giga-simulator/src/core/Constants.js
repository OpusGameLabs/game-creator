// --- Display ---

// Device pixel ratio (capped at 2 for mobile GPU performance)
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

// Force portrait mode — vertical collector/dodger game.
// On desktop, Scale.FIT + CENTER_BOTH will pillarbox with black bars automatically.
const FORCE_PORTRAIT = true;
const _isPortrait = FORCE_PORTRAIT || window.innerHeight > window.innerWidth;

// Design dimensions (logical game units at 1x scale)
const _designW = _isPortrait ? 540 : 960;
const _designH = _isPortrait ? 960 : 540;
const _designAspect = _designW / _designH;

// Canvas dimensions = device pixel area, maintaining design aspect ratio.
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
export const PX = _canvasW / _designW;

export const GAME = {
  WIDTH: _canvasW,
  HEIGHT: _canvasH,
  IS_PORTRAIT: _isPortrait,
  // No gravity for player — items fall with own velocity
};

// --- Safe Zone (Play.fun widget overlay) ---
export const SAFE_ZONE = {
  TOP: GAME.HEIGHT * 0.08,
  BOTTOM: 0,
  LEFT: 0,
  RIGHT: 0,
};

// --- Gigachad (Player) ---

export const GIGACHAD = {
  WIDTH: GAME.WIDTH * 0.14,
  HEIGHT: GAME.WIDTH * 0.14 * 1.8, // Tall muscular silhouette
  START_X: GAME.WIDTH / 2,
  GROUND_Y: GAME.HEIGHT * 0.88, // Fixed Y near bottom
  SPEED: 350 * PX,
  BODY_COLOR: 0x1a1a2e,
  JAW_COLOR: 0xffd700,
  HIGHLIGHT_COLOR: 0xcccccc,
  FLEX_SCALE: 1.15, // Scale up on item collect
  FLEX_DURATION: 150,
};

// --- Items ---

export const ITEMS = {
  MIN_SIZE: GAME.WIDTH * 0.07, // Minimum 7% canvas width
  SPAWN_Y: -GAME.HEIGHT * 0.05, // Start above screen

  // Gains (collectible)
  GAINS: {
    DUMBBELL: {
      key: 'dumbbell',
      points: 1,
      weight: 40, // Most common
      color: 0x888899,
      accentColor: 0xaaaacc,
      width: GAME.WIDTH * 0.09,
      height: GAME.WIDTH * 0.07,
    },
    PROTEIN: {
      key: 'protein',
      points: 2,
      weight: 25,
      color: 0x00cc44,
      accentColor: 0x66ff99,
      width: GAME.WIDTH * 0.07,
      height: GAME.WIDTH * 0.10,
    },
    STEAK: {
      key: 'steak',
      points: 3,
      weight: 20,
      color: 0xcc4422,
      accentColor: 0xeeddcc,
      width: GAME.WIDTH * 0.09,
      height: GAME.WIDTH * 0.07,
      wobbleSpeed: 1.5, // Horizontal wobble
      wobbleAmount: 30 * PX,
    },
    GIGA_COIN: {
      key: 'giga_coin',
      points: 5,
      weight: 10, // Rare
      color: 0xffd700,
      accentColor: 0xffee88,
      size: GAME.WIDTH * 0.08,
      glowColor: 0xffcc00,
      glowAlpha: 0.3,
    },
  },

  // NGMI (hazards)
  NGMI: {
    JUNK_FOOD: {
      key: 'junk_food',
      weight: 45, // Most common
      color: 0xff4422,
      accentColor: 0xff8844,
      width: GAME.WIDTH * 0.08,
      height: GAME.WIDTH * 0.07,
    },
    COUCH: {
      key: 'couch',
      weight: 30,
      color: 0x7744aa,
      accentColor: 0x9966cc,
      width: GAME.WIDTH * 0.12, // Wide hitbox
      height: GAME.WIDTH * 0.07,
    },
    FUD: {
      key: 'fud',
      weight: 20, // Rare
      color: 0xcccccc,
      accentColor: 0xff2222,
      width: GAME.WIDTH * 0.08,
      height: GAME.WIDTH * 0.10,
      driftSpeed: 60 * PX, // Horizontal drift
    },
  },
};

// --- Lives ---

export const LIVES = {
  MAX: 3,
  ICON_SIZE: GAME.WIDTH * 0.04,
  ICON_COLOR: 0xff3366,
  ICON_LOST_COLOR: 0x333344,
  START_X: GAME.WIDTH * 0.06,
  Y: SAFE_ZONE.TOP + GAME.HEIGHT * 0.03,
  SPACING: GAME.WIDTH * 0.055,
};

// --- Combo ---

export const COMBO = {
  TIMEOUT: 3000, // ms before combo resets from inactivity
  MILESTONE_INTERVAL: 5, // Spectacle event every N combo
  MULTIPLIER_CAP: 5, // Max combo multiplier
};

// --- Chad Level ---

export const CHAD_LEVEL = {
  THRESHOLDS: [0, 25, 75, 150, 300], // Score milestones
  NAMES: ['Normie', 'Gym Bro', 'Sigma', 'Gigachad', 'Ultra Giga'],
  COLORS: [0x888888, 0x44aaff, 0xaa44ff, 0xffd700, 0xff4400],
};

// --- Difficulty ---

export const DIFFICULTY = {
  BASE_FALL_SPEED: 180 * PX,
  MAX_FALL_SPEED: 450 * PX,
  SPEED_INCREASE_RATE: 0.5 * PX, // Per second of gameplay
  BASE_SPAWN_INTERVAL: 1200, // ms between spawns
  MIN_SPAWN_INTERVAL: 400, // Fastest spawn rate
  SPAWN_INTERVAL_DECREASE: 8, // ms faster per second of gameplay
  NGMI_RATIO: 0.3, // 30% of spawns are NGMI items
  NGMI_RATIO_MAX: 0.45, // Increases over time
  NEAR_MISS_THRESHOLD: GAME.WIDTH * 0.10, // 10% of width for near miss detection
};

// --- Colors ---

export const COLORS = {
  // Gameplay background
  BG_DARK: 0x0a0a14,
  BG_GRADIENT_TOP: 0x0f0f1e,
  BG_GRADIENT_BOTTOM: 0x1a1a2e,
  GROUND: 0x16213e,
  GROUND_LINE: 0xffd700,

  // UI text
  UI_TEXT: '#ffffff',
  UI_SHADOW: '#000000',
  MUTED_TEXT: '#8888aa',
  SCORE_GOLD: '#ffd700',
  COMBO_GREEN: '#00ff88',
  NGMI_RED: '#ff4444',

  // Menu / GameOver gradient backgrounds
  BG_TOP: 0x0f0c29,
  BG_BOTTOM: 0x302b63,

  // Buttons
  BTN_PRIMARY: 0xffd700,
  BTN_PRIMARY_HOVER: 0xffee44,
  BTN_PRIMARY_PRESS: 0xccaa00,
  BTN_TEXT: '#000000',
};

// --- UI sizing (proportional to game dimensions) ---

export const UI = {
  FONT: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  TITLE_RATIO: 0.08,
  HEADING_RATIO: 0.05,
  BODY_RATIO: 0.035,
  SMALL_RATIO: 0.025,
  BTN_W_RATIO: 0.45,
  BTN_H_RATIO: 0.075,
  BTN_RADIUS: 12 * PX,
  MIN_TOUCH: 44 * PX,
};

// --- Visible Touch Controls ---

export const TOUCH = {
  BUTTON_SIZE: GAME.WIDTH * 0.14,
  ALPHA_IDLE: 0.25,
  ALPHA_ACTIVE: 0.5,
  MARGIN_X: GAME.WIDTH * 0.06,
  MARGIN_BOTTOM: GAME.HEIGHT * 0.04,
  ARROW_COLOR: 0xffd700,
};

// --- Transitions ---

export const TRANSITION = {
  FADE_DURATION: 350,
};

// --- Score Milestones for Spectacle ---

export const SCORE_MILESTONES = [25, 50, 100, 200, 500];

// =============================================================================
// Vampire Survivors — All Configuration Values (DPR/PX-scaled)
// =============================================================================

// --- Display ---

// Device pixel ratio (capped at 2 for mobile GPU performance)
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

// Design dimensions (logical game units at 1x scale) — always landscape
const _designW = 800;
const _designH = 600;
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

// --- Game ---

export const GAME = {
  WIDTH: _canvasW,
  HEIGHT: _canvasH,
  WORLD_WIDTH: 2400 * PX,
  WORLD_HEIGHT: 2400 * PX,
  SURVIVE_TIME: 300,  // seconds to win (time-based, not scaled)
};

// --- Safe Zone (Play.fun widget overlay) ---
export const SAFE_ZONE = {
  TOP: GAME.HEIGHT * 0.08,
  BOTTOM: 0,
  LEFT: 0,
  RIGHT: 0,
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
};

// --- Player ---

export const PLAYER = {
  SPEED: 150 * PX,
  MAX_HP: 100,               // game-logic, not scaled
  SIZE: 20 * PX,
  COLOR: 0x44aaff,
  COLOR_LIGHT: 0x66ccff,
  INVULN_DURATION: 500,      // ms, time-based
  INVULN_FLASH_RATE: 80,     // ms, time-based
  PICKUP_RADIUS: 60 * PX,
};

// --- Enemies ---

export const ENEMY = {
  BASE_SPEED: 60 * PX,
  BASE_HP: 3,                // game-logic, not scaled
  BASE_DAMAGE: 10,           // game-logic, not scaled
  SIZE: 16 * PX,
  SPAWN_RADIUS: 500 * PX,
  SPAWN_INTERVAL: 1200,      // ms, time-based
  MIN_SPAWN_INTERVAL: 300,   // ms, time-based
  SPAWN_RAMP_RATE: 0.97,     // ratio, not scaled
  MAX_ENEMIES: 150,          // count, not scaled
  TYPES: {
    BAT:      { color: 0x9944cc, speed: 80 * PX, hp: 2, damage: 8, size: 12 * PX, xp: 1 },
    ZOMBIE:   { color: 0x55aa55, speed: 45 * PX, hp: 5, damage: 15, size: 18 * PX, xp: 2 },
    SKELETON: { color: 0xcccccc, speed: 65 * PX, hp: 4, damage: 12, size: 16 * PX, xp: 2 },
    GHOST:    { color: 0x8888ff, speed: 90 * PX, hp: 3, damage: 10, size: 14 * PX, xp: 3 },
    DEMON:    { color: 0xff4444, speed: 55 * PX, hp: 12, damage: 25, size: 24 * PX, xp: 5 },
  },
};

// --- Weapons ---

export const WEAPONS = {
  WHIP: {
    name: 'Whip',
    damage: 10,              // game-logic, not scaled
    cooldown: 1000,          // ms, time-based
    range: 80 * PX,
    color: 0xffcc00,
    knockback: 120 * PX,
  },
  MAGIC_WAND: {
    name: 'Magic Wand',
    damage: 8,               // game-logic, not scaled
    cooldown: 800,           // ms, time-based
    range: 250 * PX,
    speed: 300 * PX,
    size: 6 * PX,
    color: 0x44aaff,
    pierce: 1,               // count, not scaled
  },
  GARLIC: {
    name: 'Garlic',
    damage: 5,               // game-logic, not scaled
    cooldown: 3000,          // ms, time-based
    radius: 70 * PX,
    duration: 500,           // ms, time-based
    color: 0x88ff88,
    knockback: 80 * PX,
  },
  FIREBALL: {
    name: 'Fireball',
    damage: 20,              // game-logic, not scaled
    cooldown: 2500,          // ms, time-based
    range: 300 * PX,
    speed: 200 * PX,
    size: 10 * PX,
    color: 0xff6600,
    explodeRadius: 50 * PX,
    pierce: 3,               // count, not scaled
  },
};

// --- XP ---

export const XP = {
  GEM_SIZE: 6 * PX,
  GEM_COLOR: 0x00ccff,
  GEM_COLOR_BIG: 0x00ff88,
  MAGNET_SPEED: 400 * PX,
  // XP thresholds are game-logic numbers, not scaled
  LEVELS: [0, 5, 15, 30, 50, 80, 120, 170, 230, 300, 380, 470, 570, 680, 800, 930, 1070, 1220, 1380, 1550],
};

// --- Colors ---

export const COLORS = {
  BG: 0x1a0a2e,
  GROUND: 0x2a1a3e,
  GRID_LINE: 0x3a2a4e,
  UI_TEXT: '#ffffff',
  UI_SHADOW: '#000000',
  MENU_BG: 0x0d0520,
  GAMEOVER_BG: 0x0d0520,
  HP_BAR: 0x44ff44,
  HP_BAR_BG: 0x333333,
  HP_BAR_DANGER: 0xff4444,
  XP_BAR: 0x00ccff,
  XP_BAR_BG: 0x222244,
  BUTTON: 0x6644cc,
  BUTTON_HOVER: 0x8866ee,
  BUTTON_TEXT: '#ffffff',
  TIMER_TEXT: '#ffcc00',
  KILL_TEXT: '#ff6666',
  LEVEL_UP_BG: 0x1a0a2e,
  LEVEL_UP_BORDER: 0x6644cc,
};

// --- Transitions ---

export const TRANSITION = {
  FADE_DURATION: 300,             // ms, time-based
  SCORE_POP_SCALE: 1.3,          // ratio, not scaled
  SCORE_POP_DURATION: 100,       // ms, time-based
  DEATH_FLASH_DURATION: 200,     // ms, time-based
  DEATH_SHAKE_DURATION: 300,     // ms, time-based
  DEATH_SHAKE_INTENSITY: 0.015,  // ratio, not scaled
  DAMAGE_FLASH_DURATION: 100,    // ms, time-based
};

// --- Particles ---

export const PARTICLES = {
  ENEMY_DEATH_COUNT: 6,   // count, not scaled
  XP_PICKUP_COUNT: 4,     // count, not scaled
  PLAYER_HIT_COUNT: 5,    // count, not scaled
  LEVELUP_COUNT: 20,      // count, not scaled
};

// --- Waves ---

export const WAVE = {
  // At what time (seconds) new enemy types unlock — time-based, not scaled
  BAT_TIME: 0,
  ZOMBIE_TIME: 30,
  SKELETON_TIME: 60,
  GHOST_TIME: 120,
  DEMON_TIME: 180,
  // Difficulty scaling every 30s — ratios, not scaled
  HP_SCALE_INTERVAL: 30,
  HP_SCALE_FACTOR: 1.15,
};

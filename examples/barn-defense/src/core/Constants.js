// =============================================================================
// Barn Defense - Constants
// All magic numbers, colors, timing, and configuration values.
// Zero hardcoded values in game logic.
// =============================================================================

export const GAME = {
  WIDTH: 800,
  HEIGHT: 600,
  TILE_SIZE: 40,
  GRID_COLS: 20,
  GRID_ROWS: 15,
  DELTA_CAP: 33.33, // cap at ~30fps worth of delta
};

// Tile types for the map grid
export const TILE = {
  GRASS: 0,
  PATH: 1,
  BARN: 2,
  WATER: 3,
  ENTRY: 4,
};

// Colors used throughout the game
export const COLORS = {
  // UI
  UI_TEXT: '#ffffff',
  UI_SHADOW: '#000000',
  UI_PANEL_BG: 0x2d1b0e,
  UI_PANEL_BORDER: 0x5c3a1e,
  UI_BUTTON: 0x4a7c2e,
  UI_BUTTON_HOVER: 0x5e9e3a,
  UI_BUTTON_DISABLED: 0x555555,
  UI_GOLD_TEXT: '#ffdd44',
  UI_RED_TEXT: '#ff4444',
  UI_GREEN_TEXT: '#44ff44',

  // Menu / overlays
  MENU_BG: 0x1a3a0e,
  GAMEOVER_BG: 0x3a0e0e,
  LEVELCOMPLETE_BG: 0x0e3a1a,

  // Map tiles
  GRASS_LIGHT: 0x5da832,
  GRASS_DARK: 0x4a8c28,
  PATH_COLOR: 0xc4a35a,
  PATH_BORDER: 0xa88840,
  BARN_COLOR: 0xcc3333,
  BARN_ROOF: 0x8b2222,
  WATER_COLOR: 0x4488cc,
  ENTRY_COLOR: 0xddbb66,

  // Enemies
  CHICKEN_COLOR: 0xffdd00,
  PIG_COLOR: 0xffaacc,
  COW_COLOR: 0xffffff,
  COW_SPOT: 0x333333,
  GOAT_COLOR: 0xaaaaaa,
  BULL_COLOR: 0x882222,

  // Towers
  SCARECROW_COLOR: 0x8b6914,
  PITCHFORK_COLOR: 0x888888,
  CORN_CANNON_COLOR: 0xddcc00,
  SPRINKLER_COLOR: 0x4488ff,
  TRACTOR_COLOR: 0x44aa44,

  // Projectiles
  HAY_COLOR: 0xccaa44,
  PITCHFORK_PROJ_COLOR: 0xaaaaaa,
  CORN_PROJ_COLOR: 0xffee44,
  WATER_PROJ_COLOR: 0x66aaff,
  TRACTOR_PROJ_COLOR: 0x88cc88,

  // Health bar
  HEALTH_BG: 0x333333,
  HEALTH_HIGH: 0x44cc44,
  HEALTH_MED: 0xcccc44,
  HEALTH_LOW: 0xcc4444,

  // Range indicator
  RANGE_FILL: 0x44aaff,
  RANGE_ALPHA: 0.15,
  RANGE_STROKE: 0x44aaff,
  RANGE_STROKE_ALPHA: 0.4,

  // Selection / placement
  VALID_PLACEMENT: 0x44ff44,
  INVALID_PLACEMENT: 0xff4444,
  PLACEMENT_ALPHA: 0.4,

  // Transitions
  BUTTON: 0x44aa44,
  BUTTON_HOVER: 0x66cc66,
};

// Enemy configuration
export const ENEMIES = {
  CHICKEN: {
    key: 'chicken',
    name: 'Chicken',
    hp: 30,
    speed: 100,
    reward: 5,
    size: 10,
    color: 0xffdd00,
  },
  PIG: {
    key: 'pig',
    name: 'Pig',
    hp: 80,
    speed: 60,
    reward: 15,
    size: 14,
    color: 0xffaacc,
  },
  COW: {
    key: 'cow',
    name: 'Cow',
    hp: 200,
    speed: 35,
    reward: 30,
    size: 18,
    color: 0xffffff,
  },
  GOAT: {
    key: 'goat',
    name: 'Goat',
    hp: 90,
    speed: 65,
    reward: 20,
    size: 13,
    color: 0xaaaaaa,
    canJump: true,
    jumpChance: 0.15,
    jumpDistance: 2, // skips 2 waypoints
  },
  BULL: {
    key: 'bull',
    name: 'Bull',
    hp: 600,
    speed: 25,
    reward: 100,
    size: 22,
    color: 0x882222,
  },
};

// Tower configuration
export const TOWERS = {
  SCARECROW: {
    key: 'scarecrow',
    name: 'Scarecrow',
    cost: 50,
    damage: 8,
    range: 100,
    fireRate: 800, // ms between shots
    projectileSpeed: 250,
    color: 0x8b6914,
    projectileColor: 0xccaa44,
    projectileSize: 4,
    upgradeCostMultiplier: 1.5,
    upgradeDamageMultiplier: 1.4,
    upgradeRangeMultiplier: 1.15,
    maxLevel: 3,
    description: 'Throws hay bales',
  },
  PITCHFORK: {
    key: 'pitchfork',
    name: 'Pitchfork',
    cost: 100,
    damage: 25,
    range: 150,
    fireRate: 1400,
    projectileSpeed: 350,
    color: 0x888888,
    projectileColor: 0xaaaaaa,
    projectileSize: 5,
    upgradeCostMultiplier: 1.5,
    upgradeDamageMultiplier: 1.4,
    upgradeRangeMultiplier: 1.1,
    maxLevel: 3,
    description: 'Long range fork',
  },
  CORN_CANNON: {
    key: 'corn_cannon',
    name: 'Corn Cannon',
    cost: 150,
    damage: 40,
    range: 90,
    fireRate: 1800,
    projectileSpeed: 200,
    color: 0xddcc00,
    projectileColor: 0xffee44,
    projectileSize: 6,
    splash: true,
    splashRadius: 50,
    upgradeCostMultiplier: 1.6,
    upgradeDamageMultiplier: 1.5,
    upgradeRangeMultiplier: 1.1,
    maxLevel: 3,
    description: 'Area splash damage',
  },
  SPRINKLER: {
    key: 'sprinkler',
    name: 'Sprinkler',
    cost: 75,
    damage: 4,
    range: 110,
    fireRate: 600,
    projectileSpeed: 200,
    color: 0x4488ff,
    projectileColor: 0x66aaff,
    projectileSize: 3,
    slowEffect: true,
    slowAmount: 0.5, // multiplier on enemy speed
    slowDuration: 2000, // ms
    upgradeCostMultiplier: 1.4,
    upgradeDamageMultiplier: 1.3,
    upgradeRangeMultiplier: 1.15,
    maxLevel: 3,
    description: 'Slows enemies',
  },
  TRACTOR: {
    key: 'tractor',
    name: 'Tractor',
    cost: 300,
    damage: 35,
    range: 130,
    fireRate: 500,
    projectileSpeed: 400,
    color: 0x44aa44,
    projectileColor: 0x88cc88,
    projectileSize: 5,
    upgradeCostMultiplier: 1.8,
    upgradeDamageMultiplier: 1.5,
    upgradeRangeMultiplier: 1.1,
    maxLevel: 3,
    description: 'Fast and powerful',
  },
};

// Tower types in order for the UI panel
export const TOWER_ORDER = ['SCARECROW', 'PITCHFORK', 'CORN_CANNON', 'SPRINKLER', 'TRACTOR'];

// Health bar configuration
export const HEALTH_BAR = {
  WIDTH: 24,
  HEIGHT: 3,
  OFFSET_Y: -16,
  HIGH_THRESHOLD: 0.6,
  MED_THRESHOLD: 0.3,
};

// Transition / animation config
export const TRANSITION = {
  FADE_DURATION: 400,
  SCORE_POP_SCALE: 1.3,
  SCORE_POP_DURATION: 150,
};

// Starting resources per level
export const LEVEL_STARTING_CORN = [200, 250, 300, 350, 400];
export const LEVEL_STARTING_LIVES = [20, 20, 25, 25, 30];

// Wave timing
export const WAVE = {
  SPAWN_INTERVAL: 600, // ms between enemies in a group
  GROUP_DELAY: 1500, // ms between groups in a wave
  COUNTDOWN_DURATION: 3, // seconds before first wave if auto (not used - manual start)
};

// Projectile physics
export const PROJECTILE = {
  LIFETIME: 5000, // ms before auto-destroy
  HIT_DISTANCE: 15, // pixels to count as hit
};

// UI Layout
export const UI = {
  TOP_BAR_HEIGHT: 36,
  TOP_BAR_BG: 0x2d1b0e,
  TOP_BAR_ALPHA: 0.9,
  PANEL_WIDTH: 800,
  PANEL_HEIGHT: 70,
  PANEL_Y: 530, // bottom of screen
  TOWER_ICON_SIZE: 36,
  TOWER_ICON_SPACING: 10,
  FONT_FAMILY: 'monospace',
  FONT_SIZE_SMALL: '12px',
  FONT_SIZE_MEDIUM: '16px',
  FONT_SIZE_LARGE: '24px',
  FONT_SIZE_TITLE: '48px',
};

// Game speed multipliers
export const SPEED = {
  NORMAL: 1,
  FAST: 2,
};

// =============================================================================
// Visual Polish Constants
// =============================================================================

// Particle effects configuration
export const PARTICLES = {
  // Enemy death burst
  ENEMY_DEATH: {
    COUNT: 12,
    MIN_SPEED: 40,
    MAX_SPEED: 120,
    MIN_SIZE: 2,
    MAX_SIZE: 5,
    DURATION: 500,
    GRAVITY: 80,
  },
  // Corn earned floating text
  CORN_EARNED: {
    FLOAT_DISTANCE: 40,
    DURATION: 800,
    FONT_SIZE: '14px',
    COLOR: '#ffdd44',
  },
  // Projectile splash ring
  PROJECTILE_SPLASH: {
    RING_COUNT: 10,
    MIN_SPEED: 30,
    MAX_SPEED: 80,
    SIZE: 3,
    DURATION: 350,
    COLOR: 0xffee44,
  },
  // Tower placed dust puff
  TOWER_PLACED: {
    COUNT: 8,
    MIN_SPEED: 20,
    MAX_SPEED: 60,
    SIZE: 3,
    DURATION: 400,
    COLOR: 0xc4a35a,
  },
  // Barn hit red flash particles
  BARN_HIT: {
    COUNT: 10,
    MIN_SPEED: 30,
    MAX_SPEED: 90,
    SIZE: 4,
    DURATION: 500,
    COLOR: 0xff3333,
  },
  // Menu fireflies
  MENU_FIREFLIES: {
    COUNT: 20,
    MIN_SIZE: 1,
    MAX_SIZE: 3,
    COLOR: 0xffee88,
    MIN_DURATION: 2000,
    MAX_DURATION: 4000,
    DRIFT: 60,
  },
  // Game over embers
  GAMEOVER_EMBERS: {
    COUNT: 25,
    MIN_SIZE: 2,
    MAX_SIZE: 4,
    COLORS: [0xff4422, 0xff6633, 0xcc3311, 0xff8844],
    MIN_DURATION: 3000,
    MAX_DURATION: 5000,
  },
  // Level complete confetti
  LEVELCOMPLETE_CONFETTI: {
    COUNT: 40,
    COLORS: [0xffdd00, 0x44ff44, 0xff44ff, 0x44ddff, 0xff8844, 0xff4444],
    MIN_SIZE: 3,
    MAX_SIZE: 6,
    MIN_DURATION: 2000,
    MAX_DURATION: 4000,
  },
  // Level complete star burst
  LEVELCOMPLETE_STARBURST: {
    COUNT: 16,
    MIN_SPEED: 80,
    MAX_SPEED: 200,
    SIZE: 5,
    DURATION: 700,
    COLOR: 0xffdd00,
  },
  // Projectile trail
  TRAIL: {
    INTERVAL: 50, // ms between trail particles
    SIZE: 2,
    DURATION: 200,
    ALPHA: 0.5,
  },
};

// Screen effects configuration
export const EFFECTS = {
  // Camera shake on barn hit
  BARN_HIT_SHAKE: {
    DURATION: 200,
    INTENSITY: 0.008,
  },
  BARN_HIT_FLASH: {
    DURATION: 250,
    R: 255,
    G: 50,
    B: 50,
  },
  // Wave start zoom pulse
  WAVE_START_ZOOM: {
    SCALE: 1.02,
    DURATION: 300,
    EASE: 'Sine.easeInOut',
  },
  // Level complete white flash
  LEVEL_COMPLETE_FLASH: {
    DURATION: 400,
    R: 255,
    G: 255,
    B: 255,
  },
  // Title bounce in (menu)
  TITLE_BOUNCE: {
    FROM_SCALE: 0,
    TO_SCALE: 1,
    DURATION: 600,
    EASE: 'Back.easeOut',
  },
  // Button hover scale
  BUTTON_HOVER_SCALE: 1.05,
  BUTTON_HOVER_DURATION: 100,
  // Tower fire recoil
  TOWER_RECOIL: {
    SCALE: 1.15,
    DURATION: 100,
  },
  // Enemy damage flash
  ENEMY_DAMAGE_FLASH: {
    TINT: 0xff0000,
    DURATION: 120,
  },
  // Enemy slow tint
  ENEMY_SLOW_TINT: 0x4488ff,
  // Speed button rotation
  SPEED_TOGGLE_ROTATION: {
    ANGLE: 360,
    DURATION: 300,
  },
  // Game over title shake
  GAMEOVER_TITLE_SHAKE: {
    OFFSET: 4,
    DURATION: 60,
    REPEATS: 4,
    DELAY: 200,
  },
  // Stats fade in
  STATS_FADE_IN: {
    DURATION: 400,
    STAGGER_DELAY: 150,
  },
  // Stats slide in (level complete)
  STATS_SLIDE_IN: {
    OFFSET_X: -200,
    DURATION: 400,
    STAGGER_DELAY: 150,
    EASE: 'Back.easeOut',
  },
  // Corn counter flash
  CORN_FLASH_COLOR: '#ffffff',
  CORN_FLASH_DURATION: 100,
  // Lives counter shake
  LIVES_SHAKE: {
    OFFSET: 4,
    DURATION: 50,
    REPEATS: 3,
  },
  // Tower glow (affordable)
  TOWER_GLOW: {
    COLOR: 0xffdd44,
    ALPHA: 0.15,
    PULSE_DURATION: 1200,
    MIN_ALPHA: 0.05,
    MAX_ALPHA: 0.2,
  },
  // Typography
  TEXT_SHADOW_COLOR: '#000000',
  TEXT_SHADOW_BLUR: 4,
  TEXT_STROKE_THICKNESS: 2,
  TEXT_STROKE_COLOR: '#000000',
};

// Enemy type to particle color mapping
export const ENEMY_DEATH_COLORS = {
  chicken: [0xffdd00, 0xffee44, 0xeecc00],
  pig: [0xffaacc, 0xff88aa, 0xffccdd],
  cow: [0xffffff, 0xdddddd, 0xeeeeee],
  goat: [0xaaaaaa, 0x999999, 0xbbbbbb],
  bull: [0x882222, 0xaa3333, 0x661111],
};

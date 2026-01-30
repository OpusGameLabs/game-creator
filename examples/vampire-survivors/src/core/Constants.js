// =============================================================================
// Vampire Survivors — All Configuration Values
// =============================================================================

export const GAME = {
  WIDTH: 800,
  HEIGHT: 600,
  WORLD_WIDTH: 2400,
  WORLD_HEIGHT: 2400,
  SURVIVE_TIME: 300,  // seconds to win
};

export const PLAYER = {
  SPEED: 150,
  MAX_HP: 100,
  SIZE: 20,
  COLOR: 0x44aaff,
  COLOR_LIGHT: 0x66ccff,
  INVULN_DURATION: 500,
  INVULN_FLASH_RATE: 80,
  PICKUP_RADIUS: 60,
};

export const ENEMY = {
  BASE_SPEED: 60,
  BASE_HP: 3,
  BASE_DAMAGE: 10,
  SIZE: 16,
  SPAWN_RADIUS: 500,
  SPAWN_INTERVAL: 1200,
  MIN_SPAWN_INTERVAL: 300,
  SPAWN_RAMP_RATE: 0.97,
  MAX_ENEMIES: 150,
  TYPES: {
    BAT: { color: 0x9944cc, speed: 80, hp: 2, damage: 8, size: 12, xp: 1 },
    ZOMBIE: { color: 0x55aa55, speed: 45, hp: 5, damage: 15, size: 18, xp: 2 },
    SKELETON: { color: 0xcccccc, speed: 65, hp: 4, damage: 12, size: 16, xp: 2 },
    GHOST: { color: 0x8888ff, speed: 90, hp: 3, damage: 10, size: 14, xp: 3 },
    DEMON: { color: 0xff4444, speed: 55, hp: 12, damage: 25, size: 24, xp: 5 },
  },
};

export const WEAPONS = {
  WHIP: {
    name: 'Whip',
    damage: 10,
    cooldown: 1000,
    range: 80,
    color: 0xffcc00,
    knockback: 120,
  },
  MAGIC_WAND: {
    name: 'Magic Wand',
    damage: 8,
    cooldown: 800,
    range: 250,
    speed: 300,
    size: 6,
    color: 0x44aaff,
    pierce: 1,
  },
  GARLIC: {
    name: 'Garlic',
    damage: 5,
    cooldown: 3000,
    radius: 70,
    duration: 500,
    color: 0x88ff88,
    knockback: 80,
  },
  FIREBALL: {
    name: 'Fireball',
    damage: 20,
    cooldown: 2500,
    range: 300,
    speed: 200,
    size: 10,
    color: 0xff6600,
    explodeRadius: 50,
    pierce: 3,
  },
};

export const XP = {
  GEM_SIZE: 6,
  GEM_COLOR: 0x00ccff,
  GEM_COLOR_BIG: 0x00ff88,
  MAGNET_SPEED: 400,
  LEVELS: [0, 5, 15, 30, 50, 80, 120, 170, 230, 300, 380, 470, 570, 680, 800, 930, 1070, 1220, 1380, 1550],
};

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

export const TRANSITION = {
  FADE_DURATION: 300,
  SCORE_POP_SCALE: 1.3,
  SCORE_POP_DURATION: 100,
  DEATH_FLASH_DURATION: 200,
  DEATH_SHAKE_DURATION: 300,
  DEATH_SHAKE_INTENSITY: 0.015,
  DAMAGE_FLASH_DURATION: 100,
};

export const PARTICLES = {
  ENEMY_DEATH_COUNT: 6,
  XP_PICKUP_COUNT: 4,
  PLAYER_HIT_COUNT: 5,
  LEVELUP_COUNT: 20,
};

export const WAVE = {
  // At what time (seconds) new enemy types unlock
  BAT_TIME: 0,
  ZOMBIE_TIME: 30,
  SKELETON_TIME: 60,
  GHOST_TIME: 120,
  DEMON_TIME: 180,
  // Difficulty scaling every 30s
  HP_SCALE_INTERVAL: 30,
  HP_SCALE_FACTOR: 1.15,
};

// =============================================================================
// Constants.js — All magic numbers for Castle Siege Defense
// Zero hardcoded values in game logic.
// =============================================================================

export const GAME = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 500,
  MAX_DELTA: 0.05,
  MAX_DPR: 2,
};

export const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1);

// Play.fun SDK widget renders a 75px fixed bar at top:0, z-index:9999.
// All HTML overlays must account for this with padding-top or safe offset.
export const SAFE_ZONE = {
  TOP_PX: 75,          // pixels — use for CSS/HTML overlays
  TOP_PERCENT: 8,      // percent of viewport height
};

// ---------------------------------------------------------------------------
// Camera — isometric-like perspective behind and above the castle
// ---------------------------------------------------------------------------
export const CAMERA = {
  POSITION_X: 0,
  POSITION_Y: 35,
  POSITION_Z: 35,
  LOOK_AT_X: 0,
  LOOK_AT_Y: 0,
  LOOK_AT_Z: -5,
  // Camera shake
  SHAKE_IMPACT_INTENSITY: 0.3,
  SHAKE_IMPACT_DURATION: 0.15,
  SHAKE_CASTLE_HIT_INTENSITY: 0.7,
  SHAKE_CASTLE_HIT_DURATION: 0.3,
  SHAKE_DECAY: 5.0,         // exponential decay rate
  SHAKE_FREQUENCY: 30,      // oscillation speed
};

// ---------------------------------------------------------------------------
// Level / Battlefield
// ---------------------------------------------------------------------------
export const LEVEL = {
  GROUND_SIZE: 80,
  GROUND_COLOR: 0x4a7c2e,
  PATH_COLOR: 0x8B7355,
  PATH_WIDTH: 12,
  FOG_COLOR: 0x6a4f7a,       // dramatic purple-tinted fog
  FOG_NEAR: 60,
  FOG_FAR: 180,
  FOG_NEAR_WAVE_DECREASE: 3, // fog gets closer per wave (tension)
  FOG_MIN_NEAR: 30,
  // Scorch marks
  SCORCH_COLOR: 0x222211,
  SCORCH_RADIUS: 1.5,
  SCORCH_OPACITY: 0.6,
  SCORCH_FADE_SPEED: 0.02,   // fade per second
  MAX_SCORCH_MARKS: 30,
};

// ---------------------------------------------------------------------------
// Sky / Atmosphere
// ---------------------------------------------------------------------------
export const SKY = {
  ZENITH_COLOR_TOP: 0x0a0a2e,    // deep night blue at top
  ZENITH_COLOR_MID: 0x1a1a4e,    // dark blue
  HORIZON_COLOR: 0xd4602a,       // warm orange sunset
  HORIZON_GLOW: 0xff7744,        // bright glow near horizon
};

// ---------------------------------------------------------------------------
// Castle geometry
// ---------------------------------------------------------------------------
export const CASTLE = {
  // Position — castle sits at the near (positive Z) end of the battlefield
  POSITION_Z: LEVEL.GROUND_SIZE / 2 - 8,
  POSITION_Y: 0,

  // Main keep
  KEEP_WIDTH: 8,
  KEEP_HEIGHT: 10,
  KEEP_DEPTH: 8,
  KEEP_COLOR: 0xA0A0A0,

  // Corner towers
  TOWER_RADIUS: 2.5,
  TOWER_HEIGHT: 12,
  TOWER_SEGMENTS: 8,
  TOWER_COLOR: 0x909090,
  TOWER_ROOF_COLOR: 0x8B0000,
  TOWER_ROOF_HEIGHT: 3,
  TOWER_SPREAD_X: 10,
  TOWER_SPREAD_Z: 5,

  // Connecting walls
  WALL_HEIGHT: 7,
  WALL_THICKNESS: 1.5,
  WALL_COLOR: 0x989898,

  // Battlements (crenellations)
  MERLON_SIZE: 0.8,
  MERLON_SPACING: 1.6,
  MERLON_COLOR: 0x888888,

  // Gate
  GATE_WIDTH: 4,
  GATE_HEIGHT: 5,
  GATE_COLOR: 0x4a3728,

  // Damage feedback
  DAMAGE_FLASH_DURATION: 0.15,
  DAMAGE_FLASH_COLOR: 0xff3333,

  // Torch lights on towers
  TORCH_COLOR: 0xff6622,
  TORCH_INTENSITY: 1.2,
  TORCH_DISTANCE: 15,
  TORCH_FLICKER_SPEED: 8,
  TORCH_FLICKER_AMOUNT: 0.4,

  // Gate glow when enemies near
  GATE_GLOW_COLOR: 0xff2200,
  GATE_GLOW_INTENSITY: 2.0,
  GATE_GLOW_DISTANCE: 10,
  GATE_GLOW_TRIGGER_DISTANCE: 20, // how close enemies must be

  // Damage darkening
  DAMAGE_DARKEN_FACTOR: 0.4,  // at 0 health, colors darken by this factor

  // Banner wave animation
  BANNER_WAVE_SPEED: 2.0,
  BANNER_WAVE_AMOUNT: 0.15,
};

// ---------------------------------------------------------------------------
// Enemy Castle — dark fortress at the far end of the battlefield
// ---------------------------------------------------------------------------
export const ENEMY_CASTLE = {
  // Position — sits at the negative Z end of the battlefield
  POSITION_Z: -(LEVEL.GROUND_SIZE / 2 - 8),
  POSITION_Y: 0,

  // Main keep — wider and squatter than the player castle
  KEEP_WIDTH: 10,
  KEEP_HEIGHT: 8,
  KEEP_DEPTH: 8,
  KEEP_COLOR: 0x2a2a2a,       // dark stone

  // Corner towers
  TOWER_RADIUS: 2.8,
  TOWER_HEIGHT: 11,
  TOWER_SEGMENTS: 8,
  TOWER_COLOR: 0x1a1a1a,      // near-black stone
  TOWER_ROOF_COLOR: 0x330000,  // dark blood red
  TOWER_ROOF_HEIGHT: 2.5,
  TOWER_SPREAD_X: 12,
  TOWER_SPREAD_Z: 5,

  // Connecting walls
  WALL_HEIGHT: 6,
  WALL_THICKNESS: 1.8,
  WALL_COLOR: 0x222222,

  // Battlements
  MERLON_SIZE: 0.9,
  MERLON_SPACING: 1.6,
  MERLON_COLOR: 0x1a1a1a,

  // Gate — faces toward the player castle (positive Z side)
  GATE_WIDTH: 5,
  GATE_HEIGHT: 5.5,
  GATE_COLOR: 0x1a0a00,       // very dark wood

  // Glowing windows (red/orange emissive)
  WINDOW_COLOR: 0xff2200,
  WINDOW_EMISSIVE_INTENSITY: 1.5,
  WINDOW_SIZE: 0.6,
  WINDOW_ROWS: 2,
  WINDOW_COLS: 3,
  WINDOW_PULSE_SPEED: 1.5,
  WINDOW_PULSE_AMOUNT: 0.3,

  // Dark banners
  BANNER_COLOR: 0x220000,      // dark crimson
  BANNER_WAVE_SPEED: 2.5,
  BANNER_WAVE_AMOUNT: 0.18,

  // Torch lights — eerie red/orange
  TORCH_COLOR: 0xff3300,
  TORCH_INTENSITY: 1.0,
  TORCH_DISTANCE: 12,
  TORCH_FLICKER_SPEED: 10,
  TORCH_FLICKER_AMOUNT: 0.5,

  // Gate glow — menacing constant glow
  GATE_GLOW_COLOR: 0xff1100,
  GATE_GLOW_INTENSITY: 1.5,
  GATE_GLOW_DISTANCE: 15,

  // Skull decorations
  SKULL_COLOR: 0xccccaa,
  SKULL_SIZE: 0.5,

  // Smoke/ambient particles from chimneys
  SMOKE_COLOR: 0x333333,
};

// ---------------------------------------------------------------------------
// Enemies
// ---------------------------------------------------------------------------
export const ENEMY = {
  // Body dimensions — slightly larger for visibility
  BODY_WIDTH: 1.0,
  BODY_HEIGHT: 2.0,
  BODY_DEPTH: 0.8,
  HEAD_RADIUS: 0.45,
  HEAD_Y_OFFSET: 1.65,

  // Colors per wave tier (cycles through)
  BODY_COLOR: 0x8B0000,
  HEAD_COLOR: 0xd4a574,
  SHIELD_COLOR: 0x555555,
  WAVE_COLORS: [
    0x8B0000,  // dark red — wave 1
    0x006400,  // dark green — wave 2
    0x00008B,  // dark blue — wave 3
    0x4B0082,  // indigo — wave 4
    0x8B4513,  // saddle brown — wave 5
    0x2F4F4F,  // dark slate — wave 6+
  ],

  // Shield/weapon details
  SHIELD_WIDTH: 0.7,
  SHIELD_HEIGHT: 0.9,
  SWORD_LENGTH: 1.2,
  SWORD_COLOR: 0xaaaaaa,
  SWORD_HANDLE_COLOR: 0x4a3728,

  // Movement
  BASE_SPEED: 4,
  SPEED_INCREASE_PER_WAVE: 0.1,  // multiplier added per wave

  // Spawn — enemies emerge from the enemy castle gate
  SPAWN_Z: ENEMY_CASTLE.POSITION_Z + ENEMY_CASTLE.TOWER_SPREAD_Z + 2,
  SPAWN_X_RANGE: ENEMY_CASTLE.GATE_WIDTH * 1.5,
  LANE_COUNT: 5,

  // Health
  HEALTH: 1,

  // Castle damage
  CASTLE_DAMAGE: 10,

  // Score
  KILL_POINTS: 10,

  // Y position (half body height)
  GROUND_Y: 1.0,

  // Death animation
  DEATH_FLASH_COLOR: 0xffffff,
  DEATH_FADE_DURATION: 0.5,

  // Dust particles while marching
  DUST_INTERVAL: 0.25,        // seconds between dust puffs
  DUST_COLOR: 0x9B8B6B,
};

// ---------------------------------------------------------------------------
// Projectiles
// ---------------------------------------------------------------------------
export const PROJECTILE = {
  RADIUS: 0.4,
  COLOR: 0xff8800,
  GLOW_COLOR: 0xffaa33,
  ARC_HEIGHT: 15,
  TRAVEL_TIME: 0.8,
  COOLDOWN: 0.35,
  SPLASH_RADIUS: 3.5,

  // Launch position (from castle top)
  LAUNCH_Y: 12,
  LAUNCH_Z: LEVEL.GROUND_SIZE / 2 - 8,

  // Impact effect
  IMPACT_RADIUS: 2.0,
  IMPACT_DURATION: 0.3,
  IMPACT_COLOR: 0xff6600,

  // Fire trail
  TRAIL_PARTICLE_COUNT: 8,
  TRAIL_COLORS: [0xff8800, 0xff4400, 0xff2200, 0xffaa00],
  TRAIL_SIZE: 0.2,
  TRAIL_FADE_SPEED: 3.0,
  TRAIL_SPREAD: 0.15,
};

// ---------------------------------------------------------------------------
// Particle system
// ---------------------------------------------------------------------------
export const PARTICLES = {
  // Pool sizes
  MAX_PARTICLES: 300,

  // Explosion burst on projectile impact
  EXPLOSION_COUNT: 18,
  EXPLOSION_COLORS: [0xff8800, 0xff4400, 0xff2200, 0xffcc00, 0xff6600],
  EXPLOSION_SPEED_MIN: 4,
  EXPLOSION_SPEED_MAX: 12,
  EXPLOSION_SIZE_MIN: 0.15,
  EXPLOSION_SIZE_MAX: 0.4,
  EXPLOSION_LIFETIME: 0.8,
  EXPLOSION_GRAVITY: -15,

  // Enemy death fragments
  DEATH_COUNT: 10,
  DEATH_COLORS: [0x8B0000, 0x444444, 0x666666, 0xd4a574],
  DEATH_SPEED_MIN: 3,
  DEATH_SPEED_MAX: 8,
  DEATH_SIZE_MIN: 0.1,
  DEATH_SIZE_MAX: 0.3,
  DEATH_LIFETIME: 0.7,
  DEATH_GRAVITY: -12,

  // Dust puffs at enemy feet
  DUST_COUNT: 3,
  DUST_COLOR: 0x9B8B6B,
  DUST_SPEED: 1.5,
  DUST_SIZE: 0.2,
  DUST_LIFETIME: 0.5,
  DUST_RISE_SPEED: 1.0,

  // Castle hit sparks / debris
  CASTLE_HIT_COUNT: 12,
  CASTLE_HIT_COLORS: [0x999999, 0x777777, 0xaaaaaa, 0x888888],
  CASTLE_HIT_SPEED_MIN: 2,
  CASTLE_HIT_SPEED_MAX: 7,
  CASTLE_HIT_SIZE_MIN: 0.1,
  CASTLE_HIT_SIZE_MAX: 0.25,
  CASTLE_HIT_LIFETIME: 0.6,
  CASTLE_HIT_GRAVITY: -10,

  // Impact flash
  IMPACT_FLASH_SIZE: 3.0,
  IMPACT_FLASH_DURATION: 0.12,
  IMPACT_FLASH_COLOR: 0xffff88,
};

// ---------------------------------------------------------------------------
// Wave system
// ---------------------------------------------------------------------------
export const WAVE = {
  BASE_ENEMY_COUNT: 5,
  ENEMY_INCREMENT: 3,
  SPAWN_INTERVAL: 0.8,        // seconds between each enemy spawn
  PAUSE_BETWEEN_WAVES: 3.0,   // seconds between waves
  COMPLETION_BONUS: 50,        // bonus points per wave completed
};

// ---------------------------------------------------------------------------
// UI Juice
// ---------------------------------------------------------------------------
export const UI_JUICE = {
  // Floating damage numbers
  DAMAGE_NUMBER_RISE_SPEED: 60,  // px per second
  DAMAGE_NUMBER_LIFETIME: 1.2,
  DAMAGE_NUMBER_COLOR: '#ff4444',
  DAMAGE_NUMBER_FONT_SIZE: 28,

  // Kill combo
  COMBO_WINDOW: 1.5,         // seconds to chain kills
  COMBO_MIN_KILLS: 2,        // minimum for combo text
  COMBO_COLORS: ['#ffaa00', '#ff6600', '#ff0000', '#ff00ff'],
  COMBO_FONT_SIZE: 36,
  COMBO_LIFETIME: 1.5,

  // Health bar pulse
  HEALTH_PULSE_THRESHOLD: 25, // percent
  HEALTH_PULSE_SPEED: 4,
  HEALTH_PULSE_SCALE: 1.08,

  // Wave banner slide
  BANNER_SLIDE_DURATION: 400, // ms

  // Screen effects
  VIGNETTE_FLASH_DURATION: 0.3,
  VIGNETTE_FLASH_OPACITY: 0.4,

  // Screen tint as health drops
  SCREEN_TINT_START_HEALTH: 50, // below this %, tint starts
  SCREEN_TINT_MAX_OPACITY: 0.15,

  // Victory glow
  VICTORY_GLOW_DURATION: 1.0,
  VICTORY_GLOW_COLOR: '#ffdd44',
  VICTORY_GLOW_OPACITY: 0.25,
};

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------
export const AUDIO = {
  // BGM tempos (cycles per minute)
  GAMEPLAY_CPM: 120,
  GAMEOVER_CPM: 60,

  // BGM gain levels (keep low — BGM should not overpower gameplay)
  BGM_LEAD_GAIN: 0.14,
  BGM_PAD_GAIN: 0.10,
  BGM_BASS_GAIN: 0.18,
  BGM_DRUMS_GAIN: 0.22,
  BGM_ARP_GAIN: 0.05,

  // SFX gain levels
  SFX_LAUNCH_GAIN: 0.25,
  SFX_EXPLOSION_GAIN: 0.3,
  SFX_ENEMY_DEATH_GAIN: 0.2,
  SFX_CASTLE_HIT_GAIN: 0.3,
  SFX_WAR_HORN_GAIN: 0.2,
  SFX_CASTLE_DESTROYED_GAIN: 0.35,
  SFX_SCORE_GAIN: 0.2,

  // Fanfare duration (ms) before resuming gameplay BGM
  FANFARE_DURATION: 2500,
};

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
export const COLORS = {
  SKY: 0x1a1a3e,              // dark dramatic sky (matches sunset theme)
  AMBIENT_LIGHT: 0xffeedd,
  AMBIENT_INTENSITY: 0.4,     // lower ambient for more dramatic lighting
  DIR_LIGHT: 0xffa060,        // warm sunset directional
  DIR_INTENSITY: 1.2,
  HEMISPHERE_SKY: 0xff7744,   // sunset orange above
  HEMISPHERE_GROUND: 0x2a4a1e, // dark green ground bounce
  HEMISPHERE_INTENSITY: 0.3,
};

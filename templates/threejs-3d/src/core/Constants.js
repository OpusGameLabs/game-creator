export const GAME = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,
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

export const PLAYER = {
  SIZE: 1,
  SPEED: 5,
  TURN_SPEED: 10,
  START_X: 0,
  START_Y: 0,
  START_Z: 0,
  COLOR: 0x44aaff,
};

export const LEVEL = {
  GROUND_SIZE: 50,
  GROUND_COLOR: 0x4a7c2e,
  FOG_COLOR: 0x87ceeb,
  FOG_NEAR: 20,
  FOG_FAR: 80,
};

// Third-person camera (OrbitControls)
export const CAMERA = {
  HEIGHT: 3,
  DISTANCE: 6,
  MIN_DISTANCE: 3,
  MAX_DISTANCE: 15,
};

export const COLORS = {
  SKY: 0x87ceeb,
  AMBIENT_LIGHT: 0xffffff,
  AMBIENT_INTENSITY: 0.6,
  DIR_LIGHT: 0xffffff,
  DIR_INTENSITY: 0.8,
  PLAYER: 0x44aaff,
};

// Default character — Soldier from three.js repo
// Copy GLB from assets/3d-characters/ to public/assets/models/ during game scaffold
// Or download: curl -L -o public/assets/models/Soldier.glb "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb"
export const CHARACTER = {
  path: 'assets/models/Soldier.glb',
  scale: 1,
  offsetY: 0,
  facingOffset: Math.PI, // Soldier faces -Z
  clipMap: { idle: 'Idle', walk: 'Walk', run: 'Run' },
};

// Static model paths and per-model transforms
export const ASSET_PATHS = {};
export const MODEL_CONFIG = {};

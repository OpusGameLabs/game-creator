export const GAME = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,
  MAX_DELTA: 0.05,
  MAX_DPR: 2,
};

export const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1);

export const SAFE_ZONE = { TOP_PX: 75, TOP_PERCENT: 8 };

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
  GROUND_SIZE: 80,
  GROUND_COLOR: 0x4a7c2e,
  FOG_COLOR: 0x87ceeb,
  FOG_NEAR: 30,
  FOG_FAR: 70,
};

export const CAMERA = {
  HEIGHT: 3,
  DISTANCE: 6,
  MIN_DISTANCE: 3,
  MAX_DISTANCE: 15,
};

export const COLORS = {
  SKY: 0x87ceeb,
  AMBIENT_LIGHT: 0xffffff,
  AMBIENT_INTENSITY: 0.7,
  DIR_LIGHT: 0xffffff,
  DIR_INTENSITY: 0.9,
  PLAYER: 0x44aaff,
};

// Playable characters — cycle with C key or button
// Each needs: Idle, Walk, Run clips (name mapping varies per model)
// facingOffset: added to atan2 when computing model facing direction.
// Models that face -Z in their rest pose need Math.PI.
// Models that face +Z in their rest pose need 0.
export const CHARACTERS = [
  {
    name: 'Soldier',
    path: 'assets/models/Soldier.glb',
    scale: 1,
    offsetY: 0,
    facingOffset: Math.PI, // Soldier faces -Z
    clipMap: { idle: 'Idle', walk: 'Walk', run: 'Run' },
  },
  {
    name: 'Xbot',
    path: 'assets/models/Xbot.glb',
    scale: 1,
    offsetY: 0,
    facingOffset: 0, // Xbot faces +Z
    clipMap: { idle: 'idle', walk: 'walk', run: 'run' },
  },
  {
    name: 'Robot',
    path: 'assets/models/RobotExpressive.glb',
    scale: 1,
    offsetY: 0,
    facingOffset: 0, // Robot faces +Z
    clipMap: { idle: 'Idle', walk: 'Walking', run: 'Running' },
  },
  {
    name: 'Fox',
    path: 'assets/models/Fox.glb',
    scale: 0.02,
    offsetY: 0,
    facingOffset: 0, // Fox faces +Z
    clipMap: { idle: 'Survey', walk: 'Walk', run: 'Run' },
  },
];

export const ASSET_PATHS = {
  ENEMY: 'assets/models/RobotExpressive.glb',
  FOX: 'assets/models/Fox.glb',
  BARREL: 'assets/models/barrel/barrel.gltf',
  CRATE: 'assets/models/crate/crate.gltf',
};

export const MODEL_CONFIG = {
  ENEMY: { scale: 1, rotationY: 0, offsetY: 0 },
  FOX: { scale: 0.02, rotationY: 0, offsetY: 0 },
  BARREL: { scale: 1.5, rotationY: 0, offsetY: 0 },
  CRATE: { scale: 2, rotationY: 0, offsetY: 0 },
};

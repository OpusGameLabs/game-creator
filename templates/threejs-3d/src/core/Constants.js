export const GAME = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,
  MAX_DELTA: 0.05,
  MAX_DPR: 2,
};

export const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1);

export const PLAYER = {
  SIZE: 1,
  SPEED: 5,
  START_X: 0,
  START_Y: 0.5,
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

export const CAMERA = {
  OFFSET_X: 0,
  OFFSET_Y: 8,
  OFFSET_Z: 10,
  LOOK_OFFSET_Y: 0,
};

export const COLORS = {
  SKY: 0x87ceeb,
  AMBIENT_LIGHT: 0xffffff,
  AMBIENT_INTENSITY: 0.6,
  DIR_LIGHT: 0xffffff,
  DIR_INTENSITY: 0.8,
  PLAYER: 0x44aaff,
};

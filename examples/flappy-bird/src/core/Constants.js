export const GAME_CONFIG = {
  width: 400,
  height: 600,
  gravity: 1200,
  backgroundColor: 0x4ec0ca,
};

export const BIRD_CONFIG = {
  x: 100,
  startY: 300,
  flapVelocity: -380,
  maxVelocity: 600,
  tiltUpAngle: -25,
  tiltDownAngle: 70,
  size: 20,
  color: 0xf5d742,
};

export const PIPE_CONFIG = {
  speed: 180,
  spawnInterval: 1600,
  gapSize: 150,
  width: 52,
  minTopHeight: 50,
  maxTopHeight: 350,
  color: 0x73bf2e,
  capColor: 0x5a9a23,
  capHeight: 20,
  capExtraWidth: 6,
};

export const GROUND_CONFIG = {
  height: 80,
  color: 0xded895,
  speed: 180,
};

export const SKY_CONFIG = {
  topColor: 0x4ec0ca,
  bottomColor: 0xc3e8f0,
  cloudCount: 5,
  cloudSpeed: 18,
  cloudAlpha: 0.55,
  cloudColors: [0xffffff, 0xf0f4f5, 0xe6eef0],
  cloudMinY: 30,
  cloudMaxY: 280,
};

export const PARTICLES_CONFIG = {
  scoreBurstCount: 8,
  scoreBurstColor: 0xfce878,
  scoreBurstSpeed: 70,
  scoreBurstDuration: 450,
  flapDustCount: 4,
  flapDustColor: 0xffffff,
  flapDustSpeed: 30,
  flapDustDuration: 300,
  deathBurstCount: 14,
  deathBurstColor: 0xffffff,
  deathBurstSpeed: 100,
  deathBurstDuration: 500,
};

export const TRANSITION_CONFIG = {
  fadeDuration: 250,
  deathSlowMoScale: 0.25,
  deathSlowMoDuration: 500,
};

export const COLORS = {
  sky: 0x4ec0ca,
  ground: 0xded895,
  groundDark: 0xb8a850,
  grassGreen: 0x8ec63f,
  grassDarkGreen: 0x6da52e,
  pipe: 0x73bf2e,
  pipeHighlight: 0x8ad432,
  pipeCap: 0x5a9a23,
  bird: 0xf5d742,
  birdBeak: 0xe87d24,
  birdEye: 0xffffff,
  birdPupil: 0x000000,
  birdWing: 0xe8c63a,
  text: '#ffffff',
  textStroke: '#000000',
  scoreText: '#ffffff',
  scoreFloat: '#ffff00',
  scoreFloatStroke: '#000000',
  panelFill: 0xdeb858,
  panelBorder: 0x846830,
  panelText: '#5a4020',
  btnFill: 0x6cbf3b,
  btnBorder: 0x4a8a28,
};

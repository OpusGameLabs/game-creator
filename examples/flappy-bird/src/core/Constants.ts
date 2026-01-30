export const GAME_CONFIG = {
  width: 400,
  height: 600,
  gravity: 1200,
  backgroundColor: 0x4ec0ca,
} as const;

export const BIRD_CONFIG = {
  x: 100,
  startY: 300,
  flapVelocity: -380,
  maxVelocity: 600,
  tiltUpAngle: -25,
  tiltDownAngle: 70,
  size: 20,
  color: 0xf5d742,
  // Squash/stretch
  flapSquashX: 1.3,
  flapSquashY: 0.7,
  squashDuration: 80,
  stretchMaxX: 0.85,
  stretchMaxY: 1.2,
  // Death
  deathSpinSpeed: 720,
  deathFallVelocity: 400,
} as const;

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
} as const;

export const DIFFICULTY_CONFIG = {
  // Score thresholds where difficulty increases
  startScore: 0,
  maxScore: 40,
  // Gap shrinks from 150 to 110
  gapStart: 150,
  gapEnd: 110,
  // Speed increases from 180 to 260
  speedStart: 180,
  speedEnd: 260,
  // Spawn interval decreases from 1600 to 1200
  intervalStart: 1600,
  intervalEnd: 1200,
  // Sky shifts to sunset (top color)
  skyStartTop: 0x4ec0ca,
  skyEndTop: 0xe8845a,
  skyStartBottom: 0xc3e8f0,
  skyEndBottom: 0xf0c878,
} as const;

export const GROUND_CONFIG = {
  height: 80,
  color: 0xded895,
  speed: 180,
} as const;

export const SKY_CONFIG = {
  topColor: 0x4ec0ca,
  bottomColor: 0xc3e8f0,
  cloudCount: 5,
  cloudSpeed: 18,
  cloudAlpha: 0.55,
  cloudColors: [0xffffff, 0xf0f4f5, 0xe6eef0] as readonly number[],
  cloudMinY: 30,
  cloudMaxY: 280,
} as const;

export const PARALLAX_CONFIG = {
  // Far mountains — slowest layer
  farColor: 0x7ab5c4,
  farAlpha: 0.5,
  farSpeed: 12,
  farBaseY: 380,
  farPeakMin: 60,
  farPeakMax: 110,
  farSegmentWidth: 80,
  // Near hills — medium layer
  nearColor: 0x8ec63f,
  nearAlpha: 0.4,
  nearSpeed: 40,
  nearBaseY: 440,
  nearPeakMin: 30,
  nearPeakMax: 60,
  nearSegmentWidth: 60,
  // Ground scroll
  groundScrollSpeed: 180,
} as const;

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
} as const;

export const MEDAL_CONFIG = {
  bronze: { threshold: 5, color: 0xcd7f32, label: 'BRONZE' },
  silver: { threshold: 15, color: 0xc0c0c0, label: 'SILVER' },
  gold: { threshold: 25, color: 0xffd700, label: 'GOLD' },
  platinum: { threshold: 40, color: 0xe5e4e2, label: 'PLATINUM' },
} as const;

export const TRANSITION_CONFIG = {
  fadeDuration: 250,
  deathSlowMoScale: 0.25,
  deathSlowMoDuration: 500,
} as const;

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
} as const;

import * as THREE from "/node_modules/three/build/three.module.js";

// ── Constants ──
const BOT_COUNT = 1000;
const HALL_LENGTH = 100;
const HALL_WIDTH = 28;
const HALL_HEIGHT = 6;
const HIT_RADIUS = 0.55;

// ── PRNG ──
function createRng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = createRng(42);

// ── Renderer ──
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// ── Scene ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2030);
scene.fog = new THREE.Fog(0x1a2030, 30, 80);

// ── Lighting — warm indoor terminal ──
scene.add(new THREE.HemisphereLight(0xccddee, 0x444433, 0.4));
const mainLight = new THREE.DirectionalLight(0xffeedd, 1.2);
mainLight.position.set(10, HALL_HEIGHT - 0.5, 20);
scene.add(mainLight);
const fillLight = new THREE.DirectionalLight(0x8899bb, 0.5);
fillLight.position.set(-10, 4, -15);
scene.add(fillLight);

// ── Camera ──
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);

// ── Materials ──
const matFloor = new THREE.MeshStandardMaterial({ color: 0xc0b8a8, roughness: 0.25, metalness: 0.05 });
const matFloorTile = new THREE.MeshStandardMaterial({ color: 0xa8a090, roughness: 0.3, metalness: 0.05 });
const matCeiling = new THREE.MeshStandardMaterial({ color: 0xe0dcd8, roughness: 0.9 });
const matWall = new THREE.MeshStandardMaterial({ color: 0xd0ccc4, roughness: 0.8 });
const matWallDark = new THREE.MeshStandardMaterial({ color: 0x888480, roughness: 0.7 });
const matWindow = new THREE.MeshStandardMaterial({ color: 0x88bbdd, roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.3 });
const matColumn = new THREE.MeshStandardMaterial({ color: 0xc8c0b8, roughness: 0.5, metalness: 0.1 });
const matSeat = new THREE.MeshStandardMaterial({ color: 0x334488, roughness: 0.7 });
const matSeatFrame = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.6 });
const matCounter = new THREE.MeshStandardMaterial({ color: 0x556068, roughness: 0.5, metalness: 0.15 });
const matCounterTop = new THREE.MeshStandardMaterial({ color: 0x222833, roughness: 0.3, metalness: 0.3 });
const matBurgerRed = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.6 });
const matBurgerYellow = new THREE.MeshStandardMaterial({ color: 0xddaa22, roughness: 0.5 });
const matShelf = new THREE.MeshStandardMaterial({ color: 0x665544, roughness: 0.7 });
const matSign = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.3, metalness: 0.1 });
const matSignGreen = new THREE.MeshBasicMaterial({ color: 0x22cc44 });
const matSignWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
const matLightPanel = new THREE.MeshBasicMaterial({ color: 0xeeeeff });
const matTarmac = new THREE.MeshStandardMaterial({ color: 0x556060, roughness: 0.95 });
const matPlane = new THREE.MeshStandardMaterial({ color: 0xe8e4e0, roughness: 0.4, metalness: 0.3 });
const matPlaneStripe = new THREE.MeshStandardMaterial({ color: 0x2244aa, roughness: 0.5 });
const matPlaneTail = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 });
const matLuggage = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
const matBarrier = new THREE.MeshStandardMaterial({ color: 0xaaaa88, roughness: 0.4, metalness: 0.5 });
const matBarrierBelt = new THREE.MeshStandardMaterial({ color: 0x2233aa, roughness: 0.6 });
const matMezzanine = new THREE.MeshStandardMaterial({ color: 0xb0a898, roughness: 0.35, metalness: 0.05 });
const matRailing = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.3, metalness: 0.7 });
const matTable = new THREE.MeshStandardMaterial({ color: 0xddd8d0, roughness: 0.4 });

// ── Airport Terminal — MW2 Terminal inspired ──
const halfL = HALL_LENGTH / 2;
const halfW = HALL_WIDTH / 2;
const m4 = new THREE.Matrix4();

function box(mat, w, h, d, x, y, z, ry = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  if (ry) mesh.rotation.y = ry;
  scene.add(mesh);
  return mesh;
}
function plane(mat, w, h, x, y, z, rx = 0, ry = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.x = rx; mesh.rotation.y = ry;
  scene.add(mesh);
  return mesh;
}

// Floor — main hall (polished tile)
plane(matFloor, HALL_WIDTH, HALL_LENGTH, 0, 0, 0, -Math.PI / 2);
// Floor accent stripes
for (let i = -2; i <= 2; i++) {
  plane(matFloorTile, 0.4, HALL_LENGTH, i * 5, 0.005, 0, -Math.PI / 2);
}

// Ceiling
plane(matCeiling, HALL_WIDTH, HALL_LENGTH, 0, HALL_HEIGHT, 0, Math.PI / 2);

// ── Walls ──
// East wall (window wall — facing tarmac)
plane(matWallDark, HALL_LENGTH, 1.2, halfW, 0.6, 0, 0, -Math.PI / 2);
plane(matWallDark, HALL_LENGTH, 1.0, halfW, HALL_HEIGHT - 0.5, 0, 0, -Math.PI / 2);

// Windows (instanced)
const WINDOW_COUNT = 25;
const winW = HALL_LENGTH / WINDOW_COUNT - 0.4;
const windowIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(winW, 3.8), matWindow, WINDOW_COUNT);
for (let i = 0; i < WINDOW_COUNT; i++) {
  const z = -halfL + (i + 0.5) * (HALL_LENGTH / WINDOW_COUNT);
  m4.makeRotationY(-Math.PI / 2);
  m4.setPosition(halfW - 0.01, HALL_HEIGHT / 2 - 0.1, z);
  windowIM.setMatrixAt(i, m4);
}
windowIM.instanceMatrix.needsUpdate = true;
scene.add(windowIM);

// Window mullions
const mullionGeo = new THREE.BoxGeometry(0.08, 3.8, 0.08);
for (let i = 0; i <= WINDOW_COUNT; i++) {
  const z = -halfL + i * (HALL_LENGTH / WINDOW_COUNT);
  const m = new THREE.Mesh(mullionGeo, matSeatFrame);
  m.position.set(halfW - 0.02, HALL_HEIGHT / 2 - 0.1, z);
  scene.add(m);
}

// West wall (shops/gates side)
plane(matWall, HALL_LENGTH, HALL_HEIGHT, -halfW, HALL_HEIGHT / 2, 0, 0, Math.PI / 2);

// End walls
plane(matWall, HALL_WIDTH, HALL_HEIGHT, 0, HALL_HEIGHT / 2, -halfL);
plane(matWall, HALL_WIDTH, HALL_HEIGHT, 0, HALL_HEIGHT / 2, halfL, 0, Math.PI);

// ── Columns — two rows ──
const COLUMN_COUNT = 20;
const columnIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, HALL_HEIGHT, 0.6), matColumn, COLUMN_COUNT);
for (let i = 0; i < COLUMN_COUNT; i++) {
  const z = -halfL + 5 + i * (HALL_LENGTH / COLUMN_COUNT);
  const x = i % 2 === 0 ? -5 : 5;
  m4.makeTranslation(x, HALL_HEIGHT / 2, z);
  columnIM.setMatrixAt(i, m4);
}
columnIM.instanceMatrix.needsUpdate = true;
scene.add(columnIM);

// ── Ceiling lights — fluorescent strips ──
const LIGHT_COUNT = 30;
const lightIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.6, 4), matLightPanel, LIGHT_COUNT);
for (let i = 0; i < LIGHT_COUNT; i++) {
  const z = -halfL + 3 + i * (HALL_LENGTH / LIGHT_COUNT);
  const x = (i % 3 - 1) * 6;
  m4.makeRotationX(Math.PI / 2);
  m4.setPosition(x, HALL_HEIGHT - 0.02, z);
  lightIM.setMatrixAt(i, m4);
}
lightIM.instanceMatrix.needsUpdate = true;
scene.add(lightIM);

// ══════════════════════════════════════════
// ── BURGER TOWN (south-west corner) ──
// ══════════════════════════════════════════
const btZ = halfL - 12;
const btX = -halfW + 5;
// Counter (L-shaped)
box(matBurgerRed, 5, 1.1, 0.6, btX, 0.55, btZ);
box(matBurgerRed, 0.6, 1.1, 3, btX - 2.7, 0.55, btZ + 1.5);
box(matCounterTop, 5.2, 0.06, 0.7, btX, 1.12, btZ);
// Menu board behind counter
box(matSign, 4, 2, 0.1, btX, 3.5, btZ + 0.5);
box(matBurgerYellow, 3.5, 0.3, 0.1, btX, 4.2, btZ + 0.48);
// Stools
for (let i = 0; i < 4; i++) {
  box(matSeatFrame, 0.3, 0.6, 0.3, btX - 1.5 + i * 1.2, 0.3, btZ - 0.8);
}

// ══════════════════════════════════════════
// ── BOOKSTORE (mid-west) ──
// ══════════════════════════════════════════
const bsZ = 0;
const bsX = -halfW + 3;
// Shelving units
for (let i = 0; i < 3; i++) {
  box(matShelf, 0.4, 2.2, 2.5, bsX + i * 1.8, 1.1, bsZ);
}
// Front display table
box(matTable, 3, 0.7, 1.2, bsX + 2.5, 0.35, bsZ - 2.5);
// Overhead sign
box(matSign, 3, 0.5, 0.1, bsX + 2, 3.8, bsZ - 3.5);
box(matSignWhite, 2, 0.25, 0.1, bsX + 2, 3.8, bsZ - 3.48);

// ══════════════════════════════════════════
// ── CHECK-IN COUNTERS (north end) ──
// ══════════════════════════════════════════
for (let i = 0; i < 6; i++) {
  const z = -halfL + 4 + i * 3.5;
  box(matCounter, 3.5, 1.1, 0.6, 0, 0.55, z);
  box(matCounterTop, 3.7, 0.06, 0.7, 0, 1.12, z);
}

// ══════════════════════════════════════════
// ── SECURITY BARRIERS (north-center) ──
// ══════════════════════════════════════════
const barrierPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6);
const beltGeo = new THREE.BoxGeometry(0.02, 0.06, 2.5);
for (let row = 0; row < 3; row++) {
  const z = -halfL + 26 + row * 3;
  for (let col = 0; col < 4; col++) {
    const x = -4 + col * 2.8;
    const post = new THREE.Mesh(barrierPostGeo, matBarrier);
    post.position.set(x, 0.45, z);
    scene.add(post);
    if (col < 3) {
      const belt = new THREE.Mesh(beltGeo, matBarrierBelt);
      belt.position.set(x + 1.4, 0.7, z);
      scene.add(belt);
    }
  }
}

// ══════════════════════════════════════════
// ── SEATING CLUSTERS (scattered through hall) ──
// ══════════════════════════════════════════
const TOTAL_SEATS = 80;
const seatIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), matSeat, TOTAL_SEATS);
const seatFrameIM = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 0.04, 0.55), matSeatFrame, TOTAL_SEATS / 4);
let si = 0, sfi = 0;
const seatClusters = [
  { x: 8, z: -20 }, { x: 8, z: -10 }, { x: 8, z: 5 }, { x: 8, z: 15 }, { x: 8, z: 30 },
  { x: -8, z: -15 }, { x: -8, z: 10 }, { x: -8, z: 25 }, { x: -8, z: 38 },
  { x: 3, z: 35 }, { x: -3, z: -30 },
];
for (const cl of seatClusters) {
  // 4-seat row
  m4.makeTranslation(cl.x, 0.02, cl.z);
  if (sfi < TOTAL_SEATS / 4) seatFrameIM.setMatrixAt(sfi++, m4);
  for (let s = 0; s < 4; s++) {
    if (si >= TOTAL_SEATS) break;
    m4.makeTranslation(cl.x - 0.85 + s * 0.6, 0.24, cl.z);
    seatIM.setMatrixAt(si++, m4);
  }
}
// Fill remaining with zero
for (; si < TOTAL_SEATS; si++) seatIM.setMatrixAt(si, new THREE.Matrix4().makeScale(0, 0, 0));
for (; sfi < TOTAL_SEATS / 4; sfi++) seatFrameIM.setMatrixAt(sfi, new THREE.Matrix4().makeScale(0, 0, 0));
seatIM.instanceMatrix.needsUpdate = true;
seatFrameIM.instanceMatrix.needsUpdate = true;
scene.add(seatIM);
scene.add(seatFrameIM);

// ══════════════════════════════════════════
// ── LUGGAGE (scattered) ──
// ══════════════════════════════════════════
const luggageColors = [0x333333, 0x882222, 0x224488, 0x228844, 0x666666];
for (let i = 0; i < 25; i++) {
  const lx = (rng() - 0.5) * (HALL_WIDTH - 8);
  const lz = -halfL + 20 + rng() * (HALL_LENGTH - 30);
  const s = 0.25 + rng() * 0.2;
  const lug = new THREE.Mesh(
    new THREE.BoxGeometry(s * 1.2, s, s * 0.5),
    new THREE.MeshStandardMaterial({ color: luggageColors[i % 5], roughness: 0.6 }),
  );
  lug.position.set(lx, s / 2, lz);
  lug.rotation.y = rng() * Math.PI;
  scene.add(lug);
}

// ══════════════════════════════════════════
// ── MEZZANINE / DINING OVERLOOK (south end) ──
// ══════════════════════════════════════════
const mezW = HALL_WIDTH - 2;
const mezH = 3.2;
const mezDepth = 9;
const mezZ = halfL - mezDepth / 2 - 0.5; // center of mezzanine slab
const mezNorthEdge = mezZ - mezDepth / 2; // front edge facing the hall

// Ramp dimensions — connects ground level to mezzanine top smoothly
// Placed on east (window) side to avoid Burger Town colliders
const rampW = 3.0;
const rampLen = 12;
const rampX = halfW - 4;
const rampSouthZ = mezNorthEdge;          // ramp meets mezzanine at its north edge
const rampNorthZ = rampSouthZ - rampLen;  // ramp starts here at ground level

// Mezzanine floor slab — pulled back 1 unit from north edge so ramp has room to dock
const mezSlabNorth = mezNorthEdge + 1.0;
const mezSlabDepth = mezDepth - 1.0;
const mezSlabZ = mezSlabNorth + mezSlabDepth / 2;
box(matMezzanine, mezW, 0.2, mezSlabDepth, 0, mezH, mezSlabZ);
// Underside
box(matWallDark, mezW, 0.05, mezSlabDepth, 0, mezH - 0.12, mezSlabZ);
// Front face lip — only on sides away from the ramp opening
const lipLeftW = (rampX - rampW / 2) - (-mezW / 2);
if (lipLeftW > 0.5) {
  box(matWallDark, lipLeftW, mezH, 0.1, -mezW / 2 + lipLeftW / 2, mezH / 2, mezSlabNorth - 0.05);
}
const lipRightW = (mezW / 2) - (rampX + rampW / 2);
if (lipRightW > 0.5) {
  box(matWallDark, lipRightW, mezH, 0.1, mezW / 2 - lipRightW / 2, mezH / 2, mezSlabNorth - 0.05);
}

// Railing along the north slab edge
for (let i = 0; i < 18; i++) {
  const rx = -mezW / 2 + 1 + i * (mezW - 2) / 17;
  if (rx > rampX - rampW / 2 - 0.5 && rx < rampX + rampW / 2 + 0.5) continue;
  box(matRailing, 0.05, 1.0, 0.05, rx, mezH + 0.6, mezSlabNorth);
}
// Horizontal rail bars (left and right of ramp opening)
const railLeftEnd = rampX - rampW / 2 - 0.5;
const railRightStart = rampX + rampW / 2 + 0.5;
if (railLeftEnd > -mezW / 2 + 1.5) {
  box(matRailing, railLeftEnd - (-mezW / 2 + 1), 0.06, 0.06, (-mezW / 2 + 1 + railLeftEnd) / 2, mezH + 1.1, mezSlabNorth);
}
if (railRightStart < mezW / 2 - 1.5) {
  box(matRailing, mezW / 2 - 1 - railRightStart, 0.06, 0.06, (railRightStart + mezW / 2 - 1) / 2, mezH + 1.1, mezSlabNorth);
}

// Dining tables on mezzanine
for (let i = 0; i < 5; i++) {
  box(matTable, 1.2, 0.7, 0.8, -6 + i * 3, mezH + 0.55, mezSlabZ);
}

// ── Ramp — smooth slope from ground to mezzanine top ──
// The ramp visual overlaps 1 unit INTO the mezzanine slab zone for seamless join
const rampVisualLen = rampLen + 1.0;
const rampAngle = Math.atan2(mezH + 0.1, rampVisualLen);
const rampGeo = new THREE.BoxGeometry(rampW, 0.15, rampVisualLen);
const rampMesh = new THREE.Mesh(rampGeo, matMezzanine);
// Position center of the ramp so south end (high) lands at mezzanine top surface
const rampCenterZ = rampNorthZ + rampVisualLen / 2;
const rampCenterY = (mezH + 0.1) / 2;
rampMesh.position.set(rampX, rampCenterY, rampCenterZ);
rampMesh.rotation.x = -rampAngle;
scene.add(rampMesh);
// Low side walls along the ramp
for (let side = -1; side <= 1; side += 2) {
  const wallMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.4, rampVisualLen),
    matRailing,
  );
  wallMesh.position.set(rampX + side * (rampW / 2), rampCenterY, rampCenterZ);
  wallMesh.rotation.x = -rampAngle;
  scene.add(wallMesh);
}

// ══════════════════════════════════════════
// ── GATE SIGNS (west wall) ──
// ══════════════════════════════════════════
const gates = ["A1", "A2", "A3", "A4", "A5"];
for (let i = 0; i < gates.length; i++) {
  const z = -halfL + 12 + i * 18;
  box(matSign, 0.08, 0.5, 2, -halfW + 0.06, 4.5, z, 0);
  box(matSignGreen, 0.08, 0.2, 1, -halfW + 0.08, 4.5, z, 0);
}

// ══════════════════════════════════════════
// ── TARMAC + PARKED PLANE (outside windows) ──
// ══════════════════════════════════════════
// Tarmac
plane(matTarmac, 80, HALL_LENGTH, halfW + 40, -0.3, 0, -Math.PI / 2);

// Plane — blocky jet airliner
const planeZ = 10;
const planeX = halfW + 18;
// Fuselage
box(matPlane, 3.0, 3.0, 28, planeX, 2.5, planeZ);
// Nose cone
box(matPlane, 2.0, 2.0, 4, planeX, 2.5, planeZ - 16);
// Cockpit windows
box(matSign, 1.8, 0.6, 0.1, planeX, 3.2, planeZ - 17.9);
// Blue stripe
box(matPlaneStripe, 3.05, 0.4, 28, planeX, 2.8, planeZ);
// Wings
box(matPlane, 20, 0.2, 5, planeX, 2.0, planeZ + 2);
// Tail fin
box(matPlaneTail, 0.2, 4, 4, planeX, 5.5, planeZ + 13);
// Horizontal stabilizers
box(matPlane, 8, 0.15, 2.5, planeX, 4.8, planeZ + 13);
// Engines (under wings)
box(matSeatFrame, 1.2, 1.2, 3, planeX - 5, 1.2, planeZ + 1);
box(matSeatFrame, 1.2, 1.2, 3, planeX + 5, 1.2, planeZ + 1);
// Landing gear
box(matSign, 0.3, 1.0, 0.3, planeX - 1, 0.5, planeZ + 5);
box(matSign, 0.3, 1.0, 0.3, planeX + 1, 0.5, planeZ + 5);
box(matSign, 0.3, 1.0, 0.3, planeX, 0.5, planeZ - 10);

// Cargo crates on tarmac
for (let i = 0; i < 8; i++) {
  const cx = halfW + 6 + rng() * 12;
  const cz = -halfL + 10 + rng() * (HALL_LENGTH - 20);
  const cs = 1.0 + rng() * 1.5;
  box(matLuggage, cs, cs * 0.8, cs, cx, cs * 0.4, cz);
}

// Jet bridge connecting terminal to plane
box(matWall, 2.5, 2.5, 8, halfW + 4, 2.5, planeZ - 5);
box(matCeiling, 2.5, 0.1, 8, halfW + 4, 3.75, planeZ - 5);

// ══════════════════════════════════════════
// ── OVERHEAD DEPARTURE BOARD (center) ──
// ══════════════════════════════════════════
box(matSign, 6, 1.5, 0.15, 0, 4.5, -10);
box(matSignGreen, 5.5, 0.12, 0.15, 0, 4.8, -9.92);
box(matSignGreen, 5.5, 0.12, 0.15, 0, 4.5, -9.92);
box(matSignGreen, 5.5, 0.12, 0.15, 0, 4.2, -9.92);

// ── Bot geometry ──
const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
const bodyGeo = new THREE.BoxGeometry(0.4, 0.55, 0.22);
const armGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
armGeo.translate(0, -0.25, 0);
const legGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
legGeo.translate(0, -0.25, 0);

const headIM = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: 0.6 }), BOT_COUNT);
const bodyIM = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ roughness: 0.5 }), BOT_COUNT);
const armLIM = new THREE.InstancedMesh(armGeo, new THREE.MeshStandardMaterial({ roughness: 0.5 }), BOT_COUNT);
const armRIM = new THREE.InstancedMesh(armGeo, new THREE.MeshStandardMaterial({ roughness: 0.5 }), BOT_COUNT);
const legLIM = new THREE.InstancedMesh(legGeo, new THREE.MeshStandardMaterial({ roughness: 0.5 }), BOT_COUNT);
const legRIM = new THREE.InstancedMesh(legGeo, new THREE.MeshStandardMaterial({ roughness: 0.5 }), BOT_COUNT);
const allIM = [headIM, bodyIM, armLIM, armRIM, legLIM, legRIM];
allIM.forEach((im) => scene.add(im));

// Bot colors
const skinTones = [0xffcc88, 0xf0b878, 0xd49868, 0xbb7744, 0x8b5533, 0xffe0c0];
const shirtColors = [0xcc3333, 0x3366cc, 0x33aa55, 0xddaa22, 0x8833aa, 0xdd6622, 0x33aaaa, 0xeeeeee, 0x555555, 0xdd5599];
const pantsColors = [0x334488, 0x444444, 0x554433, 0x335533, 0x663344, 0x333333];
const tmpColor = new THREE.Color();
for (let i = 0; i < BOT_COUNT; i++) {
  tmpColor.setHex(skinTones[Math.floor(rng() * skinTones.length)]);
  headIM.setColorAt(i, tmpColor);
  tmpColor.setHex(shirtColors[Math.floor(rng() * shirtColors.length)]);
  bodyIM.setColorAt(i, tmpColor); armLIM.setColorAt(i, tmpColor); armRIM.setColorAt(i, tmpColor);
  tmpColor.setHex(pantsColors[Math.floor(rng() * pantsColors.length)]);
  legLIM.setColorAt(i, tmpColor); legRIM.setColorAt(i, tmpColor);
}
allIM.forEach((im) => { if (im.instanceColor) im.instanceColor.needsUpdate = true; });

// ── Bot state ──
const botX = new Float32Array(BOT_COUNT);
const botZ = new Float32Array(BOT_COUNT);
const botYaw = new Float32Array(BOT_COUNT);
const botSpeed = new Float32Array(BOT_COUNT);
const botPhase = new Float32Array(BOT_COUNT);
const botTimer = new Float32Array(BOT_COUNT);
const botAlive = new Uint8Array(BOT_COUNT);
const botDeathTimer = new Float32Array(BOT_COUNT);

function spawnBot(i) {
  botX[i] = (rng() - 0.5) * (HALL_WIDTH - 4);
  botZ[i] = (rng() - 0.5) * (HALL_LENGTH - 4);
  botYaw[i] = rng() * Math.PI * 2;
  botSpeed[i] = 0.012 + rng() * 0.02;
  botPhase[i] = rng() * Math.PI * 2;
  botTimer[i] = 1.0 + rng() * 3.5;
  botAlive[i] = 1;
  botDeathTimer[i] = 0.0;
}
for (let i = 0; i < BOT_COUNT; i++) spawnBot(i);

// ── Bot matrix update ──
const bmat = new THREE.Matrix4();
const zeroMat = new THREE.Matrix4().makeScale(0, 0, 0);

function updateBots(t, dt) {
  const hwBound = HALL_WIDTH / 2 - 1.5;
  const hlBound = HALL_LENGTH / 2 - 1.5;
  for (let i = 0; i < BOT_COUNT; i++) {
    if (!botAlive[i]) {
      botDeathTimer[i] -= dt;
      if (botDeathTimer[i] <= 0) { spawnBot(i); }
      else {
        const p = Math.max(0, botDeathTimer[i] / 3.0);
        const fall = (1 - p) * Math.PI * 0.5;
        const x = botX[i], z = botZ[i], cosY = Math.cos(botYaw[i]), sinY = Math.sin(botYaw[i]);
        const cosF = Math.cos(fall), sinF = Math.sin(fall);
        bmat.set(cosY*cosF*p, -cosY*sinF*p, sinY*p, x, sinF*p, cosF*p, 0, 0.95*cosF*p, -sinY*cosF*p, sinY*sinF*p, cosY*p, z, 0,0,0,1);
        bodyIM.setMatrixAt(i, bmat);
        headIM.setMatrixAt(i, zeroMat); armLIM.setMatrixAt(i, zeroMat);
        armRIM.setMatrixAt(i, zeroMat); legLIM.setMatrixAt(i, zeroMat); legRIM.setMatrixAt(i, zeroMat);
      }
      continue;
    }

    botTimer[i] -= dt;
    if (botTimer[i] <= 0) { botYaw[i] += (rng() - 0.5) * 2.5; botTimer[i] = 1.0 + rng() * 3.5; }

    botX[i] -= Math.sin(botYaw[i]) * botSpeed[i] * dt * 60;
    botZ[i] -= Math.cos(botYaw[i]) * botSpeed[i] * dt * 60;

    if (botX[i] < -hwBound || botX[i] > hwBound) { botYaw[i] = Math.PI - botYaw[i]; botX[i] = Math.max(-hwBound, Math.min(hwBound, botX[i])); }
    if (botZ[i] < -hlBound || botZ[i] > hlBound) { botYaw[i] = -botYaw[i]; botZ[i] = Math.max(-hlBound, Math.min(hlBound, botZ[i])); }

    const x = botX[i], z = botZ[i], yaw = botYaw[i];
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const w = Math.sin(t * 8 + botPhase[i]) * 0.55;
    const cw = Math.cos(w), sw = Math.sin(w);
    const cnw = Math.cos(-w), snw = Math.sin(-w);

    bmat.set(cosY,0,sinY,x, 0,1,0,0.925, -sinY,0,cosY,z, 0,0,0,1); bodyIM.setMatrixAt(i, bmat);
    bmat.set(cosY,0,sinY,x, 0,1,0,1.4, -sinY,0,cosY,z, 0,0,0,1); headIM.setMatrixAt(i, bmat);

    const laX=x-0.29*cosY, laZ=z+0.29*sinY;
    bmat.set(cosY,sinY*sw,sinY*cw,laX, 0,cw,-sw,1.2, -sinY,cosY*sw,cosY*cw,laZ, 0,0,0,1); armLIM.setMatrixAt(i, bmat);
    const raX=x+0.29*cosY, raZ=z-0.29*sinY;
    bmat.set(cosY,sinY*snw,sinY*cnw,raX, 0,cnw,-snw,1.2, -sinY,cosY*snw,cosY*cnw,raZ, 0,0,0,1); armRIM.setMatrixAt(i, bmat);
    const llX=x-0.1*cosY, llZ=z+0.1*sinY;
    bmat.set(cosY,sinY*snw,sinY*cnw,llX, 0,cnw,-snw,0.65, -sinY,cosY*snw,cosY*cnw,llZ, 0,0,0,1); legLIM.setMatrixAt(i, bmat);
    const rlX=x+0.1*cosY, rlZ=z-0.1*sinY;
    bmat.set(cosY,sinY*sw,sinY*cw,rlX, 0,cw,-sw,0.65, -sinY,cosY*sw,cosY*cw,rlZ, 0,0,0,1); legRIM.setMatrixAt(i, bmat);
  }
  allIM.forEach((im) => { im.instanceMatrix.needsUpdate = true; });
}

// ── FPS weapon ──
const weaponGroup = new THREE.Group();
const weaponArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.5), new THREE.MeshStandardMaterial({ color: 0xffcc88, roughness: 0.5 }));
weaponArm.position.set(0.3, -0.25, -0.4); weaponArm.rotation.x = -0.1;
weaponGroup.add(weaponArm);
const weaponBlock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.35), new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.7 }));
weaponBlock.position.set(0.3, -0.19, -0.6); weaponBlock.rotation.x = -0.1;
weaponGroup.add(weaponBlock);
camera.add(weaponGroup);
scene.add(camera);

// ── Muzzle flash ──
const flashGeo = new THREE.SphereGeometry(0.1, 6, 4);
const flashMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
const flash = new THREE.Mesh(flashGeo, flashMat);
flash.position.set(0.3, -0.16, -0.82);
camera.add(flash);
let flashTimer = 0;

// ── Bullet tracer pool ──
const TRACER_POOL = 6;
const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffeeaa, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
const tracers = [];
for (let i = 0; i < TRACER_POOL; i++) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 3), tracerMat.clone());
  mesh.visible = false;
  scene.add(mesh);
  tracers.push({ mesh, life: 0, startX: 0, startY: 0, startZ: 0, endX: 0, endY: 0, endZ: 0 });
}
let tracerIdx = 0;

function spawnTracer(sx, sy, sz, ex, ey, ez) {
  const tr = tracers[tracerIdx % TRACER_POOL];
  tracerIdx++;
  tr.life = 0.1;
  tr.startX = sx; tr.startY = sy; tr.startZ = sz;
  tr.endX = ex; tr.endY = ey; tr.endZ = ez;
  tr.mesh.visible = true;
  tr.mesh.material.opacity = 0.9;
  // Position at midpoint, orient toward target
  const dx = ex - sx, dy = ey - sy, dz = ez - sz;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  tr.mesh.scale.set(1, len, 1);
  tr.mesh.position.set((sx + ex) / 2, (sy + ey) / 2, (sz + ez) / 2);
  tr.mesh.lookAt(ex, ey, ez);
  tr.mesh.rotateX(Math.PI / 2);
}

function updateTracers(dt) {
  for (const tr of tracers) {
    if (tr.life <= 0) continue;
    tr.life -= dt;
    tr.mesh.material.opacity = Math.max(0, tr.life / 0.1) * 0.9;
    if (tr.life <= 0) tr.mesh.visible = false;
  }
}

// ── Hit particles pool ──
const HIT_PARTICLE_COUNT = 8;
const HIT_POOL = 48; // 6 shots worth
const hitPartMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
const hitParts = [];
for (let i = 0; i < HIT_POOL; i++) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), hitPartMat);
  mesh.visible = false;
  scene.add(mesh);
  hitParts.push({ mesh, life: 0, vx: 0, vy: 0, vz: 0 });
}
let hitPartIdx = 0;

function spawnHitParticles(x, y, z) {
  for (let i = 0; i < HIT_PARTICLE_COUNT; i++) {
    const p = hitParts[hitPartIdx % HIT_POOL];
    hitPartIdx++;
    p.life = 0.4 + Math.random() * 0.3;
    p.mesh.position.set(x, y, z);
    p.mesh.visible = true;
    p.vx = (Math.random() - 0.5) * 4;
    p.vy = Math.random() * 5 + 1;
    p.vz = (Math.random() - 0.5) * 4;
  }
}

function updateHitParticles(dt) {
  for (const p of hitParts) {
    if (p.life <= 0) continue;
    p.life -= dt;
    p.vy -= 12 * dt;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    if (p.mesh.position.y < 0) { p.mesh.position.y = 0; p.vy = 0; p.vx *= 0.5; p.vz *= 0.5; }
    if (p.life <= 0) p.mesh.visible = false;
  }
}

// ── Collision AABBs (player only, not bots) ──
// { x, z, hw, hd } — center + half-widths. Player blocked if within bounds.
const colliders = [
  // Burger Town counter
  { x: btX, z: btZ, hw: 2.7, hd: 0.5 },
  { x: btX - 2.7, z: btZ + 1.5, hw: 0.5, hd: 1.7 },
  // Bookstore shelves
  { x: bsX, z: bsZ, hw: 0.4, hd: 1.5 },
  { x: bsX + 1.8, z: bsZ, hw: 0.4, hd: 1.5 },
  { x: bsX + 3.6, z: bsZ, hw: 0.4, hd: 1.5 },
  { x: bsX + 2.5, z: bsZ - 2.5, hw: 1.7, hd: 0.8 },
  // Check-in counters
  ...Array.from({ length: 6 }, (_, i) => ({ x: 0, z: -halfL + 4 + i * 3.5, hw: 2.0, hd: 0.5 })),
  // Mezzanine dining tables
  ...Array.from({ length: 5 }, (_, i) => ({ x: -6 + i * 3, z: mezZ, hw: 0.8, hd: 0.6 })),
];

// Columns as colliders
for (let i = 0; i < COLUMN_COUNT; i++) {
  const z = -halfL + 5 + i * (HALL_LENGTH / COLUMN_COUNT);
  const x = i % 2 === 0 ? -5 : 5;
  colliders.push({ x, z, hw: 0.45, hd: 0.45 });
}

function collidesAABB(px, pz, radius) {
  for (const c of colliders) {
    if (px + radius > c.x - c.hw && px - radius < c.x + c.hw &&
        pz + radius > c.z - c.hd && pz - radius < c.z + c.hd) {
      return true;
    }
  }
  return false;
}

// Height map for ramp + mezzanine
const EYE_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.3;

function getFloorHeight(px, pz, currentY) {
  // Ramp: extends 1 unit past mezNorthEdge into the mezzanine zone for overlap
  const rampEnd = rampSouthZ + 1.0;
  if (px > rampX - rampW / 2 && px < rampX + rampW / 2 &&
      pz > rampNorthZ && pz < rampEnd) {
    const t = Math.min(1, (pz - rampNorthZ) / (rampSouthZ - rampNorthZ));
    return t * (mezH + 0.1);
  }
  // Mezzanine floor: only if player is already at/near mezzanine height
  const mezSouth = mezZ + mezDepth / 2 + 0.5;
  const onMezXZ = pz >= mezNorthEdge && pz < mezSouth &&
                  px > -mezW / 2 + 0.5 && px < mezW / 2 - 0.5;
  if (onMezXZ && currentY > mezH - 1.0) {
    return mezH + 0.1;
  }
  return 0;
}

// ── Player state ──
const playerPos = new THREE.Vector3(0, EYE_HEIGHT, 0);
let playerVy = 0;
let playerGrounded = true;
let yaw = 0, pitch = 0, kills = 0;
let hitmarkerTimer = 0;

// ── Input ──
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === " ") e.preventDefault();
});
window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

const overlay = document.getElementById("overlay");
const crosshair = document.getElementById("crosshair");
const hitmarkerEl = document.getElementById("hitmarker");

function requestLockOrShoot() {
  if (!document.pointerLockElement) { canvas.requestPointerLock(); }
  else { shoot(); }
}
canvas.addEventListener("click", requestLockOrShoot);
overlay.addEventListener("click", requestLockOrShoot);
document.addEventListener("pointerlockchange", () => { overlay.classList.toggle("hidden", !!document.pointerLockElement); });
document.addEventListener("mousemove", (e) => {
  if (!document.pointerLockElement) return;
  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, pitch));
});

// ── Shooting ──
const rayOrigin = new THREE.Vector3();
const rayDir = new THREE.Vector3();
const tmpV = new THREE.Vector3();

function shoot() {
  flashTimer = 4;
  weaponGroup.rotation.x = -0.3;

  camera.getWorldPosition(rayOrigin);
  camera.getWorldDirection(rayDir);

  // Muzzle world position (approximate)
  const muzzleWorld = new THREE.Vector3(0.3, -0.16, -0.82);
  muzzleWorld.applyMatrix4(camera.matrixWorld);

  let closestDist = Infinity;
  let closestIdx = -1;

  for (let i = 0; i < BOT_COUNT; i++) {
    if (!botAlive[i]) continue;
    tmpV.set(botX[i], 0.9, botZ[i]).sub(rayOrigin);
    const along = tmpV.dot(rayDir);
    if (along < 0 || along > 100) continue;
    const px = rayDir.x * along, py = rayDir.y * along, pz = rayDir.z * along;
    const d = Math.sqrt((tmpV.x-px)**2 + (tmpV.y-py)**2 + (tmpV.z-pz)**2);
    if (d < HIT_RADIUS && along < closestDist) { closestDist = along; closestIdx = i; }
  }

  // Tracer end point
  let hitX, hitY, hitZ;
  if (closestIdx >= 0) {
    hitX = botX[closestIdx]; hitY = 0.9; hitZ = botZ[closestIdx];
  } else {
    hitX = rayOrigin.x + rayDir.x * 60;
    hitY = rayOrigin.y + rayDir.y * 60;
    hitZ = rayOrigin.z + rayDir.z * 60;
  }

  // Spawn tracer
  spawnTracer(muzzleWorld.x, muzzleWorld.y, muzzleWorld.z, hitX, hitY, hitZ);

  if (closestIdx >= 0) {
    botAlive[closestIdx] = 0;
    botDeathTimer[closestIdx] = 3.0;
    kills++;
    document.getElementById("kills").textContent = `${kills} kills`;
    hitmarkerTimer = 0.15;
    hitmarkerEl.classList.add("show");
    spawnHitParticles(hitX, hitY, hitZ);
  }
}

// ── Resize ──
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── FPS counter ──
const fpsEl = document.getElementById("fps");
const aliveEl = document.getElementById("alive");
let fpsFrames = 0, fpsLast = performance.now(), lastNow = performance.now();

function update() {
  const now = performance.now();
  const dt = Math.min((now - lastNow) / 1000, 0.05);
  lastNow = now;
  const t = now / 1000;

  // Player movement
  let mx = 0, mz = 0;
  if (keys["w"]) { mx -= Math.sin(yaw); mz -= Math.cos(yaw); }
  if (keys["s"]) { mx += Math.sin(yaw); mz += Math.cos(yaw); }
  if (keys["a"]) { mx -= Math.cos(yaw); mz += Math.sin(yaw); }
  if (keys["d"]) { mx += Math.cos(yaw); mz -= Math.sin(yaw); }
  const len = Math.sqrt(mx * mx + mz * mz);
  if (len > 0) { mx /= len; mz /= len; }

  // Horizontal movement with collision
  const nx = playerPos.x + mx * 5.0 * dt;
  const nz = playerPos.z + mz * 5.0 * dt;

  // Try full move, then axis-slide on collision
  if (!collidesAABB(nx, nz, PLAYER_RADIUS)) {
    playerPos.x = nx;
    playerPos.z = nz;
  } else if (!collidesAABB(nx, playerPos.z, PLAYER_RADIUS)) {
    playerPos.x = nx;
  } else if (!collidesAABB(playerPos.x, nz, PLAYER_RADIUS)) {
    playerPos.z = nz;
  }

  // Wall bounds
  playerPos.x = Math.max(-HALL_WIDTH / 2 + 0.5, Math.min(HALL_WIDTH / 2 - 0.5, playerPos.x));
  playerPos.z = Math.max(-HALL_LENGTH / 2 + 0.5, Math.min(HALL_LENGTH / 2 - 0.5, playerPos.z));

  // Jump
  if (keys[" "] && playerGrounded) {
    playerVy = 5.5;
    playerGrounded = false;
  }

  // Gravity
  playerVy -= 14.0 * dt;
  playerPos.y += playerVy * dt;

  // Floor / ramp / mezzanine height
  const floorY = getFloorHeight(playerPos.x, playerPos.z, playerPos.y - EYE_HEIGHT) + EYE_HEIGHT;
  if (playerPos.y <= floorY) {
    playerPos.y = floorY;
    playerVy = 0;
    playerGrounded = true;
  } else {
    playerGrounded = false;
  }

  // Ceiling
  if (playerPos.y > HALL_HEIGHT - 0.3) {
    playerPos.y = HALL_HEIGHT - 0.3;
    playerVy = 0;
  }

  camera.position.copy(playerPos);
  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  // Weapon animation
  weaponGroup.rotation.x += (0 - weaponGroup.rotation.x) * 0.2;
  if (len > 0) {
    const bob = Math.sin(t * 9) * 0.012;
    const sway = Math.cos(t * 9) * 0.008;
    weaponArm.position.y = -0.25 + bob;
    weaponBlock.position.y = -0.19 + bob;
    weaponArm.position.x = 0.3 + sway;
    weaponBlock.position.x = 0.3 + sway;
  }

  // Flash
  if (flashTimer > 0) { flashTimer -= dt * 20; flashMat.opacity = Math.max(0, flashTimer / 4); }

  // Hitmarker
  if (hitmarkerTimer > 0) {
    hitmarkerTimer -= dt;
    if (hitmarkerTimer <= 0) hitmarkerEl.classList.remove("show");
  }

  // Alive count
  if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) {
    let alive = 0;
    for (let i = 0; i < BOT_COUNT; i++) if (botAlive[i]) alive++;
    aliveEl.textContent = `${alive} alive`;
  }

  updateBots(t, dt);
  updateTracers(dt);
  updateHitParticles(dt);

  renderer.render(scene, camera);

  fpsFrames++;
  if (now - fpsLast >= 500) {
    fpsEl.textContent = `${((fpsFrames / (now - fpsLast)) * 1000).toFixed(0)} fps`;
    fpsFrames = 0; fpsLast = now;
  }

  requestAnimationFrame(update);
}

requestAnimationFrame(update);

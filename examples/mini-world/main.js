import * as THREE from "/node_modules/three/build/three.module.js";

// ── Seeded PRNG ──
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
renderer.toneMappingExposure = 1.6;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// ── Scene ──
const scene = new THREE.Scene();
scene.background = null;

// ── Sky dome — bright, warm, inviting ──
const skyCanvas = document.createElement("canvas");
skyCanvas.width = 32;
skyCanvas.height = 256;
const skyCtx = skyCanvas.getContext("2d");
const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 256);
skyGrad.addColorStop(0.0, "#1a3060");
skyGrad.addColorStop(0.25, "#4080c0");
skyGrad.addColorStop(0.42, "#70b0e0");
skyGrad.addColorStop(0.5, "#90cce8");
skyGrad.addColorStop(0.55, "#88c0d0");
skyGrad.addColorStop(0.7, "#607848");
skyGrad.addColorStop(1.0, "#384828");
skyCtx.fillStyle = skyGrad;
skyCtx.fillRect(0, 0, 32, 256);
const skyTex = new THREE.CanvasTexture(skyCanvas);
const skyMesh = new THREE.Mesh(
  new THREE.SphereGeometry(300, 32, 24),
  new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }),
);
skyMesh.frustumCulled = false;
skyMesh.renderOrder = -1000;
scene.add(skyMesh);

scene.fog = new THREE.FogExp2(0x7aaa88, 0.009);

// ── Lighting — golden hour feel ──
scene.add(new THREE.HemisphereLight(0x88bbdd, 0x556633, 0.8));
const sun = new THREE.DirectionalLight(0xffeebb, 2.2);
sun.position.set(30, 40, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -35;
sun.shadow.camera.right = 35;
sun.shadow.camera.top = 35;
sun.shadow.camera.bottom = -35;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 100;
sun.shadow.bias = -0.002;
scene.add(sun);
scene.add(new THREE.DirectionalLight(0x6688bb, 0.4).translateX(-20).translateY(10).translateZ(-15));

// ── Camera ──
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

// ── Materials ──
const matGrass = new THREE.MeshStandardMaterial({ color: 0x5a9960, roughness: 0.85 });
const matDirt = new THREE.MeshStandardMaterial({ color: 0x9b8365, roughness: 0.9 });
const matTrunk = new THREE.MeshStandardMaterial({ color: 0x6b4c3b, roughness: 0.8 });
const matLeaves = new THREE.MeshStandardMaterial({ color: 0x3a8a40, roughness: 0.7 });
const matLeavesDark = new THREE.MeshStandardMaterial({ color: 0x2a6a30, roughness: 0.7 });
const matRock = new THREE.MeshStandardMaterial({ color: 0x778888, roughness: 0.75, metalness: 0.1 });
const matCoin = new THREE.MeshStandardMaterial({ color: 0xffd644, roughness: 0.2, metalness: 0.8, emissive: 0x664400, emissiveIntensity: 0.4 });
const matPlayer = new THREE.MeshStandardMaterial({ color: 0x4488ee, roughness: 0.3, metalness: 0.3, emissive: 0x112244, emissiveIntensity: 0.15 });
const matPlayerHead = new THREE.MeshStandardMaterial({ color: 0xffcc88, roughness: 0.5, metalness: 0.05 });
const matPlayerArm = new THREE.MeshStandardMaterial({ color: 0x4488ee, roughness: 0.35, metalness: 0.25 });
const matPlatStone = new THREE.MeshStandardMaterial({ color: 0x889098, roughness: 0.6, metalness: 0.15 });
const matPlatMoss = new THREE.MeshStandardMaterial({ color: 0x556b55, roughness: 0.7, metalness: 0.05 });
const matWater = new THREE.MeshStandardMaterial({ color: 0x3388bb, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.7 });
const matFlower = [
  new THREE.MeshStandardMaterial({ color: 0xff6688, roughness: 0.5, emissive: 0x331122, emissiveIntensity: 0.2 }),
  new THREE.MeshStandardMaterial({ color: 0xffcc44, roughness: 0.5, emissive: 0x332200, emissiveIntensity: 0.2 }),
  new THREE.MeshStandardMaterial({ color: 0xaa66ff, roughness: 0.5, emissive: 0x221133, emissiveIntensity: 0.2 }),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, emissive: 0x222222, emissiveIntensity: 0.1 }),
];
const matStem = new THREE.MeshStandardMaterial({ color: 0x448833, roughness: 0.8 });
const matFence = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.85 });

// ── Ground — grass island with dirt clearing ──
const WORLD_SIZE = 60;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE), matGrass);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Central dirt clearing (spawn area)
const clearing = new THREE.Mesh(new THREE.CircleGeometry(4, 32), matDirt);
clearing.rotation.x = -Math.PI / 2;
clearing.position.y = 0.01;
scene.add(clearing);

// Dirt path from clearing toward platforms
const pathGeo = new THREE.PlaneGeometry(2.0, 12);
const path = new THREE.Mesh(pathGeo, matDirt);
path.rotation.x = -Math.PI / 2;
path.position.set(5, 0.01, 0);
path.rotation.z = Math.PI / 2;
scene.add(path);

// Spawn stone pedestal
const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 0.3, 8), matPlatStone);
pedestal.position.y = 0.15;
pedestal.receiveShadow = true;
pedestal.castShadow = true;
scene.add(pedestal);

// ── Small pond ──
const pond = new THREE.Mesh(new THREE.CircleGeometry(3.5, 24), matWater);
pond.rotation.x = -Math.PI / 2;
pond.position.set(-8, 0.02, 7);
scene.add(pond);
// Pond border rocks
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2;
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), matRock);
  rock.position.set(-8 + Math.cos(a) * 3.6, 0.15, 7 + Math.sin(a) * 3.6);
  rock.rotation.set(rng(), rng(), rng());
  rock.castShadow = true;
  scene.add(rock);
}

// ── Designed platform staircase — ascending spiral ──
const PLATFORM_COUNT = 12;
const platforms = [];
const m4 = new THREE.Matrix4();

for (let i = 0; i < PLATFORM_COUNT; i++) {
  const angle = (i / PLATFORM_COUNT) * Math.PI * 1.8 + 0.3;
  const dist = 5 + i * 0.8;
  const x = Math.cos(angle) * dist;
  const z = Math.sin(angle) * dist;
  const y = 1.5 + i * 1.6;
  const w = i === PLATFORM_COUNT - 1 ? 3.5 : 2.2;
  const d = i === PLATFORM_COUNT - 1 ? 3.5 : 2.2;
  const h = 0.35;
  const mat = i % 3 === 0 ? matPlatMoss : matPlatStone;

  const platMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  platMesh.position.set(x, y, z);
  platMesh.castShadow = true;
  platMesh.receiveShadow = true;
  scene.add(platMesh);

  platforms.push({ x, y, z, w, h, d });

  // Small pillar under each platform for visual support
  if (y > 3) {
    const pillarH = y - 0.5;
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, pillarH, 5),
      matRock,
    );
    pillar.position.set(x, pillarH / 2, z);
    pillar.castShadow = true;
    scene.add(pillar);
  }
}

// ── Trees — forest border (outer ring only, clear center for gameplay) ──
const TREE_COUNT = 60;
const treePositions = [];
const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 2.0, 6);
const leafGeo = new THREE.SphereGeometry(1.0, 6, 5);
const trunkIM = new THREE.InstancedMesh(trunkGeo, matTrunk, TREE_COUNT);
const leafIM = new THREE.InstancedMesh(leafGeo, matLeaves, TREE_COUNT / 2);
const leafIM2 = new THREE.InstancedMesh(leafGeo, matLeavesDark, TREE_COUNT / 2);
trunkIM.castShadow = true;
leafIM.castShadow = true;
leafIM2.castShadow = true;

let leafIdx1 = 0;
let leafIdx2 = 0;
for (let i = 0; i < TREE_COUNT; i++) {
  const angle = rng() * Math.PI * 2;
  const dist = 18 + rng() * 10;
  const x = Math.cos(angle) * dist;
  const z = Math.sin(angle) * dist;
  const scale = 0.8 + rng() * 0.9;
  treePositions.push({ x, z, r: scale * 0.6 });

  m4.makeTranslation(x, scale, z);
  m4.scale(new THREE.Vector3(scale, scale, scale));
  trunkIM.setMatrixAt(i, m4);

  m4.makeTranslation(x, scale * 2.0 + 0.6, z);
  m4.scale(new THREE.Vector3(scale, scale * 1.2, scale));
  if (i % 2 === 0) {
    leafIM.setMatrixAt(leafIdx1++, m4);
  } else {
    leafIM2.setMatrixAt(leafIdx2++, m4);
  }
}
trunkIM.instanceMatrix.needsUpdate = true;
leafIM.instanceMatrix.needsUpdate = true;
leafIM2.instanceMatrix.needsUpdate = true;
scene.add(trunkIM);
scene.add(leafIM);
scene.add(leafIM2);

// ── Rocks — decorative clusters near forest edge ──
const ROCK_COUNT = 30;
const rockGeo = new THREE.DodecahedronGeometry(0.5, 0);
const rockIM = new THREE.InstancedMesh(rockGeo, matRock, ROCK_COUNT);
rockIM.castShadow = true;
rockIM.receiveShadow = true;
const rockPositions = [];
for (let i = 0; i < ROCK_COUNT; i++) {
  const angle = rng() * Math.PI * 2;
  const dist = 14 + rng() * 12;
  const x = Math.cos(angle) * dist;
  const z = Math.sin(angle) * dist;
  const s = 0.3 + rng() * 0.6;
  rockPositions.push({ x, z, r: s * 0.5 });
  m4.makeTranslation(x, s * 0.25, z);
  m4.scale(new THREE.Vector3(s, s * 0.5, s));
  rockIM.setMatrixAt(i, m4);
}
rockIM.instanceMatrix.needsUpdate = true;
scene.add(rockIM);

// ── Flowers — scattered in the meadow ──
const FLOWER_COUNT = 50;
const flowerHeadGeo = new THREE.SphereGeometry(0.12, 5, 4);
const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 3);
for (let i = 0; i < FLOWER_COUNT; i++) {
  const angle = rng() * Math.PI * 2;
  const dist = 3 + rng() * 14;
  const x = Math.cos(angle) * dist;
  const z = Math.sin(angle) * dist;
  // Skip if near pond or spawn
  const dPond = Math.sqrt((x + 8) ** 2 + (z - 7) ** 2);
  const dSpawn = Math.sqrt(x * x + z * z);
  if (dPond < 5 || dSpawn < 3) continue;

  const stem = new THREE.Mesh(stemGeo, matStem);
  stem.position.set(x, 0.17, z);
  scene.add(stem);
  const head = new THREE.Mesh(flowerHeadGeo, matFlower[i % 4]);
  head.position.set(x, 0.38, z);
  scene.add(head);
}

// ── Fence — around the spawn clearing ──
const fencePostGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.6, 4);
const fenceRailGeo = new THREE.BoxGeometry(0.03, 0.03, 1.4);
for (let i = 0; i < 10; i++) {
  const angle = (i / 10) * Math.PI * 2;
  // Leave a gap for the path (angle ~0)
  if (angle > 5.8 || angle < 0.5) continue;
  const x = Math.cos(angle) * 4.5;
  const z = Math.sin(angle) * 4.5;
  const post = new THREE.Mesh(fencePostGeo, matFence);
  post.position.set(x, 0.3, z);
  post.castShadow = true;
  scene.add(post);
}

// ── Coins — breadcrumb trail leading to and up the staircase ──
const COIN_COUNT = 20;
const coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 16);
const coins = [];
const coinMeshes = [];

// First few coins lead from spawn toward the staircase
const pathCoins = [
  { x: 2, y: 0.8, z: 0 },
  { x: 4, y: 0.8, z: -0.5 },
  { x: 6, y: 0.8, z: -1 },
];
// One coin per platform
for (let i = 0; i < PLATFORM_COUNT; i++) {
  const p = platforms[i];
  pathCoins.push({ x: p.x, y: p.y + 0.8, z: p.z });
}
// Fill remaining with ground coins in the meadow
while (pathCoins.length < COIN_COUNT) {
  const angle = rng() * Math.PI * 2;
  const dist = 5 + rng() * 12;
  pathCoins.push({
    x: Math.cos(angle) * dist,
    y: 0.8,
    z: Math.sin(angle) * dist,
  });
}

for (let i = 0; i < COIN_COUNT; i++) {
  const c = pathCoins[i];
  const mesh = new THREE.Mesh(coinGeo, matCoin);
  mesh.position.set(c.x, c.y, c.z);
  mesh.castShadow = true;
  scene.add(mesh);
  coins.push({ x: c.x, y: c.y, z: c.z, collected: false });
  coinMeshes.push(mesh);
}

// ── Player — blocky character with limbs ──
const playerGroup = new THREE.Group();

// Body
const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), matPlayer);
bodyMesh.position.y = 0.35;
bodyMesh.castShadow = true;
playerGroup.add(bodyMesh);

// Head
const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), matPlayerHead);
headMesh.position.y = 0.9;
headMesh.castShadow = true;
playerGroup.add(headMesh);

// Eyes
const matEye = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.3 });
const eyeGeo = new THREE.SphereGeometry(0.05, 6, 4);
const eyeL = new THREE.Mesh(eyeGeo, matEye);
eyeL.position.set(-0.1, 0.95, -0.18);
playerGroup.add(eyeL);
const eyeR = new THREE.Mesh(eyeGeo, matEye);
eyeR.position.set(0.1, 0.95, -0.18);
playerGroup.add(eyeR);

// Arms
const armGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
const armL = new THREE.Mesh(armGeo, matPlayerArm);
armL.position.set(-0.38, 0.35, 0);
armL.castShadow = true;
playerGroup.add(armL);
const armR = new THREE.Mesh(armGeo, matPlayerArm);
armR.position.set(0.38, 0.35, 0);
armR.castShadow = true;
playerGroup.add(armR);

// Legs
const legGeo = new THREE.BoxGeometry(0.18, 0.4, 0.18);
const matLeg = new THREE.MeshStandardMaterial({ color: 0x335599, roughness: 0.4, metalness: 0.2 });
const legL = new THREE.Mesh(legGeo, matLeg);
legL.position.set(-0.13, -0.2, 0);
legL.castShadow = true;
playerGroup.add(legL);
const legR = new THREE.Mesh(legGeo, matLeg);
legR.position.set(0.13, -0.2, 0);
legR.castShadow = true;
playerGroup.add(legR);

scene.add(playerGroup);

// ── Player state ──
const player = {
  x: 0, y: 0.65, z: 0,
  vx: 0, vy: 0, vz: 0,
  yaw: 0,
  grounded: true,
  coinsCollected: 0,
};

// ── Input ──
const keys = {};
const keyEls = {
  w: document.getElementById("k-w"),
  a: document.getElementById("k-a"),
  s: document.getElementById("k-s"),
  d: document.getElementById("k-d"),
  " ": document.getElementById("k-space"),
};
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === " ") e.preventDefault();
  const el = keyEls[k];
  if (el) el.classList.add("active");
});
window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = false;
  const el = keyEls[k];
  if (el) el.classList.remove("active");
});

// ── Resize ──
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Physics ──
const MOVE_SPEED = 0.038;
const JUMP_FORCE = 0.24;
const GRAVITY = -0.010;
const FRICTION = 0.86;
const TURN_SPEED = 0.038;

// ── Collision ──
function collidesTree(px, pz) {
  for (const t of treePositions) {
    const dx = px - t.x;
    const dz = pz - t.z;
    if (dx * dx + dz * dz < t.r * t.r) return true;
  }
  return false;
}

function platformUnder(px, py, pz) {
  for (const p of platforms) {
    if (px > p.x - p.w / 2 - 0.2 && px < p.x + p.w / 2 + 0.2 &&
        pz > p.z - p.d / 2 - 0.2 && pz < p.z + p.d / 2 + 0.2 &&
        py <= p.y + p.h / 2 + 0.65 && py >= p.y - 1.0) {
      return p.y + p.h / 2;
    }
  }
  return null;
}

// ── Game loop ──
const coinsEl = document.getElementById("coins");
let time = 0;
let isMoving = false;

function update() {
  time += 1;

  // Turning
  if (keys["a"]) player.yaw += TURN_SPEED;
  if (keys["d"]) player.yaw -= TURN_SPEED;

  // Movement
  let moveX = 0;
  let moveZ = 0;
  if (keys["w"]) { moveX -= Math.sin(player.yaw); moveZ -= Math.cos(player.yaw); }
  if (keys["s"]) { moveX += Math.sin(player.yaw); moveZ += Math.cos(player.yaw); }

  isMoving = (moveX !== 0 || moveZ !== 0) && player.grounded;

  player.vx += moveX * MOVE_SPEED;
  player.vz += moveZ * MOVE_SPEED;

  // Jump
  if (keys[" "] && player.grounded) {
    player.vy = JUMP_FORCE;
    player.grounded = false;
  }

  player.vy += GRAVITY;
  player.vx *= FRICTION;
  player.vz *= FRICTION;

  // Horizontal collision
  const nx = player.x + player.vx;
  const nz = player.z + player.vz;
  if (!collidesTree(nx, nz)) {
    player.x = nx;
    player.z = nz;
  } else {
    player.vx = 0;
    player.vz = 0;
  }

  // World bounds
  const half = WORLD_SIZE / 2 - 1;
  player.x = Math.max(-half, Math.min(half, player.x));
  player.z = Math.max(-half, Math.min(half, player.z));

  // Vertical
  player.y += player.vy;
  const platY = platformUnder(player.x, player.y, player.z);
  const floorY = 0.65;

  if (platY !== null && player.vy <= 0 && player.y <= platY + 0.65) {
    player.y = platY + 0.65;
    player.vy = 0;
    player.grounded = true;
  } else if (player.y <= floorY) {
    player.y = floorY;
    player.vy = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  // Player mesh + animation
  playerGroup.position.set(player.x, player.y - 0.65, player.z);
  playerGroup.rotation.y = player.yaw;

  // Walk animation — bob body, swing arms & legs
  if (isMoving) {
    const bob = Math.sin(time * 0.25) * 0.04;
    bodyMesh.position.y = 0.35 + bob;
    headMesh.position.y = 0.9 + bob;
    eyeL.position.y = 0.95 + bob;
    eyeR.position.y = 0.95 + bob;
    const swing = Math.sin(time * 0.25) * 0.4;
    armL.rotation.x = swing;
    armR.rotation.x = -swing;
    legL.rotation.x = -swing * 0.6;
    legR.rotation.x = swing * 0.6;
  } else {
    bodyMesh.position.y = 0.35;
    headMesh.position.y = 0.9;
    eyeL.position.y = 0.95;
    eyeR.position.y = 0.95;
    armL.rotation.x = 0;
    armR.rotation.x = 0;
    legL.rotation.x = 0;
    legR.rotation.x = 0;
  }

  // Coins
  for (let i = 0; i < COIN_COUNT; i++) {
    const c = coins[i];
    if (c.collected) continue;
    coinMeshes[i].rotation.y = time * 0.04;
    coinMeshes[i].position.y = c.y + Math.sin(time * 0.06 + i) * 0.15;

    const dx = player.x - c.x;
    const dy = player.y - c.y;
    const dz = player.z - c.z;
    if (dx * dx + dy * dy + dz * dz < 2.0) {
      c.collected = true;
      scene.remove(coinMeshes[i]);
      player.coinsCollected++;
      coinsEl.textContent = `${player.coinsCollected} / ${COIN_COUNT}`;
      if (player.coinsCollected === COIN_COUNT) {
        coinsEl.textContent = `${COIN_COUNT} / ${COIN_COUNT} - You win!`;
      }
    }
  }

  // Camera — smooth third-person follow
  const camDist = 7;
  const camHeight = 3.5;
  const targetCamX = player.x + Math.sin(player.yaw) * camDist;
  const targetCamZ = player.z + Math.cos(player.yaw) * camDist;
  const targetCamY = player.y + camHeight;
  camera.position.x += (targetCamX - camera.position.x) * 0.07;
  camera.position.y += (targetCamY - camera.position.y) * 0.07;
  camera.position.z += (targetCamZ - camera.position.z) * 0.07;
  camera.lookAt(player.x, player.y + 0.3, player.z);

  // Shadow follows player
  sun.position.set(player.x + 30, 40, player.z + 20);
  sun.target.position.set(player.x, 0, player.z);
  sun.target.updateMatrixWorld();

  renderer.render(scene, camera);
  requestAnimationFrame(update);
}

requestAnimationFrame(update);

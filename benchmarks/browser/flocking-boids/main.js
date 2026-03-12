import * as THREE from "/node_modules/three/build/three.module.js";
import { createSky, createLights, setupRenderer } from "../shared/env.js";

// ── Constants ──
const BOID_COUNT = 6000;
const WARMUP_FRAMES = 20;
const SAMPLE_FRAMES = 300;
const BOUNDS = 30;
const MAX_SPEED = 0.15;
const VISUAL_RANGE = 3.0;
const SEPARATION_DIST = 1.0;
const STRIDE = Math.floor(BOID_COUNT / 20);

// ── Utilities ──

function formatNumber(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index] ?? 0;
}

function getVariant() {
  const url = new URL(window.location.href);
  return url.searchParams.get("variant") === "optimized" ? "optimized" : "baseline";
}

function updateHud(title, lines) {
  document.getElementById("hud-title").textContent = title;
  document.getElementById("hud-metrics").textContent = lines.join("\n");
}

// ── Deterministic PRNG ──

function createRng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Boid State ──

const positions = new Float32Array(BOID_COUNT * 3);
const velocities = new Float32Array(BOID_COUNT * 3);

function initBoids() {
  const rng = createRng(42);
  for (let i = 0; i < BOID_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (rng() - 0.5) * BOUNDS * 2;
    positions[i3 + 1] = (rng() - 0.5) * BOUNDS * 2;
    positions[i3 + 2] = (rng() - 0.5) * BOUNDS * 2;

    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    velocities[i3] = Math.sin(phi) * Math.cos(theta) * MAX_SPEED;
    velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * MAX_SPEED;
    velocities[i3 + 2] = Math.cos(phi) * MAX_SPEED;
  }
}

// ── Flocking Update ──

function updateFlocking() {
  for (let i = 0; i < BOID_COUNT; i++) {
    const i3 = i * 3;
    const px = positions[i3];
    const py = positions[i3 + 1];
    const pz = positions[i3 + 2];

    let sepX = 0, sepY = 0, sepZ = 0;
    let alignX = 0, alignY = 0, alignZ = 0;
    let cohX = 0, cohY = 0, cohZ = 0;
    let alignCount = 0;
    let cohCount = 0;

    for (let s = 0; s < BOID_COUNT; s += STRIDE) {
      if (s === i) continue;
      const s3 = s * 3;
      const dx = positions[s3] - px;
      const dy = positions[s3 + 1] - py;
      const dz = positions[s3 + 2] - pz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < SEPARATION_DIST && dist > 0) {
        sepX -= dx / dist;
        sepY -= dy / dist;
        sepZ -= dz / dist;
      }

      if (dist < VISUAL_RANGE) {
        alignX += velocities[s3];
        alignY += velocities[s3 + 1];
        alignZ += velocities[s3 + 2];
        alignCount++;

        cohX += positions[s3];
        cohY += positions[s3 + 1];
        cohZ += positions[s3 + 2];
        cohCount++;
      }
    }

    let vx = velocities[i3];
    let vy = velocities[i3 + 1];
    let vz = velocities[i3 + 2];

    // Separation
    vx += sepX * 0.05;
    vy += sepY * 0.05;
    vz += sepZ * 0.05;

    // Alignment
    if (alignCount > 0) {
      vx += (alignX / alignCount - vx) * 0.04;
      vy += (alignY / alignCount - vy) * 0.04;
      vz += (alignZ / alignCount - vz) * 0.04;
    }

    // Cohesion
    if (cohCount > 0) {
      vx += (cohX / cohCount - px) * 0.003;
      vy += (cohY / cohCount - py) * 0.003;
      vz += (cohZ / cohCount - pz) * 0.003;
    }

    // Bounds
    if (px > BOUNDS) vx -= (px - BOUNDS) * 0.02;
    if (px < -BOUNDS) vx -= (px + BOUNDS) * 0.02;
    if (py > BOUNDS) vy -= (py - BOUNDS) * 0.02;
    if (py < -BOUNDS) vy -= (py + BOUNDS) * 0.02;
    if (pz > BOUNDS) vz -= (pz - BOUNDS) * 0.02;
    if (pz < -BOUNDS) vz -= (pz + BOUNDS) * 0.02;

    // Clamp speed
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      vx *= scale;
      vy *= scale;
      vz *= scale;
    }

    velocities[i3] = vx;
    velocities[i3 + 1] = vy;
    velocities[i3 + 2] = vz;

    // Integrate
    positions[i3] += vx;
    positions[i3 + 1] += vy;
    positions[i3 + 2] += vz;
  }
}

// ── Scene Setup ──

function createScene(renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 500
  );
  camera.position.set(50, 35, 50);
  camera.lookAt(0, 0, 0);

  createSky(scene, { fogDensity: 0.004, starCount: 300 });
  createLights(scene);

  renderer.info.autoReset = false;

  return { camera, scene };
}

// ── Boid Geometry & Material ──

function createBoidGeometry() {
  const geometry = new THREE.ConeGeometry(0.12, 0.4, 4);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function createBoidMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffaa44,
    roughness: 0.35,
    metalness: 0.2,
    emissive: 0x331800,
    emissiveIntensity: 0.3,
  });
}

// ── Baseline Variant ──

function buildBaseline(scene) {
  const geometry = createBoidGeometry();
  const material = createBoidMaterial();
  const meshes = [];
  const root = new THREE.Group();

  for (let i = 0; i < BOID_COUNT; i++) {
    const mesh = new THREE.Mesh(geometry, material);
    const i3 = i * 3;
    mesh.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
    meshes.push(mesh);
    root.add(mesh);
  }

  scene.add(root);

  return {
    cleanup() {
      scene.remove(root);
      geometry.dispose();
      material.dispose();
    },
    update() {
      updateFlocking();
      for (let i = 0; i < BOID_COUNT; i++) {
        const i3 = i * 3;
        const x = positions[i3];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];
        const vx = velocities[i3];
        const vy = velocities[i3 + 1];
        const vz = velocities[i3 + 2];
        meshes[i].position.set(x, y, z);
        meshes[i].lookAt(x + vx, y + vy, z + vz);
      }
    },
  };
}

// ── Optimized Variant ──

function buildOptimized(scene) {
  const geometry = createBoidGeometry();
  const material = createBoidMaterial();
  const instancedMesh = new THREE.InstancedMesh(geometry, material, BOID_COUNT);
  const dummy = new THREE.Object3D();

  // Set initial matrices
  for (let i = 0; i < BOID_COUNT; i++) {
    const i3 = i * 3;
    dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
    dummy.lookAt(
      positions[i3] + velocities[i3],
      positions[i3 + 1] + velocities[i3 + 1],
      positions[i3 + 2] + velocities[i3 + 2],
    );
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  scene.add(instancedMesh);

  return {
    cleanup() {
      scene.remove(instancedMesh);
      geometry.dispose();
      material.dispose();
    },
    update() {
      updateFlocking();
      for (let i = 0; i < BOID_COUNT; i++) {
        const i3 = i * 3;
        const x = positions[i3];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];
        const vx = velocities[i3];
        const vy = velocities[i3 + 1];
        const vz = velocities[i3 + 2];
        dummy.position.set(x, y, z);
        dummy.lookAt(x + vx, y + vy, z + vz);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// ── Main Loop ──

async function run() {
  const variant = getVariant();
  const canvas = document.getElementById("benchmark-canvas");
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    powerPreference: "high-performance",
  });
  setupRenderer(renderer);

  const { camera, scene } = createScene(renderer);

  initBoids();

  const built = variant === "optimized"
    ? buildOptimized(scene) : buildBaseline(scene);

  updateHud(`Flocking Boids / ${variant}`, [
    `boids: ${BOID_COUNT}`,
    "warming up...",
  ]);

  const frameTimes = [];
  const renderCpuTimes = [];
  const updateTimes = [];
  let frameIndex = 0;
  let totalFrames = 0;
  let renderCallsTotal = 0;
  let lastNow = performance.now();

  function frame(now) {
    const delta = now - lastNow;
    lastNow = now;

    // Camera orbit
    const orbit = frameIndex * 0.004;
    camera.position.x = Math.cos(orbit) * 55;
    camera.position.z = Math.sin(orbit) * 55;
    camera.position.y = 35;
    camera.lookAt(0, 0, 0);

    // Update
    const updateStart = performance.now();
    built.update(frameIndex);
    const updateTime = performance.now() - updateStart;

    // Render
    renderer.info.reset();
    const renderStart = performance.now();
    renderer.render(scene, camera);
    const renderCpuTime = performance.now() - renderStart;

    // Collect metrics after warmup
    if (frameIndex >= WARMUP_FRAMES) {
      frameTimes.push(delta);
      renderCpuTimes.push(renderCpuTime);
      updateTimes.push(updateTime);
      renderCallsTotal += renderer.info.render.calls;
      totalFrames += 1;
    }

    // HUD update every 12 frames
    if (frameIndex % 12 === 0) {
      const avgFrameTime =
        frameTimes.length > 0 ? frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length : null;
      updateHud(`Flocking Boids / ${variant}`, [
        `frame: ${frameIndex}`,
        `avg fps: ${avgFrameTime ? formatNumber(1000 / avgFrameTime) : "warming"}`,
        `update ms: ${formatNumber(updateTime)}`,
        `render ms: ${formatNumber(renderCpuTime)}`,
        `render calls: ${renderer.info.render.calls}`,
        `boids: ${BOID_COUNT}`,
      ]);
    }

    frameIndex += 1;

    if (totalFrames >= SAMPLE_FRAMES) {
      // ── Final results ──
      const averageFrameTime = frameTimes.reduce((s, v) => s + v, 0) / frameTimes.length;
      const averageUpdateTime = updateTimes.reduce((s, v) => s + v, 0) / updateTimes.length;
      const averageRenderCpuTime = renderCpuTimes.reduce((s, v) => s + v, 0) / renderCpuTimes.length;

      window.__BENCHMARK_RESULT__ = {
        averageFps: 1000 / averageFrameTime,
        averageFrameTimeMs: averageFrameTime,
        averageRenderCalls: renderCallsTotal / totalFrames,
        averageRenderCpuTimeMs: averageRenderCpuTime,
        averageUpdateTimeMs: averageUpdateTime,
        frameTimeP95Ms: percentile(frameTimes, 0.95),
        renderCpuTimeP95Ms: percentile(renderCpuTimes, 0.95),
        updateTimeP95Ms: percentile(updateTimes, 0.95),
        sampleFrames: totalFrames,
        variant,
      };

      updateHud(`Flocking Boids / ${variant}`, [
        `avg fps: ${formatNumber(window.__BENCHMARK_RESULT__.averageFps)}`,
        `avg update ms: ${formatNumber(averageUpdateTime)}`,
        `avg render ms: ${formatNumber(averageRenderCpuTime)}`,
        `p95 update ms: ${formatNumber(window.__BENCHMARK_RESULT__.updateTimeP95Ms)}`,
        `avg render calls: ${formatNumber(window.__BENCHMARK_RESULT__.averageRenderCalls)}`,
        `boids: ${BOID_COUNT}`,
      ]);

      built.cleanup();
      renderer.dispose();
      return;
    }

    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
}

run().catch((error) => {
  window.__BENCHMARK_RESULT__ = {
    error: error instanceof Error ? error.message : String(error),
  };
  updateHud("Flocking Boids / error", [String(window.__BENCHMARK_RESULT__.error)]);
});

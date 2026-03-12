import * as THREE from "/node_modules/three/build/three.module.js";
import { createSky, createLights, setupRenderer } from "../shared/env.js";

// -- Constants --
const STAR_COUNT = 15000;
const WARMUP_FRAMES = 20;
const SAMPLE_FRAMES = 300;
const TUNNEL_LENGTH = 200;
const TUNNEL_RADIUS = 40;
const SPEED = 1.5;

// -- Deterministic PRNG (mulberry32) --

function createRng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// -- Utilities --

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

// -- Star State --

function initStars(rng) {
  const positions = new Float32Array(STAR_COUNT * 3);
  const velocities = new Float32Array(STAR_COUNT);
  const lengths = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (rng() - 0.5) * TUNNEL_RADIUS * 2;
    positions[i3 + 1] = (rng() - 0.5) * TUNNEL_RADIUS * 2;
    positions[i3 + 2] = -rng() * TUNNEL_LENGTH;
    velocities[i] = SPEED + rng() * 0.8;
    lengths[i] = 1 + velocities[i] * 0.5;
  }

  return { positions, velocities, lengths };
}

function updateStars(positions, velocities, rng) {
  for (let i = 0; i < STAR_COUNT; i++) {
    const i3 = i * 3;
    positions[i3 + 2] += velocities[i];

    if (positions[i3 + 2] > 10) {
      positions[i3] = (rng() - 0.5) * TUNNEL_RADIUS * 2;
      positions[i3 + 1] = (rng() - 0.5) * TUNNEL_RADIUS * 2;
      positions[i3 + 2] = -TUNNEL_LENGTH + rng() * 20;
    }
  }
}

// -- Scene Setup --

function createScene(renderer) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 500
  );
  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, -1);

  createSky(scene, { fogDensity: 0, starCount: 0 });
  createLights(scene);

  renderer.info.autoReset = false;

  return { camera, scene };
}

// -- Baseline Variant --

function buildBaseline(scene, positions, velocities, lengths) {
  const geometry = new THREE.BoxGeometry(0.04, 0.04, 2.0);
  const material = new THREE.MeshStandardMaterial({
    color: 0xeeeeff,
    emissive: 0xaabbff,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.5,
  });

  const meshes = [];
  const root = new THREE.Group();

  for (let i = 0; i < STAR_COUNT; i++) {
    const mesh = new THREE.Mesh(geometry, material);
    const i3 = i * 3;
    mesh.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
    mesh.scale.z = lengths[i];
    meshes.push(mesh);
    root.add(mesh);
  }

  scene.add(root);

  return {
    cleanup() {
      geometry.dispose();
      material.dispose();
    },
    update() {
      for (let i = 0; i < STAR_COUNT; i++) {
        const i3 = i * 3;
        meshes[i].position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      }
    },
  };
}

// -- Optimized Variant --

function buildOptimized(scene, positions) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xeeeeff,
    size: 0.3,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    cleanup() {
      geometry.dispose();
      material.dispose();
    },
    update() {
      geometry.attributes.position.needsUpdate = true;
    },
  };
}

// -- Main Loop --

async function run() {
  const variant = getVariant();
  const rng = createRng(42);
  const canvas = document.getElementById("benchmark-canvas");
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    powerPreference: "high-performance",
  });
  setupRenderer(renderer);

  const { camera, scene } = createScene(renderer);
  const { positions, velocities, lengths } = initStars(rng);
  const built = variant === "optimized"
    ? buildOptimized(scene, positions)
    : buildBaseline(scene, positions, velocities, lengths);

  const frameTimes = [];
  const renderCpuTimes = [];
  const updateTimes = [];
  let frameIndex = 0;
  let totalFrames = 0;
  let renderCallsTotal = 0;
  let lastNow = performance.now();

  updateHud(`Starfield Warp / ${variant}`, [
    `stars: ${STAR_COUNT}`,
    "warming up...",
  ]);

  function frame(now) {
    const delta = now - lastNow;
    lastNow = now;

    // No camera orbit -- camera stays fixed looking forward

    // Update star positions
    const updateStart = performance.now();
    updateStars(positions, velocities, rng);
    built.update();
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
      updateHud(`Starfield Warp / ${variant}`, [
        `frame: ${frameIndex}`,
        `avg fps: ${avgFrameTime ? formatNumber(1000 / avgFrameTime) : "warming"}`,
        `update ms: ${formatNumber(updateTime)}`,
        `render ms: ${formatNumber(renderCpuTime)}`,
        `render calls: ${renderer.info.render.calls}`,
        `stars: ${STAR_COUNT}`,
      ]);
    }

    frameIndex += 1;

    if (totalFrames >= SAMPLE_FRAMES) {
      // -- Final results --
      const averageFrameTime = frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length;
      const averageUpdateTime = updateTimes.reduce((sum, value) => sum + value, 0) / updateTimes.length;
      const averageRenderCpuTime =
        renderCpuTimes.reduce((sum, value) => sum + value, 0) / renderCpuTimes.length;

      window.__BENCHMARK_RESULT__ = {
        averageFps: 1000 / averageFrameTime,
        averageFrameTimeMs: averageFrameTime,
        averageRenderCalls: renderCallsTotal / totalFrames,
        averageRenderCpuTimeMs: averageRenderCpuTime,
        averageUpdateTimeMs: averageUpdateTime,
        frameTimeP95Ms: percentile(frameTimes, 0.95),
        renderCpuTimeP95Ms: percentile(renderCpuTimes, 0.95),
        sampleFrames: totalFrames,
        updateTimeP95Ms: percentile(updateTimes, 0.95),
        variant,
      };

      updateHud(`Starfield Warp / ${variant}`, [
        `avg fps: ${formatNumber(window.__BENCHMARK_RESULT__.averageFps)}`,
        `avg update ms: ${formatNumber(averageUpdateTime)}`,
        `avg render ms: ${formatNumber(averageRenderCpuTime)}`,
        `p95 update ms: ${formatNumber(window.__BENCHMARK_RESULT__.updateTimeP95Ms)}`,
        `avg render calls: ${formatNumber(window.__BENCHMARK_RESULT__.averageRenderCalls)}`,
        `stars: ${STAR_COUNT}`,
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
  updateHud("Starfield Warp / error", [String(window.__BENCHMARK_RESULT__.error)]);
});

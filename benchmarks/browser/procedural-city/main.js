import * as THREE from "/node_modules/three/build/three.module.js";
import { createSky, createLights, setupRenderer } from "../shared/env.js";

// -- Constants --
const BUILDING_COUNT = 5000;
const GRID_WIDTH = 80;
const BLOCK_SIZE = 1.2;
const WARMUP_FRAMES = 20;
const SAMPLE_FRAMES = 250;
const CAMERA_ORBIT_RADIUS = 60;
const CAMERA_HEIGHT = 40;

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

// -- Building data generation --

function generateBuildings(rng) {
  const buildings = [];
  const halfGrid = (GRID_WIDTH * BLOCK_SIZE) / 2;
  let placed = 0;
  const cols = Math.ceil(Math.sqrt(BUILDING_COUNT));
  const rows = Math.ceil(BUILDING_COUNT / cols);

  for (let row = 0; row < rows && placed < BUILDING_COUNT; row++) {
    for (let col = 0; col < cols && placed < BUILDING_COUNT; col++) {
      const w = 0.5 + rng() * 0.6;
      const d = 0.5 + rng() * 0.6;
      const h = 1 + rng() * rng() * 15;
      const x = (col / cols) * GRID_WIDTH * BLOCK_SIZE - halfGrid + (rng() - 0.5) * 0.3;
      const z = (row / rows) * GRID_WIDTH * BLOCK_SIZE - halfGrid + (rng() - 0.5) * 0.3;
      buildings.push({ x, z, w, h, d });
      placed++;
    }
  }

  return buildings;
}

// -- Scene setup --

function createScene(renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 500
  );
  camera.position.set(CAMERA_ORBIT_RADIUS, CAMERA_HEIGHT, CAMERA_ORBIT_RADIUS);
  camera.lookAt(0, 0, 0);

  createSky(scene, { fogDensity: 0.005, starCount: 350 });
  createLights(scene, { keyPos: [40, 60, 30] });

  // Ground plane
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(GRID_WIDTH * BLOCK_SIZE * 2, GRID_WIDTH * BLOCK_SIZE * 2),
    new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.95, metalness: 0.0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  scene.add(ground);

  renderer.info.autoReset = false;

  return { camera, scene };
}

// -- Baseline: one Mesh per building (5000 draw calls) --

function buildBaseline(scene) {
  const rng = createRng(42);
  const buildings = generateBuildings(rng);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.7, metalness: 0.1 });
  const root = new THREE.Group();

  for (const b of buildings) {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const mesh = new THREE.Mesh(geo, bodyMaterial);
    mesh.position.set(b.x, b.h / 2, b.z);
    root.add(mesh);
  }

  scene.add(root);

  return {
    cleanup() {
      root.traverse((child) => {
        if (child.isMesh) child.geometry.dispose();
      });
      bodyMaterial.dispose();
    },
    update() {},
  };
}

// -- Optimized: merge all geometry into a single mesh (1 draw call) --

function buildOptimized(scene) {
  const rng = createRng(42);
  const buildings = generateBuildings(rng);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.7, metalness: 0.1 });

  // Pre-calculate total buffer sizes
  // A BoxGeometry has 24 vertices and 36 indices
  const verticesPerBox = 24;
  const indicesPerBox = 36;
  const totalVertices = BUILDING_COUNT * verticesPerBox;
  const totalIndices = BUILDING_COUNT * indicesPerBox;

  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const indices = new Uint32Array(totalIndices);

  let vertexOffset = 0;
  let indexOffset = 0;
  let indexValueOffset = 0;

  for (const b of buildings) {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    geo.translate(b.x, b.h / 2, b.z);

    const pos = geo.attributes.position.array;
    const norm = geo.attributes.normal.array;
    const idx = geo.index.array;

    positions.set(pos, vertexOffset * 3);
    normals.set(norm, vertexOffset * 3);

    for (let i = 0; i < idx.length; i++) {
      indices[indexOffset + i] = idx[i] + indexValueOffset;
    }

    vertexOffset += pos.length / 3;
    indexOffset += idx.length;
    indexValueOffset += pos.length / 3;

    geo.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));

  const mesh = new THREE.Mesh(merged, bodyMaterial);
  scene.add(mesh);

  return {
    cleanup() {
      merged.dispose();
      bodyMaterial.dispose();
    },
    update() {},
  };
}

// -- Main loop --

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
  const built = variant === "optimized"
    ? buildOptimized(scene) : buildBaseline(scene);

  updateHud(`Procedural City / ${variant}`, [
    `buildings: ${BUILDING_COUNT}`,
    "warming up...",
  ]);

  const frameTimes = [];
  const renderCpuTimes = [];
  let frameIndex = 0;
  let totalFrames = 0;
  let renderCallsTotal = 0;
  let trianglesTotal = 0;
  let lastTime = performance.now();

  function frame(now) {
    const delta = now - lastTime;
    lastTime = now;

    // Camera orbit
    const orbit = frameIndex * 0.004;
    camera.position.x = Math.cos(orbit) * CAMERA_ORBIT_RADIUS;
    camera.position.z = Math.sin(orbit) * CAMERA_ORBIT_RADIUS;
    camera.position.y = CAMERA_HEIGHT;
    camera.lookAt(0, 0, 0);

    // Render
    renderer.info.reset();
    const renderStart = performance.now();
    renderer.render(scene, camera);
    const renderCpuTime = performance.now() - renderStart;

    // Collect metrics after warmup
    if (frameIndex >= WARMUP_FRAMES) {
      frameTimes.push(delta);
      renderCpuTimes.push(renderCpuTime);
      renderCallsTotal += renderer.info.render.calls;
      trianglesTotal += renderer.info.render.triangles;
      totalFrames += 1;
    }

    // HUD update every 12 frames
    if (frameIndex % 12 === 0) {
      const avgFps = frameTimes.length > 0
        ? formatNumber(1000 / (frameTimes.reduce((s, v) => s + v, 0) / frameTimes.length))
        : "warming";
      updateHud(`Procedural City / ${variant}`, [
        `frame: ${frameIndex}`,
        `avg fps: ${avgFps}`,
        `render ms: ${formatNumber(renderCpuTime)}`,
        `render calls: ${renderer.info.render.calls}`,
        `triangles: ${renderer.info.render.triangles}`,
        `buildings: ${BUILDING_COUNT}`,
      ]);
    }

    frameIndex += 1;

    if (totalFrames >= SAMPLE_FRAMES) {
      // Final results
      const averageFrameTime = frameTimes.reduce((s, v) => s + v, 0) / frameTimes.length;
      const averageFps = 1000 / averageFrameTime;
      const averageRenderCpuTime =
        renderCpuTimes.reduce((s, v) => s + v, 0) / renderCpuTimes.length;

      window.__BENCHMARK_RESULT__ = {
        averageFps,
        averageFrameTimeMs: averageFrameTime,
        averageRenderCpuTimeMs: averageRenderCpuTime,
        averageRenderCalls: renderCallsTotal / totalFrames,
        averageTriangles: trianglesTotal / totalFrames,
        frameTimeP95Ms: percentile(frameTimes, 0.95),
        renderCpuTimeP95Ms: percentile(renderCpuTimes, 0.95),
        sampleFrames: totalFrames,
        variant,
      };

      updateHud(`Procedural City / ${variant}`, [
        `avg fps: ${formatNumber(averageFps)}`,
        `avg frame ms: ${formatNumber(averageFrameTime)}`,
        `avg render ms: ${formatNumber(averageRenderCpuTime)}`,
        `p95 render ms: ${formatNumber(percentile(renderCpuTimes, 0.95))}`,
        `avg render calls: ${formatNumber(renderCallsTotal / totalFrames)}`,
        `avg triangles: ${formatNumber(trianglesTotal / totalFrames, 0)}`,
        `buildings: ${BUILDING_COUNT}`,
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
  updateHud("Procedural City / error", [String(window.__BENCHMARK_RESULT__.error)]);
});

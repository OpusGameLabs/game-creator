import * as THREE from "/node_modules/three/build/three.module.js";
import { createSky, createLights, setupRenderer, buildChunked } from "../shared/env.js";

// -- Constants --
const ITEM_COUNT = 200;
const WARMUP_FRAMES = 20;
const SAMPLE_FRAMES = 250;
const TEXTURE_SIZE = 128;
const BUILD_DELAY_MS = 8;

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

// -- Procedural texture generation --

function makeTexture(seed, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  // Background color based on seed
  const hue = (seed * 47) % 360;
  ctx.fillStyle = `hsl(${hue} 65% 45%)`;
  ctx.fillRect(0, 0, size, size);
  // Light strip at top
  ctx.fillStyle = `hsl(${hue} 50% 65%)`;
  ctx.fillRect(0, 0, size, size / 5);
  // Number label
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${size / 3}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(String(seed + 1), size / 2, size * 0.65);
  return new THREE.CanvasTexture(canvas);
}

// -- Spiral layout --

function spiralPosition(index) {
  const angle = index * 0.3;
  const radius = 3 + index * 0.06;
  return {
    x: Math.cos(angle) * radius,
    y: -1.0 + Math.sin(index * 0.15) * 0.5,
    z: Math.sin(angle) * radius,
  };
}

// -- Scene Setup --

function createScene(renderer) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 500,
  );
  camera.position.set(0, 15, 25);
  camera.lookAt(0, 0, 0);

  createSky(scene, { fogDensity: 0.006, starCount: 300 });
  createLights(scene);

  // Dark ground plane
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2;
  scene.add(ground);

  renderer.info.autoReset = false;
  return { camera, scene };
}

// -- Baseline Variant (blocking build) --

function buildBaseline(scene) {
  const root = new THREE.Group();
  const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const textures = [];
  const materials = [];

  for (let i = 0; i < ITEM_COUNT; i++) {
    // Busy-wait to simulate real texture decode time
    const end = performance.now() + BUILD_DELAY_MS;
    while (performance.now() < end) {}

    const texture = makeTexture(i, TEXTURE_SIZE);
    const material = new THREE.MeshStandardMaterial({
      map: texture, roughness: 0.4, metalness: 0.15,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const pos = spiralPosition(i);
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.lookAt(0, pos.y, 0);
    textures.push(texture);
    materials.push(material);
    root.add(mesh);
  }

  scene.add(root);

  return {
    cleanup() {
      geometry.dispose();
      textures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
    },
    update() {},
    loadedCount: ITEM_COUNT,
  };
}

// -- Optimized Variant (progressive/chunked build) --

async function buildOptimized(scene, renderer, camera) {
  const root = new THREE.Group();
  scene.add(root);
  const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const textures = [];
  const materials = [];
  let loadOrbit = 0;

  await buildChunked({
    total: ITEM_COUNT,
    chunkSize: 10,
    build(index) {
      // Same busy-wait per item to simulate decode
      const end = performance.now() + BUILD_DELAY_MS;
      while (performance.now() < end) {}

      const texture = makeTexture(index, TEXTURE_SIZE);
      const material = new THREE.MeshStandardMaterial({
        map: texture, roughness: 0.4, metalness: 0.15,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const pos = spiralPosition(index);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.lookAt(0, pos.y, 0);
      textures.push(texture);
      materials.push(material);
      root.add(mesh);
    },
    render() {
      // Orbit camera during loading so there's no snap when benchmark starts
      const orbit = loadOrbit * 0.004;
      camera.position.x = Math.cos(orbit) * 25;
      camera.position.z = Math.sin(orbit) * 25;
      camera.position.y = 15;
      camera.lookAt(0, 0, 0);
      loadOrbit += 1;
      renderer.render(scene, camera);
    },
    hud(done, total) {
      updateHud("Lazy Loading / optimized", [`loading: ${done}/${total} assets`]);
    },
  });

  return {
    cleanup() {
      geometry.dispose();
      textures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
    },
    update() {},
    loadedCount: ITEM_COUNT,
    loadFrames: loadOrbit,
  };
}

// -- Main Loop --

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

  updateHud(`Lazy Loading / ${variant}`, [
    `items: ${ITEM_COUNT}`,
    "warming up...",
  ]);

  const built = variant === "optimized"
    ? await buildOptimized(scene, renderer, camera)
    : buildBaseline(scene);

  // Continue orbit from where loading left off — no camera snap
  let frameIndex = built.loadFrames || 0;

  const frameTimes = [];
  const renderCpuTimes = [];
  const updateTimes = [];
  let totalFrames = 0;
  let renderCallsTotal = 0;
  let lastNow = performance.now();

  function frame(now) {
    const delta = now - lastNow;
    lastNow = now;

    // Camera orbit
    const orbit = frameIndex * 0.004;
    camera.position.x = Math.cos(orbit) * 25;
    camera.position.z = Math.sin(orbit) * 25;
    camera.position.y = 15;
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
      updateHud(`Lazy Loading / ${variant}`, [
        `frame: ${frameIndex}`,
        `avg fps: ${formatNumber(frameTimes.length > 0 ? 1000 / (frameTimes.reduce((s, v) => s + v, 0) / frameTimes.length) : 0)}`,
        `render ms: ${formatNumber(renderCpuTime)}`,
        `render calls: ${renderer.info.render.calls}`,
        `loaded: ${built.loadedCount}/${ITEM_COUNT}`,
      ]);
    }

    frameIndex += 1;

    if (totalFrames >= SAMPLE_FRAMES) {
      // -- Final results --
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

      updateHud(`Lazy Loading / ${variant}`, [
        `avg fps: ${formatNumber(window.__BENCHMARK_RESULT__.averageFps)}`,
        `avg render ms: ${formatNumber(averageRenderCpuTime)}`,
        `render calls: ${formatNumber(window.__BENCHMARK_RESULT__.averageRenderCalls)}`,
        `loaded: ${built.loadedCount}/${ITEM_COUNT}`,
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
  updateHud("Lazy Loading / error", [String(window.__BENCHMARK_RESULT__.error)]);
});

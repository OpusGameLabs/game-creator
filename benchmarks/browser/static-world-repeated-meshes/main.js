import * as THREE from "/node_modules/three/build/three.module.js";
import { createSky, createLights, setupRenderer, buildChunked } from "../shared/env.js";

const WORLD_WIDTH = 140;
const WORLD_DEPTH = 140;
const WORLD_SIZE = WORLD_WIDTH * WORLD_DEPTH;
const WARMUP_FRAMES = 30;
const SAMPLE_FRAMES = 180;
const CAMERA_ORBIT_RADIUS = 180;
const CAMERA_HEIGHT = 80;

function formatNumber(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index] ?? 0;
}

function createSharedSceneBits(renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(CAMERA_ORBIT_RADIUS, CAMERA_HEIGHT, CAMERA_ORBIT_RADIUS);
  camera.lookAt(0, 0, 0);

  createSky(scene, { fogDensity: 0.003, starCount: 350 });
  createLights(scene, { keyPos: [60, 80, 40], fillColor: 0x8899bb, fillIntensity: 0.4, fillPos: [-40, 20, -30] });

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_WIDTH * 2, WORLD_DEPTH * 2),
    new THREE.MeshStandardMaterial({ color: 0x0e1318, roughness: 0.9, metalness: 0.0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.6;
  scene.add(floor);

  renderer.info.autoReset = false;

  return { camera, scene };
}

async function buildBaseline(scene, renderer, camera) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x44aa77, roughness: 0.45, metalness: 0.15, emissive: 0x0a2218, emissiveIntensity: 0.2 });
  const root = new THREE.Group();
  scene.add(root);

  await buildChunked({
    total: WORLD_SIZE,
    chunkSize: 800,
    build(index) {
      const x = index % WORLD_WIDTH;
      const z = Math.floor(index / WORLD_WIDTH);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((x - WORLD_WIDTH / 2) * 1.5, 0, (z - WORLD_DEPTH / 2) * 1.5);
      root.add(mesh);
    },
    render() { renderer.render(scene, camera); },
    hud(done, total) {
      updateHud("Static World / baseline", [`loading: ${done}/${total} meshes`]);
    },
  });

  return { geometry, material, root };
}

function buildOptimized(scene) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x44aa77, roughness: 0.45, metalness: 0.15, emissive: 0x0a2218, emissiveIntensity: 0.2 });
  const root = new THREE.Group();
  const instanced = new THREE.InstancedMesh(geometry, material, WORLD_SIZE);
  const matrix = new THREE.Matrix4();

  let index = 0;
  for (let x = 0; x < WORLD_WIDTH; x += 1) {
    for (let z = 0; z < WORLD_DEPTH; z += 1) {
      matrix.makeTranslation((x - WORLD_WIDTH / 2) * 1.5, 0, (z - WORLD_DEPTH / 2) * 1.5);
      instanced.setMatrixAt(index, matrix);
      index += 1;
    }
  }

  instanced.instanceMatrix.needsUpdate = true;
  root.add(instanced);
  scene.add(root);
  return { geometry, material, root };
}

function getVariant() {
  const url = new URL(window.location.href);
  return url.searchParams.get("variant") === "optimized" ? "optimized" : "baseline";
}

function updateHud(title, lines) {
  const titleNode = document.getElementById("hud-title");
  const metricsNode = document.getElementById("hud-metrics");
  titleNode.textContent = title;
  metricsNode.textContent = lines.join("\n");
}

async function run() {
  const canvas = document.getElementById("benchmark-canvas");
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    powerPreference: "high-performance",
  });
  setupRenderer(renderer);

  const { scene, camera } = createSharedSceneBits(renderer);
  const variant = getVariant();
  const built = variant === "optimized" ? buildOptimized(scene) : await buildBaseline(scene, renderer, camera);
  updateHud(`Static World / ${variant}`, [
    `objects: ${WORLD_SIZE}`,
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
    const orbit = frameIndex * 0.005;
    camera.position.x = Math.cos(orbit) * CAMERA_ORBIT_RADIUS;
    camera.position.z = Math.sin(orbit) * CAMERA_ORBIT_RADIUS;
    camera.lookAt(0, 0, 0);

    renderer.info.reset();
    const renderStart = performance.now();
    renderer.render(scene, camera);
    const renderCpuTime = performance.now() - renderStart;

    if (frameIndex >= WARMUP_FRAMES) {
      frameTimes.push(delta);
      renderCpuTimes.push(renderCpuTime);
      renderCallsTotal += renderer.info.render.calls;
      trianglesTotal += renderer.info.render.triangles;
      totalFrames += 1;
    }

    if (frameIndex % 15 === 0) {
      updateHud(`Static World / ${variant}`, [
        `frame: ${frameIndex}`,
        `avg fps: ${frameTimes.length > 0 ? formatNumber(1000 / (frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length)) : "warming"}`,
        `render calls: ${renderer.info.render.calls}`,
        `cpu render ms: ${formatNumber(renderCpuTime)}`,
        `triangles: ${renderer.info.render.triangles}`,
      ]);
    }

    frameIndex += 1;

    if (totalFrames >= SAMPLE_FRAMES) {
      const averageFrameTime = frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length;
      const averageFps = 1000 / averageFrameTime;
      const averageRenderCpuTime =
        renderCpuTimes.reduce((sum, value) => sum + value, 0) / renderCpuTimes.length;
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

      updateHud(`Static World / ${variant}`, [
        `avg fps: ${formatNumber(averageFps)}`,
        `avg frame ms: ${formatNumber(averageFrameTime)}`,
        `avg cpu render ms: ${formatNumber(averageRenderCpuTime)}`,
        `p95 cpu render ms: ${formatNumber(percentile(renderCpuTimes, 0.95))}`,
        `avg render calls: ${formatNumber(renderCallsTotal / totalFrames)}`,
      ]);

      built.geometry.dispose();
      built.material.dispose();
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
  updateHud("Static World / error", [String(window.__BENCHMARK_RESULT__.error)]);
});

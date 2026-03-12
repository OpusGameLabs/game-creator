import * as THREE from "/node_modules/three/build/three.module.js";
import { createSky, createLights, setupRenderer } from "../shared/env.js";

const GRID_SIZE = 200;
const VERTEX_COUNT = GRID_SIZE * GRID_SIZE;
const WARMUP_FRAMES = 20;
const SAMPLE_FRAMES = 300;

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

function createHud(title, lines) {
  document.getElementById("hud-title").textContent = title;
  document.getElementById("hud-metrics").textContent = lines.join("\n");
}

function terrainHeight(x, z, t) {
  return Math.sin(x * 0.15 + t * 0.02) * Math.cos(z * 0.12 + t * 0.015) * 3.5 +
    Math.sin(x * 0.08 - z * 0.06 + t * 0.03) * 2.0;
}

function createWorld(renderer) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(50, 30, 50);
  camera.lookAt(0, 0, 0);

  createSky(scene, { fogDensity: 0.006, starCount: 320 });
  createLights(scene, { hemiSky: 0x336655, hemiGround: 0x111a11, keyColor: 0xffeedd, keyPos: [30, 40, 20], fillColor: 0x448866, fillIntensity: 0.3, fillPos: [-20, 10, -25] });

  renderer.info.autoReset = false;

  return { camera, scene };
}

function buildBaseline(scene) {
  const material = new THREE.MeshStandardMaterial({ color: 0x22aa66, roughness: 0.5, metalness: 0.15, flatShading: true, emissive: 0x0a2218, emissiveIntensity: 0.15 });
  let currentMesh = null;

  return {
    cleanup() {
      if (currentMesh) {
        currentMesh.geometry.dispose();
        scene.remove(currentMesh);
      }
      material.dispose();
    },
    update(tick) {
      if (currentMesh) {
        currentMesh.geometry.dispose();
        scene.remove(currentMesh);
      }

      const geometry = new THREE.PlaneGeometry(60, 60, GRID_SIZE - 1, GRID_SIZE - 1);
      geometry.rotateX(-Math.PI / 2);
      const positions = geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        positions[i + 1] = terrainHeight(x, z, tick);
      }

      geometry.computeVertexNormals();

      currentMesh = new THREE.Mesh(geometry, material);
      scene.add(currentMesh);
    },
  };
}

function buildOptimized(scene) {
  const geometry = new THREE.PlaneGeometry(60, 60, GRID_SIZE - 1, GRID_SIZE - 1);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({ color: 0x22aa66, roughness: 0.5, metalness: 0.15, flatShading: true, emissive: 0x0a2218, emissiveIntensity: 0.15 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const positions = geometry.attributes.position.array;

  return {
    cleanup() {
      geometry.dispose();
      material.dispose();
      scene.remove(mesh);
    },
    update(tick) {
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        positions[i + 1] = terrainHeight(x, z, tick);
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    },
  };
}

async function run() {
  const variant = getVariant();
  const canvas = document.getElementById("benchmark-canvas");
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    powerPreference: "high-performance",
  });
  setupRenderer(renderer);

  const { scene, camera } = createWorld(renderer);
  const built = variant === "optimized" ? buildOptimized(scene) : buildBaseline(scene);
  const frameTimes = [];
  const renderCpuTimes = [];
  const updateTimes = [];
  let frameIndex = 0;
  let totalFrames = 0;
  let renderCallsTotal = 0;
  let lastNow = performance.now();

  createHud(`Morphing Terrain / ${variant}`, [
    `vertices: ${VERTEX_COUNT}`,
    "warming up...",
  ]);

  function frame(now) {
    const delta = now - lastNow;
    lastNow = now;
    const orbit = frameIndex * 0.006;
    camera.position.x = Math.cos(orbit) * 50;
    camera.position.z = Math.sin(orbit) * 50;
    camera.position.y = 30;
    camera.lookAt(0, 0, 0);

    const updateStart = performance.now();
    built.update(frameIndex);
    const updateTime = performance.now() - updateStart;

    renderer.info.reset();
    const renderStart = performance.now();
    renderer.render(scene, camera);
    const renderCpuTime = performance.now() - renderStart;

    if (frameIndex >= WARMUP_FRAMES) {
      frameTimes.push(delta);
      renderCpuTimes.push(renderCpuTime);
      updateTimes.push(updateTime);
      renderCallsTotal += renderer.info.render.calls;
      totalFrames += 1;
    }

    if (frameIndex % 15 === 0) {
      const avgFrameTime =
        frameTimes.length > 0 ? frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length : null;
      createHud(`Morphing Terrain / ${variant}`, [
        `frame: ${frameIndex}`,
        `avg fps: ${avgFrameTime ? formatNumber(1000 / avgFrameTime) : "warming"}`,
        `update ms: ${formatNumber(updateTime)}`,
        `render ms: ${formatNumber(renderCpuTime)}`,
        `render calls: ${renderer.info.render.calls}`,
        `vertices: ${VERTEX_COUNT}`,
      ]);
    }

    frameIndex += 1;

    if (totalFrames >= SAMPLE_FRAMES) {
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

      createHud(`Morphing Terrain / ${variant}`, [
        `avg fps: ${formatNumber(window.__BENCHMARK_RESULT__.averageFps)}`,
        `avg update ms: ${formatNumber(averageUpdateTime)}`,
        `avg render ms: ${formatNumber(averageRenderCpuTime)}`,
        `p95 update ms: ${formatNumber(window.__BENCHMARK_RESULT__.updateTimeP95Ms)}`,
        `avg render calls: ${formatNumber(window.__BENCHMARK_RESULT__.averageRenderCalls)}`,
        `vertices: ${VERTEX_COUNT}`,
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
  createHud("Morphing Terrain / error", [String(window.__BENCHMARK_RESULT__.error)]);
});

import * as THREE from "/node_modules/three/build/three.module.js";
import { createSky, createLights, setupRenderer } from "../shared/env.js";

const ENTITY_COUNT = 8000;
const GRID_WIDTH = 100;
const WARMUP_FRAMES = 30;
const SAMPLE_FRAMES = 180;
const CAMERA_RADIUS = 72;

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

function basePosition(index) {
  const x = (index % GRID_WIDTH) - GRID_WIDTH / 2;
  const z = Math.floor(index / GRID_WIDTH) - GRID_WIDTH / 2;
  return {
    x: x * 0.9,
    z: z * 0.9,
  };
}

function createWorld(renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(CAMERA_RADIUS, 42, CAMERA_RADIUS);
  camera.lookAt(0, 0, 0);

  createSky(scene, { fogDensity: 0.005, starCount: 280 });
  createLights(scene, { hemiSky: 0x334466, keyColor: 0xddeeff, keyPos: [30, 50, 25] });

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(130, 130),
    new THREE.MeshStandardMaterial({ color: 0x0a1018, roughness: 0.9, metalness: 0.0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.2;
  scene.add(floor);

  renderer.info.autoReset = false;

  return { camera, scene };
}

function buildBaseline(scene) {
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshStandardMaterial({ color: 0x4ea7d8, roughness: 0.35, metalness: 0.2, emissive: 0x0a1a2a, emissiveIntensity: 0.3 });
  const root = new THREE.Group();
  const meshes = [];

  for (let index = 0; index < ENTITY_COUNT; index += 1) {
    const mesh = new THREE.Mesh(geometry, material);
    const position = basePosition(index);
    mesh.position.set(position.x, 0, position.z);
    meshes.push(mesh);
    root.add(mesh);
  }

  scene.add(root);

  return {
    cleanup() {
      geometry.dispose();
      material.dispose();
    },
    root,
    update(tick) {
      for (let index = 0; index < meshes.length; index += 1) {
        const mesh = meshes[index];
        const position = basePosition(index);
        mesh.position.x = position.x + Math.sin(tick * 0.03 + index * 0.01) * 0.35;
        mesh.position.y = Math.sin(tick * 0.08 + index * 0.03) * 1.4;
        mesh.position.z = position.z + Math.cos(tick * 0.02 + index * 0.015) * 0.35;
      }
    },
  };
}

function buildOptimized(scene) {
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshStandardMaterial({ color: 0x4ea7d8, roughness: 0.35, metalness: 0.2, emissive: 0x0a1a2a, emissiveIntensity: 0.3 });
  const root = new THREE.Group();
  const instancedMesh = new THREE.InstancedMesh(geometry, material, ENTITY_COUNT);
  const matrix = new THREE.Matrix4();
  const offsets = new Float32Array(ENTITY_COUNT * 3);
  const seeds = new Float32Array(ENTITY_COUNT);

  for (let index = 0; index < ENTITY_COUNT; index += 1) {
    const position = basePosition(index);
    matrix.makeTranslation(position.x, 0, position.z);
    instancedMesh.setMatrixAt(index, matrix);
    offsets[index * 3] = position.x;
    offsets[index * 3 + 1] = 0;
    offsets[index * 3 + 2] = position.z;
    seeds[index] = index;
  }

  geometry.setAttribute("instanceOffset", new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute("instanceSeed", new THREE.InstancedBufferAttribute(seeds, 1));

  const shaderState = {
    time: { value: 0 },
  };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shaderState.time;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         attribute vec3 instanceOffset;
         attribute float instanceSeed;
         uniform float uTime;`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3(position);
         transformed.xyz += vec3(
           sin(uTime * 0.03 + instanceSeed * 0.01) * 0.35,
           sin(uTime * 0.08 + instanceSeed * 0.03) * 1.4,
           cos(uTime * 0.02 + instanceSeed * 0.015) * 0.35
         );`,
      );
  };
  material.needsUpdate = true;
  instancedMesh.instanceMatrix.needsUpdate = true;
  root.add(instancedMesh);
  scene.add(root);

  return {
    cleanup() {
      geometry.dispose();
      material.dispose();
    },
    root,
    update(tick) {
      shaderState.time.value = tick;
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

  createHud(`Moving Entities / ${variant}`, [
    `entities: ${ENTITY_COUNT}`,
    "warming up...",
  ]);

  function frame(now) {
    const delta = now - lastNow;
    lastNow = now;
    const orbit = frameIndex * 0.006;
    camera.position.x = Math.cos(orbit) * CAMERA_RADIUS;
    camera.position.z = Math.sin(orbit) * CAMERA_RADIUS;
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
      createHud(`Moving Entities / ${variant}`, [
        `frame: ${frameIndex}`,
        `avg fps: ${avgFrameTime ? formatNumber(1000 / avgFrameTime) : "warming"}`,
        `update ms: ${formatNumber(updateTime)}`,
        `render ms: ${formatNumber(renderCpuTime)}`,
        `render calls: ${renderer.info.render.calls}`,
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

      createHud(`Moving Entities / ${variant}`, [
        `avg fps: ${formatNumber(window.__BENCHMARK_RESULT__.averageFps)}`,
        `avg update ms: ${formatNumber(averageUpdateTime)}`,
        `avg render ms: ${formatNumber(averageRenderCpuTime)}`,
        `p95 update ms: ${formatNumber(window.__BENCHMARK_RESULT__.updateTimeP95Ms)}`,
        `avg render calls: ${formatNumber(window.__BENCHMARK_RESULT__.averageRenderCalls)}`,
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
  createHud("Moving Entities / error", [String(window.__BENCHMARK_RESULT__.error)]);
});

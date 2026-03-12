import * as THREE from "/node_modules/three/build/three.module.js";
import { createSky, createLights, setupRenderer, buildChunked } from "../shared/env.js";

const PARTICLE_COUNT = 30000;
const WARMUP_FRAMES = 20;
const SAMPLE_FRAMES = 300;
const CAMERA_RADIUS = 40;

function createRng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

function initParticles(rng) {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const life = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    spawnParticle(i, positions, velocities, life, rng);
  }

  return { positions, velocities, life };
}

function spawnParticle(i, positions, velocities, life, rng) {
  const angle = rng() * Math.PI * 2;
  const radius = rng() * 0.5;
  const i3 = i * 3;

  positions[i3] = Math.cos(angle) * radius;
  positions[i3 + 1] = rng() * 0.5;
  positions[i3 + 2] = Math.sin(angle) * radius;

  const speed = 0.02 + rng() * 0.04;
  const outAngle = angle + (Math.PI / 2) * (0.8 + rng() * 0.4);
  velocities[i3] = Math.cos(outAngle) * speed;
  velocities[i3 + 1] = 0.03 + rng() * 0.05;
  velocities[i3 + 2] = Math.sin(outAngle) * speed;

  life[i] = 0.3 + rng() * 0.7;
}

function updateParticles(positions, velocities, life, rng) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    life[i] -= 0.002;

    if (life[i] <= 0) {
      spawnParticle(i, positions, velocities, life, rng);
      continue;
    }

    const px = positions[i3];
    const pz = positions[i3 + 2];

    // Vortex force (tangential around Y axis)
    velocities[i3] += -pz * 0.003;
    velocities[i3 + 2] += px * 0.003;

    // Lift
    velocities[i3 + 1] += 0.002;

    // Gravity
    velocities[i3 + 1] -= 0.001;

    // Drag
    velocities[i3] *= 0.998;
    velocities[i3 + 1] *= 0.998;
    velocities[i3 + 2] *= 0.998;

    // Integrate
    positions[i3] += velocities[i3];
    positions[i3 + 1] += velocities[i3 + 1];
    positions[i3 + 2] += velocities[i3 + 2];
  }
}

function createWorld(renderer) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(CAMERA_RADIUS, 20, CAMERA_RADIUS);
  camera.lookAt(0, 5, 0);

  createSky(scene, { fogDensity: 0.008, starCount: 400 });
  createLights(scene, { hemiSky: 0x224488, keyColor: 0xaaccff, keyIntensity: 1.0, keyPos: [10, 20, 10], fillColor: 0x4466aa, fillIntensity: 0.3, fillPos: [-10, 5, -15] });

  renderer.info.autoReset = false;

  return { camera, scene };
}

async function buildBaseline(scene, positions, renderer, camera) {
  const geometry = new THREE.SphereGeometry(0.06, 4, 4);
  const material = new THREE.MeshStandardMaterial({
    color: 0x44aaff,
    roughness: 0.3,
    metalness: 0.3,
    emissive: 0x2266cc,
    emissiveIntensity: 0.5,
  });
  const root = new THREE.Group();
  const meshes = [];
  scene.add(root);

  await buildChunked({
    total: PARTICLE_COUNT,
    chunkSize: 1000,
    build(i) {
      const mesh = new THREE.Mesh(geometry, material);
      const i3 = i * 3;
      mesh.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      meshes.push(mesh);
      root.add(mesh);
    },
    render() { renderer.render(scene, camera); },
    hud(done, total) {
      document.getElementById("hud-metrics").textContent = `loading: ${done}/${total} particles`;
    },
  });

  return {
    cleanup() {
      geometry.dispose();
      material.dispose();
    },
    update(positions) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        meshes[i].position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      }
    },
  };
}

function buildOptimized(scene, positions) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x44aaff,
    size: 0.15,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
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

  const { scene, camera } = createWorld(renderer);
  const { positions, velocities, life } = initParticles(rng);
  const built = variant === "optimized" ? buildOptimized(scene, positions) : await buildBaseline(scene, positions, renderer, camera);

  const frameTimes = [];
  const renderCpuTimes = [];
  const updateTimes = [];
  let frameIndex = 0;
  let totalFrames = 0;
  let renderCallsTotal = 0;
  let lastNow = performance.now();

  createHud(`Particle Storm / ${variant}`, [
    `particles: ${PARTICLE_COUNT}`,
    "warming up...",
  ]);

  function frame(now) {
    const delta = now - lastNow;
    lastNow = now;

    // Orbit camera slowly
    const orbit = frameIndex * 0.004;
    camera.position.x = Math.cos(orbit) * CAMERA_RADIUS;
    camera.position.z = Math.sin(orbit) * CAMERA_RADIUS;
    camera.lookAt(0, 5, 0);

    // Update physics
    const updateStart = performance.now();
    updateParticles(positions, velocities, life, rng);
    built.update(positions);
    const updateTime = performance.now() - updateStart;

    // Render
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
      createHud(`Particle Storm / ${variant}`, [
        `frame: ${frameIndex}`,
        `avg fps: ${avgFrameTime ? formatNumber(1000 / avgFrameTime) : "warming"}`,
        `update ms: ${formatNumber(updateTime)}`,
        `render ms: ${formatNumber(renderCpuTime)}`,
        `render calls: ${renderer.info.render.calls}`,
        `particles: ${PARTICLE_COUNT}`,
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

      createHud(`Particle Storm / ${variant}`, [
        `avg fps: ${formatNumber(window.__BENCHMARK_RESULT__.averageFps)}`,
        `avg update ms: ${formatNumber(averageUpdateTime)}`,
        `avg render ms: ${formatNumber(averageRenderCpuTime)}`,
        `p95 update ms: ${formatNumber(window.__BENCHMARK_RESULT__.updateTimeP95Ms)}`,
        `avg render calls: ${formatNumber(window.__BENCHMARK_RESULT__.averageRenderCalls)}`,
        `particles: ${PARTICLE_COUNT}`,
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
  createHud("Particle Storm / error", [String(window.__BENCHMARK_RESULT__.error)]);
});

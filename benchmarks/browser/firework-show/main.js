import * as THREE from "/node_modules/three/build/three.module.js";
import { createSky, createLights, setupRenderer } from "../shared/env.js";

// -- Constants --
const PARTICLE_COUNT = 20000;
const PARTICLES_PER_BURST = 200;
const LAUNCH_INTERVAL = 8;
const GRAVITY = -0.003;
const WARMUP_FRAMES = 20;
const SAMPLE_FRAMES = 400;

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

// -- Deterministic PRNG --

function createRng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// -- Burst colors --
const BURST_COLORS = [
  [1.0, 0.3, 0.1],
  [0.2, 0.5, 1.0],
  [0.1, 1.0, 0.3],
  [1.0, 0.8, 0.1],
  [0.8, 0.2, 1.0],
];

// -- Particle state --

function initParticleState() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const life = new Float32Array(PARTICLE_COUNT);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  // All particles start dormant (life = 0)
  return { positions, velocities, life, colors };
}

function launchBurst(positions, velocities, life, colors, rng) {
  const x = (rng() * 30) - 15;
  const y = 20 + rng() * 10;
  const z = (rng() * 10) - 5;

  const colorIndex = Math.floor(rng() * BURST_COLORS.length);
  const burstColor = BURST_COLORS[colorIndex];

  let spawned = 0;
  for (let i = 0; i < PARTICLE_COUNT && spawned < PARTICLES_PER_BURST; i++) {
    if (life[i] > 0) continue;

    const i3 = i * 3;

    // Set burst origin
    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    // Random spherical velocity
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const speed = 0.1 + rng() * 0.2;
    velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
    velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
    velocities[i3 + 2] = Math.cos(phi) * speed;

    // Burst color
    colors[i3] = burstColor[0];
    colors[i3 + 1] = burstColor[1];
    colors[i3 + 2] = burstColor[2];

    // Life
    life[i] = 0.6 + rng() * 0.4;

    spawned++;
  }
}

function updateParticles(positions, velocities, life) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (life[i] <= 0) continue;

    const i3 = i * 3;

    // Gravity
    velocities[i3 + 1] += GRAVITY;

    // Drag
    velocities[i3] *= 0.995;
    velocities[i3 + 1] *= 0.995;
    velocities[i3 + 2] *= 0.995;

    // Integrate
    positions[i3] += velocities[i3];
    positions[i3 + 1] += velocities[i3 + 1];
    positions[i3 + 2] += velocities[i3 + 2];

    // Decrement life
    life[i] -= 0.005;
    if (life[i] < 0) life[i] = 0;
  }
}

function countActive(life) {
  let count = 0;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (life[i] > 0) count++;
  }
  return count;
}

// -- Scene Setup --

function createScene(renderer) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight, 0.1, 500
  );
  camera.position.set(0, 15, 50);
  camera.lookAt(0, 15, 0);

  createSky(scene, { fogDensity: 0.003, starCount: 400 });
  createLights(scene, { keyIntensity: 0.5, hemiIntensity: 0.3 });

  renderer.info.autoReset = false;

  return { camera, scene };
}

// -- Baseline Variant --

function buildBaseline(scene, positions, velocities, life, colors, rng) {
  const geometry = new THREE.SphereGeometry(0.08, 4, 4);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.0,
    roughness: 0.3,
    metalness: 0.2,
  });

  const root = new THREE.Group();
  const meshes = [];
  const emissiveColor = new THREE.Color();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.visible = false;
    meshes.push(mesh);
    root.add(mesh);
  }

  scene.add(root);

  return {
    cleanup() {
      geometry.dispose();
      for (let i = 0; i < meshes.length; i++) {
        meshes[i].material.dispose();
      }
    },
    update(frameIndex) {
      // Launch bursts
      if (frameIndex % LAUNCH_INTERVAL === 0) {
        launchBurst(positions, velocities, life, colors, rng);
      }

      // Physics
      updateParticles(positions, velocities, life);

      // Sync meshes
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        if (life[i] > 0) {
          meshes[i].visible = true;
          meshes[i].position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
          emissiveColor.setRGB(
            colors[i3] * life[i],
            colors[i3 + 1] * life[i],
            colors[i3 + 2] * life[i]
          );
          meshes[i].material.emissive.copy(emissiveColor);
        } else {
          meshes[i].visible = false;
        }
      }
    },
  };
}

// -- Optimized Variant --

function buildOptimized(scene, positions, velocities, life, colors, rng) {
  const geometry = new THREE.BufferGeometry();

  const posAttr = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute("position", posAttr);

  const displayColors = new Float32Array(PARTICLE_COUNT * 3);
  const colorAttr = new THREE.BufferAttribute(displayColors, 3);
  geometry.setAttribute("color", colorAttr);

  const material = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    cleanup() {
      geometry.dispose();
      material.dispose();
    },
    update(frameIndex) {
      // Launch bursts
      if (frameIndex % LAUNCH_INTERVAL === 0) {
        launchBurst(positions, velocities, life, colors, rng);
      }

      // Physics
      updateParticles(positions, velocities, life);

      // Update display color buffer (color * life for fade)
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        if (life[i] > 0) {
          displayColors[i3] = colors[i3] * life[i];
          displayColors[i3 + 1] = colors[i3 + 1] * life[i];
          displayColors[i3 + 2] = colors[i3 + 2] * life[i];
        } else {
          displayColors[i3] = 0;
          displayColors[i3 + 1] = 0;
          displayColors[i3 + 2] = 0;
        }
      }

      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
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
  const { positions, velocities, life, colors } = initParticleState();

  const built = variant === "optimized"
    ? buildOptimized(scene, positions, velocities, life, colors, rng)
    : buildBaseline(scene, positions, velocities, life, colors, rng);

  updateHud(`Firework Show / ${variant}`, [
    `particles: ${PARTICLE_COUNT}`,
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

    // Gentle camera sway (mostly fixed)
    const sway = frameIndex * 0.002;
    camera.position.x = Math.sin(sway) * 3;
    camera.position.z = 50 + Math.cos(sway) * 2;
    camera.lookAt(0, 15, 0);

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
      const active = countActive(life);
      updateHud(`Firework Show / ${variant}`, [
        `frame: ${frameIndex}`,
        `avg fps: ${avgFrameTime ? formatNumber(1000 / avgFrameTime) : "warming"}`,
        `update ms: ${formatNumber(updateTime)}`,
        `render ms: ${formatNumber(renderCpuTime)}`,
        `render calls: ${renderer.info.render.calls}`,
        `active particles: ${active}`,
      ]);
    }

    frameIndex += 1;

    if (totalFrames >= SAMPLE_FRAMES) {
      // Final results
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

      updateHud(`Firework Show / ${variant}`, [
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
  updateHud("Firework Show / error", [String(window.__BENCHMARK_RESULT__.error)]);
});

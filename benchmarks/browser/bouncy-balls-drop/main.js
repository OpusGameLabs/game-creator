import * as THREE from "/node_modules/three/build/three.module.js";
import { createSky, createLights, setupRenderer, buildChunked } from "../shared/env.js";

const BALL_COUNT = 10000;
const GRID_WIDTH = 100;
const GRID_DEPTH = 100;
const RADIUS = 0.18;
const FLOOR_Y = -12;
const GRAVITY = -0.0125;
const RESTITUTION = 0.75;
const SLEEP_VELOCITY = 0.018;
const MAX_BOUNCES = 14;
const DRAG = 0.9997;
const LATERAL_KICK = 0.012;
const WARMUP_FRAMES = 20;
const SAMPLE_FRAMES = 420;
const CHAOS_PHASE_FRAMES = 180;

/* Deterministic PRNG (mulberry32) so benchmarks are reproducible across runs */
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

function updateHud(title, lines) {
  document.getElementById("hud-title").textContent = title;
  document.getElementById("hud-metrics").textContent = lines.join("\n");
}

function createScene(renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(30, 24, 36);
  camera.lookAt(0, -3, 0);

  createSky(scene, { fogDensity: 0.006, starCount: 250 });
  createLights(scene, { hemiSky: 0x445566, hemiGround: 0x221111, keyPos: [20, 30, 15], fillColor: 0xff6644, fillIntensity: 0.3, fillPos: [-15, 10, -20] });

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x12181e, roughness: 0.85, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  scene.add(floor);

  renderer.info.autoReset = false;
  return { camera, scene };
}

function spawnStateArrays() {
  const rng = createRng(42);
  const positions = new Float32Array(BALL_COUNT * 3);
  const velocities = new Float32Array(BALL_COUNT * 3);
  const sleep = new Uint8Array(BALL_COUNT);
  const bounceCount = new Uint8Array(BALL_COUNT);

  for (let index = 0; index < BALL_COUNT; index += 1) {
    const x = (index % GRID_WIDTH) * 0.44 - (GRID_WIDTH * 0.44) / 2 + (rng() - 0.5) * 0.12;
    const z = Math.floor(index / GRID_WIDTH) * 0.44 - (GRID_DEPTH * 0.44) / 2 + (rng() - 0.5) * 0.12;
    const y = 18 + Math.floor(index / (GRID_WIDTH * 10)) * 0.5 + rng() * 0.5;
    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;
    velocities[index * 3] = (rng() - 0.5) * 0.02;
    velocities[index * 3 + 1] = -(rng() * 0.06 + 0.01);
    velocities[index * 3 + 2] = (rng() - 0.5) * 0.02;
  }

  return { bounceCount, positions, rng, sleep, velocities };
}

async function buildBaseline(scene, renderer, camera) {
  const state = spawnStateArrays();
  const geometry = new THREE.SphereGeometry(RADIUS, 16, 12);
  const material = new THREE.MeshStandardMaterial({ color: 0xe84040, roughness: 0.25, metalness: 0.4, emissive: 0x331010, emissiveIntensity: 0.4 });
  const root = new THREE.Group();
  const meshes = [];
  scene.add(root);

  await buildChunked({
    total: BALL_COUNT,
    chunkSize: 500,
    build(index) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        state.positions[index * 3],
        state.positions[index * 3 + 1],
        state.positions[index * 3 + 2],
      );
      meshes.push(mesh);
      root.add(mesh);
    },
    render() { renderer.render(scene, camera); },
    hud(done, total) {
      updateHud("Bouncy Balls / baseline", [`loading: ${done}/${total} spheres`]);
    },
  });

  return {
    cleanup() {
      geometry.dispose();
      material.dispose();
    },
    root,
    step(frame) {
      let sleeping = 0;
      for (let index = 0; index < BALL_COUNT; index += 1) {
        if (state.sleep[index] === 1) {
          sleeping += 1;
          continue;
        }

        const ix = index * 3;
        const iy = ix + 1;
        const iz = ix + 2;

        state.velocities[iy] += GRAVITY;
        state.velocities[ix] *= DRAG;
        state.velocities[iy] *= DRAG;
        state.velocities[iz] *= DRAG;
        state.positions[ix] += state.velocities[ix];
        state.positions[iy] += state.velocities[iy];
        state.positions[iz] += state.velocities[iz];

        if (state.positions[iy] <= FLOOR_Y + RADIUS) {
          state.positions[iy] = FLOOR_Y + RADIUS;
          state.velocities[iy] = Math.abs(state.velocities[iy]) * RESTITUTION;
          state.velocities[ix] += (state.rng() - 0.5) * LATERAL_KICK;
          state.velocities[iz] += (state.rng() - 0.5) * LATERAL_KICK;
          state.bounceCount[index] += 1;
          if (state.velocities[iy] < SLEEP_VELOCITY || state.bounceCount[index] > MAX_BOUNCES) {
            state.velocities[ix] = 0;
            state.velocities[iy] = 0;
            state.velocities[iz] = 0;
            state.sleep[index] = 1;
            sleeping += 1;
          }
        }

        meshes[index].position.set(state.positions[ix], state.positions[iy], state.positions[iz]);
      }

      return {
        activeCount: BALL_COUNT - sleeping,
        sleepingCount: sleeping,
      };
    },
  };
}

function buildOptimized(scene) {
  const state = spawnStateArrays();
  const geometry = new THREE.SphereGeometry(RADIUS, 16, 12);
  const material = new THREE.MeshStandardMaterial({ color: 0xe84040, roughness: 0.25, metalness: 0.4, emissive: 0x331010, emissiveIntensity: 0.4 });
  const root = new THREE.Group();
  const instancedMesh = new THREE.InstancedMesh(geometry, material, BALL_COUNT);
  const matrix = new THREE.Matrix4();

  for (let index = 0; index < BALL_COUNT; index += 1) {
    matrix.makeTranslation(
      state.positions[index * 3],
      state.positions[index * 3 + 1],
      state.positions[index * 3 + 2],
    );
    instancedMesh.setMatrixAt(index, matrix);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  root.add(instancedMesh);
  scene.add(root);

  return {
    cleanup() {
      geometry.dispose();
      material.dispose();
    },
    root,
    step(frame) {
      let sleeping = 0;

      for (let index = 0; index < BALL_COUNT; index += 1) {
        if (state.sleep[index] === 1) {
          sleeping += 1;
          continue;
        }

        const ix = index * 3;
        const iy = ix + 1;
        const iz = ix + 2;

        state.velocities[iy] += GRAVITY;
        state.velocities[ix] *= DRAG;
        state.velocities[iy] *= DRAG;
        state.velocities[iz] *= DRAG;
        state.positions[ix] += state.velocities[ix];
        state.positions[iy] += state.velocities[iy];
        state.positions[iz] += state.velocities[iz];

        if (state.positions[iy] <= FLOOR_Y + RADIUS) {
          state.positions[iy] = FLOOR_Y + RADIUS;
          state.velocities[iy] = Math.abs(state.velocities[iy]) * RESTITUTION;
          state.velocities[ix] += (state.rng() - 0.5) * LATERAL_KICK;
          state.velocities[iz] += (state.rng() - 0.5) * LATERAL_KICK;
          state.bounceCount[index] += 1;
          if (state.velocities[iy] < SLEEP_VELOCITY || state.bounceCount[index] > MAX_BOUNCES) {
            state.velocities[ix] = 0;
            state.velocities[iy] = 0;
            state.velocities[iz] = 0;
            state.sleep[index] = 1;
            sleeping += 1;
          }
        }

        matrix.makeTranslation(state.positions[ix], state.positions[iy], state.positions[iz]);
        instancedMesh.setMatrixAt(index, matrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;

      return {
        activeCount: BALL_COUNT - sleeping,
        sleepingCount: sleeping,
      };
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

  const { camera, scene } = createScene(renderer);
  const built = variant === "optimized" ? buildOptimized(scene) : await buildBaseline(scene, renderer, camera);

  updateHud(`Bouncy Balls / ${variant}`, [
    `balls: ${BALL_COUNT}`,
    "warming up...",
  ]);

  const frameTimes = [];
  const renderCpuTimes = [];
  const updateTimes = [];
  const chaosFrameTimes = [];
  const settleFrameTimes = [];
  let totalFrames = 0;
  let frameIndex = 0;
  let renderCallsTotal = 0;
  let sleepingCount = 0;
  let activeCount = BALL_COUNT;
  let lastNow = performance.now();

  function frame(now) {
    const delta = now - lastNow;
    lastNow = now;
    const orbit = frameIndex * 0.0025;
    camera.position.x = Math.cos(orbit) * 36;
    camera.position.z = Math.sin(orbit) * 36;
    camera.lookAt(0, -4, 0);

    const updateStart = performance.now();
    const state = built.step(frameIndex);
    const updateTime = performance.now() - updateStart;
    activeCount = state.activeCount;
    sleepingCount = state.sleepingCount;

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

      if (frameIndex < CHAOS_PHASE_FRAMES) {
        chaosFrameTimes.push(delta);
      } else {
        settleFrameTimes.push(delta);
      }
    }

    if (frameIndex % 12 === 0) {
      const phase = frameIndex < CHAOS_PHASE_FRAMES ? "chaos" : "settle";
      updateHud(`Bouncy Balls / ${variant}`, [
        `phase: ${phase}`,
        `frame: ${frameIndex}`,
        `active: ${activeCount}`,
        `sleeping: ${sleepingCount}`,
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
        activeCount,
        averageFps: 1000 / averageFrameTime,
        averageFrameTimeMs: averageFrameTime,
        averageRenderCalls: renderCallsTotal / totalFrames,
        averageRenderCpuTimeMs: averageRenderCpuTime,
        averageUpdateTimeMs: averageUpdateTime,
        chaosFrameTimeP95Ms: percentile(chaosFrameTimes, 0.95),
        frameTimeP95Ms: percentile(frameTimes, 0.95),
        renderCpuTimeP95Ms: percentile(renderCpuTimes, 0.95),
        sampleFrames: totalFrames,
        settleFrameTimeP95Ms: percentile(settleFrameTimes, 0.95),
        sleepingCount,
        updateTimeP95Ms: percentile(updateTimes, 0.95),
        variant,
      };

      updateHud(`Bouncy Balls / ${variant}`, [
        `avg fps: ${formatNumber(window.__BENCHMARK_RESULT__.averageFps)}`,
        `avg update ms: ${formatNumber(averageUpdateTime)}`,
        `avg render ms: ${formatNumber(averageRenderCpuTime)}`,
        `chaos p95 ms: ${formatNumber(window.__BENCHMARK_RESULT__.chaosFrameTimeP95Ms)}`,
        `settle p95 ms: ${formatNumber(window.__BENCHMARK_RESULT__.settleFrameTimeP95Ms)}`,
        `active/sleeping: ${activeCount}/${sleepingCount}`,
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
  updateHud("Bouncy Balls / error", [String(window.__BENCHMARK_RESULT__.error)]);
});

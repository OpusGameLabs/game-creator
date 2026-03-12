# Contributing New Benchmark Scenarios

Each benchmark is a self-contained folder under `benchmarks/browser/` with two files: `index.html` and `main.js`. Scenarios compare a **baseline** (naive) implementation against an **optimized** variant to demonstrate measurable Three.js performance wins.

## File Structure

```
benchmarks/browser/
  shared/
    env.js              # Shared sky, lighting, renderer setup
  your-benchmark-name/
    index.html           # Page shell (copy the template below)
    main.js              # Benchmark logic
```

## index.html Template

Copy this verbatim and change only the `<title>`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your Benchmark Name</title>
    <style>
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #080a0e; }
      canvas { display: block; width: 100%; height: 100%; }
      .hud { position: fixed; top: 16px; left: 16px; z-index: 10; min-width: 300px; padding: 12px 14px; border: 1px solid rgba(255,255,255,0.12); background: rgba(8,11,15,0.85); color: #dbe7f2; font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; backdrop-filter: blur(10px); }
      .hud h1 { margin: 0 0 8px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
      .hud pre { margin: 0; white-space: pre-wrap; }
      .nav { position: fixed; top: 16px; right: 16px; z-index: 10; padding: 9px 11px; border: 1px solid rgba(255,255,255,0.12); background: rgba(8,11,15,0.85); color: #dbe7f2; text-decoration: none; font: 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
    </style>
  </head>
  <body>
    <a class="nav" href="/benchmarks/browser/">Benchmark Lab</a>
    <div class="hud">
      <h1 id="hud-title">Benchmark</h1>
      <pre id="hud-metrics">Booting...</pre>
    </div>
    <canvas id="benchmark-canvas"></canvas>
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

## main.js Skeleton

```javascript
import * as THREE from "/node_modules/three/build/three.module.js";
import { createSky, createLights, setupRenderer } from "../shared/env.js";

// ── Constants ──
const ENTITY_COUNT = 10000;
const WARMUP_FRAMES = 20;
const SAMPLE_FRAMES = 300;

// ── Utilities (copy these verbatim) ──

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

// ── Deterministic PRNG (use if you need randomness) ──

function createRng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Scene Setup ──

function createScene(renderer) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 500
  );
  camera.position.set(30, 20, 30);
  camera.lookAt(0, 0, 0);

  // Shared environment — sky dome, fog, 3-light rig
  createSky(scene, { fogDensity: 0.006, starCount: 300 });
  createLights(scene);

  renderer.info.autoReset = false;
  return { camera, scene };
}

// ── Baseline Variant ──
// Use individual Mesh objects, naive per-frame updates, etc.

function buildBaseline(scene) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x44aa77, roughness: 0.4, metalness: 0.15,
  });
  // ... create meshes, add to scene ...
  return {
    cleanup() { geometry.dispose(); material.dispose(); },
    update(frame) { /* per-frame logic */ },
  };
}

// ── Optimized Variant ──
// Use InstancedMesh, BufferGeometry, GPU-side updates, etc.

function buildOptimized(scene) {
  // ... instanced/batched approach ...
  return {
    cleanup() { /* dispose */ },
    update(frame) { /* per-frame logic */ },
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
  const built = variant === "optimized"
    ? buildOptimized(scene) : buildBaseline(scene);

  updateHud(`Your Benchmark / ${variant}`, [
    `entities: ${ENTITY_COUNT}`,
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
    camera.position.x = Math.cos(orbit) * 30;
    camera.position.z = Math.sin(orbit) * 30;
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

    // HUD update (every 12 frames)
    if (frameIndex % 12 === 0) {
      updateHud(`Your Benchmark / ${variant}`, [
        `frame: ${frameIndex}`,
        `update ms: ${formatNumber(updateTime)}`,
        `render ms: ${formatNumber(renderCpuTime)}`,
        `render calls: ${renderer.info.render.calls}`,
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

      updateHud(`Your Benchmark / ${variant}`, [
        `avg fps: ${formatNumber(window.__BENCHMARK_RESULT__.averageFps)}`,
        `avg update ms: ${formatNumber(averageUpdateTime)}`,
        `avg render ms: ${formatNumber(averageRenderCpuTime)}`,
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
  updateHud("Your Benchmark / error", [String(window.__BENCHMARK_RESULT__.error)]);
});
```

## Shared Environment (`shared/env.js`)

Import these three helpers into every benchmark:

| Function | Purpose |
|---|---|
| `createSky(scene, opts?)` | Adds a gradient sky dome + stars + fog. Options: `skyColor`, `horizonColor`, `groundColor`, `radius`, `starCount`, `fogDensity` |
| `createLights(scene, opts?)` | Adds a 3-light rig (hemisphere + key directional + fill directional). Options: `hemiSky`, `hemiGround`, `hemiIntensity`, `keyColor`, `keyIntensity`, `keyPos`, `fillColor`, `fillIntensity`, `fillPos` |
| `setupRenderer(renderer)` | Configures ACES tone mapping, SRGB color space, HiDPI pixel ratio, fullscreen sizing |

## Checklist

- [ ] Folder name is `kebab-case` matching the scenario concept
- [ ] `index.html` uses the exact template (dark theme, HUD, nav link)
- [ ] `main.js` imports from `../shared/env.js`
- [ ] Variant selected via `?variant=baseline` or `?variant=optimized`
- [ ] Both variants tell the same visual story (same colors, same motion, same entity count)
- [ ] Uses `MeshStandardMaterial` (not Basic/Phong) for lit geometry
- [ ] Renderer created with `antialias: true` + `setupRenderer(renderer)`
- [ ] Scene uses `createSky()` + `createLights()`
- [ ] `renderer.info.autoReset = false` + `renderer.info.reset()` before each render
- [ ] Warmup phase before collecting metrics
- [ ] `window.__BENCHMARK_RESULT__` set on completion
- [ ] HUD updates every 12-15 frames
- [ ] Uses `createRng(42)` for any randomness (deterministic benchmarks)
- [ ] Camera orbits slowly so the scene is visible from multiple angles
- [ ] Add entry to `benchmarks/browser/index.html` sidebar

## Materials Guide

Use `MeshStandardMaterial` for all lit objects. Suggested PBR values by object type:

| Type | roughness | metalness | emissive |
|---|---|---|---|
| Organic/matte | 0.6-0.9 | 0.0-0.05 | none |
| Plastic/smooth | 0.25-0.45 | 0.1-0.2 | subtle warm |
| Metallic | 0.15-0.35 | 0.4-0.7 | none |
| Glowing/emissive | 0.3-0.5 | 0.1-0.3 | strong |
| Floor/ground | 0.85-0.95 | 0.0 | none |

## Optimization Patterns to Demonstrate

Good baseline-vs-optimized contrasts:

- **Individual Mesh** vs **InstancedMesh** — scene scale, draw call reduction
- **Per-frame JS transform** vs **GPU shader animation** — update loop
- **Geometry rebuild** vs **BufferAttribute update** — vertex animation
- **Individual Sprites** vs **Points BufferGeometry** — particle systems
- **Sequential loading** vs **Parallel + atlas** — asset startup
- **Many draw calls** vs **Merged geometry** — batching
- **Naive broad-phase** vs **Spatial hashing** — collision/proximity

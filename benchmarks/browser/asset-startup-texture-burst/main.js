import * as THREE from "/node_modules/three/build/three.module.js";

const TILE_COUNT = 64;
const GRID_WIDTH = 8;
const SAMPLE_FRAMES = 120;
const SEQUENTIAL_DELAY_MS = 14;
const PARALLEL_DELAY_MS = 16;

function formatNumber(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index] ?? 0;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getVariant() {
  const url = new URL(window.location.href);
  return url.searchParams.get("variant") === "optimized" ? "optimized" : "baseline";
}

function createHud(title, lines) {
  document.getElementById("hud-title").textContent = title;
  document.getElementById("hud-metrics").textContent = lines.join("\n");
}

function createScene(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080a10);

  const camera = new THREE.OrthographicCamera(-9, 9, 6, -6, 0.1, 50);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  // Gradient background plane behind the tiles
  const bgCanvas = document.createElement("canvas");
  bgCanvas.width = 2;
  bgCanvas.height = 256;
  const bgCtx = bgCanvas.getContext("2d");
  const grad = bgCtx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#0a1018");
  grad.addColorStop(1, "#141e28");
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, 2, 256);
  const bgTex = new THREE.CanvasTexture(bgCanvas);
  const bgPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 16),
    new THREE.MeshBasicMaterial({ map: bgTex }),
  );
  bgPlane.position.z = -1;
  scene.add(bgPlane);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffeedd, 0.6);
  key.position.set(5, 8, 10);
  scene.add(key);

  renderer.info.autoReset = false;
  return { camera, scene };
}

function makeTexture(seed, size = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  context.fillStyle = `hsl(${(seed * 31) % 360} 60% 48%)`;
  context.fillRect(0, 0, size, size);
  context.fillStyle = "rgba(255,255,255,0.2)";
  context.fillRect(0, 0, size, size / 4);
  context.fillStyle = "#0b1014";
  context.font = "bold 20px sans-serif";
  context.fillText(String(seed + 1), 10, 36);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function makeAtlasTexture(tileCount, gridWidth, tileSize = 96) {
  const rows = Math.ceil(tileCount / gridWidth);
  const canvas = document.createElement("canvas");
  canvas.width = gridWidth * tileSize;
  canvas.height = rows * tileSize;
  const context = canvas.getContext("2d");

  for (let index = 0; index < tileCount; index += 1) {
    const x = (index % gridWidth) * tileSize;
    const y = Math.floor(index / gridWidth) * tileSize;
    context.fillStyle = `hsl(${(index * 31) % 360} 60% 48%)`;
    context.fillRect(x, y, tileSize, tileSize);
    context.fillStyle = "rgba(255,255,255,0.2)";
    context.fillRect(x, y, tileSize, tileSize / 4);
    context.fillStyle = "#0b1014";
    context.font = "bold 28px sans-serif";
    context.fillText(String(index + 1), x + 14, y + 54);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

async function buildBaseline(scene) {
  const root = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(1.75, 1.75);
  const textures = [];
  const materials = [];

  for (let index = 0; index < TILE_COUNT; index += 1) {
    await wait(SEQUENTIAL_DELAY_MS);
    const texture = makeTexture(index);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    textures.push(texture);
    materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((index % GRID_WIDTH) * 2 - 7, Math.floor(index / GRID_WIDTH) * -2 + 4, 0);
    root.add(mesh);
    createHud("Asset Startup / baseline", [
      `loading: ${index + 1}/${TILE_COUNT}`,
      "mode: sequential unique textures",
    ]);
  }

  scene.add(root);
  return {
    cleanup() {
      geometry.dispose();
      textures.forEach((texture) => texture.dispose());
      materials.forEach((material) => material.dispose());
    },
    root,
  };
}

async function buildOptimized(scene) {
  const root = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(1.75, 1.75);

  await Promise.all(
    Array.from({ length: TILE_COUNT }, (_, index) =>
      wait(PARALLEL_DELAY_MS).then(() => {
        createHud("Asset Startup / optimized", [
          `preparing batch: ${index + 1}/${TILE_COUNT}`,
          "mode: parallel prep + shared texture",
        ]);
      }),
    ),
  );

  const atlasTexture = makeAtlasTexture(TILE_COUNT, GRID_WIDTH);

  for (let index = 0; index < TILE_COUNT; index += 1) {
    const tileTexture = atlasTexture.clone();
    tileTexture.repeat.set(1 / GRID_WIDTH, 1 / GRID_WIDTH);
    tileTexture.offset.set(
      (index % GRID_WIDTH) / GRID_WIDTH,
      1 - (Math.floor(index / GRID_WIDTH) + 1) / GRID_WIDTH,
    );
    tileTexture.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: tileTexture });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((index % GRID_WIDTH) * 2 - 7, Math.floor(index / GRID_WIDTH) * -2 + 4, 0);
    root.add(mesh);
  }

  scene.add(root);
  return {
    cleanup() {
      geometry.dispose();
      atlasTexture.dispose();
      root.traverse((node) => {
        if (node.isMesh) {
          node.material.map.dispose();
          node.material.dispose();
        }
      });
    },
    root,
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.8;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(1280, 720, false);

  const { scene, camera } = createScene(renderer);
  createHud(`Asset Startup / ${variant}`, ["booting...", "waiting for assets"]);
  const startupStart = performance.now();
  const built = variant === "optimized" ? await buildOptimized(scene) : await buildBaseline(scene);
  const startupMs = performance.now() - startupStart;

  const frameTimes = [];
  const renderCpuTimes = [];
  let frames = 0;
  let renderCallsTotal = 0;
  let lastNow = performance.now();

  function frame(now) {
    const delta = now - lastNow;
    lastNow = now;

    renderer.info.reset();
    const renderStart = performance.now();
    renderer.render(scene, camera);
    const renderCpuTime = performance.now() - renderStart;

    frameTimes.push(delta);
    renderCpuTimes.push(renderCpuTime);
    renderCallsTotal += renderer.info.render.calls;
    frames += 1;

    if (frames % 20 === 0) {
      createHud(`Asset Startup / ${variant}`, [
        `startup ms: ${formatNumber(startupMs)}`,
        `avg fps: ${formatNumber(1000 / (frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length))}`,
        `render calls: ${renderer.info.render.calls}`,
        `render ms: ${formatNumber(renderCpuTime)}`,
      ]);
    }

    if (frames >= SAMPLE_FRAMES) {
      const averageFrameTime = frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length;
      const averageRenderCpuTime =
        renderCpuTimes.reduce((sum, value) => sum + value, 0) / renderCpuTimes.length;
      window.__BENCHMARK_RESULT__ = {
        averageFps: 1000 / averageFrameTime,
        averageFrameTimeMs: averageFrameTime,
        averageRenderCalls: renderCallsTotal / frames,
        averageRenderCpuTimeMs: averageRenderCpuTime,
        frameTimeP95Ms: percentile(frameTimes, 0.95),
        renderCpuTimeP95Ms: percentile(renderCpuTimes, 0.95),
        sampleFrames: frames,
        startupMs,
        variant,
      };

      createHud(`Asset Startup / ${variant}`, [
        `startup ms: ${formatNumber(startupMs)}`,
        `avg fps: ${formatNumber(window.__BENCHMARK_RESULT__.averageFps)}`,
        `avg render ms: ${formatNumber(averageRenderCpuTime)}`,
        `p95 render ms: ${formatNumber(window.__BENCHMARK_RESULT__.renderCpuTimeP95Ms)}`,
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
  createHud("Asset Startup / error", [String(window.__BENCHMARK_RESULT__.error)]);
});

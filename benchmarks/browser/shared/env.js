import * as THREE from "/node_modules/three/build/three.module.js";

/**
 * Procedural sky dome — Unity-style 3-band gradient (sky, horizon, ground)
 * using a canvas texture on a BackSide sphere. Simple, reliable, visible.
 */
export function createSky(scene, opts = {}) {
  const {
    skyColor = 0x1a3050,
    horizonColor = 0x3a6080,
    groundColor = 0x181824,
    radius = 400,
    starCount = 300,
    fogDensity = 0.008,
  } = opts;

  const skyC = new THREE.Color(skyColor);
  const horC = new THREE.Color(horizonColor);
  const gndC = new THREE.Color(groundColor);

  // Paint a vertical gradient onto a canvas
  // SphereGeometry UV: V=0 at top pole, V=1 at bottom pole
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, "#" + skyC.getHexString());
  grad.addColorStop(0.4, "#" + horC.getHexString());
  grad.addColorStop(0.5, "#" + horC.getHexString());
  grad.addColorStop(0.6, "#" + horC.getHexString());
  grad.addColorStop(1.0, "#" + gndC.getHexString());
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 256);

  const texture = new THREE.CanvasTexture(canvas);

  const skyGeo = new THREE.SphereGeometry(radius, 32, 24);
  const skyMat = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });

  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -1000;
  scene.add(sky);

  // Don't set scene.background — let the sky sphere handle it
  scene.background = null;

  // Fog color matches the ground so geometry fades into the lower sky
  if (fogDensity > 0) {
    scene.fog = new THREE.FogExp2(gndC.getHex(), fogDensity);
  }

  // Star field — scattered across upper hemisphere
  if (starCount > 0) {
    const positions = new Float32Array(starCount * 3);
    let seed = 7;
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const r = radius * 0.92;
    for (let i = 0; i < starCount; i++) {
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(rng() * 0.65 + 0.35);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      fog: false,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    stars.frustumCulled = false;
    stars.renderOrder = -999;
    scene.add(stars);
  }
}

/**
 * Configure renderer for visual quality — tone mapping, color space, HiDPI.
 * Call right after creating the WebGLRenderer.
 */
export function setupRenderer(renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.8;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Progressive/chunked builder — adds entities in batches across frames so the
 * scene visibly populates instead of freezing. Renders an intermediate frame
 * and updates the HUD between each chunk.
 *
 *   await buildChunked({
 *     total: 10000,
 *     chunkSize: 500,
 *     build(index) { ... },          // called once per entity
 *     render() { renderer.render(scene, camera); },
 *     hud(done, total) { updateHud("Loading", [`${done}/${total}`]); },
 *   });
 */
export async function buildChunked({ total, chunkSize = 500, build, render, hud }) {
  for (let i = 0; i < total; i += chunkSize) {
    const end = Math.min(i + chunkSize, total);
    for (let j = i; j < end; j++) {
      build(j);
    }
    if (hud) hud(end, total);
    if (render) render();
    await new Promise((r) => requestAnimationFrame(r));
  }
}

/**
 * Three-light rig: hemisphere (ambient gradient) + key + fill.
 */
export function createLights(scene, opts = {}) {
  const {
    hemiSky = 0x446688,
    hemiGround = 0x222211,
    hemiIntensity = 0.7,
    keyColor = 0xffeedd,
    keyIntensity = 1.8,
    keyPos = [30, 50, 20],
    fillColor = 0x6688bb,
    fillIntensity = 0.5,
    fillPos = [-25, 15, -20],
  } = opts;

  scene.add(new THREE.HemisphereLight(hemiSky, hemiGround, hemiIntensity));

  const key = new THREE.DirectionalLight(keyColor, keyIntensity);
  key.position.set(...keyPos);
  scene.add(key);

  const fill = new THREE.DirectionalLight(fillColor, fillIntensity);
  fill.position.set(...fillPos);
  scene.add(fill);
}

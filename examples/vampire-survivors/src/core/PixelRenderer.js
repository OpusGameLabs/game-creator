/**
 * Renders a 2D pixel matrix to a Phaser texture.
 *
 * @param {Phaser.Scene} scene - The scene to register the texture on
 * @param {number[][]} pixels - 2D array of palette indices (0 = transparent)
 * @param {(number|null)[]} palette - Array of hex colors indexed by pixel value
 * @param {string} key - Texture key to register
 * @param {number} scale - Pixel scale (2 = each pixel becomes 2x2)
 */
export function renderPixelArt(scene, pixels, palette, key, scale = 2) {
  if (scene.textures.exists(key)) return;

  const h = pixels.length;
  const w = pixels[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = pixels[y][x];
      if (idx === 0 || palette[idx] == null) continue;
      const color = palette[idx];
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  scene.textures.addCanvas(key, canvas);
}

/**
 * Renders multiple frames as a spritesheet texture.
 * Frames are laid out horizontally in a single row.
 *
 * @param {Phaser.Scene} scene
 * @param {number[][][]} frames - Array of pixel matrices (one per frame)
 * @param {(number|null)[]} palette
 * @param {string} key - Spritesheet texture key
 * @param {number} scale
 * @returns {{ frameWidth: number, frameHeight: number }} Frame dimensions
 */
export function renderSpriteSheet(scene, frames, palette, key, scale = 2) {
  if (scene.textures.exists(key)) return null;

  const h = frames[0].length;
  const w = frames[0][0].length;
  const frameW = w * scale;
  const frameH = h * scale;
  const canvas = document.createElement('canvas');
  canvas.width = frameW * frames.length;
  canvas.height = frameH;
  const ctx = canvas.getContext('2d');

  frames.forEach((pixels, fi) => {
    const offsetX = fi * frameW;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = pixels[y][x];
        if (idx === 0 || palette[idx] == null) continue;
        const color = palette[idx];
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(offsetX + x * scale, y * scale, scale, scale);
      }
    }
  });

  const canvasKey = `${key}-canvas`;
  scene.textures.addCanvas(canvasKey, canvas);
  scene.textures.addSpriteSheet(key, scene.textures.get(canvasKey).getSourceImage(), {
    frameWidth: frameW,
    frameHeight: frameH,
  });

  return { frameWidth: frameW, frameHeight: frameH };
}

# TSL (Three.js Shading Language)

TSL is Three.js's cross-backend shading language -- write shader logic in JavaScript instead of raw GLSL/WGSL. Works with both WebGL and WebGPU backends.

## Basic Example

```js
import { texture, uv, color } from 'three/tsl';

const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = texture(myTexture).mul(color(0xff0000));
```

## NodeMaterial Classes (for TSL)

Use node-based material variants when writing TSL shaders:

- `MeshBasicNodeMaterial`
- `MeshStandardNodeMaterial`
- `MeshPhysicalNodeMaterial`
- `LineBasicNodeMaterial`
- `SpriteNodeMaterial`

## When to Use TSL

- Custom animated materials (color cycling, vertex displacement)
- Procedural textures (noise, patterns)
- Compute shaders for particle systems or physics
- Cross-backend compatibility (same code on WebGL and WebGPU)

For the full TSL specification, functions, and node types, see `reference/llms-full.txt`.

## Renderer Requirement

TSL requires the WebGPU renderer. Import path changes to `'three/webgpu'` and init is async:

```js
import * as THREE from 'three/webgpu';
const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init();
```

If you don't need TSL or compute shaders, stick with `WebGLRenderer` for maximum compatibility.

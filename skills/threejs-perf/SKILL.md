---
name: threejs-perf
description: Three.js performance optimization patterns with benchmarkable evidence. Use when optimizing draw calls, scene traversal, entity updates, or instancing in Three.js games. Loaded by threejs-game and make-game for performance guidance.
license: MIT
metadata:
  author: OpusGameLabs
  version: 0.1.0
  tags: [threejs, performance, instancing, draw-calls, optimization, benchmark]
---

# Three.js Performance Optimization

Benchmarkable performance patterns for Three.js games. Every pattern here has measured evidence in the `benchmarks/` directory.

## Reference Files

- `instancing-static.md` — InstancedMesh for large static repeated objects (19,600 → 1 draw call)
- `instancing-moving.md` — Flat state buffer + batched InstancedMesh writes for moving entities (8,000 entities)
- `templates/` — TypeScript baseline vs optimized implementations for each pattern

## When to Use This Skill

- Scene has 100+ repeated objects sharing geometry/material
- Draw calls exceed 500 and frame time is unstable
- Thousands of moving entities need per-frame transform updates
- Profile shows scene-graph traversal as a bottleneck

## When NOT to Use

- Object count is low (<50 unique meshes) — simpler code wins
- Every object needs unique materials/shaders that defeat batching
- Geometry differs enough that instancing provides no batching benefit

## Core Principle: Measure, Don't Assume

Every pattern links to a benchmark scenario. Run benchmarks before and after applying a pattern:

```bash
# Node.js benchmarks (no GPU, measures CPU-side cost)
npm run benchmark:static-world
npm run benchmark:moving-entities

# Browser benchmark (full GPU pipeline via Puppeteer)
npm run benchmark:static-world:browser

# Interactive Benchmark Lab (manual visual comparison)
# Serve repo root, navigate to /benchmarks/browser/
```

## Pattern 1: Instancing Large Static Object Sets

**Problem**: Forests, debris, decorations as individual Meshes = unnecessary draw calls.

**Solution**: One `InstancedMesh` per shared geometry+material combo.

**Evidence**: 19,600 draw calls → 1. Traversal p95: 5.39ms → 0.002ms. See `instancing-static.md`.

```js
// Anti-pattern: one Mesh per prop
for (let i = 0; i < 19600; i++) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, 0, z);
  scene.add(mesh); // 19,600 draw calls
}

// Correct: one InstancedMesh
const im = new THREE.InstancedMesh(geometry, material, 19600);
const mat = new THREE.Matrix4();
for (let i = 0; i < 19600; i++) {
  mat.makeTranslation(x, 0, z);
  im.setMatrixAt(i, mat);
}
im.instanceMatrix.needsUpdate = true;
scene.add(im); // 1 draw call
```

## Pattern 2: Moving Entity Update Loops

**Problem**: Thousands of moving actors as individual Meshes = scene-graph churn + transform propagation.

**Solution**: Flat entity state buffer + batched `InstancedMesh.setMatrixAt()` writes.

**Evidence**: 8,000 draw calls → 1. Update p95: 1.11ms → 0.51ms. Traversal p95: 1.75ms → 0.007ms. See `instancing-moving.md`.

```js
// Anti-pattern: per-entity Mesh position writes
meshes.forEach((mesh, i) => {
  mesh.position.x = computeX(i, tick);
  mesh.position.y = computeY(i, tick);
});

// Correct: batched instance matrix writes
const mat = new THREE.Matrix4();
for (let i = 0; i < count; i++) {
  mat.makeTranslation(computeX(i, tick), computeY(i, tick), computeZ(i, tick));
  instancedMesh.setMatrixAt(i, mat);
}
instancedMesh.instanceMatrix.needsUpdate = true;
```

## Decision Tree

```
Is the object repeated 50+ times with same geometry+material?
├── YES → Is it static (no per-frame movement)?
│   ├── YES → Pattern 1: Static InstancedMesh (instancing-static.md)
│   └── NO  → Pattern 2: Moving InstancedMesh with batched writes (instancing-moving.md)
└── NO  → Standard Mesh is fine. Focus on material/geometry reuse.
```

## Benchmark Infrastructure

The `benchmarks/` directory contains:

- **`harness/`** — `metrics.ts` (measurement) + `compare.ts` (scoring). Paired baseline vs optimized.
- **`scenarios/`** — Node.js benchmark scenarios with `baseline.ts` and `optimized.ts` candidates.
- **`browser/`** — 11 interactive HTML5 benchmarks with Benchmark Lab UI at `index.html`.
- **`results/`** — JSON artifacts proving measured improvements.

### Scoring Logic

A benchmark **passes** if:
1. Draw calls decreased
2. Traversal p95 did not regress

### Browser Benchmark Lab Scenarios

| Category | Scenarios |
|----------|-----------|
| Scene Scale | static-world-repeated-meshes, procedural-city |
| Moving Entities | moving-entities-wave-field, bouncy-balls-drop, flocking-boids |
| Particles | particle-storm, firework-show, starfield-warp |
| Assets | asset-startup-texture-burst, lazy-loading-gallery, morphing-terrain |

Each scenario supports `?variant=baseline` and `?variant=optimized` URL params.

## Proven Results

| Scenario | Metric | Baseline | Optimized | Improvement |
|----------|--------|----------|-----------|-------------|
| Static World (19.6k) | Draw calls | 19,600 | 1 | 99.99% |
| Static World (19.6k) | Traversal p95 | 5.39ms | 0.002ms | 99.96% |
| Static World (19.6k) | Build p95 | 63.3ms | 3.0ms | 95.3% |
| Moving Entities (8k) | Draw calls | 8,000 | 1 | 99.99% |
| Moving Entities (8k) | Update p95 | 1.11ms | 0.51ms | 54.1% |
| Moving Entities (8k) | Traversal p95 | 1.75ms | 0.007ms | 99.6% |

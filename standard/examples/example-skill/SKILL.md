---
name: Example Instancing Skill
slug: example-skill
description: Reduce draw calls and frame time when many repeated meshes appear in the same Three.js scene.
version: 0.1.0
tags:
  - example
  - threejs
  - performance
benchmark:
  scenarios:
    - static-world-repeated-meshes
  metrics:
    - name: drawCalls
      direction: decrease
    - name: frameTimeP95
      direction: decrease
  evidenceThreshold: measurable improvement across repeated benchmark runs
---

# Example Instancing Skill

## Problem

Repeated meshes in a scene can produce unnecessary draw calls and unstable frame times when rendered as many individual meshes.

## Use When

Use this skill when many objects share geometry and materials and can be rendered through instancing.

## Avoid When

Do not force instancing when every object requires materially different rendering behavior or unique geometry.

## Anti-Patterns

- creating one mesh per repeated prop when a single instanced mesh would suffice
- changing materials per object in ways that defeat batching or instancing

## Guidance

Prefer `InstancedMesh` for large repeated object sets, and benchmark the change against draw calls and p95 frame time rather than relying on visual similarity alone.

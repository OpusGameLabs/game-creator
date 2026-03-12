import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Scene,
} from "three";

import type { BenchmarkCandidate } from "../../../../src/benchmark/types.js";

const WORLD_WIDTH = 140;
const WORLD_DEPTH = 140;
const INSTANCE_COUNT = WORLD_WIDTH * WORLD_DEPTH;

export const baselineCandidate: BenchmarkCandidate = {
  description: "One Mesh per repeated prop in a dense static world.",
  id: "baseline-individual-meshes",
  build: () => {
    const scene = new Scene();
    const root = new Group();
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({ color: 0x7aa95c });

    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      for (let z = 0; z < WORLD_DEPTH; z += 1) {
        const mesh = new Mesh(geometry, material);
        mesh.position.set(x * 1.5, 0, z * 1.5);
        root.add(mesh);
      }
    }

    scene.add(root);

    return {
      cleanup: () => {
        geometry.dispose();
        material.dispose();
      },
      root,
      scene,
    };
  },
};

export const baselineScenarioMetadata = {
  instanceCount: INSTANCE_COUNT,
  worldDepth: WORLD_DEPTH,
  worldWidth: WORLD_WIDTH,
};

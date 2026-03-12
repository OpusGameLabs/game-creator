import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Scene,
} from "three";

import type { BenchmarkCandidate } from "../../../../src/benchmark/types.js";

const WORLD_WIDTH = 140;
const WORLD_DEPTH = 140;
const INSTANCE_COUNT = WORLD_WIDTH * WORLD_DEPTH;

export const optimizedCandidate: BenchmarkCandidate = {
  description: "A single InstancedMesh for repeated props in a dense static world.",
  id: "optimized-instanced-mesh",
  build: () => {
    const scene = new Scene();
    const root = new Group();
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({ color: 0x7aa95c });
    const instancedMesh = new InstancedMesh(geometry, material, INSTANCE_COUNT);
    const matrix = new Matrix4();

    let index = 0;
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      for (let z = 0; z < WORLD_DEPTH; z += 1) {
        matrix.makeTranslation(x * 1.5, 0, z * 1.5);
        instancedMesh.setMatrixAt(index, matrix);
        index += 1;
      }
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    root.add(instancedMesh);
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

import type { Material, Object3D } from "three";
import { BufferGeometry, InstancedMesh, Mesh } from "three";

import type { BenchmarkCandidateBuild, CandidateBenchmarkMetrics } from "../../src/benchmark/types.js";

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index] ?? 0;
}

function measureDurationMs(task: () => void): number {
  const start = performance.now();
  task();
  return performance.now() - start;
}

function collectStats(root: Object3D): Omit<CandidateBenchmarkMetrics, "buildP95Ms" | "traversalP95Ms"> {
  let estimatedDrawCalls = 0;
  let instancedMeshCount = 0;
  let meshCount = 0;
  let objectCount = 0;
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();

  root.traverse((node) => {
    objectCount += 1;

    if (node instanceof InstancedMesh) {
      instancedMeshCount += 1;
      estimatedDrawCalls += 1;
      geometries.add(node.geometry);
      materials.add(node.material);
      return;
    }

    if (node instanceof Mesh) {
      meshCount += 1;
      estimatedDrawCalls += 1;
      geometries.add(node.geometry);
      const material = node.material;
      if (Array.isArray(material)) {
        material.forEach((entry) => materials.add(entry));
      } else {
        materials.add(material);
      }
    }
  });

  return {
    estimatedDrawCalls,
    instancedMeshCount,
    meshCount,
    objectCount,
    uniqueGeometryCount: geometries.size,
    uniqueMaterialCount: materials.size,
  };
}

export function benchmarkCandidate(
  buildCandidate: () => BenchmarkCandidateBuild,
  options?: {
    buildSamples?: number;
    traversalSamples?: number;
  },
): CandidateBenchmarkMetrics {
  const buildSamples = options?.buildSamples ?? 9;
  const traversalSamples = options?.traversalSamples ?? 25;
  const buildDurations: number[] = [];
  let artifact: BenchmarkCandidateBuild | undefined;

  for (let sample = 0; sample < buildSamples; sample += 1) {
    const duration = measureDurationMs(() => {
      artifact = buildCandidate();
    });
    buildDurations.push(duration);
    artifact?.cleanup?.();
  }

  artifact = buildCandidate();
  const traversalDurations: number[] = [];
  for (let sample = 0; sample < traversalSamples; sample += 1) {
    traversalDurations.push(
      measureDurationMs(() => {
        artifact?.scene.updateMatrixWorld(true);
        artifact?.root.traverse(() => {
          // Traversal cost is part of the proxy measurement in this first harness slice.
        });
      }),
    );
  }

  const staticMetrics = collectStats(artifact.root);
  artifact.cleanup?.();

  return {
    buildP95Ms: percentile(buildDurations, 0.95),
    traversalP95Ms: percentile(traversalDurations, 0.95),
    ...staticMetrics,
  };
}

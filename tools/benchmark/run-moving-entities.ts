import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { InstancedMesh, Mesh, type Object3D } from "three";

import { buildMovingEntitiesBaseline } from "../../benchmarks/scenarios/moving-entities-wave-field/candidates/baseline.js";
import { buildMovingEntitiesOptimized } from "../../benchmarks/scenarios/moving-entities-wave-field/candidates/optimized.js";

type MovingEntitiesMetrics = {
  estimatedDrawCalls: number;
  instancedMeshCount: number;
  meshCount: number;
  traversalP95Ms: number;
  updateP95Ms: number;
};

type MovingEntitiesResult = {
  candidateId: string;
  metrics: MovingEntitiesMetrics;
};

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index] ?? 0;
}

function collectCounts(root: Object3D): Omit<MovingEntitiesMetrics, "traversalP95Ms" | "updateP95Ms"> {
  let estimatedDrawCalls = 0;
  let instancedMeshCount = 0;
  let meshCount = 0;

  root.traverse((node) => {
    if (node instanceof InstancedMesh) {
      instancedMeshCount += 1;
      estimatedDrawCalls += 1;
      return;
    }

    if (node instanceof Mesh) {
      meshCount += 1;
      estimatedDrawCalls += 1;
    }
  });

  return {
    estimatedDrawCalls,
    instancedMeshCount,
    meshCount,
  };
}

function benchmarkCandidate(
  candidateId: string,
  build: typeof buildMovingEntitiesBaseline,
): MovingEntitiesResult {
  const artifact = build();
  const updateSamples: number[] = [];
  const traversalSamples: number[] = [];

  for (let tick = 0; tick < 120; tick += 1) {
    const updateStart = performance.now();
    artifact.step(tick);
    updateSamples.push(performance.now() - updateStart);

    const traversalStart = performance.now();
    artifact.scene.updateMatrixWorld(true);
    artifact.root.traverse(() => {
      // traversal timing proxy
    });
    traversalSamples.push(performance.now() - traversalStart);
  }

  const counts = collectCounts(artifact.root);
  artifact.cleanup();

  return {
    candidateId,
    metrics: {
      ...counts,
      traversalP95Ms: percentile(traversalSamples, 0.95),
      updateP95Ms: percentile(updateSamples, 0.95),
    },
  };
}

async function main(): Promise<void> {
  const baseline = benchmarkCandidate("baseline-individual-moving-meshes", buildMovingEntitiesBaseline);
  const optimized = benchmarkCandidate("optimized-instanced-moving-entities", buildMovingEntitiesOptimized);

  const report = {
    comparisons: {
      estimatedDrawCallsDelta: optimized.metrics.estimatedDrawCalls - baseline.metrics.estimatedDrawCalls,
      passes:
        optimized.metrics.estimatedDrawCalls < baseline.metrics.estimatedDrawCalls &&
        optimized.metrics.traversalP95Ms < baseline.metrics.traversalP95Ms &&
        optimized.metrics.updateP95Ms < baseline.metrics.updateP95Ms,
      traversalP95DeltaMs: optimized.metrics.traversalP95Ms - baseline.metrics.traversalP95Ms,
      updateP95DeltaMs: optimized.metrics.updateP95Ms - baseline.metrics.updateP95Ms,
    },
    generatedAt: new Date().toISOString(),
    results: [baseline, optimized],
    scenarioId: "moving-entities-wave-field",
  };

  const resultsDir = path.resolve("benchmarks/results");
  await mkdir(resultsDir, { recursive: true });
  const filePath = path.join(resultsDir, "moving-entities-wave-field.json");
  await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Scenario: ${report.scenarioId}`);
  console.log(`Pass: ${report.comparisons.passes ? "yes" : "no"}`);
  console.log("");
  console.log("Baseline metrics:");
  console.log(JSON.stringify(baseline.metrics, null, 2));
  console.log("");
  console.log("Optimized metrics:");
  console.log(JSON.stringify(optimized.metrics, null, 2));
  console.log("");
  console.log("Deltas (optimized - baseline):");
  console.log(JSON.stringify(report.comparisons, null, 2));
  console.log("");
  console.log(`Saved report: ${path.relative(process.cwd(), filePath)}`);
}

void main();

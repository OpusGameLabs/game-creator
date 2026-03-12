import type {
  BenchmarkCandidate,
  BenchmarkScenarioResult,
  CandidateBenchmarkMetrics,
  CandidateBenchmarkResult,
  ComparisonResult,
} from "../../src/benchmark/types.js";
import { benchmarkCandidate } from "./metrics.js";

function metricDelta(
  baseline: CandidateBenchmarkMetrics,
  optimized: CandidateBenchmarkMetrics,
): Record<keyof CandidateBenchmarkMetrics, number> {
  return {
    buildP95Ms: optimized.buildP95Ms - baseline.buildP95Ms,
    estimatedDrawCalls: optimized.estimatedDrawCalls - baseline.estimatedDrawCalls,
    instancedMeshCount: optimized.instancedMeshCount - baseline.instancedMeshCount,
    meshCount: optimized.meshCount - baseline.meshCount,
    objectCount: optimized.objectCount - baseline.objectCount,
    traversalP95Ms: optimized.traversalP95Ms - baseline.traversalP95Ms,
    uniqueGeometryCount: optimized.uniqueGeometryCount - baseline.uniqueGeometryCount,
    uniqueMaterialCount: optimized.uniqueMaterialCount - baseline.uniqueMaterialCount,
  };
}

function compareResults(
  baseline: CandidateBenchmarkResult,
  optimized: CandidateBenchmarkResult,
): ComparisonResult {
  const deltas = metricDelta(baseline.metrics, optimized.metrics);
  const reasons: string[] = [];

  if (optimized.metrics.estimatedDrawCalls < baseline.metrics.estimatedDrawCalls) {
    reasons.push("estimated draw calls decreased");
  }

  if (optimized.metrics.traversalP95Ms <= baseline.metrics.traversalP95Ms) {
    reasons.push("p95 traversal cost did not regress");
  }

  if (optimized.metrics.meshCount < baseline.metrics.meshCount) {
    reasons.push("mesh count decreased");
  }

  return {
    baselineCandidateId: baseline.candidateId,
    deltas,
    optimizedCandidateId: optimized.candidateId,
    passes:
      optimized.metrics.estimatedDrawCalls < baseline.metrics.estimatedDrawCalls &&
      optimized.metrics.traversalP95Ms <= baseline.metrics.traversalP95Ms,
    reasons,
  };
}

export function runScenario(
  scenarioId: string,
  candidates: {
    baseline: BenchmarkCandidate;
    optimized: BenchmarkCandidate;
  },
): BenchmarkScenarioResult {
  const results: CandidateBenchmarkResult[] = [
    {
      candidateId: candidates.baseline.id,
      metrics: benchmarkCandidate(candidates.baseline.build),
    },
    {
      candidateId: candidates.optimized.id,
      metrics: benchmarkCandidate(candidates.optimized.build),
    },
  ];

  return {
    comparisons: [compareResults(results[0], results[1])],
    results,
    scenarioId,
  };
}

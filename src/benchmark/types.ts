import type { Object3D, Scene } from "three";

export type BenchmarkMetricDirection = "increase" | "decrease";

export type BenchmarkMetricValue = number;

export type CandidateBenchmarkMetrics = {
  buildP95Ms: BenchmarkMetricValue;
  estimatedDrawCalls: BenchmarkMetricValue;
  instancedMeshCount: BenchmarkMetricValue;
  meshCount: BenchmarkMetricValue;
  objectCount: BenchmarkMetricValue;
  traversalP95Ms: BenchmarkMetricValue;
  uniqueGeometryCount: BenchmarkMetricValue;
  uniqueMaterialCount: BenchmarkMetricValue;
};

export type BenchmarkCandidateBuild = {
  cleanup?: () => void;
  root: Object3D;
  scene: Scene;
};

export type BenchmarkCandidate = {
  build: () => BenchmarkCandidateBuild;
  description: string;
  id: string;
};

export type CandidateBenchmarkResult = {
  candidateId: string;
  metrics: CandidateBenchmarkMetrics;
};

export type BenchmarkScenarioResult = {
  comparisons: ComparisonResult[];
  results: CandidateBenchmarkResult[];
  scenarioId: string;
};

export type ComparisonResult = {
  baselineCandidateId: string;
  deltas: Record<keyof CandidateBenchmarkMetrics, number>;
  optimizedCandidateId: string;
  passes: boolean;
  reasons: string[];
};

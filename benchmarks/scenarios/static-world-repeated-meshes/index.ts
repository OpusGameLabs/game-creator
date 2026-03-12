import { baselineCandidate, baselineScenarioMetadata } from "./candidates/baseline.js";
import { optimizedCandidate } from "./candidates/optimized.js";

export const staticWorldRepeatedMeshesScenario = {
  candidates: {
    baseline: baselineCandidate,
    optimized: optimizedCandidate,
  },
  id: "static-world-repeated-meshes",
  metadata: baselineScenarioMetadata,
  notes:
    "This first harness slice measures scene-graph and CPU traversal proxies. Browser renderer timing should be layered onto the same scenario later.",
} as const;

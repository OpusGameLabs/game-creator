import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { runScenario } from "../../benchmarks/harness/compare.js";
import { staticWorldRepeatedMeshesScenario } from "../../benchmarks/scenarios/static-world-repeated-meshes/index.js";

type SavedReport = {
  generatedAt: string;
  scenario: typeof staticWorldRepeatedMeshesScenario;
  summary: ReturnType<typeof runScenario>;
};

function printSummary(report: SavedReport): void {
  const baseline = report.summary.results[0];
  const optimized = report.summary.results[1];
  const comparison = report.summary.comparisons[0];

  console.log(`Scenario: ${report.summary.scenarioId}`);
  console.log(`Baseline: ${baseline.candidateId}`);
  console.log(`Optimized: ${optimized.candidateId}`);
  console.log(`Pass: ${comparison.passes ? "yes" : "no"}`);
  console.log("");
  console.log("Baseline metrics:");
  console.log(JSON.stringify(baseline.metrics, null, 2));
  console.log("");
  console.log("Optimized metrics:");
  console.log(JSON.stringify(optimized.metrics, null, 2));
  console.log("");
  console.log("Deltas (optimized - baseline):");
  console.log(JSON.stringify(comparison.deltas, null, 2));
  console.log("");
  console.log(`Reasons: ${comparison.reasons.join(", ") || "none"}`);
}

async function main(): Promise<void> {
  const summary = runScenario(
    staticWorldRepeatedMeshesScenario.id,
    staticWorldRepeatedMeshesScenario.candidates,
  );

  const report: SavedReport = {
    generatedAt: new Date().toISOString(),
    scenario: staticWorldRepeatedMeshesScenario,
    summary,
  };

  const resultsDir = path.resolve("benchmarks/results");
  await mkdir(resultsDir, { recursive: true });

  const filePath = path.join(resultsDir, `${staticWorldRepeatedMeshesScenario.id}.json`);
  await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  printSummary(report);
  console.log("");
  console.log(`Saved report: ${path.relative(process.cwd(), filePath)}`);
}

void main();

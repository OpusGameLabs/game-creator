import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import puppeteer from "puppeteer";

import { startStaticServer } from "./server.js";

declare global {
  interface Window {
    __BENCHMARK_RESULT__?:
      | BrowserBenchmarkMetrics
      | {
          error: string;
        };
  }
}

type BrowserBenchmarkMetrics = {
  averageFps: number;
  averageFrameTimeMs: number;
  averageRenderCpuTimeMs: number;
  averageRenderCalls: number;
  averageTriangles: number;
  frameTimeP95Ms: number;
  renderCpuTimeP95Ms: number;
  sampleFrames: number;
  variant: "baseline" | "optimized";
};

type BrowserBenchmarkReport = {
  comparisons: {
    averageFpsDelta: number;
    averageFrameTimeDeltaMs: number;
    averageRenderCpuTimeDeltaMs: number;
    averageRenderCallsDelta: number;
    frameTimeP95DeltaMs: number;
    renderCpuTimeP95DeltaMs: number;
    passes: boolean;
  };
  generatedAt: string;
  results: BrowserBenchmarkMetrics[];
  scenarioId: string;
};

async function runVariant(
  browser: puppeteer.Browser,
  baseUrl: string,
  variant: "baseline" | "optimized",
): Promise<BrowserBenchmarkMetrics> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/benchmarks/browser/static-world-repeated-meshes/?variant=${variant}`, {
    waitUntil: "networkidle0",
  });

  const result = await page.waitForFunction(() => window.__BENCHMARK_RESULT__, {
    timeout: 30_000,
  });
  const json = await result.jsonValue();
  await page.close();

  if (json === null || typeof json !== "object") {
    throw new Error(`benchmark result for ${variant} was not an object`);
  }

  if ("error" in (json as Record<string, unknown>)) {
    const errorMessage = (json as { error: string }).error;
    throw new Error(`browser benchmark failed for ${variant}: ${errorMessage}`);
  }

  return json as BrowserBenchmarkMetrics;
}

function buildReport(results: BrowserBenchmarkMetrics[]): BrowserBenchmarkReport {
  const baseline = results.find((entry) => entry.variant === "baseline");
  const optimized = results.find((entry) => entry.variant === "optimized");

  if (!baseline || !optimized) {
    throw new Error("missing baseline or optimized benchmark result");
  }

  return {
    comparisons: {
      averageFpsDelta: optimized.averageFps - baseline.averageFps,
      averageFrameTimeDeltaMs: optimized.averageFrameTimeMs - baseline.averageFrameTimeMs,
      averageRenderCpuTimeDeltaMs: optimized.averageRenderCpuTimeMs - baseline.averageRenderCpuTimeMs,
      averageRenderCallsDelta: optimized.averageRenderCalls - baseline.averageRenderCalls,
      frameTimeP95DeltaMs: optimized.frameTimeP95Ms - baseline.frameTimeP95Ms,
      renderCpuTimeP95DeltaMs: optimized.renderCpuTimeP95Ms - baseline.renderCpuTimeP95Ms,
      passes:
        optimized.averageRenderCalls < baseline.averageRenderCalls &&
        optimized.renderCpuTimeP95Ms < baseline.renderCpuTimeP95Ms,
    },
    generatedAt: new Date().toISOString(),
    results,
    scenarioId: "static-world-repeated-meshes-browser",
  };
}

function printReport(report: BrowserBenchmarkReport): void {
  const baseline = report.results.find((entry) => entry.variant === "baseline");
  const optimized = report.results.find((entry) => entry.variant === "optimized");

  if (!baseline || !optimized) {
    throw new Error("report missing baseline or optimized results");
  }

  console.log(`Scenario: ${report.scenarioId}`);
  console.log(`Pass: ${report.comparisons.passes ? "yes" : "no"}`);
  console.log("");
  console.log("Baseline metrics:");
  console.log(JSON.stringify(baseline, null, 2));
  console.log("");
  console.log("Optimized metrics:");
  console.log(JSON.stringify(optimized, null, 2));
  console.log("");
  console.log("Deltas (optimized - baseline):");
  console.log(JSON.stringify(report.comparisons, null, 2));
}

async function main(): Promise<void> {
  const server = await startStaticServer(path.resolve("."));
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const results: BrowserBenchmarkMetrics[] = [];
    results.push(await runVariant(browser, server.origin, "baseline"));
    results.push(await runVariant(browser, server.origin, "optimized"));

    const report = buildReport(results);
    const resultsDir = path.resolve("benchmarks/results");
    await mkdir(resultsDir, { recursive: true });

    const filePath = path.join(resultsDir, "static-world-repeated-meshes-browser.json");
    await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    printReport(report);
    console.log("");
    console.log(`Saved report: ${path.relative(process.cwd(), filePath)}`);
  } finally {
    await browser.close();
    await server.close();
  }
}

void main();

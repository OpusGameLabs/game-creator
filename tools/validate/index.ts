import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

type MetricDirection = "increase" | "decrease";

type BenchmarkMetric = {
  direction: MetricDirection;
  name: string;
};

type BenchmarkConfig = {
  evidenceThreshold: string;
  metrics: BenchmarkMetric[];
  scenarios: string[];
};

type SkillFrontmatter = {
  benchmark?: BenchmarkConfig;
  description?: string;
  name?: string;
  slug?: string;
  version?: string;
};

type ValidationResult = {
  errors: string[];
  skillDir: string;
};

const REQUIRED_FIELDS = ["name", "slug", "description"] as const;
const PERFORMANCE_TERMS = [
  "performance",
  "fps",
  "frame time",
  "frametime",
  "draw calls",
  "draw call",
  "memory",
  "load time",
  "startup",
  "throughput",
  "latency",
] as const;

async function exists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parseFrontmatter(content: string): { body: string; data: SkillFrontmatter } {
  const lines = content.split(/\r?\n/u);
  if (lines[0] !== "---") {
    throw new Error("missing YAML frontmatter opening delimiter");
  }

  const closingIndex = lines.indexOf("---", 1);
  if (closingIndex === -1) {
    throw new Error("missing YAML frontmatter closing delimiter");
  }

  const yamlText = lines.slice(1, closingIndex).join("\n");
  const body = lines.slice(closingIndex + 1).join("\n").trim();
  const parsed = parse(yamlText);

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("frontmatter must parse to an object");
  }

  return {
    body,
    data: parsed as SkillFrontmatter,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasPerformanceClaim(frontmatter: SkillFrontmatter, body: string): boolean {
  const haystack = `${frontmatter.description ?? ""}\n${body}`.toLowerCase();
  return PERFORMANCE_TERMS.some((term) => haystack.includes(term));
}

function validateBenchmark(benchmark: unknown, errors: string[]): void {
  if (benchmark === undefined) {
    errors.push("missing required `benchmark` metadata for a performance-related skill");
    return;
  }

  if (benchmark === null || typeof benchmark !== "object" || Array.isArray(benchmark)) {
    errors.push("`benchmark` must be an object");
    return;
  }

  const config = benchmark as Partial<BenchmarkConfig>;
  if (!Array.isArray(config.scenarios) || config.scenarios.length === 0 || !config.scenarios.every(isNonEmptyString)) {
    errors.push("`benchmark.scenarios` must be a non-empty string array");
  }

  if (!Array.isArray(config.metrics) || config.metrics.length === 0) {
    errors.push("`benchmark.metrics` must be a non-empty array");
  } else {
    config.metrics.forEach((metric, index) => {
      if (metric === null || typeof metric !== "object" || Array.isArray(metric)) {
        errors.push(`benchmark metric at index ${index} must be an object`);
        return;
      }

      const typedMetric = metric as Partial<BenchmarkMetric>;
      if (!isNonEmptyString(typedMetric.name)) {
        errors.push(`benchmark metric at index ${index} is missing a non-empty \`name\``);
      }

      if (typedMetric.direction !== "increase" && typedMetric.direction !== "decrease") {
        errors.push(
          `benchmark metric at index ${index} must declare \`direction\` as "increase" or "decrease"`,
        );
      }
    });
  }

  if (!isNonEmptyString(config.evidenceThreshold)) {
    errors.push("`benchmark.evidenceThreshold` must be a non-empty string");
  }
}

async function collectSkillDirectories(rootDir: string): Promise<string[]> {
  if (!(await exists(rootDir))) {
    return [];
  }

  const entries = await readdir(rootDir, { withFileTypes: true });
  const skillDirs: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const entryPath = path.join(rootDir, entry.name);
    if (await exists(path.join(entryPath, "SKILL.md"))) {
      skillDirs.push(entryPath);
      continue;
    }

    skillDirs.push(...(await collectSkillDirectories(entryPath)));
  }

  return skillDirs.sort();
}

async function validateSkillDirectory(skillDir: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const skillFile = path.join(skillDir, "SKILL.md");

  if (!(await exists(skillFile))) {
    errors.push("missing SKILL.md");
    return { errors, skillDir };
  }

  let content: string;
  try {
    content = await readFile(skillFile, "utf8");
  } catch (error) {
    errors.push(`unable to read SKILL.md: ${String(error)}`);
    return { errors, skillDir };
  }

  let parsed: { body: string; data: SkillFrontmatter };
  try {
    parsed = parseFrontmatter(content);
  } catch (error) {
    errors.push(`invalid frontmatter: ${error instanceof Error ? error.message : String(error)}`);
    return { errors, skillDir };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!isNonEmptyString(parsed.data[field])) {
      errors.push(`missing required frontmatter field \`${field}\``);
    }
  }

  const dirName = path.basename(skillDir);
  if (isNonEmptyString(parsed.data.slug) && parsed.data.slug !== dirName) {
    errors.push(`frontmatter slug "${parsed.data.slug}" must match directory name "${dirName}"`);
  }

  if (!parsed.body) {
    errors.push("markdown body must not be empty");
  }

  if (hasPerformanceClaim(parsed.data, parsed.body)) {
    validateBenchmark(parsed.data.benchmark, errors);
  }

  return { errors, skillDir };
}

async function main(): Promise<void> {
  const rootDir = path.resolve("skills");
  const exampleRootDir = path.resolve("standard/examples");
  const skillDirs = [
    ...(await collectSkillDirectories(rootDir)),
    ...(await collectSkillDirectories(exampleRootDir)),
  ];

  if (skillDirs.length === 0) {
    console.log("No skill directories found.");
    return;
  }

  const results = await Promise.all(skillDirs.map((skillDir) => validateSkillDirectory(skillDir)));
  const failures = results.filter((result) => result.errors.length > 0);

  for (const result of results) {
    const relativePath = path.relative(process.cwd(), result.skillDir);
    if (result.errors.length === 0) {
      console.log(`PASS ${relativePath}`);
      continue;
    }

    console.log(`FAIL ${relativePath}`);
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
  }

  if (failures.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${results.length} skill director${results.length === 1 ? "y" : "ies"}.`);
}

void main();

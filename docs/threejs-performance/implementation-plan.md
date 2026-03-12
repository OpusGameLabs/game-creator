# Agent Skills + Three.js Performance Pack Implementation Plan

Date: 2026-03-11
Based on: `docs/superpowers/specs/2026-03-11-agent-skills-threejs-design.md`
Status: Initial implementation plan

## 1. Objective

Build the smallest end-to-end v1 slice that proves the repo can:

1. define a canonical `agent-skills` format
2. express Three.js performance skills in that format
3. export at least one platform adapter
4. benchmark agent outputs with and without skills
5. demonstrate measurable runtime wins for at least one flagship skill

The critical path is benchmark proof, not breadth of skill coverage.

## 2. Delivery Strategy

The plan should optimize for the earliest credible proof loop:

1. canonical standard
2. validator
3. one or two flagship Three.js skills
4. one benchmark harness with controlled scenarios
5. one adapter export
6. repeated benchmark runs demonstrating measurable wins

Everything else is secondary until that loop works.

## 3. Workstreams

### 3.1 Standard

Deliverables:

- canonical directory contract for `agent-skills`
- required and optional metadata definition
- authoring rules for `SKILL.md`, `references/`, `templates/`, `benchmarks/`, `scripts/`, `assets/`
- example canonical skill

Decisions to lock early:

- required frontmatter fields
- benchmark metadata shape
- compatibility metadata shape
- naming and versioning conventions

Exit criteria:

- at least one example skill validates against the standard
- the standard is precise enough to drive tooling

### 3.2 Validation Tooling

Deliverables:

- validator CLI for canonical skills
- schema/rule checks for required metadata
- checks for benchmark-linked skills
- human-readable validation output

Exit criteria:

- invalid skills fail with actionable messages
- valid skills pass consistently
- validator can be run in CI later without redesign

### 3.3 Three.js Flagship Skills

Start with a narrow set that is easy to benchmark and likely to show runtime wins:

- `instancing-large-object-sets`
- `compressed-texture-loading`
- `update-loop-structure-for-large-entity-counts`

Each flagship skill should include:

- high-signal `SKILL.md`
- anti-patterns and contraindications
- executable templates/snippets
- benchmark metadata

Exit criteria:

- each skill is valid canonical content
- at least one template from each skill can be exercised in the harness

### 3.4 Benchmark Harness

Deliverables:

- controlled benchmark scenario runner
- scene instrumentation
- metrics capture
- structured result output
- comparison/scoring logic

Initial controlled scenarios:

- large static world with repeated meshes
- many moving entities with update pressure
- startup/load scenario with larger asset path

Metrics in v1:

- average frame time
- p95 frame time
- draw calls
- startup/load time
- memory usage where practical

Exit criteria:

- the harness can execute paired outputs under the same conditions
- results are persisted in a comparable format
- noisy runs can be marked inconclusive

### 3.5 Adapter Export

Deliverables:

- Claude adapter/export from canonical source
- generated output verification
- compatibility notes for future agent adapters

Exit criteria:

- canonical source can be exported without manual edits
- generated structure is discoverable by Claude-compatible tooling

### 3.6 Reporting and Benchmark Evidence

Deliverables:

- result schema
- benchmark comparison summary
- pass/fail and delta reporting
- saved benchmark artifacts for repeatability

Exit criteria:

- one flagship skill shows measurable wins over a no-skill baseline
- evidence is reproducible enough to defend the claim

## 4. Phased Execution

## Phase 1: Repo Foundation

Goal:

Create the minimum repo structure needed to hold the standard, skills, benchmarks, adapters, and tooling.

Tasks:

- scaffold top-level directories from the approved design
- add base README and docs index
- add package/tooling baseline for TypeScript and scripts
- choose formatting/linting/test baseline

Outputs:

- runnable repository skeleton
- documented directory roles

## Phase 2: Canonical Standard and Validator

Goal:

Define the `agent-skills` contract tightly enough that the rest of the system can build on it.

Tasks:

- write the standard doc and examples
- define frontmatter fields and benchmark metadata schema
- implement validator CLI
- add tests for valid/invalid sample skills

Outputs:

- standard doc
- example canonical skill
- validator

Dependency:

Phase 2 must complete before scaling skill authoring.

## Phase 3: Initial Three.js Skills

Goal:

Author a very small set of flagship skills that are likely to move measurable metrics.

Tasks:

- write three flagship skills
- attach templates/snippets
- attach benchmark metadata
- validate all skills through the tooling

Outputs:

- initial benchmarkable Three.js skill pack

Dependency:

Needs Phase 2 validator and metadata definitions.

## Phase 4: Benchmark Harness v1

Goal:

Build the smallest benchmark system that can prove or disprove skill value.

Tasks:

- implement controlled benchmark scenarios
- add instrumentation and result capture
- build paired comparison runner
- persist result artifacts and summaries

Outputs:

- benchmark harness
- repeatable benchmark scenarios

Dependency:

Can begin in parallel with late Phase 3 work once metadata shape is stable.

## Phase 5: Claude Adapter

Goal:

Export canonical skills into a Claude-compatible plugin/package structure.

Tasks:

- map canonical content to Claude layout
- generate output
- verify generated artifact structure

Outputs:

- Claude adapter/export

Dependency:

Needs stable canonical format from Phase 2.

## Phase 6: Proof Runs and Tightening

Goal:

Generate evidence that the system works end to end.

Tasks:

- run paired evaluations for flagship skills
- inspect noise and benchmark quality
- tighten skills, templates, and thresholds
- document the first validated wins

Outputs:

- saved benchmark evidence
- first benchmarkable/perf-approved skills

Dependency:

Requires Phases 3, 4, and 5.

## 5. Critical Path

The critical path is:

1. repo skeleton
2. canonical standard
3. validator
4. one flagship skill
5. one benchmark scenario
6. paired comparison runner
7. one adapter export
8. proof of measurable win

If any item delays the rest, cut breadth rather than cut benchmark rigor.

## 6. What to Defer from v1

Defer until the proof loop works:

- large skill catalog breadth
- many platform adapters
- React Three Fiber-specific variants
- polished UX for reporting
- broad mini-project coverage
- advanced schema complexity beyond what validation needs

## 7. Immediate Build Order

The first implementation slice should be:

1. scaffold repo structure and TypeScript tooling
2. define canonical skill folder shape and frontmatter contract
3. implement validator CLI
4. author `instancing-large-object-sets`
5. build a large-static-world benchmark scenario
6. build paired run result capture
7. add Claude export
8. run first benchmark comparison

This slice is intentionally biased toward the static-world/instancing case because it is the cleanest path to a measurable early win.

## 8. Acceptance Criteria by Milestone

### Milestone A: Standard Baseline

- canonical format documented
- example skill validates
- validator exists and is tested

### Milestone B: First Benchmarkable Skill

- one flagship skill authored
- benchmark metadata complete
- templates runnable in benchmark scaffold

### Milestone C: First End-to-End Proof

- paired run harness works
- one benchmark scenario runs consistently
- with-skill output beats no-skill output on at least one target metric

### Milestone D: v1 Foundation

- three flagship skills exist
- balanced controlled suite exists
- Claude export works
- result reporting is saved and reviewable

## 9. Risks and Controls

### Benchmark instability

Control:

- use narrow scenarios first
- seed what can be seeded
- prefer repeated runs and percentiles over single samples

### Skills too broad to help agents

Control:

- keep scope narrow per skill
- require anti-patterns and contraindications
- validate descriptions for specificity

### Tooling gets ahead of the actual proof

Control:

- no broad adapter or catalog expansion until the first measurable win is demonstrated

### Standard overdesign

Control:

- let validator and flagship skills pressure-test the standard before adding more metadata

## 10. Suggested First Implementation Tasks

These are the next concrete tasks to execute:

1. scaffold directories and baseline project tooling
2. write the first `agent-skills` standard doc and sample schema
3. implement the validator CLI
4. author the first flagship skill around instancing and draw-call reduction
5. create the first static-world benchmark scenario and instrumentation

## 11. Definition of "We Are Cooking"

The project is on track when:

- the repo can validate canonical skills
- the first flagship skill can be exported for Claude
- the benchmark harness can run a paired comparison
- the with-skill output produces a measurable improvement

Until that happens, prioritize proof over expansion.

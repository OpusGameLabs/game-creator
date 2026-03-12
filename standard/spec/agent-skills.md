# Agent Skills Canonical Format v0

This document defines the initial canonical on-disk format for `agent-skills`.

## Goals

- keep the source of truth agent-agnostic
- center skill authoring on `SKILL.md`
- support executable artifacts alongside guidance
- require benchmark metadata for any skill that claims runtime or performance impact

## Directory Contract

Each canonical skill lives in its own directory.

Example:

```text
skills/<domain>/<skill-id>/
  SKILL.md
  references/
  templates/
  benchmarks/
  scripts/
  assets/
```

Only `SKILL.md` is required. The companion directories are optional.

## `SKILL.md` Structure

Each `SKILL.md` must begin with YAML frontmatter followed by markdown body content.

### Required frontmatter

- `name`: human-readable skill name
- `slug`: stable machine-readable identifier matching the skill directory name
- `description`: concise trigger-oriented description of what the skill helps with

### Optional frontmatter

- `version`: skill version string
- `tags`: string array
- `owners`: string array
- `agentCompatibility`: object describing target ecosystems
- `benchmark`: object describing the benchmark contract

### Description guidance

The `description` should be specific enough to trigger for the right tasks and narrow enough to avoid being matched everywhere. Avoid vague descriptions such as "helps with Three.js" or "improves game performance".

## Benchmark Metadata

If a skill claims runtime, rendering, loading, memory, or performance impact, it must declare a `benchmark` object in frontmatter.

### Benchmark object

- `scenarios`: array of scenario ids the skill is expected to improve
- `metrics`: array of metric descriptors
- `evidenceThreshold`: short string describing the minimum evidence bar

### Metric descriptor

Each metric descriptor contains:

- `name`: metric id such as `frameTimeP95`, `drawCalls`, or `startupMs`
- `direction`: `increase` or `decrease`

### Performance claim detection

A skill is treated as benchmark-required if either of the following is true:

- `benchmark` frontmatter is present
- the markdown body or description makes a performance claim using terms such as:
  - performance
  - FPS
  - frame time
  - draw calls
  - memory
  - load time
  - startup
  - throughput
  - latency

## Body Content Expectations

Canonical skills should include:

- what problem the skill solves
- when to use it
- when not to use it
- anti-patterns or contraindications
- practical implementation guidance

Performance-oriented skills should also include expected measurable outcomes.

## Companion Directories

Optional companion directories have recommended meaning:

- `references/`: supporting docs or focused notes
- `templates/`: reusable code templates or scaffolds
- `benchmarks/`: scenario-specific skill materials
- `scripts/`: helper scripts used by the skill
- `assets/`: files needed for templates or benchmark examples

## Validation Rules

A valid canonical skill must satisfy:

1. the directory contains `SKILL.md`
2. the file has parseable YAML frontmatter
3. required frontmatter fields are present and non-empty
4. `slug` matches the containing directory name
5. markdown body is non-empty
6. benchmark metadata is present and well-formed when performance claims are made

## Example

```yaml
---
name: Instancing Large Object Sets
slug: instancing-large-object-sets
description: Reduce draw calls and frame time when rendering many repeated meshes in Three.js scenes.
version: 0.1.0
tags:
  - threejs
  - performance
  - instancing
benchmark:
  scenarios:
    - static-world-repeated-meshes
  metrics:
    - name: drawCalls
      direction: decrease
    - name: frameTimeP95
      direction: decrease
  evidenceThreshold: measurable improvement in draw calls and p95 frame time across repeated runs
---
```

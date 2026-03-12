# Agent Skills + Three.js Performance Pack Design

Date: 2026-03-11
Status: Approved in conversation
Scope: v1 design for an open `agent-skills` standard, a Three.js performance-oriented skill pack that implements the standard, and a benchmark harness that proves runtime wins from using the skills.

## 1. Goal

Build a greenfield repo that defines:

1. an open, agent-agnostic `agent-skills` standard
2. a concrete Three.js skill pack focused on cross-game performance improvements
3. a benchmark harness that compares agent outputs with and without the skills and measures runtime impact

The repo is not meant to optimize one narrow genre or mechanic. It should improve common performance and engineering outcomes across many Three.js projects, including large static worlds, many moving/rendered entities, loading/startup behavior, update-loop efficiency, and memory/lifecycle hygiene.

## 2. Product Requirements

### Primary outcome

The primary success criterion for v1 is measurable runtime wins, not only nicer code or better conventions.

### Secondary outcomes

- Skills should also improve code quality and implementation choices.
- Skills should provide both guidance and reusable code artifacts.
- The content should be portable across agents, with Claude compatibility treated as one adapter rather than the canonical format.

## 3. Design Principles

- Canonical over platform-specific: one source of truth for skill content
- Benchmarkability over vibes: any performance claim must map to measurable scenarios and metrics
- Cross-game utility over genre specialization: organize around recurring bottlenecks, not game types
- Portable packaging: standard first, adapters second
- Small, composable skill units: each skill should solve one coherent class of problems

## 4. System Architecture

The repo contains three tightly related subsystems.

### 4.1 `agent-skills` core standard

Defines the canonical on-disk skill format and authoring rules. This is the source of truth for all skill content and metadata.

Recommended canonical format:

- filesystem-based skill directories
- `SKILL.md` as the primary skill document
- YAML frontmatter for required metadata such as `name` and `description`
- optional companion folders such as `references/`, `templates/`, `benchmarks/`, `scripts/`, and `assets/`
- optional extended metadata for versioning, compatibility, benchmark tags, and packaging hints

This follows the documented best-practice direction of keeping the skill format centered on `SKILL.md` and lightweight folder conventions rather than introducing a separate required manifest as the primary source of truth.

### 4.2 Three.js reference skill pack

Implements the standard with a performance-oriented, opinionated set of skills for Three.js development. These skills are the proof case for the standard.

### 4.3 Benchmark/evaluation harness

Executes paired comparisons between agent outputs produced with and without the skills and measures whether the skill meaningfully improves runtime outcomes.

### Architectural boundary

Benchmark scenarios depend on canonical skill content and benchmark metadata, not on Claude-specific packaging. This keeps evaluations valid even when skills are exported to multiple agent ecosystems.

## 5. Skill Model

The skill pack should be organized by recurring bottlenecks and engineering concerns that apply across many projects.

### 5.1 Initial skill families

#### Scene scale

- instancing
- batching
- LOD strategy
- culling strategy
- draw-call reduction

#### Moving entities

- update-loop structure
- transform propagation discipline
- spatial partitioning guidance
- CPU vs GPU tradeoff guidance for large actor counts

#### Asset pipeline

- compressed textures
- progressive loading
- loader orchestration
- startup path reduction
- payload-size reduction

#### Memory and lifecycle

- object pooling
- disposal hygiene
- geometry/material/texture reuse
- memory churn reduction

#### Observability

- profiling workflow
- perf instrumentation
- regression measurement
- performance decision checklists

### 5.2 Skill content contract

Each skill should include both:

- advisory content:
  - when to use the technique
  - when not to use it
  - anti-patterns
  - measurable success criteria
- executable artifacts:
  - templates
  - snippets
  - reference implementations
  - benchmark-linked scaffolds where appropriate

### 5.3 Benchmark metadata

Any skill that claims performance impact must declare:

- which benchmark scenarios it targets
- which metrics should improve
- expected direction of improvement
- minimum evidence threshold required to consider the skill successful

A performance skill without benchmark metadata is incomplete.

## 6. Benchmark and Evaluation Model

The benchmark harness is a first-class product subsystem.

### 6.1 Core question

Does using a given skill cause an agent to generate code that performs better than it would without that skill for the same task?

### 6.2 Benchmark layers

#### Controlled benchmark scenarios

Owned by the repo, stable, repeatable, and heavily instrumented.

Initial controlled suite should cover:

- large static worlds
- many moving/rendered entities
- asset-loading and startup time
- CPU update pressure
- memory churn and disposal behavior

#### Representative mini-projects

One or two small scenes/apps that are less synthetic and help catch overfitting to lab scenarios.

### 6.3 Evaluation flow

1. Start from the same task prompt and scaffold.
2. Run one agent/subagent with the relevant skill set enabled.
3. Run another agent/subagent without the relevant skill set.
4. Execute both outputs in the same benchmark harness.
5. Collect comparable metrics.
6. Score results with scenario-specific thresholds and pass/fail plus delta reporting.

### 6.4 Metrics

Metrics should be scenario-specific but likely include:

- average FPS where useful
- frame time percentiles, especially p95/p99
- draw calls
- CPU update time
- GPU-bound indicators where available
- startup time
- time-to-interactive or first-useful-render
- asset payload size
- memory usage
- disposal/leak indicators

### 6.5 Provenance requirements

Each benchmark result should record:

- task prompt
- agent identity/configuration if available
- enabled skill set
- skill version
- benchmark scenario version
- measured outputs
- environment metadata

This is required to defend claims that a skill caused the improvement.

### 6.6 Handling noise

If a benchmark is too noisy to support a claim, mark the run inconclusive. Do not convert ambiguous measurements into proof of a win.

## 7. Platform Strategy

The repo should explicitly support multiple agent ecosystems through adapters.

### 7.1 Canonical-first model

- canonical skill content lives in the standard format
- adapters transform canonical content into platform-specific packaging
- platform-specific outputs are generated artifacts, not hand-maintained primary sources

### 7.2 Initial platform target

Claude plugin compatibility should be supported in v1 because the current plugin reference and skill guidance provide a clear packaging target.

### 7.3 Future compatibility

The standard should be documented generically so the same content can later be repackaged for Codex/OpenAI-style agents or other ecosystems without rewriting the source content.

## 8. Tech and Framework Positioning

The benchmark ground truth for v1 should be raw Three.js with TypeScript.

### Rationale

- it minimizes framework-specific variables in benchmarks
- it aligns with the widest baseline applicability
- it lets the repo measure rendering/runtime wins rather than React ergonomics

React Three Fiber should be treated as a later adapter or translation layer for selected skills, not the initial benchmark anchor.

## 9. Repo Layout

Proposed top-level structure:

```text
standard/
  spec/
  examples/
  schemas/
  compatibility/

skills/
  threejs/
    scene-scale/
    moving-entities/
    asset-pipeline/
    memory-lifecycle/
    observability/

benchmarks/
  scenarios/
  mini-projects/
  harness/
  instrumentation/
  results/

adapters/
  claude/
  codex/
  generic/

tools/
  validate/
  package/
  benchmark/
  report/

docs/
  superpowers/
    specs/
  methodology/
  authoring/
```

This structure separates:

- normative standard definition
- canonical skill source content
- benchmark assets and runtime tooling
- adapter/export logic
- documentation

## 10. Validation Rules

Each skill should validate against a lightweight contract.

### Required

- `SKILL.md`
- strong frontmatter including `name` and `description`
- enough content to be discoverable and actionable

### Required for benchmarkable/performance skills

- benchmark metadata
- declared target scenarios
- declared target metrics
- expected improvement directions

### Optional

- templates
- snippets
- references
- scripts
- assets
- compatibility metadata

### Validation failures

The validator should fail fast on:

- weak or overly broad descriptions
- missing benchmark mappings for performance claims
- ambiguous scenario ownership
- templates that cannot be exercised by the harness
- broken generated exports

## 11. Packaging and Export

Packaging should be automated.

### Flow

1. Author canonical skill content once.
2. Run validation.
3. Generate platform-specific exports/adapters.
4. Verify exported artifacts.

### Error handling

- invalid skill structure: hard validation failure
- unsupported export target: explicit compatibility warning or failure
- benchmark mismatch: block benchmark execution
- noisy or invalid benchmark data: mark inconclusive

## 12. Testing Strategy

Testing should happen at three levels.

### 12.1 Standard-level tests

- canonical skill examples validate correctly
- schemas/rules behave as documented
- adapters generate expected output from canonical source

### 12.2 Skill-level tests

- templates/snippets lint, typecheck, or execute in expected scaffolds
- documentation includes use cases and contraindications
- performance skills include valid benchmark metadata

### 12.3 Benchmark-level tests

- paired runs execute in controlled scenarios
- instrumentation records expected metrics
- scoring/reporting produces comparable results
- flagship skills demonstrate measurable wins on at least some target scenarios

## 13. Success Criteria for v1

v1 is complete when all of the following are true:

- the draft `agent-skills` standard is documented in this repo
- the Three.js skill pack exists with an initial focused set of cross-game performance skills
- Claude-compatible packaging is generated from canonical source
- the benchmark harness can compare with-skill vs without-skill outputs on a balanced suite
- at least a subset of flagship skills show measurable wins in controlled runs

## 14. Risks and Mitigations

### Risk: benchmark noise makes claims untrustworthy

Mitigation:

- start with narrow, well-instrumented scenarios
- use repeated runs where possible
- record provenance
- allow inconclusive outcomes

### Risk: standard design becomes abstract and detached from real usage

Mitigation:

- keep the Three.js pack as the proving ground
- evolve the standard based on packaging and benchmark friction

### Risk: skills become too broad to trigger or too vague to help

Mitigation:

- keep descriptions precise
- organize by narrow performance concerns
- require measurable target mappings

### Risk: framework differences pollute benchmark signal

Mitigation:

- anchor v1 on raw Three.js + TypeScript
- treat framework-specific versions as later adapters

## 15. Initial Implementation Sequencing

High-level sequencing after this design:

1. define the canonical `agent-skills` folder contract and validation rules
2. scaffold the initial Three.js skill families with benchmark metadata placeholders
3. build the first controlled benchmark scenarios and instrumentation
4. implement adapter/export tooling, starting with Claude
5. prove one or two flagship skills end-to-end through benchmark runs
6. expand the pack and reporting once the benchmark loop is stable

## 16. Notes from Current References

This design is informed by:

- Claude plugin reference for plugin structure and discovery behavior
- Anthropic skill best-practice guidance emphasizing strong `SKILL.md` descriptions and folder-based structure
- current Three.js documentation, including performance-relevant primitives such as `InstancedMesh`, `BatchedMesh`, `LoadingManager`, and `KTX2Loader`

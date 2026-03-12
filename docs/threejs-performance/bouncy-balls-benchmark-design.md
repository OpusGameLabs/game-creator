# Bouncy Balls Benchmark Design

Date: 2026-03-11
Status: Approved in conversation
Scope: browser-visible benchmark scenario for a large drop of bouncing spheres focused on Three.js rendering and update-loop strategy.

## Goal

Add a benchmark lab scenario where `10,000` spheres drop from height, bounce against a floor with energy loss, and eventually settle.

The benchmark should prove Three.js-side wins, not physics-engine wins. For that reason, v1 uses scripted/fake physics rather than an external rigid-body engine.

## Scenario Shape

The scenario has two visible phases:

- chaos phase: many balls moving at once immediately after the drop
- settle phase: most balls slow down and become cheap to maintain

Both variants should tell the same visual story:

- same spawn volume
- same floor-only collision rule
- same sphere appearance
- same approximate gravity and bounce feel

The optimized variant does not need to be numerically identical to the baseline. It only needs to preserve the same visual story while producing measurable performance wins.

## Baseline

The baseline represents a plausible but unoptimized implementation:

- one `Mesh` per ball
- per-ball object state
- per-frame gravity and bounce updates
- direct transform writes to each mesh
- simple stop threshold once balls lose enough energy

## Optimized

The optimized variant should use patterns that generalize to real games:

- one `InstancedMesh` for all balls
- flat typed arrays for state
- one tight update loop
- batched instance-matrix writes
- sleep/settle logic so resting balls become cheap

## Metrics

The scenario should report:

- FPS / frame time
- CPU update time
- render CPU time
- draw calls
- active ball count
- sleeping ball count

Metrics should be readable for both chaos and settle behavior.

## Browser Experience

The page should include:

- live HUD
- current phase
- active vs sleeping ball counts
- draw calls
- update ms
- render ms

## Risks

### Baseline too expensive

Mitigation:

- use modest sphere segment counts
- keep floor-only collisions
- keep deterministic spawn layout

### Optimized path looks too different

Mitigation:

- same sphere look
- same spawn pattern
- same broad motion story
- only relax exact motion math where needed for speed

## Recommended Build

Implement this as a browser-visible scenario in the benchmark lab, with both baseline and optimized variants and result capture similar to the existing static-world and asset-startup pages.

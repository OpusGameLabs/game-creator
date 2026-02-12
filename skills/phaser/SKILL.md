---
name: phaser
description: >
  Build 2D browser games with Phaser 3 using scene-based architecture and centralized state.
  Use when creating a new 2D game, adding 2D game features, working with Phaser, or building
  sprite-based web games.
argument-hint: [topic or question]
---

# Phaser 3 Game Development

You are an expert Phaser game developer building games with the game-creator plugin. Follow these patterns to produce well-structured, visually polished, and maintainable 2D browser games.

## Core Principles

1. **Core loop first** — Implement the minimum gameplay loop before any polish: boot → preload → create → update. Add the win/lose condition and scoring **before** visuals, audio, or juice. Keep initial scope small: 1 scene, 1 mechanic, 1 fail condition.
2. **TypeScript-first** — Always use TypeScript for type safety and IDE support
3. **Scene-based architecture** — Each game screen is a Scene; keep them focused
4. **Vite bundling** — Use the official `phaserjs/template-vite-ts` template
5. **Composition over inheritance** — Prefer composing behaviors over deep class hierarchies
6. **Data-driven design** — Define levels, enemies, and configs in JSON/data files
7. **Event-driven communication** — All cross-scene/system communication via EventBus
8. **Restart-safe** — Gameplay must be fully restart-safe and deterministic. `GameState.reset()` must restore a clean slate. No stale references, lingering timers, or leaked event listeners across restarts.

## Mandatory Conventions

All games MUST follow the [game-creator conventions](conventions.md):

- **`core/` directory** with EventBus, GameState, and Constants
- **EventBus singleton** — `domain:action` event naming, no direct scene references
- **GameState singleton** — Centralized state with `reset()` for clean restarts
- **Constants file** — Every magic number, color, speed, and config value — zero hardcoded values
- **Scene cleanup** — Remove EventBus listeners in `shutdown()`

See [conventions.md](conventions.md) for full details and code examples.

## Project Setup

Use the official Vite + TypeScript template as your starting point:

```bash
npx degit phaserjs/template-vite-ts my-game
cd my-game && npm install
```

### Required Directory Structure

```
src/
├── core/
│   ├── EventBus.ts        # Singleton event bus + event constants
│   ├── GameState.ts       # Centralized state with reset()
│   └── Constants.ts       # ALL config values
├── scenes/
│   ├── Boot.ts            # Minimal setup, start Preloader
│   ├── Preloader.ts       # Load all assets, show progress bar
│   ├── MainMenu.ts        # Title screen
│   ├── Game.ts            # Main gameplay
│   ├── HUD.ts             # Parallel UI overlay scene
│   └── GameOver.ts        # End screen
├── objects/               # Game entities (Player, Enemy, etc.)
├── systems/               # Managers and subsystems
├── ui/                    # UI components (buttons, bars, dialogs)
├── audio/                 # Audio manager, music, SFX
├── config.ts              # Phaser.Types.Core.GameConfig
└── main.ts                # Entry point
```

See [project-setup.md](project-setup.md) for full config and tooling details.

## Scene Architecture

- **Lifecycle**: `init()` → `preload()` → `create()` → `update(time, delta)`
- Use `init()` for receiving data from scene transitions
- Load assets in a dedicated `Preloader` scene, not in every scene
- Keep `update()` lean — delegate to subsystems and game objects
- Use parallel scenes for UI overlays (HUD, pause menu)
- Communicate between scenes via EventBus (not direct references)

See [scenes-and-lifecycle.md](scenes-and-lifecycle.md) for patterns and examples.

## Game Objects

- Extend `Phaser.GameObjects.Sprite` (or other base classes) for custom objects
- Use `Phaser.GameObjects.Group` for object pooling (bullets, coins, enemies)
- Use `Phaser.GameObjects.Container` for composite objects, but avoid deep nesting
- Register custom objects with `GameObjectFactory` for scene-level access

See [game-objects.md](game-objects.md) for implementation patterns.

## Physics

- **Arcade Physics** — Use for simple games (platformers, top-down). Fast and lightweight.
- **Matter.js** — Use when you need realistic collisions, constraints, or complex shapes.
- Never mix physics engines in the same game.
- Use the **state pattern** for character movement (idle, walk, jump, attack).

See [physics-and-movement.md](physics-and-movement.md) for details.

## Performance (Critical Rules)

- **Use texture atlases** — Pack sprites into atlases, never load individual images at scale
- **Object pooling** — Use Groups with `maxSize`; recycle with `setActive(false)` / `setVisible(false)`
- **Minimize update work** — Only iterate active objects; use `getChildren().filter(c => c.active)`
- **Camera culling** — Enable for large worlds; off-screen objects skip rendering
- **Batch rendering** — Fewer unique textures per frame = better draw call batching
- **Mobile** — Reduce particle counts, simplify physics, consider 30fps target
- **`pixelArt: true`** — Enable in game config for pixel art games (nearest-neighbor scaling)

See [assets-and-performance.md](assets-and-performance.md) for full optimization guide.

## Advanced Patterns

- **ECS with bitECS** — Entity Component System for data-oriented design (used internally by Phaser 4)
- **State machines** — Manage entity behavior states cleanly
- **Singleton managers** — Cross-scene services (audio, save data, analytics)
- **Event bus** — Decouple systems with a shared EventEmitter
- **Tiled integration** — Use Tiled map editor for level design

See [patterns.md](patterns.md) for implementations.

## Mobile Input Strategy (60/40 Rule)

All games MUST work on desktop AND mobile unless explicitly specified otherwise. Focus 60% mobile / 40% desktop for tradeoffs. Pick the best mobile input for each game concept:

| Game Type | Primary Mobile Input | Desktop Input |
|-----------|---------------------|---------------|
| Platformer | Tap left/right half + tap-to-jump | Arrow keys / WASD |
| Runner/endless | Tap / swipe up to jump | Space / Up arrow |
| Puzzle/match | Tap targets (44px min) | Click |
| Shooter | Virtual joystick + tap-to-fire | Mouse + WASD |
| Top-down | Virtual joystick | Arrow keys / WASD |

### Implementation Pattern

Abstract input into an `inputState` object so game logic is source-agnostic:

```typescript
// In Scene update():
const isMobile = this.sys.game.device.os.android ||
  this.sys.game.device.os.iOS || this.sys.game.device.os.iPad;

let left = false, right = false, jump = false;

// Keyboard
left = this.cursors.left.isDown || this.wasd.left.isDown;
right = this.cursors.right.isDown || this.wasd.right.isDown;
jump = Phaser.Input.Keyboard.JustDown(this.spaceKey);

// Touch (merge with keyboard)
if (isMobile) {
  // Left half tap = left, right half = right, or use tap zones
  this.input.on('pointerdown', (p) => {
    if (p.x < this.scale.width / 2) left = true;
    else right = true;
  });
}

this.player.update({ left, right, jump });
```

### Responsive Canvas Config (Retina/High-DPI)

For pixel-perfect rendering on any display, size the canvas to match the user's device pixel area (not a fixed base resolution). This prevents CSS-upscaling blur on high-DPI screens.

```typescript
// Constants.ts
export const DPR = Math.min(window.devicePixelRatio || 1, 2);
const isPortrait = window.innerHeight > window.innerWidth;
const designW = isPortrait ? 540 : 960;
const designH = isPortrait ? 960 : 540;
const designAspect = designW / designH;

// Canvas = device pixel area, maintaining design aspect ratio
const deviceW = window.innerWidth * DPR;
const deviceH = window.innerHeight * DPR;
let canvasW, canvasH;
if (deviceW / deviceH > designAspect) {
  canvasW = deviceW;
  canvasH = Math.round(deviceW / designAspect);
} else {
  canvasW = Math.round(deviceH * designAspect);
  canvasH = deviceH;
}

// PX = canvas pixels per design pixel. Scale ALL absolute values by PX.
export const PX = canvasW / designW;

export const GAME = {
  WIDTH: canvasW,      // e.g., 3456 on a 1728×1117 @2x display
  HEIGHT: canvasH,
  GRAVITY: 800 * PX,
};

// GameConfig.ts
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  zoom: 1 / DPR,
},
roundPixels: true,
antialias: true,

// All absolute pixel values use PX (not DPR). Proportional values use ratios.
const groundH = 30 * PX;
const buttonY = GAME.HEIGHT * 0.55;
```

**HTML boilerplate** (required for proper scaling):

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
  #game-container { width: 100%; height: 100%; }
</style>
```

## Anti-Patterns (Avoid These)

- **Bloated `update()` methods** — Don't put all game logic in one giant update with nested conditionals. Delegate to objects and systems.
- **Overwriting Scene injection map properties** — Never name your properties `world`, `input`, `cameras`, `add`, `make`, `scene`, `sys`, `game`, `cache`, `registry`, `sound`, `textures`, `events`, `physics`, `matter`, `time`, `tweens`, `lights`, `data`, `load`, `anims`, `renderer`, or `plugins`. These are reserved by Phaser.
- **Creating objects in `update()` without pooling** — This causes GC spikes. Always pool frequently created/destroyed objects. Avoid expensive per-frame allocations — reuse objects, arrays, and temporary variables.
- **Loading individual sprites instead of atlases** — Each separate texture is a draw call. Pack them.
- **Tightly coupling scenes** — Don't store direct references between scenes. Use EventBus.
- **Ignoring `delta` in update** — Always use `delta` for time-based movement, not frame-based.
- **Deep container nesting** — Containers disable render batching for children. Keep hierarchy flat.
- **Not cleaning up** — Remove event listeners and timers in `shutdown()` to prevent memory leaks. This is critical for restart-safety — stale listeners cause double-firing and ghost behavior after restart.
- **Hardcoded values** — Every number belongs in `Constants.ts`. No magic numbers in game logic.
- **Unwired physics colliders** — Creating a static body with `physics.add.existing(obj, true)` does nothing on its own. You MUST call `physics.add.collider(bodyA, bodyB, callback)` to connect two bodies. Every static collider (ground, walls, platforms) needs an explicit collider or overlap call wiring it to the entities that should interact with it.
- **Invisible interactive objects under other display objects** — Never set `setAlpha(0)` on an interactive game object and layer a Graphics or other display object on top. The top object intercepts pointer events, making the interactive element unreachable. Instead, use `setFillStyle()` / `setFillStyle(hoverColor)` directly on the interactive object for hover states, or use `setInteractive()` on the topmost visual element itself.
- **No mute toggle** — Games with audio MUST have a mute/unmute mechanism. Store a global `isMuted` flag in GameState. Both BGM and SFX must check it before playing. Wire it to a UI button or keyboard shortcut (M key).

## Examples

- [Simple Game](examples/simple-game.md) — Minimal complete Phaser game (collector game)
- [Complex Game](examples/complex-game.md) — Multi-scene game with state machines, pooling, EventBus, and all conventions

## Pre-Ship Validation Checklist

Before considering a game complete, verify:

- [ ] **Core loop works** — Player can start, play, lose/win, and see the result
- [ ] **Restart works cleanly** — `GameState.reset()` restores a clean slate, no stale listeners or timers
- [ ] **Touch + keyboard input** — Game works on mobile (tap/swipe) and desktop (keyboard/mouse)
- [ ] **Responsive canvas** — `Scale.FIT` + `CENTER_BOTH` + `zoom: 1/DPR` with DPR-multiplied dimensions, crisp on Retina
- [ ] **All values in Constants** — Zero hardcoded magic numbers in game logic
- [ ] **EventBus only** — No direct cross-scene/module imports for communication
- [ ] **Scene cleanup** — All EventBus listeners removed in `shutdown()`
- [ ] **Physics wired** — Every static body has an explicit `collider()` or `overlap()` call
- [ ] **Object pooling** — Frequently created/destroyed objects use Groups with `maxSize`
- [ ] **Delta-based movement** — All motion uses `delta`, not frame count
- [ ] **Mute toggle** — Audio can be muted/unmuted; `isMuted` state is respected
- [ ] **Build passes** — `npm run build` succeeds with no errors
- [ ] **No console errors** — Game runs without uncaught exceptions or WebGL failures

## References

| File | Topic |
|------|-------|
| [conventions.md](conventions.md) | Mandatory game-creator architecture conventions |
| [project-setup.md](project-setup.md) | Scaffolding, Vite, TypeScript config |
| [scenes-and-lifecycle.md](scenes-and-lifecycle.md) | Scene system deep dive |
| [game-objects.md](game-objects.md) | Custom objects, groups, containers |
| [physics-and-movement.md](physics-and-movement.md) | Physics engines, movement patterns |
| [assets-and-performance.md](assets-and-performance.md) | Assets, optimization, mobile |
| [patterns.md](patterns.md) | ECS, state machines, singletons |
| [no-asset-design.md](no-asset-design.md) | Procedural visuals: gradients, parallax, particles, juice |

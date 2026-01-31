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

1. **TypeScript-first** — Always use TypeScript for type safety and IDE support
2. **Scene-based architecture** — Each game screen is a Scene; keep them focused
3. **Vite bundling** — Use the official `phaserjs/template-vite-ts` template
4. **Composition over inheritance** — Prefer composing behaviors over deep class hierarchies
5. **Data-driven design** — Define levels, enemies, and configs in JSON/data files
6. **Event-driven communication** — All cross-scene/system communication via EventBus

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

### Responsive Canvas Config

```typescript
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: 800,
  height: 600,
},
```

## Anti-Patterns (Avoid These)

- **Bloated `update()` methods** — Don't put all game logic in one giant update with nested conditionals. Delegate to objects and systems.
- **Overwriting Scene injection map properties** — Never name your properties `world`, `input`, `cameras`, `add`, `make`, `scene`, `sys`, `game`, `cache`, `registry`, `sound`, `textures`, `events`, `physics`, `matter`, `time`, `tweens`, `lights`, `data`, `load`, `anims`, `renderer`, or `plugins`. These are reserved by Phaser.
- **Creating objects in `update()` without pooling** — This causes GC spikes. Always pool frequently created/destroyed objects.
- **Loading individual sprites instead of atlases** — Each separate texture is a draw call. Pack them.
- **Tightly coupling scenes** — Don't store direct references between scenes. Use EventBus.
- **Ignoring `delta` in update** — Always use `delta` for time-based movement, not frame-based.
- **Deep container nesting** — Containers disable render batching for children. Keep hierarchy flat.
- **Not cleaning up** — Remove event listeners and timers in `shutdown()` to prevent memory leaks.
- **Hardcoded values** — Every number belongs in `Constants.ts`. No magic numbers in game logic.
- **Unwired physics colliders** — Creating a static body with `physics.add.existing(obj, true)` does nothing on its own. You MUST call `physics.add.collider(bodyA, bodyB, callback)` to connect two bodies. Every static collider (ground, walls, platforms) needs an explicit collider or overlap call wiring it to the entities that should interact with it.
- **Invisible interactive objects under other display objects** — Never set `setAlpha(0)` on an interactive game object and layer a Graphics or other display object on top. The top object intercepts pointer events, making the interactive element unreachable. Instead, use `setFillStyle()` / `setFillStyle(hoverColor)` directly on the interactive object for hover states, or use `setInteractive()` on the topmost visual element itself.

## Examples

- [Simple Game](examples/simple-game.md) — Minimal complete Phaser game (collector game)
- [Complex Game](examples/complex-game.md) — Multi-scene game with state machines, pooling, EventBus, and all conventions

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

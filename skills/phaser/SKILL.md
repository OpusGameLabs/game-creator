---
name: phaser
description: >
  Build 2D browser games with Phaser 3 using scene-based architecture and centralized state.
  Use when creating a new 2D game, adding 2D game features, working with Phaser, or building
  sprite-based web games.
argument-hint: [topic or question]
license: MIT
metadata:
  author: OpusGameLabs
  version: 1.3.0
  tags: [game, 2d, phaser, scenes, sprites, arcade-physics]
---

# Phaser 3 Game Development

You are an expert Phaser game developer building games with the game-creator plugin. Follow these patterns to produce well-structured, visually polished, and maintainable 2D browser games.

## Core Principles

1. **Core loop first** — Implement the minimum gameplay loop before any polish: boot → preload → create → update. Add the win/lose condition and scoring **before** visuals, audio, or juice. Keep initial scope small: 1 scene, 1 mechanic, 1 fail condition. Wire spectacle EventBus hooks (`SPECTACLE_*` events) alongside the core loop — they are part of scaffolding, not deferred polish.
2. **TypeScript-first** — Always use TypeScript for type safety and IDE support
3. **Scene-based architecture** — Each game screen is a Scene; keep them focused
4. **Vite bundling** — Use the official `phaserjs/template-vite-ts` template
5. **Composition over inheritance** — Prefer composing behaviors over deep class hierarchies
6. **Data-driven design** — Define levels, enemies, and configs in JSON/data files
7. **Event-driven communication** — All cross-scene/system communication via EventBus
8. **Restart-safe** — Gameplay must be fully restart-safe and deterministic. `GameState.reset()` must restore a clean slate. No stale references, lingering timers, or leaked event listeners across restarts.

## Spectacle Events

Every player action and game event must emit at least one spectacle event. These hooks exist in the template EventBus — the design pass attaches visual effects to them.

| Event | Constant | When to Emit |
|-------|----------|--------------|
| `spectacle:entrance` | `SPECTACLE_ENTRANCE` | In `create()` when the player/entities first appear on screen |
| `spectacle:action` | `SPECTACLE_ACTION` | On every player input (tap, jump, shoot, swipe) |
| `spectacle:hit` | `SPECTACLE_HIT` | When player hits/destroys an enemy, collects an item, or scores |
| `spectacle:combo` | `SPECTACLE_COMBO` | When consecutive hits/scores happen without a miss. Pass `{ combo: n }` |
| `spectacle:streak` | `SPECTACLE_STREAK` | When combo reaches milestones (5, 10, 25, 50). Pass `{ streak: n }` |
| `spectacle:near_miss` | `SPECTACLE_NEAR_MISS` | When player narrowly avoids danger (within ~20% of collision radius) |

**Rule**: If a gameplay moment has no spectacle event, add one. The design pass cannot polish what it cannot hook into.

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
│   ├── Boot.ts            # Minimal setup, start Game scene
│   ├── Preloader.ts       # Load all assets, show progress bar
│   ├── Game.ts            # Main gameplay (starts immediately, no title screen)
│   └── GameOver.ts        # End screen with restart
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
- **No title screen by default** — boot directly into gameplay. Only add a title/menu scene if the user explicitly asks for one
- **No in-game score HUD** — the Play.fun widget displays score in a deadzone at the top of the game. Do not create a separate UIScene or HUD overlay for score display
- Use parallel scenes for UI overlays (pause menu) only when requested

### Play.fun Safe Zone

When games run inside the Play.fun dashboard on mobile Safari, the SDK sets CSS custom properties on the game iframe's `document.documentElement`:

- `--ogp-safe-top-inset` — space below the Play.fun header bubbles (~68px on mobile)
- `--ogp-safe-bottom-inset` — space above Safari bottom controls (~148px on mobile)

Both default to `0px` when not running inside the dashboard (desktop, standalone).

The template's `Constants.js` reads these at boot and exposes `SAFE_ZONE.TOP` and `SAFE_ZONE.BOTTOM` in canvas pixels (CSS value × DPR). A static fallback (`GAME.HEIGHT * 0.08`) ensures the top safe zone works even without the SDK.

**Rules:**
- All UI text, buttons, and HUD elements must be positioned below `SAFE_ZONE.TOP` and above `GAME.HEIGHT - SAFE_ZONE.BOTTOM`
- Gameplay entities should not spawn in the safe zone areas
- The game-over screen, score panels, and restart buttons must offset from both `SAFE_ZONE.TOP` and `SAFE_ZONE.BOTTOM`
- Use `const usableH = GAME.HEIGHT - SAFE_ZONE.TOP - SAFE_ZONE.BOTTOM` for calculating proportional positions in UI scenes
- Game canvas and backgrounds should fill the full viewport (bleed behind browser chrome)
- Touch controls at the bottom must account for `SAFE_ZONE.BOTTOM`

```js
import { SAFE_ZONE } from '../core/Constants.js';

// In any UI scene:
const safeTop = SAFE_ZONE.TOP;
const safeBottom = SAFE_ZONE.BOTTOM;
const usableH = GAME.HEIGHT - safeTop - safeBottom;
const title = this.add.text(cx, safeTop + usableH * 0.15, 'GAME OVER', { ... });
const button = createButton(scene, cx, safeTop + usableH * 0.6, 'PLAY AGAIN', callback);

// Touch controls / bottom HUD:
const bottomY = GAME.HEIGHT - safeBottom - 40 * PX;
```

**How it works in Constants.js:**

```js
function _readSafeInsets() {
  const s = getComputedStyle(document.documentElement);
  const top = parseInt(s.getPropertyValue('--ogp-safe-top-inset')) || 0;
  const bottom = parseInt(s.getPropertyValue('--ogp-safe-bottom-inset')) || 0;
  return { top: top * DPR, bottom: bottom * DPR };
}
const _insets = _readSafeInsets();

export const SAFE_ZONE = {
  TOP: Math.max(GAME.HEIGHT * 0.08, _insets.top),
  BOTTOM: _insets.bottom,
  LEFT: 0,
  RIGHT: 0,
};
```

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

See [project-setup.md](project-setup.md) for the full responsive canvas config, entity sizing, HTML boilerplate, and portrait-first game patterns.

### Visible Touch Controls

Always show visual touch indicators on touch-capable devices — never rely on invisible tap zones. Use **capability detection** (not OS-based detection) to determine touch support:

```js
// Good — detects touch laptops, tablets, 2-in-1s
const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// Bad — misses touch-screen laptops, iPadOS (reports as desktop)
const isMobile = device.os.android || device.os.iOS;
```

Render semi-transparent arrow buttons (or direction indicators) at the bottom of the screen. Use `TOUCH` constants from Constants.js for sizing (12% of canvas width), alpha (0.35 idle / 0.6 active), and margins. Update alpha in the `update()` loop based on input state for visual feedback.

Enable pointer input (pointerdown, pointermove, pointerup) on **all** devices — pointer events work for both mouse and touch. This eliminates the need for separate mobile/desktop input code paths.

### Minimum Entity Sizes for Mobile

Collectibles, hazards, and interactive items must be at least **7–8% of `GAME.WIDTH`** to be recognizable on phone screens. Smaller entities become indistinguishable blobs on mobile.

```js
// Good — recognizable on mobile
ATTACK_WIDTH: _canvasW * 0.09,
POWERUP_WIDTH: _canvasW * 0.072,

// Bad — too small on phone screens
ATTACK_WIDTH: _canvasW * 0.04,
POWERUP_WIDTH: _canvasW * 0.035,
```

For the main player character, use 12–15% of `GAME.WIDTH` (see Entity Sizing above).

### Button Pattern (Container + Graphics + Text)

See [game-objects.md](game-objects.md) for the full button implementation pattern (Container + Graphics + Text with hover/press states) and the list of broken patterns to avoid.

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
- **Invisible or hidden button elements** — Never set `setAlpha(0)` on an interactive game object and layer Graphics or other display objects on top. **For buttons, always use the Container + Graphics + Text pattern** (see [game-objects.md](game-objects.md)). Common broken patterns: (1) Drawing a Graphics rect after adding Text, hiding the label behind it. (2) Creating a Zone for hit area with Graphics drawn over it, making the Zone unreachable. (3) Making Text interactive but covering it with a Graphics background drawn afterward. The fix is always: Container first, Graphics added to container, Text added to container (in that order), Container is the interactive element.
- **No mute toggle** — See the `mute-button` rule. Games with audio must have a mute toggle.

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
- [ ] **Mute toggle** — See `mute-button` rule
- [ ] **Spectacle hooks wired** — Every player action and game event emits a `SPECTACLE_*` event; entrance sequence fires in `create()`
- [ ] **Build passes** — `npm run build` succeeds with no errors
- [ ] **No console errors** — Game runs without uncaught exceptions or WebGL failures

## Reference Files

| File | Topic |
|------|-------|
| [conventions.md](conventions.md) | Mandatory game-creator architecture conventions |
| [project-setup.md](project-setup.md) | Scaffolding, Vite, TypeScript config, responsive canvas, entity sizing, portrait mode |
| [scenes-and-lifecycle.md](scenes-and-lifecycle.md) | Scene system deep dive |
| [game-objects.md](game-objects.md) | Custom objects, groups, containers, button pattern |
| [physics-and-movement.md](physics-and-movement.md) | Physics engines, movement patterns |
| [assets-and-performance.md](assets-and-performance.md) | Assets, optimization, mobile |
| [patterns.md](patterns.md) | ECS, state machines, singletons |
| [no-asset-design.md](no-asset-design.md) | Procedural visuals: gradients, parallax, particles, juice |

---
description: Add a new feature to an existing game following the architecture patterns
disable-model-invocation: true
argument-hint: "[feature-description]"
---

# Add Feature

Add a new feature to the current game project following the established architecture patterns.

## Instructions

The user wants to add: $ARGUMENTS

### Step 1: Understand the codebase

- Read `package.json` to identify the engine (Three.js or Phaser)
- Read `src/core/Constants.js` for existing configuration
- Read `src/core/EventBus.js` for existing events
- Read `src/core/GameState.js` for existing state
- Read `src/core/Game.js` (or GameConfig.js) for existing system wiring

### Step 2: Plan the feature

Determine what's needed:
- New module file(s) and where they go in the directory structure
- New events to add to the Events enum
- New constants to add to Constants.js
- New state to add to GameState.js
- How to wire it into the Game orchestrator

### Step 3: Implement

Follow these rules strictly:
1. Create the new module in the correct `src/` subdirectory
2. Add ALL new events to `EventBus.js` Events enum
3. Add ALL configuration values to `Constants.js` (zero hardcoded values)
4. Add any new state domains to `GameState.js`
5. Wire the new system into `Game.js` (import, instantiate, update in loop)
6. Use EventBus for ALL communication with other systems
7. Follow the existing code style and patterns in the project

### Step 4: Verify

- Confirm the feature integrates without breaking existing systems
- Check that no circular dependencies were introduced
- Ensure event listeners are properly cleaned up if applicable

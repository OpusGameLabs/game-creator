# Flow Test 06: Add Feature to Existing Game

## Objective
Test adding a specific gameplay feature to an existing game.

## Prerequisites
- An existing game with clean architecture (EventBus, GameState, Constants)
- Game has working `npm run dev` and `npm run build`

## Test Prompt
"Add a double-jump power-up that spawns randomly and gives the player one extra jump for 10 seconds"

## Steps

### Phase 1: Codebase Understanding
- [ ] Skill reads package.json, Constants.js, EventBus.js, GameState.js
- [ ] Reads Game.js/GameConfig.js for system wiring
- [ ] Reads existing scene and entity files
- [ ] Understands current architecture before proposing changes

### Phase 2: Plan
- [ ] Explains feature from player's perspective
- [ ] Lists new files, events, and constants to create
- [ ] Lists existing files that need changes
- [ ] Plan is presented before implementation begins

### Phase 3: Implementation
- [ ] New module created in correct src/ subdirectory
- [ ] New events added to EventBus.js Events enum
- [ ] New configuration values in Constants.js (zero hardcoded)
- [ ] New state fields in GameState.js with reset() defaults
- [ ] System wired into Game.js orchestrator
- [ ] Uses EventBus for all cross-module communication
- [ ] Follows existing code style and patterns

### Phase 4: Verification
- [ ] `npm run build` succeeds with no errors
- [ ] No circular dependencies introduced
- [ ] Existing gameplay still works (scoring, death, restart)
- [ ] Summary of what was added provided

## Success Criteria
- [ ] All checkboxes pass
- [ ] 0 build failures
- [ ] <= 1 clarifying question
- [ ] Feature is functional when tested manually
- [ ] No existing gameplay broken

## Anti-patterns
- Hardcoding values instead of using Constants.js
- Direct module imports instead of EventBus
- Forgetting to add new state to GameState.reset()
- Not running build verification

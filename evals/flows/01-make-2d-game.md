# Flow Test: Make a 2D Game

## Setup
- Clean directory (or game-creator/examples/)
- game-creator plugin installed

## Trigger
"Make a 2D game called Asteroid Dodge where you dodge falling asteroids"

## Expected Phases

### Phase 1: Scaffold
- [ ] Creates project directory with correct structure (core/, scenes/, entities/, ui/)
- [ ] EventBus.js, GameState.js, Constants.js created in core/
- [ ] main.js exposes render_game_to_text() and advanceTime()
- [ ] package.json has phaser and vite dependencies
- [ ] `npm install` succeeds
- [ ] `npm run dev` starts without errors
- [ ] Game loads in browser (canvas visible)

### Phase 2: Assets
- [ ] Geometric shapes replaced with pixel art sprites
- [ ] Characters are recognizable at game scale
- [ ] No broken image references
- [ ] Game still runs after asset changes

### Phase 3: Design
- [ ] Visual polish added (gradients, particles, transitions)
- [ ] UI elements styled (score display, game over screen)
- [ ] Game still runs after design changes

### Phase 4: Audio
- [ ] BGM plays during gameplay
- [ ] SFX triggers on player actions (at least 2 distinct sounds)
- [ ] Mute button works
- [ ] Audio doesn't block game if browser blocks autoplay

### Phase 5: Deploy
- [ ] `npm run build` produces dist/ without errors
- [ ] Game deployed to here.now (or alternative)
- [ ] Deployed URL loads and game is playable

## Success Criteria
- All checkboxes pass
- 0 failed build steps
- <= 2 clarifying questions from Claude
- Total pipeline completes (with QA gates)

## Known Tolerances
- Pixel art quality is subjective — pass if recognizable
- FPS in headless may be low (~7-9) — this is expected
- Deploy URL may be temporary (here.now anonymous)

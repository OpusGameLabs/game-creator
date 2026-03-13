# Flow Test 05: Improve Existing Game

## Objective
Test the audit + implementation flow for improving an existing game.

## Prerequisites
- An existing game (e.g., `examples/flappy-bird/` or output from flow 01)
- Game has working `npm run dev` and `npm run build`

## Steps

### Phase 1: Deep Audit
- [ ] Run `/improve-game` on the game directory
- [ ] Skill reads ALL source files (not just package.json)
- [ ] Produces a diagnostic table with scores for each area
- [ ] Overall score reported as X/65

### Phase 2: Improvement Plan
- [ ] Top 5-8 improvements listed, ranked by player impact
- [ ] Each improvement has: title, area, impact, what to do, files touched
- [ ] Asks the user which improvements to implement before proceeding
- [ ] Waits for user selection (does NOT auto-implement all)

### Phase 3: Implementation
- [ ] Implements selected improvements following architecture rules
- [ ] New constants in Constants.js (zero hardcoded values)
- [ ] New events in EventBus.js with domain:action naming
- [ ] Runs `npm run build` after each improvement
- [ ] No build errors introduced

### Phase 4: Verification
- [ ] Final `npm run build` succeeds
- [ ] Existing tests still pass (if present)
- [ ] Report shows before/after scores
- [ ] Files created/modified listed

## Success Criteria
- [ ] All checkboxes pass
- [ ] 0 build failures in final state
- [ ] <= 2 clarifying questions
- [ ] Score improves by at least 5 points
- [ ] No existing gameplay broken

## Anti-patterns
- Implementing all improvements without asking the user
- Skipping the audit and going straight to changes
- Modifying gameplay physics without being asked
- Not running build verification between improvements

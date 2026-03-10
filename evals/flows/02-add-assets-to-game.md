# Flow Test: Add Assets to an Existing Game

## Setup
- An existing game with geometric shapes (use `examples/flappy-bird/` or scaffold a quick game first)

## Trigger
"Add pixel art sprites to this game — replace the geometric shapes with real characters"

## Expected Steps
- [ ] Reads existing game code to identify entities using geometric shapes
- [ ] Creates pixel art sprites using renderPixelArt() or renderSpriteSheet()
- [ ] Replaces fillRect/fillCircle calls with sprite rendering
- [ ] Preserves existing gameplay logic (collision, scoring)
- [ ] Game still builds and runs after changes
- [ ] Characters are visually recognizable at game scale

## Success Criteria
- Game compiles and runs
- At least player and 1 enemy/obstacle replaced with sprites
- No regression in gameplay (scoring, collision still work)
- <= 1 clarifying question

## Anti-patterns to Watch For
- Skipping straight to generic pixel art without analyzing the existing entities
- Breaking collision detection by changing entity sizes
- Adding external image files instead of code-generated sprites

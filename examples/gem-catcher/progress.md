# Progress

## Game Concept
- **Name**: gem-catcher
- **Engine**: Phaser 3
- **Description**: Gems rain from the sky and the player slides a basket left/right to catch them. Skulls also fall — catch one and lose a life. 3 lives, increasing difficulty.

## Step 1: Scaffold
- **Entities**: Player (basket), Gem (diamond shape), Skull (red with eyes)
- **Events**: GAME_START, GAME_OVER, GAME_RESTART, PLAYER_MOVE, PLAYER_DIED, SCORE_CHANGED, GEM_CAUGHT, SKULL_CAUGHT, LIFE_LOST, DIFFICULTY_UP, PARTICLES_EMIT, AUDIO_INIT, MUSIC_MENU, MUSIC_GAMEPLAY, MUSIC_GAMEOVER, MUSIC_STOP
- **Constants keys**: GAME, SAFE_ZONE, PLAYER, GEM, SKULL, DIFFICULTY, LIVES, COLORS, UI, TRANSITION
- **Scoring system**: +1 per gem caught, ScoreSystem wired to GEM_CAUGHT event
- **Fail condition**: 0 lives (lose 1 life per skull caught)
- **Input scheme**: Arrow keys left/right + A/D keys + touch zones (left/right halves of screen)
- **Difficulty ramp**: Every 10 points: fall speed x1.15, spawn interval -100ms (min 400ms)

## Step 1.5: Assets
- **Palette**: DARK (gothic/dark fantasy) -- matches night sky theme
- **Renderer**: `src/core/PixelRenderer.js` with `renderPixelArt()` and `renderSpriteSheet()`
- **Sprites created**:
  - `src/sprites/palette.js` -- DARK palette with 19 colors (added brown weave, bone, skull, space colors)
  - `src/sprites/player.js` -- 20x14 woven basket, 3 poses (idle, left-tilt, right-tilt), 4-frame spritesheet
  - `src/sprites/gems.js` -- 4 gem types (diamond/gold, emerald/green, ruby/red, sapphire/cyan), each 12x14 with 2-frame sparkle animation
  - `src/sprites/skull.js` -- 14x14 menacing skull with bone-white body, dark eye sockets, red accents, 2-frame glow animation
  - `src/sprites/tiles.js` -- 3 sky tile variants (16x16), star cluster (8x8), bright star (6x6), nebula puff (8x8)
- **Dimension changes**:
  - PLAYER.WIDTH: 12% -> 14% of GAME.WIDTH; PLAYER.HEIGHT: now 10% of GAME.WIDTH (proportional to basket shape)
  - GEM.SIZE: 4% -> 6% of GAME.WIDTH
  - SKULL.SIZE: 4% -> 6% of GAME.WIDTH
  - Added PIXEL_SCALE constants to PLAYER (3), GEM (3), SKULL (3)
  - Removed PLAYER.COLOR, GEM.COLORS, SKULL.COLOR from Constants (colors now in palette)
- **Entity changes**:
  - Player.js: now uses renderSpriteSheet with basket frames, tilts left/right when moving
  - Gem.js: extends Phaser.GameObjects.Sprite (was Graphics), random gem type selection, sparkle animation, gentle rotation tween
  - Skull.js: extends Phaser.GameObjects.Sprite (was Graphics), red-eyed glow animation, sinister wobble tween
- **Background**: Gradient base + pixel art tile overlay (3 variants at low alpha) + scattered bright stars (twinkle tweens) + nebula puff decorations
- **No remaining fillCircle/generateTexture calls** in entity files

## Decisions / Known Issues
- No global gravity in physics config; falling objects use setVelocityY() directly
- Player basket has allowGravity=false
- Pixel art textures cached via textures.exists() check in PixelRenderer
- Touch input works on all devices (no isMobile gate on pointer events)
- render_game_to_text() needed null guard for body (fixed post-scaffold)
- Gem and Skull entities changed from Graphics to Sprite base class for animation support

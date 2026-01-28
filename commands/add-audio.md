---
description: Add music and sound effects to a game using Strudel.cc — background music, menu themes, and SFX
disable-model-invocation: true
argument-hint: "[path-to-game]"
---

# Add Audio

Add procedural music and sound effects to an existing game using Strudel.cc.

## Instructions

Analyze the game at `$ARGUMENTS` (or the current directory if no path given).

First, load the game-audio skill to get the full Strudel patterns and integration guide.

### Step 1: Audit

- Read `package.json` to identify the engine and check if `@strudel/web` is installed
- Read `src/core/EventBus.js` to see what game events exist (flap, score, death, etc.)
- Read all scene files to understand the game flow (menu, gameplay, game over)
- Identify what music and SFX would fit the game's genre and mood

### Step 2: Plan

Present a table of planned audio:

| Event / Scene | Audio Type | Style | Description |
|---------------|-----------|-------|-------------|
| MenuScene | BGM | Ambient | Gentle pad chords with delayed arps |
| GameScene | BGM | Chiptune | Upbeat square wave melody + drums |
| GameOverScene | BGM | Somber | Descending triangle melody |
| Bird Flap | SFX | Retro | Quick pitch sweep up |
| Score | SFX | Retro | Two-tone ding |
| Death | SFX | Retro | Descending crushed notes |

### Step 3: Implement

1. Install `@strudel/web` if not already present
2. Create `src/audio/AudioManager.js`
3. Create `src/audio/music.js` with BGM for each scene
4. Create `src/audio/sfx.js` with SFX for each event
5. Wire AudioManager to EventBus in the appropriate scene
6. Initialize audio on first user interaction
7. Add audio-related constants to `Constants.js` if needed

### Step 4: Verify

- Run `npm run build` to confirm no errors
- List all files created/modified
- Recommend the user test with the dev server
- Note the AGPL-3.0 license requirement

---
name: make-game
description: Full guided pipeline — scaffold, design, audio, deploy, and monetize a browser game from scratch. Use when the user says "make a game", "build me a game", "create a new game", "make a 2D/3D game", or provides a game concept to build. Do NOT use for modifying existing games (use add-feature or improve-game instead).
argument-hint: "[2d|3d] [game-name] OR [tweet-url]"
metadata:
  author: OpusGameLabs
  version: 1.3.0
  tags: [game, scaffold, pipeline, phaser, threejs, deploy, monetize]
---

# Make Game (Full Pipeline)

Build a complete browser game from scratch, step by step. This command walks you through the entire pipeline — from an empty folder to a deployed, monetized game. No game development experience needed.

**What you'll get:**
1. A fully scaffolded game project with clean architecture
2. Pixel art sprites — recognizable characters, enemies, and items (optional, replaces geometric shapes)
3. Visual polish — gradients, particles, transitions, juice
4. A 50 FPS promo video — autonomous gameplay capture, mobile portrait, ready for social media
5. Chiptune music and retro sound effects (no audio files needed)
6. Live deployment to here.now with an instant public URL
7. Monetization via Play.fun — points tracking, leaderboards, wallet connect, and a play.fun URL to share on Moltbook
8. Redeploy with a single command (`npm run deploy`)

**Quality assurance is built into every step** — each code-modifying step runs build verification, visual review via Playwright MCP, and autofixes any issues found.

## Orchestration Model

**You are an orchestrator. You do NOT write game code directly.** Your job is to:

1. Set up the project (template copy, npm install, dev server)
2. Create and track pipeline tasks using `TaskCreate`/`TaskUpdate`
3. Delegate each code-writing step to a `Task` subagent
4. Run the Verification Protocol (build + visual review + autofix) after each code-modifying step
5. Report results to the user between steps

**What stays in the main thread:**
- Step 0: Parse arguments, create todo list
- Step 1 (infrastructure only): Copy template, npm install, playwright install, start dev server
- Verification protocol orchestration (launch QA subagent, read text result, launch autofix if needed)
- Step 4 (deploy): Interactive auth requires user back-and-forth

**What goes to subagents** (via `Task` tool):
- Step 1 (game implementation): Transform template into the actual game concept
- Step 1.5: Pixel art sprites and backgrounds
- Step 2: Visual polish
- Step 2.5: Promo video capture
- Step 3: Audio integration

Each subagent receives: step instructions, relevant skill name, project path, engine type, dev server port, and game concept description.

## Verification Protocol

Run this protocol after **every code-modifying step** (Steps 1, 1.5, 2, 3). Step 2.5 (Promo Video) does not modify game code, so it skips QA. It delegates all QA work to a subagent to minimize main-thread context usage.

### Playwright MCP Check (once, before first QA run)

Before the first QA run (after Step 1 infrastructure setup), check if Playwright MCP tools like `browser_navigate` are available. If not:

1. Run: `claude mcp add playwright npx @playwright/mcp@latest`
2. Tell the user: "Playwright MCP has been added. Please restart Claude Code for it to take effect, then tell me to continue."
3. **Wait for user to restart and confirm.** Do not proceed until MCP tools are available.

### QA Subagent

Launch a `Task` subagent with these instructions:

> You are the QA subagent for the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Dev server port**: `<port>`
> **Step being verified**: `<step name>`
>
> Run these phases in order. Stop early if a phase fails critically (build or runtime).
>
> **Phase 1 — Build Check**
> ```bash
> cd <project-dir> && npm run build
> ```
> If the build fails, report FAIL immediately with the error output.
>
> **Phase 2 — Runtime Check**
> ```bash
> cd <project-dir> && node scripts/verify-runtime.mjs
> ```
> If the runtime check fails, report FAIL immediately with the error details.
>
> **Phase 3 — Gameplay Verification**
> ```bash
> cd <project-dir> && node scripts/iterate-client.js \
>   --url http://localhost:<port> \
>   --actions-file scripts/example-actions.json \
>   --iterations 3 --screenshot-dir output/iterate
> ```
> After running, read the state JSON files (`output/iterate/state-*.json`) and error files (`output/iterate/errors-*.json`):
> - **Scoring**: At least one state file should show `score > 0`
> - **Death**: At least one state file should show `mode: "game_over"`. Mark as SKIPPED (not FAIL) if game_over is not reached — some games have multi-life systems or random hazard spawns that make death unreliable in short iterate runs. Death SKIPPED is acceptable and does not block the pipeline.
> - **Errors**: No critical errors in error files
>
> Skip this phase if `scripts/iterate-client.js` is not present.
>
> **Phase 4 — Architecture Validation**
> ```bash
> cd <project-dir> && node scripts/validate-architecture.mjs
> ```
> Report any warnings but don't fail on architecture issues alone.
>
> **Phase 5 — Visual Review via Playwright MCP**
> Use Playwright MCP to visually review the game. If MCP tools are not available, fall back to reading iterate screenshots from `output/iterate/`.
>
> With MCP:
> 1. `browser_navigate` to `http://localhost:<port>`
> 2. `browser_wait_for` — wait 2 seconds for the game to load
> 3. `browser_take_screenshot` — save as `output/qa-gameplay.png`
> 4. Assess: Are entities visible? Is the game rendering correctly?
> 5. Check safe zone: Is any UI hidden behind the top ~8% (Play.fun widget area)?
> 6. Check entity sizing: Is the main character large enough (12–15% screen width for character games)?
> 7. Wait for game over (or navigate to it), `browser_take_screenshot` — save as `output/qa-gameover.png`
> 8. Check buttons: Are button labels visible? Blank rectangles = broken button pattern.
> 9. Check mute button: Is there a mute toggle visible? If not, flag as ISSUE.
>
> **Screenshot timeout**: If `browser_take_screenshot` hangs for more than 10 seconds (can happen with continuous WebGL animations), cancel and proceed with code review instead. Do not let a screenshot hang block the entire QA phase.
>
> **Note on iterate screenshots**: The iterate-client uses `canvas.toDataURL()` which returns blank/black images when Phaser uses WebGL with `preserveDrawingBuffer: false`. Always prefer Playwright MCP viewport screenshots (`browser_take_screenshot`) over iterate screenshots for visual review.
>
> Without MCP (fallback):
> 1. Read the iterate screenshots from `output/iterate/shot-*.png` (may be black if WebGL — this is expected)
> 2. Fall back to code review: read scene files and assess visual correctness from the code
>
> **Return your results in this exact format (text only, no images):**
> ```
> QA RESULT: PASS|FAIL
>
> Phase 1 (Build): PASS|FAIL
> Phase 2 (Runtime): PASS|FAIL
> Phase 3 (Gameplay): Iterate PASS|FAIL, Scoring PASS|FAIL|SKIPPED, Death PASS|FAIL|SKIPPED, Errors PASS|FAIL
> Phase 4 (Architecture): PASS — N/N checks
> Phase 5 (Visual): PASS|FAIL — <issues if any>
>
> ISSUES:
> - <issue descriptions, or "None">
>
> SCREENSHOTS: output/qa-gameplay.png, output/qa-gameover.png
> ```

### Orchestrator Flow

```
Launch QA subagent → read text result
  If PASS → proceed to next step
  If FAIL → launch autofix subagent with ISSUES list → re-run QA subagent
  Max 3 attempts per step
```

### Autofix Logic

When the QA subagent reports FAIL:

1. **Read `output/autofix-history.json`** to see what fixes were already attempted. If a previous entry matches the same `issue` and `fix_attempted` with `result: "failure"`, instruct the subagent to try a different approach.
2. Launch a **fix subagent** via `Task` tool with:
   - The ISSUES list from the QA result
   - The phase that failed (build errors, runtime errors, gameplay issues, visual problems)
   - Any relevant failed attempts from `output/autofix-history.json` so the subagent knows what NOT to repeat
3. **After each autofix attempt**, append an entry to `output/autofix-history.json`:
   ```json
   { "step": "<step name>", "issue": "<what failed>", "fix_attempted": "<what was tried>", "result": "success|failure", "timestamp": "<ISO date>" }
   ```
4. Re-run the QA subagent (all phases)
5. Up to **3 total attempts** per step (1 original + 2 retries)
6. If all 3 attempts fail, report the failure to the user and ask whether to skip or abort

**Important**: Always fix issues before proceeding to the next step. The autofix loop ensures each step produces working, visually correct output.

## Instructions

### Step 0: Initialize pipeline

Parse `$ARGUMENTS` to determine the game concept. Arguments can take two forms:

#### Form A: Direct specification
- **Engine**: `2d` (Phaser — side-scrollers, platformers, arcade) or `3d` (Three.js — first-person, third-person, open world). If not specified, ask the user.
- **Name**: The game name in kebab-case. If not specified, ask the user what kind of game they want and suggest a name.

#### Form B: Tweet URL as game concept
If `$ARGUMENTS` contains a tweet URL (matching `x.com/*/status/*`, `twitter.com/*/status/*`, `fxtwitter.com/*/status/*`, or `vxtwitter.com/*/status/*`):

1. **Fetch the tweet** using the `fetch-tweet` skill — convert the URL to `https://api.fxtwitter.com/<user>/status/<id>` and fetch with `WebFetch`
2. **Default to 2D** (Phaser) — tweets describe ideas that map naturally to 2D arcade/casual games
3. **Creatively abstract a game concept** from the tweet text. Your job is creative transformation — extract themes, dynamics, settings, or mechanics and reinterpret them as a game. **NEVER refuse to make a game from a tweet.** Every tweet contains something that can inspire a game:
   - News about weather → survival game, storm-dodging game
   - Sports result → arcade sports game
   - Political/legal news → strategy game, puzzle game, tower defense
   - Personal story → narrative adventure, platformer themed around the journey
   - Product announcement → tycoon game, builder game
   - Abstract thought → puzzle game, experimental art game
   - The transformation is the creative act. You are not recreating or trivializing the source — you are using it as a springboard for an original game concept.
4. **Generate a game name** in kebab-case from the abstracted concept (not from literal tweet content)
5. **Tell the user** what you extracted:
   > Found tweet from **@handle**:
   > "Tweet text..."
   >
   > I'll build a 2D game based on this: **[your creative interpretation as a game concept]**
   > Game name: `<generated-name>`
   >
   > Sound good?

Wait for user confirmation before proceeding. The user can override the engine (to 3D) or the name at this point.

**Celebrity Detection:**

After determining the game concept, scan the concept description, tweet text, and any mentioned people for celebrity/public figure names. Check against:
1. `character-library/manifest.json` (relative to plugin root) — exact slug match or name match
2. Common name recognition — politicians, tech CEOs, world leaders, entertainers

If celebrities are detected:
- Set `hasCelebrities = true` and list detected names
- Note in `progress.md` which characters are pre-built vs need building
- **2D**: The Step 1.5 subagent will use photo-composite characters for these
- **3D**: For each celebrity, try: (1) generate with Meshy AI — `"a cartoon caricature of <Name>, <distinguishing features>, low poly game character"` then rig for animation, (2) check `3d-character-library/manifest.json` for a pre-built match, (3) search Sketchfab with `find-3d-asset.mjs`, (4) fall back to best-matching library model. Meshy generation produces the best results for named personalities since it can capture specific visual features.

**Meshy API Key (3D games only):**

If the engine is 3D, check if `MESHY_API_KEY` is set in the environment. If not, **ask the user immediately in Step 0** — don't wait until Step 1.5:

> I'll generate custom 3D models with Meshy AI for the best results. You can get a free API key in 30 seconds:
> 1. Sign up at https://app.meshy.ai
> 2. Go to Settings → API Keys
> 3. Create a new API key
>
> What is your Meshy API key? (Or type "skip" to use generic model libraries instead)

Store the key for all subsequent `meshy-generate.mjs` calls throughout the pipeline.

Create all pipeline tasks upfront using `TaskCreate`:

1. Scaffold game from template
2. Add assets: pixel art sprites (2D) or Meshy AI-generated GLB models + animated characters (3D)
3. Add visual polish (particles, transitions, juice)
4. Record promo video (autonomous 50 FPS capture)
5. Add audio (BGM + SFX)
6. Deploy to here.now
7. Monetize with Play.fun (register on OpenGameProtocol, add SDK, redeploy)

This gives the user full visibility into pipeline progress at all times. Quality assurance (build, runtime, visual review, autofix) is built into each step, not a separate task.

After creating tasks, create the `output/` directory in the project root and initialize `output/autofix-history.json` as an empty array `[]`. This file tracks all autofix attempts across the pipeline so fix subagents avoid repeating failed approaches.

### Step 1: Scaffold the game

Mark task 1 as `in_progress`.

**Main thread — infrastructure setup:**

1. Locate the plugin's template directory. Check these paths in order until found:
   - The agent's plugin cache (e.g. `~/.claude/plugins/cache/local-plugins/game-creator/1.0.0/templates/`)
   - The `templates/` directory relative to this plugin's install location
2. **Determine the target directory.** If the current working directory is the `game-creator` plugin repository (check for `CLAUDE.md` mentioning "game-creator" or `.claude-plugin/plugin.json`), create the game inside `examples/` (e.g., `examples/<game-name>/`). Otherwise, create it in the current working directory (`<game-name>/`).
3. Copy the entire template directory to the target:
   - 2D: copy `templates/phaser-2d/` → `<target-dir>/`
   - 3D: copy `templates/threejs-3d/` → `<target-dir>/`
3. Update `package.json` — set `"name"` to the game name
4. Update `<title>` in `index.html` to a human-readable version of the game name
5. **Verify Node.js/npm availability**: Run `node --version && npm --version` to confirm Node.js and npm are installed and accessible. If they fail (e.g., nvm lazy-loading), try sourcing nvm: `export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"` then retry. If Node.js is not installed at all, tell the user they need to install it before continuing.
6. Run `npm install` in the new project directory
7. **Install Playwright and Chromium** — Playwright is required for runtime verification and the iterate loop:
   1. Check if Playwright is available: `npx playwright --version`
   2. If that fails, check `node_modules/.bin/playwright --version`
   3. If neither works, run `npm install -D @playwright/test` explicitly
   4. Then install the browser binary: `npx playwright install chromium`
   5. Verify success; if it fails, warn and continue (build verification still works, but runtime/iterate checks will be skipped)
8. **Verify template scripts exist** — The template ships with `scripts/verify-runtime.mjs`, `scripts/iterate-client.js`, and `scripts/example-actions.json`. Confirm they are present. The `verify` and `iterate` npm scripts are already in `package.json` from the template.
9. **Start the dev server** — Before running `npm run dev`, check if the configured port (in `vite.config.js`) is already in use: `lsof -i :<port> -t`. If occupied, update `vite.config.js` to use the next available port (try 3001, 3002, etc.). Then start the dev server in the background and confirm it responds. Keep it running throughout the pipeline. Note the actual port number — pass it to `scripts/verify-runtime.mjs` via the `PORT` env variable in subsequent runs.

**Subagent — game implementation:**

Launch a `Task` subagent with these instructions:

> You are implementing Step 1 (Scaffold) of the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Engine**: `<2d|3d>`
> **Game concept**: `<user's game description>`
> **Skill to load**: `phaser` (2D) or `threejs-game` (3D)
>
> **Core loop first** — implement in this order:
> 1. Input (touch + keyboard from the start — never keyboard-only)
> 2. Player movement / core mechanic
> 3. Fail condition (death, collision, timer)
> 4. Scoring
> 5. Restart flow (GameState.reset() → clean slate)
>
> Keep scope small: **1 scene, 1 mechanic, 1 fail condition**. Wire spectacle EventBus hooks alongside the core loop — they are scaffolding, not polish.
>
> Transform the template into the game concept:
> - Rename entities, scenes/systems, and events to match the concept
> - Implement core gameplay mechanics
> - Wire up EventBus events, GameState fields, and Constants values
> - Ensure all modules communicate only through EventBus
> - All magic numbers go in Constants.js
> - **No title screen** — the template boots directly into gameplay. Do not create a MenuScene or title screen. Only add one if the user explicitly asks.
> - **No in-game score HUD** — the Play.fun widget displays score in a deadzone at the top of the game. Do not create a UIScene or HUD overlay for score display.
> - **Mobile-first input**: Choose the best mobile input scheme for the game concept (tap zones, virtual joystick, gyroscope tilt, swipe). Implement touch + keyboard from the start — never keyboard-only. Use the unified analog InputSystem pattern (moveX/moveZ) so game logic is input-source-agnostic.
> - **Force portrait for vertical games**: For dodgers, runners, collectors, and endless fallers, set `FORCE_PORTRAIT = true` in Constants.js. This locks portrait layout on desktop (pillarboxed with black bars via `Scale.FIT + CENTER_BOTH`). Use fixed design dimensions (540×960), not conditional `_isPortrait ? 540 : 960`.
> - **Visible touch indicators required**: Always render semi-transparent arrow buttons (or direction indicators) on touch-capable devices. Use capability detection (`('ontouchstart' in window) || (navigator.maxTouchPoints > 0)`), NOT OS detection (`device.os.android || device.os.iOS`). Enable pointer events (pointerdown/pointermove/pointerup) on ALL devices — never gate behind `isMobile`. Use `TOUCH` constants from Constants.js for sizing.
> - **Minimum 7–8% canvas width for collectibles/hazards**: Items smaller than 7% of `GAME.WIDTH` become unrecognizable blobs on phone screens. Size attacks at ~9%, power-ups at ~7%, player character at 12–15%.
> - Wire spectacle events: emit `SPECTACLE_ENTRANCE` in `create()`, `SPECTACLE_ACTION` on every player input, `SPECTACLE_HIT` on score/destroy, `SPECTACLE_COMBO` on consecutive hits (pass `{ combo }` ), `SPECTACLE_STREAK` at milestones (5, 10, 25 — pass `{ streak }`), `SPECTACLE_NEAR_MISS` on close calls
>
> **Visual identity — push the pose:**
> - If the player character represents a real person or brand, build visual recognition into the entity from the start. Don't use generic circles/rectangles as placeholders — use descriptive colors, proportions, and features that communicate identity even before pixel art is added.
> - Named opponents/NPCs must have visual presence on screen — never text-only. At minimum use distinct colored shapes that suggest the brand. Better: simple character forms with recognizable features.
> - Collectibles and hazards must be visually self-explanatory. Avoid abstract concepts ("imagination blocks", "creativity sparks"). Use concrete objects players instantly recognize (polaroids, trophies, lightning bolts, money bags, etc.).
> - Think: "Could someone screenshot this and immediately know what the game is about?"
> - **NEVER** use a single letter (C, G, O) as a character's visual identity
> - **NEVER** differentiate two characters only by fill color — they must have distinct silhouettes and features
> - When a company is featured (OpenAI, Anthropic, xAI, etc.), use the CEO as the character: Altman for OpenAI, Amodei for Anthropic, Musk for xAI, Zuckerberg for Meta, Nadella for Microsoft, Pichai for Google, Huang for NVIDIA
> - Add entrance sequence in `create()`: player starts off-screen, tweens into position with `Bounce.easeOut`, landing shake + particle burst
> - Add combo tracking to GameState: `combo` (current streak, resets on miss), `bestCombo` (session high), both reset in `reset()`
> - Ensure restart is clean — test mentally that 3 restarts in a row would work identically
> - Add `isMuted` to GameState for mute support
>
> **CRITICAL — Preserve the button pattern:**
> - The template's `GameOverScene.js` contains a working `createButton()` helper (Container + Graphics + Text). **Do NOT rewrite this method.** Keep it intact or copy it into any new scenes that need buttons. The correct z-order is: Graphics first (background), Text second (label), Container interactive. If you put Graphics on top of Text, the text becomes invisible. If you make the Graphics interactive instead of the Container, hover/press states break.
>
> **Character & entity sizing:**
> - Character WIDTH from `GAME.WIDTH * ratio`, HEIGHT from `WIDTH * SPRITE_ASPECT` (where `const SPRITE_ASPECT = 1.5` for 200×300 spritesheets). **Never** define character HEIGHT as `GAME.HEIGHT * ratio` — on mobile portrait, `GAME.HEIGHT` is much larger than `GAME.WIDTH`, squishing characters.
> - For character-driven games (named personalities, mascots, famous figures): make the main character prominent — `GAME.WIDTH * 0.12` to `GAME.WIDTH * 0.15` (12–15% of screen width). Use caricature proportions (large head = 40–50% of sprite height, exaggerate distinguishing features) for personality games.
> - Non-character entities (projectiles, collectibles, squares) can use `GAME.WIDTH * ratio` for both dimensions since they have no intrinsic aspect ratio to preserve.
>
> **Play.fun safe zone:**
> - Import `SAFE_ZONE` from `Constants.js`. All UI text, buttons, and interactive elements (title text, score panels, restart buttons) must be positioned below `SAFE_ZONE.TOP`. The Play.fun SDK renders a 75px widget bar at the top of the viewport (z-index 9999). Use `safeTop + usableH * ratio` for proportional positioning within the usable area (where `usableH = GAME.HEIGHT - SAFE_ZONE.TOP`).
>
> **Generate game-specific test actions:**
> After implementing the core loop, overwrite `scripts/example-actions.json` with actions tailored to this game. Requirements:
> - Use the game's actual input keys (e.g., ArrowLeft/ArrowRight for dodger, space for flappy, w/a/s/d for top-down)
> - Include enough gameplay to score at least 1 point
> - Include a long idle period (60+ frames with no input) to let the fail condition trigger
> - Total should be at least 150 frames of gameplay
>
> Example for a dodge game (arrow keys):
> ```json
> [
>   {"buttons":["ArrowRight"],"frames":20},
>   {"buttons":["ArrowLeft"],"frames":20},
>   {"buttons":["ArrowRight"],"frames":15},
>   {"buttons":[],"frames":10},
>   {"buttons":["ArrowLeft"],"frames":20},
>   {"buttons":[],"frames":80}
> ]
> ```
>
> Example for a platformer (space to jump):
> ```json
> [
>   {"buttons":["space"],"frames":4},
>   {"buttons":[],"frames":25},
>   {"buttons":["space"],"frames":4},
>   {"buttons":[],"frames":25},
>   {"buttons":["space"],"frames":4},
>   {"buttons":[],"frames":80}
> ]
> ```
>
> Before returning, write `<project-dir>/design-brief.md`:
> ```
> # Design Brief
> ## Concept
> One-line game concept.
> ## Core Mechanics
> For each mechanic:
> - **Name**: what it does
> - **State field**: which GameState field it affects
> - **Expected magnitude**: how much/fast it should change (e.g., "reaches 50-70% of max within the round duration without player input")
> ## Win/Lose Conditions
> - How the player wins
> - How the player loses
> - Confirm both outcomes are realistically achievable with the current Constants.js values
> ## Entity Interactions
> For each visible entity (enemies, projectiles, collectibles, environmental objects):
> - **Name**: what it is
> - **Visual identity**: what it should LOOK like and why (reference real logos, people, objects — not abstract concepts)
> - **Distinguishing feature**: the ONE exaggerated feature visible at thumbnail size (e.g., "curly dark hair + glasses" for Amodei, "leather jacket" for Jensen Huang)
> - **Real image asset**: logo URL to download, or "pixel art" if no real image applies
> - **Behavior**: what it does (moves, falls, spawns, etc.)
> - **Player interaction**: how the player interacts with it (dodge, collect, tap, block, or "none — background/decoration")
> - **AI/opponent interaction**: how the opponent interacts with it, if applicable
>
> For named people: describe hair, glasses, facial hair, clothing. For companies: specify logo to download. NEVER use a letter or text label as visual identity.
>
> ## Expression Map
>
> For each personality character, map game events to expressions:
>
> ### Player: [Name]
> | Game Event | Expression | Why |
> |---|---|---|
> | Idle/default | normal | Resting state |
> | Score point / collect item | happy | Positive reinforcement |
> | Take damage / lose life | angry | Visceral reaction |
> | Power-up / special event | surprised | Excitement |
> | Win / game over (high score) | happy | Celebration |
> | Lose / game over (low score) | angry | Defeat |
>
> ### Opponent: [Name]
> | Game Event | Expression | Why |
> |---|---|---|
> | Idle/default | normal | Resting state |
> | Player scores | angry | Frustrated at losing |
> | Opponent scores | happy | Gloating |
> | Near-miss / close call | surprised | Tension |
> ```
>
> Do NOT start a dev server or run builds — the orchestrator handles that.

**After subagent returns**, run the Verification Protocol.

**Create `progress.md`** at the game's project root. Read the game's actual source files to populate it accurately:
- Read `src/core/EventBus.js` for the event list
- Read `src/core/Constants.js` for the key sections (GAME, PLAYER, ENEMY, etc.)
- List files in `src/entities/` for entity names
- Read `src/core/GameState.js` for state fields

Write `progress.md` with this structure:

```markdown
# Progress

## Game Concept
- **Name**: [game name from project]
- **Engine**: Phaser 3 / Three.js
- **Description**: [from user's original prompt]

## Step 1: Scaffold
- **Entities**: [list entity names from src/entities/]
- **Events**: [list event names from EventBus.js]
- **Constants keys**: [top-level sections from Constants.js, e.g. GAME, PLAYER, ENEMY, COLORS]
- **Scoring system**: [how points are earned, from GameState + scene logic]
- **Fail condition**: [what ends the game]
- **Input scheme**: [keyboard/mouse/touch controls implemented]

## Decisions / Known Issues
- [any notable decisions or issues from scaffolding]
```

**Tell the user:**
> Your game is scaffolded and running! Here's how it's organized:
> - `src/core/Constants.js` — all game settings (speed, colors, sizes)
> - `src/core/EventBus.js` — how parts of the game talk to each other
> - `src/core/GameState.js` — tracks score, lives, etc.
> - **Mobile controls are built in** — works on phone (touch/tilt) and desktop (keyboard)
>
> **Next up: pixel art.** I'll create custom pixel art sprites for every character, enemy, item, and background tile — all generated as code, no image files needed. Then I'll add visual polish on top.

Mark task 1 as `completed`.

**Wait for user confirmation before proceeding.**

### Step 1.5: Add game assets

**Always run this step for both 2D and 3D games.** 2D games get pixel art sprites; 3D games get GLB models and animated characters.

Mark task 2 as `in_progress`.

**Pre-step: Character Library Check**

Before launching the asset subagent, check if the game uses personality characters. For each personality, resolve their sprites using this **tiered fallback** (try each tier in order, stop at the first success):

**1. Read `design-brief.md`** to identify personality characters and their slugs.

**2. Resolve the character library path** — find `character-library/manifest.json` relative to the plugin root:
   - Check `character-library/manifest.json` relative to the plugin install directory
   - Check common plugin cache paths (e.g., `~/.claude/plugins/cache/local-plugins/game-creator/*/character-library/`)

**3. For each personality, try these tiers in order:**

**Tier 1 — Pre-built (best)**: Check if slug exists in `manifest.json`. If yes, copy sprites:
```bash
mkdir -p <project-dir>/public/assets/characters/<slug>/
cp <plugin-root>/character-library/characters/<slug>/sprites/* \
   <project-dir>/public/assets/characters/<slug>/
```
Result: 4-expression spritesheet ready. Done.

**Tier 2 — Build from 4 images (good)**: WebSearch for 4 expression photos. **Any photo format works** (jpg, png, webp) — the pipeline has ML background removal built in, so transparent PNGs are NOT required. Search broadly:
- normal: `"<Name> portrait photo"` or `"<Name> face"` — neutral expression
- happy: `"<Name> smiling"` or `"<Name> laughing"`
- angry: `"<Name> angry"` or `"<Name> serious stern"`
- surprised: `"<Name> surprised"` or `"<Name> shocked"`

Prefer real photographs (not illustrations/cartoons). Head shots and half-body shots both work — `crop-head.mjs` uses face detection to isolate the face automatically. Download as `normal.jpg`, `happy.jpg`, etc. (any image extension).

If all 4 found, download to `<project-dir>/public/assets/characters/<slug>/raw/` and run:
```bash
node <plugin-root>/scripts/build-character.mjs "<Name>" \
  <project-dir>/public/assets/characters/<slug>/ --skip-find
```
Result: 4-expression spritesheet. Done.

**Tier 3 — Build from 1-3 images (acceptable)**: If WebSearch only finds 1-3 usable images:
- Download whatever was found to `raw/` (e.g., only `normal.png` and `happy.png`)
- **Duplicate the best image** (prefer normal) into the missing expression slots:
  ```bash
  cp raw/normal.png raw/angry.png    # fill missing with normal
  cp raw/normal.png raw/surprised.png
  ```
- Run `build-character.mjs` as above — all 4 raw slots are filled, pipeline produces a 4-frame spritesheet
- Result: 4-frame spritesheet where some expressions share the same face. Functional — the expression system still works, just with less visual variety.

**Tier 4 — Single image fallback (minimum)**: If WebSearch finds exactly 1 image OR the pipeline fails on some images:
- Use the single successful image for all 4 expression slots
- Run `build-character.mjs` — produces a spritesheet where all 4 frames are identical
- Result: Character is recognizable but has no expression changes. Still photo-composite, still works with the expression wiring (just no visible change).

**Tier 5 — Generative pixel art (worst case)**: If NO images can be found or the ENTIRE pipeline fails (bg removal crash, face detection fails on all images, network errors):
- Fall back to the **Personality Character (Caricature) archetype** from the `game-assets` skill — 32x48 pixel art grid at scale 4
- Note in `progress.md`: `"<Name>: pixel art fallback — no photo-composite available"`
- The subagent will create pixel art with recognizable features (hair, glasses, clothing) per the game-assets sprite design rules
- Result: No photo-composite, but the character is still visually distinct via pixel art caricature.

**4. Record results** for each character in `progress.md`:
```
## Characters
- trump: Tier 1 (pre-built, 4 expressions)
- karpathy: Tier 3 (1 image found, duplicated to 4 slots)
- some-ceo: Tier 5 (pixel art fallback)
```

**5. Pass to subagent**: the list of character slugs, which tier each resolved to, and how many unique expressions each has. The subagent needs this to know whether to wire full expression changes or skip expression logic for Tier 5 characters.

Launch a `Task` subagent with these instructions:

> You are implementing Step 1.5 (Pixel Art Sprites) of the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Engine**: 2D (Phaser 3)
> **Skill to load**: `game-assets`
>
> **Read `progress.md`** at the project root before starting. It describes the game's entities, events, constants, and scoring system from Step 1.
>
> **Character library sprites are already copied** to `public/assets/characters/<slug>/`. For personality characters, load the spritesheet and wire expression changes per the game-assets skill's "Expression Wiring Pattern". Add `EXPRESSION` and `EXPRESSION_HOLD_MS` to Constants.js. Wire expression changes to EventBus events per the Expression Map in `design-brief.md`.
>
> Follow the game-assets skill fully for non-personality entities:
> 1. Read all entity files (`src/entities/`) to find `generateTexture()` / `fillCircle()` calls
> 2. Choose the palette that matches the game's theme (DARK, BRIGHT, or RETRO)
> 3. Create `src/core/PixelRenderer.js` — the `renderPixelArt()` + `renderSpriteSheet()` utilities
> 4. Create `src/sprites/palette.js` with the chosen palette
> 5. Create sprite data files (`player.js`, `enemies.js`, `items.js`, `projectiles.js`) with pixel matrices
> 6. Create `src/sprites/tiles.js` with background tiles (ground variants, decorative elements)
> 7. Create or update the background system to use tiled pixel art instead of flat colors/grids
> 8. Update entity constructors to use pixel art instead of geometric shapes
> 9. Add Phaser animations for entities with multiple frames
> 10. Adjust physics bodies for new sprite dimensions
>
> **Character prominence**: If the game features a real person or named personality, use the Personality Character (Caricature) archetype — 32x48 grid at scale 4 (renders to 128x192px, ~35% of canvas height). The character must be the visually dominant element on screen. Supporting entities stay at Medium (16x16) or Small (12x12) to create clear visual hierarchy.
>
> **Push the pose — thematic expressiveness:**
> - Sprites must visually embody who/what they represent. A sprite for "Grok AI" should look like Grok (logo features, brand colors, xAI aesthetic) — not a generic robot or colored circle.
> - For real people: exaggerate their most recognizable features (signature hairstyle, glasses, facial hair, clothing). Recognition IS the meme hook.
> - For brands/products: incorporate logo shapes, brand colors, and distinctive visual elements into the sprite design.
> - For game objects: make them instantly recognizable. A "power-up" should look like the specific thing it represents in the theme, not a generic star or diamond.
> - Opponents should be visually distinct from each other — different colors, shapes, sizes, and personality. A player should tell them apart at a glance.
>
> **Self-audit before returning** — check every personality sprite against these:
> - Does each sprite have distinct hair (not a solid-color dome)?
> - Does each sprite have facial features beyond just eyes (glasses, facial hair, or clothing details if applicable)?
> - Would two character sprites look different if rendered in the same color?
> - Is any `scene.add.text()` being used as the primary identifier? If so, remove it and add physical features instead.
> - Does the head region (rows 0-28) use at least 4 distinct palette indices?
> - For brand entities: was a real logo downloaded and loaded? If not, why?
>
> **After completing your work**, append a `## Step 1.5: Assets` section to `progress.md` with: palette used, sprites created, any dimension changes to entities.
>
> Do NOT run builds — the orchestrator handles verification.

**After 2D subagent returns**, run the Verification Protocol.

---

#### 3D Asset Flow (Three.js games)

For 3D games, generate custom models with Meshy AI and integrate them as animated characters and world props. This is the 3D parallel of the 2D pixel art step above.

**Pre-step: Character & Asset Generation**

The Meshy API key should already be obtained in Step 0. If not set, ask now (see Step 0 instructions).

1. **Read `design-brief.md`** to identify all characters (player + opponents/NPCs) and their names/descriptions.

2. **For EACH humanoid character, run the full generate→rig pipeline as ONE atomic step:**

**Tier 1 — Generate + Rig with Meshy AI** (preferred): This is a TWO-command chain — always run BOTH for humanoid characters. The rig step auto-downloads walk/run animation GLBs.
```bash
# Step A: Generate the character model
MESHY_API_KEY=<key> node <plugin-root>/scripts/meshy-generate.mjs \
  --mode text-to-3d \
  --prompt "a stylized <character description>, low poly game character, full body" \
  --polycount 15000 --pbr \
  --output <project-dir>/public/assets/models/ --slug <character-slug>

# Step B: Read the refineTaskId from meta, then rig immediately
# The rig command auto-downloads walk/run GLBs as <slug>-walk.glb and <slug>-run.glb
REFINE_ID=$(python3 -c "import json; print(json.load(open('<project-dir>/public/assets/models/<character-slug>.meta.json'))['refineTaskId'])")
MESHY_API_KEY=<key> node <plugin-root>/scripts/meshy-generate.mjs \
  --mode rig --task-id $REFINE_ID --height 1.7 \
  --output <project-dir>/public/assets/models/ --slug <character-slug>
```

After this completes you have 3 files per character:
- `<slug>.glb` — rigged model with skeleton (use `loadAnimatedModel()` + `SkeletonUtils.clone()`)
- `<slug>-walk.glb` — walking animation (auto-downloaded)
- `<slug>-run.glb` — running animation (auto-downloaded)

**NEVER generate humanoid characters without rigging.** Static models require hacky programmatic animation that looks artificial.

For named personalities, be specific: `"a cartoon caricature of Trump, blonde hair, suit, red tie, low poly game character, full body"`.

For multiple characters, generate each with a distinct description for visual variety. Run generate→rig in parallel for different characters to save time.

**Tier 2 — Pre-built in `3d-character-library/`** (Meshy unavailable): Check `manifest.json` for a name/theme match. Copy the GLB:
```bash
cp <plugin-root>/3d-character-library/models/<model>.glb \
   <project-dir>/public/assets/models/<slug>.glb
```

**Tier 3 — Search Sketchfab**: Use `find-3d-asset.mjs` to search for a matching animated model:
```bash
node <plugin-root>/scripts/find-3d-asset.mjs \
  --query "<character name> animated character" \
  --max-faces 10000 --list-only
```

**Tier 4 — Generic library fallback**: Use the best match from `3d-character-library/`:
- **Soldier** — action/military/default human
- **Xbot** — sci-fi/tech/futuristic
- **RobotExpressive** — cartoon/casual/fun (most animations)
- **Fox** — nature/animal

When 2+ characters fall back to library, use different models to differentiate them.

**3. Generate / search for world objects** — Read `design-brief.md` entity list:
```bash
# With Meshy (preferred) — generate each prop
MESHY_API_KEY=<key> node <plugin-root>/scripts/meshy-generate.mjs \
  --mode text-to-3d \
  --prompt "a <entity description>, low poly game asset" \
  --polycount 5000 \
  --output <project-dir>/public/assets/models/ --slug <entity-slug>

# Without Meshy — search free libraries
node <plugin-root>/scripts/find-3d-asset.mjs --query "<entity description>" \
  --source polyhaven --output <project-dir>/public/assets/models/
```

**4. Record results** in `progress.md`:
```
## 3D Characters
- knight (player): Tier 1 — Meshy AI generated + rigged (idle/walk/run)
- goblin (enemy): Tier 1 — Meshy AI generated + rigged (idle/walk/run)

## 3D Assets
- tree: Meshy AI generated (static prop)
- barrel: Meshy AI generated (static prop)
- house: Poly Haven fallback (CC0)
```

**Launch a `Task` subagent with these instructions:**

> You are implementing Step 1.5 (3D Assets) of the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Engine**: 3D (Three.js)
> **Skill to load**: `game-3d-assets` and `meshyai`
>
> **Read `progress.md`** at the project root before starting. It lists generated/downloaded models and the character details.
>
> **Rigged character GLBs + animation GLBs are already in** `public/assets/models/`. Set up the character controller:
>
> 1. Create `src/level/AssetLoader.js` — **CRITICAL: use `SkeletonUtils.clone()` for rigged models** (regular `.clone()` breaks skeleton bindings → T-pose). Import from `three/addons/utils/SkeletonUtils.js`.
> 2. Add `MODELS` config to `Constants.js` with: `path` (rigged GLB), `walkPath`, `runPath`, `scale`, `rotationY` per model. **Start with `rotationY: Math.PI`** — most Meshy models face +Z and need flipping.
> 3. For each rigged model:
>    - Load with `loadAnimatedModel()`, create `AnimationMixer`
>    - Load walk/run animation GLBs separately, register their clips as mixer actions
>    - Log all clip names: `console.log('Clips:', clips.map(c => c.name))`
>    - Store mixer and actions in entity's `userData`
>    - Call `mixer.update(delta)` every frame
>    - Use `fadeToAction()` pattern for smooth transitions
> 4. For static models (ring, props): use `loadModel()` (regular clone)
> 5. **Orientation & scale verification (MANDATORY):**
>    - After loading each model, log its bounding box size
>    - Compute auto-scale to fit target height and container bounds
>    - Align feet to floor: `position.y = -box.min.y`
>    - **Characters must face each other / the correct direction** — adjust `rotationY` in Constants
>    - **Characters must fit inside their environment** (ring, arena, platform)
>    - Position characters close enough to interact (punch range, not across the arena)
> 6. Add primitive fallback in `.catch()` for every model load
>
> **After completing your work**, append a `## Step 1.5: 3D Assets` section to `progress.md` with: models used (Meshy-generated vs library), scale/orientation adjustments, verified facing directions.
>
> Do NOT run builds — the orchestrator handles verification.

**After 3D subagent returns**, run the Verification Protocol.

---

**Tell the user (2D):**
> Your game now has pixel art sprites and backgrounds! Every character, enemy, item, and background tile has a distinct visual identity. Here's what was created:
> - `src/core/PixelRenderer.js` — rendering engine
> - `src/sprites/` — all sprite data, palettes, and background tiles

**Tell the user (3D):**
> Your game now has custom 3D models! Characters were generated with Meshy AI (or sourced from the model library), rigged, and animated with walk/run/idle. Props and scenery are loaded from GLB files. Here's what was created:
> - `src/level/AssetLoader.js` — model loader with SkeletonUtils
> - `public/assets/models/` — Meshy-generated and/or library GLB models
> - OrbitControls camera with WASD movement

> **Next up: visual polish.** I'll add particles, screen transitions, and juice effects. Ready?

Mark task 2 as `completed`.

**Wait for user confirmation before proceeding.**

### Step 2: Design the visuals

Mark task 3 as `in_progress`.

Launch a `Task` subagent with these instructions:

> You are implementing Step 2 (Visual Design — Spectacle-First) of the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Engine**: `<2d|3d>`
> **Skill to load**: `game-designer`
>
> **Read `progress.md`** at the project root before starting. It describes the game's entities, events, constants, and what previous steps have done.
>
> Apply the game-designer skill with spectacle as the top priority. Work in this order:
>
> **1. Opening Moment (CRITICAL — this determines promo clip success):**
> - Entrance flash: `cameras.main.flash(300)` on scene start
> - Player slam-in: player starts off-screen, tweens in with `Bounce.easeOut`, landing shake (0.012) + particle burst (20 particles)
> - Ambient particles active from frame 1 (drifting motes, dust, sparkles)
> - Optional flavor text (e.g., "GO!", "DODGE!") — only when it naturally fits the game's vibe
> - Verify: the first 3 seconds have zero static frames
>
> **2. Every-Action Effects (wire to SPECTACLE_* events from Step 1):**
> - Particle burst (12-20 particles) on `SPECTACLE_ACTION` and `SPECTACLE_HIT`
> - Floating score text (28px, scale 1.8, `Elastic.easeOut`) on `SCORE_CHANGED`
> - Background pulse (additive blend, alpha 0.15) on `SCORE_CHANGED`
> - Persistent player trail (particle emitter following player, `blendMode: ADD`)
> - Screen shake (0.008-0.015) on hits
>
> **3. Combo & Streak System (wire to SPECTACLE_COMBO / SPECTACLE_STREAK):**
> - Combo counter text that scales with combo count (32px base, +4px per combo)
> - Streak milestone announcements at 5x, 10x, 25x (full-screen text slam + 40-particle burst)
> - Hit freeze frame (60ms physics pause) on destruction events
> - Shake intensity scales with combo (0.008 + combo * 0.002, capped at 0.025)
>
> **4. Standard Design Audit:**
> - Full 10-area audit (background, palette, animations, particles, transitions, typography, game feel, game over, character prominence, first impression / viral appeal)
> - **Every area must score 4 or higher** — improve any that fall below
> - First Impression / Viral Appeal is the most critical category
>
> **5. Intensity Calibration:**
> - Particle bursts: 12-30 per event (never fewer than 10)
> - Screen shake: 0.008 (light) to 0.025 (heavy)
> - Floating text: 28px minimum, starting scale 1.8
> - Flash overlays: alpha 0.3-0.5
> - All new values go in Constants.js, use EventBus for triggering effects
> - Don't alter gameplay mechanics
>
> **After completing your work**, append a `## Step 2: Design` section to `progress.md` with: improvements applied, new effects added, any color or layout changes.
>
> Do NOT run builds — the orchestrator handles verification.

**After subagent returns**, run the Verification Protocol.

**Tell the user:**
> Your game looks much better now! Here's what changed: [summarize changes]
>
> **Next up: promo video.** I'll autonomously record a 50 FPS gameplay clip in mobile portrait — ready for social media. Then we'll add music and sound effects.

Mark task 3 as `completed`.

**Proceed directly to Step 2.5** — no user confirmation needed (promo video is non-destructive and fast).

### Step 2.5: Record promo video

Mark task 4 as `in_progress`.

**This step stays in the main thread.** It does not modify game code — it records autonomous gameplay footage using Playwright and converts it with FFmpeg. No QA verification needed.

**Pre-check: FFmpeg availability**

```bash
ffmpeg -version | head -1
```

If FFmpeg is not found, warn the user and skip this step:
> FFmpeg is not installed. Skipping promo video. Install it with `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux), then run `/game-creator:promo-video` later.

Mark task 4 as `completed` and proceed to Step 3.

**Copy the conversion script** from the plugin:

```bash
cp <plugin-root>/skills/promo-video/scripts/convert-highfps.sh <project-dir>/scripts/
chmod +x <project-dir>/scripts/convert-highfps.sh
```

**Launch a `Task` subagent** to generate the game-specific capture script:

> You are implementing Step 2.5 (Promo Video) of the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Dev server port**: `<port>`
> **Skill to load**: `promo-video`
>
> **Read `progress.md`** and the following source files to understand the game:
> - `src/scenes/GameScene.js` — find the death/failure method(s) to patch out
> - `src/core/EventBus.js` — understand event flow
> - `src/core/Constants.js` — check input keys, game dimensions
> - `src/main.js` — verify `__GAME__` and `__GAME_STATE__` are exposed
>
> **Create `scripts/capture-promo.mjs`** following the `promo-video` skill template. You MUST adapt these game-specific parts:
>
> 1. **Death patching** — identify ALL code paths that lead to game over and monkey-patch them. Search for `triggerGameOver`, `gameOver`, `takeDamage`, `playerDied`, `onPlayerHit`, or any method that sets `gameState.gameOver = true`. Patch every one.
>
> 2. **Input sequence** — determine the actual input keys from the game's input handling (look for `createCursorKeys()`, `addKeys()`, `input.on('pointerdown')`, etc.). Generate a `generateInputSequence(totalMs)` function that produces natural-looking gameplay for this specific game type:
>    - **Dodger** (left/right): Alternating holds with variable timing, occasional double-taps
>    - **Platformer** (jump): Rhythmic taps with varying gaps
>    - **Shooter** (move + fire): Interleaved movement and fire inputs
>    - **Top-down** (WASD): Figure-eight or sweep patterns
>
> 3. **Entrance pause** — include a 1-2s pause at the start so the entrance animation plays (this is the visual hook).
>
> 4. **Viewport** — always `{ width: 1080, height: 1920 }` (9:16 mobile portrait) unless the game is desktop-only landscape.
>
> 5. **Duration** — 13s of game-time by default. For slower-paced games (puzzle, strategy), use 8-10s.
>
> **Config**: The script must accept `--port`, `--duration`, and `--output-dir` CLI args with sensible defaults.
>
> **Do NOT run the capture** — just create the script. The orchestrator runs it.

**After subagent returns**, run the capture and conversion from the main thread:

```bash
# Ensure output directory exists
mkdir -p <project-dir>/output

# Run capture (takes ~26s for 13s game-time at 0.5x)
node scripts/capture-promo.mjs --port <port>

# Convert to 50 FPS MP4
bash scripts/convert-highfps.sh output/promo-raw.webm output/promo.mp4 0.5
```

**Verify the output:**
1. Check `output/promo.mp4` exists and is non-empty
2. Verify duration is approximately `DESIRED_GAME_DURATION / 1000` seconds
3. Verify frame rate is 50 FPS

If capture fails (Playwright error, timeout, etc.), warn the user and skip — the promo video is a nice-to-have, not a blocker.

**Extract a thumbnail** for the user to preview:
```bash
ffmpeg -y -ss 5 -i output/promo.mp4 -frames:v 1 -update 1 output/promo-thumbnail.jpg
```

Read the thumbnail image and show it to the user.

**Tell the user:**
> Promo video recorded! 50 FPS, mobile portrait (1080x1920).
>
> **File**: `output/promo.mp4` ([duration]s, [size])
>
> This was captured autonomously — the game ran at 0.5x, recorded at 25 FPS, then FFmpeg sped it up to 50 FPS. Death was patched out so it shows continuous gameplay.
>
> **Next up: music and sound effects.** Ready?

Mark task 4 as `completed`.

**Wait for user confirmation before proceeding.**

### Step 3: Add audio

Mark task 5 as `in_progress`.

Launch a `Task` subagent with these instructions:

> You are implementing Step 3 (Audio) of the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Engine**: `<2d|3d>`
> **Skill to load**: `game-audio`
>
> **Read `progress.md`** at the project root before starting. It describes the game's entities, events, constants, and what previous steps have done.
>
> Apply the game-audio skill:
> 1. Audit the game: read EventBus events, read all scenes
> 2. Create `src/audio/AudioManager.js` — AudioContext init, master gain, BGM sequencer play/stop
> 3. Create `src/audio/music.js` — BGM patterns as note arrays using the Web Audio step sequencer
> 4. Create `src/audio/sfx.js` — SFX using Web Audio API (OscillatorNode + GainNode + BiquadFilterNode)
> 5. Create `src/audio/AudioBridge.js` — wire EventBus events to audio
> 6. Add audio events to EventBus.js (including `AUDIO_TOGGLE_MUTE`)
> 7. Wire audio into main.js and all scenes
> 8. **Mute toggle**: Wire `AUDIO_TOGGLE_MUTE` to master gain. Add M key shortcut and a speaker icon UI button. See the game-audio skill "Mute Button" section for requirements and drawing code.
> 9. **No npm packages needed** — all audio uses the built-in Web Audio API
>
> **After completing your work**, append a `## Step 3: Audio` section to `progress.md` with: BGM patterns added, SFX event mappings, mute wiring confirmation.
>
> Do NOT run builds — the orchestrator handles verification.

**After subagent returns**, run the Verification Protocol.

**Tell the user:**
> Your game now has music and sound effects! Click/tap once to activate audio, then you'll hear the music.
>
> **Next up: deploy to the web.** I'll publish your game to here.now for an instant public URL. Ready?

Mark task 5 as `completed`.

**Wait for user confirmation before proceeding.**

### Step 4: Deploy to here.now

Mark task 6 as `in_progress`.

Load the game-deploy skill. **This step stays in the main thread** because it may require user back-and-forth for API key setup.

#### 6a. Check prerequisites

Verify the here-now skill is installed:

```bash
ls ~/.agents/skills/here-now/scripts/publish.sh
```

**If not found**, tell the user:
> The here-now skill is needed for deployment. Install it with:
> ```
> npx skills add heredotnow/skill --skill here-now -g -y
> ```
> Tell me when you're ready.

**Wait for the user to confirm.**

#### 6b. Build the game

```bash
npm run build
```

Verify `dist/` exists and contains `index.html` and assets. If the build fails, fix the errors before proceeding.

#### 6c. Verify the Vite base path

Read `vite.config.js`. For here.now, the `base` should be `'/'` (the default). If it's set to something else (e.g., a GitHub Pages subdirectory path), update it:

```js
export default defineConfig({
  base: '/',
  // ... rest of config
});
```

Rebuild after changing the base path.

#### 6d. Publish to here.now

```bash
~/.agents/skills/here-now/scripts/publish.sh dist/
```

The script outputs the live URL immediately (e.g., `https://<slug>.here.now/`).

Read and follow `publish_result.*` lines from script stderr. Save the slug for future updates.

**If anonymous (no API key):** The publish expires in **24 hours and will be permanently deleted** unless the user claims it. The script returns a claim URL. **You MUST immediately tell the user:**

> **ACTION REQUIRED — your game will be deleted in 24 hours!**
> Visit your claim URL to create a free here.now account and keep your game online permanently.
> The claim token is only shown once and cannot be recovered. Do this now before you forget!

Then proceed to 6e to help them set up permanent hosting.

**If authenticated:** The publish is permanent. Skip 6e.

#### 6e. Set up permanent hosting

**This step is strongly recommended for anonymous publishes.** Help the user create a here.now account so their game stays online:

1. Ask for their email
2. Send magic link:
   ```bash
   curl -sS https://here.now/api/auth/login -H "content-type: application/json" -d '{"email": "user@example.com"}'
   ```
3. Tell the user: "Check your inbox for a sign-in link from here.now. Click it, then copy your API key from the dashboard."
4. Save the key:
   ```bash
   mkdir -p ~/.herenow && echo "<API_KEY>" > ~/.herenow/credentials && chmod 600 ~/.herenow/credentials
   ```
5. Re-publish to make it permanent:
   ```bash
   ~/.agents/skills/here-now/scripts/publish.sh dist/ --slug <slug>
   ```

#### 6f. Verify the deployment

```bash
curl -s -o /dev/null -w "%{http_code}" "https://<slug>.here.now/"
```

Should return 200 immediately (here.now deploys are instant).

#### 6g. Add deploy script

Add a `deploy` script to `package.json` so future deploys are one command:

```json
{
  "scripts": {
    "deploy": "npm run build && ~/.agents/skills/here-now/scripts/publish.sh dist/"
  }
}
```

**Tell the user (if authenticated):**
> Your game is live!
>
> **URL**: `https://<slug>.here.now/`
>
> **Redeploy after changes**: Just run:
> ```
> npm run deploy
> ```
> Or if you're working with me, I'll rebuild and redeploy for you.
>
> **Next up: monetization.** I'll register your game on Play.fun (OpenGameProtocol), add the points SDK, and redeploy. Players earn rewards, you get a play.fun URL to share on Moltbook. Ready?

**Tell the user (if anonymous — no API key):**
> Your game is live!
>
> **URL**: `https://<slug>.here.now/`
>
> **IMPORTANT: Your game will be deleted in 24 hours unless you claim it!**
> Visit your claim URL to create a free here.now account and keep your game online forever.
> The claim token is only shown once — save it now!
>
> **Redeploy after changes**: Just run:
> ```
> npm run deploy
> ```
>
> **Next up: monetization.** I'll register your game on Play.fun (OpenGameProtocol), add the points SDK, and redeploy. Players earn rewards, you get a play.fun URL to share on Moltbook. Ready?

Mark task 6 as `completed`.

**Wait for user confirmation before proceeding.**

### Step 5: Monetize with Play.fun

Mark task 7 as `in_progress`.

**This step stays in the main thread** because it requires interactive authentication.

#### 7a. Authenticate with Play.fun

Check if the user already has Play.fun credentials. The auth script is bundled with the plugin:

```bash
node skills/playdotfun/scripts/playfun-auth.js status
```

**If credentials exist**, skip to 7b.

**If no credentials**, start the auth callback server:

```bash
node skills/playdotfun/scripts/playfun-auth.js callback &
```

Tell the user:

> To register your game on Play.fun, you need to log in once.
> Open this URL in your browser:
> **https://app.play.fun/skills-auth?callback=http://localhost:9876/callback**
>
> Log in with your Play.fun account. Credentials are saved locally.
> Tell me when you're done.

**Wait for user confirmation.** Then verify with `playfun-auth.js status`.

If callback fails, offer manual method as fallback.

#### 7b. Register the game on Play.fun

Determine the deployed game URL from Step 6 (e.g., `https://<slug>.here.now/` or `https://<username>.github.io/<game-name>/`).

Read `package.json` for the game name and description. Read `src/core/Constants.js` to determine reasonable anti-cheat limits based on the scoring system.

Use the Play.fun API to register the game. Load the `playdotfun` skill for API reference. Register via `POST https://api.play.fun/games`:

```json
{
  "name": "<game-name>",
  "description": "<game-description>",
  "gameUrl": "<deployed-url>",
  "platform": "web",
  "isHTMLGame": true,
  "iframable": true,
  "maxScorePerSession": <based on game scoring>,
  "maxSessionsPerDay": 50,
  "maxCumulativePointsPerDay": <reasonable daily cap>
}
```

**Anti-cheat guidelines:**
- Casual clicker/idle: `maxScorePerSession: 100-500`
- Skill-based arcade (flappy bird, runners): `maxScorePerSession: 500-2000`
- Competitive/complex: `maxScorePerSession: 1000-5000`

Save the returned **game UUID**.

#### 7c. Add the Play.fun Browser SDK

First, extract the user's API key from stored credentials:

```bash
# Read API key from agent config (stored by playfun-auth.js)
# Example path for Claude Code — adapt for your agent
API_KEY=$(cat ~/.claude.json | jq -r '.mcpServers["play-fun"].headers["x-api-key"]')
echo "User API Key: $API_KEY"
```

If no API key is found, prompt the user to authenticate first.

Then add the SDK script and meta tag to `index.html` before `</head>`, substituting the actual API key:

```html
<meta name="x-ogp-key" content="<USER_API_KEY>" />
<script src="https://sdk.play.fun/latest"></script>
```

**Important**: The `x-ogp-key` meta tag must contain the **user's Play.fun API key** (not the game ID). Do NOT leave the placeholder — always substitute the actual key extracted above.

Create `src/playfun.js` that wires the game's EventBus to Play.fun points tracking:

```js
// src/playfun.js — Play.fun (OpenGameProtocol) integration
import { eventBus, Events } from './core/EventBus.js';

const GAME_ID = '<game-uuid>';
let sdk = null;
let initialized = false;

export async function initPlayFun() {
  const SDKClass = typeof PlayFunSDK !== 'undefined' ? PlayFunSDK
    : typeof OpenGameSDK !== 'undefined' ? OpenGameSDK : null;
  if (!SDKClass) {
    console.warn('Play.fun SDK not loaded');
    return;
  }
  sdk = new SDKClass({ gameId: GAME_ID, ui: { usePointsWidget: true } });
  await sdk.init();
  initialized = true;

  // addPoints() — call frequently during gameplay to buffer points locally (non-blocking)
  eventBus.on(Events.SCORE_CHANGED, ({ score, delta }) => {
    if (initialized && delta > 0) sdk.addPoints(delta);
  });

  // savePoints() — ONLY call at natural break points (game over, level complete)
  // WARNING: savePoints() opens a BLOCKING MODAL — never call during active gameplay!
  eventBus.on(Events.GAME_OVER, () => { if (initialized) sdk.savePoints(); });

  // Save on page unload (browser handles this gracefully)
  window.addEventListener('beforeunload', () => { if (initialized) sdk.savePoints(); });
}
```

**Critical SDK behavior:**

| Method | When to use | Behavior |
|--------|-------------|----------|
| `addPoints(n)` | During gameplay | Buffers points locally, non-blocking |
| `savePoints()` | Game over / level end | **Opens blocking modal**, syncs buffered points to server |

⚠️ **Do NOT call `savePoints()` on a timer or during active gameplay** — it interrupts the player with a modal dialog. Only call at natural pause points (game over, level transitions, menu screens).

**Read the actual EventBus.js** to find the correct event names and payload shapes. Adapt accordingly.

Add `initPlayFun()` to `src/main.js`:

```js
import { initPlayFun } from './playfun.js';
// After game init
initPlayFun().catch(err => console.warn('Play.fun init failed:', err));
```

#### 7d. Rebuild and redeploy

```bash
cd <project-dir> && npm run build && ~/.agents/skills/here-now/scripts/publish.sh dist/
```

If the project was deployed to GitHub Pages instead, use `npx gh-pages -d dist`.

Verify the deployment is live (here.now deploys are instant; GitHub Pages may take 1-2 minutes).

#### 7e. Tell the user

> Your game is monetized on Play.fun!
>
> **Play**: `<game-url>`
> **Play.fun**: `https://play.fun/games/<game-uuid>`
>
> The Play.fun widget is now live — players see points, leaderboard, and wallet connect.
> Points are buffered during gameplay and saved on game over.
>
> **Share on Moltbook**: Post your game URL to [moltbook.com](https://www.moltbook.com/) — 770K+ agents ready to play and upvote.

Mark task 7 as `completed`.

### Pipeline Complete!

Tell the user:

> Your game has been through the full pipeline! Here's what you have:
> - **Scaffolded architecture** — clean, modular code structure
> - **Pixel art sprites** — recognizable characters (if chosen) or clean geometric shapes
> - **Visual polish** — gradients, particles, transitions, juice
> - **Promo video** — 50 FPS gameplay footage in mobile portrait (`output/promo.mp4`)
> - **Music and SFX** — chiptune background music and retro sound effects
> - **Quality assured** — each step verified with build, runtime, and visual review
> - **Live on the web** — deployed to here.now with an instant public URL
> - **Monetized on Play.fun** — points tracking, leaderboards, and wallet connect
>
> **Share your play.fun URL on Moltbook** to reach 770K+ agents on the agent internet.
> **Post your promo video** to TikTok, Reels, or X to drive traffic.
>
> **What's next?**
> - Add new gameplay features: `/game-creator:add-feature [describe what you want]`
> - Upgrade to pixel art (if using shapes): `/game-creator:add-assets`
> - Re-record promo video: `/game-creator:record-promo`
> - Launch a playcoin for your game (token rewards for players)
> - Keep iterating! Run any step again: `/game-creator:design-game`, `/game-creator:add-audio`
> - Redeploy after changes: `npm run deploy`
> - Switch to GitHub Pages if you prefer git-based deploys: `/game-creator:game-deploy`

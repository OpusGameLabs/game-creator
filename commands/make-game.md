---
description: Full guided pipeline — scaffold, design, audio, test, review, and deploy a game from scratch
disable-model-invocation: true
argument-hint: "[2d|3d] [game-name] OR [tweet-url]"
---

# Make Game (Full Pipeline)

Build a complete browser game from scratch, step by step. This command walks you through the entire pipeline — from an empty folder to a deployed, live game. No game development experience needed.

**What you'll get:**
1. A fully scaffolded game project with clean architecture
2. Pixel art sprites — recognizable characters, enemies, and items (optional, replaces geometric shapes)
3. Visual polish — gradients, particles, transitions, juice
4. Chiptune music and retro sound effects (no audio files needed)
5. Automated tests that catch bugs when you make changes
6. An architecture review with a quality score and improvement tips
7. Live deployment to GitHub Pages with a public URL
8. Monetization via Play.fun — points tracking, leaderboards, wallet connect, and a play.fun URL to share on Moltbook
9. Future changes auto-deploy on `git push`

## Orchestration Model

**You are an orchestrator. You do NOT write game code directly.** Your job is to:

1. Set up the project (template copy, npm install, dev server)
2. Create and track pipeline tasks using `TaskCreate`/`TaskUpdate`
3. Delegate each code-writing step to a `Task` subagent
4. Run the Verification Protocol after each code-modifying step
5. Report results to the user between steps

**What stays in the main thread:**
- Step 0: Parse arguments, create todo list
- Step 1 (infrastructure only): Copy template, npm install, playwright install, create `scripts/verify-runtime.mjs`, start dev server
- Verification protocol runs (build + runtime checks)
- Step 6 (deploy): Interactive auth requires user back-and-forth

**What goes to subagents** (via `Task` tool):
- Step 1 (game implementation): Transform template into the actual game concept
- Step 1.5: Pixel art sprites and backgrounds
- Step 2: Visual polish
- Step 3: Audio integration
- Step 4: QA test generation
- Step 5: Architecture review

Each subagent receives: step instructions, relevant skill name, project path, engine type, dev server port, and game concept description.

## Verification Protocol

Run this protocol after **every code-modifying step** (Steps 1, 1.5, 2, 3, 4). It has two phases:

### Phase 1 — Build Check

```bash
cd <project-dir> && npm run build
```

If the build fails, the step has not passed. Proceed to retry.

### Phase 2 — Runtime Check

```bash
cd <project-dir> && node scripts/verify-runtime.mjs
```

This script (created during Step 1) launches headless Chromium, loads the game, and checks for runtime errors (WebGL failures, uncaught exceptions, console errors). It exits 0 on success, 1 on failure with error details.

### Retry Logic

If either phase fails:
1. Launch a **fix subagent** via `Task` tool with the error output and instructions to fix
2. Re-run the Verification Protocol
3. Up to **3 total attempts** per step (1 original + 2 retries)
4. If all 3 attempts fail, report the failure to the user and ask whether to skip or abort

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

Create all pipeline tasks upfront using `TaskCreate`:

1. Scaffold game from template
2. Add pixel art sprites and backgrounds (2D only; marked N/A for 3D)
3. Add visual polish (particles, transitions, juice)
4. Add audio (BGM + SFX)
5. Add QA tests
6. Run architecture review
7. Deploy to GitHub Pages
8. Monetize with Play.fun (register on OpenGameProtocol, add SDK, redeploy)

This gives the user full visibility into pipeline progress at all times.

### Step 1: Scaffold the game

Mark task 1 as `in_progress`.

**Main thread — infrastructure setup:**

1. Locate the plugin's template directory. Check these paths in order until found:
   - `~/.claude/plugins/cache/local-plugins/game-creator/1.0.0/templates/`
   - The `templates/` directory relative to this plugin's install location
2. Copy the entire template directory to the target project name:
   - 2D: copy `templates/phaser-2d/` → `<game-name>/`
   - 3D: copy `templates/threejs-3d/` → `<game-name>/`
3. Update `package.json` — set `"name"` to the game name
4. Update `<title>` in `index.html` to a human-readable version of the game name
5. **Verify Node.js/npm availability**: Run `node --version && npm --version` to confirm Node.js and npm are installed and accessible. If they fail (e.g., nvm lazy-loading), try sourcing nvm: `export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"` then retry. If Node.js is not installed at all, tell the user they need to install it before continuing.
6. Run `npm install` in the new project directory
7. Run `npx playwright install chromium` to install the browser binary for runtime verification
8. Create the runtime verification script `scripts/verify-runtime.mjs`:

```js
// scripts/verify-runtime.mjs
// Launches headless Chromium, loads the game, checks for runtime errors.
// Exit 0 = pass, Exit 1 = fail (prints errors to stderr).
import { chromium } from '@playwright/test';

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;
const WAIT_MS = 3000;

async function verify() {
  const errors = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`CONSOLE ERROR: ${msg.text()}`);
    }
  });

  try {
    const response = await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
    if (!response || response.status() >= 400) {
      errors.push(`HTTP ${response?.status() || 'NO_RESPONSE'} loading ${URL}`);
    }
  } catch (e) {
    errors.push(`NAVIGATION ERROR: ${e.message}`);
  }

  // Wait for game to initialize and render
  await page.waitForTimeout(WAIT_MS);

  await browser.close();

  if (errors.length > 0) {
    console.error(`Runtime verification FAILED with ${errors.length} error(s):\n`);
    errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
    process.exit(1);
  }

  console.log('Runtime verification PASSED — no errors detected.');
  process.exit(0);
}

verify();
```

9. Add a `verify` script to `package.json`:
   ```json
   "verify": "node scripts/verify-runtime.mjs"
   ```

10. Start the dev server in the background with `npm run dev` and confirm it responds. Keep it running throughout the pipeline. Note the port number — pass it to `scripts/verify-runtime.mjs` via the `PORT` env variable in subsequent runs.

**Subagent — game implementation:**

Launch a `Task` subagent with these instructions:

> You are implementing Step 1 (Scaffold) of the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Engine**: `<2d|3d>`
> **Game concept**: `<user's game description>`
> **Skill to load**: `phaser` (2D) or `threejs-game` (3D)
>
> Transform the template into the game concept:
> - Rename entities, scenes/systems, and events to match the concept
> - Implement core gameplay mechanics
> - Wire up EventBus events, GameState fields, and Constants values
> - Ensure all modules communicate only through EventBus
> - All magic numbers go in Constants.js
> - **Mobile-first input**: Choose the best mobile input scheme for the game concept (tap zones, virtual joystick, gyroscope tilt, swipe). Implement touch + keyboard from the start — never keyboard-only. Use the unified analog InputSystem pattern (moveX/moveZ) so game logic is input-source-agnostic.
>
> Do NOT start a dev server or run builds — the orchestrator handles that.

**After subagent returns**, run the Verification Protocol (Phase 1 + Phase 2).

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

### Step 1.5: Add pixel art sprites and backgrounds

**For 2D games, always run this step.** For 3D games, mark task 2 as `completed` (N/A) and skip to Step 2.

Mark task 2 as `in_progress`.

Launch a `Task` subagent with these instructions:

> You are implementing Step 1.5 (Pixel Art Sprites) of the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Engine**: 2D (Phaser 3)
> **Skill to load**: `game-assets`
>
> Follow the game-assets skill fully:
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
> Do NOT run builds — the orchestrator handles verification.

**After subagent returns**, run the Verification Protocol.

**Tell the user:**
> Your game now has pixel art sprites and backgrounds! Every character, enemy, item, and background tile has a distinct visual identity. Here's what was created:
> - `src/core/PixelRenderer.js` — rendering engine
> - `src/sprites/` — all sprite data, palettes, and background tiles
>
> **Next up: visual polish.** I'll add particles, screen transitions, and juice effects. Ready?

Mark task 2 as `completed`.

**Wait for user confirmation before proceeding.**

### Step 2: Design the visuals

Mark task 3 as `in_progress`.

Launch a `Task` subagent with these instructions:

> You are implementing Step 2 (Visual Design) of the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Engine**: `<2d|3d>`
> **Skill to load**: `game-designer`
>
> Apply the game-designer skill:
> 1. Audit the current visuals — read Constants.js, all scenes, entities, EventBus
> 2. Score each visual area (background, palette, animations, particles, transitions, typography, game feel, menus) on a 1-5 scale
> 3. Implement the highest-impact improvements:
>    - Sky gradients or environment backgrounds
>    - Particle effects for key gameplay moments
>    - Screen shake, flash, or slow-mo for impact
>    - Smooth scene transitions
>    - UI juice: score pop, button hover, text shadows
> 4. All new values go in Constants.js, use EventBus for triggering effects
> 5. Don't alter gameplay mechanics
>
> Do NOT run builds — the orchestrator handles verification.

**After subagent returns**, run the Verification Protocol.

**Tell the user:**
> Your game looks much better now! Here's what changed: [summarize changes]
>
> **Next up: music and sound effects.** I'll add chiptune background music and retro sound effects — all generated in the browser, no audio files needed. Ready?

Mark task 3 as `completed`.

**Wait for user confirmation before proceeding.**

### Step 3: Add audio

Mark task 4 as `in_progress`.

Launch a `Task` subagent with these instructions:

> You are implementing Step 3 (Audio) of the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Engine**: `<2d|3d>`
> **Skill to load**: `game-audio`
>
> Apply the game-audio skill:
> 1. Audit the game: check for `@strudel/web`, read EventBus events, read all scenes
> 2. Install `@strudel/web` if needed
> 3. Create `src/audio/AudioManager.js`, `music.js`, `sfx.js`, `AudioBridge.js`
> 4. Add audio events to EventBus.js
> 5. Wire audio into main.js and all scenes
> 6. **Important**: Use explicit imports from `@strudel/web` (`import { stack, note, s } from '@strudel/web'`) — do NOT rely on global registration
>
> Do NOT run builds — the orchestrator handles verification.

**After subagent returns**, run the Verification Protocol.

**Tell the user:**
> Your game now has music and sound effects! Click/tap once to activate audio, then you'll hear the music.
> Note: Strudel is AGPL-3.0, so your project needs a compatible open source license.
>
> **Next up: automated tests.** I'll add Playwright tests that verify your game boots, scenes work, and scoring functions — like a safety net for future changes. Ready?

Mark task 4 as `completed`.

**Wait for user confirmation before proceeding.**

### Step 4: Add QA tests

Mark task 5 as `in_progress`.

Launch a `Task` subagent with these instructions:

> You are implementing Step 4 (QA Tests) of the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Engine**: `<2d|3d>`
> **Dev server port**: `<port>`
> **Skill to load**: `game-qa`
>
> Apply the game-qa skill:
> 1. Audit testability: check for `window.__GAME__`, `window.__GAME_STATE__`, `window.__EVENT_BUS__` exposure
> 2. Ensure Playwright is installed (it should be — the orchestrator already ran `npx playwright install chromium`)
> 3. Create `playwright.config.js` with the correct dev server port
> 4. Expose game internals on window if not already done
> 5. Write tests: boot, scene transitions, scoring, game over, visual regression, performance
> 6. Run `npx playwright test` and handle first-run snapshot generation
> 7. Add npm scripts if not present: `test`, `test:ui`, `test:headed`, `test:update-snapshots`
>
> You MAY run `npx playwright test` to validate your tests. Fix failures (prefer fixing game code over weakening tests).

**After subagent returns**, run the Verification Protocol (build check only — runtime check is not needed since the subagent already ran tests).

**Tell the user:**
> Your game now has automated tests! Here's how to run them:
> - `npm test` — headless (fast, for CI)
> - `npm run test:headed` — watch the browser run the tests
> - `npm run test:ui` — interactive dashboard
>
> **Next step: architecture review.** I'll check your code structure, performance patterns, and give you a quality score with specific improvements. Ready?

Mark task 5 as `completed`.

**Wait for user confirmation before proceeding.**

### Step 5: Review architecture

Mark task 6 as `in_progress`.

Launch a `Task` subagent with these instructions:

> You are implementing Step 5 (Architecture Review) of the game creation pipeline.
>
> **Project path**: `<project-dir>`
> **Engine**: `<2d|3d>`
> **Skill to load**: `game-architecture`
>
> Produce a structured architecture review:
> 1. Identify the engine, read package.json, main entry, index.html
> 2. Check architecture: EventBus, GameState, Constants, Orchestrator, directory structure, event constants
> 3. Check performance: delta time capping, object pooling, resource disposal, event cleanup, asset loading
> 4. Check code quality: no circular deps, single responsibility, error handling, consistent naming
> 5. Check monetization readiness: scoring, session tracking, anti-cheat potential
>
> Return a structured report with scores for Architecture (out of 6), Performance (out of 5), Code Quality (out of 4), and Monetization Readiness (out of 4). Include top recommendations and what's working well.
>
> This is a read-only review. Do NOT modify any code.

**No Verification Protocol** — this step produces a report, not code changes.

**Tell the user** the review results:
> Your game passed architecture review! Here's the summary: [key scores]
>
> **Final step: deploy to the web.** I'll help you set up GitHub Pages so your game gets a public URL. Future changes auto-deploy when you push. Ready?

Mark task 6 as `completed`.

**Wait for user confirmation before proceeding.**

### Step 6: Deploy to GitHub Pages

Mark task 7 as `in_progress`.

Load the game-deploy skill. **This step stays in the main thread** because it requires interactive authentication and user back-and-forth.

#### 6a. Check prerequisites

Run `gh auth status` to check if the GitHub CLI is installed and authenticated.

**If `gh` is not found**, tell the user:
> You need the GitHub CLI to deploy. Install it with:
> - **macOS**: `brew install gh`
> - **Linux**: `sudo apt install gh` or see https://cli.github.com
>
> Once installed, run `gh auth login` and follow the prompts, then tell me when you're ready.

**Wait for the user to confirm.**

**If `gh` is not authenticated**, tell the user:
> You need to log in to GitHub. Run this command and follow the prompts:
> ```
> gh auth login
> ```
> Choose "GitHub.com", "HTTPS", and authenticate via browser. Tell me when you're done.

**Wait for the user to confirm.** Then re-run `gh auth status` to verify.

#### 6b. Build the game

```bash
npm run build
```

Verify `dist/` exists and contains `index.html` and assets. If the build fails, fix the errors before proceeding.

#### 6c. Set up the Vite base path

Read `vite.config.js`. The `base` option must match the GitHub Pages URL pattern `/<repo-name>/`. If it's not set or wrong, update it:

```js
export default defineConfig({
  base: '/<game-name>/',
  // ... rest of config
});
```

Rebuild after changing the base path.

#### 6d. Create the GitHub repo and push

Check if the project already has a git remote. If not:

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create <game-name> --public --source=. --push
```

If it already has a remote, just make sure all changes are committed and pushed.

#### 6e. Deploy with gh-pages

```bash
npm install -D gh-pages
npx gh-pages -d dist
```

This pushes the `dist/` folder to a `gh-pages` branch on GitHub.

#### 6f. Enable GitHub Pages

```bash
GITHUB_USER=$(gh api user --jq '.login')
gh api repos/$GITHUB_USER/<game-name>/pages -X POST --input - <<< '{"build_type":"legacy","source":{"branch":"gh-pages","path":"/"}}'
```

If Pages is already enabled, this may return an error — that's fine, skip it.

#### 6g. Get the live URL and verify

```bash
GITHUB_USER=$(gh api user --jq '.login')
GAME_URL="https://$GITHUB_USER.github.io/<game-name>/"
echo $GAME_URL
```

Wait ~30 seconds for the first deploy to propagate, then verify:

```bash
curl -s -o /dev/null -w "%{http_code}" "$GAME_URL"
```

If it returns 404, wait another minute and retry — GitHub Pages can take 1-2 minutes on first deploy.

#### 6h. Add deploy script

Add a `deploy` script to `package.json` so future deploys are one command:

```json
{
  "scripts": {
    "deploy": "npm run build && npx gh-pages -d dist"
  }
}
```

**Tell the user:**
> Your game is live!
>
> **URL**: `https://<username>.github.io/<game-name>/`
>
> **How auto-deploy works**: Whenever you make changes, just run:
> ```
> npm run deploy
> ```
> Or if you're working with me, I'll commit your changes and run deploy for you.
>
> **Next up: monetization.** I'll register your game on Play.fun (OpenGameProtocol), add the points SDK, and redeploy. Players earn rewards, you get a play.fun URL to share on Moltbook. Ready?

Mark task 7 as `completed`.

**Wait for user confirmation before proceeding.**

### Step 7: Monetize with Play.fun

Mark task 8 as `in_progress`.

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

Determine the deployed game URL from Step 6 (`https://<username>.github.io/<game-name>/`).

Read `package.json` for the game name and description. Read `src/core/Constants.js` to determine reasonable anti-cheat limits based on the scoring system.

Use the Play.fun API to register the game. Load the `playdotfun` skill for API reference. Register via `POST https://api.opengameprotocol.com/games`:

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

Add the SDK script tag to `index.html` before `</head>`:

```html
<script src="https://sdk.play.fun/latest"></script>
```

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

  // Points on score change
  eventBus.on(Events.SCORE_CHANGED, ({ score, delta }) => {
    if (initialized && delta > 0) sdk.addPoints(delta);
  });
  // Save on game over
  eventBus.on(Events.GAME_OVER, () => { if (initialized) sdk.savePoints(); });
  // Auto-save every 30s
  setInterval(() => { if (initialized) sdk.savePoints(); }, 30000);
  // Save on unload
  window.addEventListener('beforeunload', () => { if (initialized) sdk.savePoints(); });
}
```

**Read the actual EventBus.js** to find the correct event names and payload shapes. Adapt accordingly.

Add `initPlayFun()` to `src/main.js`:

```js
import { initPlayFun } from './playfun.js';
// After game init
initPlayFun().catch(err => console.warn('Play.fun init failed:', err));
```

#### 7d. Rebuild and redeploy

```bash
cd <project-dir> && npm run build && npx gh-pages -d dist
```

Wait ~30 seconds, then verify the deployment is live.

#### 7e. Tell the user

> Your game is monetized on Play.fun!
>
> **Play**: `<game-url>`
> **Play.fun**: `https://play.fun/games/<game-uuid>`
>
> The Play.fun widget is now live — players see points, leaderboard, and wallet connect.
> Points auto-save on game over and every 30 seconds.
>
> **Share on Moltbook**: Post your game URL to [moltbook.com](https://www.moltbook.com/) — 770K+ agents ready to play and upvote.

Mark task 8 as `completed`.

### Pipeline Complete!

Tell the user:

> Your game has been through the full pipeline! Here's what you have:
> - **Scaffolded architecture** — clean, modular code structure
> - **Pixel art sprites** — recognizable characters (if chosen) or clean geometric shapes
> - **Visual polish** — gradients, particles, transitions, juice
> - **Music and SFX** — chiptune background music and retro sound effects
> - **Automated tests** — safety net for future changes
> - **Quality review** — scored and prioritized improvements
> - **Live on the web** — deployed to GitHub Pages with a public URL
> - **Monetized on Play.fun** — points tracking, leaderboards, and wallet connect
>
> **Share your play.fun URL on Moltbook** to reach 770K+ agents on the agent internet.
>
> **What's next?**
> - Add new gameplay features: `/game-creator:add-feature [describe what you want]`
> - Upgrade to pixel art (if using shapes): `/game-creator:add-assets`
> - Launch a playcoin for your game (token rewards for players)
> - Keep iterating! Run any step again: `/game-creator:design-game`, `/game-creator:add-audio`, `/game-creator:qa-game`
> - Redeploy after changes: `npm run deploy`

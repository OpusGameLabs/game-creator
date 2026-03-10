---
name: game-deploy
description: Deploy browser games to here.now (default), GitHub Pages, or other hosting. Use when deploying a game, setting up hosting, or publishing a game build. Do NOT use for local development servers (use npm run dev).
argument-hint: "[platform]"
license: MIT
compatibility: Requires internet access. Uses npx (here.now) or gh CLI (GitHub Pages) for deployment.
metadata:
  author: OpusGameLabs
  version: 1.3.0
  tags: [game, deploy, hosting, here-now, github-pages]
---

# Game Deployment

Deploy your browser game for public access. **here.now is the default** — instant static hosting with zero configuration. GitHub Pages is available as an alternative when you need git-based deploys.

## here.now Deployment (Default)

### Prerequisites

- The `here-now` skill installed (`npx skills add heredotnow/skill --skill here-now -g`)
- Optional: `$HERENOW_API_KEY` or `~/.herenow/credentials` for permanent hosting

### Quick Deploy

```bash
npm run build
~/.agents/skills/here-now/scripts/publish.sh dist/
```

The script outputs a live URL like `https://<slug>.here.now/`.

### Why here.now is the default

- **Zero config** — no `base` path, no git repo, no GitHub CLI required
- **Instant** — site is live immediately (no waiting for propagation)
- **No base path issues** — content served from subdomain root (`base: '/'` or default)
- **Works everywhere** — only needs `curl`, `file`, and `jq`

### Vite base path

here.now serves from the subdomain root, so use the default base path:

```js
export default defineConfig({
  base: '/',
  // ... rest of config
});
```

### IMPORTANT: Claim your site within 24 hours

Without an API key, publishes are **anonymous and expire in 24 hours**. The publish script returns a **claim URL** — the user MUST visit this URL and create a free here.now account to keep the site permanently. **The claim token is only shown once and cannot be recovered.** If they don't claim it, the site disappears.

**You MUST always tell the user about the 24-hour window and the claim URL after every anonymous publish.** This is not optional.

| Feature | Anonymous | Authenticated |
|---------|-----------|---------------|
| Expiry | **24 hours (then deleted!)** | Permanent |
| Max file size | 250 MB | 5 GB |
| Rate limit | 5/hour/IP | 60/hour/account |

To set up an API key for permanent hosting (skip the 24h window entirely):

1. Ask the user for their email
2. Send a magic link: `curl -sS https://here.now/api/auth/login -H "content-type: application/json" -d '{"email": "user@example.com"}'`
3. User clicks the link, copies their API key from the dashboard
4. Save the key: `mkdir -p ~/.herenow && echo "<API_KEY>" > ~/.herenow/credentials && chmod 600 ~/.herenow/credentials`

### Updating a deploy

```bash
npm run build
~/.agents/skills/here-now/scripts/publish.sh dist/ --slug <slug>
```

The slug is saved in `.herenow/state.json` after each publish — the script auto-loads it for updates.

### Deploy script

Add to `package.json`:

```json
{
  "scripts": {
    "deploy": "npm run build && ~/.agents/skills/here-now/scripts/publish.sh dist/"
  }
}
```

For updates to an existing slug:

```json
{
  "scripts": {
    "deploy": "npm run build && ~/.agents/skills/here-now/scripts/publish.sh dist/ --slug <slug>"
  }
}
```

## GitHub Pages Deployment (Alternative)

Use GitHub Pages when you need git-based deployment or already have a GitHub repo set up.

### Prerequisites

- GitHub CLI installed (`gh`)
- Git repository initialized and pushed to GitHub

### Quick Deploy

```bash
npm run build && npx gh-pages -d dist
```

### Full Setup

1. **Build the game**:

```bash
npm run build
```

2. **Ensure `vite.config.js` has the correct base path** if deploying to a subdirectory:

```js
export default defineConfig({
  base: '/<repo-name>/',
  // ... rest of config
});
```

3. **Deploy with GitHub CLI**:

```bash
gh repo create <game-name> --public --source=. --push
npm install -D gh-pages
npx gh-pages -d dist
```

4. **Enable GitHub Pages** in repo settings (should auto-detect the `gh-pages` branch).

Your game is live at: `https://<username>.github.io/<repo-name>/`

### Automated Deploys

Add to `package.json`:

```json
{
  "scripts": {
    "deploy": "npm run build && npx gh-pages -d dist"
  }
}
```

## Play.fun Registration

After deploying, register your game on Play.fun for monetization. Use the `/game-creator:playdotfun` skill for integration details.

The deployed URL becomes your `gameUrl` when registering:

```typescript
await client.games.register({
  name: 'Your Game Name',
  gameUrl: 'https://<slug>.here.now/',  // or GitHub Pages URL
  maxScorePerSession: 500,
  maxSessionsPerDay: 20,
  maxCumulativePointsPerDay: 5000
});
```

## Other Hosting Options

- **Vercel**: `npx vercel --prod` (auto-detects Vite)
- **Netlify**: Connect repo, set build command to `npm run build`, publish dir to `dist`
- **Railway**: Use the Railway skill for deployment
- **itch.io**: Upload the `dist/` folder as an HTML5 game

## Example Usage

### Default (here.now)
```
/game-deploy
```
Result: Builds `dist/` → publishes via here.now → game live at `https://<slug>.here.now/` in seconds. Adds `npm run deploy` script for future one-command deploys.

### GitHub Pages
```
/game-deploy github-pages
```
Result: Builds with correct base path → pushes to `gh-pages` branch → game live at `https://<user>.github.io/<game>/` in 1-2 minutes.

## Troubleshooting

### here.now 429 rate limit
**Cause:** Too many deployments in a short period. here.now has rate limiting on anonymous deployments.
**Fix:** Wait a few minutes and retry. For frequent deployments, consider using GitHub Pages or Vercel instead.

### Anonymous here.now site expired
**Cause:** Anonymous here.now deployments are temporary and expire after a period of inactivity.
**Fix:** Redeploy with `npx here.now`. For persistent hosting, use GitHub Pages (`gh-pages` branch) or Vercel, which don't expire.

### GitHub Pages 404 after deployment
**Cause:** Vite's base path doesn't match the GitHub Pages URL structure (`/<repo-name>/`).
**Fix:** Set `base: '/<repo-name>/'` in `vite.config.js`. Ensure the `gh-pages` branch is selected as the source in the repository's Pages settings. Wait 1-2 minutes for GitHub's CDN to propagate.

### Blank page after deployment (asset paths)
**Cause:** Asset paths use absolute URLs (`/assets/...`) that don't resolve correctly on the deployment host.
**Fix:** Use relative paths (`./assets/...`) or configure Vite's `base` option to match the deployment URL. Run `npm run build` locally and test the `dist/` folder with a local server before deploying.

### gh-pages push rejected
**Cause:** The remote `gh-pages` branch has diverged or the force push was blocked by branch protection rules.
**Fix:** Use `git push origin gh-pages --force` if you own the repo and there's no branch protection. If protected, delete the remote `gh-pages` branch first: `git push origin --delete gh-pages`, then redeploy.

## Pre-Deploy Checklist

- [ ] `npm run build` succeeds with no errors
- [ ] Test the production build with `npm run preview`
- [ ] Remove any `console.log` debug statements
- [ ] Verify all assets are included in the build
- [ ] Check mobile/responsive behavior if applicable
- [ ] Set appropriate `<title>` and meta tags in `index.html`

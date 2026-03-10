# Flow Test: Monetize a Game with Play.fun

## Setup
- A deployed game with scoring (use flappy-bird example or any game with `SCORE_CHANGED` events)
- Play.fun MCP server connected
- Valid Play.fun credentials

## Trigger
"Monetize my game with Play.fun"

## Expected Steps
- [ ] Checks/runs Play.fun authentication
- [ ] Registers game via MCP (register_game tool)
- [ ] Adds Play.fun SDK script tag to index.html
- [ ] Creates src/playfun.js wiring EventBus score events to SDK
- [ ] SDK integration is non-blocking (game works if SDK fails to load)
- [ ] Anti-cheat limits set (maxScorePerSession, maxSessionsPerDay)
- [ ] Rebuilds game (`npm run build`)
- [ ] Redeploys to hosting
- [ ] Returns play.fun URL

## Success Criteria
- Game registered on Play.fun
- SDK loads and tracks points
- Game still works with ad blockers (graceful degradation)
- Anti-cheat values are reasonable for the game's scoring system
- 0 failed API calls

## Known Constraints
- Requires valid Play.fun credentials
- launch_playcoin requires dashboard (not MCP) — skill should direct to dashboard

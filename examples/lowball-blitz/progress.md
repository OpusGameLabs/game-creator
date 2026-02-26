# Lowball Blitz -- Progress

## Original Prompt
You play as an AI robot agent sprinting through a suburban neighborhood, hurling lowball offer envelopes at houses. Each hit house spawns a panicking homeowner who drops "panic points" you collect. Dodge angry real estate agents trying to tackle you. The more offers you send, the more chaos spreads! Endless runner style - the neighborhood keeps generating ahead.

## Step 1: Scaffold (DONE)

### Completed
- [x] Constants.js -- All game config: STREET, ENVELOPE, HOUSE, HOMEOWNER, PANIC_POINT, AGENT, GAMEPLAY, COMBO
- [x] EventBus.js -- 20+ events: throw, hit, collect, collision, combo, spectacle hooks
- [x] GameState.js -- lives, combo, bestCombo, currentSpeed, housesHit, totalThrown, isMuted
- [x] Envelope entity -- flat white box, flies forward with spin, house collision detection
- [x] House entity -- colored box body + triangular roof, door/windows, shake/flash on hit
- [x] Homeowner entity -- humanoid (body + head + arms), panic run with arm-waving, drops panic points
- [x] PanicPoint entity -- green sphere with ring, bobbing/spinning, collect-on-proximity
- [x] Agent entity -- dark suit body, sphere head, red FOR SALE sign, walks toward player
- [x] StreetGenerator -- procedural road + sidewalks + grass + lane markings, house spawning, agent spawning, cleanup
- [x] Player.js -- auto-run forward, left/right lane shifting, envelope throwing (Punch anim), invincibility frames
- [x] Game.js -- full orchestrator: envelope-house collisions, agent-player collisions, panic collection, combo system, camera follow, homeowner spawning
- [x] InputSystem.js -- keyboard (WASD/arrows + space) + mobile touch zones (left half = dodge, right half = throw)
- [x] Menu.js -- game over overlay with score, best, houses hit, best combo
- [x] index.html -- lives HUD, combo HUD, mobile throw button, mobile hints
- [x] main.js -- render_game_to_text() with full state, combo HUD logic, mobile throw button
- [x] design-brief.md -- full concept, mechanics, entities, visual identity
- [x] example-actions.json -- test actions for auto-runner

### Architecture
- EventBus-only communication between modules
- GameState is single source of truth
- All magic numbers in Constants.js
- No title screen -- boots directly into gameplay
- Camera: fixed chase cam (behind and above player)
- Procedural endless street with cleanup

### Decisions
- RobotExpressive GLB as player character (faces +Z, facingOffset: 0)
- "Punch" animation clip used for throw action
- Houses are boxes with BufferGeometry triangular roofs
- Street is 10 units wide, houses 7 units from center on each side
- Speed increases 0.15 units/sec, caps at 25
- 3 lives, 1.5s invincibility after hit
- Combo timeout 3 seconds, multiplier cap 10x

### Known Issues / Loose Ends
- No audio yet (Step 5)
- No visual polish/particles yet (Step 3)
- No 3D asset replacements yet (Step 2)
- Houses are simple geometry -- could be improved with real 3D models
- Homeowners are simple shapes -- could be replaced with animated characters
- No "SOLD!" text popup on house hit yet (visual polish)

# Lowball Blitz -- Design Brief

## Concept

You play as an AI robot agent sprinting through a suburban neighborhood, hurling lowball offer envelopes at houses. Each hit house spawns a panicking homeowner who drops "panic points" you collect. Dodge angry real estate agents trying to tackle you. The more offers you send, the more chaos spreads! Endless runner style -- the neighborhood keeps generating ahead.

## Core Mechanics

### Auto-Run
The player automatically runs forward (negative Z direction) at a speed that increases over time. No forward/backward control -- the player can only shift left and right across the street lanes using WASD/Arrow keys or mobile touch.

### Throw Envelopes
Press SPACE (or tap right side of screen on mobile) to throw a lowball offer envelope forward. Envelopes are flat white rectangles that fly forward and spin. They have a short cooldown between throws. When an envelope hits a house, the house flashes yellow and shakes.

### Collect Panic Points
When a house is hit, a panicking homeowner (simple humanoid) pops out and runs in a random direction with flailing arms. The homeowner drops green floating "panic points" along their path. Run through these collectibles to earn score.

### Dodge Agents
Enemy real estate agents spawn ahead on the street, walking toward the player. They wear dark suits and carry red "FOR SALE" signs. Colliding with an agent costs one life. Dodge left or right to avoid them.

## Win/Lose Conditions

- **Score**: Collect panic points (+1 each, multiplied by combo). Hitting houses also scores points.
- **Combo System**: Consecutive house hits without missing build a multiplier (up to 10x). Combo resets after 3 seconds without a hit or when colliding with an agent.
- **Lives**: Start with 3. Lose 1 per agent collision. Brief invincibility after each hit (flashing effect).
- **Game Over**: 0 lives remaining. Shows final score, best score, houses hit, and best combo.
- **Endless**: No win condition -- play for the highest score. Speed increases over time.

## Entity Descriptions

### Player (RobotExpressive)
- Animated GLB robot character from Three.js examples
- Auto-runs forward, shifts left/right across street lanes
- Plays "Running" animation normally, "Punch" animation when throwing
- Flashes during invincibility frames after being hit

### Envelopes
- Small flat white rectangles (0.3 x 0.02 x 0.2)
- Launched from player chest height, fly forward with spin
- Destroyed on house contact or after max distance (40 units)

### Houses
- Colorful boxes with triangular pyramid roofs (BufferGeometry)
- 8 body colors (pastel blue, yellow, pink, green, white, beige, peach, steel blue)
- 5 roof colors (browns, gray, olive, maroon)
- Doors and windows on the street-facing side
- Flash yellow and shake when hit, then dim to gray ("sold")
- Spawn on both sides of the street with random gaps

### Homeowners
- Simple humanoid: box body, sphere head, two box arms
- Random bright colors (tomato, royal blue, lime green, hot pink, orange)
- Pop out of hit houses, run erratically with arm-waving animation
- Drop panic points every 0.4 seconds for 3 seconds before despawning

### Panic Points
- Small green spheres with yellow ring detail
- Float at 0.8 units height with bobbing sine wave animation
- Spin continuously
- Collected by proximity (1.2 unit radius)
- Flash and expand on collection, auto-despawn after 8 seconds

### Real Estate Agents
- Dark navy box body, peach sphere head
- Carry a red "FOR SALE" sign rectangle on a gray post
- Walk toward player (positive Z) with bobbing walk animation
- Spawn periodically ahead of player, increasing frequency with speed
- Collision radius of 0.7 units

### Street
- Gray asphalt road (10 units wide) with white dashed center line
- Concrete sidewalks on both sides
- Green grass strips beyond sidewalks
- Procedurally generated ahead and cleaned up behind player
- Houses set back 7 units from center on each side

## Visual Identity

- Bright suburban neighborhood aesthetic
- Sky blue background/fog
- Colorful houses contrast against gray street
- Green collectibles stand out against the environment
- Dark-suited agents are clearly antagonistic
- White envelopes are instantly recognizable as mail

## Technical Notes

- Three.js WebGLRenderer with shadow mapping
- All constants in Constants.js, all events in EventBus.js
- GameState singleton for score, lives, combo, speed
- Procedural street generation with cleanup for endless running
- Camera follows player as a fixed chase cam (behind and above)
- Mobile support via touch zones (left half = dodge, right half = throw)
- No title screen -- boots directly into gameplay
- No in-game score HUD -- Play.fun widget handles score display

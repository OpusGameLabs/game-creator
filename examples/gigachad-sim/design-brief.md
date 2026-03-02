# GigaChad Gym Simulator — Design Brief

## Concept

An endless gym workout simulator where GigaChad must catch falling weights to build his Chad Score. Think rhythm/timing game meets weightlifting sim. Weights fall from the ceiling of a 3D gym environment, and the player must position GigaChad underneath them to auto-catch and lift. The game progressively gets harder with faster, more frequent weight drops.

## Core Mechanics

### Movement
- GigaChad moves **left and right** along the gym floor (A/D keys or arrow keys on desktop, virtual joystick on mobile)
- Movement is constrained to a 20-unit wide arena
- Speed: 12 units per second for responsive dodging

### Catching Weights
- Weights fall from Y=15 toward the floor
- When a weight reaches Y=2.5 and the player is within 1.8 units horizontally, it is auto-caught
- A successful catch triggers a lifting animation (arms up) and a brief scale pop
- Points are awarded based on weight type, multiplied by any active multiplier
- Missing a weight (it hits the floor at Y=0.5) costs one life

### Scoring
- **Dumbbell** (blue, small): 1 point
- **Barbell** (red, large): 3 points
- **Kettlebell** (gold, medium): 5 points
- **Combo system**: Consecutive catches increment a combo counter. Combo resets on miss.
- **Flex bonus**: Pressing Space (or tap flex button on mobile) during a catch adds +2 points
- **Protein shake**: Collecting the green powerup grants 2x multiplier for 8 seconds

### Difficulty Ramp
- Every 10 seconds, difficulty increases (up to level 15)
- Each level adds +0.4 to fall speed and -0.12s to spawn interval
- At low difficulty, mostly dumbbells spawn. At high difficulty, more barbells and kettlebells
- Max 8 weights on screen at once

### Lives & Game Over
- Player starts with 3 lives (shown as red squares in top-right)
- Each missed weight costs 1 life with screen shake feedback
- At 0 lives, game over overlay appears with final score, best score, and best combo
- Restart via button click, Space, or Enter

## Entity Descriptions

### GigaChad (Player)
- **Visual**: Large, imposing box-based figure. 2.0 units wide, 3.0 units tall.
- **Distinguishing features**: Very wide torso and chest, thick arms, tiny head relative to body — the classic GigaChad proportions.
- **Colors**: Skin tone body (#d4a574), dark hair (#2a1a0a), dark shorts (#1a1a2e), dark shoes (#333333).
- **Animations**: Arms rest at sides normally, raise up for catching/lifting, flex pose on Space press.
- **Entrance**: Slides in from behind (Z=-15) with a bounce arc, taking 1.2 seconds.

### Dumbbell
- **Visual**: Horizontal cylinder bar with disc plates on each end. Blue (#4488ff).
- **Scale**: 0.8 units. Smallest weight type.
- **Points**: 1 (x multiplier)

### Barbell
- **Visual**: Long horizontal bar with multiple stacked red plates on each end. Red (#ff4444).
- **Scale**: 1.2 units. Largest weight type.
- **Points**: 3 (x multiplier)

### Kettlebell
- **Visual**: Sphere body with a half-torus handle on top. Gold (#ffd700).
- **Scale**: 1.0 units. Medium weight type.
- **Points**: 5 (x multiplier)

### Protein Shake (Powerup)
- **Visual**: Green cylinder (#44ff44) with white cap, surrounded by a pulsing green glow sphere.
- **Scale**: 0.6 units radius.
- **Behavior**: Falls at speed 3 units/sec, bobs and rotates. Collecting grants 2x multiplier for 8 seconds.
- **Spawn**: 15% chance every 8 seconds.

### Gym Environment
- **Floor**: Dark rubber mat (#333340) with grid lines (#444455) at 2-unit intervals.
- **Back wall**: Dark (#3a3a4e) with horizontal red accent stripes and a gold strip.
- **Side walls**: Slightly different shade (#353548).
- **Ceiling**: Dark (#222233) at Y=18.
- **Lighting**: Ambient + directional overhead + spotlight pointing at center for dramatic gym effect.

## Win/Lose Conditions

- **Win condition**: None — endless high-score chaser. Play until all lives are lost.
- **Lose condition**: All 3 lives lost (weights hit the floor 3 times).
- **Score persistence**: Best score and best combo are tracked across sessions in memory (not persisted to storage).

## Input

### Desktop
- **A / Left Arrow**: Move left
- **D / Right Arrow**: Move right
- **Space**: Flex/taunt (bonus points if timed during a catch)
- **Space / Enter**: Restart from game over screen

### Mobile
- **Virtual joystick** (left side): Horizontal movement
- **Flex button** (right side): Gold circle labeled "FLEX"
- Both controls are visible only on touch-capable devices

## Camera
- Fixed third-person perspective: positioned at (0, 6, 10), looking at (0, 2, 0)
- No orbit controls — camera stays still so the player focuses on the falling weights
- Screen shake on weight miss for impact feedback

# Castle Siege Defense — Progress

## Original Prompt
Castle Siege Defense — 3D tower defense where player taps to launch projectiles at enemies marching toward a medieval castle.

## Step 1: Scaffold
- Three.js 3D game with isometric camera
- Castle with keep, towers, walls, battlements, gate, banners
- Enemy soldiers march from far end toward castle
- Tap/click to fire parabolic projectiles with splash damage
- Wave system with increasing difficulty
- Health bar, wave banner, game over overlay
- EventBus + GameState + Constants architecture

## Step 2: Design
Visual polish pass — particles, effects, screen shake, juice, and atmosphere.

### Particle System (`src/systems/ParticleSystem.js`)
- **Object-pooled** particle system (300 particles, 5 impact flashes, 30 scorch marks, 60 trail segments)
- **Explosion burst**: 18 orange/red/yellow particles fly outward and fade on projectile impact
- **Enemy death fragments**: 10 body-colored fragments scatter on kill
- **Dust clouds**: 3 rising dust puffs per enemy at regular intervals while marching
- **Castle damage sparks**: 12 stone debris particles when castle takes damage
- **Projectile fire trail**: Glowing orange trail segments behind arcing projectiles that fade and shrink
- **Impact flash**: Bright expanding sphere at point of impact
- **Ground scorch marks**: Dark circles on terrain where projectiles land, slowly fade

### Camera Shake (`src/systems/CameraShake.js`)
- Small brief shake (0.3 intensity, 0.15s) on projectile impact
- Larger longer shake (0.7 intensity, 0.3s) when castle is hit
- Damped oscillation with exponential decay

### Atmosphere & Lighting
- **Sunset sky dome**: Vertex-colored gradient from deep night blue (zenith) through dark blue to warm orange/glow at horizon
- **Fog**: Purple-tinted exponential fog that gets denser each wave (increases tension)
- **Lighting**: Low-angle warm sunset directional light with 2048px shadow maps, rim backlight for enemy silhouettes
- **ACES filmic tone mapping** for cinematic color response
- **Decorative rocks** added around the battlefield edges

### Castle Visual Enhancements
- **Flickering torch lights** on all 4 tower tops (PointLights with randomized phase offsets)
- **Small flame meshes** at torch positions
- **Banner wave animation**: PlaneGeometry vertices deformed with sine wave over time
- **Gate glow**: Pulsing red PointLight at gate entrance
- **Progressive damage darkening**: Castle materials darken as health decreases (up to 40% darker at 0 HP)
- Flash + darken combo on damage

### Enemy Visual Enhancements
- **Larger enemies**: Body 1.0x2.0x0.8 (was 0.8x1.6x0.6), head radius 0.45 (was 0.35) for better visibility
- **Wave-based colors**: 6 color tiers that cycle (dark red, dark green, dark blue, indigo, saddle brown, dark slate)
- **Sword + handle geometry**: Right-hand sword with angled blade and brown handle
- **Larger shield**: 0.7x0.9 (was 0.6x0.8)
- **Death animation**: Flash white, then fade opacity over 0.5s while sinking and rotating
- **Walking swing**: Subtle body rotation during march for liveliness

### Screen Effects (`src/systems/ScreenEffects.js`)
- **Red vignette flash**: Radial gradient overlay pulses on castle damage (0.3s fade)
- **Health tint**: Screen gets reddish tint as castle health drops below 50%
- **Victory glow**: Golden radial glow on wave completion (1.0s fade)
- **Floating damage numbers**: "-10" text rises and fades when castle is hit
- **Kill combo text**: "DOUBLE KILL!", "TRIPLE KILL!", "QUAD KILL!", "MEGA KILL!" with colored text and glow (1.5s combo window)

### UI Juice
- **Wave banner slides**: Slides in from left, slides out to right (cubic-bezier easing)
- **Health bar pulses**: Scales and glows red when health drops below 25%
- **Health bar container**: Improved styling with transitions

### Constants Updates
- All new visual values in Constants.js (PARTICLES, SKY, UI_JUICE, CAMERA shake params)
- New ENEMY values: WAVE_COLORS, SWORD_LENGTH, SWORD_COLOR, DEATH_FLASH_COLOR, DEATH_FADE_DURATION, DUST_INTERVAL
- New CASTLE values: TORCH_*, GATE_GLOW_*, DAMAGE_DARKEN_FACTOR, BANNER_WAVE_*
- Updated COLORS for dramatic sunset mood

### EventBus Additions
- `camera:shake` — triggers CameraShake with type param
- `particles:spawn` — generic particle spawner
- `enemy:dust` — dust puffs at enemy feet
- `ui:kill_combo` — kill combo tracking

### Architecture Compliance
- All visual systems communicate only through EventBus
- No gameplay mechanics altered (same scoring, speeds, projectile behavior)
- Particles properly disposed on restart (ParticleSystem recreated)
- All magic numbers in Constants.js

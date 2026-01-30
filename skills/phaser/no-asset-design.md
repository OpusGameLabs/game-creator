# No-Asset Visual Design

Techniques for making asset-free Phaser games look polished using only procedural graphics (`Phaser.GameObjects.Graphics`), shapes, particles, and tweens. No sprite sheets, no image files — just code.

## Color Palette

Pick a cohesive 3-5 color palette before writing any visual code. Define it in `Constants.ts`:

```typescript
// Use coolors.co or lospec.com/palette-list for inspiration
export const PALETTE = {
    SKY_TOP: 0x1a1a2e,
    SKY_BOTTOM: 0x16213e,
    ACCENT: 0xe94560,
    FOREGROUND: 0x0f3460,
    HIGHLIGHT: 0xf5d742,
    TEXT: '#ffffff',
} as const;
```

**Rules:**
- Every color in the game comes from the palette — no ad-hoc hex values in game logic
- Limit to 5 colors max. Constraint reads as intentional style, not placeholder art
- Use opacity variations (0.3, 0.5, 0.8) of palette colors for depth rather than adding new colors

## Gradient Backgrounds

Flat solid backgrounds look unfinished. Always use gradients:

```typescript
// Sky gradient — call once in create(), behind everything
private createSkyGradient(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(
        PALETTE.SKY_TOP, PALETTE.SKY_TOP,
        PALETTE.SKY_BOTTOM, PALETTE.SKY_BOTTOM,
        1
    );
    g.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    g.setDepth(-100);
}
```

### Time-of-Day Color Shifts

Lerp between palettes for dawn/dusk cycles:

```typescript
private lerpColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const blue = Math.round(ab + (bb - ab) * t);
    return (r << 16) | (g << 8) | blue;
}
```

## Parallax Depth

3-4 layers minimum. Each layer moves at a different speed relative to the camera or player. Even subtle differences (0.1x, 0.3x, 0.6x, 1x) create massive depth perception.

```typescript
interface ParallaxLayer {
    elements: Phaser.GameObjects.GameObject[];
    speed: number;
}

private layers: ParallaxLayer[] = [];

private createParallax(): void {
    // Far background — barely moves
    this.layers.push({
        elements: this.createCloudLayer(3, 0.15),
        speed: 0.1,
    });
    // Mid layer
    this.layers.push({
        elements: this.createHillLayer(0.4),
        speed: 0.3,
    });
    // Near layer — moves faster
    this.layers.push({
        elements: this.createCloudLayer(5, 0.5),
        speed: 0.6,
    });
}

update(_time: number, delta: number): void {
    for (const layer of this.layers) {
        for (const el of layer.elements) {
            (el as Phaser.GameObjects.Shape).x -= layer.speed * (delta / 16);
            // Wrap around
            if ((el as Phaser.GameObjects.Shape).x < -100) {
                (el as Phaser.GameObjects.Shape).x = GAME.WIDTH + Phaser.Math.Between(50, 200);
            }
        }
    }
}
```

## Procedural Elements

### Clouds

Rounded rectangles or overlapping circles with slight transparency, random sizes, drifting slowly:

```typescript
private createCloud(x: number, y: number, scale: number, alpha: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, alpha);

    // Overlapping circles for puffy cloud shape
    const baseR = 20 * scale;
    g.fillCircle(0, 0, baseR);
    g.fillCircle(-baseR * 0.7, baseR * 0.2, baseR * 0.7);
    g.fillCircle(baseR * 0.7, baseR * 0.2, baseR * 0.8);
    g.fillCircle(baseR * 0.3, -baseR * 0.3, baseR * 0.6);

    g.setPosition(x, y);
    return g;
}

private createCloudLayer(count: number, alphaBase: number): Phaser.GameObjects.Graphics[] {
    const clouds: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < count; i++) {
        const x = Phaser.Math.Between(0, GAME.WIDTH);
        const y = Phaser.Math.Between(30, GAME.HEIGHT * 0.4);
        const scale = Phaser.Math.FloatBetween(0.5, 1.5);
        const alpha = alphaBase * Phaser.Math.FloatBetween(0.5, 1.0);
        clouds.push(this.createCloud(x, y, scale, alpha));
    }
    return clouds;
}
```

### Mountains / Hills

Sine waves or noise drawn to Graphics, layered with different opacities:

```typescript
private createHills(color: number, alpha: number, amplitude: number, frequency: number, yOffset: number, depth: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.fillStyle(color, alpha);
    g.beginPath();
    g.moveTo(0, GAME.HEIGHT);

    for (let x = 0; x <= GAME.WIDTH; x += 4) {
        const y = yOffset + Math.sin(x * frequency * 0.01) * amplitude
                           + Math.sin(x * frequency * 0.023) * (amplitude * 0.5);
        g.lineTo(x, y);
    }

    g.lineTo(GAME.WIDTH, GAME.HEIGHT);
    g.closePath();
    g.fillPath();
    g.setDepth(depth);
    return g;
}
```

### Ambient Particles

Use Phaser's particle system for dust, leaves, light motes — ambient life without assets:

```typescript
private createAmbientParticles(): void {
    // Create a tiny circle texture for particles
    const g = this.add.graphics();
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();

    this.add.particles(0, 0, 'particle', {
        x: { min: 0, max: GAME.WIDTH },
        y: { min: 0, max: GAME.HEIGHT },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.3, end: 0 },
        speed: { min: 5, max: 20 },
        lifespan: 4000,
        frequency: 500,
        blendMode: 'ADD',
        tint: PALETTE.HIGHLIGHT,
    });
}
```

## "Lighting" Without Shaders

### Vignette Overlay

Dark edges, transparent center — adds instant cinematic polish:

```typescript
private createVignette(): void {
    const g = this.add.graphics();
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;
    const r = Math.max(GAME.WIDTH, GAME.HEIGHT) * 0.7;

    // Radial gradient approximation with concentric rings
    const steps = 20;
    for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const alpha = (1 - t) * 0.6; // Max 0.6 opacity at edges
        g.fillStyle(0x000000, alpha);
        g.fillCircle(cx, cy, r * t + r * 0.3);
    }
    g.setDepth(1000); // Above everything
}
```

### Player Glow

Subtle radial gradient following the player:

```typescript
private createGlow(target: Phaser.GameObjects.GameObject, color: number, radius: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const steps = 10;
    for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        g.fillStyle(color, t * 0.15);
        g.fillCircle(0, 0, radius * (1 - t * 0.5));
    }
    g.setBlendMode(Phaser.BlendModes.ADD);
    return g;
}

// In update: glow.setPosition(player.x, player.y);
```

### Sun Rays

Additive blend mode on white/yellow shapes:

```typescript
private createSunRays(): void {
    const g = this.add.graphics();
    g.setBlendMode(Phaser.BlendModes.ADD);

    for (let i = 0; i < 5; i++) {
        const angle = Phaser.Math.DegToRad(-30 + i * 15);
        const length = GAME.HEIGHT * 1.5;
        g.fillStyle(0xffffff, 0.03);
        g.beginPath();
        g.moveTo(GAME.WIDTH * 0.8, 0);
        g.lineTo(
            GAME.WIDTH * 0.8 + Math.cos(angle) * length,
            Math.sin(angle) * length,
        );
        g.lineTo(
            GAME.WIDTH * 0.8 + Math.cos(angle + 0.05) * length,
            Math.sin(angle + 0.05) * length,
        );
        g.closePath();
        g.fillPath();
    }
    g.setDepth(50);
}
```

## Juice

### Squash & Stretch

Apply scale tweens on jumps, bounces, and landings:

```typescript
// On jump
this.tweens.add({
    targets: player,
    scaleX: 0.8,
    scaleY: 1.3,
    duration: 100,
    yoyo: true,
    ease: 'Quad.easeOut',
});

// Continuous velocity-based stretch (no tween needed)
update(): void {
    player.scaleY = 1 + (player.body!.velocity.y * 0.001);
    player.scaleX = 1 - (Math.abs(player.body!.velocity.y) * 0.0005);
}
```

### Screen Shake

On impacts, deaths, explosions:

```typescript
// Light shake
this.cameras.main.shake(100, 0.005);

// Heavy shake
this.cameras.main.shake(200, 0.015);
```

### Trail Effects

Spawn fading shapes behind moving objects:

```typescript
private spawnTrail(x: number, y: number, color: number): void {
    const trail = this.add.circle(x, y, 6, color, 0.5);
    this.tweens.add({
        targets: trail,
        alpha: 0,
        scale: 0.2,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => trail.destroy(),
    });
}

// Call in update for moving entities:
// if (frameCount % 3 === 0) this.spawnTrail(player.x, player.y, PALETTE.ACCENT);
```

### Flash Effects

Brief white flash on score, hit, or transition:

```typescript
private flash(duration = 100, color = 0xffffff): void {
    this.cameras.main.flash(duration,
        (color >> 16) & 0xff,
        (color >> 8) & 0xff,
        color & 0xff,
    );
}
```

### Slow Motion

Dramatic death or impact moments:

```typescript
private slowMo(durationMs: number, timeScale = 0.3): void {
    this.time.timeScale = timeScale;
    this.time.delayedCall(durationMs * timeScale, () => {
        this.time.timeScale = 1;
    });
}
```

### Easing Functions

Never use linear tweens. Always specify an easing:

| Effect | Easing |
|--------|--------|
| Jump / bounce | `Bounce.easeOut` |
| UI slide in | `Back.easeOut` |
| Fade out | `Quad.easeIn` |
| Score pop | `Elastic.easeOut` |
| Smooth movement | `Sine.easeInOut` |
| Impact | `Expo.easeOut` |

```typescript
// Score pop animation
private popScore(text: Phaser.GameObjects.Text): void {
    this.tweens.add({
        targets: text,
        scale: 1.5,
        duration: 150,
        yoyo: true,
        ease: 'Elastic.easeOut',
    });
}
```

## Drawing Game Entities with Graphics

### Simple Sprite-Like Entity

```typescript
private drawBird(g: Phaser.GameObjects.Graphics): void {
    // Body
    g.fillStyle(PALETTE.ACCENT);
    g.fillRoundedRect(-15, -12, 30, 24, 8);

    // Eye (white circle + black pupil)
    g.fillStyle(0xffffff);
    g.fillCircle(8, -4, 6);
    g.fillStyle(0x000000);
    g.fillCircle(10, -4, 3);

    // Beak
    g.fillStyle(PALETTE.HIGHLIGHT);
    g.fillTriangle(15, -2, 15, 6, 24, 2);

    // Wing
    g.fillStyle(PALETTE.FOREGROUND);
    g.fillEllipse(-4, 4, 16, 10);
}
```

### Animated Wing / Bobbing

```typescript
private wingAngle = 0;

update(delta: number): void {
    this.wingAngle += delta * 0.01;
    const wingY = Math.sin(this.wingAngle) * 3;
    // Redraw wing at offset wingY, or tween wing child object
}
```

## Checklist

When building an asset-free game, verify:

- [ ] Color palette defined in Constants (3-5 colors max)
- [ ] Gradient background (never flat solid)
- [ ] At least 2 parallax layers
- [ ] Ambient particles or drifting elements
- [ ] Squash/stretch on player movement
- [ ] Screen shake on impacts
- [ ] Eased tweens on all animations (never linear)
- [ ] Score/text pop on change
- [ ] Scene transitions (fade, flash, or slide)
- [ ] Consistent shape language (all rounded, or all angular — pick one)

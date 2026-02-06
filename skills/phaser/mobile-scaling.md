# Mobile Scaling & Responsive Games

## Choosing Dimensions

Pick your base dimensions based on your target platform:

| Target | Dimensions | Aspect Ratio | Use Case |
|--------|-----------|--------------|----------|
| Desktop-first | 800×600 or 1280×720 | 4:3 or 16:9 | Traditional browser games |
| Mobile-first portrait | 540×960 | 9:16 | Play.fun, mobile casual |
| Mobile-first landscape | 960×540 | 16:9 | Mobile action games |
| Square (universal) | 600×600 | 1:1 | Works on both, simpler |

**Rule of thumb**: If >50% of players are on mobile, use portrait 540×960.

## Phaser Scale Configuration

### Standard Setup (Recommended)

```typescript
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 540,   // Your chosen width
    height: 960,  // Your chosen height
  },
  // ... scenes, physics, etc.
};
```

### Scale Modes Explained

| Mode | Behavior | Best For |
|------|----------|----------|
| `FIT` | Scales to fit, maintains aspect ratio, letterboxes | Most games |
| `ENVELOP` | Scales to fill, maintains ratio, may crop | Full-bleed visuals |
| `RESIZE` | Canvas matches window, no scaling | Advanced responsive UI |
| `NONE` | Fixed size, no scaling | Pixel-perfect retro |

## CSS Requirements

### ✅ Correct CSS (Let Phaser Handle Centering)

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0a0f;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

#game-container {
  width: 100%;
  height: 100%;
  height: 100dvh;  /* Dynamic viewport height for mobile browsers */
  background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%);
}
```

### ❌ Wrong CSS (Causes Offset Issues)

```css
/* DON'T DO THIS - conflicts with Phaser's autoCenter */
#game-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* DON'T DO THIS - interferes with Phaser's canvas positioning */
#game-container canvas {
  max-width: 100%;
  max-height: 100%;
}
```

**Why**: Phaser's `autoCenter: CENTER_BOTH` applies its own centering via margins and positioning. Adding CSS flexbox centering causes a "double centering" conflict that pushes the canvas off-center.

## Letterboxing

When your game's aspect ratio doesn't match the screen, you get letterbox bars. Style them to match your game's aesthetic:

```css
#game-container {
  /* Flat color */
  background: #0a0a0f;
  
  /* Or themed gradient (recommended) */
  background: radial-gradient(ellipse at center, #1a0a2e 0%, #0f0f1a 50%, #0a0a0f 100%);
  
  /* Or subtle pattern */
  background: 
    linear-gradient(45deg, #111 25%, transparent 25%),
    linear-gradient(-45deg, #111 25%, transparent 25%);
  background-size: 20px 20px;
  background-color: #0a0a0f;
}
```

## Mobile Touch Input

Essential settings for mobile:

```typescript
const config = {
  // ...
  input: {
    activePointers: 3,  // Support multi-touch
    touch: {
      capture: true     // Prevent default touch behaviors
    }
  },
};
```

### HTML Touch Prevention

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

```css
html, body {
  touch-action: none;                    /* Prevent scroll/zoom */
  -webkit-touch-callout: none;           /* No callout on long-press */
  -webkit-tap-highlight-color: transparent;  /* No tap highlight */
}
```

## Common Issues & Fixes

### Game pushed to one side
**Cause**: CSS flexbox centering + Phaser's `autoCenter`  
**Fix**: Remove `display: flex`, `align-items`, `justify-content` from container

### Game looks tiny on desktop
**Cause**: Portrait dimensions (540×960) on landscape screen  
**Fix**: Add themed letterbox background, or use `RESIZE` mode with responsive UI

### Black bars look ugly
**Cause**: Plain background color on container  
**Fix**: Use gradient or pattern that matches game aesthetic

### Touch not working / page scrolls
**Cause**: Missing touch-action CSS or viewport meta  
**Fix**: Add `touch-action: none` and proper viewport meta tag

### Game blurry on mobile
**Cause**: Canvas scaled up from small base resolution  
**Fix**: Use higher base dimensions (540×960 not 270×480), or enable `pixelArt: true` for retro games

## Full Template

### index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>My Game</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #0a0a0f;
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    #game-container {
      width: 100%;
      height: 100%;
      height: 100dvh;
      background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%);
    }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

### main.ts

```typescript
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './core/Constants';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0a0a0f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  input: {
    activePointers: 3,
    touch: { capture: true }
  },
  scene: [MenuScene, GameScene, GameOverScene]
};

new Phaser.Game(config);
```

### Constants.ts

```typescript
// Mobile-first portrait dimensions
export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;

// Or desktop-first landscape
// export const GAME_WIDTH = 800;
// export const GAME_HEIGHT = 600;
```

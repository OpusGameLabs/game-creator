# Project Setup

## Quick Start

```bash
npx degit phaserjs/template-vite-ts my-game
cd my-game
npm install
npm run dev
```

## Directory Structure

```
src/
├── scenes/
│   ├── Boot.ts           # Minimal setup, start Preloader
│   ├── Preloader.ts      # Load all assets, show progress bar
│   ├── MainMenu.ts       # Title screen
│   ├── Game.ts           # Main gameplay
│   └── GameOver.ts       # End screen
├── objects/
│   ├── Player.ts         # Custom game objects
│   └── Enemy.ts
├── systems/              # ECS systems or managers
│   ├── AudioManager.ts
│   └── SaveManager.ts
├── utils/
│   └── helpers.ts
├── config.ts             # Phaser.Types.Core.GameConfig
└── main.ts               # Entry point
assets/
├── images/
├── audio/
├── tilemaps/
└── atlases/              # Texture atlas JSON + PNGs
```

## Game Configuration

```typescript
// src/config.ts
import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';

export const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 300 },
            debug: false,
        },
    },
    scene: [Boot, Preloader, MainMenu, Game, GameOver],
};
```

```typescript
// src/main.ts
import Phaser from 'phaser';
import { config } from './config';

new Phaser.Game(config);
```

## TypeScript Configuration

The template provides a working `tsconfig.json`. Key settings:

```json
{
    "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true
    },
    "include": ["src"]
}
```

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser'],
                },
            },
        },
    },
    server: {
        port: 8080,
    },
});
```

Splitting Phaser into its own chunk improves caching — the framework rarely changes between deploys.

## Asset Pipeline

- Use **TexturePacker** or **free-tex-packer** to create atlases
- Export as JSON Hash format (Phaser's default atlas format)
- Place atlas JSON + PNG pairs in `assets/atlases/`
- For audio, prefer `.ogg` (wide support) with `.mp3` fallback

## NPM Scripts

```json
{
    "scripts": {
        "dev": "vite",
        "build": "tsc && vite build",
        "preview": "vite preview"
    }
}
```

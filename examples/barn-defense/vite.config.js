import { defineConfig } from 'vite';

export default defineConfig({
  base: '/game-creator/barn-defense/',
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});

import { defineConfig } from 'vite';

export default defineConfig({
  base: '/game-creator/labyrinth/',
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});

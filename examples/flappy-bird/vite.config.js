import { defineConfig } from 'vite';

export default defineConfig({
  base: '/game-creator/flappy-bird/',
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});

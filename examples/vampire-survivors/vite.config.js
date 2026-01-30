import { defineConfig } from 'vite';

export default defineConfig({
  base: '/game-creator/vampire-survivors/',
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});

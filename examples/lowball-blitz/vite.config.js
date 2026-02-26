import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3008,
  },
  build: {
    target: 'esnext',
  },
});

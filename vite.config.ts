import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
    },
  },
  build: {
    target: 'es2023',
    chunkSizeWarningLimit: 2000,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'phaser', test: /node_modules[\\/]phaser[\\/]/ }],
        },
      },
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,mjs}'],
    environment: 'node',
  },
});

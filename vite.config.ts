import { defineConfig, type Plugin } from 'vitest/config';

const devFavicon: Plugin = {
  name: 'dev-favicon',
  apply: 'serve',
  transformIndexHtml: (html) => html.replace('href="/favicon.png"', 'href="/favicon-dev.png"'),
};

export default defineConfig({
  plugins: [devFavicon],
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

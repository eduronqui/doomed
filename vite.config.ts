import { defineConfig, type Plugin } from 'vitest/config';

const DEV_ASSETS: [string, string][] = [
  ['href="/favicon.png"', 'href="/favicon-dev.png"'],
  ['href="/apple-touch-icon.png"', 'href="/apple-touch-icon-dev.png"'],
  ['href="/manifest.webmanifest"', 'href="/manifest-dev.webmanifest"'],
];

const devAssets: Plugin = {
  name: 'dev-assets',
  apply: 'serve',
  transformIndexHtml: (html) => DEV_ASSETS.reduce((out, [prod, dev]) => out.replace(prod, dev), html),
};

export default defineConfig({
  plugins: [devAssets],
  server: {
    proxy: {
      '/signal': { target: 'http://localhost:8787', ws: true },
    },
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

import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';
import { encodePng } from './png.mjs';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { buildSheet } = await server.ssrLoadModule('/src/render/art/catalog.ts');
  const sheet = buildSheet();
  mkdirSync('public/assets', { recursive: true });
  writeFileSync('public/assets/sprites.png', encodePng(sheet.width, sheet.height, sheet.rgba));
  writeFileSync('public/assets/sprites.json', `${JSON.stringify(sheet.atlas, null, 2)}\n`);
  console.log(`Wrote public/assets/sprites.png (${sheet.width}x${sheet.height}, ${Object.keys(sheet.atlas.frames).length} frames)`);
} finally {
  await server.close();
}

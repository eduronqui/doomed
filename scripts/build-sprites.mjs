import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';
import { encodePng } from './png.mjs';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { buildSheet } = await server.ssrLoadModule('/src/render/art/catalog.ts');
  const sheet = buildSheet();
  mkdirSync('src/assets', { recursive: true });
  writeFileSync('src/assets/sprites.png', encodePng(sheet.width, sheet.height, sheet.rgba));
  writeFileSync('src/assets/sprites.json', `${JSON.stringify(sheet.atlas, null, 2)}\n`);
  console.log(`Wrote src/assets/sprites.png (${sheet.width}x${sheet.height}, ${Object.keys(sheet.atlas.frames).length} frames)`);
  const { drawCard } = await server.ssrLoadModule('/src/render/art/card.ts');
  const card = drawCard();
  writeFileSync('public/og.png', encodePng(card.width, card.height, card.rgba));
  console.log(`Wrote public/og.png (${card.width}x${card.height})`);
  const { ICONS, drawIcon } = await server.ssrLoadModule('/src/render/art/favicon.ts');
  for (const { file, size, background, palette } of ICONS) {
    const icon = drawIcon(size, background, palette);
    writeFileSync(`public/${file}`, encodePng(icon.size, icon.size, icon.rgba));
    console.log(`Wrote public/${file} (${size}x${size})`);
  }
} finally {
  await server.close();
}

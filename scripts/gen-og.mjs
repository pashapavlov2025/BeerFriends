// One-off script: convert public/og-image.svg → public/og-image.png
// (1200×630) so social platforms that require raster previews work.
// Rerun with: node scripts/gen-og.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '..', 'public', 'og-image.svg');
const pngPath = resolve(__dirname, '..', 'public', 'og-image.png');

const svg = readFileSync(svgPath);
const buf = await sharp(svg, { density: 200 })
  .resize(1200, 630)
  .png({ quality: 90, compressionLevel: 9 })
  .toBuffer();
writeFileSync(pngPath, buf);
console.log(`Wrote ${pngPath} (${buf.length} bytes)`);

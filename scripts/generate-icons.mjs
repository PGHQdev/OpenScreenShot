// Generates the extension icons (16/48/128 px) from a single SVG source.
// Run with: npm run icons
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const outDir = 'public/icons';

/**
 * "Ink viewfinder": capture brackets in warm ink around a coral shutter dot,
 * on a paper tile with a faint keyline. Flat color throughout — deliberately
 * apart from the blue-gradient tiles the screenshot category defaults to.
 * The keyline keeps the paper tile visible on light toolbars.
 */
function svg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect x="6" y="6" width="116" height="116" rx="30" fill="#FAFAF7"/>
  <rect x="7.5" y="7.5" width="113" height="113" rx="28.5" fill="none" stroke="#1B1A17" stroke-width="3" opacity="0.14"/>
  <g stroke="#1B1A17" stroke-width="11" stroke-linecap="round" fill="none">
    <path d="M30 46 v-8 a8 8 0 0 1 8 -8 h8"/>
    <path d="M82 30 h8 a8 8 0 0 1 8 8 v8"/>
    <path d="M98 82 v8 a8 8 0 0 1 -8 8 h-8"/>
    <path d="M46 98 h-8 a8 8 0 0 1 -8 -8 v-8"/>
  </g>
  <circle cx="64" cy="64" r="13" fill="#E8503A"/>
</svg>`;
}

await mkdir(outDir, { recursive: true });

for (const size of [16, 48, 128]) {
  await sharp(Buffer.from(svg())).resize(size, size).png().toFile(`${outDir}/icon${size}.png`);
  console.log(`✓ generated ${outDir}/icon${size}.png`);
}

// Website icons (docs/ is the static root for openscreenshot.app):
//  - favicon.ico  — multi-size ICO (PNG-compressed entries); /favicon.ico is
//    fetched by browsers, crawlers, and feed readers regardless of <link> tags
//  - apple-touch-icon.png — requested by iOS for Add to Home Screen
const webDir = 'docs';
await mkdir(webDir, { recursive: true });

const icoSizes = [16, 32, 48];
const pngs = await Promise.all(
  icoSizes.map((size) => sharp(Buffer.from(svg())).resize(size, size).png().toBuffer()),
);

// ICO container: header + per-image directory + PNG payloads.
const headerSize = 6;
const dirSize = 16 * pngs.length;
let offset = headerSize + dirSize;
const dir = Buffer.alloc(dirSize);
const parts = [];
for (let i = 0; i < pngs.length; i++) {
  const d = dir.subarray(i * 16, i * 16 + 16);
  d.writeUInt8(icoSizes[i] < 256 ? icoSizes[i] : 0, 0); // width
  d.writeUInt8(icoSizes[i] < 256 ? icoSizes[i] : 0, 1); // height
  d.writeUInt8(0, 2); // palette
  d.writeUInt8(0, 3); // reserved
  d.writeUInt16LE(1, 4); // color planes
  d.writeUInt16LE(32, 6); // bits per pixel
  d.writeUInt32LE(pngs[i].length, 8); // payload size
  d.writeUInt32LE(offset, 12); // payload offset
  offset += pngs[i].length;
  parts.push(pngs[i]);
}
const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type = icon
header.writeUInt16LE(pngs.length, 4); // image count
await writeFile(`${webDir}/favicon.ico`, Buffer.concat([header, dir, ...parts]));
console.log(`✓ generated ${webDir}/favicon.ico`);

await sharp(Buffer.from(svg())).resize(180, 180).png().toFile(`${webDir}/apple-touch-icon.png`);
console.log(`✓ generated ${webDir}/apple-touch-icon.png`);

console.log('Icons generated.');

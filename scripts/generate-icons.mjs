// Generates the extension icons (16/48/128 px) from a single SVG source.
// Run with: npm run icons
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const outDir = 'public/icons';

/**
 * A camera + page silhouette mark on a blue gradient rounded square.
 * Matches the design spec: recognizable at small sizes, distinct from GoFullPage.
 */
function svg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0A84FF"/>
      <stop offset="1" stop-color="#0071E3"/>
    </linearGradient>
  </defs>
  <rect x="6" y="6" width="116" height="116" rx="28" fill="url(#bg)"/>
  <!-- page silhouette behind the camera -->
  <rect x="42" y="30" width="50" height="64" rx="6" fill="#ffffff" opacity="0.32"/>
  <!-- camera body -->
  <rect x="34" y="52" width="60" height="42" rx="10" fill="#ffffff"/>
  <rect x="50" y="45" width="28" height="11" rx="4" fill="#ffffff"/>
  <!-- lens -->
  <circle cx="64" cy="73" r="13" fill="#0071E3"/>
  <circle cx="64" cy="73" r="6.5" fill="#0A84FF"/>
  <circle cx="60" cy="69" r="2.8" fill="#ffffff" opacity="0.85"/>
</svg>`;
}

await mkdir(outDir, { recursive: true });

for (const size of [16, 48, 128]) {
  await sharp(Buffer.from(svg())).png().toFile(`${outDir}/icon${size}.png`);
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
await writeFile(
  `${webDir}/favicon.ico`,
  Buffer.concat([header, dir, ...parts]),
);
console.log(`✓ generated ${webDir}/favicon.ico`);

await sharp(Buffer.from(svg()))
  .resize(180, 180)
  .png()
  .toFile(`${webDir}/apple-touch-icon.png`);
console.log(`✓ generated ${webDir}/apple-touch-icon.png`);

console.log('Icons generated.');

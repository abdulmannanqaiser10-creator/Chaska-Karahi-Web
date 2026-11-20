/**
 * Rasterises the brand assets from the single vector source in public/icon.svg.
 *
 * The signboard mark is drawn once, as SVG, and everything the browser and chat
 * apps actually load is derived from it here: the manifest PNGs, the ICO (a PNG
 * payload inside an ICONDIR, which every current browser accepts and which needs
 * no extra dependency) and the Open Graph card.
 *
 *   node scripts/brand-assets.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const frontendRoot = resolve(import.meta.dirname, '../../frontend');
const iconSvg = resolve(frontendRoot, 'public/icon.svg');

const BLACK = '#0c0c0e';
const GOLD = '#ffbd45';
const CREAM = '#faf8f3';

/** ICONDIR followed by one PNG per size — the shape Windows and favicons both read. */
function ico(sizes, pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);

  const offset = 6 + 16 * sizes.length;
  const entries = Buffer.alloc(16 * sizes.length);
  sizes.forEach((size, index) => {
    const at = 16 * index;
    entries.writeUInt8(size % 256 === 0 ? 0 : size, at);
    entries.writeUInt8(size % 256 === 0 ? 0 : size, at + 1);
    entries.writeUInt16LE(1, at + 4);
    entries.writeUInt16LE(32, at + 6);
    entries.writeUInt32LE(pngs[index].length, at + 8);
    entries.writeUInt32LE(offset + pngs.slice(0, index).reduce((n, p) => n + p.length, 0), at + 12);
  });

  return Buffer.concat([header, entries, ...pngs]);
}

async function writeIcons() {
  const sizes = [32, 48, 180, 512];
  const pngs = [];
  for (const size of sizes) {
    const info = await sharp(iconSvg, { density: 300 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
    pngs.push(info);
    if (size === 180 || size === 512) {
      writeFileSync(resolve(frontendRoot, `public/icon-${size}.png`), info);
      console.log(`  icon-${size}.png  ${(info.length / 1024).toFixed(0)} kB`);
    }
  }
  const sheet = ico([32, 48, 180], [pngs[0], pngs[1], pngs[2]]);
  writeFileSync(resolve(frontendRoot, 'public/icon.ico'), sheet);
  writeFileSync(resolve(frontendRoot, 'src/app/favicon.ico'), sheet);
  console.log(`  icon.ico + favicon.ico  ${(sheet.length / 1024).toFixed(0)} kB`);
}

/**
 * The card is the signboard redrawn at 1.9:1 — black, gold rules, the cloche-in-hand
 * mark and the name. No photograph: the board itself is type and mark only, and a flat
 * card stays a tenth of the weight of one that carries a raster.
 */
async function writeOpenGraph() {
  const mark = readFileSync(iconSvg, 'utf8')
    .replace(' width="64" height="64"', ` width="210" height="210" x="495" y="52"`)
    .replace('<rect width="64" height="64" fill="#0C0C0E" />', '')
    .replace(/<rect x="2\.6"[^>]*\/>/, '')
    .replace(/"gold"/, '"mark-gold"')
    .replace(/url\(#gold\)/g, 'url(#mark-gold)');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F8DE8B"/>
      <stop offset="0.4" stop-color="#DDAE3E"/>
      <stop offset="0.72" stop-color="#BC882A"/>
      <stop offset="1" stop-color="#82570F"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.34" r="0.72">
      <stop offset="0" stop-color="#1D1B16"/>
      <stop offset="1" stop-color="${BLACK}"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="22" y="22" width="1156" height="586" fill="none" stroke="url(#gold)" stroke-width="4"/>
  <rect x="34" y="34" width="1132" height="562" fill="none" stroke="url(#gold)" stroke-opacity="0.45" stroke-width="1.5"/>

  <g text-anchor="middle" font-family="Georgia, 'Times New Roman', serif">
    <text x="600" y="352" font-size="92" font-weight="bold" fill="url(#gold)">Chaska Koyla Karahi</text>
    <text x="600" y="414" font-family="Arial, Helvetica, sans-serif" font-size="26" letter-spacing="9" fill="${CREAM}" fill-opacity="0.78">PAKISTANI KARAHI &amp; CHARCOAL GRILL</text>
  </g>
  <rect x="440" y="452" width="320" height="2.5" fill="url(#gold)"/>
  <text x="600" y="512" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="${GOLD}">Chicken · Boneless · Mutton — Half and Full</text>
  <text x="600" y="562" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="23" letter-spacing="7" fill="${CREAM}" fill-opacity="0.6">ORDER ONLINE</text>
  ${mark}
</svg>`;

  const info = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(resolve(frontendRoot, 'public/og.png'));
  console.log(`  og.png  ${(info.size / 1024).toFixed(0)} kB`);
}

await writeIcons();
await writeOpenGraph();

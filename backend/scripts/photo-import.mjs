/**
 * Rasterises the generated dish photography into public/photos as optimised JPEGs.
 *
 * The source PNGs come from the image generator and land in vibe_images/ as
 * `<slug>_<timestamp>_<hash>.png`; the newest match per slug wins, so re-running after
 * regenerating one dish picks up the newer frame. sharp is already installed for
 * next/image, so the build stays dependency-free and the optimizer treats the output
 * like any other local photo.
 *
 *   node scripts/photo-import.mjs
 */
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const backendRoot = resolve(import.meta.dirname, '..');
const frontendRoot = resolve(backendRoot, '../frontend');
const srcDir = resolve(backendRoot, 'vibe_images');
const outDir = resolve(frontendRoot, 'public/photos');

/**
 * Only the slugs that exist as generator frames in vibe_images. The rest of the menu is
 * served from curated copies inside public/photos (the mutton cards, the breads, the
 * malai and lemon-chaska variants), and `chicken-white-karahi` / `boneless-white-karahi`
 * are deliberately left out because their files were swapped by hand — the generator
 * frames for those two are mislabelled, so re-importing them would put bone-in chicken
 * on the boneless card again.
 */
const DISHES = [
  // Chicken Karahi
  'chicken-shahi-karahi',
  'chicken-badshahi-karahi',
  'chicken-green-karahi',
  'chicken-brown-karahi',
  'chicken-lemon-chaska-white-karahi',
  // Chicken Boneless Karahi
  'boneless-shahi-karahi',
  'boneless-badshahi-karahi',
  'boneless-green-karahi',
  'boneless-malai-white-karahi',
  'boneless-lemon-chaska-karahi',
  // Mutton Karahi
  'mutton-green-karahi',
  'mutton-lemon-chaska-white-karahi',
  // Chaska Special
  'balochi-tikka',
  'beef-karahi',
  'keema-karahi',
  // Extras
  'salad',
  'raita',
  'cold-drink',
  'mineral-water-small',
  'mineral-water-large',
  'garlic-naan',
  'kulcha-naan',
  'chapati',
];
/** Wider than the 4:3 cards, because the hero band crops to it on desktop and on mobile. */
const HERO = { name: 'hero-karahi', out: 'hero-karahi.jpg', width: 1600, height: 1000 };

mkdirSync(outDir, { recursive: true });

const sources = readdirSync(srcDir);

function newestMatch(prefix) {
  const matches = sources
    .filter((file) => file.startsWith(`${prefix}_`) && file.endsWith('.png'))
    .sort();
  return matches[matches.length - 1];
}

async function convert(prefix, out, width, height) {
  const file = newestMatch(prefix);
  if (!file) {
    console.warn(`skip ${prefix}: no source png in vibe_images`);
    return null;
  }
  const target = resolve(outDir, out);
  const info = await sharp(resolve(srcDir, file))
    .resize({ width, height, fit: 'cover', position: 'centre' })
    .jpeg({ quality: 78, mozjpeg: true, progressive: true })
    .toFile(target);
  return { file, bytes: info.size };
}

let saved = 0;
let bytes = 0;

for (const slug of DISHES) {
  const result = await convert(slug, `${slug}.jpg`, 800, 600);
  if (result) {
    saved += 1;
    bytes += result.bytes;
    console.log(`  ${slug}.jpg  ${(result.bytes / 1024).toFixed(0)} kB`);
  }
}

const hero = await convert(HERO.name, HERO.out, HERO.width, HERO.height);
if (hero) console.log(`  ${HERO.out}  ${(hero.bytes / 1024).toFixed(0)} kB`);

if (!existsSync(resolve(outDir, 'hero-karahi.jpg'))) {
  console.warn('hero photo missing — the homepage will fall back to the illustrated hero');
}

console.log(`photos: ${saved} dishes + hero, ${bytes > 0 ? (bytes / 1024 / 1024).toFixed(1) : '0'} MB of dish art`);

/**
 * Wide "koyla" (charcoal) scenes used by the homepage hero and the story block.
 *
 * Same approach as scripts/dish-art.mjs: the art is authored as SVG in the repo and
 * rasterised with sharp, so no binary source files and no new dependencies.
 *
 *   node scripts/hero-art.mjs
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const frontendRoot = resolve(import.meta.dirname, '../../frontend');
const outDir = resolve(frontendRoot, 'public/images');

const W = 1200;
const H = 900;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const DEFS = `
<defs>
  <radialGradient id="night" cx="50%" cy="30%" r="78%">
    <stop offset="0" stop-color="#241814"/>
    <stop offset="0.55" stop-color="#150E0B"/>
    <stop offset="1" stop-color="#0A0605"/>
  </radialGradient>
  <radialGradient id="emberGlow" cx="50%" cy="78%" r="52%">
    <stop offset="0" stop-color="#E0492E" stop-opacity="0.55"/>
    <stop offset="0.5" stop-color="#B3121B" stop-opacity="0.22"/>
    <stop offset="1" stop-color="#B3121B" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="potMetal" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#4A3F39"/>
    <stop offset="0.4" stop-color="#241D1A"/>
    <stop offset="1" stop-color="#0E0A09"/>
  </linearGradient>
  <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#F2A03D"/>
    <stop offset="0.55" stop-color="#E0492E"/>
    <stop offset="1" stop-color="#B3121B" stop-opacity="0.2"/>
  </linearGradient>
  <radialGradient id="sauceGloss" cx="38%" cy="26%" r="62%">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.42"/>
    <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="blur18"><feGaussianBlur stdDeviation="18"/></filter>
</defs>`;

/** Glowing coal bed: irregular stones with hot cracks and ember dots between them. */
function coals({ y, spread, count, seed }) {
  const rand = rng(seed);
  const stones = [];
  const cracks = [];
  const embers = [];
  for (let i = 0; i < count; i += 1) {
    const cx = 600 + (rand() * 2 - 1) * spread;
    const cy = y + rand() * 92 - 20;
    const rx = 34 + rand() * 46;
    const ry = 20 + rand() * 20;
    const rot = Math.round(rand() * 180);
    const hot = rand() > 0.45;
    stones.push(
      `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}"
        transform="rotate(${rot} ${cx.toFixed(0)} ${cy.toFixed(0)})"
        fill="${hot ? '#3A211A' : '#241713'}"/>`,
    );
    if (hot) {
      cracks.push(
        `<path d="M${(cx - rx * 0.6).toFixed(0)} ${cy.toFixed(0)}q${(rx * 0.35).toFixed(0)} ${(-8 - rand() * 8).toFixed(0)} ${(rx * 1.1).toFixed(0)} ${(rand() * 6 - 3).toFixed(0)}"
          stroke="${rand() > 0.5 ? '#F2A03D' : '#E0492E'}" stroke-width="${(2.5 + rand() * 3).toFixed(1)}"
          fill="none" stroke-linecap="round" opacity="0.6"/>`,
      );
    }
    if (rand() > 0.55) {
      const ex = cx + rand() * rx - rx / 2;
      const ey = cy + ry * 0.7 + rand() * 14;
      embers.push(
        `<circle cx="${ex.toFixed(0)}" cy="${ey.toFixed(0)}" r="${(2.5 + rand() * 5).toFixed(1)}" fill="${rand() > 0.5 ? '#FFD9A0' : '#F2A03D'}" opacity="${(0.5 + rand() * 0.45).toFixed(2)}"/>`,
      );
    }
  }
  return `<g>
    ${stones.join('')}
    <g filter="url(#blur8)">${[...cracks, ...embers].join('')}</g>
    ${[...cracks, ...embers].join('')}
  </g>`;
}

function sparks(seed, count, box) {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const x = box[0] + rand() * (box[2] - box[0]);
    const y = box[1] + rand() * (box[3] - box[1]);
    const r = 1.6 + rand() * 3.4;
    out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="${rand() > 0.4 ? '#F2A03D' : '#FFD9A0'}" opacity="${(0.25 + rand() * 0.6).toFixed(2)}"/>`;
  }
  return `<g filter="url(#blur8)">${out}</g>`;
}

function flames(seed, cx, y, scale = 1, count = 5) {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const x = cx + (i - count / 2) * 62 * scale + rand() * 26 - 13;
    const h = (110 + rand() * 120) * scale;
    const w = (26 + rand() * 16) * scale;
    out += `<path d="M${x.toFixed(0)} ${(y - h).toFixed(0)}
      Q${(x + w).toFixed(0)} ${(y - h * 0.34).toFixed(0)} ${(x + w * 0.6).toFixed(0)} ${y.toFixed(0)}
      L${(x - w * 0.6).toFixed(0)} ${y.toFixed(0)}
      Q${(x - w).toFixed(0)} ${(y - h * 0.34).toFixed(0)} ${x.toFixed(0)} ${(y - h).toFixed(0)}Z"
      fill="url(#flame)" opacity="${(0.45 + rand() * 0.4).toFixed(2)}"/>`;
  }
  return `<g filter="url(#blur8)">${out}</g>`;
}

function steam(cx, y, scale = 1) {
  let out = '';
  for (let i = 0; i < 3; i += 1) {
    const x = cx + (i - 1) * 74 * scale;
    out += `<path d="M${x} ${y}c${-30 * scale} ${-58 * scale} ${34 * scale} ${-92 * scale} ${4 * scale} ${-152 * scale}"
      stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="${16 * scale}" fill="none" stroke-linecap="round"/>`;
  }
  return `<g filter="url(#blur8)">${out}</g>`;
}

function karahiOverFire({ sauce, sauceDeep, seed }) {
  const rand = rng(seed);
  const highlights = [];
  for (let i = 0; i < 26; i += 1) {
    const x = 430 + rand() * 340;
    const y = 372 + rand() * 46;
    highlights.push(
      `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="13" ry="5" fill="${sauceDeep}" opacity="0.6" transform="rotate(${Math.round(rand() * 180)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`,
    );
  }
  return `
  ${flames(seed + 5, 600, 640, 1.15, 7)}
  <g>
    <circle cx="272" cy="400" r="46" fill="none" stroke="#0E0A09" stroke-width="24"/>
    <circle cx="928" cy="400" r="46" fill="none" stroke="#0E0A09" stroke-width="24"/>
    <path d="M306 388c10 196 132 296 294 296s284-100 294-296z" fill="url(#potMetal)"/>
    <path d="M306 388c10 196 132 296 294 296s284-100 294-296z" fill="none" stroke="#4A3F39" stroke-width="6"/>
    <ellipse cx="600" cy="388" rx="298" ry="66" fill="#1A1310"/>
    <ellipse cx="600" cy="392" rx="268" ry="52" fill="${sauce}"/>
    <ellipse cx="600" cy="392" rx="268" ry="52" fill="url(#sauceGloss)"/>
    ${highlights.join('')}
    ${(() => {
      let slivers = '';
      for (let i = 0; i < 9; i += 1) {
        const x = 460 + rand() * 290;
        const yy = 366 + rand() * 52;
        const rot = Math.round(rand() * 180);
        const fill = ['#F2D34A', '#4E8C3A', '#F6E3C0'][i % 3];
        slivers += `<ellipse cx="${x.toFixed(0)}" cy="${yy.toFixed(0)}" rx="${(9 + rand() * 7).toFixed(0)}" ry="4" fill="${fill}" opacity="0.9" transform="rotate(${rot} ${x.toFixed(0)} ${yy.toFixed(0)})"/>`;
      }
      return slivers;
    })()}
    <ellipse cx="600" cy="388" rx="298" ry="66" fill="none" stroke="#5A4C44" stroke-width="7"/>
  </g>
  ${steam(600, 330, 1.2)}`;
}

function heroScene() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${DEFS}
  <rect width="${W}" height="${H}" fill="url(#night)"/>
  <rect width="${W}" height="${H}" fill="url(#emberGlow)"/>
  ${sparks(9, 46, [180, 120, 1020, 620])}
  ${coals({ y: 700, spread: 470, count: 26, seed: 3 })}
  <ellipse cx="600" cy="676" rx="300" ry="86" fill="#E0492E" opacity="0.4" filter="url(#blur18)"/>
  ${karahiOverFire({ sauce: '#A32B18', sauceDeep: '#6C160A', seed: 21 })}
  ${coals({ y: 792, spread: 520, count: 16, seed: 77 })}
  <rect width="${W}" height="${H}" fill="url(#emberGlow)" opacity="0.35"/>
</svg>`;
}

function grillScene() {
  const grate = `<rect x="196" y="330" width="808" height="308" rx="40"/>`;
  const skewers = [];
  const rand = rng(44);
  for (let i = 0; i < 3; i += 1) {
    const y = 404 + i * 92;
    const bits = [];
    for (let k = 0; k < 4; k += 1) {
      const x = 330 + k * 150 + (i % 2 ? 46 : -34) + rand() * 30 - 15;
      const jitter = Math.round(rand() * 18 - 9);
      bits.push(
        `<g transform="rotate(${Math.round(rand() * 14 - 7)} ${x} ${y})">
          <rect x="${x - 46}" y="${y - 34 + jitter}" width="94" height="70" rx="22" fill="#B34424"/>
          <rect x="${x - 46}" y="${y - 34 + jitter}" width="94" height="24" rx="12" fill="#FFFFFF" opacity="0.14"/>
          <path d="M${x - 32} ${y + 18 + jitter}q32 16 64 0" stroke="#3A1F12" stroke-width="9" fill="none" opacity="0.6" stroke-linecap="round"/>
        </g>`,
      );
    }
    skewers.push(
      `<g><path d="M244 ${y}h672" stroke="#C9A06A" stroke-width="12" stroke-linecap="round"/>${bits.join('')}</g>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${DEFS}
  <clipPath id="grillBox">${grate}</clipPath>
  <rect width="${W}" height="${H}" fill="url(#night)"/>
  <rect width="${W}" height="${H}" fill="url(#emberGlow)"/>
  ${sparks(17, 40, [220, 90, 980, 520])}
  ${flames(23, 600, 742, 1.35, 8)}
  ${coals({ y: 742, spread: 470, count: 24, seed: 51 })}
  <ellipse cx="600" cy="700" rx="330" ry="72" fill="#E0492E" opacity="0.45" filter="url(#blur18)"/>
  <g>
    ${grate.replace('<rect', '<rect fill="#1B1310"')}
    <g clip-path="url(#grillBox)">
      <g stroke="#5A4C44" stroke-width="7" opacity="0.75">
        <path d="M196 392h808M196 488h808M196 584h808"/>
      </g>
      ${skewers.join('')}
    </g>
    ${grate.replace('<rect', '<rect fill="none" stroke="#6B5A50" stroke-width="8"')}
  </g>
  ${steam(600, 320, 1)}
</svg>`;
}

const SCENES = {
  'hero-karahi.jpg': heroScene(),
  'charcoal-grill.jpg': grillScene(),
};

for (const [file, svg] of Object.entries(SCENES)) {
  const buffer = await sharp(Buffer.from(svg), { density: 200 })
    .resize({ width: W, height: H, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten({ background: '#0A0605' })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
  writeFileSync(resolve(outDir, file), buffer);
  console.log('hero art written:', file);
}

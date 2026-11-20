/**
 * Renders the Chaska Koyla Karahi dish set into public/products as JPEGs.
 *
 * The illustrations are authored as SVG (editable, re-renderable, deterministic) and
 * rasterised with sharp, which is already installed for next/image — so the build stays
 * dependency-free and the optimizer treats the output like any other local photo.
 *
 *   node scripts/dish-art.mjs            # render everything
 *   node scripts/dish-art.mjs naan roti  # render a subset while iterating
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const frontendRoot = resolve(import.meta.dirname, '../../frontend');
const outDir = resolve(frontendRoot, 'public/products');

const W = 800;
const H = 600;

/** Deterministic pseudo-random so re-running reproduces identical art. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const DEFS = `
<defs>
  <radialGradient id="table" cx="50%" cy="36%" r="80%">
    <stop offset="0" stop-color="#FFF9F3"/>
    <stop offset="0.6" stop-color="#F7EADC"/>
    <stop offset="1" stop-color="#EBD6C1"/>
  </radialGradient>
  <linearGradient id="potMetal" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3B322D"/>
    <stop offset="0.35" stop-color="#241D1A"/>
    <stop offset="1" stop-color="#120E0C"/>
  </linearGradient>
  <linearGradient id="steel" x1="0" y1="0" x2="0.25" y2="1">
    <stop offset="0" stop-color="#FBFCFE"/>
    <stop offset="0.45" stop-color="#CFD4DD"/>
    <stop offset="1" stop-color="#98A0AF"/>
  </linearGradient>
  <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/>
    <stop offset="1" stop-color="#EDE3DA"/>
  </linearGradient>
  <radialGradient id="gloss" cx="34%" cy="22%" r="62%">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.5"/>
    <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <filter id="soft" x="-30%" y="-60%" width="160%" height="220%">
    <feGaussianBlur stdDeviation="16"/>
  </filter>
  <filter id="tight" x="-30%" y="-140%" width="160%" height="380%">
    <feGaussianBlur stdDeviation="5"/>
  </filter>
</defs>`;

/** Contact shadow instead of a floating white disc. */
function ground(rx = 250, ry = 34, cy = 486) {
  return `<ellipse cx="400" cy="${cy}" rx="${rx}" ry="${ry}" fill="#3B2A20" opacity="0.16" filter="url(#soft)"/>
  <ellipse cx="400" cy="${cy - Math.round(ry * 0.45)}" rx="${Math.round(rx * 0.72)}" ry="${Math.max(8, Math.round(ry * 0.34))}" fill="#3B2A20" opacity="0.2" filter="url(#tight)"/>`;
}

function frame(body, clips = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${DEFS}${clips}
<rect width="${W}" height="${H}" fill="url(#table)"/>
${body}
</svg>`;
}

function clip(id, shape, body) {
  return {
    defs: `<clipPath id="${id}">${shape}</clipPath>`,
    body: `<g clip-path="url(#${id})">${body}</g>`,
  };
}

/** Irregular closed blob — fried food should never be a perfect circle. */
function blobPath(cx, cy, r, seed = 5, points = 12, wobble = 0.3) {
  const rand = rng(seed);
  const pts = [];
  for (let i = 0; i < points; i += 1) {
    const a = (Math.PI * 2 * i) / points;
    const rr = r * (1 - wobble / 2 + rand() * wobble);
    pts.push([cx + Math.cos(a) * rr * 1.15, cy + Math.sin(a) * rr * 0.92]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < points; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % points];
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    d += `Q${a[0].toFixed(1)} ${a[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  return `${d}Z`;
}

/** Cardamom pods, cloves and a bay leaf — the aromatics that make plain rice read as cooked. */
function wholeSpices(seed = 25) {
  const rand = rng(seed + 90);
  const spots = [
    [318, 262], [400, 232], [472, 276], [356, 330], [438, 322],
  ];
  return spots
    .map(([x, y], i) => {
      const rot = Math.round(rand() * 40 - 20);
      if (i === 3) {
        return `<path transform="rotate(${rot} ${x} ${y})" d="M${x - 34} ${y}c16-18 52-18 68 0-16 18-52 18-68 0z" fill="#BFA478" opacity="0.95"/>
        <path transform="rotate(${rot} ${x} ${y})" d="M${x - 28} ${y}h56" stroke="#A28856" stroke-width="3"/>`;
      }
      if (i % 2) {
        return `<g transform="rotate(${rot} ${x} ${y})">
          <ellipse cx="${x}" cy="${y}" rx="17" ry="12" fill="#8FA36B"/>
          <path d="M${x - 14} ${y}h28" stroke="#6E8351" stroke-width="4"/>
          <path d="M${x} ${y - 12}v-7" stroke="#6E8351" stroke-width="4" stroke-linecap="round"/>
        </g>`;
      }
      return `<g transform="rotate(${rot} ${x} ${y})">
        <path d="M${x} ${y - 14}l6 14-6 14-6-14z" fill="#6B3A16"/>
        <circle cx="${x}" cy="${y - 16}" r="7" fill="#8B5A2B"/>
      </g>`;
    })
    .join('');
}

/** Rotated ellipse confetti (grains, herbs, blisters) inside a box. */function specks(seed, count, box, color, size, opacity = 0.9) {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const x = box[0] + rand() * (box[2] - box[0]);
    const y = box[1] + rand() * (box[3] - box[1]);
    const r = size * (0.6 + rand() * 0.8);
    const rot = Math.round(rand() * 180);
    out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * 0.42).toFixed(1)}" fill="${color}" opacity="${opacity}" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  return out;
}

function lemonWedge(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale}) rotate(-12)">
    <path d="M0 0a54 54 0 0 1 47 27 54 54 0 0 1-47 27z" fill="#F4D656"/>
    <path d="M4 6a46 46 0 0 1 40 21 46 46 0 0 1-40 21z" fill="#FBEEA6"/>
    <path d="M8 27h38M22 9l14 36M22 45l14-36" stroke="#F4D656" stroke-width="4"/>
    <path d="M0 0a54 54 0 0 1 47 27 54 54 0 0 1-47 27z" fill="none" stroke="#D9B62E" stroke-width="4"/>
  </g>`;
}

function herbSprig(x, y, scale = 1, color = '#2F6B34') {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}">
    <path d="M0 0c14-10 30-8 36 4-14 10-30 8-36-4z"/>
    <path d="M2 14c12-12 28-14 38-4-10 12-26 14-38 4z" opacity="0.82"/>
    <path d="M-4 22c10-6 22-4 28 4-10 6-22 4-28-4z" opacity="0.7"/>
  </g>`;
}

/** Small mint/coriander garnish: leaves sharing one stem point so it reads as a pile, not confetti. */
function greensPile(x, y, scale = 1, seed = 5) {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    const a = -160 + i * 34 + rand() * 14;
    const len = 26 + rand() * 12;
    out += `<g transform="rotate(${a.toFixed(0)})">
      <path d="M0 0c${(len * 0.4).toFixed(0)} ${-9 - rand() * 4} ${(len * 0.8).toFixed(0)} ${-7 - rand() * 3} ${len.toFixed(0)} 0-${(len * 0.4).toFixed(0)} 7-${(len * 0.8).toFixed(0)} 6-${len.toFixed(0)} 0z"
        fill="${i % 2 ? '#3F7A3F' : '#2F6B34'}" opacity="${(0.82 + rand() * 0.18).toFixed(2)}"/>
    </g>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${scale})">${out}</g>`;
}

/* ------------------------------------------------------------------ karahi */

function karahi({ sauce, sauceDeep, garnish = '#2F6B34', chili = '#C22B22', highlights = 26, seed = 7 }) {
  return frame(`${ground(236, 30, 494)}
  <g>
    <circle cx="122" cy="268" r="30" fill="none" stroke="#241D1A" stroke-width="17"/>
    <circle cx="678" cy="268" r="30" fill="none" stroke="#241D1A" stroke-width="17"/>
    <path d="M148 262c6 132 108 208 252 208s246-76 252-208z" fill="url(#potMetal)"/>
    <ellipse cx="400" cy="262" rx="252" ry="52" fill="#2E2622"/>
    <ellipse cx="400" cy="264" rx="228" ry="42" fill="${sauce}"/>
    <ellipse cx="400" cy="264" rx="228" ry="42" fill="url(#gloss)"/>
    ${specks(seed + 1, highlights, [200, 236, 600, 292], sauceDeep, 12, 0.55)}
    ${specks(seed + 2, 16, [230, 240, 570, 288], garnish, 9, 0.95)}
    <path d="M318 252c22-8 44-6 62 4" stroke="${chili}" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.9"/>
    <path d="M436 272c20-10 42-9 60 1" stroke="${chili}" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.85"/>
    ${specks(seed + 3, 10, [260, 244, 540, 284], '#F6E3C0', 6, 0.75)}
    ${herbSprig(250, 236, 0.7)}${herbSprig(498, 250, 0.6, '#3F7A3F')}
    <ellipse cx="400" cy="262" rx="252" ry="52" fill="none" stroke="#4A3F39" stroke-width="5"/>
  </g>`);
}

/* ------------------------------------------------------------------ rice */

function riceDish({ grain, grainDeep, topping, pieces = 4, style = 'biryani', seed = 21, extra = '' }) {
  const dome = 'M186 404C196 266 288 194 400 194s204 72 214 210z';
  const rand = rng(seed + 40);
  const chunks = [];
  for (let i = 0; i < pieces; i += 1) {
    const x = 262 + i * (280 / Math.max(pieces, 1)) + rand() * 22;
    const y = 262 + rand() * 60;
    chunks.push(
      `<g transform="rotate(${Math.round(rand() * 26 - 13)} ${x.toFixed(0)} ${y.toFixed(0)})">
        <rect x="${(x - 36).toFixed(0)}" y="${(y - 24).toFixed(0)}" width="72" height="48" rx="17" fill="${topping}"/>
        <rect x="${(x - 36).toFixed(0)}" y="${(y - 24).toFixed(0)}" width="72" height="17" rx="9" fill="#FFFFFF" opacity="0.18"/>
        <path d="M${(x - 26).toFixed(0)} ${(y + 12).toFixed(0)}q26 10 52-2" stroke="#00000055" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>`,
    );
  }
  const inner = clip(
    `dome${seed}`,
    `<path d="${dome}"/>`,
    `
    <path d="${dome}" fill="${grain}"/>
    ${specks(seed, 210, [200, 210, 600, 400], '#FFFFFF', 11, 0.32)}
    ${specks(seed + 1, 74, [210, 220, 590, 396], grainDeep, 12, 0.5)}
    ${style === 'biryani' ? specks(seed + 2, 30, [230, 220, 570, 340], '#6B3A16', 11, 0.75) : ''}
    ${chunks.join('')}
    ${style === 'biryani' ? specks(seed + 3, 20, [240, 230, 560, 360], '#2F6B34', 8, 0.9) : ''}
    ${extra}
    <path d="${dome}" fill="url(#gloss)"/>`,
  );
  return frame(
    `${ground(272, 34, 470)}
  <g>
    <ellipse cx="400" cy="416" rx="288" ry="92" fill="url(#plate)"/>
    <ellipse cx="400" cy="416" rx="288" ry="92" fill="none" stroke="#E4D7CA" stroke-width="4"/>
    <ellipse cx="400" cy="406" rx="236" ry="66" fill="#F6EDE3"/>
    ${inner.body}
    ${lemonWedge(556, 330, 0.9)}
    ${greensPile(236, 372, 0.95, seed + 7)}
  </g>`,
    inner.defs,
  );
}

/* ------------------------------------------------------------------ bbq */

function skewers({ chunk, count = 3, shape = 'cube', char = '#3A1F12', seed = 33 }) {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const y = 244 + i * 66;
    const rand = rng(seed + i * 17);
    const bits = [];
    for (let k = 0; k < 4; k += 1) {
      const x = 240 + k * 84 + (i % 2 === 0 ? 16 : -14) + rand() * 26 - 13;
      const jitter = Math.round(rand() * 12 - 6);
      const rot = Math.round(rand() * 10 - 5);
      bits.push(
        shape === 'kabab'
          ? `<g transform="rotate(${rot} ${x} ${y})">
              <rect x="${x - 38}" y="${y - 21 + jitter}" width="84" height="42" rx="21" fill="${chunk}"/>
              <rect x="${x - 38}" y="${y - 21 + jitter}" width="84" height="14" rx="7" fill="#FFFFFF" opacity="0.16"/>
              <path d="M${x - 24} ${y + 4 + jitter}h56M${x - 18} ${y + 13 + jitter}h44" stroke="${char}" stroke-width="5" opacity="0.5" stroke-linecap="round"/>
            </g>`
          : `<g transform="rotate(${rot} ${x} ${y})">
              <rect x="${x - 32}" y="${y - 26 + jitter}" width="66" height="52" rx="16" fill="${chunk}"/>
              <rect x="${x - 32}" y="${y - 26 + jitter}" width="66" height="18" rx="9" fill="#FFFFFF" opacity="0.18"/>
              <path d="M${x - 22} ${y + 14 + jitter}q25 12 50 0" stroke="${char}" stroke-width="7" fill="none" opacity="0.55" stroke-linecap="round"/>
            </g>`,
      );
    }
    rows.push(
      `<g><path d="M176 ${y}h452" stroke="#C9A06A" stroke-width="9" stroke-linecap="round"/>${bits.join('')}</g>`,
    );
  }
  return frame(`${ground(268, 32, 486)}
  <g>
    <rect x="126" y="168" width="548" height="298" rx="48" fill="url(#steel)"/>
    <rect x="146" y="186" width="508" height="262" rx="36" fill="#FFFFFF" opacity="0.34"/>
    ${rows.join('')}
    ${lemonWedge(158, 388, 0.8)}
    ${greensPile(520, 430, 1, seed + 3)}
    <g>
      <circle cx="252" cy="432" r="21" fill="#F6E9F2" stroke="#9C5F96" stroke-width="6"/>
      <circle cx="252" cy="432" r="11" fill="none" stroke="#B884B0" stroke-width="4"/>
      <circle cx="298" cy="440" r="16" fill="#F6E9F2" stroke="#9C5F96" stroke-width="5"/>
    </g>
    <rect x="126" y="168" width="548" height="298" rx="48" fill="none" stroke="#8A93A3" stroke-width="5" opacity="0.55"/>
  </g>`);
}

/* ------------------------------------------------------------------ burgers & sandwiches */

function cheeseDrip(color = '#F2C240') {
  return `<path d="M196 352h408v12c-24 0-28 24-52 24s-28-24-52-24-28 24-52 24-28-24-52-24-28 24-52 24-28-24-52-24-28 22-50 22-30-22-52-22h-12z" fill="${color}"/>`;
}

function burgerDish({ bun = '#E7B163', bunDark = '#C98A3D', patty, crispy = false, extra = '' }) {
  const pattyArt = crispy
    ? `<g>
        <path d="M182 330c22-16 44 6 66-8s44 10 66-4 44 12 66 0 44 10 66-2 40 8 56 2v46c-18 8-40-2-58 4-22 8-44-4-66 2-22 8-44-4-66 2-22 8-44-4-66 2-22 6-44-4-64 2z" fill="${patty}"/>
        ${specks(201, 26, [200, 322, 600, 372], '#A8641F', 9, 0.65)}
      </g>`
    : `<g>
        <rect x="184" y="330" width="432" height="46" rx="18" fill="${patty}"/>
        <rect x="184" y="330" width="432" height="15" rx="8" fill="#FFFFFF" opacity="0.14"/>
      </g>`;
  return frame(`${ground(214, 26, 470)}
  <g>
    <ellipse cx="400" cy="452" rx="228" ry="40" fill="url(#plate)"/>
    <ellipse cx="400" cy="452" rx="228" ry="40" fill="none" stroke="#E4D7CA" stroke-width="3"/>
    <path d="M196 300c0-86 92-136 204-136s204 50 204 136z" fill="${bun}"/>
    ${specks(51, 24, [242, 200, 558, 268], '#FFF3DC', 8, 0.9)}
    <path d="M196 300c0-86 92-136 204-136s204 50 204 136z" fill="url(#gloss)"/>
    <path d="M198 306h404" stroke="${bunDark}" stroke-width="7" opacity="0.4"/>
    <path d="M186 320c28 22 66 22 96 0 30 22 68 22 98 0 30 22 68 22 98 0 26 20 58 20 84 0" fill="#4E8C3A"/>
    ${pattyArt}
    ${extra}
    <path d="M196 380c0 44 92 70 204 70s204-26 204-70z" fill="${bun}"/>
    <path d="M196 380c0 44 92 70 204 70s204-26 204-70z" fill="#000000" opacity="0.07"/>
    <path d="M212 396h376" stroke="${bunDark}" stroke-width="6" opacity="0.35"/>
  </g>`);
}

function wrap() {
  const roll = 'M322 152 334 452q66 26 132 0l12-300q-78-30-156 0z';
  return frame(`${ground(150, 22, 486)}
  <g transform="rotate(-7 400 300)">
    <path d="${roll}" fill="#EFD9AE"/>
    ${specks(61, 30, [330, 168, 470, 320], '#D2A567', 11, 0.55)}
    <path d="M330 300q70 22 140 0" stroke="#D2A567" stroke-width="5" fill="none" opacity="0.6"/>
    <path d="M336 380q64 24 128 0" stroke="#C79A5C" stroke-width="5" fill="none" opacity="0.5"/>
    <ellipse cx="400" cy="152" rx="78" ry="24" fill="#E4CFA4"/>
    <ellipse cx="400" cy="152" rx="64" ry="17" fill="#D8BE8C"/>
    <g>
      <path d="M344 150c14-26 40-32 56-16 16-16 42-10 56 16" fill="#D89A4B"/>
      ${specks(72, 12, [348, 118, 452, 150], '#A8641F', 7, 0.7)}
      <path d="M336 148c10-14 22-18 30-12-8 10-10 18-8 26-8 2-18-4-22-14z" fill="#4E8C3A"/>
      <path d="M464 146c-10-14-22-18-30-12 8 10 10 18 8 26 8 2 18-4 22-14z" fill="#5C9A44"/>
      <circle cx="382" cy="132" r="15" fill="#B3121B"/>
      <circle cx="424" cy="140" r="12" fill="#C22B22"/>
      <path d="M356 140q14 16 30 6t30 8" stroke="#FFFFFF" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.92"/>
    </g>
    <path d="M334 268q66 24 132 0l-12 184q-66 26-132 0z" fill="#FBF6EE"/>
    <path d="M334 268q66 24 132 0" stroke="#E4D8C8" stroke-width="5" fill="none"/>
    <path d="M368 274l-8 190M432 274l8 190" stroke="#EFE6D6" stroke-width="6"/>
    <path d="${roll}" fill="url(#gloss)"/>
    <path d="${roll}" fill="none" stroke="#D2A567" stroke-width="4" opacity="0.7"/>
  </g>`);
}

function clubSandwich() {
  return frame(`${ground(214, 26, 470)}
  <g>
    <ellipse cx="400" cy="450" rx="236" ry="38" fill="url(#plate)"/>
    <g transform="translate(214 208)">
      <path d="M0 200L176 0 176 200Z" fill="#E7B163"/>
      <path d="M8 186h164" stroke="#4E8C3A" stroke-width="13"/>
      <path d="M18 158h158" stroke="#B3121B" stroke-width="13"/>
      <path d="M28 130h148" stroke="#F2C240" stroke-width="13"/>
      <path d="M38 104h138" stroke="#C98A3D" stroke-width="11"/>
      <path d="M0 200L176 0 176 200Z" fill="url(#gloss)"/>
      <path d="M0 200L176 0 176 200Z" fill="none" stroke="#C98A3D" stroke-width="6"/>
    </g>
    <g transform="translate(410 248)">
      <path d="M176 160L0 160 176 0Z" fill="#EABF76"/>
      <path d="M168 148H20" stroke="#4E8C3A" stroke-width="12"/>
      <path d="M158 122H30" stroke="#B3121B" stroke-width="12"/>
      <path d="M148 96H40" stroke="#F2C240" stroke-width="12"/>
      <path d="M176 160L0 160 176 0Z" fill="#000000" opacity="0.05"/>
      <path d="M176 160L0 160 176 0Z" fill="none" stroke="#C98A3D" stroke-width="6"/>
    </g>
    <path d="M380 126v96" stroke="#8E93A3" stroke-width="5"/>
    <circle cx="380" cy="122" r="9" fill="#B3121B"/>
  </g>`);
}

function fries() {
  const sticks = [];
  const rand = rng(77);
  for (let i = 0; i < 14; i += 1) {
    const x = 296 + i * 15;
    const y = 206 + rand() * 44;
    sticks.push(
      `<g transform="rotate(${Math.round(rand() * 14 - 7)} ${x} ${y})"><rect x="${x}" y="${y}" width="19" height="188" rx="7" fill="#EFBE55"/><rect x="${x}" y="${y}" width="19" height="34" rx="7" fill="#FBE0A0"/></g>`,
    );
  }
  return frame(`${ground(150, 22, 476)}
  <g>
    ${sticks.join('')}
    <path d="M282 296h236l-30 178H312z" fill="#B3121B"/>
    <path d="M296 344h208" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="11"/>
    <path d="M318 296h164v36H318z" fill="#8B0D14" opacity="0.5"/>
    <path d="M282 296h236" stroke="#8B0D14" stroke-width="7"/>
    <path d="M282 296h236l-30 178H312z" fill="url(#gloss)"/>
  </g>`);
}

function pizza() {
  const cuts = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    cuts.push(
      `<path d="M400 320 L${(400 + Math.cos(a) * 176).toFixed(0)} ${(320 + Math.sin(a) * 176).toFixed(0)}" stroke="#C98A3D" stroke-width="6" opacity="0.55"/>`,
    );
  }
  const rand = rng(91);
  const pepperoni = [];
  for (let i = 0; i < 9; i += 1) {
    const a = rand() * Math.PI * 2;
    const r = 40 + rand() * 118;
    const x = (400 + Math.cos(a) * r).toFixed(0);
    const y = (320 + Math.sin(a) * r).toFixed(0);
    pepperoni.push(`<circle cx="${x}" cy="${y}" r="22" fill="#B3121B"/><circle cx="${x}" cy="${y}" r="22" fill="#FFFFFF" opacity="0.1"/>`);
  }
  const topping = clip(
    'pizzaTop',
    `<circle cx="400" cy="320" r="176"/>`,
    `<circle cx="400" cy="320" r="176" fill="#E8B84B"/>
     ${specks(92, 30, [250, 190, 550, 450], '#F7E3AE', 12, 0.45)}
     ${pepperoni.join('')}
     ${specks(93, 24, [262, 200, 538, 440], '#2F6B34', 9, 0.9)}
     <circle cx="400" cy="320" r="176" fill="url(#gloss)"/>`,
  );
  return frame(
    `${ground(214, 28, 500)}
  <g>
    <circle cx="400" cy="320" r="212" fill="#E7B163"/>
    <circle cx="400" cy="320" r="212" fill="none" stroke="#C98A3D" stroke-width="8"/>
    ${topping.body}
    ${cuts.join('')}
  </g>`,
    topping.defs,
  );
}

function crispyChicken() {
  const pieces = [];
  const rand = rng(101);
  const spots = [
    [268, 288, 62], [400, 268, 58], [528, 296, 60],
    [300, 386, 56], [432, 396, 62], [552, 380, 50],
  ];
  spots.forEach(([x, y, r], i) => {
    const cx = x + rand() * 14 - 7;
    const cy = y + rand() * 12 - 6;
    const rot = Math.round(rand() * 40 - 20);
    const blob = blobPath(cx, cy, r, 101 + i * 7, 12, 0.34);
    const flakes = blobPath(cx, cy, r * 0.94, 401 + i * 11, 18, 0.42);
    pieces.push(
      `<g transform="rotate(${rot} ${cx} ${cy})">
        <path d="${flakes}" fill="#E8B96B"/>
        <path d="${blob}" fill="#D89A4B"/>
        <path d="${blobPath(cx, cy, r * 0.78, 201 + i * 5, 11, 0.4)}" fill="#C4813A" opacity="0.5"/>
        ${specks(101 + i, 16, [cx - r, cy - r * 0.8, cx + r, cy + r * 0.8], '#A8641F', 8, 0.6)}
        ${specks(301 + i, 9, [cx - r * 0.8, cy - r * 0.6, cx + r * 0.8, cy + r * 0.6], '#F5D79A', 7, 0.85)}
        <path d="${blob}" fill="url(#gloss)"/>
      </g>`,
    );
  });
  return frame(`${ground(250, 30, 476)}
  <g>
    <ellipse cx="400" cy="446" rx="266" ry="62" fill="url(#plate)"/>
    <ellipse cx="400" cy="440" rx="212" ry="44" fill="#F6EDE3"/>
    ${pieces.join('')}
    ${lemonWedge(540, 372, 0.8)}
    ${greensPile(252, 418, 0.9, 71)}
    <ellipse cx="400" cy="446" rx="266" ry="62" fill="none" stroke="#E4D7CA" stroke-width="3"/>
  </g>`);
}

/* ------------------------------------------------------------------ drinks & extras */

function glass({ liquid, liquidDeep, bubbles = true, seed = 141 }) {
  const contents = clip(
    `liq${seed}`,
    `<path d="M322 200h156l-13 244H335z"/>`,
    `<path d="M322 200h156l-13 244H335z" fill="${liquid}"/>
     ${bubbles ? specks(seed, 24, [336, 220, 464, 424], '#FFFFFF', 8, 0.45) : ''}
     <g opacity="0.5" fill="#FFFFFF">
       <rect x="352" y="248" width="42" height="34" rx="8" transform="rotate(-12 373 265)"/>
       <rect x="404" y="300" width="38" height="32" rx="8" transform="rotate(14 423 316)"/>
       <rect x="360" y="352" width="40" height="32" rx="8" transform="rotate(-8 380 368)"/>
     </g>
     <path d="M322 200h156l-13 244H335z" fill="url(#gloss)"/>`,
  );
  return frame(`${ground(132, 20, 462)}
  <g>
    <path d="M312 150h176l-18 300H330z" fill="#FFFFFF" opacity="0.5"/>
    ${contents.body}
    <ellipse cx="400" cy="200" rx="78" ry="15" fill="${liquidDeep}"/>
    <path d="M312 150h176" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="8"/>
    <path d="M446 104l-16 250" stroke="#B3121B" stroke-width="14" stroke-linecap="round"/>
    <path d="M330 450h140" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="6"/>
    <path d="M312 150h176l-18 300H330z" fill="none" stroke="#E4D7CA" stroke-width="4"/>
  </g>`, contents.defs);
}

function limeDrink() {
  const contents = clip(
    'limeLiq',
    `<path d="M322 214h156l-13 232H335z"/>`,
    `<path d="M322 214h156l-13 232H335z" fill="#D9E86A"/>
     ${specks(151, 22, [336, 234, 464, 428], '#FFFFFF', 9, 0.4)}
     <path d="M322 214h156l-13 232H335z" fill="url(#gloss)"/>`,
  );
  return frame(`${ground(132, 20, 462)}
  <g>
    <path d="M312 168h176l-18 282H330z" fill="#FFFFFF" opacity="0.5"/>
    ${contents.body}
    <ellipse cx="400" cy="214" rx="78" ry="14" fill="#B8CE4A"/>
    <path d="M312 168h176" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="8"/>
    <g transform="translate(430 150) rotate(18)">
      <circle cx="30" cy="30" r="30" fill="#EDF3A0"/>
      <circle cx="30" cy="30" r="22" fill="#D9E86A"/>
      <path d="M30 8v44M8 30h44M14 14l32 32M46 14 14 46" stroke="#F7FAE0" stroke-width="4"/>
    </g>
    ${herbSprig(322, 158, 0.95)}
    <path d="M356 96l26 130" stroke="#B3121B" stroke-width="13" stroke-linecap="round"/>
    <path d="M312 168h176l-18 282H330z" fill="none" stroke="#E4D7CA" stroke-width="4"/>
  </g>`, contents.defs);
}

function waterBottle() {
  const bottle =
    'M362 164h76l10 44c14 22 20 42 20 74v150c0 18-14 32-32 32H364c-18 0-32-14-32-32V282c0-32 6-52 20-74z';
  return frame(`${ground(108, 18, 468)}
  <g>
    <rect x="372" y="104" width="56" height="42" rx="12" fill="#B3121B"/>
    <rect x="378" y="146" width="44" height="18" rx="6" fill="#8B0D14"/>
    <path d="${bottle}" fill="#DCEBF7" opacity="0.95"/>
    <rect x="330" y="288" width="140" height="98" rx="12" fill="#FFFFFF"/>
    <path d="M352 322h96" stroke="#B3121B" stroke-width="11" stroke-linecap="round"/>
    <path d="M364 350h72" stroke="#C98A3D" stroke-width="7" stroke-linecap="round"/>
    <path d="M344 406h112" stroke="#9FC5E8" stroke-width="9" opacity="0.7"/>
    <path d="${bottle}" fill="url(#gloss)"/>
    <path d="${bottle}" fill="none" stroke="#BFD6E8" stroke-width="4"/>
  </g>`);
}

function whiteBowl({ base = '#FBF6EE', fleck = '#2F6B34', extra = '' }) {
  const contents = clip(
    'bowlTop',
    `<ellipse cx="400" cy="300" rx="196" ry="42"/>`,
    `<ellipse cx="400" cy="300" rx="196" ry="42" fill="${base}"/>
     <ellipse cx="400" cy="300" rx="196" ry="42" fill="none" stroke="#000000" stroke-opacity="0.08" stroke-width="12"/>
     ${specks(161, 34, [240, 274, 560, 326], fleck, 9, 0.9)}
     ${extra}
     <path d="M252 282c40-16 96-20 146-14" stroke="#FFFFFF" stroke-width="10" opacity="0.65" fill="none" stroke-linecap="round"/>`,
  );
  return frame(`${ground(214, 26, 468)}
  <g>
    <ellipse cx="400" cy="436" rx="232" ry="46" fill="url(#plate)"/>
    <path d="M204 300c0 90 88 146 196 146s196-56 196-146z" fill="#FFFFFF"/>
    <ellipse cx="400" cy="300" rx="204" ry="46" fill="#F3EBE2"/>
    ${contents.body}
    <ellipse cx="400" cy="300" rx="204" ry="46" fill="none" stroke="#EADFD9" stroke-width="6"/>
    <path d="M204 300c0 90 88 146 196 146s196-56 196-146" fill="none" stroke="#EADFD9" stroke-width="5"/>
  </g>`, contents.defs);
}

function saladBowl() {
  const contents = clip(
    'saladTop',
    `<ellipse cx="400" cy="304" rx="204" ry="44"/>`,
    `<ellipse cx="400" cy="304" rx="204" ry="44" fill="#F3F7EC"/>
     ${specks(171, 46, [224, 272, 576, 336], '#4E8C3A', 16, 0.85)}
     ${specks(172, 18, [240, 278, 560, 330], '#B3121B', 14, 0.9)}
     ${specks(173, 14, [250, 280, 550, 328], '#F2D34A', 12, 0.8)}
     ${herbSprig(300, 286, 1.1)}${herbSprig(452, 296, 1, '#3F7A3F')}`,
  );
  return frame(`${ground(218, 26, 470)}
  <g>
    <ellipse cx="400" cy="442" rx="236" ry="46" fill="url(#plate)"/>
    <path d="M196 306c0 88 92 140 204 140s204-52 204-140z" fill="#FFFFFF"/>
    ${contents.body}
    <ellipse cx="400" cy="306" rx="204" ry="44" fill="none" stroke="#EADFD9" stroke-width="6"/>
    <path d="M196 306c0 88 92 140 204 140s204-52 204-140" fill="none" stroke="#EADFD9" stroke-width="5"/>
  </g>`, contents.defs);
}

function flatbread({ color = '#EBC389', deep = '#B87A34', shape = 'naan', seed = 181 }) {
  const front =
    shape === 'naan'
      ? 'M196 306c0-80 82-134 186-134 78 0 138 30 172 74-34 96-108 178-206 178-92 0-152-54-152-118z'
      : 'M400 148c95 0 172 70 172 156s-77 152-172 152-172-66-172-152 77-156 172-156z';
  const back =
    shape === 'naan'
      ? 'M214 302c0-74 76-124 172-124 72 0 128 28 160 68-32 88-100 164-192 164-84 0-140-50-140-108z'
      : 'M372 136c92 0 166 66 166 148s-74 144-166 144-166-62-166-144 74-148 166-148z';
  const contents = clip(
    `bread${seed}`,
    `<path d="${front}"/>`,
    `<path d="${front}" fill="${color}"/>
     ${specks(seed, 40, [240, 200, 560, 440], deep, 11, 0.5)}
     ${specks(seed + 1, 18, [260, 220, 540, 420], '#7A4A22', 9, 0.45)}
     <path d="${front}" fill="url(#gloss)"/>`,
  );
  return frame(`${ground(198, 20, shape === 'naan' ? 452 : 466)}
  <g>
    <path d="${back}" fill="${color}" opacity="0.8" transform="translate(-26 ${shape === 'naan' ? 20 : -22})"/>
    <path d="${back}" fill="none" stroke="${deep}" stroke-width="4" opacity="0.35" transform="translate(-26 ${shape === 'naan' ? 20 : -22})"/>
    ${contents.body}
    <path d="${front}" fill="none" stroke="${deep}" stroke-width="5" opacity="0.55"/>
    <g transform="translate(${shape === 'naan' ? 408 : 452} ${shape === 'naan' ? 252 : 236}) rotate(8)">
      <rect x="0" y="0" width="66" height="40" rx="9" fill="#F5D07A"/>
      <rect x="0" y="0" width="66" height="14" rx="7" fill="#FFF0C4"/>
    </g>
  </g>`, contents.defs);
}

/* --------------------------------------------------------------- registry */

const DISHES = {
  'chicken-karahi': karahi({ sauce: '#B8451F', sauceDeep: '#8B2E12', seed: 11 }),
  'white-karahi': karahi({ sauce: '#E8DCC6', sauceDeep: '#C9B392', chili: '#4E8C3A', seed: 12 }),
  'achari-karahi': karahi({ sauce: '#C2621D', sauceDeep: '#8E3F0E', garnish: '#F2D34A', chili: '#B3121B', seed: 13 }),
  'mutton-karahi': karahi({ sauce: '#8E2F14', sauceDeep: '#5E1B08', seed: 14 }),
  'beef-karahi': karahi({ sauce: '#7A3A22', sauceDeep: '#4C2011', seed: 15 }),
  'koyla-special-karahi': karahi({ sauce: '#A32B18', sauceDeep: '#6C160A', chili: '#F2D34A', seed: 16 }),
  'chicken-biryani': riceDish({ grain: '#E9C48A', grainDeep: '#C98A3D', topping: '#B8763A', pieces: 4, seed: 21 }),
  'beef-biryani': riceDish({ grain: '#DFB77E', grainDeep: '#A8641F', topping: '#7A3A22', pieces: 4, seed: 22 }),
  'special-biryani': riceDish({ grain: '#EFCB92', grainDeep: '#C98A3D', topping: '#B34424', pieces: 5, seed: 23 }),
  'chicken-pulao': riceDish({ grain: '#F0E3CB', grainDeep: '#C9B392', topping: '#C98A3D', pieces: 4, style: 'pulao', seed: 24 }),
  'steamed-rice': riceDish({
    grain: '#FBF7F0',
    grainDeep: '#DCC9A8',
    topping: '#F2D34A',
    pieces: 0,
    style: 'plain',
    seed: 25,
    extra: wholeSpices(25),
  }),
  'chicken-tikka': skewers({ chunk: '#B34424', count: 3, seed: 31 }),
  'seekh-kabab': skewers({ chunk: '#8E4A2A', count: 3, shape: 'kabab', seed: 32 }),
  'malai-boti': skewers({ chunk: '#EFDCC0', char: '#B08A54', count: 3, seed: 34 }),
  'chicken-boti': skewers({ chunk: '#C2691F', count: 3, seed: 35 }),
  zinger: burgerDish({ patty: '#D89A4B', crispy: true, extra: cheeseDrip() }),
  'chicken-burger': burgerDish({ patty: '#B8763A', extra: cheeseDrip('#F2C240') }),
  shawarma: wrap(),
  'club-sandwich': clubSandwich(),
  fries: fries(),
  pizza: pizza(),
  'crispy-chicken': crispyChicken(),
  'cold-drink': glass({ liquid: '#4A2A1E', liquidDeep: '#2E170F' }),
  'lemon-drink': glass({ liquid: '#F2D96A', liquidDeep: '#D9B93C', seed: 145 }),
  'fresh-lime': limeDrink(),
  'mineral-water': waterBottle(),
  raita: whiteBowl({ base: '#F2EBDA', fleck: '#2F6B34', extra: greensPile(400, 292, 0.72, 13) }),
  salad: saladBowl(),
  naan: flatbread({ color: '#EBC389', deep: '#B87A34', shape: 'naan' }),
  roti: flatbread({ color: '#D2A46A', deep: '#8E5A24', shape: 'roti', seed: 186 }),
};

const only = process.argv.slice(2);
let written = 0;
for (const [slug, svg] of Object.entries(DISHES)) {
  if (only.length > 0 && !only.includes(slug)) continue;
  const buffer = await sharp(Buffer.from(svg), { density: 220 })
    .resize({ width: W, height: H, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten({ background: '#F7EADC' })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
  writeFileSync(resolve(outDir, `${slug}.jpg`), buffer);
  written += 1;
}
console.log(`dish art written: ${written}`);

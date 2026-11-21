import { BoxGeometry } from 'three';
import { building, figure, pseudoRandom, placeLabel, streetLight, tree, type Builder, type MatKey } from '../world/kit';
import { framing, stageFor, type DistrictBuild } from '../world/district';
import { BOARD_HEIGHT } from '../world/layout';

/**
 * City district: the setting of WHAT RA SUDEEEP?, a fictional Bengaluru-like
 * neighbourhood. Narrow mixed-use buildings, a flyover, a market corner.
 * All signage is invented and plain; nothing here is gameplay footage.
 */
export const FLYOVER = { z: -60, x0: 41, x1: 101, deck: 4, ramp: 16, width: 7 };

const SIGNS = ['TEA', 'TAILOR', 'MOBILES', 'BAKERY', 'XEROX', 'MEDICAL', 'HARDWARE', 'TIFFIN'];

export const buildCity: DistrictBuild = (b: Builder, ctx) => {
  const stage = stageFor(ctx.statusOf('what-ra-sudeeep'));
  const mats: MatKey[] = ['plaster', 'card', 'cardShade', 'plaster', 'timber'];

  // Rows of narrow buildings either side of the main road and the flyover.
  const rows = [
    { z: -50.5, d: 7, face: 1 }, // faces the main road to the south
    { z: -69.5, d: 7, face: -1 },
    { z: -84.5, d: 8, face: 1 },
  ];
  let n = 0;
  for (const row of rows) {
    let x = 40;
    while (x < 102) {
      if (x > 64 && x < 76) {
        x = 76; // north–south street at x = 70
        continue;
      }
      const w = 4.6 + pseudoRandom(x * 1.7 + row.z) * 2.6;
      if (x + w > 102) break;
      const floors = 2 + Math.floor(pseudoRandom(x * 3.1 + row.z * 0.7) * 4);
      // In development: every other building is still grey card with scaffold.
      const unbuilt = stage === 'build' && n % 2 === 1;
      building(b, x + w / 2, row.z, w - 0.3, row.d, 0, {
        floors,
        floorHeight: 2.9,
        mat: unbuilt ? 'massing' : mats[n % mats.length],
        stage: unbuilt ? 'build' : 'done',
        balconies: true,
        roof: 'parapet',
      });
      // Shop shutter and an invented sign on the ground floor facing the street.
      if (b.detail && !unbuilt) {
        const fz = row.z + (row.face * row.d) / 2 + row.face * 0.06;
        b.box('steel', x + w / 2, 0, fz, w * 0.7, 2.1, 0.08);
        if (n % 3 === 0)
          placeLabel(b, SIGNS[n % SIGNS.length], x + w / 2, 2.55, fz + row.face * 0.04, row.face > 0 ? 0 : Math.PI, {
            height: 0.6,
            font: '700 80px "Geist Mono Variable", "Geist Mono", monospace',
            background: n % 2 ? '#f3f0e8' : '#e9d7c0',
            padding: 0.3,
          });
      }
      n++;
      x += w;
    }
  }

  // Flyover along z = −60: deck on pillars, ramps at both ends, low parapets.
  const F = FLYOVER;
  const slope = Math.atan2(F.deck, F.ramp);
  const deckX0 = F.x0 + F.ramp;
  const deckX1 = F.x1 - F.ramp;
  const deckLen = deckX1 - deckX0;
  b.box('cardShade', (deckX0 + deckX1) / 2, F.deck - 0.6, F.z, deckLen, 0.6, F.width);
  b.massing.push({ x: (deckX0 + deckX1) / 2, z: F.z, w: deckLen, d: F.width, h: F.deck, ry: 0 });
  for (let x = deckX0 + 2; x <= deckX1 - 2; x += 9) {
    if (Math.abs(x - 70) < 5) continue;
    b.box('card', x, 0, F.z, 1.2, F.deck - 0.6, 3.2);
    b.collider(x, 0, F.z, 1.2, F.deck - 0.6, 3.2);
  }
  // Ramps (as tilted slabs) — geometry and colliders share the same numbers.
  const rampLen = Math.hypot(F.ramp, F.deck);
  for (const side of [-1, 1]) {
    const cx = side < 0 ? F.x0 + F.ramp / 2 : F.x1 - F.ramp / 2;
    const rz = side < 0 ? slope : -slope;
    b.colliders.push({ x: cx, y: BOARD_HEIGHT + F.deck / 2 - 0.3, z: F.z, hx: rampLen / 2, hy: 0.3, hz: F.width / 2, rz, kind: 'ground' });
    if (b.detail) {
      const geoX = cx;
      // Visual ramp: a box rotated about Z.
      const g = new BoxGeometry(rampLen, 0.6, F.width);
      g.rotateZ(rz);
      g.translate(geoX, BOARD_HEIGHT + F.deck / 2 - 0.3, F.z);
      b.add('cardShade', g);
    }
  }
  b.colliders.push({ x: (deckX0 + deckX1) / 2, y: BOARD_HEIGHT + F.deck - 0.3, z: F.z, hx: deckLen / 2, hy: 0.3, hz: F.width / 2, kind: 'ground' });
  // Parapets on the deck so the car can't drop off.
  for (const s of [-1, 1]) {
    b.box('card', (deckX0 + deckX1) / 2, F.deck, F.z + s * (F.width / 2 - 0.15), deckLen, 0.7, 0.3);
    b.collider((deckX0 + deckX1) / 2, F.deck, F.z + s * (F.width / 2 - 0.15), deckLen, 0.9, 0.3);
  }

  if (b.detail) {
    // Overhead cables along the main road (thin wires between poles).
    for (let x = 44; x <= 100; x += 8) {
      b.cylinder('timber', x, 0, -46.2, 0.09, 6, 6);
      if (x + 8 <= 100) {
        b.box('ink', x + 4, 5.6, -46.2, 8, 0.03, 0.03);
        b.box('ink', x + 4, 5.2, -46.2, 8, 0.03, 0.03);
      }
    }
    // Market corner: canopies over stalls on the south side of the main road.
    const tops: MatKey[] = ['vermilion', 'timber', 'cobalt', 'plaster', 'foliageDark'];
    for (let i = 0; i < 5; i++) {
      const x = 84 + i * 3.4;
      b.box('timber', x, 0, -36.5, 2.8, 0.9, 1.6);
      b.box(tops[i], x, 2.3, -36.5, 3.1, 0.12, 2.2);
      b.box('steel', x - 1.4, 0, -37.5, 0.06, 2.3, 0.06);
      b.box('steel', x + 1.4, 0, -37.5, 0.06, 2.3, 0.06);
      figure(b, x + 0.6, -38.6, Math.PI);
    }
    // Bus shelter.
    b.box('steel', 56, 0, -45.6, 4, 0.08, 1.6);
    b.box('glass', 56, 0.1, -44.9, 4, 2.2, 0.06);
    b.box('card', 56, 2.3, -45.6, 4.4, 0.12, 1.9);
    // Tree-lined main road.
    for (let x = 48; x <= 100; x += 10) tree(b, x, -38.4, 1, x % 20 === 8);
    for (let x = 50; x <= 98; x += 16) streetLight(b, x, -46.4, -Math.PI / 2);
    figure(b, 58, -44.2, 0);
    figure(b, 72, -63, 1.2);
    figure(b, 88, -46.8, 2.4);
  }
  b.collider(92.8, 0, -36.5, 17, 1, 2);

  return {
    spots: [
      { id: 'what-ra-sudeeep', x: 50, z: -44, framing: framing(54, 3, -60, Math.PI * 0.62, 18, 8) },
      { id: 'what-ra-market', x: 91, z: -40.5, framing: framing(91, 1.5, -37, -Math.PI * 0.4, 12, 5) },
    ],
    marks: [{ kind: 'plot', x: 70, z: -62, w: 68, d: 56, tone: '#efe5d6' }],
    props: [
      { kind: 'cone', x: 66, z: -42 },
      { kind: 'cone', x: 66, z: -40 },
      { kind: 'crate', x: 99, z: -40 },
    ],
    tight: true,
  };
};

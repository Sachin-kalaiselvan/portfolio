import { building, figure, placeLabel, sawtoothRoof, scaffold, streetLight, tree, type Builder } from '../world/kit';
import { framing, stageFor, type DistrictBuild } from '../world/district';

/**
 * Industrial district: THREXA / The Ingredient List.
 * Reels → corrugation line → dispatch dock, laid out as a path you drive along.
 */
export const buildIndustrial: DistrictBuild = (b: Builder, ctx) => {
  const stage = stageFor(ctx.statusOf('threxa'));

  // Factory: sawtooth roof, walls 7 m. Teeth run east–west.
  const fx = -74;
  const fz = -68;
  const fw = 36;
  const fd = 18;
  const wallH = 7;
  b.massing.push({ x: fx, z: fz, w: fw, d: fd, h: wallH + 2.4, ry: 0 });
  b.collider(fx, 0, fz, fw, wallH, fd);
  // The far (west) third is still being built when THREXA is in development.
  const builtW = stage === 'build' ? fw * 0.68 : fw;
  const builtX = fx + (fw - builtW) / 2;
  b.box('card', builtX, 0, fz, builtW, wallH, fd);
  if (b.detail) {
    sawtoothRoof(b, builtX, fz, builtW, fd, wallH, 6);
    // Plinth band and high window strip.
    b.box('cardShade', builtX, 0, fz, builtW + 0.3, 0.6, fd + 0.3);
    b.box('glass', builtX, 4.4, fz + fd / 2 + 0.03, builtW - 2, 1.2, 0.06);
    if (stage === 'build') {
      const ux = fx - fw / 2 + (fw - builtW) / 2;
      b.box('massing', ux, 0, fz, fw - builtW, 0.4, fd);
      for (const [cx, cz] of [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ])
        b.box('steel', ux + (cx * (fw - builtW)) / 2.3, 0, fz + (cz * fd) / 2.3, 0.35, wallH, 0.35);
      b.box('steel', ux, wallH - 0.3, fz, fw - builtW, 0.3, fd);
      scaffold(b, ux, fz, fw - builtW + 1.2, fd + 1.2, 0, wallH + 1.5);
    }
    // Lettering on the south face.
    placeLabel(b, 'THREXA', builtX + 4, 5.9, fz + fd / 2 + 0.06, 0, {
      height: 1.6,
      font: '700 120px "Geist Variable", Geist, sans-serif',
      color: '#1d1d1b',
      padding: 0.2,
    });
  }

  // Office wing at the east end, with The Ingredient List plaque.
  building(b, -51, -68, 10, 14, 0, { floors: 2, roof: 'parapet', windows: true });
  if (b.detail) {
    b.box('timber', -51, 0, -60.6, 3, 2.6, 0.3);
    placeLabel(b, 'The Ingredient List', -51, 3.1, -60.85, 0, {
      height: 0.55,
      font: 'italic 400 96px "Instrument Serif", Georgia, serif',
      background: '#f1ede3',
      padding: 0.4,
    });
  }

  // Corrugation line under a canopy along the south face: rollers and stacker.
  const lz = -54;
  if (b.detail) {
    for (let i = 0; i < 6; i++) b.box('steel', -88 + i * 5.6, 0, lz + 2, 0.2, 3.4, 0.2);
    b.box('card', -74, 3.4, lz, 30, 0.2, 5);
    b.box('steel', -74, 0, lz, 26, 0.9, 1.6);
    for (let i = 0; i < 9; i++) b.cylinder('rubber', -86 + i * 3, 0.9, lz, 0.32, 1.5, 14, Math.PI / 2);
    b.box('kraft', -60, 0.9, lz, 2.4, 1.2, 1.5);
    b.box('kraft', -60.3, 2.1, lz, 1.8, 0.9, 1.2);
  }
  b.collider(-74, 0, lz, 27, 1.2, 1.8);

  // Reel yard to the west: stacked paper reels.
  const reels: [number, number][] = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) reels.push([-100 + i * 2.2, -52 + j * 2.2]);
  if (b.detail) for (const [x, z] of reels) b.cylinder('kraft', x, 0, z, 0.95, 1.5, 18);
  b.collider(-96.7, 0, -49.8, 9, 1.5, 6.6);
  b.massing.push({ x: -96.7, z: -49.8, w: 9, d: 6.6, h: 1.5, ry: 0 });

  // Dispatch bay on the north face: two docks and a parked box truck.
  if (b.detail) {
    for (const dx of [-80, -68]) {
      b.box('cardShade', dx, 0, fz - fd / 2 - 1.5, 6, 1.1, 3);
      b.box('ink', dx, 1.1, fz - fd / 2 - 0.05, 4.4, 3.4, 0.1);
    }
    // Box truck (generic, unbranded).
    b.box('card', -80, 1.0, -84, 6.5, 3.2, 2.6);
    b.box('cardShade', -76, 0.6, -84, 2.2, 2.4, 2.5);
    b.box('glass', -74.85, 1.9, -84, 0.06, 0.9, 2.1);
    for (const wx of [-82, -78, -75.5]) for (const wz of [-85.3, -82.7]) b.cylinder('rubber', wx, 0, wz, 0.5, 0.4, 12, Math.PI / 2);
    // Forklift.
    b.box('vermilion', -66, 0.3, -82, 1.6, 1.2, 1.1);
    b.box('steel', -65, 0, -82, 0.1, 2.6, 1.0);
    b.box('steel', -64.4, 0.15, -82, 1.2, 0.08, 0.9);
  }
  b.collider(-80, 0, -84, 9, 3.4, 2.6);

  // Yard furniture.
  for (const [x, z] of [
    [-54, -46.8],
    [-66, -46.8],
    [-88, -46.8],
  ])
    streetLight(b, x, z, Math.PI);
  for (const [x, z] of [
    [-102, -38],
    [-98, -38],
    [-36.5, -52],
    [-36.5, -64],
  ])
    tree(b, x, z, 1.1, true);
  figure(b, -58, -51, 0.4);
  figure(b, -71, -79, 2);
  figure(b, -52.5, -59.5, 3);

  return {
    spots: [
      { id: 'threxa', x: -51, z: -57.5, framing: framing(-53, 3, -63, Math.PI * 0.42, 15, 6) },
      { id: 'threxa-line', x: -74, z: -50, framing: framing(-74, 1.5, -54, Math.PI * 0.55, 12, 5) },
      { id: 'threxa-dock', x: -74, z: -82, framing: framing(-74, 2, -80, -Math.PI * 0.45, 14, 6) },
    ],
    marks: [
      { kind: 'plot', x: -70, z: -62, w: 68, d: 56, tone: '#ece6d8' },
      { kind: 'hatch', x: -96.7, z: -49.8, w: 11, d: 9 },
      { kind: 'text', x: -96.7, z: -44.5, text: 'REEL YARD', size: 1.2, font: 'mono' },
      { kind: 'text', x: -74, z: -88.5, text: 'DISPATCH', size: 1.2, font: 'mono' },
    ],
    props: [
      { kind: 'reel', x: -92, z: -44.5 },
      { kind: 'reel', x: -90, z: -44.5 },
      { kind: 'reel', x: -91, z: -46.5 },
    ],
  };
};

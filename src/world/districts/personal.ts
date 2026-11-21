import { ExtrudeGeometry, Shape } from 'three';
import { bench, building, figure, placeLabel, streetLight, tree, type Builder } from '../world/kit';
import { framing, type DistrictBuild } from '../world/district';
import { BOARD_HEIGHT } from '../world/layout';

/**
 * Personal district, the start point: the builder's own workshop, a drawing
 * board of capabilities, a post box for contact, and (decision D4) a small
 * storefront for client work.
 */
export const buildPersonal: DistrictBuild = (b: Builder, ctx) => {
  // Workshop: pitched roof, roller door half up on the lane side, workbench visible.
  const wx = -13;
  const wz = 86;
  const ww = 12;
  const wd = 10;
  const wh = 4.4;
  b.massing.push({ x: wx, z: wz, w: ww, d: wd, h: wh + 2.4, ry: 0 });
  b.collider(wx, 0, wz, ww, wh, wd);
  b.box('timber', wx, 0, wz, ww, wh, wd);
  if (b.detail) {
    const s = new Shape();
    s.moveTo(-wd / 2 - 0.4, 0);
    s.lineTo(wd / 2 + 0.4, 0);
    s.lineTo(0, 2.6);
    s.lineTo(-wd / 2 - 0.4, 0);
    const roof = new ExtrudeGeometry(s, { depth: ww + 0.8, bevelEnabled: false });
    roof.translate(0, 0, -(ww + 0.8) / 2);
    roof.rotateY(Math.PI / 2);
    roof.translate(wx, BOARD_HEIGHT + wh, wz);
    b.add('card', roof);
    // Door opening on the east face, roller door half up; bench inside.
    b.box('ink', wx + ww / 2 + 0.01, 0, wz, 0.05, 3.1, 5);
    b.box('steel', wx + ww / 2 + 0.06, 1.7, wz, 0.08, 1.4, 5.1);
    b.box('timber', wx + ww / 2 - 1.6, 0, wz - 1, 2.6, 0.9, 0.9);
    b.box('steel', wx + ww / 2 - 2.2, 0.9, wz - 1.1, 0.5, 0.3, 0.4);
    b.box('window', wx - 2, 1.2, wz + wd / 2 + 0.02, 3, 1.4, 0.08);
    placeLabel(b, 'WORKSHOP', wx + ww / 2 + 0.08, 3.5, wz, Math.PI / 2, {
      height: 0.5,
      font: '600 72px "Geist Mono Variable", "Geist Mono", monospace',
      padding: 0.2,
    });
  }

  // Drawing board on an easel, facing the lane.
  const dx = 12;
  const dz = 84;
  b.collider(dx, 0, dz, 0.6, 3.6, 5);
  b.massing.push({ x: dx, z: dz, w: 0.6, d: 5, h: 3.6, ry: 0 });
  if (b.detail) {
    b.box('timber', dx + 0.4, 0, dz - 2.2, 0.15, 3.4, 0.15);
    b.box('timber', dx + 0.4, 0, dz + 2.2, 0.15, 3.4, 0.15);
    b.box('card', dx, 0.9, dz, 0.12, 2.6, 4.8);
    placeLabel(b, 'Capabilities', dx - 0.08, 2.9, dz, -Math.PI / 2, {
      height: 0.55,
      font: 'italic 400 96px "Instrument Serif", Georgia, serif',
      padding: 0.2,
    });
    placeLabel(b, 'Product · Software\nDesign · Interactive', dx - 0.08, 1.7, dz, -Math.PI / 2, {
      height: 0.8,
      font: '500 56px "Geist Mono Variable", "Geist Mono", monospace',
      padding: 0.2,
    });
  }

  // Post box at the end of the lane.
  const px = 5.5;
  const pz = 100;
  b.collider(px, 0, pz, 0.8, 1.5, 0.8);
  b.massing.push({ x: px, z: pz, w: 0.8, d: 0.8, h: 1.5, ry: 0 });
  if (b.detail) {
    b.cylinder('ink', px, 0, pz, 0.4, 1.3, 16);
    b.cylinder('ink', px, 1.3, pz, 0.46, 0.18, 16);
    b.box('cobalt', px - 0.38, 0.95, pz, 0.08, 0.1, 0.4);
  }

  const spots = [
    { id: 'about', x: wx + ww / 2 + 3, z: wz + 1, framing: framing(wx + 3, 2, wz, Math.PI * 0.12, 13, 5) },
    { id: 'capabilities', x: dx - 3.5, z: dz, framing: framing(dx, 2, dz, Math.PI, 9, 3) },
    { id: 'contact', x: px - 2.5, z: pz, framing: framing(px, 1, pz, Math.PI * 0.85, 7, 2.5) },
  ];

  // Client work storefront (decision D4).
  if (ctx.papillon) {
    const sx = -12;
    const sz = 102;
    building(b, sx, sz, 8, 6, 0, { floors: 1, floorHeight: 3.6, roof: 'parapet', windows: false, mat: 'card' });
    if (b.detail) {
      b.box('glass', sx + 4.02, 0.3, sz, 0.06, 2.6, 4.6);
      b.box('foliageDark', sx + 4.6, 2.9, sz, 1.4, 0.12, 5.2);
      placeLabel(b, 'Client work\nPapillon Interiors', sx + 4.1, 3.25, sz, Math.PI / 2, {
        height: 0.7,
        font: 'italic 400 72px "Instrument Serif", Georgia, serif',
        background: '#f1ede3',
        padding: 0.3,
      });
    }
    spots.push({ id: 'papillon-interiors', x: sx + 7.5, z: sz, framing: framing(sx + 2, 2, sz, 0, 11, 4) });
  }

  if (b.detail) {
    for (const [x, z] of [
      [-24, 76],
      [-26, 96],
      [24, 74],
      [24, 96],
      [18, 104],
    ])
      tree(b, x, z, 1.1);
    streetLight(b, 3.6, 76, Math.PI);
    streetLight(b, -3.6, 92, 0);
    bench(b, 10, 94, -Math.PI / 2);
    figure(b, 8, 90, 2);
    figure(b, -5, 80, 1);
  }

  return {
    spots,
    marks: [
      { kind: 'plot', x: 0, z: 88, w: 60, d: 36, tone: '#efe9dd' },
      { kind: 'text', x: 0, z: 104, text: 'START', size: 1.2, font: 'mono' },
    ],
    props: [],
  };
};


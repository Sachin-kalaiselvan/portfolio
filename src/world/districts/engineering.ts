import { figure, placeLabel, scaffold, streetLight, tree, type Builder } from '../world/kit';
import { framing, stageFor, type DistrictBuild } from '../world/district';
import { BOARD_HEIGHT } from '../world/layout';
import { BoxGeometry } from 'three';

/**
 * Engineering district: Sentra. Four pavilions for the four agents in order
 * (Extract → Reason → Act → Memory), joined by a raised glass walkway with a
 * cobalt line through it. A gate stands at the Act pavilion: high-risk
 * actions wait for approval.
 */
const C: [number, number] = [74, 64];
const R = 23;
export const PAVILIONS = [
  { name: 'EXTRACT', angle: (150 * Math.PI) / 180 },
  { name: 'REASON', angle: (270 * Math.PI) / 180 },
  { name: 'ACT', angle: (318 * Math.PI) / 180 },
  { name: 'MEMORY', angle: (60 * Math.PI) / 180 },
].map((p) => ({ ...p, x: C[0] + Math.cos(p.angle) * R, z: C[1] + Math.sin(p.angle) * R }));

function pavilion(b: Builder, x: number, z: number, ry: number, name: string, built: boolean) {
  const w = 8;
  const d = 8;
  const h = 4.2;
  b.massing.push({ x, z, w, d, h, ry });
  b.collider(x, 0, z, w, h, d, ry);
  b.boxAt('cardShade', x, z, ry, 0, 0, 0, w + 1, 0.3, d + 1);
  if (!b.detail) {
    b.boxAt('card', x, z, ry, 0, 0, 0, w, h, d);
    return;
  }
  // Glass box under a deep card roof on slim columns.
  b.boxAt('glass', x, z, ry, 0, 0.3, 0, w - 0.6, h - 0.6, d - 0.6);
  b.boxAt('card', x, z, ry, 0, h - 0.3, 0, w + 1.2, 0.5, d + 1.2);
  for (const [cx, cz] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ])
    b.boxAt('card', x, z, ry, (cx * w) / 2, 0.3, (cz * d) / 2, 0.3, h - 0.6, 0.3);
  if (!built) scaffold(b, x, z, w + 1.6, d + 1.6, 0, h + 1);
  // Name on the roof fascia, on the courtyard side.
  placeLabel(b, name, x + Math.sin(ry) * 4.65, h - 0.05, z + Math.cos(ry) * 4.65, ry, {
    height: 0.42,
    font: '600 72px "Geist Mono Variable", "Geist Mono", monospace',
    background: '#f1ede3',
    padding: 0.25,
  });
}

export const buildEngineering: DistrictBuild = (b, ctx) => {
  const built = stageFor(ctx.statusOf('sentra')) === 'done';
  for (const p of PAVILIONS) {
    // Face the courtyard centre.
    const ry = Math.atan2(C[0] - p.x, C[1] - p.z);
    pavilion(b, p.x, p.z, ry, p.name, built);
  }

  // Raised walkway: Extract → Reason → Act → Memory, 3.6 m up, cobalt line inside.
  const y = 3.4;
  for (let i = 0; i < PAVILIONS.length - 1; i++) {
    const a = PAVILIONS[i];
    const c = PAVILIONS[i + 1];
    const dx = c.x - a.x;
    const dz = c.z - a.z;
    const len = Math.hypot(dx, dz) - 9;
    const mx = (a.x + c.x) / 2;
    const mz = (a.z + c.z) / 2;
    const ry = Math.atan2(-dz, dx);
    b.massing.push({ x: mx, z: mz, w: len, d: 2.2, h: y + 2, ry, y });
    if (!b.detail) continue;
    b.boxAt('card', mx, mz, ry, 0, y, 0, len, 0.3, 2.4);
    b.boxAt('glass', mx, mz, ry, 0, y + 0.3, 0, len, 1.9, 2.2);
    b.boxAt('card', mx, mz, ry, 0, y + 2.2, 0, len, 0.2, 2.4);
    b.boxAt('cobalt', mx, mz, ry, 0, y + 0.32, 0, len, 0.08, 0.5);
    // Columns.
    const cols = Math.max(1, Math.round(len / 9));
    for (let k = 0; k <= cols; k++) {
      const t = -len / 2 + (len / cols) * k;
      b.boxAt('card', mx, mz, ry, t, 0, 0, 0.4, y, 0.4);
      const cx = mx + t * Math.cos(ry);
      const cz = mz - t * Math.sin(ry);
      b.collider(cx, 0, cz, 0.5, y, 0.5);
    }
  }

  // Approval gate at the Act pavilion's courtyard door: a barrier arm on a post.
  const act = PAVILIONS[2];
  const ary = Math.atan2(C[0] - act.x, C[1] - act.z);
  const gx = act.x + Math.sin(ary) * 6.4;
  const gz = act.z + Math.cos(ary) * 6.4;
  if (b.detail) {
    b.box('ink', gx, 0, gz, 0.4, 1.1, 0.4);
    const arm = new BoxGeometry(4.6, 0.14, 0.14);
    arm.translate(2.3, 0, 0);
    arm.rotateY(ary + Math.PI / 2);
    arm.translate(gx, BOARD_HEIGHT + 1.0, gz);
    b.add('vermilion', arm);
  }

  // Server hall behind Extract and Memory: dark racks with slow-pulsing lights.
  const sx = 60;
  const sz = 88;
  b.massing.push({ x: sx, z: sz, w: 16, d: 6, h: 4, ry: 0 });
  b.collider(sx, 0, sz, 16, 4, 6);
  b.box('card', sx, 0, sz, 16, 4, 6);
  if (b.detail) {
    b.box('glass', sx, 0.4, sz - 3.02, 14, 2.8, 0.06);
    for (let i = 0; i < 6; i++) b.box('rack', sx - 6 + i * 2.4, 0.3, sz - 1.4, 1.4, 2.8, 1.2);
    placeLabel(b, 'SENTRA', sx, 3.25, sz - 3.08, Math.PI, {
      height: 0.6,
      font: '700 96px "Geist Variable", Geist, sans-serif',
      padding: 0.2,
    });
  }

  if (b.detail) {
    for (const [x, z] of [
      [44, 60],
      [44, 70],
      [100, 52],
      [100, 82],
      [80, 92],
    ])
      tree(b, x, z, 1, true);
    for (let a = 0; a < 6; a++) streetLight(b, C[0] + Math.cos(a) * 17.5, C[1] + Math.sin(a) * 17.5, a);
    figure(b, 70, 61, 0.3);
    figure(b, 78, 66, 2.3);
    figure(b, 66, 69, 4);
  }

  return {
    spots: [
      { id: 'sentra', x: 56, z: 52, framing: framing(64, 3, 58, Math.PI * 1.15, 16, 9) },
      { id: 'sentra-walkway', x: 70, z: 50, framing: framing(74, 4, 46, Math.PI * 0.45, 13, 4) },
    ],
    marks: [
      { kind: 'plot', x: 72, z: 64, w: 64, d: 56, tone: '#e8ebe8' },
      { kind: 'text', x: C[0], z: C[1], text: 'COURTYARD', size: 1.1, font: 'mono' },
    ],
    props: [],
  };
};

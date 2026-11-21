import { bench, building, figure, flag, gate, placeLabel, tree, type Builder } from '../world/kit';
import { framing, stageFor, type BoardMark, type DistrictBuild, type Spot } from '../world/district';

/**
 * Experiment district: a park with a running track. Fitness Guild's pavilion
 * stands with its gate closed (shelved). Each verified experiment gets a
 * small pavilion built to its real status; free slots wait as marked plots.
 */
export const EXPERIMENT_SLOTS: [number, number][] = [
  [-58, 50.5],
  [-68, 50.5],
  [-80, 39],
  [-56, 58],
  [-56, 70],
  [-56, 82],
  [-68, 88],
  [-80, 88],
  [-92, 85],
  [-97, 74],
  [-102, 44],
];

const TRACK = { x: -74, z: 72, rx: 14, rz: 8 };

export const expSpotId = (i: number) => `exp-${i}`;

export const buildExperiment: DistrictBuild = (b: Builder, ctx) => {
  const spots: Spot[] = [];
  const marks: BoardMark[] = [
    { kind: 'plot', x: -72, z: 64, w: 64, d: 56, tone: '#e5eadc' },
    { kind: 'track', ...TRACK },
  ];

  // Fitness Guild: pavilion in the track infield, gate closed, a plain sign.
  const fg = stageFor(ctx.statusOf('fitness-guild'));
  building(b, TRACK.x, TRACK.z, 9, 4.5, 0, { floors: 1, floorHeight: 3.4, roof: 'parapet', windows: true });
  if (fg === 'paused') {
    gate(b, TRACK.x, TRACK.z + 4.2, 5.2);
    placeLabel(b, 'Fitness Guild\nPaused', TRACK.x + 4.6, 0.9, TRACK.z + 4.4, 0, {
      height: 0.9,
      font: '600 64px "Geist Variable", Geist, sans-serif',
      background: '#f3f0e8',
      padding: 0.3,
    });
  }
  spots.push({ id: 'fitness-guild', x: TRACK.x, z: TRACK.z + 9, framing: framing(TRACK.x, 2, TRACK.z + 2, Math.PI * 0.5, 13, 5) });

  // Experiment pavilions, one per entry in experiments.ts.
  ctx.experiments.forEach((e, i) => {
    const slot = EXPERIMENT_SLOTS[i];
    if (!slot) return;
    const [x, z] = slot;
    const st = stageFor(e.status);
    // The side facing the middle of the park: labels and the discovery spot go there.
    const a = Math.atan2(64 - z, -72 - x);
    const ldx = Math.cos(a);
    const ldz = Math.sin(a);
    if (st === 'plan') {
      marks.push({ kind: 'plan', x, z, w: 6, d: 4.5, ry: 0, text: e.name });
      b.massing.push({ x, z, w: 0.1, d: 0.1, h: 0.1, ry: 0 });
    } else {
      building(b, x, z, 6, 4.5, 0, { floors: st === 'build' ? 2 : 1, floorHeight: 3, stage: st === 'build' ? 'build' : 'done', roof: 'parapet' });
      if (e.status === 'Live') flag(b, x + 2.6, 3.4, z - 1.8, 'vermilion', 2.4);
    }
    placeLabel(b, e.name, x + ldx * (Math.abs(ldx) > 0.7 ? 3.15 : 2.4), 0.35, z + ldz * (Math.abs(ldx) > 0.7 ? 3.15 : 2.4), Math.atan2(ldx, ldz), {
      height: 0.42,
      font: '600 60px "Geist Variable", Geist, sans-serif',
      background: '#f3f0e8',
      padding: 0.3,
    });
    spots.push({ id: expSpotId(i), x: x + Math.cos(a) * 5.5, z: z + Math.sin(a) * 5.5, framing: framing(x, 1.5, z, a, 10, 4.5) });
  });
  for (let i = ctx.experiments.length; i < EXPERIMENT_SLOTS.length; i++) {
    const [x, z] = EXPERIMENT_SLOTS[i];
    marks.push({ kind: 'hatch', x, z, w: 6, d: 4.5 });
  }

  if (b.detail) {
    const trees: [number, number, number][] = [
      [-46, 57, 1.2],
      [-86, 52, 1],
      [-100, 56, 1.3],
      [-96, 90, 1.1],
      [-62, 92, 1],
      [-44, 90, 1.2],
      [-44, 64, 1],
      [-86, 64, 0.9],
      [-62, 64, 0.9],
    ];
    for (const [x, z, s] of trees) tree(b, x, z, s, s > 1.1);
    bench(b, -74, 61.5, 0);
    bench(b, -66, 61.5, 0);
    figure(b, -60, 72, 1);
    figure(b, -88, 76, 2);
    figure(b, -74, 81.2, 0);
  }

  return { spots, marks, props: [{ kind: 'cone', x: -60, z: 64 }, { kind: 'cone', x: -88, z: 64 }] };
};

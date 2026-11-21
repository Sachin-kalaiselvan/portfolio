import { describe, expect, it } from 'vitest';
import { planDistricts } from '../../src/world/world/DistrictManager';
import { Hub } from '../../src/world/world/hub';
import { createMaterials } from '../../src/world/world/kit';
import { ROADS, START, PLAY_HALF } from '../../src/world/world/layout';
import type { BoxSpec } from '../../src/world/physics/Physics';
import { projects } from '../../src/content/projects';
import { experiments } from '../../src/content/experiments';
import { PLACEMENTS } from '../../src/world/content/placements';

const ctx = {
  statusOf: (slug: string) => projects.find((p) => p.slug === slug)?.status ?? null,
  experiments: experiments.map((e) => ({ name: e.name, kind: e.kind, status: e.status })),
  papillon: true,
};

/** Is (x, z) inside a box collider grown by `pad`, ignoring height? */
function inside(b: BoxSpec, x: number, z: number, pad: number) {
  if (b.kind === 'ground') return false;
  if (b.y - b.hy > 3.2) return false; // above car height (walkways, flyover deck handled as ramps)
  const ry = b.ry ?? 0;
  const dx = x - b.x;
  const dz = z - b.z;
  // Collider rotation about Y by ry: local = R(-ry) * d.
  const lx = dx * Math.cos(ry) - dz * Math.sin(ry);
  const lz = dx * Math.sin(ry) + dz * Math.cos(ry);
  return Math.abs(lx) < b.hx + pad && Math.abs(lz) < b.hz + pad;
}

function sampleRoad(points: [number, number][], closed: boolean, step = 1) {
  const out: [number, number][] = [];
  const pts = closed ? [...points, points[0]] : points;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  return out;
}

describe('world layout', () => {
  const plan = planDistricts(ctx);
  const hub = new Hub(createMaterials(), false, false);
  const colliders = [...plan.flatMap((p) => p.builder.colliders), ...hub.builder.colliders].filter((c) => !(c.rz || c.rx));

  it('keeps every road centreline clear of buildings', () => {
    const hits: string[] = [];
    for (const r of ROADS) {
      for (const [x, z] of sampleRoad(r.points, !!r.closed)) {
        const c = colliders.find((b) => inside(b, x, z, 0.8));
        if (c) hits.push(`${r.id} at (${x.toFixed(1)}, ${z.toFixed(1)}) hits box at (${c.x.toFixed(1)}, ${c.z.toFixed(1)})`);
      }
    }
    const uniq = [...new Set(hits)];
    const byBox = [...new Set(uniq.map((h) => h.replace(/^(\S+) at .* hits/, "$1 hits")))];
    expect(byBox).toEqual([]);
  });

  it('puts every discovery spot somewhere the car can stand', () => {
    const bad: string[] = [];
    for (const p of plan) {
      for (const s of p.output.spots) {
        if (colliders.some((b) => inside(b, s.x, s.z, 1.2))) bad.push(s.id);
        if (Math.abs(s.x) > PLAY_HALF - 2 || Math.abs(s.z) > PLAY_HALF - 2) bad.push(`${s.id} off board`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('has a placement for every spot and a spot for every placement', () => {
    const spotIds = plan.flatMap((p) => p.output.spots.map((s) => s.id)).sort();
    expect(PLACEMENTS.map((p) => p.id).sort()).toEqual(spotIds);
  });

  it('starts the car on open ground', () => {
    expect(colliders.some((b) => inside(b, START.position[0], START.position[1], 2))).toBe(false);
  });
});

/**
 * The site plan of THE BUILDER'S WORLD. One source for the board painting,
 * physics boundaries, the minimap, district streaming and camera shots.
 * Units are metres at model scale; +X is east, +Z is south, Y is up.
 */

export type Vec2 = [number, number];

export interface DistrictDef {
  id: DistrictId;
  name: string;
  /** Short label printed on the board and shown on the map. */
  subtitle: string;
  centre: Vec2;
  /** Half extents of the footprint. */
  half: Vec2;
  /** Where the spoke road meets the district. */
  gateway: Vec2;
}

export type DistrictId = 'industrial' | 'city' | 'engineering' | 'experiment' | 'personal';

export const BOARD_HALF = 130;
export const PLAY_HALF = 118;
export const BOARD_HEIGHT = 1.2;
export const HUB_RADIUS = 22;
export const RING_RADIUS = 32;
export const RING_WIDTH = 9;
export const SPOKE_WIDTH = 8;
export const LOOP_HALF = 110;
export const LOOP_CORNER = 28;
export const LOOP_WIDTH = 7;

export const START: { position: Vec2; heading: number } = {
  // In front of the workshop, facing north towards the hub.
  position: [0, 98],
  heading: -Math.PI / 2,
};

export const DISTRICTS: DistrictDef[] = [
  { id: 'industrial', name: 'Industrial', subtitle: 'THREXA · The Ingredient List', centre: [-70, -62], half: [34, 28], gateway: [-46, -42] },
  { id: 'city', name: 'City', subtitle: 'WHAT RA SUDEEEP?', centre: [70, -62], half: [34, 28], gateway: [46, -42] },
  { id: 'engineering', name: 'Engineering', subtitle: 'Sentra', centre: [72, 64], half: [32, 28], gateway: [48, 44] },
  { id: 'experiment', name: 'Experiment', subtitle: 'Fitness Guild and experiments', centre: [-72, 64], half: [32, 28], gateway: [-48, 44] },
  { id: 'personal', name: 'Personal', subtitle: 'About · Capabilities · Contact', centre: [0, 88], half: [30, 18], gateway: [0, 66] },
];

export const districtById = (id: DistrictId) => DISTRICTS.find((d) => d.id === id)!;

/** A road is a polyline sampled from curves; width in metres. */
export interface Road {
  id: string;
  points: Vec2[];
  width: number;
  closed?: boolean;
  /** Centre line style: dashed for two-way, none for service roads. */
  centre: 'dashed' | 'none';
}

function arc(cx: number, cz: number, r: number, a0: number, a1: number, n: number): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  return pts;
}

function bezier(p0: Vec2, p1: Vec2, p2: Vec2, n = 16): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
  }
  return pts;
}

function roundedSquare(half: number, r: number): Vec2[] {
  const h = half - r;
  return [
    ...arc(h, h, r, 0, Math.PI / 2, 8),
    ...arc(-h, h, r, Math.PI / 2, Math.PI, 8),
    ...arc(-h, -h, r, Math.PI, Math.PI * 1.5, 8),
    ...arc(h, -h, r, Math.PI * 1.5, Math.PI * 2, 8),
  ];
}

/** Spokes curve slightly so each district reveals itself as you drive. */
function spoke(d: DistrictDef, bend: number): Road {
  const a = Math.atan2(d.gateway[1], d.gateway[0]);
  const start: Vec2 = [Math.cos(a) * (RING_RADIUS + RING_WIDTH / 2 - 1), Math.sin(a) * (RING_RADIUS + RING_WIDTH / 2 - 1)];
  const mid: Vec2 = [(start[0] + d.gateway[0]) / 2 - Math.sin(a) * bend, (start[1] + d.gateway[1]) / 2 + Math.cos(a) * bend];
  return { id: `spoke-${d.id}`, points: bezier(start, mid, d.gateway), width: SPOKE_WIDTH, centre: 'dashed' };
}

export const ROADS: Road[] = [
  { id: 'ring', points: arc(0, 0, RING_RADIUS, 0, Math.PI * 2, 64), width: RING_WIDTH, closed: true, centre: 'dashed' },
  { id: 'loop', points: roundedSquare(LOOP_HALF, LOOP_CORNER), width: LOOP_WIDTH, closed: true, centre: 'dashed' },
  spoke(DISTRICTS[0], 6),
  spoke(DISTRICTS[1], -6),
  spoke(DISTRICTS[2], 6),
  spoke(DISTRICTS[3], -6),
  { id: 'spoke-personal', points: bezier([0, RING_RADIUS + RING_WIDTH / 2 - 1], [4, 52], [0, 66]), width: SPOKE_WIDTH, centre: 'dashed' },
  // District streets, joined to the spokes and the outer loop.
  { id: 'ind-yard', points: [[-46, -42], [-104, -42]], width: 7, centre: 'none' },
  { id: 'ind-service', points: [[-44, -45], [-41, -60], [-41, -86], [-48, -92], [-70, -92], [-70, -LOOP_HALF]], width: 6, centre: 'none' },
  { id: 'city-main', points: [[46, -42], [104, -42]], width: 7, centre: 'dashed' },
  { id: 'city-cross', points: [[70, -42], [70, -LOOP_HALF]], width: 7, centre: 'dashed' },
  { id: 'eng-loop', points: arc(74, 64, 13, 0, Math.PI * 2, 40), width: 6, closed: true, centre: 'none' },
  { id: 'eng-in', points: [[48, 44], [64.8, 54.8]], width: 6, centre: 'none' },
  { id: 'eng-out', points: [[87, 64], [LOOP_HALF, 64]], width: 6, centre: 'none' },
  { id: 'exp-path', points: bezier([-48, 44], [-78, 36], [-92, 56], 16).concat(bezier([-92, 56], [-100, 64], [-LOOP_HALF, 64], 8).slice(1)), width: 6, centre: 'none' },
  { id: 'personal-lane', points: [[0, 66], [0, LOOP_HALF]], width: 6, centre: 'none' },
];

/** Distance from a point to the nearest road centreline, and that road's half width. */
export function nearestRoad(x: number, z: number): { distance: number; halfWidth: number } {
  let best = Infinity;
  let half = 0;
  for (const r of ROADS) {
    const pts = r.points;
    const n = r.closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / len2));
      const px = a[0] + dx * t - x;
      const pz = a[1] + dz * t - z;
      const d = Math.hypot(px, pz);
      if (d < best) {
        best = d;
        half = r.width / 2;
      }
    }
  }
  return { distance: best, halfWidth: half };
}

/** Nearest point on any road, used to put the car back somewhere sensible. */
export function nearestRoadPoint(x: number, z: number): { point: Vec2; heading: number } {
  let best = Infinity;
  let out: { point: Vec2; heading: number } = { point: START.position, heading: START.heading };
  for (const r of ROADS) {
    const pts = r.points;
    const n = r.closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / len2));
      const px = a[0] + dx * t;
      const pz = a[1] + dz * t;
      const d = Math.hypot(px - x, pz - z);
      if (d < best) {
        best = d;
        out = { point: [px, pz], heading: Math.atan2(dz, dx) };
      }
    }
  }
  return out;
}

export function districtAt(x: number, z: number): DistrictDef | null {
  for (const d of DISTRICTS) {
    if (Math.abs(x - d.centre[0]) <= d.half[0] + 6 && Math.abs(z - d.centre[1]) <= d.half[1] + 6) return d;
  }
  return null;
}

/** Sun direction (towards the sun), low from the south-west. */
export const SUN_DIR: [number, number, number] = [-0.55, 0.62, 0.56];

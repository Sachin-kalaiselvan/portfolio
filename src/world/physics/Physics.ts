import type * as RAPIERNS from '@dimforge/rapier3d-compat';

export type Rapier = typeof RAPIERNS;

/** Collision membership bits. Interaction groups are (membership << 16) | filter. */
export const G = {
  STATIC: 0x0001,
  CAR: 0x0002,
  PROP: 0x0004,
  CAMERA_BLOCK: 0x0008,
  CAMERA_QUERY: 0x0010,
} as const;

export const groups = (membership: number, filter: number) => (membership << 16) | filter;
export const GROUPS = {
  ground: groups(G.STATIC, 0xffff),
  building: groups(G.STATIC | G.CAMERA_BLOCK, 0xffff),
  car: groups(G.CAR, G.STATIC | G.PROP),
  prop: groups(G.PROP, 0xffff),
  cameraQuery: groups(G.CAMERA_QUERY, G.CAMERA_BLOCK),
};

let rapierPromise: Promise<Rapier> | null = null;

/** Loads and initialises Rapier once. The -compat build embeds its WASM. */
export function loadRapier(): Promise<Rapier> {
  if (!rapierPromise) {
    rapierPromise = import('@dimforge/rapier3d-compat').then(async (mod) => {
      const R = (mod as unknown as { default?: Rapier }).default ?? (mod as unknown as Rapier);
      await R.init();
      return R;
    });
  }
  return rapierPromise;
}

export interface BoxSpec {
  /** Centre position. */
  x: number;
  y: number;
  z: number;
  /** Half extents. */
  hx: number;
  hy: number;
  hz: number;
  /** Rotation about Y in radians. */
  ry?: number;
  /** Rotation about Z (for ramps). */
  rz?: number;
  rx?: number;
  kind?: 'ground' | 'building';
  friction?: number;
}

export class Physics {
  readonly world: RAPIERNS.World;
  readonly dt = 1 / 60;

  constructor(public readonly R: Rapier) {
    this.world = new R.World({ x: 0, y: -14, z: 0 });
    this.world.timestep = this.dt;
  }

  step() {
    this.world.step();
  }

  /** A group of static box colliders on one fixed body; returns a remover. */
  addStatic(boxes: BoxSpec[]): () => void {
    const R = this.R;
    const body = this.world.createRigidBody(R.RigidBodyDesc.fixed());
    for (const b of boxes) {
      const q = quatFromEuler(b.rx ?? 0, b.ry ?? 0, b.rz ?? 0);
      const desc = R.ColliderDesc.cuboid(b.hx, b.hy, b.hz)
        .setTranslation(b.x, b.y, b.z)
        .setRotation(q)
        .setFriction(b.friction ?? (b.kind === 'ground' ? 0.9 : 0.5))
        .setRestitution(0.05)
        .setCollisionGroups(b.kind === 'ground' ? GROUPS.ground : GROUPS.building);
      this.world.createCollider(desc, body);
    }
    return () => {
      if (this.world.getRigidBody(body.handle)) this.world.removeRigidBody(body);
    };
  }

  /** Sphere cast for the camera against camera-blocking colliders only. */
  cameraCast(from: { x: number; y: number; z: number }, dir: { x: number; y: number; z: number }, maxDist: number, radius = 0.3): number {
    const R = this.R;
    const shape = new R.Ball(radius);
    const hit = this.world.castShape(from, { x: 0, y: 0, z: 0, w: 1 }, dir, shape, 0, maxDist, true, undefined, GROUPS.cameraQuery);
    return hit ? hit.time_of_impact : maxDist;
  }

  dispose() {
    this.world.free();
  }
}

export function quatFromEuler(x: number, y: number, z: number) {
  // XYZ order, matching three.js Euler default.
  const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
  return {
    x: s1 * c2 * c3 + c1 * s2 * s3,
    y: c1 * s2 * c3 - s1 * c2 * s3,
    z: c1 * c2 * s3 + s1 * s2 * c3,
    w: c1 * c2 * c3 - s1 * s2 * s3,
  };
}

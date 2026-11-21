import type { Spot } from '../world/district';
import type { DistrictId } from '../world/layout';
import { placementById } from '../content/placements';

export const DISCOVERY_RADIUS = 6;
/** Leave the prompt a little further out than it appears, so it doesn't flicker. */
const RELEASE_RADIUS = 7.5;

export type SpotEntry = Spot & { district: DistrictId };

/**
 * Tracks which discovery point the car is near, and what has been found.
 * Pure logic: no Three.js, no DOM.
 */
export class Discovery {
  current: SpotEntry | null = null;
  readonly discovered = new Set<string>();
  readonly visitedDistricts = new Set<DistrictId>();

  constructor(readonly spots: SpotEntry[], discovered: string[] = [], visited: DistrictId[] = []) {
    discovered.forEach((d) => this.discovered.add(d));
    visited.forEach((d) => this.visitedDistricts.add(d));
  }

  /** Returns true when the nearby point changed. */
  update(x: number, z: number): boolean {
    const prev = this.current;
    if (this.current) {
      const d = Math.hypot(x - this.current.x, z - this.current.z);
      if (d > RELEASE_RADIUS) this.current = null;
    }
    let best: SpotEntry | null = this.current;
    let bestD = best ? Math.hypot(x - best.x, z - best.z) : DISCOVERY_RADIUS;
    for (const s of this.spots) {
      const d = Math.hypot(x - s.x, z - s.z);
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    this.current = best;
    return prev !== this.current;
  }

  label(id: string) {
    return placementById(id)?.label ?? id;
  }

  /** Marks a point found. Returns true if it was new. */
  discover(id: string): boolean {
    if (this.discovered.has(id)) return false;
    this.discovered.add(id);
    return true;
  }

  visit(d: DistrictId): boolean {
    if (this.visitedDistricts.has(d)) return false;
    this.visitedDistricts.add(d);
    return true;
  }

  /** Floors the hub tower shows: four to start, one more per distinct piece of work found. */
  towerFloors(base: number, max: number) {
    const targets = new Set<string>();
    for (const id of this.discovered) {
      const p = placementById(id);
      if (p) targets.add(p.target.kind === 'project' ? p.target.slug : p.target.id);
    }
    return Math.min(max, base + targets.size);
  }

  allDistrictsVisited(total: number) {
    return this.visitedDistricts.size >= total;
  }
}

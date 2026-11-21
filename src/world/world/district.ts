import type { Experiment, Status } from '../../content/types';
import type { Builder } from './kit';

/** Where the camera frames a discovery point from. */
export interface Framing {
  /** Look-at point (x, y, z). y is above the board. */
  look: [number, number, number];
  /** Horizontal viewing direction in radians (direction from look point to camera). */
  dir: number;
  dist: number;
  height: number;
}

export interface Spot {
  id: string;
  x: number;
  z: number;
  framing: Framing;
}

/** Marks printed on the board (drawn by the board painter). */
export type BoardMark =
  | { kind: 'plan'; x: number; z: number; w: number; d: number; ry: number; text?: string }
  | { kind: 'track'; x: number; z: number; rx: number; rz: number }
  | { kind: 'plot'; x: number; z: number; w: number; d: number; tone: string }
  | { kind: 'text'; x: number; z: number; text: string; size: number; font: 'serif' | 'mono' | 'sans'; ry?: number }
  | { kind: 'hatch'; x: number; z: number; w: number; d: number };

export interface PropSpec {
  kind: 'reel' | 'crate' | 'cone';
  x: number;
  z: number;
}

export interface DistrictOutput {
  spots: Spot[];
  marks: BoardMark[];
  props: PropSpec[];
  /** Areas where the chase camera should pull in (tight streets). */
  tight?: boolean;
}

export interface DistrictContext {
  statusOf(slug: string): Status | null;
  experiments: { name: string; kind: string; status: Experiment['status'] }[];
  /** True once Papillon's storefront is approved for the Personal district. */
  papillon: boolean;
}

export type DistrictBuild = (b: Builder, ctx: DistrictContext) => DistrictOutput;

/** Construction stage for a status (ORIGINAL_WORLD_DESIGN.md §1). */
export function stageFor(status: Status | Experiment['status'] | null): 'done' | 'build' | 'plan' | 'paused' {
  switch (status) {
    case 'Experiment':
    case 'Live':
    case 'Client project':
    case 'Open source':
      return 'done';
    case 'In development':
      return 'build';
    case 'Released experiment':
      return 'paused';
    case 'Concept':
    case 'Hackathon entry':
    default:
      return 'plan';
  }
}

export const framing = (lx: number, ly: number, lz: number, dir: number, dist = 13, height = 6): Framing => ({
  look: [lx, ly, lz],
  dir,
  dist,
  height,
});

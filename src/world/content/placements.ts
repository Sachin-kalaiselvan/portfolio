import { projects } from '../../content/projects';
import { experiments } from '../../content/experiments';
import type { DistrictId } from '../world/layout';

/**
 * Where each discovery point leads. Every target is real content that already
 * exists on the page: a case study, or a section of the home page.
 */
export type Target =
  | { kind: 'project'; slug: string }
  | { kind: 'section'; id: 'about' | 'capabilities' | 'contact' | 'experiments' };

export interface Placement {
  id: string;
  district: DistrictId;
  label: string;
  target: Target;
}

const project = (slug: string) => {
  const p = projects.find((x) => x.slug === slug);
  return p ? p.name : slug;
};

export const PLACEMENTS: Placement[] = [
  { id: 'threxa', district: 'industrial', label: `${project('threxa')}: the plant`, target: { kind: 'project', slug: 'threxa' } },
  { id: 'threxa-line', district: 'industrial', label: `${project('threxa')}: the corrugation line`, target: { kind: 'project', slug: 'threxa' } },
  { id: 'threxa-dock', district: 'industrial', label: `${project('threxa')}: dispatch`, target: { kind: 'project', slug: 'threxa' } },
  { id: 'what-ra-sudeeep', district: 'city', label: project('what-ra-sudeeep'), target: { kind: 'project', slug: 'what-ra-sudeeep' } },
  { id: 'what-ra-market', district: 'city', label: `${project('what-ra-sudeeep')}: the market`, target: { kind: 'project', slug: 'what-ra-sudeeep' } },
  { id: 'sentra', district: 'engineering', label: project('sentra'), target: { kind: 'project', slug: 'sentra' } },
  { id: 'sentra-walkway', district: 'engineering', label: `${project('sentra')}: the approval gate`, target: { kind: 'project', slug: 'sentra' } },
  { id: 'fitness-guild', district: 'experiment', label: project('fitness-guild'), target: { kind: 'project', slug: 'fitness-guild' } },
  ...experiments.map((e, i) => ({
    id: `exp-${i}`,
    district: 'experiment' as const,
    label: e.name,
    target: { kind: 'section' as const, id: 'experiments' as const },
  })),
  { id: 'about', district: 'personal', label: 'About', target: { kind: 'section', id: 'about' } },
  { id: 'capabilities', district: 'personal', label: 'Capabilities', target: { kind: 'section', id: 'capabilities' } },
  { id: 'contact', district: 'personal', label: 'Contact', target: { kind: 'section', id: 'contact' } },
  { id: 'papillon-interiors', district: 'personal', label: project('papillon-interiors'), target: { kind: 'project', slug: 'papillon-interiors' } },
];

export const placementById = (id: string) => PLACEMENTS.find((p) => p.id === id) ?? null;

/** The route for a target. */
export function hrefFor(t: Target) {
  return t.kind === 'project' ? `/work/${t.slug}` : `/#${t.id}`;
}

/** Where the car spawns when "View in the world" is used on a case study. */
export function spotForSlug(slug: string) {
  return PLACEMENTS.find((p) => p.target.kind === 'project' && p.target.slug === slug) ?? null;
}

import { describe, expect, it } from 'vitest';
import { FixedStepLoop } from '../../src/world/core/FixedStepLoop';
import { createStore } from '../../src/world/core/store';
import { IntroSequencer, INTRO_TIMINGS } from '../../src/world/intro/IntroSequencer';
import { initialTier, measuredTier, QualityGovernor } from '../../src/world/perf/tiers';
import { FrameMonitor } from '../../src/world/perf/FrameMonitor';
import { Discovery } from '../../src/world/discovery/Discovery';
import { PLACEMENTS, hrefFor, spotForSlug } from '../../src/world/content/placements';
import { projects } from '../../src/content/projects';
import type { IntroStep } from '../../src/world/core/types';

describe('fixed-step loop', () => {
  it('steps at 60 Hz whatever the display rate', () => {
    for (const fps of [30, 60, 144]) {
      const loop = new FixedStepLoop(1 / 60);
      let steps = 0;
      for (let i = 0; i < fps * 2; i++) steps += loop.advance(1 / fps).steps;
      expect(Math.abs(steps - 120)).toBeLessThanOrEqual(1);
    }
  });
  it('caps catch-up after a long stall', () => {
    const loop = new FixedStepLoop(1 / 60, 5, 0.1);
    expect(loop.advance(3).steps).toBeLessThanOrEqual(5);
  });
});

describe('store', () => {
  it('only notifies on real changes', () => {
    const s = createStore({ a: 1, b: 'x' });
    let n = 0;
    s.subscribe(() => n++);
    s.set({ a: 1 });
    s.set({ a: 2 });
    expect(n).toBe(1);
    expect(s.get()).toEqual({ a: 2, b: 'x' });
  });
});

describe('intro sequencer', () => {
  const run = (reduced: boolean) => {
    const seq = new IntroSequencer(INTRO_TIMINGS, reduced);
    const seen: IntroStep[] = [];
    seq.onStep = (s) => seen.push(s);
    seq.start();
    for (let i = 0; i < 60 * 20; i++) seq.update(1 / 60);
    return seen;
  };
  it('plays every shot in order, then the controls', () => {
    expect(run(false)).toEqual(['aerial', 'identity', 'vehicle', 'behind', 'controls']);
  });
  it('reduced motion is one still view, then the controls', () => {
    expect(run(true)).toEqual(['identity', 'controls']);
  });
  it('skip goes straight to the controls from any step', () => {
    const seq = new IntroSequencer(INTRO_TIMINGS, false);
    seq.start();
    seq.update(1);
    seq.skip();
    expect(seq.step).toBe('controls');
  });
});

describe('tier selection', () => {
  it('starts at Medium, never above the device ceiling, and a manual choice wins', () => {
    expect(initialTier('auto', null, 'high')).toBe('medium');
    expect(initialTier('auto', 'high', 'medium')).toBe('medium');
    expect(initialTier('auto', null, 'low')).toBe('low');
    expect(initialTier('low', 'high', 'high')).toBe('low');
  });
  it('promotes when comfortably fast and demotes when over budget', () => {
    expect(measuredTier('medium', 10, 'high')).toBe('high');
    expect(measuredTier('medium', 10, 'medium')).toBe('medium');
    expect(measuredTier('medium', 30, 'high')).toBe('low');
    expect(measuredTier('medium', 20, 'high')).toBe('medium');
  });
  it('governor lowers render scale before the tier', () => {
    const g = new QualityGovernor(true);
    let action = null;
    for (let i = 0; i < 200 && !action; i++) action = g.update(1 / 30, 40, 'medium', 1, 120);
    expect(action).toEqual({ kind: 'scale', value: 0.9 });
  });
  it('frame monitor percentile', () => {
    const m = new FrameMonitor(100);
    for (let i = 1; i <= 100; i++) m.push(i);
    expect(m.percentile(95)).toBe(96);
  });
});

describe('discovery and placements', () => {
  const spots = PLACEMENTS.map((p, i) => ({ id: p.id, district: p.district, x: i * 20, z: 0, framing: { look: [0, 0, 0] as [number, number, number], dir: 0, dist: 1, height: 1 } }));
  it('finds the nearest point within range and lets go further out', () => {
    const d = new Discovery(spots);
    d.update(41, 3);
    expect(d.current?.id).toBe(PLACEMENTS[2].id);
    d.update(41, 7);
    expect(d.current?.id).toBe(PLACEMENTS[2].id);
    d.update(41, 12);
    expect(d.current).toBeNull();
  });
  it('raises one tower floor per distinct piece of work', () => {
    const d = new Discovery(spots);
    d.discover('threxa');
    d.discover('threxa-line');
    d.discover('sentra');
    expect(d.towerFloors(4, 12)).toBe(6);
  });
  it('every project has a place in the world and every target is a real page', () => {
    for (const p of projects) expect(spotForSlug(p.slug)).not.toBeNull();
    for (const p of PLACEMENTS) {
      const href = hrefFor(p.target);
      if (p.target.kind === 'project') {
        const slug = p.target.slug;
        expect(projects.some((x) => x.slug === slug)).toBe(true);
      } else expect(href).toMatch(/^\/#(about|capabilities|contact|experiments)$/);
    }
  });
});

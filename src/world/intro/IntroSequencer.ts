import type { IntroStep } from '../core/types';

/**
 * The intro as a timeline of steps. Pure logic: it reports the current step
 * and how far through it is; the runtime turns that into camera shots and
 * the React overlay turns it into words. Skippable at any point.
 */
export interface IntroTimings {
  aerial: number;
  identity: number;
  vehicle: number;
  behind: number;
}

export const INTRO_TIMINGS: IntroTimings = { aerial: 3.2, identity: 3.4, vehicle: 2.6, behind: 1.6 };
/** Shorter run for return visitors. */
export const RETURN_TIMINGS: IntroTimings = { aerial: 1.6, identity: 1.4, vehicle: 1.2, behind: 1.2 };

const ORDER: IntroStep[] = ['aerial', 'identity', 'vehicle', 'behind', 'controls'];

export class IntroSequencer {
  step: IntroStep = 'loading';
  /** Seconds into the current step. */
  t = 0;
  onStep: ((s: IntroStep) => void) | null = null;

  constructor(private timings: IntroTimings, readonly reducedMotion: boolean) {}

  start() {
    // Reduced motion: no flight. One still view of the board, then the controls.
    this.go(this.reducedMotion ? 'identity' : 'aerial');
  }

  duration(s: IntroStep) {
    if (this.reducedMotion && s === 'identity') return 2.4;
    return s === 'aerial' || s === 'identity' || s === 'vehicle' || s === 'behind' ? this.timings[s] : Infinity;
  }

  /** 0..1 through the current step. */
  get progress() {
    const d = this.duration(this.step);
    return d === Infinity ? 0 : Math.min(1, this.t / d);
  }

  update(dt: number) {
    if (this.step === 'loading' || this.step === 'controls' || this.step === 'done') return;
    this.t += dt;
    if (this.t >= this.duration(this.step)) {
      const next = this.reducedMotion && this.step === 'identity' ? 'controls' : ORDER[ORDER.indexOf(this.step) + 1];
      this.go(next ?? 'controls');
    }
  }

  skip() {
    if (this.step !== 'done' && this.step !== 'controls') this.go('controls');
  }

  finish() {
    this.go('done');
  }

  private go(s: IntroStep) {
    this.step = s;
    this.t = 0;
    this.onStep?.(s);
  }
}

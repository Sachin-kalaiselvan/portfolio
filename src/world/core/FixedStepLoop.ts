/**
 * Fixed-timestep accumulator. Physics always advances in steps of `dt`,
 * whatever the display rate. Rendering interpolates with `alpha`.
 */
export class FixedStepLoop {
  private acc = 0;

  constructor(
    public readonly dt = 1 / 60,
    private readonly maxSteps = 5,
    private readonly maxFrame = 0.1,
  ) {}

  /** Returns how many fixed steps to run now, and the interpolation factor for rendering. */
  advance(frameSeconds: number): { steps: number; alpha: number } {
    const frame = Math.min(Math.max(frameSeconds, 0), this.maxFrame);
    this.acc += frame;
    let steps = Math.floor(this.acc / this.dt + 1e-9);
    if (steps > this.maxSteps) {
      steps = this.maxSteps;
      // Drop the time we can't catch up on instead of spiralling.
      this.acc = 0;
    } else {
      this.acc -= steps * this.dt;
    }
    if (this.acc < 0) this.acc = 0;
    return { steps, alpha: this.acc / this.dt };
  }

  reset() {
    this.acc = 0;
  }
}

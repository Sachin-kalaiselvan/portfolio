/** Rolling window of frame times (ms). */
export class FrameMonitor {
  private buf: Float32Array;
  private n = 0;
  private i = 0;

  constructor(readonly size = 120) {
    this.buf = new Float32Array(size);
  }

  push(ms: number) {
    this.buf[this.i] = ms;
    this.i = (this.i + 1) % this.size;
    this.n = Math.min(this.n + 1, this.size);
  }

  get count() {
    return this.n;
  }

  reset() {
    this.n = 0;
    this.i = 0;
  }

  percentile(p: number) {
    if (!this.n) return 0;
    const a = Array.from(this.buf.subarray(0, this.n)).sort((x, y) => x - y);
    return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];
  }

  mean() {
    if (!this.n) return 0;
    let s = 0;
    for (let k = 0; k < this.n; k++) s += this.buf[k];
    return s / this.n;
  }
}

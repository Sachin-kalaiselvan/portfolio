/** Developer overlay, shown with #stats in the URL. Plain DOM, no dependency. */
export class StatsOverlay {
  private el: HTMLDivElement;
  private acc = 0;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'world-stats';
    this.el.setAttribute('aria-hidden', 'true');
    parent.appendChild(this.el);
  }

  update(dt: number, lines: Record<string, string | number>) {
    this.acc += dt;
    if (this.acc < 0.25) return;
    this.acc = 0;
    this.el.textContent = Object.entries(lines)
      .map(([k, v]) => `${k.padEnd(9)} ${v}`)
      .join('\n');
  }

  dispose() {
    this.el.remove();
  }
}

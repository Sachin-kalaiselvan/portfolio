/** Collects cleanup functions so a runtime can be torn down completely. */
export class Disposables {
  private fns: (() => void)[] = [];
  private done = false;

  add(fn: () => void) {
    if (this.done) fn();
    else this.fns.push(fn);
    return fn;
  }

  listen<K extends keyof WindowEventMap>(target: Window, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions): void;
  listen<K extends keyof DocumentEventMap>(target: Document, type: K, fn: (e: DocumentEventMap[K]) => void, opts?: AddEventListenerOptions): void;
  listen(target: EventTarget, type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions): void;
  listen(target: EventTarget, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions) {
    target.addEventListener(type, fn as EventListener, opts);
    this.add(() => target.removeEventListener(type, fn as EventListener, opts));
  }

  dispose() {
    this.done = true;
    // Reverse order: things created last are torn down first.
    for (let i = this.fns.length - 1; i >= 0; i--) {
      try {
        this.fns[i]();
      } catch (err) {
        console.error('[world] dispose step failed', err);
      }
    }
    this.fns = [];
  }
}

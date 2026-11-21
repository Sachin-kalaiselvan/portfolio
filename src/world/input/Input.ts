import { Disposables } from '../core/disposables';
import type { InputDevice } from '../core/types';
import { clamp } from '../core/maths';

/**
 * Turns devices into named actions, filtered by the current context, and
 * produces driving intent. The car never reads devices directly.
 */
export type InputContext = 'intro' | 'controls' | 'driving' | 'panel' | 'off';

export type Action = 'interact' | 'reset' | 'horn' | 'camera' | 'skip' | 'map' | 'escape' | 'lights';

interface ActionDef {
  keys: string[];
  pads: number[];
  contexts: InputContext[];
}

/** Key codes (KeyboardEvent.code) and standard gamepad button indices. */
export const ACTIONS: Record<Action, ActionDef> = {
  interact: { keys: ['KeyE', 'Enter', 'NumpadEnter'], pads: [0], contexts: ['driving'] },
  reset: { keys: ['KeyR'], pads: [8], contexts: ['driving'] },
  horn: { keys: ['KeyH'], pads: [10], contexts: ['driving', 'controls'] },
  camera: { keys: ['KeyC'], pads: [3], contexts: ['driving', 'controls'] },
  skip: { keys: ['Escape', 'Enter', 'Space'], pads: [0, 9], contexts: ['intro'] },
  map: { keys: ['KeyM'], pads: [], contexts: ['driving', 'controls'] },
  escape: { keys: ['Escape'], pads: [1], contexts: ['driving', 'controls', 'panel'] },
  lights: { keys: ['KeyL'], pads: [], contexts: ['driving', 'controls'] },
};

const THROTTLE_KEYS = ['KeyW', 'ArrowUp'];
const REVERSE_KEYS = ['KeyS', 'ArrowDown'];
const LEFT_KEYS = ['KeyA', 'ArrowLeft'];
const RIGHT_KEYS = ['KeyD', 'ArrowRight'];
const BRAKE_KEYS = ['Space'];

export interface Intent {
  /** −1 (back) … 1 (forward). */
  throttle: number;
  /** 0 … 1 explicit brake. */
  brake: number;
  /** −1 (left) … 1 (right). */
  steer: number;
}

export interface TouchState {
  steer: number;
  throttle: number;
  brake: number;
}

export class Input {
  context: InputContext = 'off';
  device: InputDevice = 'keyboard';
  private keys = new Set<string>();
  private pressedPad = new Set<number>();
  private touch: TouchState = { steer: 0, throttle: 0, brake: 0 };
  private touchActive = false;
  private listeners = new Map<Action, Set<() => void>>();
  private d = new Disposables();
  /** Camera orbit and zoom requests, consumed by the camera each frame. */
  orbit = { dx: 0, dy: 0, dragging: false, lastInputAt: 0 };
  zoom = 0;
  onDevice: ((d: InputDevice) => void) | null = null;
  /** Any driving input at all, used to leave the controls card. */
  onFirstDrive: (() => void) | null = null;

  constructor(canvas: HTMLElement) {
    this.d.listen(window, 'keydown', this.onKeyDown);
    this.d.listen(window, 'keyup', this.onKeyUp);
    this.d.listen(window, 'blur', () => this.keys.clear());
    this.d.listen(canvas, 'contextmenu', (e: Event) => e.preventDefault());
    this.d.listen(canvas, 'pointerdown', this.onPointerDown as EventListener);
    this.d.listen(window, 'pointermove', this.onPointerMove as EventListener);
    this.d.listen(window, 'pointerup', this.onPointerUp as EventListener);
    this.d.listen(window, 'pointercancel', this.onPointerUp as EventListener);
    this.d.listen(canvas, 'wheel', this.onWheel as EventListener, { passive: false });
  }

  on(action: Action, fn: () => void) {
    if (!this.listeners.has(action)) this.listeners.set(action, new Set());
    this.listeners.get(action)!.add(fn);
    return () => this.listeners.get(action)?.delete(fn);
  }

  /** Fire an action from the interface (touch buttons, menu). Respects context. */
  trigger(action: Action) {
    if (!ACTIONS[action].contexts.includes(this.context)) return;
    this.listeners.get(action)?.forEach((fn) => fn());
  }

  private setDevice(d: InputDevice) {
    if (this.device === d) return;
    this.device = d;
    this.onDevice?.(d);
  }

  private isTyping(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    // One key press acts in the context it was pressed in, even if an action changes the context.
    const context = this.context;
    if (context === 'off') return;
    // Let focused buttons handle Enter/Space themselves.
    const focusedButton = (e.target as HTMLElement | null)?.closest?.('button, a');
    if (focusedButton && (e.code === 'Enter' || e.code === 'Space')) return;
    this.setDevice('keyboard');
    const driveKeys = [...THROTTLE_KEYS, ...REVERSE_KEYS, ...LEFT_KEYS, ...RIGHT_KEYS, ...BRAKE_KEYS];
    if (driveKeys.includes(e.code) && (this.context === 'driving' || this.context === 'controls')) {
      e.preventDefault();
      if (!this.keys.has(e.code) && e.code !== 'Space') this.onFirstDrive?.();
    }
    if (e.repeat) {
      this.keys.add(e.code);
      return;
    }
    this.keys.add(e.code);
    for (const [name, def] of Object.entries(ACTIONS) as [Action, ActionDef][]) {
      if (def.keys.includes(e.code) && def.contexts.includes(context)) {
        if (name === 'skip' || e.code === 'Space') e.preventDefault();
        this.listeners.get(name)?.forEach((fn) => fn());
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  // Pointer: right-drag (or left-drag with a mouse) orbits; two touch points orbit and pinch.
  private pointers = new Map<number, { x: number; y: number; type: string }>();
  private pinchDist = 0;

  private onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') this.setDevice('touch');
    else if (this.device === 'touch') this.setDevice('keyboard');
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    if (e.pointerType === 'mouse' || this.pointers.size >= 2) {
      this.orbit.dragging = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (p.type === 'mouse' && this.orbit.dragging) {
      this.orbit.dx += dx;
      this.orbit.dy += dy;
      this.orbit.lastInputAt = performance.now();
    } else if (this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinchDist > 0) this.zoom += (this.pinchDist - dist) * 0.004;
      this.pinchDist = dist;
      this.orbit.dx += dx / 2;
      this.orbit.dy += dy / 2;
      this.orbit.lastInputAt = performance.now();
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinchDist = 0;
    if (this.pointers.size === 0) this.orbit.dragging = false;
  };

  private onWheel = (e: WheelEvent) => {
    if (this.context !== 'driving' && this.context !== 'controls') return;
    e.preventDefault();
    this.zoom += clamp(e.deltaY, -120, 120) * 0.0015;
  };

  /** Called by the on-screen touch controls. */
  setTouch(t: Partial<TouchState>) {
    this.touch = { ...this.touch, ...t };
    const active = this.touch.throttle !== 0 || this.touch.brake !== 0 || this.touch.steer !== 0;
    if (active && !this.touchActive) this.onFirstDrive?.();
    this.touchActive = active;
    this.setDevice('touch');
  }

  private padIntent(): Intent | null {
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (!pad) continue;
      const rt = pad.buttons[7]?.value ?? 0;
      const lt = pad.buttons[6]?.value ?? 0;
      const sx = Math.abs(pad.axes[0] ?? 0) > 0.12 ? pad.axes[0] : 0;
      // Right stick orbits the camera.
      const rx = Math.abs(pad.axes[2] ?? 0) > 0.15 ? pad.axes[2] : 0;
      const ry = Math.abs(pad.axes[3] ?? 0) > 0.15 ? pad.axes[3] : 0;
      if (rx || ry) {
        this.orbit.dx += rx * 8;
        this.orbit.dy += ry * 6;
        this.orbit.lastInputAt = performance.now();
      }
      // Edge-triggered buttons for actions.
      pad.buttons.forEach((b, i) => {
        if (b.pressed && !this.pressedPad.has(i)) {
          this.pressedPad.add(i);
          this.setDevice('gamepad');
          for (const [name, def] of Object.entries(ACTIONS) as [Action, ActionDef][]) {
            if (def.pads.includes(i) && def.contexts.includes(this.context)) this.listeners.get(name)?.forEach((fn) => fn());
          }
        } else if (!b.pressed) this.pressedPad.delete(i);
      });
      if (rt > 0.05 || lt > 0.05 || sx) {
        this.setDevice('gamepad');
        return { throttle: rt - lt, brake: pad.buttons[1]?.pressed ? 1 : 0, steer: sx };
      }
    }
    return null;
  }

  /** Current driving intent. Zero outside the driving contexts. */
  intent(): Intent {
    const pad = this.padIntent();
    if (this.context !== 'driving' && this.context !== 'controls') return { throttle: 0, brake: 0, steer: 0 };
    if (pad) return pad;
    if (this.touchActive) return { throttle: this.touch.throttle - this.touch.brake, brake: 0, steer: this.touch.steer };
    const k = (codes: string[]) => codes.some((c) => this.keys.has(c));
    return {
      throttle: (k(THROTTLE_KEYS) ? 1 : 0) - (k(REVERSE_KEYS) ? 1 : 0),
      brake: k(BRAKE_KEYS) ? 1 : 0,
      steer: (k(RIGHT_KEYS) ? 1 : 0) - (k(LEFT_KEYS) ? 1 : 0),
    };
  }

  takeOrbit() {
    const o = { dx: this.orbit.dx, dy: this.orbit.dy };
    this.orbit.dx = this.orbit.dy = 0;
    return o;
  }

  takeZoom() {
    const z = this.zoom;
    this.zoom = 0;
    return z;
  }

  dispose() {
    this.d.dispose();
    this.listeners.clear();
    this.keys.clear();
  }
}

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { WorldRuntime } from '../world/core/WorldRuntime';
import type { WorldState } from '../world/core/types';

/**
 * Touch driving: a steering pad on one side, accelerate and brake/reverse on
 * the other. Targets are at least 56 px. Mirrored for left-handed use.
 */
export function TouchControls({ runtime, leftHanded }: { runtime: WorldRuntime; state: WorldState; leftHanded: boolean }) {
  const pad = useRef<HTMLDivElement>(null);
  const [steer, setSteer] = useState(0);
  const [go, setGo] = useState(false);
  const [brake, setBrake] = useState(false);
  const steerId = useRef<number | null>(null);

  useEffect(() => () => runtime.setTouch({ steer: 0, throttle: 0, brake: 0 }), [runtime]);

  const steerFrom = (e: PointerEvent) => {
    const r = pad.current!.getBoundingClientRect();
    const v = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    const shaped = Math.sign(v) * Math.min(1, Math.abs(v) * 1.25);
    setSteer(shaped);
    runtime.setTouch({ steer: shaped });
  };

  const hold = (key: 'throttle' | 'brake', on: boolean) => {
    if (key === 'throttle') setGo(on);
    else setBrake(on);
    runtime.setTouch({ [key]: on ? 1 : 0 });
    if (on) navigator.vibrate?.(8);
  };

  const holdProps = (key: 'throttle' | 'brake') => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      hold(key, true);
    },
    onPointerUp: () => hold(key, false),
    onPointerCancel: () => hold(key, false),
    onContextMenu: (e: { preventDefault(): void }) => e.preventDefault(),
  });

  return (
    <div className="w-touch" data-left={leftHanded || undefined}>
      <div
        ref={pad}
        className="w-touch__steer"
        role="slider"
        aria-label="Steering"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={Number(steer.toFixed(2))}
        onPointerDown={(e) => {
          steerId.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          steerFrom(e);
        }}
        onPointerMove={(e) => e.pointerId === steerId.current && steerFrom(e)}
        onPointerUp={() => {
          steerId.current = null;
          setSteer(0);
          runtime.setTouch({ steer: 0 });
        }}
        onPointerCancel={() => {
          steerId.current = null;
          setSteer(0);
          runtime.setTouch({ steer: 0 });
        }}
      >
        <span className="w-touch__track" aria-hidden="true">
          <i>‹</i>
          <i>›</i>
        </span>
        <span className="w-touch__knob" aria-hidden="true" style={{ transform: `translateX(${steer * 38}%)` }} />
      </div>
      <div className="w-touch__pedals">
        <button type="button" className="w-touch__brake" data-on={brake || undefined} aria-label="Brake and reverse" {...holdProps('brake')}>
          Brake
          <small>hold to reverse</small>
        </button>
        <button type="button" className="w-touch__go" data-on={go || undefined} aria-label="Accelerate" {...holdProps('throttle')}>
          Go
        </button>
      </div>
    </div>
  );
}

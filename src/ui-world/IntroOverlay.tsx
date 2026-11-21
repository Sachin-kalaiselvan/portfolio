import { useEffect, useRef } from 'react';
import type { WorldRuntime } from '../world/core/WorldRuntime';
import type { WorldState } from '../world/core/types';
import { profile } from '../content/profile';

/** Words over the intro shots, the Skip button, and the controls card. */
export function IntroOverlay({ state, runtime, onPage }: { state: WorldState; runtime: WorldRuntime; onPage(): void }) {
  const { mode, introStep, inputDevice } = state;
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (mode === 'controls') startRef.current?.focus({ preventScroll: true });
  }, [mode]);

  if (mode === 'intro') {
    return (
      <div className="w-intro" data-step={introStep}>
        <div className="w-intro__title" aria-live="polite">
          <p className="w-mono w-intro__kicker" data-on={introStep === 'aerial' || introStep === 'identity' || undefined}>
            A working model of what I build
          </p>
          <h1 className="w-intro__name" data-on={introStep === 'identity' || introStep === 'vehicle' || undefined}>
            {profile.name}
          </h1>
          <p className="w-intro__role" data-on={introStep === 'identity' || introStep === 'vehicle' || undefined}>
            {profile.roleLine}. Drive around to see the work.
          </p>
        </div>
        <div className="w-intro__actions">
          <button type="button" className="w-btn w-btn--ghost" onClick={() => runtime.skipIntro()}>
            Skip intro <kbd>Esc</kbd>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'controls') {
    const touch = inputDevice === 'touch' || window.matchMedia('(pointer: coarse)').matches;
    return (
      <div className="w-controls" role="dialog" aria-label="How to drive">
        <p className="w-mono">How to drive</p>
        {touch ? (
          <ul className="w-controls__list">
            <li><b>Steer</b> slide the pad left or right</li>
            <li><b>Go</b> hold the green button</li>
            <li><b>Brake / reverse</b> hold the other button</li>
            <li><b>Two fingers</b> turn and zoom the camera</li>
          </ul>
        ) : (
          <ul className="w-controls__list">
            <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows: drive</li>
            <li><kbd>Space</kbd> brake · <kbd>E</kbd> open what’s nearby</li>
            <li><kbd>C</kbd> camera · <kbd>M</kbd> map · <kbd>R</kbd> reset</li>
            <li>Drag to look around · <kbd>Esc</kbd> menu</li>
          </ul>
        )}
        <div className="w-controls__row">
          <button ref={startRef} type="button" className="w-btn" onClick={() => runtime.startDriving()}>
            Start driving
          </button>
          <button type="button" className="w-btn w-btn--ghost" onClick={onPage}>
            View as page
          </button>
        </div>
      </div>
    );
  }
  return null;
}

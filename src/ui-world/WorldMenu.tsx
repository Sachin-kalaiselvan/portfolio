import { useEffect, useRef } from 'react';
import type { WorldRuntime } from '../world/core/WorldRuntime';
import type { TierChoice, WorldState } from '../world/core/types';
import { PLACEMENTS } from '../world/content/placements';
import { projects } from '../content/projects';

const TIER_LABEL: Record<TierChoice, string> = { auto: 'Auto', low: 'Low', medium: 'Medium', high: 'High' };

/** Everything the world can do, in one panel: go to work, settings, leave. */
export function WorldMenu({
  state,
  runtime,
  onPage,
  leftHanded,
  onToggleHand,
  touch,
}: {
  state: WorldState;
  runtime: WorldRuntime;
  onPage(): void;
  leftHanded: boolean;
  onToggleHand(): void;
  touch: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.menuOpen) panel.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
  }, [state.menuOpen]);
  if (!state.menuOpen) return null;

  const go = (id: string) => {
    runtime.setMenu(false);
    runtime.openPoint(id);
  };
  // One entry per project: its first discovery point.
  const work = projects
    .map((p) => PLACEMENTS.find((x) => x.target.kind === 'project' && x.target.slug === p.slug))
    .filter((x): x is (typeof PLACEMENTS)[number] => Boolean(x));
  const found = new Set(state.discovered);

  return (
    <div className="w-menu" role="dialog" aria-modal="true" aria-label="World menu" onKeyDown={(e) => e.key === 'Tab' && trap(e, panel.current)}>
      <button type="button" className="w-menu__scrim" aria-label="Close menu" tabIndex={-1} onClick={() => runtime.setMenu(false)} />
      <div className="w-menu__panel" ref={panel}>
        <div className="w-menu__head">
          <p className="w-mono">Menu</p>
          <button type="button" className="w-icon-btn" onClick={() => runtime.setMenu(false)}>
            Close
          </button>
        </div>

        <section>
          <h2 className="w-menu__h">Go to</h2>
          <ul className="w-menu__go">
            {work.map((p, i) => (
              <li key={p.id} style={{ ['--i' as string]: i }}>
                <button type="button" onClick={() => go(p.id)}>
                  <span>{projects.find((x) => p.target.kind === 'project' && x.slug === p.target.slug)?.name}</span>
                  <span className="w-mono">{found.has(p.id) ? 'Found' : 'Not yet found'}</span>
                </button>
              </li>
            ))}
            {(['about', 'capabilities', 'contact', 'exp-0'] as const).map((id, i) => (
              <li key={id} style={{ ['--i' as string]: work.length + i }}>
                <button type="button" onClick={() => go(id)}>
                  <span>{id === 'exp-0' ? 'Experiments' : id[0].toUpperCase() + id.slice(1)}</span>
                  <span className="w-mono">{id === 'exp-0' ? 'Experiment district' : 'Personal district'}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="w-menu__settings">
          <h2 className="w-menu__h">Settings</h2>
          <div className="w-seg" role="radiogroup" aria-label="Quality">
            <span className="w-mono">Quality</span>
            {(Object.keys(TIER_LABEL) as TierChoice[]).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={state.tierChoice === t} onClick={() => runtime.setTier(t)}>
                {TIER_LABEL[t]}
                {t === 'auto' && state.tierChoice === 'auto' && <small> ({TIER_LABEL[state.tier]})</small>}
              </button>
            ))}
          </div>
          <div className="w-seg" role="radiogroup" aria-label="Frame rate">
            <span className="w-mono">Frame rate</span>
            {([30, 60, 0] as const).map((f) => (
              <button key={f} type="button" role="radio" aria-checked={state.fpsCap === f} onClick={() => runtime.setFpsCap(f)}>
                {f ? `${f} fps` : 'No cap'}
              </button>
            ))}
          </div>
          <div className="w-seg" role="radiogroup" aria-label="Camera">
            <span className="w-mono">Camera</span>
            <button type="button" role="radio" aria-checked={state.cameraMode === 'follow'} onClick={() => runtime.setCameraMode('follow')}>
              Follow
            </button>
            <button type="button" role="radio" aria-checked={state.cameraMode === 'overhead'} onClick={() => runtime.setCameraMode('overhead')}>
              Overhead
            </button>
          </div>
          <div className="w-seg">
            <span className="w-mono">Sound</span>
            <button type="button" role="switch" aria-checked={state.audioEnabled} onClick={() => runtime.setAudio(!state.audioEnabled)}>
              {state.audioEnabled ? 'On' : 'Off'}
            </button>
          </div>
          {touch && (
            <div className="w-seg">
              <span className="w-mono">Controls</span>
              <button type="button" role="switch" aria-checked={leftHanded} onClick={onToggleHand}>
                {leftHanded ? 'Left-handed' : 'Right-handed'}
              </button>
            </div>
          )}
        </section>

        <div className="w-menu__foot">
          <button type="button" className="w-btn w-btn--ghost" onClick={() => (runtime.setMenu(false), runtime.respawn())}>
            Reset car
          </button>
          <button type="button" className="w-btn w-btn--ghost" onClick={() => runtime.replayIntro()}>
            Replay intro
          </button>
          <button type="button" className="w-btn" onClick={onPage}>
            View as page
          </button>
        </div>
      </div>
    </div>
  );
}

function trap(e: React.KeyboardEvent, root: HTMLElement | null) {
  if (!root) return;
  const items = Array.from(root.querySelectorAll<HTMLElement>('button:not([tabindex="-1"])'));
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

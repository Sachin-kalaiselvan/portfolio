import type { WorldRuntime } from '../world/core/WorldRuntime';
import type { WorldState } from '../world/core/types';
import { districtById, type DistrictId } from '../world/world/layout';

/** The few things on screen while driving: where you are, what's nearby, and the menu. */
export function Hud({ state, runtime, touch }: { state: WorldState; runtime: WorldRuntime; touch: boolean }) {
  const district = state.district ? districtById(state.district as DistrictId) : null;
  const kmh = Math.round(state.speed * 3.6);
  return (
    <div className="w-hud">
      <div className="w-hud__top">
        <div className="w-hud__where" aria-live="polite">
          <span className="w-mono">{district ? 'District' : 'On the road'}</span>
          <strong key={district?.id ?? 'road'}>{district ? district.name : 'Ring road'}</strong>
          {district && <span className="w-hud__sub">{district.subtitle}</span>}
        </div>
        <div className="w-hud__buttons">
          <button type="button" className="w-icon-btn" onClick={() => runtime.setMap(!state.mapOpen)} aria-pressed={state.mapOpen}>
            Map{!touch && <kbd>M</kbd>}
          </button>
          <button type="button" className="w-icon-btn" onClick={() => runtime.setMenu(true)} aria-haspopup="dialog">
            Menu{!touch && <kbd>Esc</kbd>}
          </button>
        </div>
      </div>

      <div className="w-hud__tower w-mono" title="One floor goes up for each piece of work you open">
        Tower {state.towerFloors}/12{state.toppedOut ? ' · topped out' : ''}
      </div>

      {state.nearby && (
        <button key={state.nearby.id} type="button" className="w-prompt" onClick={() => runtime.openPoint(state.nearby!.id)}>
          <span className="w-prompt__key">{touch ? 'Tap' : 'E'}</span>
          <span>
            <span className="w-mono">Open</span>
            <strong>{state.nearby.label}</strong>
          </span>
        </button>
      )}

      {state.justFound && (
        <div className="w-toast" role="status" key={state.justFound}>
          <span className="w-mono">Found</span> {state.justFound}
        </div>
      )}
      {state.hint && (
        <div className="w-toast w-toast--hint" role="status">
          {state.hint}
        </div>
      )}

      {!touch && (
        <div className="w-hud__speed w-mono" aria-hidden="true">
          <b>{String(kmh).padStart(2, '0')}</b> km/h
        </div>
      )}
    </div>
  );
}

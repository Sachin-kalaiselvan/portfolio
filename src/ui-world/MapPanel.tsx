import { useMemo } from 'react';
import type { WorldRuntime } from '../world/core/WorldRuntime';
import type { WorldState } from '../world/core/types';
import { DISTRICTS, PLAY_HALF, ROADS } from '../world/world/layout';
import { PLACEMENTS } from '../world/content/placements';

/** Site plan drawn from the same layout data as the board. Tap a district's work to drive there. */
export function MapPanel({ state, runtime }: { state: WorldState; runtime: WorldRuntime }) {
  const roads = useMemo(
    () =>
      ROADS.map((r) => ({
        id: r.id,
        w: r.width,
        d: r.points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + (r.closed ? 'Z' : ''),
      })),
    [],
  );
  if (!state.mapOpen) return null;
  const found = new Set(state.discovered);
  const v = PLAY_HALF + 6;
  const { x, z, heading } = state.car;
  return (
    <div className="w-map" role="dialog" aria-label="Site plan">
      <div className="w-map__head">
        <p className="w-mono">Site plan · {found.size} of {PLACEMENTS.length} found</p>
        <button type="button" className="w-icon-btn" onClick={() => runtime.setMap(false)}>
          Close
        </button>
      </div>
      <svg viewBox={`${-v} ${-v} ${v * 2} ${v * 2}`} className="w-map__svg" aria-hidden="true">
        <rect x={-PLAY_HALF} y={-PLAY_HALF} width={PLAY_HALF * 2} height={PLAY_HALF * 2} className="w-map__board" />
        {DISTRICTS.map((d) => (
          <g key={d.id}>
            <rect
              x={d.centre[0] - d.half[0]}
              y={d.centre[1] - d.half[1]}
              width={d.half[0] * 2}
              height={d.half[1] * 2}
              rx={3}
              className="w-map__district"
              data-here={state.district === d.id || undefined}
            />
            <text x={d.centre[0]} y={d.centre[1] - d.half[1] + 9} className="w-map__label">
              {d.name}
            </text>
          </g>
        ))}
        {roads.map((r) => (
          <path key={r.id} d={r.d} strokeWidth={r.w} className="w-map__road" />
        ))}
        <circle r={22} className="w-map__hub" />
        <g transform={`translate(${x} ${z}) rotate(${(heading * 180) / Math.PI})`}>
          <path d="M5 0 L-4 -3.6 L-2 0 L-4 3.6 Z" className="w-map__car" />
        </g>
      </svg>
      <ul className="w-map__list">
        {DISTRICTS.map((d) => {
          const items = PLACEMENTS.filter((p) => p.district === d.id);
          const n = items.filter((p) => found.has(p.id)).length;
          return (
            <li key={d.id}>
              <span>{d.name}</span>
              <span className="w-mono">
                {n}/{items.length}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

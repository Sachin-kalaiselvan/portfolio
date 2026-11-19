import { useId } from 'react';
import { useReducedMotion } from '../../lib/hooks';

/**
 * An abstract plan of a fictional Bengaluru district, drawn for the
 * WHAT RA SUDEEEP? pages. It is an illustration, not a game capture.
 */

/** A family of parallel lines: start at (x, y), step by (dx, dy), each running by (lx, ly). */
function family(x: number, y: number, dx: number, dy: number, lx: number, ly: number, count: number) {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(`M${x + dx * i} ${y + dy * i} l${lx} ${ly}`);
  }
  return out.join(' ');
}

const ARTERIAL = 'M-60 650 C 260 560, 520 720, 820 540 S 1290 250, 1660 300';
const FLYOVER = 'M260 -40 C 520 220, 760 330, 980 470 S 1310 780, 1420 940';

export function CityPlan({ label, className }: { label: string; className?: string }) {
  const reduced = useReducedMotion();
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (n: string) => `cp-${n}-${u}`;
  return (
    <div className={className}>
      <svg className="cp" viewBox="0 0 1600 900" role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
        <defs>
          <clipPath id={id('lanes')}>
            <path d="M0 330 L560 250 L760 470 L700 900 L0 900 Z" />
          </clipPath>
          <clipPath id={id('res')}>
            <path d="M1060 560 L1600 470 L1600 900 L1180 900 Z" />
          </clipPath>
          <pattern id={id('hatch')} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <path d="M0 0 V10" className="cp-hatchline" />
          </pattern>
          <pattern id={id('dots')} width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.1" className="cp-dot" />
          </pattern>
        </defs>

        <rect width="1600" height="900" className="cp-bg" />

        {/* narrow lanes */}
        <g clipPath={`url(#${id('lanes')})`} className="cp-lanes">
          <path d={family(-100, 230, 0, 31, 1000, -150, 26)} />
          <path d={family(-200, 200, 47, 0, 150, 800, 22)} />
        </g>

        {/* residential blocks */}
        <g clipPath={`url(#${id('res')})`} className="cp-lanes">
          <path d={family(1000, 480, 0, 40, 700, -120, 14)} />
          <path d={family(1000, 400, 62, 0, 90, 600, 11)} />
        </g>

        {/* lake */}
        <path d="M1130 120 C 1230 70, 1400 90, 1440 170 S 1380 330, 1250 320 S 1060 230, 1130 120 Z" className="cp-lake" />
        <path d="M1130 120 C 1230 70, 1400 90, 1440 170 S 1380 330, 1250 320 S 1060 230, 1130 120 Z" fill={`url(#${id('hatch')})`} />

        {/* market */}
        <rect x="760" y="610" width="230" height="160" className="cp-market" transform="rotate(-8 875 690)" />
        <rect x="760" y="610" width="230" height="160" fill={`url(#${id('dots')})`} transform="rotate(-8 875 690)" />

        {/* arterial */}
        <path d={ARTERIAL} className="cp-road cp-road--outer" />
        <path d={ARTERIAL} className="cp-road cp-road--inner" id={id('arterial')} />
        <path d={ARTERIAL} className="cp-road cp-road--centre" />

        {/* flyover with pillars */}
        <path d={FLYOVER} className="cp-fly cp-fly--outer" />
        <path d={FLYOVER} className="cp-fly cp-fly--inner" id={id('flyover')} />
        <path d={FLYOVER} className="cp-pillars" />

        {/* moving traffic */}
        {!reduced && (
          <g className="cp-traffic">
            {[0, 2.6, 5.1, 7.9].map((b, i) => (
              <circle key={`a${i}`} r={i === 1 ? 6 : 4} className={i === 1 ? 'cp-car cp-car--accent' : 'cp-car'}>
                <animateMotion dur="11s" begin={`${b}s`} repeatCount="indefinite" rotate="auto">
                  <mpath href={`#${id('arterial')}`} />
                </animateMotion>
              </circle>
            ))}
            {[0, 4.4].map((b, i) => (
              <circle key={`f${i}`} r="4" className="cp-car">
                <animateMotion dur="9s" begin={`${b}s`} repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                  <mpath href={`#${id('flyover')}`} />
                </animateMotion>
              </circle>
            ))}
          </g>
        )}

        {/* annotations */}
        <g className="cp-labels">
          <text x="70" y="610">ARTERIAL — 4 LANES, NO DISCIPLINE</text>
          <text x="560" y="150">FLYOVER</text>
          <text x="90" y="820">LANES</text>
          <text x="790" y="806">MARKET</text>
          <text x="1170" y="370">LAKE</text>
          <text x="1290" y="850">RESIDENTIAL</text>
          <text x="70" y="64">N ↑</text>
          <path d="M70 92 H230" className="cp-scale" />
          <text x="70" y="124">ILLUSTRATION · NOT TO SCALE</text>
        </g>
      </svg>
    </div>
  );
}

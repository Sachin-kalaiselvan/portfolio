import { useEffect, useState } from 'react';

/** Plain loading card on the ivory board colour. "View as page" sits on the shell itself. */
export function LoadingScreen({ progress, visible, error, onPage }: { progress: number; visible: boolean; error: string | null; onPage(): void }) {
  const [gone, setGone] = useState(!visible);
  useEffect(() => {
    if (visible) {
      setGone(false);
      return;
    }
    const t = window.setTimeout(() => setGone(true), 900);
    return () => window.clearTimeout(t);
  }, [visible]);
  if (gone) return null;
  const pct = Math.round(Math.min(1, progress) * 100);
  return (
    <div className="w-loading" data-out={!visible || undefined} aria-live="polite">
      <div className="w-loading__card">
        <p className="w-mono">Site model · loading</p>
        <h1 className="w-loading__title">
          The Builder’s <em>World</em>
        </h1>
        <div className="w-loading__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Loading the world">
          <i style={{ transform: `scaleX(${Math.max(0.03, progress)})` }} />
        </div>
        <p className="w-mono w-loading__pct">{error ? error : `${String(pct).padStart(3, ' ')}%`}</p>
        {error && (
          <button type="button" className="w-btn" onClick={onPage}>
            Continue to the page
          </button>
        )}
      </div>
    </div>
  );
}

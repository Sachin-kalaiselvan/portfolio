import { lazy, Suspense, useEffect } from 'react';
import { readPrefs } from '../world/boot/prefs';
import { detectCapability } from '../world/boot/capability';
import { bridge, enterWorld, useBridge } from './bridge';
import './world-page.css';

const WorldOverlay = lazy(() => import('./WorldOverlay'));

/**
 * Hosts THE BUILDER'S WORLD over the page. Renders nothing on the server, so
 * the prerendered page is untouched. The overlay and the 3D engine are only
 * fetched once someone enters the world.
 */
export function WorldShell() {
  const { open, notice } = useBridge();

  // First visit to the home page: play the world by default on capable devices (decision D1).
  useEffect(() => {
    if (window.location.pathname !== '/' || (window.location.hash && window.location.hash !== '#stats')) return;
    if (readPrefs().mode === '2d') return;
    const cap = detectCapability();
    if (!cap.webgl2 || cap.saveData) return;
    enterWorld(null);
  }, []);

  return (
    <>
      {open && (
        <Suspense fallback={<div className="world-boot" aria-hidden="true" />}>
          <WorldOverlay />
        </Suspense>
      )}
      {!open && notice && <Notice text={notice} onClose={() => bridge.set({ notice: null })} />}
    </>
  );
}

function Notice({ text, onClose }: { text: string; onClose(): void }) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 9000);
    return () => window.clearTimeout(t);
  }, [onClose]);
  return (
    <div className="world-notice" role="status">
      <span>{text}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

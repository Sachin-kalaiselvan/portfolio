import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { WorldRuntime } from '../world/core/WorldRuntime';
import { readPrefs, writePrefs } from '../world/boot/prefs';
import { bridge, leaveWorld, useBridge } from './bridge';
import { useWorldState } from './useWorldState';
import { LoadingScreen } from './LoadingScreen';
import { IntroOverlay } from './IntroOverlay';
import { Hud } from './Hud';
import { TouchControls } from './TouchControls';
import { WorldMenu } from './WorldMenu';
import { MapPanel } from './MapPanel';
import './world.css';

/** Elements of the page that must not be reachable while the world covers it. */
const PAGE_SELECTORS = ['.stage', '.nav', '.footer', '.skip-link'];

function setPageHidden(hidden: boolean) {
  for (const sel of PAGE_SELECTORS) {
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      if (hidden) {
        el.setAttribute('inert', '');
        el.setAttribute('aria-hidden', 'true');
      } else {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      }
    });
  }
  document.documentElement.classList.toggle('world-locked', hidden);
}

/**
 * The world overlay: boots the runtime into a full-screen layer over the page
 * and draws the interface on top. Loaded on demand by WorldShell.
 */
export default function WorldOverlay() {
  const { open, spawnSlug, request } = useBridge();
  const navigate = useNavigate();
  const location = useLocation();
  const host = useRef<HTMLDivElement>(null);
  const [runtime, setRuntime] = useState<WorldRuntime | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const state = useWorldState(runtime?.store ?? null);
  const [coarse, setCoarse] = useState(false);
  const [leftHanded, setLeftHanded] = useState(false);
  const lastRequest = useRef(0);
  // navigate() can change identity with the location; the world must not reboot because of it.
  const navRef = useRef(navigate);
  navRef.current = navigate;

  useEffect(() => {
    setCoarse(window.matchMedia('(pointer: coarse)').matches);
    setLeftHanded(readPrefs().leftHanded);
  }, []);

  // Boot and dispose.
  useEffect(() => {
    if (!open || !host.current) return;
    let cancelled = false;
    let rt: WorldRuntime | null = null;
    setBootError(null);
    setPageHidden(true);
    const el = host.current;
    import('../world/boot/load')
      .then(({ loadRuntime }) => loadRuntime())
      .then(({ createWorld }) =>
        createWorld(el, {
          spawnSlug: bridge.get().spawnSlug,
          stats: window.location.hash === '#stats',
          onNavigate: (href) => {
            setPageHidden(false);
            navRef.current(href);
          },
          onFallback: (message) => leaveWorld(message),
        }),
      )
      .then((w) => {
        if (cancelled) {
          w.dispose();
          return;
        }
        rt = w;
        // Developer hook for QA, only with #stats in the URL.
        if (window.location.hash === '#stats') (window as unknown as { __world?: WorldRuntime }).__world = w;
        lastRequest.current = bridge.get().request;
        setRuntime(w);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error && e.message ? e.message : 'The 3D world could not start.';
        setBootError(msg);
        leaveWorld(`${msg} Here is the page view.`);
      });
    return () => {
      cancelled = true;
      rt?.dispose();
      setRuntime(null);
      setPageHidden(false);
    };
  }, [open]);

  // "View in the world" while the world is already running.
  useEffect(() => {
    if (!runtime || request === lastRequest.current) return;
    lastRequest.current = request;
    if (spawnSlug) runtime.spawnAt(spawnSlug);
    else runtime.closePanel();
    setPageHidden(true);
  }, [request, spawnSlug, runtime]);

  // Coming back to the home page (browser back) while a panel is open resumes driving.
  const mode = state?.mode;
  useEffect(() => {
    if (mode === 'panel' && location.pathname === '/' && !location.hash) {
      runtime?.closePanel();
      setPageHidden(true);
    }
  }, [location.pathname, location.hash, mode, runtime]);

  const viewAsPage = useCallback(() => {
    writePrefs({ mode: '2d' });
    leaveWorld(null);
  }, []);

  const backToWorld = useCallback(() => {
    runtime?.closePanel();
    setPageHidden(true);
  }, [runtime]);

  const toggleHand = useCallback(() => {
    setLeftHanded((v) => {
      writePrefs({ leftHanded: !v });
      return !v;
    });
  }, []);

  if (!open) return null;

  const inPanel = mode === 'panel';
  const showTouch = (coarse || state?.inputDevice === 'touch') && (mode === 'driving' || mode === 'controls');

  return (
    <>
      <div
        className="world"
        data-mode={mode ?? 'booting'}
        data-panel={inPanel || undefined}
        role="application"
        aria-label="The Builder's World, a driveable model of Sachin's work"
        aria-hidden={inPanel || undefined}
      >
        <div className="world__canvas" ref={host} />
        <LoadingScreen progress={state?.loadProgress ?? 0.03} visible={!state || mode === 'booting'} error={bootError} onPage={viewAsPage} />
        {state && runtime && !inPanel && (
          <>
            <IntroOverlay state={state} runtime={runtime} onPage={viewAsPage} />
            {(mode === 'driving' || mode === 'controls' || mode === 'focus') && <Hud state={state} runtime={runtime} touch={showTouch} />}
            {showTouch && <TouchControls runtime={runtime} state={state} leftHanded={leftHanded} />}
            <MapPanel state={state} runtime={runtime} />
            <WorldMenu state={state} runtime={runtime} onPage={viewAsPage} leftHanded={leftHanded} onToggleHand={toggleHand} touch={coarse} />
          </>
        )}
        {!inPanel && (
          <button type="button" className="world__page-link" onClick={viewAsPage}>
            View as page
          </button>
        )}
      </div>
      {inPanel && (
        <button type="button" className="back-to-world" onClick={backToWorld}>
          <span className="back-to-world__car" aria-hidden="true" />
          Back to the world
        </button>
      )}
    </>
  );
}

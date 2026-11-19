import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { getMeta } from '../seo';
import { useRevealScan } from '../lib/hooks';
import { getNavType, hasNavigated } from '../lib/transition';

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const SCROLL_KEY = 'scroll-positions';

function readPositions(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || '{}');
  } catch {
    return {};
  }
}

/** Remember where each history entry was scrolled to, for back/forward. */
export function saveScroll(key: string) {
  try {
    const all = readPositions();
    all[key] = window.scrollY;
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: back/forward will start at the top */
  }
}

function setMetaTag(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

interface Props {
  children: ReactNode;
  theme?: 'night';
  className?: string;
}

export function Page({ children, theme, className }: Props) {
  const location = useLocation();

  // Scroll: restore on back/forward, jump to hash, otherwise start at the top.
  useIso(() => {
    if (getNavType() === 'POP') {
      const y = readPositions()[location.key];
      if (typeof y === 'number') {
        window.scrollTo({ top: y, behavior: 'instant' });
        return;
      }
    }
    if (location.hash) {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) {
        el.scrollIntoView({ block: 'start', behavior: 'instant' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.key]);

  // Head tags for client-side navigation (the prerenderer writes them for first load).
  useEffect(() => {
    const meta = getMeta(location.pathname);
    document.title = meta.title;
    setMetaTag('meta[name="description"]', 'content', meta.description);
    setMetaTag('meta[property="og:title"]', 'content', meta.title);
    setMetaTag('meta[property="og:description"]', 'content', meta.description);
  }, [location.pathname]);

  // Night-themed pages recolour the document so overscroll matches.
  useEffect(() => {
    const html = document.documentElement;
    if (theme) html.dataset.theme = theme;
    else delete html.dataset.theme;
    return () => {
      delete html.dataset.theme;
    };
  }, [theme]);

  useRevealScan(location.key);

  return (
    <main id="main" tabIndex={-1} className={`page ${className ?? ''}`} data-enter={hasNavigated() || undefined}>
      {children}
    </main>
  );
}

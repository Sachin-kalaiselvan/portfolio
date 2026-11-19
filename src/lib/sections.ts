import type { MouseEvent } from 'react';
import type { NavigateFunction } from 'react-router-dom';

/**
 * In-page section links (/#work etc). On the home page we scroll and push a
 * history entry ourselves; elsewhere we navigate home and let the page scroll
 * to the hash once it has mounted.
 */
export function goToSection(e: MouseEvent, id: string, pathname: string, navigate: NavigateFunction) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  if (pathname === '/') {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (window.location.hash !== `#${id}`) {
      window.history.pushState(window.history.state, '', `/#${id}`);
    }
    // Move focus for keyboard and screen-reader users without a second jump.
    const heading = el.querySelector<HTMLElement>('h2, h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  } else {
    navigate(`/#${id}`);
  }
}

export const SECTION_EVENT = 'section-change';

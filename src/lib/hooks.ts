import { useEffect, useState } from 'react';

/** Subscribes to a media query. Returns `initial` during SSR and the first client render. */
export function useMedia(query: string, initial = false) {
  const [match, setMatch] = useState(initial);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return match;
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)');
export const useFinePointer = () => useMedia('(hover: hover) and (pointer: fine)');

/**
 * One shared IntersectionObserver for every reveal target on the page
 * (.rv, .rv-line, .rv-mask, .rv-rule). Targets reveal once and are released.
 */
let observer: IntersectionObserver | null = null;
/** Clipped targets (.rv-mask starts at inset(100%)) are observed through their parent. */
const proxies = new WeakMap<Element, Element>();
const SELECTOR = '.rv, .rv-line, .rv-mask, .rv-rule';

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const t = proxies.get(e.target) ?? e.target;
          t.classList.add('is-in');
          proxies.delete(e.target);
          observer!.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  return observer;
}

export function scanReveals(root: ParentNode = document) {
  if (typeof IntersectionObserver === 'undefined') {
    root.querySelectorAll(SELECTOR).forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = getObserver();
  root.querySelectorAll(SELECTOR).forEach((el) => {
    if (el.classList.contains('is-in')) return;
    if (el.classList.contains('rv-mask') && el.parentElement) {
      proxies.set(el.parentElement, el);
      io.observe(el.parentElement);
    } else {
      io.observe(el);
    }
  });
}

/** Re-scan reveal targets whenever `key` changes (e.g. the route). */
export function useRevealScan(key: unknown) {
  useEffect(() => {
    const id = requestAnimationFrame(() => scanReveals());
    return () => cancelAnimationFrame(id);
  }, [key]);
}

/** Current time in Bengaluru, updated each minute. Empty during SSR to avoid hydration mismatch. */
export function useBengaluruTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

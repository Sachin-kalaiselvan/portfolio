import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { saveScroll } from './components/Page';
import { markNavigated, setNavType } from './lib/transition';
import Home from './pages/Home';
import CaseStudy from './pages/CaseStudy';
import NotFound from './pages/NotFound';
import './styles/fonts';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

const LEAVE_MS = 340;

/**
 * Page transitions: the outgoing page fades and lifts away (CSS, data-leaving),
 * then the new route mounts and plays its entrance (CSS, data-enter on <main>).
 * Hash-only changes and reduced-motion visitors swap instantly.
 */
function useTransitionLocation() {
  const location = useLocation();
  const [shown, setShown] = useState(location);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (location.key === shown.key) return;
    markNavigated();
    const instant =
      location.pathname === shown.pathname || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (instant) {
      setShown(location);
      return;
    }
    setLeaving(true);
    const t = window.setTimeout(() => {
      setShown(location);
      setLeaving(false);
    }, LEAVE_MS);
    return () => window.clearTimeout(t);
  }, [location, shown.key, shown.pathname]);

  return { shown, leaving };
}

export function App() {
  const navigationType = useNavigationType();
  const { shown, leaving } = useTransitionLocation();
  setNavType(navigationType);

  // Remember the scroll position of the page on screen, under its own history entry.
  useEffect(() => {
    if (leaving) return;
    const key = shown.key;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        saveScroll(key);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [shown.key, leaving]);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Nav />
      <div className="stage" data-leaving={leaving || undefined}>
        <Routes location={shown} key={shown.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/work/:slug" element={<CaseStudy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

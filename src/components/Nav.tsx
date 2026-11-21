import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { navigation } from '../content/capabilities';
import { contact, profile } from '../content/profile';
import { goToSection, SECTION_EVENT } from '../lib/sections';
import { enterWorld } from '../ui-world/bridge';
import { writePrefs } from '../world/boot/prefs';

export function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Compact after leaving the top; hide while scrolling down, return on scroll up.
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 24);
        setHidden(y > 480 && y > last + 4);
        if (y < last - 4) setHidden(false);
        last = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onSection = (e: Event) => setActive((e as CustomEvent<string | null>).detail);
    window.addEventListener(SECTION_EVENT, onSection);
    return () => window.removeEventListener(SECTION_EVENT, onSection);
  }, []);

  useEffect(() => {
    if (pathname !== '/') setActive(pathname.startsWith('/work') ? 'work' : null);
    setOpen(false);
  }, [pathname]);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  // Scroll lock + Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => document.querySelector<HTMLElement>('#mobile-menu a')?.focus({ preventScroll: true }), 80);
    return () => {
      window.clearTimeout(t);
      html.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const onSectionClick = (id: string) => (e: MouseEvent) => {
    // Release the menu's scroll lock before scrolling, not after the re-render.
    if (open) document.documentElement.style.overflow = '';
    setOpen(false);
    goToSection(e, id, pathname, navigate);
  };

  return (
    <header
      className="nav"
      data-scrolled={scrolled || undefined}
      data-hidden={(hidden && !open) || undefined}
      data-open={open || undefined}
    >
      <div className="nav__bar wrap">
        <Link to="/" className="nav__mark" aria-label={`${profile.name} — home`} onClick={(e) => pathname === '/' && goToSection(e, 'top', pathname, navigate)}>
          <span className="nav__mono" aria-hidden="true">SK</span>
          <span className="nav__name">{profile.name}</span>
        </Link>

        <nav className="nav__links" aria-label="Primary">
          <ul>
            {navigation.map((item) => (
              <li key={item.id}>
                <a href={item.href} onClick={onSectionClick(item.id)} aria-current={active === item.id ? 'true' : undefined} className="nav__link">
                  {item.label}
                  <span className="nav__underline" aria-hidden="true" />
                </a>
              </li>
            ))}
            {profile.resumeUrl && (
              <li>
                <a href={profile.resumeUrl} className="nav__link">Résumé</a>
              </li>
            )}
          </ul>
        </nav>

        <button
          type="button"
          className="nav__world"
          onClick={() => {
            writePrefs({ mode: '3d' });
            enterWorld(null);
          }}
        >
          Enter the world
        </button>

        <a className="nav__cta mono" href={`mailto:${contact.email}`}>
          <span className="nav__cta-dot" aria-hidden="true" />
          Email
        </a>

        <button
          ref={toggleRef}
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
          <span className="nav__burger" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        className="menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-open={open || undefined}
        inert={!open}
        aria-hidden={!open}
      >
        <nav className="menu__inner wrap" aria-label="Mobile">
          <ol className="menu__list">
            {navigation.map((item, i) => (
              <li key={item.id} style={{ ['--i' as string]: i }}>
                <a href={item.href} onClick={onSectionClick(item.id)} className="menu__link">
                  <span className="mono muted">{String(i + 1).padStart(2, '0')}</span>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="nav__world menu__world"
            onClick={() => {
              setOpen(false);
              writePrefs({ mode: '3d' });
              enterWorld(null);
            }}
          >
            Enter the world
          </button>
          <div className="menu__foot">
            <a className="link" href={`mailto:${contact.email}`}>{contact.email}</a>
            <div className="menu__socials mono">
              {contact.github && <a href={contact.github} target="_blank" rel="noopener noreferrer">GitHub</a>}
              {contact.linkedin && <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
              <span className="muted">{profile.location}</span>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

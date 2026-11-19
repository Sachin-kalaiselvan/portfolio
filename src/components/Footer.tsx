import { useLocation, useNavigate } from 'react-router-dom';
import { navigation } from '../content/capabilities';
import { contact, profile } from '../content/profile';
import { goToSection } from '../lib/sections';

export function Footer() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.getElementById('main')?.focus({ preventScroll: true });
  };

  return (
    <footer className="footer" data-theme="night">
      <div className="wrap">
        <div className="footer__top">
          <p className="footer__name">{profile.name}</p>
          <button type="button" className="footer__top-btn mono" onClick={toTop}>
            <span className="arrow" aria-hidden="true">↑</span> Back to top
          </button>
        </div>
        <div className="footer__grid">
          <p className="footer__desc">
            Founder of {profile.business.name}. Software for manufacturers, backend systems, games and websites, built in{' '}
            {profile.location.split(',')[0]}.
          </p>
          <nav aria-label="Footer">
            <p className="mono muted footer__h">Index</p>
            <ul>
              {navigation.map((n) => (
                <li key={n.id}>
                  <a className="link link--quiet" href={n.href} onClick={(e) => goToSection(e, n.id, pathname, navigate)}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="mono muted footer__h">Elsewhere</p>
            <ul>
              <li>
                <a className="link link--quiet" href={`mailto:${contact.email}`}>Email</a>
              </li>
              {contact.github && (
                <li>
                  <a className="link link--quiet" href={contact.github} target="_blank" rel="noopener noreferrer">GitHub</a>
                </li>
              )}
              {contact.linkedin && (
                <li>
                  <a className="link link--quiet" href={contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                </li>
              )}
              {contact.other.map((o) => (
                <li key={o.href}>
                  <a className="link link--quiet" href={o.href} target="_blank" rel="noopener noreferrer">{o.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer__base mono muted">
          <span>© {year} {profile.name}</span>
          <span>{profile.location}</span>
          <span>Set in Geist and Instrument Serif</span>
        </div>
      </div>
    </footer>
  );
}

import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { profile } from '../content/profile';
import { getProject, projects } from '../content/projects';
import { useBengaluruTime } from '../lib/hooks';
import { goToSection } from '../lib/sections';
import { Media } from './Media';

const plates = [
  { slug: 'threxa', depth: 18, cls: 'plate--a' },
  { slug: 'fitness-guild', depth: 34, cls: 'plate--b' },
  { slug: 'what-ra-sudeeep', depth: 10, cls: 'plate--c' },
];

export function Hero() {
  const time = useBengaluruTime();
  const stage = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Pointer-reactive depth on the plate composition (desktop, fine pointer, motion allowed).
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.setProperty('--px', cx.toFixed(4));
      el.style.setProperty('--py', cy.toFixed(4));
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.0005 ? requestAnimationFrame(loop) : 0;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__inner wrap">
        <div className="hero__meta mono" data-enter style={{ ['--e' as string]: 1 }}>
          <span>Index — {new Date().getFullYear()}</span>
          <span className="hero__meta-role">Founder, {profile.business.name}</span>
          <span className="hero__meta-geo">12.97° N, 77.59° E</span>
          <span className="hero__meta-time" aria-live="off">
            Bengaluru <span className="hero__time">{time || '—:—'}</span> IST
          </span>
        </div>

        <h1 className="hero__title display" id="hero-title">
          <span className="visually-hidden">{profile.name} — </span>
          <span className="hero__line" style={{ ['--e' as string]: 2 }}><span>I build the business</span></span>
          <span className="hero__line" style={{ ['--e' as string]: 3 }}>
            <span><em className="serif-i accent">and</em> the software</span>
          </span>
          <span className="hero__line" style={{ ['--e' as string]: 4 }}><span>it runs on.</span></span>
        </h1>

        <div className="hero__foot">
          <div className="hero__intro" data-enter style={{ ['--e' as string]: 6 }}>
            <p className="hero__name">
              <strong>{profile.name}</strong>
              <span className="muted"> — {profile.roleLine}</span>
            </p>
            <p className="lead hero__lead">
              I run {profile.business.name}, a small studio in Bengaluru. I take ideas from a conversation on a factory floor to
              working products: a manufacturing ERP, backend pipelines, mobile games, and an open-world game set in my own city.
            </p>
            <div className="hero__actions">
              <a href="/#work" className="btn btn--solid" onClick={(e) => goToSection(e, 'work', pathname, navigate)}>
                Selected work <span className="mono hero__count">{String(projects.length).padStart(2, '0')}</span>
                <span className="arrow" aria-hidden="true">↓</span>
              </a>
              {profile.availability && (
                <span className="hero__avail mono">
                  <span className="status" data-s="Live">{profile.availability}</span>
                </span>
              )}
            </div>
          </div>

          <div className="hero__stage" ref={stage} aria-label="Selected projects" role="group">
            {plates.map(({ slug, depth, cls }, i) => {
              const p = getProject(slug)!;
              return (
                <Link
                  key={slug}
                  to={`/work/${slug}`}
                  className={`plate ${cls}`}
                  style={{ ['--depth' as string]: depth, ['--e' as string]: 5 + i }}
                  data-enter-plate
                >
                  <span className="plate__media" data-kind={p.thumb.kind}>
                    <Media media={p.thumb} sizes="(min-width: 900px) 30vw, 60vw" eager={i === 0} />
                  </span>
                  <span className="plate__tag mono">
                    <span>{p.index}</span>
                    <span>{p.name}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hero__scroll mono" data-enter style={{ ['--e' as string]: 9 }} aria-hidden="true">
          <span className="hero__scroll-line" />
          Scroll
        </div>
      </div>
    </section>
  );
}

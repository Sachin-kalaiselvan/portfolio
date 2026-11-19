import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { profile } from '../content/profile';
import { getProject, projects, reel } from '../content/projects';
import { useBengaluruTime } from '../lib/hooks';
import { goToSection } from '../lib/sections';
import { Picture } from './Media';

const STEP_MS = 5000;

function Reel() {
  const slides = reel.map((r) => ({ ...getProject(r.slug)!, shot: r.media }));
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [auto, setAuto] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    setAuto(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (!auto || paused) return;
    timer.current = window.setTimeout(() => setI((n) => (n + 1) % slides.length), STEP_MS);
    return () => window.clearTimeout(timer.current);
  }, [i, auto, paused, slides.length]);

  const p = slides[i];
  return (
    <div
      className="reel"
      data-auto={(auto && !paused) || undefined}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Link to={`/work/${p.slug}`} className="reel__frame" aria-label={`${p.name}: ${p.category}. Open case study`}>
        {slides.map((s, k) => (
          <span className="reel__slide" key={s.slug} data-on={k === i || undefined} aria-hidden={k !== i}>
            <Picture media={s.shot} sizes="(min-width: 900px) 52vw, 92vw" eager={k === 0} />
          </span>
        ))}
      </Link>
      <div className="reel__bar">
        <ol className="reel__tabs" aria-label="Projects shown">
          {slides.map((s, k) => (
            <li key={s.slug}>
              <button
                type="button"
                className="reel__tab"
                aria-current={k === i || undefined}
                onClick={() => setI(k)}
                style={{ ['--ms' as string]: `${STEP_MS}ms` }}
              >
                <span className="reel__line" aria-hidden="true">
                  <span key={k === i ? `${i}-on` : 'off'} />
                </span>
                <span className="mono">{s.index}</span> <span className="reel__name">{s.name}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="reel__cat mono muted">{p.category}</p>
      </div>
    </div>
  );
}

export function Hero() {
  const time = useBengaluruTime();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__inner wrap">
        <div className="hero__meta mono" data-enter>
          <span>{profile.business.name}</span>
          <span className="hero__meta-time" aria-live="off">
            Bengaluru <span className="hero__time">{time || '--:--'}</span> IST
          </span>
        </div>

        <div className="hero__grid">
          <div className="hero__text">
            <h1 className="hero__title display" id="hero-title">
              <span className="hero__line" style={{ ['--e' as string]: 1 }}><span>{profile.givenName}</span></span>
              <span className="hero__line" style={{ ['--e' as string]: 2 }}><span>{profile.familyName}</span></span>
            </h1>
            <p className="hero__lead" data-enter style={{ ['--e' as string]: 4 }}>
              I run {profile.business.name}, a small software studio in Bengaluru. I’m building THREXA, an ERP for
              manufacturers, and I make backend systems, mobile games, client websites and an open-world game set in
              Bengaluru.
            </p>
            <div className="hero__actions" data-enter style={{ ['--e' as string]: 5 }}>
              <a href="/#work" className="btn btn--solid" onClick={(e) => goToSection(e, 'work', pathname, navigate)}>
                See the work <span className="mono hero__count">{String(projects.length).padStart(2, '0')}</span>
                <span className="arrow" aria-hidden="true">↓</span>
              </a>
              {profile.availability && <span className="status mono" data-s="Live">{profile.availability}</span>}
            </div>
          </div>
          <div className="hero__reel" data-enter style={{ ['--e' as string]: 3 }}>
            <Reel />
          </div>
        </div>
      </div>
    </section>
  );
}

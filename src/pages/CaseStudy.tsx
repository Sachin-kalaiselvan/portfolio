import { enterWorld } from '../lib/world';
import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Page } from '../components/Page';
import { Figure, Media, Picture } from '../components/Media';
import { Lines } from '../components/Lines';
import { getProject, projects } from '../content/projects';
import type { Block, Project } from '../content/types';
import NotFound from './NotFound';

function Progress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div className="progress" aria-hidden="true"><div ref={bar} className="progress__bar" /></div>;
}

function Kicker({ children, n }: { children: string; n: number }) {
  return (
    <p className="cs-kicker mono rv">
      <span className="accent">{String(n).padStart(2, '0')}</span> <span className="muted">—</span> {children}
    </p>
  );
}

function BlockView({ block, n }: { block: Block; n: number }) {
  switch (block.type) {
    case 'text':
      return (
        <section className="cs-block cs-text grid">
          <Kicker n={n}>{block.kicker}</Kicker>
          <Lines as="h2" className="cs-title" lines={[block.title]} />
          <div className="cs-prose prose rv" style={{ ['--i' as string]: 1 }}>
            {block.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      );
    case 'media':
      return (
        <div className={`cs-block cs-media cs-media--${block.layout ?? 'full'}`}>
          <Figure
            media={block.media}
            sizes={block.layout === 'tall' ? '(min-width: 900px) 40vw, 100vw' : '(min-width: 1200px) 80vw, 100vw'}
          />
        </div>
      );
    case 'pair':
      return (
        <div className="cs-block cs-pair">
          <div className="cs-pair__grid">
            {block.items.map((m, i) => (
              <Figure key={i} media={m} sizes="(min-width: 900px) 40vw, 100vw" className={`cs-pair__item cs-pair__item--${i}`} />
            ))}
          </div>
          {block.note && <p className="cs-note mono mono--plain muted rv">{block.note}</p>}
        </div>
      );
    case 'phones':
      return (
        <div className="cs-block cs-phones">
          <div className="phones">
            {block.items.map((m, i) => (
              <figure className="phone-fig rv" key={m.base} style={{ ['--i' as string]: i }}>
                <span className="phone">
                  <Picture media={m} sizes="(min-width: 900px) 22vw, 70vw" />
                </span>
                {m.caption && <figcaption className="mono muted">{m.caption}</figcaption>}
              </figure>
            ))}
          </div>
          {block.note && <p className="cs-note mono mono--plain muted rv">{block.note}</p>}
        </div>
      );
    case 'list':
      return (
        <section className="cs-block cs-list">
          <div className="grid cs-list__head">
            <Kicker n={n}>{block.kicker}</Kicker>
            <Lines as="h2" className="cs-title" lines={[block.title]} />
          </div>
          <ul className={`cs-list__grid cs-list__grid--${block.columns ?? 2}`}>
            {block.items.map((it, i) => (
              <li key={it.name} className="cs-list__item rv" style={{ ['--i' as string]: i % 3 }}>
                <div className="cs-list__top">
                  <h3 className="cs-list__name">{it.name}</h3>
                  {it.state && <span className="cs-list__state mono">{it.state}</span>}
                </div>
                <p className="cs-list__body">{it.body}</p>
              </li>
            ))}
          </ul>
        </section>
      );
    case 'facts':
      return (
        <section className="cs-block cs-facts grid">
          <Kicker n={n}>{block.kicker}</Kicker>
          <Lines as="h2" className="cs-title" lines={[block.title]} />
          <dl className="cs-facts__list">
            {block.rows.map((r, i) => (
              <div key={r.label} className="cs-facts__row rv" style={{ ['--i' as string]: i }}>
                <dt className="mono muted">{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case 'status':
      return (
        <section className="cs-block cs-status grid">
          <Kicker n={n}>{block.kicker}</Kicker>
          <Lines as="h2" className="cs-title" lines={[block.title]} />
          <div className="cs-status__cols">
            <div className="rv">
              <h3 className="mono cs-status__h">Built</h3>
              <ul className="cs-status__list cs-status__list--done">
                {block.done.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
            {block.next.length > 0 && (
              <div className="rv" style={{ ['--i' as string]: 1 }}>
                <h3 className="mono cs-status__h">Still to do</h3>
                <ul className="cs-status__list cs-status__list--next">
                  {block.next.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {block.note && <p className="cs-status__note rv">{block.note}</p>}
        </section>
      );
    case 'code':
      return (
        <section className="cs-block cs-code grid">
          <Kicker n={n}>{block.kicker}</Kicker>
          <Lines as="h2" className="cs-title" lines={[block.title]} />
          <figure className="cs-code__fig rv">
            <figcaption className="mono cs-code__label">{block.label}</figcaption>
            <pre tabIndex={0}><code>{block.code}</code></pre>
            {block.note && <p className="cs-note mono mono--plain muted">{block.note}</p>}
          </figure>
        </section>
      );
    case 'pull':
      return (
        <blockquote className="cs-block cs-pull">
          <Lines as="p" className="serif-i" lines={[block.text]} />
        </blockquote>
      );
  }
}

function Intro({ p }: { p: Project }) {
  return (
    <header className="cs-intro wrap">
      <div className="cs-intro__top mono">
        <Link to="/#work" className="link link--quiet">
          <span className="arrow" aria-hidden="true">←</span> All work
        </Link>
        <span className="muted">Case study {p.index} / {String(projects.length).padStart(2, '0')}</span>
        <button type="button" className="cs-world" onClick={() => enterWorld('projects')}>
          View in the world
        </button>
        <span className="muted cs-intro__cat">{p.category}</span>
      </div>
      <h1 className={`cs-intro__title display cs-intro__title--${p.theme}`}>
        <span className="rv-line" style={{ ['--i' as string]: 0 }}>
          <span>{p.name}</span>
        </span>
      </h1>
      <div className="cs-intro__grid">
        <p className="cs-intro__lede serif cs-enter" style={{ ['--e' as string]: 2 }}>{p.intro}</p>
        <dl className="cs-intro__meta cs-enter" style={{ ['--e' as string]: 3 }}>
          {p.parent && (
            <div>
              <dt className="mono muted">A product of</dt>
              <dd>{p.parent}</dd>
            </div>
          )}
          <div>
            <dt className="mono muted">Role</dt>
            <dd>{p.role}</dd>
          </div>
          <div>
            <dt className="mono muted">Status</dt>
            <dd>
              <span className="status mono" data-s={p.status}>{p.status}</span>
              {p.statusNote && <span className="cs-intro__note muted">{p.statusNote}</span>}
            </dd>
          </div>
          {p.period && (
            <div>
              <dt className="mono muted">Period</dt>
              <dd>{p.period}</dd>
            </div>
          )}
          {p.stack.length > 0 && (
            <div>
              <dt className="mono muted">Built with</dt>
              <dd>{p.stack.join(', ')}</dd>
            </div>
          )}
          {p.links.length > 0 && (
            <div>
              <dt className="mono muted">Links</dt>
              <dd className="cs-intro__links">
                {p.links.map((l) => (
                  <a key={l.href} href={l.href} className="link" target="_blank" rel="noopener noreferrer">
                    {l.label} <span className="arrow arrow--ne" aria-hidden="true">↗</span>
                    <span className="visually-hidden"> (opens in a new tab)</span>
                  </a>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </header>
  );
}

export default function CaseStudy() {
  const { slug } = useParams();
  const p = slug ? getProject(slug) : undefined;
  if (!p) return <NotFound />;

  const i = projects.indexOf(p);
  const next = projects[(i + 1) % projects.length];
  const related = p.related.map((s) => getProject(s)).filter(Boolean) as Project[];
  let n = 0;

  return (
    <Page theme={p.theme === 'game' ? 'night' : undefined} className={`cs cs--${p.theme}`}>
      <Progress />
      <article aria-labelledby="cs-title">
        <span id="cs-title" className="visually-hidden">{p.name} — case study</span>
        <Intro p={p} />
        <div className={`cs-hero cs-hero--${p.theme}`}>
          <Figure media={p.cover} eager sizes="100vw" className="cs-hero__fig" />
        </div>
        <div className="cs-body wrap">
          {p.blocks.map((b, bi) => {
            if (b.type !== 'media' && b.type !== 'pair' && b.type !== 'phones' && b.type !== 'pull') n += 1;
            return <BlockView key={bi} block={b} n={n} />;
          })}
        </div>
      </article>

      {related.length > 0 && (
        <aside className="cs-related wrap" aria-labelledby="related-title">
          <h2 id="related-title" className="mono muted">Related work</h2>
          <ul>
            {related.map((r) => (
              <li key={r.slug}>
                <Link to={`/work/${r.slug}`} className="cs-related__link">
                  <span className="mono accent">{r.index}</span>
                  <span className="cs-related__name">{r.name}</span>
                  <span className="muted cs-related__cat">{r.category}</span>
                  <span className="arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <nav className="cs-next" aria-label="Next project">
        <Link to={`/work/${next.slug}`} className="cs-next__link wrap">
          <span className="mono muted">Next — {next.index}</span>
          <span className="cs-next__name display">{next.name}</span>
          <span className="cs-next__cat">{next.category} <span className="arrow" aria-hidden="true">→</span></span>
          <span className="cs-next__thumb" aria-hidden="true" data-kind={next.thumb.kind}>
            <Media media={next.thumb} sizes="320px" />
          </span>
        </Link>
      </nav>
    </Page>
  );
}

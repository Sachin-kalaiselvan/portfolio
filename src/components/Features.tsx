import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ImageMedia, Project } from '../content/types';
import { projects } from '../content/projects';
import { Figure, Picture } from './Media';
import { Lines } from './Lines';

function Meta({ p }: { p: Project }) {
  return (
    <dl className="feat__meta mono">
      <div>
        <dt className="muted">Role</dt>
        <dd>{p.role}</dd>
      </div>
      <div>
        <dt className="muted">Status</dt>
        <dd>
          <span className="status" data-s={p.status}>{p.status}</span>
        </dd>
      </div>
      {p.stack.length > 0 && (
        <div>
          <dt className="muted">Built with</dt>
          <dd>{p.stack.slice(0, 5).join(' · ')}</dd>
        </div>
      )}
    </dl>
  );
}

function CaseLink({ p, label = 'Read the case study' }: { p: Project; label?: string }) {
  return (
    <Link to={`/work/${p.slug}`} className="feat__link link">
      {label}
      <span className="visually-hidden"> — {p.name}</span>
      <span className="arrow" aria-hidden="true">→</span>
    </Link>
  );
}

function Head({ p, lines }: { p: Project; lines: ReactNode[] }) {
  return (
    <header className="feat__head">
      <p className="feat__kicker mono rv">
        <span className="accent">{p.index}</span> <span className="muted">/ {p.category}</span>
        {p.parent && <span className="muted"> · {p.parent}</span>}
      </p>
      <Lines as="h3" className="feat__title" lines={lines} />
    </header>
  );
}

const byslug = (s: string) => projects.find((p) => p.slug === s)!;

export function Features() {
  const threxa = byslug('threxa');
  const game = byslug('what-ra-sudeeep');
  const sentra = byslug('sentra');
  const guild = byslug('fitness-guild');
  const papillon = byslug('papillon-interiors');
  const phones = (guild.blocks.find((b) => b.type === 'phones') as { items: ImageMedia[] }).items;

  return (
    <div className="features">
      {/* 01 — wide cinematic product */}
      <article className="feat feat--product wrap" aria-labelledby="f-threxa">
        <Head p={threxa} lines={[<span id="f-threxa" key="a">THREXA</span>]} />
        <Link to={`/work/${threxa.slug}`} className="feat__media-link" aria-label={`${threxa.name} case study`} tabIndex={-1}>
          <Figure media={threxa.cover} className="feat__figure" />
        </Link>
        <div className="feat__body grid">
          <p className="feat__summary lead rv">{threxa.summary}</p>
          <div className="feat__side rv" style={{ ['--i' as string]: 1 }}>
            <Meta p={threxa} />
            <CaseLink p={threxa} />
          </div>
        </div>
      </article>

      {/* 02 — night band, cinematic */}
      <article className="feat feat--game" data-theme="night" aria-labelledby="f-game">
        <div className="feat--game__art" aria-hidden="false">
          <Figure media={game.cover} className="feat__figure feat__figure--bleed" />
        </div>
        <div className="feat--game__copy wrap">
          <p className="feat__kicker mono rv">
            <span className="accent">{game.index}</span> <span className="muted">/ {game.category}</span>
          </p>
          <Lines as="h3" className="feat__title feat__title--mega" lines={[<span id="f-game" key="a">WHAT RA</span>, 'SUDEEEP?']} />
          <div className="feat--game__row">
            <p className="lead rv">{game.summary}</p>
            <div className="rv" style={{ ['--i' as string]: 1 }}>
              <Meta p={game} />
              <CaseLink p={game} />
            </div>
          </div>
        </div>
      </article>

      {/* 03 — system: diagram + specification */}
      <article className="feat feat--system wrap" aria-labelledby="f-sentra">
        <div className="grid feat--system__grid">
          <div className="feat--system__copy">
            <Head p={sentra} lines={[<span id="f-sentra" key="a">Sentra</span>]} />
            <p className="lead rv">{sentra.summary}</p>
            <ul className="spec mono rv" style={{ ['--i' as string]: 1 }}>
              {sentra.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="rv" style={{ ['--i' as string]: 2 }}>
              <CaseLink p={sentra} />
            </div>
          </div>
          <Link to={`/work/${sentra.slug}`} className="feat--system__diagram" tabIndex={-1} aria-hidden="true">
            <Figure media={sentra.cover} />
          </Link>
        </div>
      </article>

      {/* 04 — app: staggered phones */}
      <article className="feat feat--app wrap" aria-labelledby="f-guild">
        <div className="grid">
          <div className="feat--app__copy">
            <Head p={guild} lines={[<span id="f-guild" key="a">Fitness</span>, 'Guild']} />
            <p className="lead rv">{guild.summary}</p>
            <div className="rv" style={{ ['--i' as string]: 1 }}>
              <Meta p={guild} />
              {guild.statusNote && <p className="feat__note mono mono--plain muted">{guild.statusNote}</p>}
              <CaseLink p={guild} />
            </div>
          </div>
          <Link to={`/work/${guild.slug}`} className="phones phones--feature" tabIndex={-1} aria-hidden="true">
            {phones.map((m, i) => (
              <span className="phone rv" key={m.base} style={{ ['--i' as string]: i }}>
                <Picture media={m} sizes="(min-width: 900px) 16vw, 40vw" />
              </span>
            ))}
          </Link>
        </div>
      </article>

      {/* 05 — client: framed image with offset caption */}
      <article className="feat feat--client wrap" aria-labelledby="f-pap">
        <div className="grid">
          <Link to={`/work/${papillon.slug}`} className="feat--client__media" tabIndex={-1} aria-hidden="true">
            <Figure media={papillon.cover} sizes="(min-width: 900px) 58vw, 100vw" />
          </Link>
          <div className="feat--client__copy">
            <Head p={papillon} lines={[<span id="f-pap" key="a">Papillon</span>, 'Interiors']} />
            <p className="lead rv">{papillon.summary}</p>
            <div className="rv" style={{ ['--i' as string]: 1 }}>
              <Meta p={papillon} />
              <CaseLink p={papillon} />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

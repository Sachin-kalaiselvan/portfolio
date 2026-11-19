import { useState, type ReactNode } from 'react';
import { about, contact, profile } from '../content/profile';
import { capabilities } from '../content/capabilities';
import { experiments } from '../content/experiments';
import { Lines } from './Lines';

export function SectionHead({ no, label, lines, id }: { no: string; label: string; lines: ReactNode[]; id: string }) {
  return (
    <header className="shead">
      <hr className="rule rv-rule" />
      <div className="shead__row">
        <p className="shead__label mono">
          <span className="accent">{no}</span> — {label}
        </p>
        <Lines className="shead__title h2" lines={lines} id={id} />
      </div>
    </header>
  );
}

export function About() {
  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <div className="wrap">
        <SectionHead no="02" label="About" id="about-title" lines={['I start with the business,', <span key="b">not the <em className="serif-i">stack.</em></span>]} />

        <div className="grid about__grid">
          {profile.portrait && (
            <figure className="about__portrait rv-mask">
              <div className="figure__inner">
                <img src={profile.portrait.src} alt={profile.portrait.alt} loading="lazy" />
              </div>
            </figure>
          )}
          <div className="about__intro">
            <p className="about__drop serif rv">
              {profile.name} is a founder in Bengaluru who designs, builds and sells his own products.
            </p>
          </div>
          <div className="about__text prose rv" style={{ ['--i' as string]: 1 }}>
            {about.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        <div className="approach">
          <p className="mono muted approach__label rv">How I work</p>
          <ol className="approach__list">
            {about.approach.map((a, i) => (
              <li key={a.title} className="approach__item rv" style={{ ['--i' as string]: i }}>
                <span className="approach__no mono accent">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="approach__title">{a.title}</h3>
                <p className="approach__body">{a.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid about__lower">
          <div className="about__now">
            <p className="mono muted rv">Currently exploring</p>
            <ul className="now-list">
              {about.exploring.map((e, i) => (
                <li key={e} className="rv" style={{ ['--i' as string]: i }}>
                  <span className="now-list__mark" aria-hidden="true" />
                  {e}
                </li>
              ))}
            </ul>
          </div>
          <div className="about__bg">
            <p className="mono muted rv">Background</p>
            <dl className="bg-list">
              {about.background.map((b, i) => (
                <div key={b.text} className="rv" style={{ ['--i' as string]: i }}>
                  <dt className="mono muted">{b.label}</dt>
                  <dd>{b.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Capabilities() {
  return (
    <section className="section caps" id="capabilities" aria-labelledby="caps-title">
      <div className="wrap">
        <SectionHead no="03" label="Capabilities" id="caps-title" lines={['What I can be', <span key="b"><em className="serif-i">trusted</em> with.</span>]} />
        <div className="caps__grid">
          {capabilities.map((c, gi) => (
            <div className="caps__col rv" key={c.group} style={{ ['--i' as string]: gi }}>
              <h3 className="caps__group mono">{c.group}</h3>
              <ul>
                {c.items.map((it) => (
                  <li key={it.name} className="caps__item">
                    <span className="caps__name">{it.name}</span>
                    <span className="caps__proof mono mono--plain muted">{it.proof}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Experiments() {
  return (
    <section className="section lab" id="experiments" aria-labelledby="lab-title">
      <div className="wrap">
        <SectionHead no="04" label="Experiments" id="lab-title" lines={['Smaller things,', <span key="b">built to <em className="serif-i">find out.</em></span>]} />
        <p className="lab__intro prose rv">
          Games, tools, prototypes and pipelines. Some are live, some are halfway, one was a hackathon weekend. Each is labelled with
          exactly where it stands.
        </p>
        <ol className="lab__list">
          {experiments.map((x, i) => (
            <li className="lab__item rv" key={x.name} style={{ ['--i' as string]: i % 4 }}>
              <span className="lab__no mono muted">E{String(i + 1).padStart(2, '0')}</span>
              <div className="lab__main">
                <h3 className="lab__name">{x.name}</h3>
                <p className="lab__kind mono muted">{x.kind}{x.year ? ` · ${x.year}` : ''}</p>
              </div>
              <p className="lab__body">{x.body}</p>
              <div className="lab__side mono">
                <span className="status" data-s={x.status}>{x.status}</span>
                {x.link && (
                  <a className="link lab__link" href={x.link.href} target="_blank" rel="noopener noreferrer">
                    {x.link.label}
                    <span className="arrow arrow--ne" aria-hidden="true">↗</span>
                    <span className="visually-hidden"> (opens in a new tab)</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Contact() {
  const [copied, setCopied] = useState<'idle' | 'done' | 'fail'>('idle');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied('done');
    } catch {
      setCopied('fail');
    }
    window.setTimeout(() => setCopied('idle'), 2400);
  };
  const links = [
    contact.github && { label: 'GitHub', href: contact.github },
    contact.linkedin && { label: 'LinkedIn', href: contact.linkedin },
    ...contact.other,
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title" data-theme="night">
      <div className="wrap">
        <p className="mono contact__label rv">
          <span className="accent">05</span> — Contact
        </p>
        <Lines
          as="h2"
          id="contact-title"
          className="contact__title display"
          lines={['Have something', <span key="b"><em className="serif-i">worth</em> building?</span>]}
        />
        <div className="contact__grid">
          <p className="lead contact__lead rv">
            A business problem, a product that needs finishing, a strange idea that deserves a prototype. Write to me directly; it comes
            straight to me.
          </p>
          <div className="contact__actions rv" style={{ ['--i' as string]: 1 }}>
            <a className="contact__email" href={`mailto:${contact.email}`}>
              <span>{contact.email}</span>
              <span className="arrow arrow--ne" aria-hidden="true">↗</span>
            </a>
            <div className="contact__row">
              <button type="button" className="btn contact__copy" onClick={copy}>
                <span aria-hidden="true" className="contact__copy-icon" data-done={copied === 'done' || undefined} />
                {copied === 'done' ? 'Copied to clipboard' : copied === 'fail' ? 'Copy failed — select the address' : 'Copy email address'}
              </button>
              <span className="visually-hidden" role="status" aria-live="polite">
                {copied === 'done' ? 'Email address copied' : ''}
              </span>
            </div>
            <ul className="contact__links mono">
              {links.map((l) => (
                <li key={l.href}>
                  <a className="link link--quiet" href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label} <span className="arrow arrow--ne" aria-hidden="true">↗</span>
                    <span className="visually-hidden"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

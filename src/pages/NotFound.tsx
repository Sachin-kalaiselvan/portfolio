import { Link } from 'react-router-dom';
import { Page } from '../components/Page';
import { projects } from '../content/projects';

export default function NotFound() {
  return (
    <Page className="nf">
      <section className="nf__inner wrap" aria-labelledby="nf-title">
        <p className="mono muted">Error 404</p>
        <h1 id="nf-title" className="nf__title display">
          Nothing was <em className="serif-i accent">built</em> here.
        </h1>
        <p className="lead nf__lead">The page you asked for does not exist, or it moved. These do:</p>
        <ul className="nf__list">
          {projects.map((p) => (
            <li key={p.slug}>
              <Link className="cs-related__link" to={`/work/${p.slug}`}>
                <span className="mono accent">{p.index}</span>
                <span className="cs-related__name">{p.name}</span>
                <span className="muted cs-related__cat">{p.category}</span>
                <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/" className="btn">
          Back to the index <span className="arrow" aria-hidden="true">→</span>
        </Link>
      </section>
    </Page>
  );
}

import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { App } from './App';
import { getMeta, headHtml, routes } from './seo';
import { projects } from './content/projects';
import { site } from './content/profile';

/** Used by scripts/prerender.mjs to write static HTML for every route. */
export function render(url: string) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
  return { html, head: headHtml(getMeta(url)) };
}

export { routes, projects, site };

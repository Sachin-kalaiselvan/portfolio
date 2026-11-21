import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { routeFirstVisit } from './lib/world';

// First visit to the home page goes to the 3D world (/world/); "View as page" there comes back with ?page.
routeFirstVisit();

const root = document.getElementById('root')!;
const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Prerendered pages are hydrated. If a host served HTML rendered for a different
// path (e.g. an SPA fallback), or in dev, render from scratch instead.
const rendered = document.querySelector<HTMLMetaElement>('meta[name="x-route"]')?.content;
const here = window.location.pathname.replace(/\/+$/, '') || '/';
if (root.firstElementChild && (rendered === here || rendered === '/404')) {
  hydrateRoot(root, tree);
} else {
  root.textContent = '';
  createRoot(root).render(tree);
}

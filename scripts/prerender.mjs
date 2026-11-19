// Writes static HTML for every route so the site is fast and crawlable without JS,
// then hydrates on the client. Also writes 404.html, sitemap.xml and robots.txt.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssr = join(root, 'dist-ssr');

const template = await readFile(join(dist, 'index.html'), 'utf8');
const { render, routes, site } = await import(pathToFileURL(join(ssr, 'entry-server.js')).href);

const page = (url) => {
  const { html, head } = render(url);
  if (!template.includes('<!--app-head-->') || !template.includes('<!--app-html-->')) {
    throw new Error('index.html is missing the <!--app-head--> / <!--app-html--> placeholders');
  }
  return template.replace('<!--app-head-->', `${head}\n    <meta name="x-route" content="${url}">`).replace('<!--app-html-->', html);
};

const fileFor = (url) => (url === '/' ? 'index.html' : `${url.replace(/^\//, '')}.html`);

for (const url of routes) {
  const out = join(dist, fileFor(url));
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, page(url));
  console.log('  prerendered', url, '→', fileFor(url));
}

await writeFile(join(dist, '404.html'), page('/404'));
console.log('  prerendered 404.html');

const base = site.url;
if (base) {
  const today = new Date().toISOString().slice(0, 10);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map((r) => `  <url><loc>${base}${r === '/' ? '/' : r}</loc><lastmod>${today}</lastmod></url>`),
    '</urlset>',
    '',
  ].join('\n');
  await writeFile(join(dist, 'sitemap.xml'), xml);
  console.log('  wrote sitemap.xml');
} else {
  console.warn('  VITE_SITE_URL not set: skipped sitemap.xml and canonical URLs.');
}

await writeFile(
  join(dist, 'robots.txt'),
  ['User-agent: *', 'Allow: /', base ? `Sitemap: ${base}/sitemap.xml` : '', ''].filter((l, i, a) => l || i === a.length - 1).join('\n'),
);
console.log('  wrote robots.txt');

await rm(ssr, { recursive: true, force: true });

import { contact, profile, site } from './content/profile';
import { getProject, projects } from './content/projects';

export interface Meta {
  title: string;
  description: string;
  path: string;
  image: string;
  type: 'website' | 'article' | 'profile';
  noindex?: boolean;
  jsonLd: Record<string, unknown>[];
}

const abs = (path: string) => (site.url ? `${site.url}${path}` : path);

const person = () => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  givenName: profile.givenName,
  familyName: profile.familyName,
  jobTitle: 'Founder',
  worksFor: { '@type': 'Organization', name: profile.business.name, url: profile.business.url },
  address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru', addressCountry: 'IN' },
  email: `mailto:${contact.email}`,
  sameAs: [contact.github, contact.linkedin].filter(Boolean),
  ...(site.url ? { url: site.url } : {}),
});

export function getMeta(pathname: string): Meta {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') {
    return {
      title: site.title,
      description: site.description,
      path: '/',
      image: site.ogImage,
      type: 'profile',
      jsonLd: [
        person(),
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: profile.name,
          ...(site.url ? { url: site.url } : {}),
        },
      ],
    };
  }
  const m = clean.match(/^\/work\/([^/]+)$/);
  const p = m ? getProject(m[1]) : undefined;
  if (p) {
    return {
      title: p.seo.title,
      description: p.seo.description,
      path: clean,
      image: `/og/og-${p.slug}.png`,
      type: 'article',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: p.name,
          headline: p.seo.title,
          description: p.seo.description,
          creator: { '@type': 'Person', name: profile.name },
          ...(site.url ? { url: abs(clean) } : {}),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: profile.name, ...(site.url ? { item: abs('/') } : {}) },
            { '@type': 'ListItem', position: 2, name: p.name, ...(site.url ? { item: abs(clean) } : {}) },
          ],
        },
      ],
    };
  }
  return {
    title: `Page not found · ${profile.name}`,
    description: site.description,
    path: clean,
    image: site.ogImage,
    type: 'website',
    noindex: true,
    jsonLd: [],
  };
}

/** Head tags as an HTML string, used by the prerenderer. */
export function headHtml(meta: Meta) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}">`,
    meta.noindex ? '<meta name="robots" content="noindex">' : '',
    site.url && !meta.noindex ? `<link rel="canonical" href="${abs(meta.path)}">` : '',
    `<meta property="og:type" content="${meta.type}">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(meta.description)}">`,
    `<meta property="og:image" content="${abs(meta.image)}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    site.url ? `<meta property="og:url" content="${abs(meta.path)}">` : '',
    `<meta property="og:locale" content="${site.locale}">`,
    `<meta property="og:site_name" content="${esc(profile.name)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(meta.title)}">`,
    `<meta name="twitter:description" content="${esc(meta.description)}">`,
    `<meta name="twitter:image" content="${abs(meta.image)}">`,
    ...meta.jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ];
  return tags.filter(Boolean).join('\n    ');
}

export const routes = ['/', ...projects.map((p) => `/work/${p.slug}`)];

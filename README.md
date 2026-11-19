# sachin-portfolio

Personal site for Sachin Kalaiselvan: selected work, case studies, about, experiments, contact.

React 19 + TypeScript on Vite, prerendered to static HTML at build time, then hydrated. No backend.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck → client build → SSR build → prerender every route
npm run preview    # serve dist/ on http://localhost:4173
npm test           # content checks (missing media, status labels, stock phrases, links, OG images)
```

## Deploy (Vercel)

1. Import the repo in Vercel. `vercel.json` already sets the build command, `dist` output, clean URLs and cache headers.
2. Once the domain is decided, add an environment variable `VITE_SITE_URL` (the full domain, e.g. `https://example.com`, no trailing slash) and redeploy. That turns on canonical URLs, absolute Open Graph URLs, `sitemap.xml` and the sitemap line in `robots.txt`.
3. Add the domain in Vercel → Settings → Domains.

## Where things live

| What | File |
|---|---|
| Name, role, availability, portrait, résumé, About copy, background | `src/content/profile.ts` |
| Email, GitHub, LinkedIn, other links | `src/content/profile.ts` → `contact` |
| Projects and case-study content | `src/content/projects.ts` |
| Experiments list | `src/content/experiments.ts` |
| Capabilities and navigation | `src/content/capabilities.ts` |
| Page titles, descriptions, JSON-LD | `src/seo.ts` (reads from content) |
| Design tokens (colour, type scale, spacing, motion) | `src/styles/tokens.css` |
| Components and layout | `src/styles/components.css`, `src/components/` |
| Images and video | `public/media/` |
| Social preview images | `public/og/` (regenerate with `python3 scripts/make-og.py`) |

Any field set to `null` in `profile.ts` (availability, portrait, résumé, LinkedIn) is hidden on the site until filled in.

### Adding a project

1. Put images in `public/media/` as `name-<width>.webp` (see `scripts/prepare-media.py`).
2. Append an object to `projects` in `src/content/projects.ts`. Its route `/work/<slug>`, index row, prerendered page, sitemap entry and meta tags follow automatically.
3. Run `python3 scripts/make-og.py` for its social image, then `npm test`.

The home page's feature compositions (`src/components/Features.tsx`) are art-directed per project; a new project appears in the index and gets a case study without touching that file.

## Design system

- **Palette:** warm ivory paper `#f3f0e8`, ink `#131312`, muted greys, one cobalt accent `#2440d6`. Vermilion `#e2532c` is reserved for “Live” indicators. A night theme (`data-theme="night"`) is used for the game section, its case study, contact and footer.
- **Type:** Geist (display and body), Instrument Serif italic for accents, Geist Mono for labels and metadata only. All self-hosted.
- **Grid:** 12 columns inside `.wrap`, fluid margins and gutters; below 900px grid children span full width.
- **Motion:** one easing family. Hero and case-study intros animate in pure CSS so they run before JavaScript loads. Below the fold, a single shared IntersectionObserver reveals lines, masks and rules once. Page transitions are a CSS fade-out/fade-in, timed in `App.tsx`. Signature interaction: the work index with a cursor-following preview (fine pointers only). `prefers-reduced-motion` turns every animation off and stops video autoplay.
- **Video:** never downloads until in view; autoplays muted only on wide, hover-capable screens without reduced motion or Save-Data. Everywhere else a poster shows with a play control.

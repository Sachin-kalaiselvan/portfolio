# The 3D world (/world/)

The world at `/world/` is Bruno Simon's open-source portfolio, [folio-2025](https://github.com/brunosimon/folio-2025). It is used under its MIT license, and his copyright notice is kept in `world-folio/license.md`. The code, models, sounds and island are his work. Credit appears in the world's "Behind the scene" modal and in the browser console.

## What was changed for Sachin

- **Content.** Projects, lab, social links and career labels are Sachin's:
  - data files: `world-folio/sources/data/{projects,lab,social}.js`;
  - images: `world-folio/static/projects/images/sk-*`, `static/lab/images/sk-*` and `static/career/*.png`;
  - generator for those images: `scripts/` outside the repo (Pillow).
- **Career timeline.** The year counter is hidden because Sachin's dates aren't recorded.
- **Landing letters.** They read SACHIN. The geometry comes from `world-folio/scripts/landing-letters.mjs` and is swapped in by `sources/Game/World/Areas/Areas.js`.
- **HTML.** Title, meta tags, the home modal and "Behind the scene" are rewritten in `world-folio/sources/index.html`. A "View as page" link was added.
- **Removed.** Bruno's client screenshots, his analytics, his 2019-site link (the time machine now opens the page version) and his server features (`VITE_SERVER_URL` is empty).
- **Spawn point.** `?spawn=projects|lab|career|social` chooses where the car starts. It is used by "View in the world" on the case studies.

## Build

`npm run build` builds the page, then `npm run build:world`. That installs `world-folio/`, builds it, and copies it to `dist/world/`.

On the first visit, `/` goes to `/world/` when the browser has WebGL 2 and no data saver. "View as page" returns with `?page`, which keeps the visitor on the page from then on (`src/lib/world.ts`).

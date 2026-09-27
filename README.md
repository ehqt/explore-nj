# Explore NJ

A map-centered guide to New Jersey's geography, history and culture for new residents.

Live site: https://ehqt.github.io/explore-nj/

The full product spec is in [spec.md](spec.md).

## Develop

Requires Node 24.

```sh
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build at http://localhost:4173/explore-nj/
```

## Deploy

Every push to `main` builds the site and publishes it to GitHub Pages via
`.github/workflows/deploy.yml`. In the repo's Settings → Pages, set **Source** to
**GitHub Actions** (one-time setup).

## Map data

The basemap is [OpenFreeMap](https://openfreemap.org/) (Positron style): free, no API
key, no cookies. MapLibre shows the required attribution automatically.

## Boundaries

County and municipal boundaries, 2020 populations and Wikipedia links are built by
`npm run boundaries` from U.S. Census Bureau files (public domain) and Wikidata, and the
results are committed in `public/data/boundaries/`. Rerun it when the Census publishes
new boundaries; `npm run validate:boundaries` (also in CI) checks the files agree.

## Licenses

Code: MIT. Written content: CC BY 4.0. Images keep their own licenses. See [LICENSE](LICENSE).

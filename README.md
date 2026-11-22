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

## Then & Now (population history)

Town populations by decade, 1940–2020, plus the latest Census estimate, mapped onto today's 564
municipalities. The data is built from public sources and committed in `public/data/history/`:

```sh
sh scripts/history/fetch.sh   # downloads the sources into .cache/history/ (one time)
npm run history               # builds public/data/history/population.json
```

Sources: NJ Department of Labor, *New Jersey Population Trends 1790 to 2000* (Table 6, 1940–2000);
U.S. Census Bureau 2010 and 2020 counts and Vintage 2025 subcounty estimates. Renamed, merged and
dissolved towns are mapped in `scripts/history/crosswalk.ts`, along with one corrected typo in the
state table. The build fails if any source row can't be placed or if towns don't add up to the
published county and state totals (beyond a few small inconsistencies in the state table itself,
which are listed in the output).

### Phase 2: town measures and who lives here

```sh
sh scripts/history/fetch-phase2.sh    # NHGIS town tables + 2010 block groups (needs IPUMS_API_KEY)
sh scripts/history/fetch-phase2b.sh   # NHGIS race/ethnicity on block groups + 1970/1980 tract maps
npm run history:measures              # public/data/history/measures.json
npm run history:dots                  # public/data/history/dots/ (one dot per 50 residents)
```

NHGIS needs a free IPUMS account; put its API key in your shell as `IPUMS_API_KEY` (never in the
repo). Survey (ACS) values whose coefficient of variation is above 30% are flagged as too uncertain
and greyed out on the map. Data from IPUMS NHGIS (Manson et al., IPUMS National Historical Geographic
Information System, Minneapolis, MN: IPUMS).

## Licenses

Code: MIT. Written content: CC BY 4.0. Images keep their own licenses. See [LICENSE](LICENSE).

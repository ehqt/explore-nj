# Explore NJ — v1 spec

Agreed with Eric on 2026-09-26 through a Q&A session in the project thread, then revised the same day after an independent critic review (all 16 review decisions are logged at the end).

## Goal
A map-centered web app that helps **new New Jersey residents** get to know the state's geography, history and culture.

## Audience and tone
- A general adult newcomer who is curious but busy. It assumes no prior NJ knowledge and uses plain English.
- No family- or commuter-specific features in v1.
- Content is honest and factual. It covers hard topics briefly (Lenape displacement, slavery in NJ, the 1967 events in Newark) alongside light current culture (sports rivalries, diners, the pork roll/Taylor ham debate, the Jersey attitude).

## Core experience
- **Explore first.** The user browses a full-screen map freely and clicks on anything.
- **"Start here" tour.** Seven stops, each a place or feature, chosen to cover the state's range (e.g. Hudson waterfront, Delaware Water Gap, Trenton/Princeton, Pinelands, the Shore, South Jersey farmland, Newark); the final list is set with the content. It never auto-starts: a first-visit hint offers it, and a Tour button is always in the header. A bar shows "Stop N of 7" with Back, Next and Exit. Clicking elsewhere pauses the tour with a Resume option, and Esc or Exit ends it. Each stop opens that entry's normal panel.
- **"Find my town" button:** uses browser geolocation and finds the town on the device (point-in-polygon locally; the location is never sent anywhere), then opens that town's card. It doesn't list nearby places.
- No trip planning, nearby-places list, typed address search, or list view in v1.

## Map layers
| Layer | Shown | Click opens |
|---|---|---|
| Curated places (~60 pins) | Always; pins are color-coded by pillar (geography / history / culture) with a small legend and no filter toggles | Place panel |
| Features: areas and lines (Pinelands and Highlands with their official boundaries, Delaware River, Palisades, barrier islands, …) | Outline or line with a label; only the label and outline are clickable, so the county underneath stays clickable | Feature panel |
| "North / Central / South Jersey" | Large soft labels only, with no drawn boundaries | Jersey 101 topic about the split and the "does Central Jersey exist?" debate |
| Counties (21) | State-level zoom | County panel |
| Municipalities (564 today; count derived from the data) | Fade in when zoomed closer | Town card |

## Panels
The panel is a side panel on desktop and a bottom sheet on phones.
- **Place:** name, 2–3 paragraphs, a photo (a stored copy of a Wikimedia Commons image, with its attribution) or a no-photo fallback, "why it matters to a newcomer", a "worth a visit?" note for visitable places.
- **Feature:** a curated overview and the places inside or along it.
- **Topic (Jersey 101):** a curated explainer with "see it here" links to related places.
- **County:** a short curated blurb covering the county seat, its character and a few highlights.
- **Town (automatic, no hand-written text):** name, municipality type (borough/township/city/…), county, population, the curated places inside it, and a "Read more" Wikipedia link.
- **Every panel ends with a "Sources" list of clickable links** (these open in a new tab). A link counts as verified only when:
  - it was checked during drafting and again by the verifier session to support the text it's cited for,
  - an automated link check confirms it still loads (see Engineering requirements for how the check runs), and
  - Eric has reviewed the entry.
  Town cards list their data sources (NJOGIS, Census, Wikipedia).
- **Every panel has a "Report a correction" link** to a Google Form prefilled with the entry name and link.

**Pillars:** each entry has one primary pillar (sets pin color and icon), chosen by why a newcomer would care today. Optional secondary pillar tags show in the panel and are searchable.

## Browsing
- A single search box across places, features, Jersey 101 topics, towns and counties, including postal/community-name aliases.
- Clicking any map feature opens its panel.

## Content and data
- Each entry (place, feature, topic, county blurb) is its own Markdown file with frontmatter fields (name, kind, coordinates or geometry file, pillar, sources, review stage) and the prose below. The build compiles them into app data. Boundaries are GeoJSON.
- **Review workflow:** Claude opens a PR per batch of about 10 entries, with the verifier's report in the description. Eric comments or approves in GitHub; Claude then records the approval in each file and merges. Only approved entries appear on the site. Drafts under review are visible in the public repo; Eric accepted that.
- Photos come from Wikimedia Commons, with attribution stored per image.
- Boundaries come from U.S. Census Bureau TIGER/Line county subdivisions (public domain; in New Jersey every county subdivision is a municipality), with water bodies over 0.5 km² cut out and borders simplified to about 15 m. Population is the 2020 Census (P.L. 94-171). This replaced the original NJOGIS plan on 2026-09-27: the Census files are public domain, share codes with the population data, and avoid the licensing uncertainty found with state GIS data. Rebuild with `npm run boundaries`.
- **Fact-checking (required for all content):**
  - Every specific claim (dates, numbers, names, "first/oldest/largest") is checked against an original or authoritative source: NPS, NJ state/county/municipal sites, the Census, official site operators, museums, historical societies or scholarly works.
  - Wikipedia can point to sources, but it is never the only source for a specific fact.
  - Superlatives and contested claims need two independent sources, or they get reworded or cut.
  - Anything that can't be confirmed from a source gets cut, not guessed.
  - A claim can rely only on sources the verifier can read online (websites, open-access papers, Google Books or archive.org pages with the relevant text visible). Books not readable online may appear under "Further reading" (WorldCat or DOI link), never as a claim's only support.
  - Claude drafts. A separate verifier session with fresh context gets only the text and its sources and tries to disprove each claim. Eric then reviews every entry.
  - Hard-history entries (Lenape history and present, slavery and gradual abolition, 1967 Newark) also go to a local historian or historical society for outside review, or cite the community's own sources. Outside review is requested, not guaranteed; without it, these entries ship on Eric's approval with community-sourced citations.
  - Each entry records its stage as one of `drafted`, `source-checked`, `second-pass`, `approved`, with a date and a checker for each stage. Only `approved` entries ship.
  - Sources are stored for each claim or paragraph in the data, even though the panel shows one combined list, so reviewers can see which source backs which sentence.
  - All text is written fresh and never copied from Wikipedia (Wikipedia text is CC BY-SA, which would attach to ours).
- **Selection targets for v1:** about 80 entries (about 60 places, 10 features, 10 Jersey 101 topics). Geography, history and culture each get about a third. Every one of the 21 counties has at least 2 places. North, Central and South Jersey each get at least a quarter of the places. Each pillar mixes well-known and lesser-known entries, and history includes the agreed hard topics. CI reports the distribution so gaps are visible.
- **Freshness:** volatile entries (businesses, teams, anything likely to change) are tagged. A scheduled job opens a GitHub issue listing entries due for re-checking: volatile every 6 months, everything else every 2 years. Our text never states hours or prices; it links to the official site.
- **"Worth a visit?"** appears only on places legally open to the public. It never goes on private property, closed sites or abandoned places that invite trespassing.
- **Style guide:**
  - Contested event names: give the common names and briefly explain why naming is debated (e.g. 1967 Newark "rebellion" vs. "riots"), instead of silently picking one.
  - Lenape: present tense for the living nations, name the specific nations, link their own sites, and say plainly that tribal recognition is complicated without taking a side.
  - Contested historical facts (e.g. how long slavery lasted under gradual abolition) follow the two-source rule, with dates exactly as the sources state them.
  - Culture and opinion: frame as "commonly described as" and source that the view or debate exists, not that it's true. Humor is affectionate and aimed at the state as a whole, never at ethnic groups or particular towns. Debates such as pork roll vs. Taylor ham give both sides equal footing.
- Out of v1: practical/civic info (transit, services).

## Tech and hosting
- Static site built with Vite and TypeScript, using MapLibre GL with free OpenStreetMap-based tiles (no API key, no cost).
- A GitHub Action deploys it to GitHub Pages.
- Desktop first, but fully usable on phones.
- A new public repo `ehqt/explore-nj` will serve at `ehqt.github.io/explore-nj`. The app title is "Explore NJ". Code is MIT licensed. Our own text is CC BY 4.0. Images keep their own licenses, listed per image, and resized copies are stored in the repo rather than loaded from Commons; if Commons removes a file over copyright, we remove our copy too.

## Engineering requirements (adopted from the 2026-09-26 critic review)
These are technical fixes with a clear right answer, so they were adopted without a separate decision.

**Boundaries and geodata**
- Reproject boundary data to WGS84.
- Simplify with topology preserved (mapshaper) so shared borders and holes survive. Build counties by dissolving municipalities so the lines match exactly. Use shoreline-clipped polygons.
- Handle donut towns (Freehold Borough inside Freehold Township, and similar): clicks hit the inner town, labels use polylabel/point-on-surface, and fly-to uses the bounding box.
- Join on codes (Census GEOID / state municipal code), never names. Derive the municipality count from the data and assert it in CI. Handle the 2022 Pine Valley–Pine Hill merger against 2020 Census figures.
- Take municipality type (including villages) from a data field, and label population "(2020 Census)".
- Build Wikipedia links from Wikidata IDs, not names.
- Places near the state line or spanning towns store their town(s) explicitly instead of relying on point-in-polygon.
- Town cards with no curated places show a useful empty state (county, type, nearest curated places), never "Places: none".
- Set a data payload budget (target: under 1.5 MB gzipped for all boundaries) and a performance budget for a mid-range phone.

**Map**
- Define click precedence: pin > feature label or outline > town > county. Counties stop being clickable once towns show.
- Use a muted, low-label basemap, set max bounds, and mute areas outside NJ while keeping NYC and Philadelphia visible.
- Pin colors come from a colorblind-safe palette, and each pillar also gets its own icon shape. Dense areas use collision handling that keeps pillar colors visible.
- `flyTo` uses padding so targets aren't hidden behind the panel. Tour motion respects `prefers-reduced-motion`.
- The bottom sheet never covers the OSM attribution. Devices without WebGL get a fallback message.

**Search**
- Results always show type and county, to separate duplicate names (Washington Township, Union County vs. Union Township vs. Union City, etc.).
- Add postal and community names (Census Designated Places such as Iselin and Princeton Junction) as aliases that point to their municipality.
- Normalize for fuzzy matching (hyphens, Mt./Mount, Twp/Boro).
- An empty query lists everything, which keeps places reachable from the keyboard since pins on the canvas can't be tabbed to.

**Content data and validation**
- A JSON Schema is validated in CI with readable errors. CI checks that coordinates fall inside NJ's bounding box (catching swapped lng/lat), and that tour, feature and topic references point to existing, approved entries.
- Places without a photo get a designed no-photo fallback.
- Image attribution (author, license, license link, file page, modified note) is stored per image.

**Links**
- The link check runs on a schedule and opens a GitHub issue for broken links. It does not block deploys. It retries, sends a descriptive User-Agent, rate-limits, and caches results.
- Wayback Machine snapshot URLs are stored as backups for each source.
- External links use `rel="noopener"`, and any rendered Markdown is sanitized.

**Hosting and app shell**
- Set Vite `base` to `/explore-nj/`, and load data through `import.meta.env.BASE_URL`.
- Every entry gets a prerendered page at build time (e.g. `/explore-nj/place/barnegat-lighthouse/`) with title, description and Open Graph image, which loads the app with that panel open. These are the shareable links, and search engines can index them. Town and county cards get the same treatment. The phone back button closes the bottom sheet.
- Keep all UI strings in one file so translation is possible later.
- Add a one-line privacy note that map tiles and images load from third parties.
- Show a first-visit hint that points to the tour.
- Before relying on OpenFreeMap, check its current terms and keep a fallback tile style ready.

## Defaults Claude chose (not discussed; can be changed)
- No analytics or cookies.
- Basic accessibility: keyboard-reachable panels and search, and alt text on photos.
- The OSM tile provider will be a free, key-less style (e.g. OpenFreeMap) that respects its usage policy.

## Build order
1. Repo, Vite + MapLibre scaffold, and Pages deploy (a bare map live).
2. Data model, JSON Schema and CI checks, plus a **content pilot of 5 entries**: one place, one feature (Pinelands), one topic (pork roll/Taylor ham), one hard-history entry and one county blurb. Each goes through drafting, source-checking, the second pass, Eric's review and CI. Fix the format and process before going further.
3. County and municipal layers with town cards.
4. Places, features and topics in the UI, the panels, and search.
5. The "Start here" tour.
6. Remaining content in batches, each going through the same pipeline.

## v1 done and maintenance
- **v1 is done when:** about 80 entries are approved and meet the selection targets; every county and town has a working card; the tour, search and "Find my town" work on a mid-range phone within the performance budget; the link check is clean; and 3–5 real newcomers have tried it and their feedback has been triaged.
- **Measuring usefulness:** no analytics, so correction reports and tester feedback are the measure.
- **Maintenance:** Eric owns the app. Scheduled jobs open GitHub issues for broken links, entries due for re-checking, and a yearly municipal-merger check. Eric can hand any of them to Claude.

## Review decisions log (all 16 decided with Eric on 2026-09-26)
1. **How non-point content works:** three entry kinds. **Places** are pins. **Features** are areas and lines drawn on the map (Pinelands, Highlands, Delaware River, Palisades, barrier islands). **Topics** have no location (pork roll/Taylor ham, diners, the Jersey attitude); they live in a searchable "Jersey 101" section, are linked from relevant panels, and have optional "see it here" links to places.
2. **Region scheme:** no clickable regions. Counties are the only clickable areas at state zoom. The Pinelands and Highlands are features with their official boundaries. North/Central/South Jersey appear as soft labels that open a Jersey 101 topic, which also mentions the six official tourism regions.
3. **Build order:** run a 5-entry content pilot right after the bare map is live (see Build order).
4. **"Report a correction":** every panel has a "Report a correction" link to a Google Form, prefilled with the entry name and link. Eric creates the form (Claude drafts the questions). Reports land in the form's spreadsheet, which Eric checks.
5. **Tour details:** see "Start here" tour under Core experience.
6. **Who checks what:** see Fact-checking (fresh verifier session, Eric reviews all, outside review requested for hard history).
7. **Style guide:** see Style guide under Content and data.
8. **Selection criteria:** see Selection targets under Content and data.
9. **Content format and review workflow:** Markdown per entry, PR per batch of ~10, drafts public in the repo (see Content and data).
10. **Content license and image hosting:** text CC BY 4.0, code MIT, images self-hosted as resized copies with per-image licenses.
11. **Offline sources:** see Fact-checking (online-readable sources only for claims; offline books go under Further reading).
12. **Primary pillar rule:** one primary pillar plus optional secondary tags (see Pillars under Panels).
13. **Freshness and visit guardrails:** see Freshness and "Worth a visit?" under Content and data.
14. **Which town am I in:** on-device "Find my town" button (see Core experience).
15. **Discoverability:** prerendered page per entry with link previews (see Hosting and app shell).
16. **v1 done and maintenance:** see "v1 done and maintenance".

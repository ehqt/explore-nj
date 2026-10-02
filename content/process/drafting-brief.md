# Drafting brief: Explore NJ content entries

You are drafting ONE content entry for "Explore NJ", a map app that helps new New Jersey residents learn the state's geography, history and culture. A separate verifier will later try to disprove every sentence you write using only the sources you cite. Write so it survives that.

Repository: /Users/ehayashi/Developer/explore-nj (do not run git; do not edit any file except the ones named in your assignment).

Read these first:
- content/README.md (entry format)
- content/schema/entry.schema.json (every allowed field)
- content/places/great-falls-paterson.md (a finished, approved example of a place with a photo)
- content/topics/pork-roll-taylor-ham.md (a finished topic)
- content/features/pinelands.md and content/geometry/README.md (if you are drafting a feature)

## Fact-checking rules (all required)

1. Every specific claim (dates, numbers, names, "first/oldest/largest/only") must be supported by a source you actually fetched and read. Cite sources per paragraph with [@source-id] at the end of the paragraph.
2. Prefer original or authoritative sources: National Park Service (nps.gov), other federal agencies, state/county/municipal sites, official site operators, museums, historical societies, court opinions, legislation. Wikipedia may point you to sources but is never the only source for a fact, and is never cited for a claim.
3. Superlatives ("first", "oldest", "largest", "only", "most") and contested claims need TWO independent sources (two pages from the same publisher are not independent). Otherwise either attribute it ("which the National Park Service describes as the oldest...") or cut it.
4. Only use sources a verifier can read online. Fetch with curl, e.g. `curl -sSL -A 'ExploreNJ/1.0 (https://github.com/ehqt/explore-nj)' URL` (retry with `-A 'Mozilla/5.0'` if refused), and strip HTML with a short python script. If a site returns 403 or a bot challenge, do not use it as a source, unless a Wayback Machine snapshot of it is readable: then cite the page with that snapshot as `archive_url` and date the claim ("the park's page, as archived in July 2026, says...").
5. Anything you cannot confirm from a source gets cut, not guessed. Never add detail from your own general knowledge.
6. Write every sentence fresh. Do not copy or closely paraphrase source sentences. Short direct quotes in quotation marks are fine if exact.
7. Do not state hours, fees or prices; the official_url covers those.

## Style

- Plain English for a curious, busy adult who knows nothing about New Jersey. Short paragraphs.
- Places: 2–3 intro paragraphs, then "## Why it matters" (required), then "## Worth a visit?" only if the place is legally open to the public (needs `open_to_public: true` and `official_url`). Never recommend private property, closed or abandoned sites.
- Topics have no section headings other than "## Why it matters".
- Culture and opinion: frame as "commonly described as" and source that the view exists. Humor is affectionate and never aimed at groups or particular towns.
- Lenape and other living communities: present tense.
- Contested names or facts: say they're contested rather than picking a side silently.
- Refer to people held in slavery as "enslaved people". Set `hard_history: true` for entries about slavery, dispossession or similar.

## Photo (places only; optional but wanted)

Find a photo on Wikimedia Commons with a license of CC0, public domain, CC BY or CC BY-SA. Use the Commons API to get the license and author:
`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=File:NAME&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280` (send the ExploreNJ User-Agent).
Download the 1280px thumbnail to public/images/<entry-id>.jpg, then compress it:
`sips -s format jpeg -s formatOptions low <file> --out <file>`.
Look at the image to confirm it shows the subject and write accurate alt text. Fill every `photo` field; `license_url` is the license's URL, `source_url` the Commons file page, `modified: Resized and recompressed`.

## Location

Set `location: { lng, lat }` on the thing itself. Use coordinates from an authoritative source where possible (the NPS API gives park coordinates: `https://developer.nps.gov/api/v1/parks?parkCode=XXXX&api_key=DEMO_KEY`; National Register nominations give UTM or lat/long points). For a street address use the U.S. Census geocoder (https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=...&benchmark=Public_AR_Current&format=json). Then check the point against OpenStreetMap (Nominatim reverse lookup) to make sure it is on the thing, not on a road or highway next to it; if it isn't, use the OpenStreetMap feature's position and say so in the review note. Run the validator (below): it works out which municipality the point is in. If the point is in water, on a border, or the place spans towns, add `municipalities: [GEOID, ...]` explicitly; GEOIDs and names are in public/data/boundaries/municipalities.json.

## Review stages

Add exactly these two stages (today's date is in the environment; use it):
```yaml
review:
  - stage: drafted
    date: YYYY-MM-DD
    by: Claude (drafting session)
  - stage: source-checked
    date: YYYY-MM-DD
    by: Claude (drafting session)
    note: <one or two sentences: what you checked, where the pin came from, and what you left out and why>
```

## Archive links

For each source, look up an existing Wayback Machine snapshot:
`https://archive.org/wayback/available?url=<url>` and add `archive_url` (use https) when one exists. Don't request new snapshots. If the API rate-limits you (HTTP 429), skip it.

## Before you finish

1. Run `cd /Users/ehayashi/Developer/explore-nj && node scripts/validate-content.ts` and fix every error or warning that names your file. Ignore problems in other files (other drafters are working in parallel).
2. Re-read your entry sentence by sentence against the source text you fetched. Remove anything unsupported.

## Your final reply

Reply with:
- The file path(s) you created.
- A table: each sentence (shortened) → source id → the exact supporting words from the source.
- What you left out and why (unconfirmed facts, sources you couldn't read).
- Anything the reviewer should know (e.g. conflicting figures between sources).

Do not post anywhere, do not message anyone, and do not edit files other than your entry and its image (and, for a feature, its geometry file and its row in content/geometry/README.md).

## Lessons from earlier batches (verifiers flagged these repeatedly; avoid them)

- **Close paraphrase.** Don't keep a source sentence's structure and swap a few words. Rebuild each sentence from the facts: different opening, different order. Keep only short exact quotes, in quotation marks.
- **Your own inferences and judgements.** No arithmetic or conclusions stated as fact, no "many people think...", no "best-known", "famous", "gentler", no opinion lines like "X is a lesson in how landscapes form".
- **Old sources presented as current.** If a source is old or undated, either date the claim ("a 1976 nomination described...") or don't use it for anything in the present tense. Words like "still", "today", "now" need a current source; check whether the fact has changed.
- **Mis-restating a source.** Don't turn "a century ago" into "a century earlier", "safest way" into "had to", "worked on" into "developed", "as early as 1855" into "by 1855 ... already", or "near the southern boundary" into "at the heart". Keep the source's strength and its hedges ("it appears", "is said to be").
- **Truncated quotes.** A quote must mean the same thing it means in the source; read the whole sentence it comes from.
- **Check a source against itself.** Narratives can contradict a source's own tables, deed lists, appendices or certification pages. Check them.
- **When sources disagree, say so.** Give each figure with who says it; don't silently pick one. But if one source settles it (e.g. the official listing date on a nomination's certification page), use that.
- **Small added words get caught.** "first came", "loops past", "ponds", "white", "large", "almost everything", "families", "two days later" were all unsupported additions. Every word of detail needs a source.
- **Counts must match lists.** If you say "four areas", list exactly four.
- **Businesses, tours, ferries, exhibits** change: set `volatile: true` if the entry mentions them.
- **Court cases:** describe what a ruling actually decided (e.g. dismissed on legal grounds) so it can't be read as deciding something else.
- **Never put any email address or personal information in request headers.**
- **Sites that block automated reading** (don't use directly; try their Wayback copy): NJ DEP (dep.nj.gov, state park pages), visitnj.org, nj.com, loc.gov, Camden County, NJ Monthly, NJ Spotlight News, Friends Journal, hmdb.org, olmsted.org.

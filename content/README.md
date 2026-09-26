# Content

Every entry in the app is one Markdown file:

| Folder | Kind | On the map |
|---|---|---|
| `places/` | place | a pin (`location`) |
| `features/` | feature | an area or line (`geometry`, a file in `geometry/`) |
| `topics/` | topic | none; appears in "Jersey 101" and is linked from other panels |
| `counties/` | county | the county's shape (from the boundary data) |

The file name is the entry's id and its URL slug, e.g. `places/great-falls-paterson.md`.

## Anatomy of an entry

```markdown
---
id: great-falls-paterson
kind: place
name: Great Falls of the Passaic
summary: One sentence for search results and link previews.
pillar: history            # geography | history | culture: why a newcomer cares today
tags: [geography]          # optional secondary pillars
location: { lng: -74.1802, lat: 40.9158 }
sources:
  - id: nps-history        # cited in the text as [@nps-history]
    title: History & Culture
    publisher: National Park Service
    url: https://...
    accessed: 2026-09-26
review:
  - stage: drafted
    date: 2026-09-26
    by: Claude (drafting session)
---

Intro paragraphs. Every paragraph ends with the sources that support it. [@nps-history]

## Why it matters

Required for places. [@nps-history]

## Worth a visit?

Only for places open to the public; needs `open_to_public: true` and `official_url`. [@nps-faq]
```

The full list of fields and what each means is in `schema/entry.schema.json`.

## Rules the checks enforce

`npm run validate` checks every entry and explains any problem in plain words. It runs in CI on every pull request. Among other things:

- every paragraph cites at least one source, and every source is cited (or marked `further_reading: true`)
- no links or HTML in the text; links belong in `sources`
- coordinates and shapes fall inside New Jersey (catches swapped longitude and latitude)
- `related` entries exist, and an approved entry never links to an unapproved one
- review stages go in order: `drafted` → `source-checked` → `second-pass` → `approved`
- the second pass isn't done by the drafting session, and only a person can approve

Only entries whose last stage is `approved` appear on the site.

## Review workflow

1. Claude drafts entries and checks each claim against its sources (`drafted`, `source-checked`).
2. A separate verifier with fresh context tries to disprove every claim using only the cited sources (`second-pass`). Its report goes in the pull request.
3. Eric reviews the pull request. To approve an entry, add a stage like this (or ask Claude to):

   ```yaml
     - stage: approved
       date: 2026-10-01
       by: Eric
       note: Optional; for hard-history entries, say whether outside review happened.
   ```

Fact-checking and style rules are in [spec.md](../spec.md) under "Content and data".

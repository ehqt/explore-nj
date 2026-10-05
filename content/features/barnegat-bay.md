---
id: barnegat-bay
kind: feature
name: Barnegat Bay
summary: A long, shallow estuary between the New Jersey mainland and its barrier islands, open to the Atlantic Ocean through a handful of inlets.
pillar: geography
tags: [history]
geometry: barnegat-bay.geojson
geometry_source: tiger-areawater
related: [barnegat-lighthouse, forsythe-refuge]
sources:
  - id: usgs-ds937
    title: "Marine Geophysical Data Collected in a Shallow Back-Barrier Estuary, Barnegat Bay, New Jersey (Data Series 937, ver. 1.1, 2016)"
    publisher: U.S. Geological Survey
    url: https://pubs.usgs.gov/ds/0937/pdf/ds937.pdf
    accessed: 2026-10-02
    archive_url: https://web.archive.org/web/20260306213527/https://pubs.usgs.gov/ds/0937/pdf/ds937.pdf
  - id: noaa-cp-ch5
    title: "U.S. Coast Pilot 3, Chapter 5: Intracoastal Waterway (New Jersey), 27 Sep 2026 edition"
    publisher: NOAA Office of Coast Survey
    url: https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp3/CPB3_C05_WEB.pdf
    accessed: 2026-10-02
  - id: noaa-cp-ch4
    title: "U.S. Coast Pilot 3, Chapter 4: New Jersey Coast, 27 Sep 2026 edition"
    publisher: NOAA Office of Coast Survey
    url: https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp3/CPB3_C04_WEB.pdf
    accessed: 2026-10-02
    archive_url: https://web.archive.org/web/20251206083825/https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp3/CPB3_C04_WEB.pdf
  - id: ibsp
    title: Island Beach State Park
    publisher: New Jersey Department of Environmental Protection, State Parks, Forests & Historic Sites
    url: https://dep.nj.gov/parksandforests/state-park/island-beach-state-park/
    accessed: 2026-10-02
    archive_url: https://web.archive.org/web/20260813220206/https://dep.nj.gov/parksandforests/state-park/island-beach-state-park/
  - id: boro-history
    title: History
    publisher: Borough of Barnegat Light
    url: https://barnegatlight.org/barnegat-light/history/
    accessed: 2026-10-02
    archive_url: https://web.archive.org/web/20260212220050/https://barnegatlight.org/barnegat-light/history/
  - id: bbp-bay
    title: The Barnegat Bay
    publisher: Barnegat Bay Partnership
    url: https://barnegatbaypartnership.org/barnegat-bay/
    accessed: 2026-10-02
    archive_url: https://web.archive.org/web/20260615083006/https://barnegatbaypartnership.org/barnegat-bay/
  - id: bbp-about
    title: About Barnegat Bay Partnership
    publisher: Barnegat Bay Partnership
    url: https://barnegatbaypartnership.org/about/
    accessed: 2026-10-02
    archive_url: https://web.archive.org/web/20260927102900/https://barnegatbaypartnership.org/about/
  - id: bbp-concerns
    title: Bay Concerns
    publisher: Barnegat Bay Partnership
    url: https://barnegatbaypartnership.org/barnegat-bay/bay-concerns/
    accessed: 2026-10-02
  - id: epa-nep
    title: Overview of the National Estuary Program
    publisher: U.S. Environmental Protection Agency
    url: https://www.epa.gov/nep/overview-national-estuary-program
    accessed: 2026-10-02
  - id: fws-home
    title: Edwin B. Forsythe National Wildlife Refuge
    publisher: U.S. Fish & Wildlife Service
    url: https://www.fws.gov/refuge/edwin-b-forsythe
    accessed: 2026-10-02
    archive_url: https://web.archive.org/web/20260921223600/https://www.fws.gov/refuge/edwin-b-forsythe
  - id: tiger-areawater
    title: "TIGER/Line Shapefiles 2025: Area Hydrography, Ocean County, NJ (tl_2025_34029_areawater), polygon \"Barnegat Bay\""
    publisher: U.S. Census Bureau (public domain)
    url: https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/tl_2025_34029_areawater.zip
    accessed: 2026-10-02
review:
  - stage: drafted
    date: 2026-10-02
    by: Claude (drafting session)
  - stage: source-checked
    date: 2026-10-02
    by: Claude (drafting session)
    note: Claims checked against the cited pages and PDFs; the Island Beach park page blocks automated reading, so its August 2026 Wayback copy was used and the claims from it are dated. The map shape is the one Census TIGER/Line 2025 polygon named Barnegat Bay, which leaves out Manahawkin Bay and Little Egg Harbor. Left out the bay-front town list (no single source names them) and the Partnership's 75-square-mile figure is given alongside the USGS 337-square-kilometer figure because they disagree.
  - stage: second-pass
    date: 2026-10-04
    by: Claude (separate verifier session)
    note: "Round 1: Geometry re-created byte-for-byte from the TIGER 2025 \"Barnegat Bay\" polygon (public domain, Census credited); area figures credited correctly; Wayback claims dated; Hudson naming attributed. Fixed: an unattributed \"only three inlets\" contradicted by the Coast Pilot (Beach Haven Inlet), now both given; the map caption now says the shape excludes Manahawkin Bay and Little Egg Harbor; the half-foot tide was widened from the Intracoastal Waterway to all inland waters; two close paraphrases. Round 2: The round-1 suggestion added \"lasting\" and \"salt water\" (source: brackish tidal water); fixed."
---

Barnegat Bay is a shallow estuary on the New Jersey coast, with the mainland along its western edge and barrier islands between it and the Atlantic Ocean to the east. Island Beach State Park sits on one of those islands, north of Barnegat Inlet; as archived in August 2026, the park's page described 10 miles of "narrow barrier island" with the ocean on one side and the bay on its west. South of the inlet lies Long Beach Island, whose northern tip is the borough of Barnegat Light. [@usgs-ds937] [@ibsp] [@noaa-cp-ch5] [@boro-history]

Sources measure the bay differently. The Barnegat Bay Partnership gives 75 square miles for the whole estuarine system, which it says takes in Barnegat Bay, Manahawkin Bay and Little Egg Harbor. A 2016 U.S. Geological Survey report puts the Barnegat Bay and Little Egg Harbor estuary at 337 square kilometers, and the two area figures do not match. That report describes an estuary far longer than it is wide: roughly 70 kilometers from the Point Pleasant Canal south to Little Egg Harbor, against a width of about 7 kilometers. NOAA's Coast Pilot gives Barnegat Bay alone a north-south length of about 25 miles. The shape on this map is only the water the Census Bureau labels Barnegat Bay; it leaves out Manahawkin Bay and Little Egg Harbor, which the Census maps separately, so it is smaller than either estuary measured above. [@bbp-bay] [@usgs-ds937] [@noaa-cp-ch5] [@tiger-areawater]

Older soundings cited in the USGS report gave the estuary an average depth of 1.3 meters, with a wide network of shallow shoals. According to the Coast Pilot, depths in the western half of Barnegat Bay run 5 to 10 feet, and most of the eastern half is broad flats. [@usgs-ds937] [@noaa-cp-ch5]

The ocean gets in at just three places, the USGS report says: in the north, the Point Pleasant Canal, by way of Manasquan Inlet; in the south, Little Egg Inlet; and roughly midway between them, Barnegat Inlet, where Barnegat Lighthouse stands on the south side. NOAA's Coast Pilot also lists Beach Haven Inlet, just north of Little Egg Inlet, as a separate inlet. Two major rivers, the Metedeconk and the Toms, empty into the bay. The Coast Pilot notes that winds from the north or south drive the bay's water toward its ends. Along stretches of the Intracoastal Waterway away from the inlets, it gives a normal tidal range of only about half a foot, against 3 to 4 feet near the inlets, though strong winds that last a long time can push the level as much as 3 feet above mean high water or below mean low water. [@usgs-ds937] [@noaa-cp-ch4] [@noaa-cp-ch5]

The Partnership's short history of the bay says Henry Hudson sailed on it in 1609 and called it "Barende-gut," which it translates from Dutch as "inlet with breakers." Its timeline lists the 1880s and 1890s as the decades when people began treating the region as a "summer playground," and 1926 for the Point Pleasant Canal, which opened the upper bay and the Metedeconk River to the tides. The Partnership ties that canal to what followed: brackish tidal water spread into freshwater habitats such as cranberry bogs, the bay started to become estuarine habitat, and traditional ways of fishing and hunting changed. [@bbp-bay]

## Why it matters

The land that drains into the bay covers more than 600 square miles, reaching west into the Pine Barrens, and the Partnership counts over 560,000 people living there. It values the bay's contribution to New Jersey's economy at more than $4 billion a year. The bay is also wildlife habitat: the salt marsh of the Edwin B. Forsythe National Wildlife Refuge stretches 50 miles from Barnegat Bay in Brick Township south to Reeds Bay, and the Island Beach park page, as archived in August 2026, called the bay "a nutrient-rich feeding ground for birds." [@bbp-bay] [@fws-home] [@ibsp]

In its 2016 report on a study begun in 2011 with the New Jersey Department of Environmental Protection, the USGS said the estuary was "experiencing degraded water quality, algal blooms, loss of seagrass, and increases in oxygen stress." The Partnership says stormwater running off the land has led to "increased and recurring" harmful algal blooms. Set up in 1997 to help protect and restore the watershed's water quality and natural resources, the Partnership is one of 28 National Estuary Programs, an EPA program that Congress established under the Clean Water Act in 1987. [@usgs-ds937] [@bbp-concerns] [@bbp-about] [@epa-nep] [@bbp-bay]

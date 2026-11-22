---
id: raritan-bay
kind: feature
name: Raritan Bay and Sandy Hook Bay
summary: The New Jersey side of the southern part of New York Harbor's Lower Bay, from the Raritan River's mouth between Perth Amboy and South Amboy east to Sandy Hook.
pillar: geography
tags: [history]
geometry: raritan-bay.geojson
geometry_source: tiger-areawater
related: [sandy-hook]
volatile: true
sources:
  - id: noaa-cp2-ch11
    title: "U.S. Coast Pilot 2, Chapter 11: New York Harbor and Approaches, 15 Nov 2026 edition"
    publisher: NOAA Office of Coast Survey
    url: https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp2/CPB2_C11_WEB.pdf
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20260105042825/https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp2/CPB2_C11_WEB.pdf
  - id: hep-report
    title: "Two States – One Bay: A bi-state conversation about the future of Raritan Bay (conference report)"
    publisher: New York-New Jersey Harbor & Estuary Program and the Sustainable Raritan River Initiative
    url: https://hudsonriver.org/wp-content/uploads/2017/11/RaritanBay_Report_2016.pdf
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20250210224734/https://www.hudsonriver.org/wp-content/uploads/2017/11/RaritanBay_Report_2016.pdf
  - id: hep-conference
    title: "Two States: One Bay"
    publisher: Hudson River Foundation (New York-New Jersey Harbor & Estuary Program)
    url: https://hudsonriver.org/article/two-states-one-bay/
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20250922231205/https://hudsonriver.org/article/two-states-one-bay/
  - id: hep-program
    title: NY-NJ Harbor & Estuary Program
    publisher: Hudson River Foundation (New York-New Jersey Harbor & Estuary Program)
    url: https://hudsonriver.org/estuary-program/
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20261029203057/https://hudsonriver.org/estuary-program/
  - id: dep-ne-reports
    title: "Bureau of Marine Water Monitoring: North East Reports"
    publisher: New Jersey Department of Environmental Protection
    url: https://dep.nj.gov/wms/bmw/ne-reports/
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20260118052654/https://dep.nj.gov/wms/bmw/ne-reports/
  - id: epa-slag
    title: "Raritan Bay Slag: Cleanup Activities (Superfund Site Profile)"
    publisher: U.S. Environmental Protection Agency
    url: https://cumulis.epa.gov/supercpad/SiteProfiles/index.cfm?fuseaction=second.cleanup&id=0206276
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20261104210312/https://cumulis.epa.gov/supercpad/SiteProfiles/index.cfm?fuseaction=second.Cleanup&id=0206276
  - id: usgs-relief
    title: The NYC Region - shaded relief image of the south shore of Raritan Bay
    publisher: U.S. Geological Survey
    url: https://www.usgs.gov/media/images/nyc-region-shaded-relief-image-south-shore-raritan-bay
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20260211074255/https://www.usgs.gov/media/images/nyc-region-shaded-relief-image-south-shore-raritan-bay
  - id: tiger-areawater
    title: "TIGER/Line Shapefiles 2025: Area Hydrography, Middlesex County (tl_2025_34023_areawater) and Monmouth County (tl_2025_34025_areawater), NJ, polygons \"Raritan Bay\" and \"Sandy Hook Bay\""
    publisher: U.S. Census Bureau (public domain)
    url: https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/
    accessed: 2026-11-21
review:
  - stage: drafted
    date: 2026-11-21
    by: Claude (drafting session)
  - stage: source-checked
    date: 2026-11-21
    by: Claude (drafting session)
    note: Claims checked against the November 2026 Coast Pilot chapter, the HEP conference report and pages, the EPA site profile, a USGS image page and the NJ DEP shellfish page (read only through its January 2026 Wayback copy, so its claims are dated). The existing geometry file was rebuilt from the three Census TIGER/Line 2025 polygons named Raritan Bay (two) and Sandy Hook Bay (one) and matched byte for byte; no pin is needed for a feature. Left out the DEP page's "over 10 millions acres" estuary figure (it looks like a typo) and the report's menhaden landings figure (no second source).
  - stage: second-pass
    date: 2026-11-22
    by: Claude (separate verifier session)
    note: "Round 1: the shape rebuilds byte-for-byte from the three TIGER 2025 polygons and leaves out the separately mapped rivers; the Coast Pilot, Harbor & Estuary Program, DEP and Census definitions of the bay are each attributed; the 2016 report is in the past tense; the shellfish classifications are dated to the January 2026 DEP archive; EPA Superfund facts match its November 2026 page. Fixed: an undated present-tense shellfish claim; \"held responsible\" overstated the EPA's \"potentially responsible\"; a close paraphrase of the Coast Pilot's ice passage. Round 2: the rewrites added \"warns\", \"pile\" and \"cleansed\" (relay is not cleansing in the source); returned to the sources' terms."
  - stage: approved
    date: 2026-11-22
    by: Eric
---

Raritan Bay and Sandy Hook Bay both belong to Lower Bay, which NOAA's Coast Pilot defines as the part of New York Harbor reaching from Sandy Hook west to the Raritan River and north to The Narrows. The dividing point between the two, in the Coast Pilot's descriptions, is Point Comfort, where Keansburg sits. West of it is Raritan Bay, with Staten Island to the north; the Raritan River flows into its western end between Perth Amboy and South Amboy, and Perth Amboy occupies the point where that river meets the Arthur Kill. East of Point Comfort is Sandy Hook Bay, with Sandy Hook on its eastern side. [@noaa-cp2-ch11]

Where the bay begins and ends depends on who is drawing it. A conference report from the NY-NJ Harbor & Estuary Program and the Sustainable Raritan River Initiative at Rutgers University "roughly defined" Raritan Bay far more broadly: open water and shore from the Verrazano-Narrows Bridge to the tidal reach of the Raritan River at New Brunswick, and out to Sandy Hook. A New Jersey Department of Environmental Protection page on shellfish waters, as archived in January 2026, describes a Raritan-Sandy Hook Bay complex that takes in both bays, with a surface area of approximately 69,188 acres. The shape on this map is narrower than either: only the water that the Census Bureau's 2025 map files for Middlesex and Monmouth counties label "Raritan Bay" and "Sandy Hook Bay", joined into one area. Those are New Jersey county files, so the New York side of Raritan Bay, off Staten Island, is not part of the shape, and the Census maps the Raritan River, the Arthur Kill and the Navesink and Shrewsbury rivers as separate waters, which are left out too. [@hep-report] [@dep-ne-reports] [@tiger-areawater]

The Coast Pilot calls Raritan Bay "full of shoals", gives its depths as 7 to 18 feet, and says a federal channel 35 feet deep runs through its northern part to the Arthur Kill. For Sandy Hook Bay it gives 30 feet just inside Sandy Hook, shoaling gradually to 15 feet near the southern part, and rates the bay "an excellent anchorage." The Shrewsbury and Navesink rivers reach the bay through one shared entrance at its southern end, east of the Highlands of Navesink. According to the Coast Pilot, drift ice from Lower Bay gathers in Raritan Bay during easterly winds and can obstruct shipping, though usually only briefly; the prevailing westerlies push it out of the bay. [@noaa-cp2-ch11]

A U.S. Geological Survey elevation image of Raritan Bay's south shore in Monmouth County shows what it calls "the rugged topography of the Atlantic Highlands escarpment," and the Coast Pilot puts the town of Atlantic Highlands on Sandy Hook Bay's south shore, about 2 miles west of Sandy Hook. Going west along the New Jersey side, the Coast Pilot places Keyport Harbor 3 miles from Point Comfort and the shared entrance of Cheesequake Creek and Stump Creek 6 miles from it. [@usgs-relief] [@noaa-cp2-ch11]

## Why it matters

Raritan Bay is shared by New York and New Jersey. The Harbor & Estuary Program, one of 28 National Estuary Programs, has a scope that extends to the watersheds of the rivers draining to New York Harbor, the Raritan among them. In its report on a June 2015 conference that drew more than 200 participants, it said the bay's resources are enjoyed by "more than one million nearby residents" of the two states. The report named pollution, development pressure, climate change and coastal flooding as harms to the bay, and said differing rules on each side of the state line make managing it harder. Compared with other parts of the harbor estuary, it said, the bay has a "far more natural shoreline," from the wetlands of Cheesequake State Park and Conaskonk Point in New Jersey to Conference House Park and Butler Manor Woods on Staten Island. [@hep-program] [@hep-conference] [@hep-report]

As of January 2026, clams harvested from the New Jersey side of the bay could not go straight to market. The conference report put the bay's hard clam fishery at about half of New Jersey's hard clam landings, and said poor water quality meant clams from these restricted waters had to be cleansed, which in New Jersey happened at two depuration plants in Monmouth County. As archived in January 2026, the DEP's shellfish page classified the state's Raritan and Sandy Hook bays growing area as 77 percent Restricted and 23 percent Prohibited, with no Approved waters; it said shellfish harvested there must go through depuration or relay before they can be marketed, and that depuration is used for 100 percent of hard clams from the Restricted waters. [@hep-report] [@dep-ne-reports]

One stretch of the New Jersey shore is a federal Superfund site. In the Laurence Harbor section of Old Bridge and in Sayreville, a seawall and a jetty were built with slag, which the EPA describes as waste from the bottom of blast furnaces used to smelt metal; by the agency's account, the seawall is made of up to 80 percent lead slag. The EPA put the Raritan Bay Slag site on its National Priorities List in November 2009 and completed the cleanup of its Margaret's Creek sector in September 2018. In February 2025 a court entered a consent decree requiring parties identified as potentially responsible for the site to pay $151.1 million. When read in November 2026, the EPA's site page said the agency was working with the U.S. Army Corps of Engineers to hire a contractor to clean up the seawall sector. [@epa-slag]

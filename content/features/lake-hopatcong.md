---
id: lake-hopatcong
kind: feature
name: Lake Hopatcong
summary: A lake in Morris and Sussex counties, made by damming two glacial ponds, that fed the Morris Canal and later became a hotel resort.
pillar: geography
tags: [history]
geometry: lake-hopatcong.geojson
geometry_source: tiger-morris
municipalities: ["3402734980", "3402748690", "3402764980", "3403732910"]
related: [morris-canal]
volatile: true
sources:
  - id: lh-act
    title: "Lake Hopatcong Protection Act (P.L. 2000, Chapter 175, approved January 8, 2001)"
    publisher: State of New Jersey, via the Lake Hopatcong Commission
    url: https://lakehopatcongcommission.org/wp-content/uploads/2018/05/Lake-Hopatcong-Protection-Act.pdf
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20250317080128/https://lakehopatcongcommission.org/wp-content/uploads/2018/05/Lake-Hopatcong-Protection-Act.pdf
  - id: lhc-home
    title: Lake Hopatcong Commission (home page)
    publisher: Lake Hopatcong Commission
    url: https://lakehopatcongcommission.org/
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20260414155203/https://lakehopatcongcommission.org/
  - id: lhc-about
    title: About Us
    publisher: Lake Hopatcong Commission
    url: https://lakehopatcongcommission.org/index.php/about/
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20260103001051/https://lakehopatcongcommission.org/index.php/about/
  - id: lhc-level
    title: Water Level
    publisher: Lake Hopatcong Commission
    url: https://lakehopatcongcommission.org/index.php/water-level/
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20260103001042/https://lakehopatcongcommission.org/index.php/water-level/
  - id: dep-wlmp
    title: "Lake Hopatcong Water Level Management Plan 2024 (July 2024, released October 2025)"
    publisher: New Jersey Department of Environmental Protection, via the Lake Hopatcong Commission
    url: https://lakehopatcongcommission.org/wp-content/uploads/2026/06/lake_hopatcong_water_level_management_plan.pdf
    accessed: 2026-11-21
  - id: csnj-canal
    title: Morris Canal
    publisher: Canal Society of New Jersey
    url: https://canalsocietynj.org/morris-canal/
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20260929194615/https://canalsocietynj.org/morris-canal/
  - id: museum-about
    title: About
    publisher: Lake Hopatcong Historical Museum
    url: https://lakehopatconghistory.com/about/
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20261002180206/https://lakehopatconghistory.com/about/
  - id: hopatcong-history
    title: History
    publisher: Borough of Hopatcong
    url: https://www.hopatcong.org/about_us/history/index.php
    accessed: 2026-11-21
    archive_url: https://web.archive.org/web/20261002221833/https://hopatcong.org/about_us/history/index.php
  - id: tiger-morris
    title: "TIGER/Line Shapefiles 2025: Area Hydrography, Morris County, NJ (tl_2025_34027_areawater), polygon \"Lk Hopatcong\""
    publisher: U.S. Census Bureau (public domain)
    url: https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/tl_2025_34027_areawater.zip
    accessed: 2026-11-21
  - id: tiger-sussex
    title: "TIGER/Line Shapefiles 2025: Area Hydrography, Sussex County, NJ (tl_2025_34037_areawater), polygons \"Lk Hopatcong\" and \"Davis Cv\""
    publisher: U.S. Census Bureau (public domain)
    url: https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/tl_2025_34037_areawater.zip
    accessed: 2026-11-21
review:
  - stage: drafted
    date: 2026-11-21
    by: Claude (drafting session)
  - stage: source-checked
    date: 2026-11-21
    by: Claude (drafting session)
    note: "Every sentence re-checked against freshly fetched copies of the cited pages and PDFs . \"Largest freshwater lake\" is attributed to the 2001 law and the DEP plan, with the museum's \"largest lake\" as an independent source. The map shape was later widened (see second-pass) to include the Census \"Davis Cv\" polygon on the Sussex side. Cut the old extra sections, the other size figures (water quality report, park page), the name's origin, the Ogden Mine Railroad and resort details, the state park page (blocks automated reading) and the USGS gauge page (now returns 403)."
  - stage: second-pass
    date: 2026-11-22
    by: Claude (separate verifier session)
    note: "Round 1: \"largest freshwater lake\" is attributed to the 2001 law and the DEP plan, with the museum as an independent second source; the 11-foot and 12-foot figures are each attributed; the drawdown schedule matches the Commission's current page; the geometry reproduced byte-for-byte. Fixed: the shape left out the Census \"Davis Cv\" polygon, about a third of the lake's water along the Borough of Hopatcong; it now joins the main polygon, and the README command was updated and re-run; four close paraphrases. Round 2: a sentence saying the DEP treats Davis Cove as one of the lake's coves overstated an ice-monitoring list and was removed, and \"long been failing\" went back to the act's \"for some time\"."
---

Lake Hopatcong lies in both Morris and Sussex counties, and four municipalities share it: the boroughs of Hopatcong and Mount Arlington and the townships of Jefferson and Roxbury. A 2024 plan from the New Jersey Department of Environmental Protection (DEP) puts it at roughly nine miles long, with 38 miles of shoreline and 2,658 acres of water at its normal level. In the 2001 law that set up the Lake Hopatcong Commission, the Legislature found it to be "the largest freshwater lake in the State," and the DEP plan says the same; the Lake Hopatcong Historical Museum calls it "New Jersey's largest lake." The shape on this map joins the water that the Census Bureau's 2025 map files label "Lk Hopatcong," almost all of it in Morris County, with the adjoining Sussex County water that the Census labels "Davis Cv." [@dep-wlmp] [@lh-act] [@museum-about] [@tiger-morris] [@tiger-sussex]

According to the DEP plan, a retreating glacier more than 12,000 years ago left two separate bodies of water here. In the 1750s a dam about six feet high went up across the Musconetcong River, mainly to supply water to a forge, and the higher water joined the two ponds, along with the land around them, into a single lake. The plan says the dam was later raised to supply the Morris Canal, and the Canal Society of New Jersey describes the canal company's dam as creating "the primary water source that would fill both the east and west divisions" of the canal. Accounts differ on how much higher the water ended up: the Society says the dam raised the original Great Pond 11 feet in total, while the Borough of Hopatcong's history says the canal's combined lock and dam left the lake about 12 feet above its natural level. When the canal was dismantled in 1924, the Society says, the lake passed to the state along with the canal's other water resources. [@dep-wlmp] [@csnj-canal] [@hopatcong-history]

The borough's history ties the lake's tourist boom to the railroad. It says the Central Railroad of New Jersey connected its tracks to Nolan's Point on the lake in August 1882, the first passenger excursion train pulled in that September, and by 1900 more than 40 hotels and rooming houses were operating at the lake. It dates the lake's run as a major hotel resort from the 1880s through the Depression, and says that by the time Bertrand Island Amusement Park closed in 1983, the lake had in effect become a residential community. [@hopatcong-history]

## Why it matters

The 2001 law sets out why the state created the commission. The Legislature found that the area had turned from a seasonal community into a year-round one, that many of the area's septic systems had been failing for some time and were harming the lake's water quality, and that stormwater runoff and other pollution were feeding weed growth that the law calls "a hazard to recreational boaters" and that diminishes fishing and swimming. It also called the lake an emergency source of drinking water for the region. The commission it created describes itself today as an independent State agency overseen by an 11-member board, whose stated mission is protecting the lake's water quality and its "natural, scenic, historical and recreational resources." [@lh-act] [@lhc-home] [@lhc-about]

Both the weather and people control the lake's level, according to the Commission, which says Hopatcong State Park staff manage it under the DEP's 2024 plan: each year the lake is lowered 26 inches (22 inches under a 2016 DEP pilot program), starting on or after November 12, except every fifth year, when it comes down five feet instead. The plan says the deeper, five-foot lowering makes room for major lakeshore repairs and for inspecting and repairing the dam, and it schedules the next one for September 2028. [@lhc-level] [@dep-wlmp]

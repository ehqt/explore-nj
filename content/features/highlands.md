---
id: highlands
kind: feature
name: The New Jersey Highlands
summary: A region of ridges and valleys across northern New Jersey that a 2004 state law defines as 88 municipalities and protects largely for the drinking water it supplies.
pillar: geography
geometry: highlands.geojson
geometry_source: census-cousub
related: [morristown-nhp, red-mill-clinton, morris-canal]
sources:
  - id: nj-act-2004
    title: "P.L.2004, c.120: Highlands Water Protection and Planning Act (as enacted)"
    publisher: New Jersey Legislature
    url: https://pub.njleg.gov/bills/2004/PL04/120_.HTM
    accessed: 2026-10-09
  - id: hc-about
    title: About the NJ Highlands
    publisher: New Jersey Highlands Water Protection and Planning Council
    url: https://www.nj.gov/njhighlands/region/about
    accessed: 2026-11-22
  - id: hc-local
    title: Municipalities and Counties
    publisher: New Jersey Highlands Water Protection and Planning Council
    url: https://www.nj.gov/njhighlands/region/local
    accessed: 2026-10-09
  - id: hc-act
    title: The New Jersey Highlands Water Protection and Planning Act
    publisher: New Jersey Highlands Water Protection and Planning Council
    url: https://www.nj.gov/njhighlands/region/act
    accessed: 2026-10-09
  - id: hc-rmp-2008
    title: Highlands Regional Master Plan (2008)
    publisher: New Jersey Highlands Water Protection and Planning Council
    url: https://www.nj.gov/njhighlands/planning/rmp/highlands_rmp_web.pdf
    accessed: 2026-10-09
  - id: njgs-provinces
    title: "Physiographic Provinces of New Jersey (Information Circular, prepared 2003, reprinted 2006)"
    publisher: New Jersey Geological Survey
    url: https://www.nj.gov/dep/njgs/enviroed/infocirc/provinces.pdf
    accessed: 2026-10-09
    archive_url: https://web.archive.org/web/20231216204235/https://www.nj.gov/dep/njgs/enviroed/infocirc/provinces.pdf
  - id: usfs-2002
    title: "New York-New Jersey Highlands Regional Study: 2002 Update, Section 1: Introduction"
    publisher: USDA Forest Service, Northeastern Area State and Private Forestry
    url: http://www.na.fs.fed.us/highlands/maps_pubs/regional_study/section1.pdf
    accessed: 2026-10-09
    archive_url: https://web.archive.org/web/20051101124722/http://www.na.fs.fed.us/highlands/maps_pubs/regional_study/section1.pdf
  - id: census-cousub
    title: "TIGER/Line Shapefiles 2025: County Subdivisions, New Jersey (tl_2025_34_cousub), the 88 municipalities named in N.J.S.A. 13:20-7"
    publisher: U.S. Census Bureau (public domain)
    url: https://www2.census.gov/geo/tiger/TIGER2025/COUSUB/tl_2025_34_cousub.zip
    accessed: 2026-10-09
review:
  - stage: drafted
    date: 2026-10-09
    by: Claude (drafting session)
  - stage: source-checked
    date: 2026-10-09
    by: Claude (drafting session)
    note: Claims checked against the 2004 chapter law, the Highlands Council's pages and 2008 master plan, the NJ Geological Survey circular (its live URL timed out, so the December 2023 Wayback copy was read) and the 2002 Forest Service study (Wayback only). The map shape dissolves the project's Census-derived boundaries for all 88 towns in the statute's list; lakes over 2 square kilometers show as gaps. Left out the Act's "nearly 800,000 acres" because the statute gives the companion figure as "1,250 miles" with no "square", and kept the 2004 and current water figures separate because they differ.
  - stage: second-pass
    date: 2026-11-22
    by: Claude (separate verifier session)
    note: "Round 1: the 88 municipalities match N.J.S.A. 13:20-7a and the council's list; the shape rebuilds byte-for-byte from the README command and the text says it is the Act's town-based region, not a geologic line; geology, the 2004 findings and the 2008 plan's acreage are attributed and dated; the Act section is neutral. Fixed: the summary mixed the landform with the legal region; the council's current figures were undated; the Preservation Area boundary list read as complete; two close paraphrases. Round 2: \"softer\" and \"ice age\" changed the plan's own terms; now \"more easily eroded\" and \"most recent glaciation\"."
  - stage: approved
    date: 2026-11-22
    by: Eric
---

The New Jersey Highlands is a stretch of hills, ridges and valleys across the north of the state. As the Highlands Council describes it, the region reaches from the Delaware River in Warren and Hunterdon counties to the New York border along the northern edges of Sussex, Passaic and Bergen counties, and covers about 1,300 square miles. The council lists 88 municipalities in parts of seven counties: Bergen, Hunterdon, Morris, Passaic, Somerset, Sussex and Warren. [@hc-about] [@hc-local]

The region's legal outline comes from the Highlands Water Protection and Planning Act of 2004, which also created the Highlands Water Protection and Planning Council. Rather than drawing a line across the land, the Act defines the region as everything inside a county-by-county list of whole municipalities, starting with Mahwah and Oakland in Bergen County and ending with White in Warren County. The council says these boundaries "align closely" with the physiographic province that shares the Highlands name. The shape on this map joins the Census Bureau's 2025 boundaries for the 88 municipalities the Act names, so its edges are town lines; the larger lakes and reservoirs appear as gaps because this map's town boundaries leave them out. [@nj-act-2004] [@hc-about] [@census-cousub]

The council links the region's special protection to its water. When the Legislature passed the Act in 2004, its findings called the Highlands "an essential source of drinking water," supplying half of New Jersey's population, communities outside the Highlands among them, from only 13 percent of the state's land. The council's website, as read in November 2026, gives newer figures: 70 percent of the state's residents, it says, get some or all of their drinking water from the Highlands, an area under 15 percent of New Jersey's land, and that includes 8 of every 10 people living in a designated Overburdened Community. [@nj-act-2004] [@hc-about]

The Act splits the region in two. It traces the Preservation Area in the statute itself, with a boundary description that follows highways, local roads, rivers, brooks, town lines and, in places, park and property-lot boundaries; all the rest of the region is the Planning Area. Each municipality and county with land in the Preservation Area must submit revisions of its master plan and development regulations for that land, as needed, so that they conform with the council's regional master plan. For land in the Planning Area, conformance is voluntary: a town may petition the council by ordinance to take part. According to the council, protection in the region works through the regional master plan together with the Highlands Rules of the state Department of Environmental Protection. [@nj-act-2004] [@hc-act]

The council's 2008 Regional Master Plan counted nearly 415,000 acres in the Preservation Area, in 52 municipalities, and nearly 445,000 acres in the Planning Area, in 83. By the plan's tally, five municipalities lie wholly in the Preservation Area, 47 have land in both areas, and 36 have land only in the Planning Area. [@hc-rmp-2008]

Geologists count the Highlands as one of New Jersey's four physiographic provinces. A New Jersey Geological Survey circular, prepared in 2003 and reprinted in 2006, gives that natural province an area of roughly 980 square miles, about one-eighth of the state; that figure describes the landform, not the legal region. The circular describes rugged ground: "discontinuous rounded ridges" with deep, narrow valleys between them. Most of the bedrock is igneous and sedimentary rock of Middle Proterozoic age, 1.2 billion to about 900 million years old, that has been "highly metamorphosed." Many of the long valleys, which trend northeast, sit instead on sedimentary rocks like those of the Valley and Ridge Province. The circular gives the province's highest point as Wawayanda Mountain, at 1,496 feet. [@njgs-provinces]

The Highlands do not stop at the state line. The circular notes that New Jersey's Highlands are contiguous with the Reading Prong in Pennsylvania and the Hudson Highlands in New York. A 2002 U.S. Forest Service study of the New York–New Jersey Highlands, done in cooperation with Rutgers University, the U.S. Geological Survey and others, said most of its study area belongs to the Reading Prong, a geomorphic province reaching from northwestern Connecticut through the lower Hudson Valley and northern New Jersey into east-central Pennsylvania. [@njgs-provinces] [@usfs-2002]

According to the council's 2008 master plan, the ridges are mostly gneiss and other crystalline, metamorphic rock, while more easily eroded sandstone, dolomite and shale lie under the valleys. The most recent glaciation covered the northern half of the region, the plan says, and its terminal moraine crosses the Highlands from near Morristown, by way of Denville and roughly along Interstate 80, to Belvidere on the Delaware River. [@hc-rmp-2008]

## Why it matters

As of November 2026, the Highlands Council says 70 percent of New Jersey residents rely on the Highlands for at least some of their drinking water. In 2004 the Legislature declared the region's protection a matter of state-level importance that "cannot be left to the uncoordinated land use decisions of 88 municipalities, seven counties, and a myriad of private landowners," and found that 65,000 acres of the Highlands had been lost to development since 1984. The council's 2008 plan adds that water in the old crystalline rock of the uplands has little natural buffering, which it says makes that water "particularly vulnerable to acid rain and other forms of contamination." [@hc-about] [@nj-act-2004] [@hc-rmp-2008]

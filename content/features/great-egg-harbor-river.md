---
id: great-egg-harbor-river
kind: feature
name: Great Egg Harbor River
summary: A Pinelands river that starts near Berlin and runs 59 miles southeast to Great Egg Harbor; in 1992 Congress made 129 miles of it and its tributaries a National Wild and Scenic River.
pillar: geography
geometry: great-egg-harbor-river.geojson
geometry_source: usgs-nhd
municipalities: ["3400120290", "3400129280", "3400121870", "3400781740", "3400180330", "3400123940", "3401547250", "3400705440", "3400115160"]
related: [pinelands]
sources:
  - id: nps-learn
    title: Learn About the Park
    publisher: National Park Service, Great Egg Harbor River
    url: https://www.nps.gov/greg/learn/index.htm
    accessed: 2026-11-23
    archive_url: https://web.archive.org/web/20260517125408/https://www.nps.gov/greg/learn/index.htm
  - id: nps-faq
    title: Frequently Asked Questions
    publisher: National Park Service, Great Egg Harbor River
    url: https://www.nps.gov/greg/faqs.htm
    accessed: 2026-11-23
    archive_url: https://web.archive.org/web/20260813093630/https://www.nps.gov/greg/faqs.htm
  - id: nps-home
    title: Great Egg Harbor River (park home page)
    publisher: National Park Service
    url: https://www.nps.gov/greg/index.htm
    accessed: 2026-11-23
    archive_url: https://web.archive.org/web/20261107042001/https://www.nps.gov/greg/index.htm
  - id: rivers-greg
    title: Great Egg Harbor River
    publisher: National Wild and Scenic Rivers System (rivers.gov)
    url: https://www.rivers.gov/river/great-egg-harbor
    accessed: 2026-11-23
    archive_url: https://web.archive.org/web/20260519044323/https://rivers.gov/river/great-egg-harbor
  - id: pl-102-536
    title: "Public Law 102-536 (Oct. 27, 1992): to designate segments of the Great Egg Harbor River and its tributaries as components of the National Wild and Scenic Rivers System"
    publisher: U.S. Congress (copy hosted by the National Wild and Scenic Rivers System)
    url: https://www.fws.gov/rivers/sites/rivers/files/2022-10/Public%20Law%20102-536.pdf
    accessed: 2026-11-23
    archive_url: https://web.archive.org/web/20260719004650/https://www.fws.gov/rivers/sites/rivers/files/2022-10/Public%20Law%20102-536.pdf
  - id: pl-99-590
    title: "Public Law 99-590 (Oct. 30, 1986), Title III: Great Egg Harbor, New Jersey"
    publisher: U.S. Congress (copy hosted by the National Wild and Scenic Rivers System)
    url: https://www.fws.gov/rivers/sites/rivers/files/2022-10/Public%20Law%2099-590.pdf
    accessed: 2026-11-23
    archive_url: https://web.archive.org/web/20260719004654/https://www.fws.gov/rivers/sites/rivers/files/2022-10/Public%20Law%2099-590.pdf
  - id: pc-gehr-2005
    title: "The Great Egg Harbor River Watershed Management Area: A Report to the Pinelands Commission on the Status of Selected Aquatic and Wetland Resources (Zampella, Bunnell, Laidig and Procopio, 2005)"
    publisher: New Jersey Pinelands Commission
    url: https://www.nj.gov/pinelands/images/pdf%20files/GEHR%20WMA%20Final%20Report.pdf
    accessed: 2026-11-23
    archive_url: https://web.archive.org/web/20260929100022/https://www.nj.gov/pinelands/images/pdf%20files/GEHR%20WMA%20Final%20Report.pdf
  - id: usgs-folsom
    title: "Site information: USGS 01411000, Great Egg Harbor River at Folsom NJ"
    publisher: U.S. Geological Survey, National Water Information System
    url: https://waterservices.usgs.gov/nwis/site/?sites=01411000&siteOutput=expanded&format=rdb
    accessed: 2026-11-23
  - id: usgs-nhd
    title: "National Hydrography Dataset, Flowline - Large Scale: features with GNIS name \"Great Egg Harbor River\""
    publisher: U.S. Geological Survey (public domain)
    url: https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/6/query?where=gnis_name%3D%27Great+Egg+Harbor+River%27&outFields=*&outSR=4326&f=geojson
    accessed: 2026-11-23
  - id: tiger-areawater
    title: "TIGER/Line Shapefiles 2025: Area Hydrography, Atlantic County, NJ (tl_2025_34001_areawater), polygons \"Great Egg Harbor Riv\""
    publisher: U.S. Census Bureau (public domain)
    url: https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/tl_2025_34001_areawater.zip
    accessed: 2026-11-23
review:
  - stage: drafted
    date: 2026-11-23
    by: Claude (drafting session)
  - stage: source-checked
    date: 2026-11-23
    by: Claude (drafting session)
    note: Claims checked against the NPS park pages, the rivers.gov river page, both public laws, the Pinelands Commission's 2005 watershed report (dated in the text) and the USGS Folsom gauge record. The Census polygons named "Great Egg Harbor Riv" exist only in Atlantic County and in six disconnected pieces, so the map shape joins them to a 50-meter buffer of the USGS NHD flowline, and the text says so; municipalities are the eight towns that shape overlaps by more than 0.2 square kilometers in the Census 2025 town boundaries (Corbin City, Upper and Somers Point touch it only at slivers and are left out). Left out the history and wildlife lists on the river pages (not needed for a geography entry), the Pinelands report's watershed-management-area size (it includes other streams, so it is not the river's basin), and NJ DEP pages.
  - stage: second-pass
    date: 2026-11-23
    by: Claude (separate verifier session)
    note: "Round 1: the shape rebuilds byte-for-byte from the seven TIGER 2025 polygons plus the buffered USGS NHD line, and the text says where it is a 100-meter band; Wild and Scenic mileages and segments match the 1992 law and rivers.gov; superlatives attributed. Fixed: Corbin City was missing from municipalities (the shape reaches Rock Point); three close paraphrases of the NPS page. Round 2: pass."
---

In the National Park Service's words, the Great Egg Harbor River starts "as a trickle near Berlin." From there it takes a 59-mile course to the southeast, ending at Great Egg Harbor and the Atlantic Ocean, and the Park Service counts 17 designated tributaries feeding it along the way, so the river broadens as it goes. Lake Lenape, at Mays Landing, exists because a dam blocks the river there. Below the dam, the Park Service says, the river's "cedar waters" start to mix with salt water carried in by the tides. [@nps-learn]

The river is named for the bay at its mouth. The Park Service traces that name to Dutch explorers of the 1600s, who were struck by how many birds were breeding and laying eggs there; the river took the bay's name afterward. [@nps-faq] [@nps-learn]

The Wild and Scenic Rivers System's page for the river says it drains 304 square miles and passes through 12 New Jersey municipalities. The Park Service places nearly all of the river system inside the Pinelands National Reserve. A 2005 report to the Pinelands Commission noted that the river's headwaters begin outside the reserve, and it ranked the upper river's basin, which drains parts of Atlantic, Camden and Gloucester counties, among the most heavily altered of the six it studied, with developed land and upland farms covering more than a quarter of it. At its stream gauge on the river at Folsom, the U.S. Geological Survey lists a drainage area of 57.1 square miles. [@rivers-greg] [@nps-learn] [@pc-gehr-2005] [@usgs-folsom]

Along much of its length the river is the color of tea. Rivers.gov calls this "cedar water" and traces it to iron dissolved in the river along with tannin from cedar roots and fallen leaves; the same page counts cedar and hardwood swamps among the undisturbed forest the river holds. Farther downstream, the Park Service says, the tea color gets stronger. [@rivers-greg] [@nps-learn]

The shape on this map joins two public-domain sources. The Census Bureau's 2025 map files draw the river as an area only in Atlantic County, in six separate pieces, so this map adds a band about 100 meters wide along the U.S. Geological Survey's line for the river's main stem. Where the band stands alone, including the whole upper river, its width is a drawing choice, not the river's real width. The tributaries, the full outline of Lake Lenape and Great Egg Harbor Bay itself are not drawn. [@tiger-areawater] [@usgs-nhd]

## Why it matters

Congress ordered a study of "the entire river" for the Wild and Scenic Rivers System in 1986. Designation followed in a law dated October 27, 1992, which named 39.5 miles of the main stem and 89.5 miles of tributaries. On the main stem, the protected stretches run from the mouth of Patcong Creek up to the Mill Street Bridge, from Lake Lenape to the Atlantic City Expressway, and from Williamstown-New Freedom Road to the Pennsylvania Railroad right-of-way. The Park Service counts 17 designated tributaries; among those the law names are the Squankum Branch, the South River and the Tuckahoe River, along with Cedar Swamp Creek, which joins the Tuckahoe. Of the 129 miles in total, rivers.gov classes 98.4 as recreational and 30.6 as scenic; none is classed as wild. [@pl-99-590] [@pl-102-536] [@nps-learn] [@rivers-greg]

With no federal land ownership on the river, the Park Service says, it set up a partnership instead: the Great Egg Harbor Watershed Association and other local partners work together to protect the river, and local governments continue to administer the land. The 1992 law has the Secretary of the Interior manage the designated segments through cooperative agreements with the jurisdictions they pass through. Because much of the land beside the river is privately owned, the Park Service notes that access to the water is limited. [@nps-faq] [@nps-home] [@pl-102-536] [@nps-learn]

The rivers.gov page calls the Great Egg "the longest canoeable river in the New Jersey Pinelands." The same page describes the tidal river below Mays Landing, with its tributaries, as nursery and spawning habitat for anadromous fish, which come in from the sea to breed; striped bass and alewife herring make that trip every year to the gravel-bottomed tributaries. The Park Service's home page calls the river one of the nation's best birding spots. [@rivers-greg] [@nps-home]

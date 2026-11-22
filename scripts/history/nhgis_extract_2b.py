"""Second NHGIS extract for Then & Now Phase 2: mutually exclusive race-and-Hispanic-origin counts on
2010 block groups (1990-2020), and NJ census tract boundaries for 1970 and 1980 (for the older dots).
Usage: python nhgis_extract_2b.py OUT_DIR   (reads IPUMS_API_KEY)
"""

import json
import os
import sys
from pathlib import Path

from ipumspy import AggregateDataExtract, IpumsApiClient
from ipumspy.api.extract import TimeSeriesTable

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
client = IpumsApiClient(os.environ["IPUMS_API_KEY"])

shapes: list[dict] = []
for page in client.get_metadata_catalog("nhgis", metadata_type="shapefiles"):
    shapes.extend(page.get("data", []))
(OUT / "catalog_shapefiles.json").write_text(json.dumps(shapes, indent=1))


def text(s: dict) -> str:
    return json.dumps(s).lower()


chosen = []
for year in ("1970", "1980"):
    cands = [s for s in shapes if str(s.get("year")) == year and "tract" in str(s.get("geographicLevel", "")).lower()]
    nj = [s for s in cands if "new jersey" in text(s) or s.get("name", "").startswith("34_")]
    pick = (nj or [s for s in cands if "united states" in text(s) or s.get("name", "").startswith("us_")])[:1]
    if not pick:
        sys.exit(f"No {year} tract shapefile found; see {OUT}/catalog_shapefiles.json")
    chosen.append(pick[0]["name"])
print("Shapefiles:", ", ".join(chosen))

extract = AggregateDataExtract(
    collection="nhgis",
    description="Explore NJ Then & Now, phase 2b",
    # CW7: Persons by Hispanic or Latino Origin [2] by Race [6*], standardized to 2010 block groups.
    time_series_tables=[TimeSeriesTable("CW7", geog_levels=["blck_grp"])],
    shapefiles=chosen,
    geographic_extents=["340"],
    data_format="csv_header",
    tst_layout="time_by_column_layout",
)
client.submit_extract(extract)
print(f"Submitted NHGIS extract {extract.extract_id}; waiting for it to be built (usually a few minutes)...")
client.wait_for_extract(extract)
client.download_extract(extract, download_dir=OUT)
print(f"Downloaded to {OUT}/")
for f in sorted(OUT.iterdir()):
    print(f"  {f.name}  {f.stat().st_size:,} bytes")

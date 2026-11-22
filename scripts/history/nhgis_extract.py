"""Requests and downloads the NHGIS extract for Then & Now Phase 2.

Table codes are chosen from NHGIS's own metadata at run time (by table title, geographic level and
year coverage) rather than hard-coded, and the full catalogs are saved next to the download so every
choice can be checked. Usage: python nhgis_extract.py OUT_DIR   (reads IPUMS_API_KEY)
"""

import json
import os
import sys
from pathlib import Path

from ipumspy import AggregateDataExtract, IpumsApiClient
from ipumspy.api.extract import TimeSeriesTable

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
NJ = "340"  # NHGIS extent code: state FIPS 34 + "0"
client = IpumsApiClient(os.environ["IPUMS_API_KEY"])


def catalog(kind: str) -> list[dict]:
    items: list[dict] = []
    for page in client.get_metadata_catalog("nhgis", metadata_type=kind):
        items.extend(page.get("data", page if isinstance(page, list) else []))
    (OUT / f"catalog_{kind}.json").write_text(json.dumps(items, indent=1))
    return items


def names(items) -> list[str]:
    return [i["name"] if isinstance(i, dict) else str(i) for i in (items or [])]


def get(d: dict, *keys):
    for k in keys:
        if k in d:
            return d[k]
    return None


tsts = catalog("time_series_tables")
print(f"NHGIS time series tables: {len(tsts)}")


def pick(title: str, integration: str, level: str) -> list[dict]:
    """Tables matching a title at one integration and level. Titles in NHGIS often end with a count,
    as in "Persons by Sex [2]", so an exact match is tried first, then the shortest title that
    contains the words; ties go to the table covering the most years."""
    cands = []
    for t in tsts:
        integ = (get(t, "geographicIntegration", "geographic_integration") or "").lower()
        if integration in integ and level in names(get(t, "geogLevels", "geog_levels")):
            cands.append(t)
    desc = lambda t: (get(t, "description", "label") or "").strip()
    years = lambda t: len(names(get(t, "years")))
    base = lambda t: desc(t).split(" [")[0].lower()
    exact = [t for t in cands if base(t) == title.lower()]
    if exact:
        return sorted(exact, key=lambda t: -years(t))
    loose = [t for t in cands if title.lower() in desc(t).lower()]
    return sorted(loose, key=lambda t: (len(desc(t)), -years(t)))


wanted = []  # (purpose, table, level)
problems = []


def want(purpose: str, title: str, integration: str, level: str, all_matches: bool = False):
    found = pick(title, integration, level)
    if not found:
        problems.append(f"no {integration} table titled '{title}' at level {level}")
        return
    for t in found if all_matches else found[:1]:
        wanted.append((purpose, t, level))


# F1 town measures: county subdivisions (= NJ municipalities), census years from 1970 plus ACS 5-year.
for title in [
    "Median Age of Persons",
    "Total Households",
    "Persons by Nativity",
    "Total Housing Units",
    "Housing Units by Tenure",
]:
    want("F1", title, "nominal", "cty_sub")
# F2 birthplace: every place-of-birth table NHGIS offers for towns (they're small for NJ).
want("F2 birthplace", "Place of Birth", "nominal", "cty_sub", all_matches=True)
# F2 dots: race and Hispanic origin on 2010 block groups (1990-2020), and on tracts for 1970-1980.
want("F2 dots", "Persons by Race", "standardized", "blck_grp")
want("F2 dots", "Persons by Hispanic or Latino Origin", "standardized", "blck_grp")
want("F2 dots 1970-80", "Persons by Race", "nominal", "tract")
want("F2 dots 1970-80", "Persons by Hispanic or Latino Origin", "nominal", "tract")

print("\nChosen tables:")
for purpose, t, level in wanted:
    print(f"  {purpose:16} {t['name']:6} {level:9} {get(t, 'description', 'label')}  [{', '.join(names(get(t, 'years')))}]")
if problems:
    print("\nNot found (the saved catalog will show the right titles):\n  " + "\n  ".join(problems))
if not wanted:
    sys.exit("Nothing to request.")

# One extract, grouped by table so a table asked at two levels is requested once with both.
levels_by_table: dict[str, set[str]] = {}
for _, t, level in wanted:
    levels_by_table.setdefault(t["name"], set()).add(level)
extract = AggregateDataExtract(
    collection="nhgis",
    description="Explore NJ Then & Now, phase 2",
    time_series_tables=[TimeSeriesTable(name, geog_levels=sorted(levels)) for name, levels in levels_by_table.items()],
    geographic_extents=[NJ],
    data_format="csv_header",
    tst_layout="time_by_column_layout",
)
client.submit_extract(extract)
print(f"\nSubmitted extract {extract.extract_id}; waiting for NHGIS to build it (usually a few minutes)...")
client.wait_for_extract(extract)
client.download_extract(extract, download_dir=OUT)
(OUT / "chosen_tables.json").write_text(
    json.dumps([{"purpose": p, "table": t["name"], "title": get(t, "description", "label"), "level": l} for p, t, l in wanted], indent=1)
)
print(f"Downloaded to {OUT}/")
for f in sorted(OUT.iterdir()):
    print(f"  {f.name}  {f.stat().st_size:,} bytes")

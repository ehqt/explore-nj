#!/bin/sh
# Second Phase 2 download (race and ethnicity dots). Run from the repo root after fetch-phase2.sh:
#   sh scripts/history/fetch-phase2b.sh
set -e
[ -n "$IPUMS_API_KEY" ] || { echo "IPUMS_API_KEY isn't set; see README."; exit 1; }
[ -x .cache/venv/bin/python ] || { echo "Run sh scripts/history/fetch-phase2.sh first (it sets up Python)."; exit 1; }
.cache/venv/bin/python scripts/history/nhgis_extract_2b.py .cache/history/nhgis

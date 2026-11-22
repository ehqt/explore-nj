#!/bin/sh
# Phase 2 downloads for Then & Now: town measures 1970-today and who-lives-here maps.
# Run from the repo root:  sh scripts/history/fetch-phase2.sh
# Needs an IPUMS NHGIS API key in the environment (IPUMS_API_KEY); see README.
set -e
DIR=.cache/history
mkdir -p "$DIR/nhgis" "$DIR/tiger"
UA='ExploreNJ/1.0 (+https://github.com/ehqt/explore-nj)'

# 2010 Census block groups for NJ: the shapes the race and ethnicity dots are placed in.
BG=tl_2010_34_bg10.zip
if [ ! -s "$DIR/tiger/$BG" ]; then
  echo "get  $BG"
  curl -fsSL -A "$UA" -o "$DIR/tiger/$BG" "https://www2.census.gov/geo/tiger/TIGER2010/BG/2010/$BG" || { echo "FAILED: $BG"; rm -f "$DIR/tiger/$BG"; }
else
  echo "have $BG"
fi

if [ -z "$IPUMS_API_KEY" ]; then
  echo
  echo "IPUMS_API_KEY isn't set, so the NHGIS part was skipped."
  echo "Get a key at https://account.ipums.org/api_keys, then:"
  echo "  echo 'export IPUMS_API_KEY=\"your-key\"' >> ~/.zshrc && source ~/.zshrc"
  exit 1
fi

# A private Python environment for the IPUMS client, kept in .cache (git-ignored).
# The client needs Python 3.11 or newer; macOS ships 3.9, so use uv (which fetches its own Python)
# or a newer python3.x if one is installed.
VENV=.cache/venv
if [ -x "$VENV/bin/python" ] && ! "$VENV/bin/python" -c 'import sys; sys.exit(sys.version_info < (3, 11))'; then
  echo "Replacing the Python environment in $VENV (it's older than 3.11)"
  rm -rf "$VENV"
fi
if [ ! -x "$VENV/bin/python" ]; then
  echo "Setting up a Python environment in $VENV (one time)"
  if command -v uv >/dev/null 2>&1; then
    uv venv -q --python 3.12 "$VENV"
  else
    PY=""
    for p in python3.13 python3.12 python3.11; do
      if command -v "$p" >/dev/null 2>&1; then PY="$p"; break; fi
    done
    if [ -z "$PY" ]; then
      echo "Need Python 3.11 or newer. Easiest fix: brew install uv   (then run this script again)"
      exit 1
    fi
    "$PY" -m venv "$VENV"
  fi
  "$VENV/bin/python" -m ensurepip -q >/dev/null 2>&1 || true
fi
"$VENV/bin/python" -m pip install -q --upgrade pip 'ipumspy>=0.10'
"$VENV/bin/python" scripts/history/nhgis_extract.py "$DIR/nhgis"

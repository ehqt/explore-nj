#!/bin/sh
# Downloads the raw sources for the Then & Now population history into .cache/history/.
# Run from the repo root on a machine with internet access:  sh scripts/history/fetch.sh
set -e
DIR=.cache/history
mkdir -p "$DIR"
UA='ExploreNJ/1.0 (+https://github.com/ehqt/explore-nj)'
get() { # url file
  if [ -s "$DIR/$2" ]; then echo "have $2"; return; fi
  echo "get  $2"
  curl -fsSL -A "$UA" -o "$DIR/$2" "$1" || { echo "FAILED: $1"; rm -f "$DIR/$2"; }
}
# NJ Dept of Labor, "New Jersey Population Trends 1790 to 2000", Table 6: municipalities 1940-2000
get https://www.nj.gov/labor/labormarketinformation/assets/PDFs/census/2kpub/njsdcp3.pdf njsdcp3.pdf
# Census Bureau subcounty estimates, Vintage 2020: includes the 2010 Census count for every municipality
get https://www2.census.gov/programs-surveys/popest/datasets/2010-2020/cities/SUB-EST2020_34.csv sub-est2020_34.csv
# Census Bureau subcounty estimates, Vintage 2025: 2020 base and July 1 estimates 2020-2025
get https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_34.csv sub-est2025_34.csv
ls -l "$DIR"

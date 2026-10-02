// Settings that may change without touching the app's logic.

/**
 * Google Form for correction reports, with {subject} and {url} placeholders for
 * prefilled fields. Responses go to the form's linked spreadsheet, which Eric checks.
 * Set to '' to hide the "Report a correction" link.
 */
export const CORRECTIONS_FORM_URL: string =
  'https://docs.google.com/forms/d/e/1FAIpQLSdt3pAMj4LumX4NbUhubLYlXm7PYoON9q-GZB2Dl2Qet9xQmQ/viewform?usp=pp_url&entry.44199726={subject}&entry.488158316={url}';

export const SOURCES = {
  censusBoundaries: 'https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html',
  censusPopulation: 'https://www.census.gov/programs-surveys/decennial-census/about/rdo/summary-files.html',
};

/** The live site's address, used for canonical links and link previews. */
export const SITE_URL = 'https://ehqt.github.io/explore-nj/';

/**
 * Soft "North / Central / South Jersey" labels. There's no official line between
 * the regions, so the map draws no boundaries; the labels only appear once the
 * Jersey 101 topic explaining the split is approved.
 */
export const REGION_TOPIC_ID = 'north-central-south-jersey';
export const REGION_LABELS: { name: string; at: [number, number] }[] = [
  { name: 'North Jersey', at: [-74.45, 41.02] },
  { name: 'Central Jersey', at: [-74.4, 40.35] },
  { name: 'South Jersey', at: [-74.85, 39.55] },
];

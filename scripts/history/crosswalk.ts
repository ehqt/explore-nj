// Maps historical municipalities onto today's 564 (2020 Census GEOIDs, after the 2022 Pine Valley merger).
// Everything is mapped forward: a merged town's earlier figures are added to the town that absorbed it.
// Towns that split off from another after a given year have no figure for that year (shown as "no data"),
// because the older figure belongs to the parent and can't be divided.

/** Former municipalities and where they went: [former GEOID or code, today's GEOID, year merged, note]. */
export const MERGED: [string, string, number, string][] = [
  // Pine Valley borough merged into Pine Hill borough (Camden County) in 2022.
  ['3400758920', '3400758770', 2022, 'Pine Valley borough merged into Pine Hill in 2022.'],
];

/**
 * Names used in older sources that differ from today's Census name, keyed by county FIPS code.
 * Values are today's GEOID. Filled in from the rows the matcher can't place on its own.
 */
export const FORMER_NAMES: Record<string, Record<string, string>> = {
  // Essex: Table 6 prints Verona's name as "Verona Borough township".
  '013': { 'verona borough township': '3401375815' },
  // Mercer: Princeton borough and township consolidated into Princeton in 2013;
  // Washington township renamed itself Robbinsville in 2007.
  '021': { 'princeton borough': '3402160900', 'princeton township': '3402160900', 'washington township': '3402163850' },
  // Monmouth: South Belmar renamed itself Lake Como in 2005.
  '025': { 'south belmar borough': '3402537560' },
  // Ocean: Dover township renamed itself Toms River in 2006. Island Beach borough (1933-1965)
  // is now part of Berkeley township, per Table 6's own note.
  '029': { 'dover township': '3402973125', 'island beach borough': '3402905305' },
  // Passaic: West Paterson renamed itself Woodland Park in 2008.
  '031': { 'west paterson borough': '3403182423' },
  // Warren: Pahaquarry township was consolidated into Hardwick township on July 1, 1997.
  '041': { 'pahaquarry township': '3404129820' },
};

/**
 * 2010 Census counts the Vintage 2020 estimates file can't supply. It lists Princeton on its post-2013
 * borders but gives only the former borough's 2010 count, so the former township's count is added here.
 * Source: NJ Dept of Labor, Total Population 2000-2010, New Jersey Municipalities
 * (https://www.nj.gov/labor/labormarketinformation/assets/PDFs/census/2010/2010data/totPop.pdf).
 */
export const EXTRA_2010: [string, number, string][] = [['3402160900', 16_265, 'former Princeton township']];

/** Kept for documentation: towns whose early decades are NA in Table 6 because they didn't exist yet. */
export const NOT_SEPARATE: string[] = [];

/**
 * Typos in Table 6, replaced with the Census count: [GEOID, year, correct value, Table 6 value, source].
 * Table 6's county total carries the same typo, so the county check is adjusted by the same amount.
 */
export const CORRECTIONS: [string, number, number, number, string][] = [
  [
    '3403729850', 2000, 6_171, 3_171,
    'Hardyston township, 2000 Census SF1 profile (https://www.nj.gov/labor/labormarketinformation/assets/PDFs/census/2kcensus/sf1/sus/sf129850.pdf)',
  ],
];

/** One-line notes shown on a town's population chart when its history combines more than one former town. */
export const NOTES: Record<string, string> = {
  '3402160900': 'Before 2013, figures add together the former Princeton borough and Princeton township.',
  '3404129820': 'Includes the former Pahaquarry township, consolidated into Hardwick in 1997.',
  '3402905305': 'Includes the former Island Beach borough (1933–1965), now part of Berkeley.',
  '3400758770': 'Includes the former Pine Valley borough, which merged into Pine Hill in 2022.',
};

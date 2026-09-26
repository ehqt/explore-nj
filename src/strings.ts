// Every user-facing string lives here so the app can be translated later.
export const strings = {
  tagline: 'Get to know your new state',
  privacyNote:
    'No cookies or analytics. Map tiles load from OpenFreeMap, a third-party service.',
  noWebGL:
    "Your browser or device can't display the interactive map (WebGL is unavailable or turned off). Try a recent version of Chrome, Firefox, Safari or Edge.",
  basemapFailed:
    "The background map couldn't load, so only a plain map is shown. Try refreshing in a little while.",
} as const;

import { defineConfig } from 'vite';

// The site is served from https://ehqt.github.io/explore-nj/, so every asset
// URL needs this prefix. Load data through import.meta.env.BASE_URL, never "/".
export default defineConfig({
  base: '/explore-nj/',
  // MapLibre alone is ~1 MB minified (~280 KB gzipped); that's expected.
  build: { chunkSizeWarningLimit: 1200 },
  // MapLibre's worker is an ES module that imports shared code.
  worker: { format: 'es' },
});

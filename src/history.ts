// "Then & Now": how each town has changed since 1940. A map layer with a measure picker and a
// year slider, plus a section on each town card. Data: public/data/history/population.json
// (scripts/history/build-population.ts) and measures.json (scripts/history/build-measures.ts).

import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { strings } from './strings';

export interface PopulationHistory {
  years: number[];
  estimate_years: number[];
  state: number[];
  towns: Record<string, (number | null)[]>;
  area_sq_mi: Record<string, number>;
  notes: Record<string, string>;
  sources: { years: string; name: string; url: string }[];
}

export interface Measures {
  periods: { key: string; label: string; acs: boolean }[];
  metrics: Record<string, Record<string, { values: (number | null)[]; flagged: number[] }>>;
  birthplace: { periods: string[]; towns: Record<string, Record<string, [string, number][]>> };
  sources: { name: string; citation: string; url: string }[];
}

export interface DotsIndex {
  per_dot: number;
  bbox: [number, number, number, number];
  categories: string[];
  years: Record<string, { file: string; counts: Record<string, number>; people: Record<string, number>; no_data?: string }>;
  notes: Record<string, string>;
  source: string;
}

export interface HistoryData {
  population: PopulationHistory;
  measures?: Measures;
  dots?: DotsIndex;
}

export const HISTORY_LAYER = 'history-fill';
const DOTS_LAYER = 'history-dots';
const DOTS_NO_DATA_LAYER = 'history-dots-no-data';
const DOT_COLORS: Record<string, string> = {
  white: '#0072b2',
  black: '#009e73',
  hispanic: '#e69f00',
  asian: '#cc79a7',
  other: '#6f6f6f',
};
const NO_DATA = -1e9;
const FLAGGED = -2e9;
const NO_DATA_COLOR = '#e3e3e3';
const FLAGGED_COLOR = '#bdbdbd';
const SEQUENTIAL = ['#f1eef6', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#034e7b'];
const DIVERGING = ['#b35806', '#f1a340', '#f7f7f7', '#d8daeb', '#998ec3', '#6a51a3', '#3f007d'];

const fmt = (n: number, digits = 0) => n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** One measure the map can show: which periods it has, a value per town and period, and its color bins. */
interface Metric {
  id: string;
  label: string;
  legend: (periodLabel: string) => string;
  periods: { label: string; estimate: boolean }[];
  value: (town: string, i: number) => number | null;
  flagged: (town: string, i: number) => boolean;
  steps: number[];
  colors: string[];
  format: (v: number) => string;
  noData: string;
  /** For change measures, the first period has nothing to compare with. */
  firstUsable: number;
  /** "dots" measures draw the who-lives-here dot map instead of coloring towns. */
  kind?: 'dots';
}

function binLabel(m: Metric, i: number): string {
  const s = m.steps;
  if (i === 0) return `under ${m.format(s[0])}`;
  if (i === s.length) return `${m.format(s[i - 1])} or more`;
  return `${m.format(s[i - 1])} to ${m.format(s[i])}`;
}

function buildMetrics(h: HistoryData): Metric[] {
  const pop = h.population;
  const popPeriods = pop.years.map((y) => ({ label: pop.estimate_years.includes(y) ? strings.historyEstimateYear(y) : String(y), estimate: pop.estimate_years.includes(y) }));
  const pct = (v: number) => `${fmt(v)}%`;
  const list: Metric[] = [
    {
      id: 'density',
      label: strings.historyDensity,
      legend: () => strings.historyDensityUnit,
      periods: popPeriods,
      value: (t, i) => (pop.towns[t]?.[i] == null ? null : pop.towns[t][i]! / pop.area_sq_mi[t]),
      flagged: () => false,
      steps: [250, 1000, 2500, 5000, 10000, 20000],
      colors: SEQUENTIAL,
      format: (v) => fmt(v),
      noData: strings.historyNoData,
      firstUsable: 0,
    },
    {
      id: 'change',
      label: strings.historyChange,
      legend: (p) => strings.historyChangeUnit(p),
      periods: popPeriods,
      value: (t, i) => {
        const now = pop.towns[t]?.[i], before = pop.towns[t]?.[i - 1];
        return i === 0 || now == null || before == null || before === 0 ? null : ((now - before) / before) * 100;
      },
      flagged: () => false,
      steps: [-10, -2, 2, 10, 25, 50],
      colors: DIVERGING,
      format: (v) => `${v > 0 ? '+' : ''}${fmt(v)}%`,
      noData: strings.historyNoData,
      firstUsable: 1,
    },
  ];
  const m = h.measures;
  if (m) {
    const periods = m.periods.map((p) => ({ label: p.label, estimate: p.acs }));
    const add = (id: string, label: string, legend: string, steps: number[], format: (v: number) => string) => {
      const byTown = m.metrics[id];
      if (!byTown) return;
      list.push({
        id,
        label,
        legend: () => legend,
        periods,
        value: (t, i) => byTown[t]?.values[i] ?? null,
        flagged: (t, i) => byTown[t]?.flagged.includes(i) ?? false,
        steps,
        colors: SEQUENTIAL.slice(SEQUENTIAL.length - steps.length - 1),
        format,
        noData: strings.historyNotAvailable,
        firstUsable: 0,
      });
    };
    add('median_age', strings.metricMedianAge, strings.metricMedianAgeUnit, [30, 35, 40, 45, 50], (v) => fmt(v));
    add('per_household', strings.metricPerHousehold, strings.metricPerHouseholdUnit, [2.2, 2.5, 2.8, 3.1, 3.4], (v) => fmt(v, 1));
    add('pct_foreign_born', strings.metricForeignBorn, strings.metricForeignBornUnit, [5, 10, 20, 30, 40, 50], pct);
    add('pct_owner', strings.metricOwner, strings.metricOwnerUnit, [30, 45, 60, 75, 90], pct);
    add('homes_per_sq_mi', strings.metricHomes, strings.metricHomesUnit, [100, 400, 1000, 2000, 4000, 8000], (v) => fmt(v));
  }
  const d = h.dots;
  if (d) {
    const years = Object.keys(d.years).sort();
    list.push({
      id: 'dots',
      kind: 'dots',
      label: strings.dotsLabel,
      legend: () => strings.dotsUnit(d.per_dot),
      periods: years.map((y) => ({ label: y, estimate: false })),
      value: () => 1,
      flagged: () => false,
      steps: [],
      colors: [],
      format: (v) => fmt(v),
      noData: strings.dotsNoData,
      firstUsable: 0,
    });
  }
  return list;
}

function colorExpression(m: Metric): ExpressionSpecification {
  const v: ExpressionSpecification = ['coalesce', ['feature-state', 'v'], NO_DATA];
  const step = ['step', v, m.colors[0], ...m.steps.flatMap((s, i) => [s, m.colors[i + 1]])] as unknown as ExpressionSpecification;
  return ['case', ['==', v, FLAGGED], FLAGGED_COLOR, ['==', v, NO_DATA], NO_DATA_COLOR, step];
}

/** Adds the (hidden) history layers under the town and county lines. */
export function addHistoryLayer(map: MapLibreMap, beforeLayer: string): void {
  map.addLayer(
    { id: HISTORY_LAYER, type: 'fill', source: 'towns', layout: { visibility: 'none' }, paint: { 'fill-color': NO_DATA_COLOR, 'fill-opacity': 0.85 } },
    beforeLayer,
  );
  const empty = { type: 'FeatureCollection' as const, features: [] };
  map.addSource('history-dots', { type: 'geojson', data: empty });
  map.addSource('history-dots-no-data', { type: 'geojson', data: empty });
  map.addLayer(
    {
      id: DOTS_NO_DATA_LAYER,
      type: 'fill',
      source: 'history-dots-no-data',
      layout: { visibility: 'none' },
      paint: { 'fill-color': NO_DATA_COLOR, 'fill-opacity': 0.9 },
    },
    beforeLayer,
  );
  map.addLayer(
    {
      id: DOTS_LAYER,
      type: 'circle',
      source: 'history-dots',
      layout: { visibility: 'none' },
      paint: {
        'circle-color': ['match', ['get', 'c'], ...Object.entries(DOT_COLORS).flat(), '#999'] as unknown as ExpressionSpecification,
        'circle-radius': ['interpolate', ['exponential', 1.6], ['zoom'], 7, 0.9, 10, 1.5, 13, 3.2],
        'circle-opacity': 0.8,
      },
    },
    beforeLayer,
  );
}

/** Reads a year's packed dots: per category, pairs of 16-bit coordinates across the NJ box. */
async function loadDots(index: DotsIndex, year: string, url: (p: string) => string): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch(url(`history/dots/${index.years[year].file}`));
  if (!res.ok) throw new Error(`Couldn't load dots for ${year}`);
  const data = new Uint16Array(await res.arrayBuffer());
  const [x0, y0, x1, y1] = index.bbox;
  const features: GeoJSON.Feature[] = [];
  let at = 0;
  for (const c of index.categories) {
    const k = index.years[year].counts[c];
    for (let i = 0; i < k; i++, at += 2) {
      features.push({
        type: 'Feature',
        properties: { c },
        geometry: { type: 'Point', coordinates: [x0 + (data[at] / 65535) * (x1 - x0), y0 + (data[at + 1] / 65535) * (y1 - y0)] },
      });
    }
  }
  return { type: 'FeatureCollection', features };
}

/** Periods where at least one town has a value: the slider skips the rest. */
function usablePeriods(m: Metric, ids: string[]): number[] {
  return m.periods.map((_, i) => i).filter((i) => i >= m.firstUsable && ids.some((t) => m.value(t, i) !== null));
}

export function createHistoryControl(opts: {
  map: MapLibreMap;
  history: HistoryData;
  button: HTMLButtonElement;
  box: HTMLElement;
  otherLegend: HTMLElement | null;
  /** Layers to hide while the mode is on (place pins and feature outlines), so the colors read clearly. */
  hideLayers: string[];
  /** Turns a data path into a URL (the site lives under a base path). */
  dataUrl: (path: string) => string;
}): void {
  const { map, history, button, box, otherLegend, hideLayers, dataUrl } = opts;
  const dotCache = new Map<string, Promise<GeoJSON.FeatureCollection>>();
  const noDataCache = new Map<string, Promise<GeoJSON.FeatureCollection>>();
  const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
  let dotsRequest = 0;
  const pop = history.population;
  const ids = Object.keys(pop.towns);
  const metrics = buildMetrics(history);
  let metric = metrics[0];
  let periods = usablePeriods(metric, ids);
  let pos = 0;
  let on = false;

  box.innerHTML = `
    <div class="history-head">
      <p class="history-title">${strings.historyTitle}</p>
      <button type="button" class="history-close" aria-label="${strings.historyClose}">×</button>
    </div>
    <label class="history-metric">${strings.historyMetricLabel}
      <select>${metrics.map((m) => `<option value="${m.id}">${m.label}</option>`).join('')}</select>
    </label>
    <label class="history-year"><span class="history-year-value" aria-live="polite"></span>
      <input type="range" min="0" step="1" aria-label="${strings.historyYearLabel}">
    </label>
    <p class="history-state"></p>
    <div class="history-legend-wrap"></div>
    <p class="history-note"></p>`;
  const select = box.querySelector('select')!;
  const slider = box.querySelector<HTMLInputElement>('input[type=range]')!;
  const yearText = box.querySelector<HTMLElement>('.history-year-value')!;
  const stateText = box.querySelector<HTMLElement>('.history-state')!;
  const legend = box.querySelector<HTMLElement>('.history-legend-wrap')!;
  const note = box.querySelector<HTMLElement>('.history-note')!;

  const paintDots = (year: string) => {
    const d = history.dots!;
    const info = d.years[year];
    map.setLayoutProperty(HISTORY_LAYER, 'visibility', 'none');
    map.setLayoutProperty(DOTS_LAYER, 'visibility', 'visible');
    map.setLayoutProperty(DOTS_NO_DATA_LAYER, 'visibility', 'visible');
    const request = ++dotsRequest;
    if (!dotCache.has(year)) dotCache.set(year, loadDots(d, year, dataUrl));
    const noData = info.no_data
      ? (noDataCache.get(year) ?? noDataCache.set(year, fetch(dataUrl(`history/dots/${info.no_data}`)).then((r) => r.json())).get(year)!)
      : Promise.resolve(empty);
    note.textContent = strings.dotsLoading;
    Promise.all([dotCache.get(year)!, noData])
      .then(([dots, nd]) => {
        if (request !== dotsRequest) return; // the slider moved on
        (map.getSource('history-dots') as GeoJSONSource).setData(dots);
        (map.getSource('history-dots-no-data') as GeoJSONSource).setData(nd);
        const separatesHispanic = info.people.hispanic > 0;
        note.textContent = [d.notes[year], strings.dotsNote, separatesHispanic ? strings.dotsNonHispanic : ''].filter(Boolean).join(' ');
      })
      .catch((err) => {
        console.error(err);
        note.textContent = strings.dotsFailed;
      });
    const total = Object.values(info.people).reduce((a, b) => a + b, 0);
    const rows = d.categories
      .filter((c) => info.people[c] > 0)
      .map((c) => `<li><span class="swatch swatch--dot" style="background:${DOT_COLORS[c]}"></span>${strings.dotsCategory[c as keyof typeof strings.dotsCategory]} <span class="card-muted">${Math.round((100 * info.people[c]) / total)}%</span></li>`);
    if (info.no_data) rows.push(`<li><span class="swatch" style="background:${NO_DATA_COLOR}"></span>${strings.dotsNoData}</li>`);
    legend.innerHTML = `<p class="history-legend-title">${metric.legend('')}</p><ul class="history-legend">${rows.join('')}</ul>`;
  };

  const paint = () => {
    const i = periods[pos];
    const label = metric.periods[i].label;
    slider.max = String(periods.length - 1);
    slider.value = String(pos);
    yearText.textContent = label;
    const popIndex = pop.years.findIndex((y) => String(y) === label || strings.historyEstimateYear(y) === label);
    stateText.textContent = popIndex >= 0 ? strings.historyStateTotal(fmt(pop.state[popIndex])) : '';
    if (metric.kind === 'dots') return paintDots(label);
    map.setLayoutProperty(HISTORY_LAYER, 'visibility', 'visible');
    map.setLayoutProperty(DOTS_LAYER, 'visibility', 'none');
    map.setLayoutProperty(DOTS_NO_DATA_LAYER, 'visibility', 'none');
    for (const id of ids) {
      const v = metric.flagged(id, i) ? FLAGGED : metric.value(id, i) ?? NO_DATA;
      map.setFeatureState({ source: 'towns', id }, { v });
    }
    map.setPaintProperty(HISTORY_LAYER, 'fill-color', colorExpression(metric));
    const rows = metric.colors.map((c, b) => `<li><span class="swatch" style="background:${c}"></span>${binLabel(metric, b)}</li>`);
    rows.push(`<li><span class="swatch" style="background:${NO_DATA_COLOR}"></span>${metric.noData}</li>`);
    if (ids.some((t) => metric.flagged(t, i))) rows.push(`<li><span class="swatch" style="background:${FLAGGED_COLOR}"></span>${strings.historyFlagged}</li>`);
    legend.innerHTML = `<p class="history-legend-title">${metric.legend(metric.periods[Math.max(i - 1, 0)].label)}</p><ul class="history-legend">${rows.join('')}</ul>`;
    note.textContent = metric.periods[i].estimate
      ? metric.id === 'density' || metric.id === 'change'
        ? strings.historyNote
        : strings.historyAcsNote(label)
      : metric.id === 'density' || metric.id === 'homes_per_sq_mi'
        ? strings.historyNote
        : strings.historyCensusNote;
  };
  const setOn = (next: boolean) => {
    on = next;
    if (!on) for (const layer of [HISTORY_LAYER, DOTS_LAYER, DOTS_NO_DATA_LAYER]) map.setLayoutProperty(layer, 'visibility', 'none');
    box.hidden = !on;
    if (otherLegend) otherLegend.hidden = on;
    for (const layer of hideLayers) if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', on ? 'none' : 'visible');
    button.setAttribute('aria-pressed', String(on));
    if (on) paint();
  };

  slider.addEventListener('input', () => {
    pos = Number(slider.value);
    paint();
  });
  select.addEventListener('change', () => {
    // Keep the same year if the new measure has it; otherwise the closest earlier one.
    const label = metric.periods[periods[pos]].label;
    metric = metrics.find((m) => m.id === select.value)!;
    periods = usablePeriods(metric, ids);
    const same = periods.findIndex((i) => metric.periods[i].label === label);
    pos = same >= 0 ? same : Math.min(pos, periods.length - 1);
    paint();
  });
  box.querySelector('.history-close')!.addEventListener('click', () => setOn(false));
  button.hidden = false;
  button.addEventListener('click', () => setOn(!on));
}

/** The town card section: a population chart, a table of other measures, and countries of birth. */
export function townHistoryHtml(h: HistoryData, id: string): string {
  const p = h.population;
  const row = p.towns[id];
  if (!row) return '';
  const yearLabel = (i: number) => (p.estimate_years.includes(p.years[i]) ? strings.historyEstimateYear(p.years[i]) : String(p.years[i]));
  const max = Math.max(...row.map((v) => v ?? 0));
  const W = 300, H = 120, top = 14, bottom = 18;
  const bw = W / row.length;
  const bars = row
    .map((v, i) => {
      const x = i * bw + 3;
      const est = p.estimate_years.includes(p.years[i]);
      const label = `<text x="${x + (bw - 6) / 2}" y="${H - 4}" text-anchor="middle">${String(p.years[i]).slice(2)}${est ? '*' : ''}</text>`;
      if (v == null) return `${label}<text x="${x + (bw - 6) / 2}" y="${H - bottom - 4}" text-anchor="middle" class="na">–</text>`;
      const bh = max ? ((H - top - bottom) * v) / max : 0;
      return `<rect x="${x}" y="${H - bottom - bh}" width="${bw - 6}" height="${bh}" class="${est ? 'est' : ''}"><title>${yearLabel(i)}: ${fmt(v)}</title></rect>${label}`;
    })
    .join('');
  const first = row.findIndex((v) => v != null);
  const last = row.length - 1;
  const popRows = row.map((v, i) => `<tr><th scope="row">${yearLabel(i)}</th><td>${v == null ? strings.historyNoData : fmt(v)}</td></tr>`).join('');

  let html = `
    <h3>${strings.historyCardTitle}</h3>
    <p class="card-muted">${strings.historyCardSummary(yearLabel(first), fmt(row[first]!), yearLabel(last), fmt(row[last]!))}</p>
    <svg class="history-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${strings.historyCardTitle}">${bars}</svg>
    <details class="history-table"><summary>${strings.historyShowTable}</summary><table>${popRows}</table></details>
    <p class="card-muted">${p.notes[id] ? `${p.notes[id]} ` : ''}${strings.historyCardFootnote}</p>`;

  const m = h.measures;
  if (m) {
    const cols = m.periods.map((per, i) => ({ ...per, i }));
    const metricRows: [string, string, (v: number) => string][] = [
      ['median_age', strings.metricMedianAge, (v) => fmt(v, 1)],
      ['per_household', strings.metricPerHousehold, (v) => fmt(v, 2)],
      ['pct_foreign_born', strings.metricForeignBorn, (v) => `${fmt(v)}%`],
      ['pct_owner', strings.metricOwner, (v) => `${fmt(v)}%`],
    ];
    const head = cols.map((c) => `<th scope="col">${c.acs ? `${c.label}*` : c.label.slice(2) === '' ? c.label : `’${c.label.slice(2)}`}</th>`).join('');
    const body = metricRows
      .map(([key, label, f]) => {
        const s = m.metrics[key]?.[id];
        const cells = cols
          .map((c) => {
            const v = s?.values[c.i];
            if (v == null) return '<td class="card-muted">–</td>';
            return s!.flagged.includes(c.i) ? `<td class="flagged" title="${strings.historyFlagged}">${f(v)}†</td>` : `<td>${f(v)}</td>`;
          })
          .join('');
        return `<tr><th scope="row">${label}</th>${cells}</tr>`;
      })
      .join('');
    html += `
      <h3>${strings.measuresCardTitle}</h3>
      <div class="measures-scroll"><table class="measures-table"><thead><tr><td></td>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <p class="card-muted">${strings.measuresFootnote(cols.at(-1)!.label)}</p>`;

    const bp = m.birthplace.towns[id];
    if (bp) {
      const lists = m.birthplace.periods
        .map((period) => {
          const label = m.periods.find((x) => x.key === period)?.label ?? period;
          const items = bp[period] ?? [];
          const text = items.length ? items.map(([name, n]) => `${name} (${fmt(n)})`).join(', ') : strings.birthplaceTooFew;
          return `<li><strong>${label}:</strong> ${text}</li>`;
        })
        .join('');
      html += `<h3>${strings.birthplaceTitle}</h3><ul class="birthplace">${lists}</ul>`;
    }
  }
  return html;
}

export function historySources(h: HistoryData): string[] {
  const link = (url: string, text: string) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  return [
    ...h.population.sources.map((s) => `${link(s.url, s.name)} (${s.years})`),
    ...(h.measures?.sources ?? []).map((s) => `${link(s.url, s.name)}. ${s.citation}`),
  ];
}

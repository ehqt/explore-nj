// "Then & Now": town populations by decade, 1940 to today, shown as a map layer with a year slider,
// and as a small chart on each town card. Data: public/data/history/population.json
// (built by scripts/history/build-population.ts).

import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl';
import { dataUrl } from './data';
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

export type HistoryMetric = 'density' | 'change';

export const HISTORY_LAYER = 'history-fill';
const NO_DATA = -1e9;

/** Density bins (people per sq mi) and change bins (% since the previous decade), with their colors. */
const DENSITY_STEPS = [250, 1000, 2500, 5000, 10000, 20000];
const DENSITY_COLORS = ['#f1eef6', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#034e7b'];
const CHANGE_STEPS = [-10, -2, 2, 10, 25, 50];
const CHANGE_COLORS = ['#b35806', '#f1a340', '#f7f7f7', '#d8daeb', '#998ec3', '#6a51a3', '#3f007d'];
const NO_DATA_COLOR = '#d9d9d9';

export async function loadHistory(): Promise<PopulationHistory> {
  const res = await fetch(dataUrl('history/population.json'));
  if (!res.ok) throw new Error(`Couldn't load population history (HTTP ${res.status})`);
  return (await res.json()) as PopulationHistory;
}

function value(h: PopulationHistory, id: string, yearIndex: number, metric: HistoryMetric): number {
  const row = h.towns[id];
  const now = row?.[yearIndex];
  if (now == null) return NO_DATA;
  if (metric === 'density') return now / h.area_sq_mi[id];
  const before = row[yearIndex - 1];
  if (yearIndex === 0 || before == null || before === 0) return NO_DATA;
  return ((now - before) / before) * 100;
}

function colorExpression(metric: HistoryMetric): ExpressionSpecification {
  const steps = metric === 'density' ? DENSITY_STEPS : CHANGE_STEPS;
  const colors = metric === 'density' ? DENSITY_COLORS : CHANGE_COLORS;
  const v: ExpressionSpecification = ['coalesce', ['feature-state', 'v'], NO_DATA];
  const step = ['step', v, colors[0], ...steps.flatMap((s, i) => [s, colors[i + 1]])] as unknown as ExpressionSpecification;
  return ['case', ['<=', v, NO_DATA], NO_DATA_COLOR, step];
}

/** Adds the (hidden) history layer under the town and county lines. */
export function addHistoryLayer(map: MapLibreMap, beforeLayer: string): void {
  map.addLayer(
    {
      id: HISTORY_LAYER,
      type: 'fill',
      source: 'towns',
      layout: { visibility: 'none' },
      paint: { 'fill-color': colorExpression('density'), 'fill-opacity': 0.85 },
    },
    beforeLayer,
  );
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const yearLabel = (h: PopulationHistory, i: number) =>
  h.estimate_years.includes(h.years[i]) ? strings.historyEstimateYear(h.years[i]) : String(h.years[i]);

function legendHtml(metric: HistoryMetric): string {
  const steps = metric === 'density' ? DENSITY_STEPS : CHANGE_STEPS;
  const colors = metric === 'density' ? DENSITY_COLORS : CHANGE_COLORS;
  const label = (i: number) => {
    if (metric === 'density') {
      if (i === 0) return `< ${fmt(steps[0])}`;
      if (i === steps.length) return `${fmt(steps[i - 1])}+`;
      return `${fmt(steps[i - 1])}–${fmt(steps[i])}`;
    }
    const pct = (n: number) => `${n > 0 ? '+' : ''}${n}%`;
    if (i === 0) return `${pct(steps[0])} or less`;
    if (i === steps.length) return `${pct(steps[i - 1])} or more`;
    return `${pct(steps[i - 1])} to ${pct(steps[i])}`;
  };
  const rows = colors.map((c, i) => `<li><span class="swatch" style="background:${c}"></span>${label(i)}</li>`);
  rows.push(`<li><span class="swatch" style="background:${NO_DATA_COLOR}"></span>${strings.historyNoData}</li>`);
  return `<ul class="history-legend">${rows.join('')}</ul>`;
}

/** The control: a button in the header turns the mode on; a box on the map holds the slider and legend. */
export function createHistoryControl(opts: {
  map: MapLibreMap;
  history: PopulationHistory;
  button: HTMLButtonElement;
  box: HTMLElement;
  otherLegend: HTMLElement | null;
  /** Layers to hide while the mode is on (place pins and feature outlines), so the colors read clearly. */
  hideLayers: string[];
}): void {
  const { map, history: h, button, box, otherLegend, hideLayers } = opts;
  const ids = Object.keys(h.towns);
  let metric: HistoryMetric = 'density';
  let index = h.years.indexOf(1940);
  let on = false;

  box.innerHTML = `
    <div class="history-head">
      <p class="history-title">${strings.historyTitle}</p>
      <button type="button" class="history-close" aria-label="${strings.historyClose}">×</button>
    </div>
    <div class="history-metric" role="radiogroup" aria-label="${strings.historyMetricLabel}">
      <label><input type="radio" name="history-metric" value="density" checked> ${strings.historyDensity}</label>
      <label><input type="radio" name="history-metric" value="change"> ${strings.historyChange}</label>
    </div>
    <label class="history-year"><span class="history-year-value" aria-live="polite"></span>
      <input type="range" min="0" max="${h.years.length - 1}" step="1" value="${index}" aria-label="${strings.historyYearLabel}">
    </label>
    <p class="history-state"></p>
    <div class="history-legend-wrap"></div>
    <p class="history-note">${strings.historyNote}</p>`;
  const slider = box.querySelector<HTMLInputElement>('input[type=range]')!;
  const yearText = box.querySelector<HTMLElement>('.history-year-value')!;
  const stateText = box.querySelector<HTMLElement>('.history-state')!;
  const legend = box.querySelector<HTMLElement>('.history-legend-wrap')!;

  const paint = () => {
    // Change needs a previous decade, so the first year falls back to the second.
    if (metric === 'change' && index === 0) index = 1;
    slider.value = String(index);
    yearText.textContent = yearLabel(h, index);
    stateText.textContent = strings.historyStateTotal(fmt(h.state[index]));
    for (const id of ids) map.setFeatureState({ source: 'towns', id }, { v: value(h, id, index, metric) });
    map.setPaintProperty(HISTORY_LAYER, 'fill-color', colorExpression(metric));
    legend.innerHTML = `<p class="history-legend-title">${metric === 'density' ? strings.historyDensityUnit : strings.historyChangeUnit(yearLabel(h, Math.max(index - 1, 0)))}</p>${legendHtml(metric)}`;
  };
  const setOn = (next: boolean) => {
    on = next;
    map.setLayoutProperty(HISTORY_LAYER, 'visibility', on ? 'visible' : 'none');
    box.hidden = !on;
    if (otherLegend) otherLegend.hidden = on;
    for (const layer of hideLayers) if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', on ? 'none' : 'visible');
    button.setAttribute('aria-pressed', String(on));
    if (on) paint();
  };

  slider.addEventListener('input', () => {
    index = Number(slider.value);
    paint();
  });
  box.querySelectorAll<HTMLInputElement>('input[name=history-metric]').forEach((r) =>
    r.addEventListener('change', () => {
      metric = r.value as HistoryMetric;
      paint();
    }),
  );
  box.querySelector('.history-close')!.addEventListener('click', () => setOn(false));
  button.hidden = false;
  button.addEventListener('click', () => setOn(!on));
}

/** A small bar chart of a town's population by decade, for its card. */
export function townHistoryHtml(h: PopulationHistory, id: string): string {
  const row = h.towns[id];
  if (!row) return '';
  const max = Math.max(...row.map((v) => v ?? 0));
  const W = 300, H = 120, top = 14, bottom = 18;
  const bw = W / row.length;
  const bars = row
    .map((v, i) => {
      const x = i * bw + 3;
      const est = h.estimate_years.includes(h.years[i]);
      const label = `<text x="${x + (bw - 6) / 2}" y="${H - 4}" text-anchor="middle">${String(h.years[i]).slice(2)}${est ? '*' : ''}</text>`;
      if (v == null) return `${label}<text x="${x + (bw - 6) / 2}" y="${H - bottom - 4}" text-anchor="middle" class="na">–</text>`;
      const bh = max ? ((H - top - bottom) * v) / max : 0;
      return `<rect x="${x}" y="${H - bottom - bh}" width="${bw - 6}" height="${bh}" class="${est ? 'est' : ''}"><title>${yearLabel(h, i)}: ${fmt(v)}</title></rect>${label}`;
    })
    .join('');
  const first = row.findIndex((v) => v != null);
  const last = row.length - 1;
  const rows = row
    .map((v, i) => `<tr><th scope="row">${yearLabel(h, i)}</th><td>${v == null ? strings.historyNoData : fmt(v)}</td></tr>`)
    .join('');
  return `
    <h3>${strings.historyCardTitle}</h3>
    <p class="card-muted">${strings.historyCardSummary(yearLabel(h, first), fmt(row[first]!), yearLabel(h, last), fmt(row[last]!))}</p>
    <svg class="history-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${strings.historyCardTitle}">${bars}</svg>
    <details class="history-table"><summary>${strings.historyShowTable}</summary><table>${rows}</table></details>
    <p class="card-muted">${h.notes[id] ? `${h.notes[id]} ` : ''}${strings.historyCardFootnote}</p>`;
}

export function historySources(h: PopulationHistory): string[] {
  return h.sources.map(
    (s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a> (${s.years})`,
  );
}

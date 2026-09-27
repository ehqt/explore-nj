// Search across featured entries, counties, towns and community names.
// Built on the ARIA combobox pattern so it works from the keyboard and with screen
// readers. An empty search lists everything, which keeps every place reachable
// without the map (pins on a canvas can't be tabbed to).

import { escapeHtml } from './cards';
import type { AppData } from './data';
import { pillarSvg } from './pillars';
import type { Selection } from './router';
import { strings } from './strings';

interface Item {
  label: string;
  detail: string;
  group: 0 | 1 | 2 | 3; // featured, counties, towns, communities
  icon: string;
  target: Selection;
  key: string;
}

/** Lowercase, drop accents and punctuation, and expand common abbreviations. */
export function normalize(text: string): string {
  return ` ${text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')} `
    .replace(/ mt /g, ' mount ')
    .replace(/ twp /g, ' township ')
    .replace(/ boro /g, ' borough ')
    .replace(/\s+/g, ' ');
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function buildIndex(data: AppData): Item[] {
  const items: Item[] = [];
  const countyName = (id: string) => data.counties[id]?.name ?? '';
  const kindLabel = { place: strings.kindPlace, feature: strings.kindFeature, topic: strings.kindTopic };

  for (const e of data.entries) {
    if (e.kind === 'county') continue; // county write-ups are reached through their county
    const where = e.municipalities[0] ? ` · ${data.towns[e.municipalities[0]].name}` : '';
    items.push({ label: e.name, detail: `${kindLabel[e.kind]}${where}`, group: 0, icon: pillarSvg(e.pillar), target: { kind: 'entry', id: e.id }, key: normalize(e.name) });
  }
  for (const [id, c] of Object.entries(data.counties)) {
    items.push({ label: c.name, detail: strings.county, group: 1, icon: '', target: { kind: 'county', id }, key: normalize(c.name) });
  }
  for (const [id, t] of Object.entries(data.towns)) {
    items.push({ label: t.name, detail: `${capitalize(t.type)} · ${countyName(t.county)}`, group: 2, icon: '', target: { kind: 'town', id }, key: normalize(`${t.name} ${t.type}`) });
  }
  for (const a of data.aliases) {
    for (const id of a.towns) {
      const t = data.towns[id];
      items.push({
        label: a.name,
        detail: strings.communityIn(`${t.name} ${t.type}`, countyName(t.county)),
        group: 3,
        icon: '',
        target: { kind: 'town', id },
        key: normalize(a.name),
      });
    }
  }
  return items;
}

function rank(item: Item, query: string): number | null {
  // query is normalized with a leading and trailing space.
  const q = query.trim();
  const key = item.key.trim();
  if (key === q) return 0;
  if (key.startsWith(q)) return 1;
  if (item.key.includes(` ${q}`)) return 2;
  if (key.includes(q)) return 3;
  return null;
}

export function search(items: Item[], raw: string, limit = 12): Item[] {
  const query = normalize(raw);
  // Community names duplicate their towns, so the full list leaves them out.
  if (!query.trim()) return items.filter((i) => i.group !== 3).sort((a, b) => a.group - b.group || a.label.localeCompare(b.label));
  return items
    .map((item) => ({ item, score: rank(item, query) }))
    .filter((r): r is { item: Item; score: number } => r.score !== null)
    .sort((a, b) => a.score - b.score || a.item.group - b.item.group || a.item.label.localeCompare(b.item.label))
    .slice(0, limit)
    .map((r) => r.item);
}

export function createSearch(host: HTMLElement, data: AppData, onSelect: (target: Selection) => void): void {
  const items = buildIndex(data);
  host.innerHTML = `
    <label class="visually-hidden" for="search-input">${strings.searchLabel}</label>
    <input id="search-input" class="search-input" type="search" autocomplete="off" spellcheck="false"
      placeholder="${strings.searchPlaceholder}" role="combobox" aria-expanded="false"
      aria-controls="search-results" aria-autocomplete="list">
    <ul id="search-results" class="search-results" role="listbox" aria-label="${strings.searchResults}" hidden></ul>
    <p class="visually-hidden" aria-live="polite" id="search-status"></p>`;
  const input = host.querySelector<HTMLInputElement>('input')!;
  const list = host.querySelector<HTMLUListElement>('ul')!;
  const status = host.querySelector<HTMLParagraphElement>('#search-status')!;
  let results: Item[] = [];
  let active = -1;

  const setActive = (i: number) => {
    active = i;
    list.querySelectorAll('[role=option]').forEach((el, n) => el.setAttribute('aria-selected', String(n === i)));
    const el = list.querySelector<HTMLElement>(`#search-option-${i}`);
    input.setAttribute('aria-activedescendant', el ? el.id : '');
    el?.scrollIntoView({ block: 'nearest' });
  };

  const render = () => {
    results = search(items, input.value);
    list.innerHTML = results.length
      ? results
          .map(
            (r, i) =>
              `<li id="search-option-${i}" role="option" aria-selected="false" data-index="${i}">${r.icon}<span class="search-label">${escapeHtml(r.label)}</span><span class="search-detail">${escapeHtml(r.detail)}</span></li>`,
          )
          .join('')
      : `<li class="search-empty">${escapeHtml(strings.noResults(input.value))}</li>`;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    status.textContent = strings.resultCount(results.length);
    setActive(-1);
  };

  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-activedescendant', '');
  };

  const choose = (i: number) => {
    const r = results[i];
    if (!r) return;
    input.value = '';
    close();
    input.blur();
    onSelect(r.target);
  };

  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (list.hidden) render();
      setActive(Math.min(active + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(active - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(active >= 0 ? active : 0);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      if (!list.hidden) close();
      else input.blur();
    }
  });
  // Pointer selection; mousedown fires before the input loses focus.
  list.addEventListener('mousedown', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('[data-index]');
    if (li) {
      e.preventDefault();
      choose(Number(li.dataset.index));
    }
  });
  input.addEventListener('blur', () => setTimeout(close, 100));
}

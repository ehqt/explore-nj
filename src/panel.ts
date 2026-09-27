// The details panel: a side panel on wide screens, a bottom sheet on phones.

import { strings } from './strings';

export interface Panel {
  open(html: string, title: string): void;
  close(): void;
  isOpen(): boolean;
  /** The open card's title. */
  title(): string;
  /** Space the panel covers, so the map can keep targets visible beside it. */
  mapPadding(): { top: number; right: number; bottom: number; left: number };
  onClose(callback: () => void): void;
  onClick(callback: (target: HTMLElement) => void): void;
}

const PHONE = window.matchMedia('(max-width: 640px)');

export function createPanel(host: HTMLElement): Panel {
  const el = document.createElement('aside');
  el.className = 'panel';
  el.hidden = true;
  el.setAttribute('aria-label', strings.panelLabel);
  el.innerHTML = `
    <button type="button" class="panel-close" aria-label="${strings.closePanel}">×</button>
    <div class="panel-body"></div>`;
  host.append(el);

  const body = el.querySelector<HTMLDivElement>('.panel-body')!;
  const closeButton = el.querySelector<HTMLButtonElement>('.panel-close')!;
  const closeCallbacks: (() => void)[] = [];
  const clickCallbacks: ((target: HTMLElement) => void)[] = [];
  let returnFocus: HTMLElement | null = null;

  const panel: Panel = {
    open(html, title) {
      if (el.hidden) returnFocus = document.activeElement as HTMLElement | null;
      body.innerHTML = html;
      body.scrollTop = 0;
      el.setAttribute('aria-label', title);
      el.hidden = false;
      body.querySelector<HTMLElement>('.card-title')?.focus({ preventScroll: true });
    },
    close() {
      if (el.hidden) return;
      el.hidden = true;
      body.innerHTML = '';
      returnFocus?.focus?.();
      for (const cb of closeCallbacks) cb();
    },
    isOpen: () => !el.hidden,
    title: () => el.getAttribute('aria-label') ?? '',
    mapPadding() {
      const base = { top: 40, right: 40, bottom: 40, left: 40 };
      if (el.hidden) return base;
      const rect = el.getBoundingClientRect();
      return PHONE.matches ? { ...base, bottom: rect.height + 20 } : { ...base, right: rect.width + 40 };
    },
    onClose: (cb) => closeCallbacks.push(cb),
    onClick: (cb) => clickCallbacks.push(cb),
  };

  closeButton.addEventListener('click', () => panel.close());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.isOpen()) panel.close();
  });
  body.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-entry],[data-county],[data-zoom-county]');
    if (target) for (const cb of clickCallbacks) cb(target);
  });
  return panel;
}

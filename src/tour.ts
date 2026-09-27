// The "Start here" tour: a fixed sequence of places and features. Each stop opens
// the entry's normal card; a bar at the top of the panel shows progress with Back,
// Next and Exit. Opening anything else pauses the tour (with a Resume option), and
// Esc or Exit ends it. It never starts on its own: a first-visit hint offers it.

import type { AppData } from './data';
import type { Panel } from './panel';
import type { Selection } from './router';
import { strings } from './strings';

type State = 'off' | 'active' | 'paused';

const HINT_KEY = 'explore-nj:tour-hint-dismissed';

function storage(action: 'get' | 'set'): boolean {
  // Browser storage can be missing or blocked (private windows); the hint then
  // simply shows again next time.
  try {
    if (action === 'set') localStorage.setItem(HINT_KEY, '1');
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}

export interface TourDeps {
  data: AppData;
  stops: string[];
  panel: Panel;
  /** Opens a card. The tour calls this; it also hears about every card opened. */
  show: (sel: Selection) => void;
  onShow: (listener: (sel: Selection | null) => void) => void;
}

export function createTour({ data, stops, panel, show, onShow }: TourDeps): void {
  const button = document.getElementById('tour-button') as HTMLButtonElement | null;
  const hint = document.getElementById('tour-hint');
  const chip = document.getElementById('tour-chip');
  const names = stops.map((id) => data.entries.find((e) => e.id === id)?.name ?? id);
  if (stops.length < 2 || !button || !hint || !chip) return;

  let state: State = 'off';
  let index = 0;
  let navigating = false;

  const bar = document.createElement('div');
  bar.className = 'tour-bar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', strings.tourLabel);

  const render = () => {
    if (state === 'off') {
      panel.setBanner(null);
      chip.hidden = true;
      return;
    }
    const last = index === stops.length - 1;
    bar.innerHTML =
      state === 'active'
        ? `<p class="tour-status" aria-live="polite">${strings.tourStop(index + 1, stops.length)} · <strong></strong></p>
           <div class="tour-actions">
             <button type="button" class="button" data-tour="back" ${index === 0 ? 'disabled' : ''}>${strings.tourBack}</button>
             <button type="button" class="button button-primary" data-tour="next">${last ? strings.tourFinish : strings.tourNext}</button>
             <button type="button" class="button" data-tour="exit">${strings.tourExit}</button>
           </div>`
        : `<p class="tour-status" aria-live="polite">${strings.tourPaused}</p>
           <div class="tour-actions">
             <button type="button" class="button button-primary" data-tour="resume">${strings.tourResume}</button>
             <button type="button" class="button" data-tour="exit">${strings.tourExit}</button>
           </div>`;
    const strong = bar.querySelector('strong');
    if (strong) strong.textContent = names[index];
    panel.setBanner(bar);
    // With the panel closed, a small chip keeps the way back into the tour.
    chip.innerHTML = `<span>${strings.tourPaused}</span>
      <button type="button" class="button button-primary" data-tour="resume">${strings.tourResume}</button>
      <button type="button" class="button" data-tour="exit">${strings.tourExit}</button>`;
    chip.hidden = !(state === 'paused' && !panel.isOpen());
  };

  const go = () => {
    state = 'active';
    navigating = true;
    show({ kind: 'entry', id: stops[index] });
    navigating = false;
    render();
  };
  const start = () => {
    dismissHint(true);
    index = 0;
    go();
  };
  const end = () => {
    state = 'off';
    render();
  };

  const act = (action: string | undefined) => {
    if (action === 'next') {
      if (index === stops.length - 1) end();
      else {
        index++;
        go();
      }
    } else if (action === 'back' && index > 0) {
      index--;
      go();
    } else if (action === 'resume') go();
    else if (action === 'exit') end();
  };

  bar.addEventListener('click', (e) => act((e.target as HTMLElement).closest<HTMLElement>('[data-tour]')?.dataset.tour));
  chip.addEventListener('click', (e) => act((e.target as HTMLElement).closest<HTMLElement>('[data-tour]')?.dataset.tour));
  button.addEventListener('click', start);
  button.hidden = false;

  // Anything the tour didn't open itself pauses it; closing the panel does too.
  onShow((sel) => {
    if (state !== 'active' || navigating) return;
    const onStop = sel?.kind === 'entry' && sel.id === stops[index];
    if (!onStop) {
      state = 'paused';
      render();
    }
  });
  panel.onClose(() => {
    if (state === 'active') state = 'paused';
    render();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state !== 'off') end();
  });

  // First-visit hint, only on the home page and only until dismissed or used.
  function dismissHint(remember: boolean) {
    hint!.hidden = true;
    if (remember) storage('set');
  }
  const atHome = location.pathname === import.meta.env.BASE_URL;
  if (atHome && !storage('get')) {
    hint.innerHTML = `<p>${strings.tourHint(stops.length)}</p>
      <div class="tour-actions">
        <button type="button" class="button button-primary" data-hint="start">${strings.tourStart}</button>
        <button type="button" class="button" data-hint="dismiss">${strings.tourNoThanks}</button>
      </div>`;
    hint.hidden = false;
    hint.addEventListener('click', (e) => {
      const action = (e.target as HTMLElement).closest<HTMLElement>('[data-hint]')?.dataset.hint;
      if (action === 'start') start();
      else if (action === 'dismiss') dismissHint(true);
    });
    // Opening any card hides the hint for now (it returns next visit).
    onShow((sel) => {
      if (sel) dismissHint(false);
    });
  }
}

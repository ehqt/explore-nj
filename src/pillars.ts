// How each pillar looks on the map and in cards. Colors are from the Okabe–Ito
// palette, which stays distinguishable with common color-vision deficiencies, and
// each pillar also has its own shape so color is never the only cue.

export type Pillar = 'geography' | 'history' | 'culture';
export type Shape = 'circle' | 'square' | 'diamond';

export const PILLARS: Record<Pillar, { label: string; color: string; shape: Shape }> = {
  geography: { label: 'Geography', color: '#0072B2', shape: 'circle' },
  history: { label: 'History', color: '#D55E00', shape: 'square' },
  culture: { label: 'Culture', color: '#CC79A7', shape: 'diamond' },
};

/** SVG markup for a pillar's symbol, used in the legend, search results and cards. */
export function pillarSvg(pillar: Pillar, size = 14): string {
  const { color, shape } = PILLARS[pillar];
  const s = size;
  const body =
    shape === 'circle'
      ? `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 1.5}"/>`
      : shape === 'square'
        ? `<rect x="1.5" y="1.5" width="${s - 3}" height="${s - 3}" rx="1.5"/>`
        : `<path d="M${s / 2} 1 L${s - 1} ${s / 2} L${s / 2} ${s - 1} L1 ${s / 2} Z"/>`;
  return `<svg class="pillar-icon" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true"><g fill="${color}" stroke="#fff" stroke-width="1.5">${body}</g></svg>`;
}

/** Draws a pillar's map pin onto a canvas for MapLibre's addImage. */
export function pillarImage(pillar: Pillar, pixelRatio: number): ImageData {
  const size = 18;
  const px = Math.round(size * pixelRatio);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(pixelRatio, pixelRatio);
  const { color, shape } = PILLARS[pillar];
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (shape === 'circle') ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  else if (shape === 'square') ctx.rect(2.5, 2.5, size - 5, size - 5);
  else {
    ctx.moveTo(size / 2, 1.5);
    ctx.lineTo(size - 1.5, size / 2);
    ctx.lineTo(size / 2, size - 1.5);
    ctx.lineTo(1.5, size / 2);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  return ctx.getImageData(0, 0, px, px);
}

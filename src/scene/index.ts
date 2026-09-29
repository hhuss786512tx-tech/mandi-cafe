import { params, reducedMotion, saveData } from '../lib/prefs';

function webglOk(): boolean {
  if (params.has('nowebgl')) return false;
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

/**
 * Lazily boots the Three.js hero after first paint. The poster <picture> is the
 * LCP element; the canvas fades in over it once the first frame is ready.
 * Falls back to the poster on reduced motion, Save-Data, or no WebGL.
 * `?scene=1` boots immediately and renders one still frame (headless captures);
 * `?poster=1` additionally fills the viewport with the scene.
 */
export function scheduleScene(): void {
  const host = document.querySelector<HTMLElement>('[data-scene]');
  const canvas = host?.querySelector<HTMLCanvasElement>('[data-canvas]');
  if (!host || !canvas) return;
  const immediate = params.has('scene') || params.has('poster');
  if (!immediate && (reducedMotion() || saveData())) return;
  if (!webglOk()) return;
  if (params.has('poster')) document.body.classList.add('is-poster');

  const boot = () => import('./hero').then(m => m.createHero(host, canvas, { immediate })).catch(err => {
    console.warn('3D hero unavailable, keeping poster.', err);
  });

  if (immediate) { boot(); return; }
  const idle = (cb: () => void) => ('requestIdleCallback' in window ? (window as Window & { requestIdleCallback: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 300));
  if (document.readyState === 'complete') idle(boot);
  else window.addEventListener('load', () => idle(boot), { once: true });
}

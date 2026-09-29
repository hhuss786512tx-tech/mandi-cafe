import { gsap } from 'gsap';
import { reducedMotion } from './prefs';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** Wrap each word of a heading in an overflow mask so lines can slide up into view. */
function splitWords(el: HTMLElement): HTMLElement[] {
  const words: HTMLElement[] = [];
  const mask = (content: Node) => {
    const m = document.createElement('span');
    m.className = 'word-mask';
    const inner = document.createElement('span');
    inner.append(content);
    m.append(inner);
    words.push(inner);
    return m;
  };
  [...el.childNodes].forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      (node.textContent ?? '').split(/(\s+)/).forEach(part => {
        if (!part) return;
        frag.append(/^\s+$/.test(part) ? document.createTextNode(' ') : mask(document.createTextNode(part)));
      });
      node.replaceWith(frag);
    } else if (node instanceof HTMLElement) {
      const m = mask(document.createTextNode(''));
      node.replaceWith(m);
      (m.firstChild as HTMLElement).replaceChildren(node);
    }
  });
  return words;
}

type Play = () => void;

/**
 * Reveals driven by IntersectionObserver rather than scroll position: an
 * element plays when it enters the viewport, and immediately if it is already
 * in view or above it (deep links, back navigation). Content is never left
 * hidden by a missed scroll event. Transform/opacity/clip-path only.
 */
export function mountMotion(): void {
  if (reducedMotion()) return; // everything is visible by default; nothing to do
  gsap.defaults({ ease: EASE });
  // Reveals must finish on wall-clock time even when frames are slow (low-end phones): no lag smoothing.
  gsap.ticker.lagSmoothing(0);

  const plays = new Map<Element, Play>();
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting || e.boundingClientRect.top < 0) {
        plays.get(e.target)?.();
        plays.delete(e.target);
        io.unobserve(e.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  const register = (el: Element, setup: () => Play) => { plays.set(el, setup()); io.observe(el); };

  document.querySelectorAll<HTMLElement>('[data-split]').forEach(h => register(h, () => {
    const words = splitWords(h);
    gsap.set(words, { yPercent: 110 });
    return () => { gsap.to(words, { yPercent: 0, duration: 0.7, stagger: 0.045 }); };
  }));

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el => register(el, () => {
    gsap.set(el, { opacity: 0, y: 24 });
    return () => { gsap.to(el, { opacity: 1, y: 0, duration: 0.6, clearProps: 'transform' }); };
  }));

  document.querySelectorAll<HTMLElement>('[data-wipe]').forEach(el => register(el, () => {
    gsap.set(el, { clipPath: 'inset(0 100% 0 0)' });
    return () => { gsap.to(el, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, clearProps: 'clipPath' }); };
  }));
}

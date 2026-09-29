import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './prefs';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** Wrap each word of a heading in an overflow mask so lines can slide up into view. */
function splitWords(el: HTMLElement): HTMLElement[] {
  const words: HTMLElement[] = [];
  const wrap = (text: string) => {
    const frag = document.createDocumentFragment();
    text.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
      const mask = document.createElement('span');
      mask.className = 'word-mask';
      const inner = document.createElement('span');
      inner.textContent = part;
      mask.append(inner);
      frag.append(mask);
      words.push(inner);
    });
    return frag;
  };
  [...el.childNodes].forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.replaceWith(wrap(node.textContent ?? ''));
    } else if (node instanceof HTMLElement) {
      const mask = document.createElement('span');
      mask.className = 'word-mask';
      const inner = document.createElement('span');
      node.replaceWith(mask);
      inner.append(node);
      mask.append(inner);
      words.push(inner);
    }
  });
  return words;
}

export function mountMotion(): void {
  if (reducedMotion()) return; // everything is visible by default; nothing to do
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: EASE });

  document.querySelectorAll<HTMLElement>('[data-split]').forEach(h => {
    const words = splitWords(h);
    gsap.from(words, {
      yPercent: 110, duration: 0.7, stagger: 0.045,
      scrollTrigger: { trigger: h, start: 'top 88%', once: true },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 24, duration: 0.6,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-wipe]').forEach(el => {
    gsap.from(el, {
      clipPath: 'inset(0 100% 0 0)', duration: 0.7,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

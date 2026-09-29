import { finePointer, reducedMotion } from './prefs';

/** Gentle 3D tilt with a moving specular highlight. Pointer devices only, transform-only. */
export function mountTilt(): void {
  if (!finePointer() || reducedMotion()) return;
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach(el => {
    let raf = 0;
    let rx = 0, ry = 0, tx = 50, ty = 50;
    const paint = () => {
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      el.style.setProperty('--tx', `${tx}%`);
      el.style.setProperty('--ty', `${ty}%`);
      raf = 0;
    };
    el.addEventListener('pointerenter', () => el.classList.add('is-hover'));
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry = (px - 0.5) * 8; rx = (0.5 - py) * 8; tx = px * 100; ty = py * 100;
      if (!raf) raf = requestAnimationFrame(paint);
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-hover');
      rx = ry = 0; tx = ty = 50;
      el.style.transition = 'transform 500ms cubic-bezier(0.22,1,0.36,1)';
      if (!raf) raf = requestAnimationFrame(paint);
      setTimeout(() => { el.style.transition = ''; }, 500);
    });
  });
}

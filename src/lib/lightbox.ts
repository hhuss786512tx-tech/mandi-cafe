/** Keyboard-navigable lightbox built on <dialog>: focus is trapped by the browser, Esc closes. */
export function mountLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
  const triggers = [...document.querySelectorAll<HTMLButtonElement>('[data-lightbox]')];
  if (!dialog || !triggers.length || typeof dialog.showModal !== 'function') return;

  const stage = dialog.querySelector<HTMLElement>('[data-lightbox-stage]')!;
  const caption = dialog.querySelector<HTMLElement>('[data-lightbox-caption]')!;
  const counter = dialog.querySelector<HTMLElement>('[data-lightbox-counter]')!;
  const items = triggers.map(t => {
    const img = t.querySelector('img')!;
    return { src: img.currentSrc || img.src, srcset: img.srcset, alt: img.alt, width: img.width, height: img.height };
  });
  let index = 0;
  let opener: HTMLElement | null = null;

  const show = (i: number) => {
    index = (i + items.length) % items.length;
    const it = items[index];
    const img = new Image(it.width, it.height);
    img.alt = it.alt;
    img.decoding = 'async';
    if (it.srcset) { img.srcset = it.srcset; img.sizes = '100vw'; }
    img.src = it.src;
    stage.replaceChildren(img);
    caption.textContent = it.alt;
    counter.textContent = `${index + 1} / ${items.length}`;
  };

  triggers.forEach((t, i) => t.addEventListener('click', () => {
    opener = t;
    show(i);
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-lightbox-close]')?.focus();
  }));
  dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-lightbox-next]')?.addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { stage.replaceChildren(); opener?.focus(); });
}

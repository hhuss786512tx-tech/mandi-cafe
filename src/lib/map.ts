/** Click-to-load Google Maps embed. Nothing from Google loads until the visitor asks. */
export function mountMap(): void {
  const map = document.querySelector<HTMLElement>('[data-map]');
  const btn = map?.querySelector<HTMLButtonElement>('[data-map-load]');
  if (!map || !btn) return;
  btn.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = map.dataset.src ?? '';
    iframe.title = 'Google map showing the restaurant location';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    btn.replaceWith(iframe);
    iframe.focus();
  }, { once: true });
}

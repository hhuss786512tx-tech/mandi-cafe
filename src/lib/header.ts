export function mountHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (hero && !header.hasAttribute('data-header-static')) {
    // Light header once the hero has scrolled past the header bar.
    const io = new IntersectionObserver(([e]) => {
      header.classList.toggle('is-light', !e.isIntersecting);
    }, { rootMargin: `-${header.offsetHeight}px 0px 0px 0px`, threshold: 0 });
    io.observe(hero);
  }

  // aria-current on the nav link for the section in view.
  const links = [...header.querySelectorAll<HTMLAnchorElement>('.nav a[href^="#"]')];
  if (!links.length) return;
  const sections = links.map(a => document.querySelector<HTMLElement>(a.hash)).filter((s): s is HTMLElement => Boolean(s));
  const io2 = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const link = links.find(a => a.hash === `#${e.target.id}`);
      if (!link) return;
      if (e.isIntersecting) {
        links.forEach(l => l.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'true');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => io2.observe(s));
}

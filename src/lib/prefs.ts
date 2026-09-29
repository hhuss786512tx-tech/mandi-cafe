export const reducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const saveData = (): boolean =>
  Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

export const finePointer = (): boolean =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export const params = new URLSearchParams(location.search);

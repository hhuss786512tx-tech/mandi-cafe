// WCAG contrast check for every text/background pair used in the stylesheet.
const lum = hex => {
  const [r, g, b] = hex.match(/\w\w/g).map(h => parseInt(h, 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// composite rgba over a base
const over = (fg, a, bg) => '#' + fg.match(/\w\w/g).map((h, i) => Math.round(parseInt(h, 16) * a + parseInt(bg.match(/\w\w/g)[i], 16) * (1 - a)).toString(16).padStart(2, '0')).join('');

const cream = '#f4ebdd', cream2 = '#eadfcb', espresso = '#1b120d', saffron = '#c98a1b', copperInk = '#7f3f1e', olive = '#5b6135', inkMuted = '#5a4a3f', notes = '#fff7e6';
const paperMuted = over(cream, 0.74, espresso);
const pairs = [
  ['espresso on cream', espresso, cream, 4.5],
  ['espresso on cream-2', espresso, cream2, 4.5],
  ['ink-muted on cream', inkMuted, cream, 4.5],
  ['ink-muted on cream-2', inkMuted, cream2, 4.5],
  ['copper-ink on cream (eyebrow, prices)', copperInk, cream, 4.5],
  ['copper-ink on cream-2', copperInk, cream2, 4.5],
  ['olive on cream', olive, cream, 4.5],
  ['cream on espresso', cream, espresso, 4.5],
  ['paper-muted on espresso', paperMuted, espresso, 4.5],
  ['saffron on espresso (eyebrow, small bold)', saffron, espresso, 4.5],
  ['espresso on saffron (solid button)', espresso, saffron, 4.5],
  ['ink-muted on build-notes', inkMuted, notes, 4.5],
];
let ok = true;
for (const [name, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const pass = r >= min;
  ok &&= pass;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${r.toFixed(2).padStart(6)}  ${name}`);
}
process.exit(ok ? 0 : 1);

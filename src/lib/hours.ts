import { hours } from '../content/site.json';

type Range = [string, string];
type Weekly = Record<string, Range[]>;
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const LABEL: Record<string, string> = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' };

const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const fmt = (min: number): string => {
  min = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60), m = min % 60;
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
};

/** Current weekday index and minutes-since-midnight in the restaurant's timezone. */
function nowIn(tz: string, date = new Date()): { day: number; min: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  const day = DAYS.indexOf(get('weekday').toLowerCase());
  const hour = Number(get('hour')) % 24;
  return { day, min: hour * 60 + Number(get('minute')) };
}

export interface Status { open: boolean; text: string }

export function computeStatus(weekly: Weekly, tz: string, date = new Date()): Status {
  const { day, min } = nowIn(tz, date);
  const rangesFor = (d: number) => weekly[DAYS[(d + 7) % 7]] ?? [];

  // Open now? Check today's ranges and yesterday's ranges that spill past midnight.
  for (const [o, c] of rangesFor(day)) {
    const open = toMin(o), close = toMin(c) <= open ? toMin(c) + 1440 : toMin(c);
    if (min >= open && min < close) return { open: true, text: `Open now · closes ${fmt(close)}` };
  }
  for (const [o, c] of rangesFor(day - 1)) {
    const open = toMin(o), close = toMin(c) <= open ? toMin(c) + 1440 : toMin(c);
    if (close > 1440 && min + 1440 < close && min + 1440 >= open) return { open: true, text: `Open now · closes ${fmt(close)}` };
  }
  // Next opening.
  for (let ahead = 0; ahead < 8; ahead++) {
    const d = (day + ahead) % 7;
    const next = rangesFor(d).map(r => toMin(r[0])).filter(o => ahead > 0 || o > min).sort((a, b) => a - b)[0];
    if (next !== undefined) {
      const when = ahead === 0 ? '' : ahead === 1 ? 'tomorrow ' : `${LABEL[DAYS[d]]} `;
      return { open: false, text: `Closed · opens ${when}${fmt(next)}` };
    }
  }
  return { open: false, text: 'Closed' };
}

export function mountStatus(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-status]');
  if (!els.length) return;
  const update = () => {
    const s = computeStatus(hours.weekly as unknown as Weekly, hours.timezone);
    els.forEach(el => {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      const t = el.querySelector('[data-status-text]');
      if (t) t.textContent = s.text;
    });
  };
  update();
  setInterval(update, 60_000);
}

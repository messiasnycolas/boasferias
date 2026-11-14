import {
  DayNumber,
  dayOf,
  parseIsoDate,
  toIsoDate,
  weekday,
} from '../../calendar/domain/calendar-date';
import { PlanView, SuggestInput, holidayContext } from './suggest-plans';

/**
 * vacation: a vacation day the worker would otherwise work.
 * counted: a weekend or holiday inside a CLT period, spent as vacation by law.
 * off: a day off in the block (around the period, or free inside a PJ period).
 */
export type DayKind = 'vacation' | 'counted' | 'off' | 'none';

export interface CalendarDay {
  iso: string;
  day: number;
  /** 0 = Sunday. */
  weekday: number;
  kind: DayKind;
  holiday: string | null;
}

export interface CalendarMonth {
  year: number;
  month: number;
  /** Starts on Sunday: leading nulls pad the first week. */
  days: (CalendarDay | null)[];
}

const EXTRA_DAY_OFF = 'Licença ou banco de horas';

/** Month grids for the months that hold days off in `plan`; empty months between periods are skipped. */
export function planCalendar(input: SuggestInput, plan: PlanView): CalendarMonth[] {
  const parse = (iso: string) => parseIsoDate(iso) as DayNumber;
  const blocks = plan.periods.map((p) => ({
    start: parse(p.start),
    end: parse(p.end),
    offStart: parse(p.offStart),
    offEnd: parse(p.offEnd),
  }));
  const first = blocks[0].offStart;
  const last = blocks[blocks.length - 1].offEnd;
  const removed = input.removedHolidays.map(parse);
  const extra = input.extraDaysOff.map(parse);
  const { defaults, daysOff } = holidayContext(input, first, last, removed, extra);
  const names = new Map(
    defaults.filter((h) => !removed.includes(h.date)).map((h) => [h.date, h.name]),
  );
  for (const day of extra) names.set(day, EXTRA_DAY_OFF);

  const kindOf = (day: DayNumber): DayKind => {
    const block = blocks.find((b) => day >= b.offStart && day <= b.offEnd);
    if (!block) return 'none';
    if (day < block.start || day > block.end) return 'off';
    if (daysOff.isWorkday(day)) return 'vacation';
    return input.mode === 'clt' ? 'counted' : 'off';
  };

  const months: CalendarMonth[] = [];
  const [y0, m0] = toIsoDate(first).split('-').map(Number);
  const [y1, m1] = toIsoDate(last).split('-').map(Number);
  for (let y = y0, m = m0; y < y1 || (y === y1 && m <= m1); m === 12 ? (y++, (m = 1)) : m++) {
    const start = dayOf(y, m, 1);
    const end = dayOf(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1) - 1;
    const days: (CalendarDay | null)[] = Array(weekday(start)).fill(null);
    for (let day = start; day <= end; day++) {
      days.push({
        iso: toIsoDate(day),
        day: day - start + 1,
        weekday: weekday(day),
        kind: kindOf(day),
        holiday: names.get(day) ?? null,
      });
    }
    if (days.some((d) => d && d.kind !== 'none')) months.push({ year: y, month: m, days });
  }
  return months;
}

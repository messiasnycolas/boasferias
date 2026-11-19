import {
  DayNumber,
  dayOf,
  parseIsoDate,
  toIsoDate,
  weekday,
} from '../../calendar/domain/calendar-date';
import { ADDED_HOLIDAY, PlanView, SuggestInput, holidayContext } from './suggest-plans';

/**
 * vacation: a vacation day the worker would otherwise work.
 * counted: a weekend or holiday inside a CLT period, spent as vacation by law.
 * credit: a credit day (banco de horas) the worker would otherwise work.
 * off: a day off in the block (around the period, or free inside a PJ period or a credit run).
 */
export type DayKind = 'vacation' | 'counted' | 'credit' | 'off' | 'none';

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

const LEAVE_DAY = 'Dia já marcado';

/** Month grids for the months that hold days off in `plan`; empty months between periods are skipped. */
export function planCalendar(input: SuggestInput, plan: PlanView): CalendarMonth[] {
  const parse = (iso: string) => parseIsoDate(iso) as DayNumber;
  const blocks = plan.periods.map((p) => ({
    credit: p.credit,
    start: parse(p.start),
    end: parse(p.end),
    offStart: parse(p.offStart),
    offEnd: parse(p.offEnd),
  }));
  const first = blocks[0].offStart;
  const last = blocks[blocks.length - 1].offEnd;
  const removed = input.removedHolidays.map(parse);
  const added = input.addedHolidays.map(parse);
  const leave = input.leaveDays.map(parse);
  const { defaults, daysOff } = holidayContext(input, first, last, removed, added, leave);
  const names = new Map(
    defaults.filter((h) => !removed.includes(h.date)).map((h) => [h.date, h.name]),
  );
  for (const day of added) if (!names.has(day)) names.set(day, ADDED_HOLIDAY);
  for (const day of leave) names.set(day, LEAVE_DAY);

  // Blocks joined by credit overlap on the days off between them; a period's own days win.
  const kindOf = (day: DayNumber): DayKind => {
    const inBlock = blocks.filter((b) => day >= b.offStart && day <= b.offEnd);
    if (!inBlock.length) return 'none';
    const block = inBlock.find((b) => day >= b.start && day <= b.end);
    if (!block) return 'off';
    if (daysOff.isWorkday(day)) return block.credit ? 'credit' : 'vacation';
    return input.mode === 'clt' && !block.credit ? 'counted' : 'off';
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

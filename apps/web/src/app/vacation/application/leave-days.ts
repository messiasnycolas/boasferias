import { addDays, parseIsoDate, toIsoDate } from '../../calendar/domain/calendar-date';

/** Longest range added at once: big enough for any leave, small enough to catch a wrong year. */
export const MAX_LEAVE_DAYS = 60;

export type LeaveError = 'invalid-date' | 'end-before-start' | 'too-long';

export interface LeaveRun {
  start: string;
  end: string;
  days: string[];
}

/** "Licença ou banco de horas": a start day and an optional end day, as ISO days. */
export function expandLeave(
  start: string,
  end: string,
): { ok: true; days: string[] } | { ok: false; error: LeaveError } {
  const first = parseIsoDate(start);
  const last = end ? parseIsoDate(end) : first;
  if (first === null || last === null) return { ok: false, error: 'invalid-date' };
  if (last < first) return { ok: false, error: 'end-before-start' };
  if (last - first + 1 > MAX_LEAVE_DAYS) return { ok: false, error: 'too-long' };
  const days: string[] = [];
  for (let day = first; day <= last; day = addDays(day, 1)) days.push(toIsoDate(day));
  return { ok: true, days };
}

/** Consecutive days shown as one range, so a whole leave is listed and removed together. */
export function groupLeave(dates: readonly string[]): LeaveRun[] {
  const sorted = [...dates].sort();
  const runs: LeaveRun[] = [];
  for (const date of sorted) {
    const last = runs.at(-1);
    if (last && isNextDay(last.end, date)) {
      last.end = date;
      last.days.push(date);
    } else {
      runs.push({ start: date, end: date, days: [date] });
    }
  }
  return runs;
}

function isNextDay(previous: string, date: string): boolean {
  const a = parseIsoDate(previous);
  const b = parseIsoDate(date);
  return a !== null && b !== null && b === addDays(a, 1);
}

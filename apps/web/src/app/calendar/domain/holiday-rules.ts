import { DayNumber, addDays, dayOf } from './calendar-date';

export interface Holiday {
  date: DayNumber;
  name: string;
}

/** A holiday as its law states it: a fixed day, or a distance from Easter Sunday. */
export type HolidayRule = (
  { month: number; day: number; easter?: never } | { easter: number; month?: never; day?: never }
) & {
  name: string;
  /** First year it applies: the year its law created it. */
  since?: number;
};

/** A city holiday in most capitals and, from 2026, a state holiday in Rio de Janeiro. */
export const CORPUS_CHRISTI: HolidayRule = { easter: 60, name: 'Corpus Christi' };

/** Easter Sunday, anonymous Gregorian algorithm. */
export function easter(year: number): DayNumber {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return dayOf(year, month, day);
}

/** The rules' holidays in a year, in date order; rules not yet in force are left out. */
export function holidaysOf(rules: readonly HolidayRule[], year: number): Holiday[] {
  const sunday = easter(year);
  return rules
    .filter((rule) => !rule.since || year >= rule.since)
    .map((rule) => ({
      date:
        rule.easter === undefined
          ? dayOf(year, rule.month, rule.day)
          : addDays(sunday, rule.easter),
      name: rule.name,
    }))
    .sort((x, y) => x.date - y.date);
}

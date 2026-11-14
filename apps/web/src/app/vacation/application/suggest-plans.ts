import { DayNumber, parseIsoDate, toIsoDate, yearOf } from '../../calendar/domain/calendar-date';
import { Holiday, holidays } from '../../calendar/domain/holidays';
import {
  CLT_MAX_DAYS,
  CLT_MAX_PERIODS,
  CLT_SHORT_PERIOD,
  cltCandidates,
  enjoyedDays,
} from '../domain/clt';
import { DaysOff } from '../domain/days-off';
import { PJ_MAX_DAYS, PJ_MAX_PERIODS, pjCandidates } from '../domain/pj';
import { Period, rankPlans } from '../domain/planner';

export const MAX_WINDOW_DAYS = 400;
export const MAX_LIMIT = 20;
const WEEKDAYS = 7;

export type Mode = 'clt' | 'pj';

/** Input ranges per mode, for the form. */
export const LIMITS: Record<Mode, { days: [number, number]; periods: [number, number] }> = {
  clt: { days: [CLT_SHORT_PERIOD, CLT_MAX_DAYS], periods: [1, CLT_MAX_PERIODS] },
  pj: { days: [1, PJ_MAX_DAYS], periods: [1, PJ_MAX_PERIODS] },
};

export interface SuggestInput {
  mode: Mode;
  /** CLT: calendar days of vacation; PJ: workdays off. */
  days: number;
  /** CLT only: sell a third (abono pecuniário). */
  sellThird: boolean;
  maxPeriods: number;
  earliestStart: string;
  /** Last day a vacation day may fall on. */
  deadline: string;
  /** Worked weekdays, 0 = Sunday. */
  workWeek: readonly number[];
  removedHolidays: readonly string[];
  extraDaysOff: readonly string[];
  limit: number;
}

export type SuggestError =
  | 'invalid-date'
  | 'deadline-before-start'
  | 'window-too-long'
  | 'invalid-days'
  | 'invalid-periods'
  | 'invalid-work-week'
  | 'invalid-limit';

export interface PeriodView {
  start: string;
  end: string;
  daysSpent: number;
  offStart: string;
  offEnd: string;
  daysOff: number;
}

export interface PlanView {
  periods: PeriodView[];
  daysOff: number;
  daysSpent: number;
  extraDays: number;
}

export interface HolidayView {
  date: string;
  name: string;
}

export type SuggestResult =
  { ok: true; plans: PlanView[]; holidays: HolidayView[] } | { ok: false; error: SuggestError };

const isIntIn = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max;

function parseAll(values: readonly string[]): DayNumber[] | null {
  const days = values.map(parseIsoDate);
  return days.every((day) => day !== null) ? (days as DayNumber[]) : null;
}

function validate(input: SuggestInput, from: DayNumber, to: DayNumber): SuggestError | null {
  const clt = input.mode === 'clt';
  if (to < from) return 'deadline-before-start';
  if (to - from + 1 > MAX_WINDOW_DAYS) return 'window-too-long';
  if (!isIntIn(input.days, 1, clt ? CLT_MAX_DAYS : PJ_MAX_DAYS)) return 'invalid-days';
  // No CLT period, single or split, may be shorter than 5 days.
  if (clt && enjoyedDays(input.days, input.sellThird) < CLT_SHORT_PERIOD) return 'invalid-days';
  if (!isIntIn(input.maxPeriods, 1, clt ? CLT_MAX_PERIODS : PJ_MAX_PERIODS))
    return 'invalid-periods';
  const week = input.workWeek;
  if (week.length === 0 || !week.every((day) => isIntIn(day, 0, WEEKDAYS - 1)))
    return 'invalid-work-week';
  if (!isIntIn(input.limit, 1, MAX_LIMIT)) return 'invalid-limit';
  return null;
}

function toPeriodView(c: Period): PeriodView {
  return {
    start: toIsoDate(c.start),
    end: toIsoDate(c.end),
    daysSpent: c.cost,
    offStart: toIsoDate(c.offStart),
    offEnd: toIsoDate(c.offEnd),
    daysOff: c.offEnd - c.offStart + 1,
  };
}

/** Default holidays around [from, to] and the resulting work calendar, after the user's changes. */
export function holidayContext(
  input: Pick<SuggestInput, 'workWeek'>,
  from: DayNumber,
  to: DayNumber,
  removed: readonly DayNumber[],
  extra: readonly DayNumber[],
): { defaults: Holiday[]; daysOff: DaysOff } {
  // One year of margin: blocks of days off may reach past the window.
  const defaults: Holiday[] = [];
  for (let year = yearOf(from) - 1; year <= yearOf(to) + 1; year++)
    defaults.push(...holidays(year));
  const removedSet = new Set(removed);
  const daysOff = new DaysOff(input.workWeek, [
    ...defaults.map((h) => h.date).filter((date) => !removedSet.has(date)),
    ...extra,
  ]);
  return { defaults, daysOff };
}

/** Ranked vacation plans for a CLT or PJ worker, with the default holidays in the window. */
export function suggestPlans(input: SuggestInput): SuggestResult {
  const [from, to] = [parseIsoDate(input.earliestStart), parseIsoDate(input.deadline)];
  const removed = parseAll(input.removedHolidays);
  const extra = parseAll(input.extraDaysOff);
  if (from === null || to === null || !removed || !extra)
    return { ok: false, error: 'invalid-date' };
  const error = validate(input, from, to);
  if (error) return { ok: false, error };

  const { defaults, daysOff } = holidayContext(input, from, to, removed, extra);
  const clt = input.mode === 'clt';
  const units = clt ? enjoyedDays(input.days, input.sellThird) : input.days;
  const plans = rankPlans({
    units,
    maxPeriods: input.maxPeriods,
    splitNeedsLong: clt,
    candidates: clt
      ? cltCandidates(daysOff, from, to, units, input.maxPeriods)
      : pjCandidates(daysOff, from, to, units),
    limit: input.limit,
  });

  return {
    ok: true,
    plans: plans.map((plan) => ({
      periods: plan.periods.map(toPeriodView),
      daysOff: plan.daysOff,
      daysSpent: plan.daysSpent,
      extraDays: plan.daysOff - plan.daysSpent,
    })),
    holidays: defaults
      .filter((h) => h.date >= from && h.date <= to)
      .map((h) => ({ date: toIsoDate(h.date), name: h.name })),
  };
}

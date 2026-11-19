import { DayNumber, parseIsoDate, toIsoDate, yearOf } from '../../calendar/domain/calendar-date';
import { Holiday, HolidayRule, holidays } from '../../calendar/domain/holidays';
import { STATES, Uf } from '../../calendar/domain/state-holidays';
import {
  CLT_MAX_DAYS,
  CLT_MAX_PERIODS,
  CLT_SHORT_PERIOD,
  cltCandidates,
  enjoyedDays,
} from '../domain/clt';
import { CREDIT_MAX_DAYS, creditCandidates } from '../domain/credit';
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
  /** Where the worker is: adds the state's holidays. */
  state: Uf | null;
  /** The city's holidays, once a city in that state is chosen. */
  city: readonly HolidayRule[] | null;
  removedHolidays: readonly string[];
  /** Days already scheduled off (leave): CLT vacation may touch them, never cover them. */
  leaveDays: readonly string[];
  /** CLT only: credit days (banco de horas) for the planner to place, all of them. */
  creditDays: number;
  /** Credit days in one run instead of wherever they rest most. */
  creditInRow: boolean;
  limit: number;
}

export type SuggestError =
  | 'invalid-date'
  | 'deadline-before-start'
  | 'window-too-long'
  | 'invalid-days'
  | 'invalid-periods'
  | 'invalid-work-week'
  | 'invalid-limit'
  | 'invalid-state'
  | 'invalid-city'
  | 'invalid-credit';

export interface PeriodView {
  start: string;
  end: string;
  daysSpent: number;
  offStart: string;
  offEnd: string;
  daysOff: number;
  /** Credit days (banco de horas), not vacation. */
  credit: boolean;
}

export interface PlanView {
  periods: PeriodView[];
  daysOff: number;
  /** Vacation and credit days together. */
  daysSpent: number;
  creditDays: number;
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

const validRule = (rule: HolidayRule) =>
  rule.easter === undefined
    ? isIntIn(rule.month, 1, 12) && isIntIn(rule.day, 1, 31)
    : isIntIn(rule.easter, -366, 366);

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
  if (input.state !== null && !STATES.includes(input.state)) return 'invalid-state';
  if (input.city !== null && (input.state === null || !input.city.every(validRule)))
    return 'invalid-city';
  if (!isIntIn(input.creditDays, 0, clt ? CREDIT_MAX_DAYS : 0)) return 'invalid-credit';
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
    credit: !!c.credit,
  };
}

/** Credit days placed back to back are one run to the user: one row, one range. */
function joinCredit(periods: readonly Period[]): Period[] {
  const joined: Period[] = [];
  for (const p of periods) {
    const last = joined.at(-1);
    if (last?.credit && p.credit && p.start === last.offEnd + 1) {
      joined[joined.length - 1] = {
        ...last,
        end: p.end,
        offEnd: p.offEnd,
        cost: last.cost + p.cost,
      };
    } else {
      joined.push(p);
    }
  }
  return joined;
}

/** Default holidays around [from, to] and the resulting work calendar, after the user's changes. */
export function holidayContext(
  input: Pick<SuggestInput, 'workWeek' | 'state' | 'city'>,
  from: DayNumber,
  to: DayNumber,
  removed: readonly DayNumber[],
  leave: readonly DayNumber[],
): { defaults: Holiday[]; daysOff: DaysOff } {
  // One year of margin: blocks of days off may reach past the window.
  const defaults: Holiday[] = [];
  for (let year = yearOf(from) - 1; year <= yearOf(to) + 1; year++)
    defaults.push(...holidays(year, input.state ?? undefined, input.city ?? undefined));
  const removedSet = new Set(removed);
  const daysOff = new DaysOff(
    input.workWeek,
    defaults.map((h) => h.date).filter((date) => !removedSet.has(date)),
    leave,
  );
  return { defaults, daysOff };
}

/** Ranked vacation plans for a CLT or PJ worker, with the default holidays in the window. */
export function suggestPlans(input: SuggestInput): SuggestResult {
  const [from, to] = [parseIsoDate(input.earliestStart), parseIsoDate(input.deadline)];
  const removed = parseAll(input.removedHolidays);
  const leave = parseAll(input.leaveDays);
  if (from === null || to === null || !removed || !leave)
    return { ok: false, error: 'invalid-date' };
  const error = validate(input, from, to);
  if (error) return { ok: false, error };

  const { defaults, daysOff } = holidayContext(input, from, to, removed, leave);
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
    credit: {
      units: input.creditDays,
      candidates: creditCandidates(daysOff, from, to, input.creditDays, input.creditInRow),
    },
  });

  return {
    ok: true,
    plans: plans.map((plan) => ({
      periods: joinCredit(plan.periods).map(toPeriodView),
      daysOff: plan.daysOff,
      daysSpent: plan.daysSpent,
      creditDays: input.creditDays,
      extraDays: plan.daysOff - plan.daysSpent,
    })),
    holidays: defaults
      .filter((h) => h.date >= from && h.date <= to)
      .map((h) => ({ date: toIsoDate(h.date), name: h.name })),
  };
}

import {
  addDays,
  dayOf,
  parseIsoDate,
  toIsoDate,
  yearOf,
} from '../../calendar/domain/calendar-date';
import { cltEarliestStart } from '../domain/clt';
import { MON_FRI, MON_SAT } from '../domain/days-off';
import { Mode, SuggestInput } from './suggest-plans';

const DEFAULT_DAYS: Record<Mode, number> = { clt: 30, pj: 20 };
const DEFAULT_MAX_PERIODS = 3;
/** PJ has no notice rule; a week ahead leaves time to arrange the work. */
const PJ_LEAD_DAYS = 7;
/** Plans computed by default; the page can ask for more, up to MAX_LIMIT. */
export const DEFAULT_LIMIT = 3;

/** Work-week presets (0 = Sunday). */
export const WORK_WEEKS = { 'mon-fri': MON_FRI, 'mon-sat': MON_SAT } as const;

/** Ready-to-run input for `today` (ISO, in the user's time zone): CLT needs 30 days of notice. */
export function defaultInput(mode: Mode, today: string): SuggestInput {
  const day = parseIsoDate(today) as number;
  const [month, date] = today.slice(5).split('-').map(Number);
  // Same calendar day next year, minus one: a 12-month window (Feb 29 rolls to Mar 1).
  const deadline = addDays(dayOf(yearOf(day) + 1, month, date), -1);
  return {
    mode,
    days: DEFAULT_DAYS[mode],
    sellThird: false,
    maxPeriods: DEFAULT_MAX_PERIODS,
    earliestStart: toIsoDate(mode === 'clt' ? cltEarliestStart(day) : addDays(day, PJ_LEAD_DAYS)),
    deadline: toIsoDate(deadline),
    workWeek: [...MON_FRI],
    state: null,
    city: null,
    removedHolidays: [],
    addedHolidays: [],
    leaveDays: [],
    creditDays: 0,
    creditInRow: false,
    limit: DEFAULT_LIMIT,
  };
}

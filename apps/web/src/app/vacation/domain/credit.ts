import { DayNumber } from '../../calendar/domain/calendar-date';
import { DaysOff } from './days-off';
import { Period } from './planner';
import { pjCandidates } from './pj';

/** Most credit days the planner places at once (banco de horas, leave without fixed dates). */
export const CREDIT_MAX_DAYS = 15;

/**
 * Where credit days can go inside [from, to]: they spend workdays only, like PJ days. In a row, one
 * run spending all `days`; otherwise single days, which the planner may chain into runs.
 */
export function creditCandidates(
  daysOff: DaysOff,
  from: DayNumber,
  to: DayNumber,
  days: number,
  inRow: boolean,
): Period[] {
  if (days === 0) return [];
  const size = inRow ? days : 1;
  return pjCandidates(daysOff, from, to, size)
    .filter((c) => c.cost === size)
    .map((c) => ({ ...c, credit: true }));
}

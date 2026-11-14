import { DayNumber, addDays } from '../../calendar/domain/calendar-date';
import { DaysOff } from './days-off';
import { Period } from './planner';

export const CLT_MAX_DAYS = 30; // art. 130
export const CLT_MAX_PERIODS = 3; // art. 134 §1
export const CLT_LONG_PERIOD = 14; // art. 134 §1
export const CLT_SHORT_PERIOD = 5; // art. 134 §1
const CLT_NO_START_DAYS = 2; // art. 134 §3
const CLT_NOTICE_DAYS = 30; // art. 135
const SELLABLE_FRACTION = 3; // art. 143

/** Earliest start once the employer is told today (written notice, art. 135). */
export function cltEarliestStart(today: DayNumber): DayNumber {
  return addDays(today, CLT_NOTICE_DAYS);
}

/** Days actually taken; selling converts a third into cash (abono pecuniário, art. 143). */
export function enjoyedDays(days: number, sellThird: boolean): number {
  return sellThird ? days - Math.floor(days / SELLABLE_FRACTION) : days;
}

/** A workday not in the 2 days before a holiday or the weekly paid rest (art. 134 §3). */
export function canStartClt(day: DayNumber, daysOff: DaysOff): boolean {
  if (!daysOff.isWorkday(day)) return false;
  for (let ahead = 1; ahead <= CLT_NO_START_DAYS; ahead++) {
    const next = addDays(day, ahead);
    if (daysOff.isHoliday(next) || daysOff.isRestDay(next)) return false;
  }
  return true;
}

/** Every allowed CLT period inside [from, to]; days are calendar days, so non-work days inside are spent. */
export function cltCandidates(
  daysOff: DaysOff,
  from: DayNumber,
  to: DayNumber,
  days: number,
  maxPeriods: number,
): Period[] {
  const minLength = maxPeriods === 1 ? days : CLT_SHORT_PERIOD;
  const candidates: Period[] = [];
  for (let start = from; start <= to; start++) {
    if (!canStartClt(start, daysOff)) continue;
    for (let length = minLength; length <= days; length++) {
      const end = addDays(start, length - 1);
      if (end > to) break;
      candidates.push({
        start,
        end,
        cost: length,
        offStart: start - daysOff.offBefore(start),
        offEnd: end + daysOff.offAfter(end),
        long: length >= CLT_LONG_PERIOD,
      });
    }
  }
  return candidates;
}

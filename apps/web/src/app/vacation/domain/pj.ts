import { DayNumber } from '../../calendar/domain/calendar-date';
import { DaysOff } from './days-off';
import { Period } from './planner';

export const PJ_MAX_DAYS = 30;
// Unlimited splits always degrade into single days next to weekends, so the user sets a cap.
export const PJ_MAX_PERIODS = 10;

/** Every PJ period inside [from, to] from workday to workday; only workdays inside are spent. */
export function pjCandidates(
  daysOff: DaysOff,
  from: DayNumber,
  to: DayNumber,
  days: number,
): Period[] {
  const candidates: Period[] = [];
  for (let start = from; start <= to; start++) {
    if (!daysOff.isWorkday(start)) continue;
    let cost = 0;
    for (let end = start; end <= to && cost < days; end++) {
      if (!daysOff.isWorkday(end)) continue;
      cost++;
      candidates.push({
        start,
        end,
        cost,
        offStart: start - daysOff.offBefore(start),
        offEnd: end + daysOff.offAfter(end),
        long: false,
      });
    }
  }
  return candidates;
}

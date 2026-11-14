import { DayNumber, weekday } from '../../calendar/domain/calendar-date';

const SUNDAY = 0;
export const MON_FRI: readonly number[] = [1, 2, 3, 4, 5];
export const MON_SAT: readonly number[] = [1, 2, 3, 4, 5, 6];

/** Which days someone works, given their work week (0 = Sunday) and the holidays they get off. */
export class DaysOff {
  private readonly workdays: ReadonlySet<number>;
  private readonly holidays: ReadonlySet<DayNumber>;

  constructor(workWeek: readonly number[], holidays: Iterable<DayNumber>) {
    this.workdays = new Set(workWeek);
    this.holidays = new Set(holidays);
  }

  isWorkday(day: DayNumber): boolean {
    return this.workdays.has(weekday(day)) && !this.holidays.has(day);
  }

  isHoliday(day: DayNumber): boolean {
    return this.holidays.has(day);
  }

  /** Weekly paid rest: Sunday, or every non-work weekday when Sundays are worked. */
  isRestDay(day: DayNumber): boolean {
    const dayOfWeek = weekday(day);
    return this.workdays.has(SUNDAY) ? !this.workdays.has(dayOfWeek) : dayOfWeek === SUNDAY;
  }

  /** Consecutive days off right before `day`. */
  offBefore(day: DayNumber): number {
    let count = 0;
    while (!this.isWorkday(day - count - 1)) count++;
    return count;
  }

  /** Consecutive days off right after `day`. */
  offAfter(day: DayNumber): number {
    let count = 0;
    while (!this.isWorkday(day + count + 1)) count++;
    return count;
  }
}

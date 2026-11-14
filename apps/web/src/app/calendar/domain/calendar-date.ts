/** A calendar date as whole days since 1970-01-01 (UTC). No time, no time zone. */
export type DayNumber = number;

const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const EPOCH_WEEKDAY = 4; // 1970-01-01 was a Thursday.

export function dayOf(year: number, month: number, day: number): DayNumber {
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

export function parseIsoDate(value: string): DayNumber | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const day = dayOf(Number(match[1]), Number(match[2]), Number(match[3]));
  return toIsoDate(day) === value ? day : null;
}

export function toIsoDate(day: DayNumber): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekday(day: DayNumber): number {
  return (((day + EPOCH_WEEKDAY) % 7) + 7) % 7;
}

export function addDays(day: DayNumber, days: number): DayNumber {
  return day + days;
}

export function yearOf(day: DayNumber): number {
  return new Date(day * MS_PER_DAY).getUTCFullYear();
}

import { addDays, dayOf, parseIsoDate, toIsoDate, weekday, yearOf } from './calendar-date';

describe('calendar date', () => {
  it('round-trips ISO dates', () => {
    expect(toIsoDate(parseIsoDate('2027-02-28') as number)).toBe('2027-02-28');
    expect(toIsoDate(dayOf(1999, 12, 31))).toBe('1999-12-31');
  });

  it('rejects malformed or impossible dates', () => {
    expect(parseIsoDate('2027-02-30')).toBeNull();
    expect(parseIsoDate('2027-2-1')).toBeNull();
    expect(parseIsoDate('abc')).toBeNull();
  });

  it('knows weekdays (0 = Sunday)', () => {
    expect(weekday(dayOf(2027, 1, 1))).toBe(5);
    expect(weekday(dayOf(2027, 1, 3))).toBe(0);
  });

  it('adds days across months and years, and reads the year', () => {
    expect(toIsoDate(addDays(dayOf(2027, 12, 31), 1))).toBe('2028-01-01');
    expect(yearOf(dayOf(2028, 2, 29))).toBe(2028);
  });
});

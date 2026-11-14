import { MAX_LEAVE_DAYS, expandLeave, groupLeave } from './leave-days';

describe('expandLeave', () => {
  it('adds one day when there is no end', () => {
    expect(expandLeave('2027-02-09', '')).toEqual({ ok: true, days: ['2027-02-09'] });
  });

  it('adds every day of a range, ends included', () => {
    expect(expandLeave('2027-02-27', '2027-03-02')).toEqual({
      ok: true,
      days: ['2027-02-27', '2027-02-28', '2027-03-01', '2027-03-02'],
    });
  });

  it('treats the same start and end as one day', () => {
    expect(expandLeave('2027-02-09', '2027-02-09')).toEqual({ ok: true, days: ['2027-02-09'] });
  });

  it('rejects an end before the start, a range over the cap, and bad dates', () => {
    expect(expandLeave('2027-02-10', '2027-02-09')).toEqual({
      ok: false,
      error: 'end-before-start',
    });
    expect(expandLeave('2027-01-01', '2027-03-02')).toEqual({ ok: false, error: 'too-long' });
    expect(expandLeave('2027-01-01', '2027-03-01').ok).toBe(true); // exactly MAX_LEAVE_DAYS
    expect(MAX_LEAVE_DAYS).toBe(60);
    expect(expandLeave('', '')).toEqual({ ok: false, error: 'invalid-date' });
    expect(expandLeave('2027-02-30', '')).toEqual({ ok: false, error: 'invalid-date' });
  });
});

describe('groupLeave', () => {
  it('joins consecutive days into ranges, in order', () => {
    expect(groupLeave(['2027-03-01', '2027-02-27', '2027-02-28', '2027-05-01'])).toEqual([
      { start: '2027-02-27', end: '2027-03-01', days: ['2027-02-27', '2027-02-28', '2027-03-01'] },
      { start: '2027-05-01', end: '2027-05-01', days: ['2027-05-01'] },
    ]);
    expect(groupLeave([])).toEqual([]);
  });
});

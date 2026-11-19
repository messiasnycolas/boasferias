import { SuggestInput, suggestPlans } from './suggest-plans';

const base: SuggestInput = {
  mode: 'clt',
  days: 11,
  sellThird: false,
  maxPeriods: 1,
  earliestStart: '2027-08-02',
  deadline: '2027-08-31',
  workWeek: [1, 2, 3, 4, 5],
  state: null,
  city: null,
  removedHolidays: [],
  leaveDays: ['2027-08-13'],
  creditDays: 0,
  creditInRow: false,
  limit: 3,
};

const run = (change: Partial<SuggestInput>) => suggestPlans({ ...base, ...change });

describe('suggestPlans', () => {
  it('returns ranked plans with ISO dates and extra days', () => {
    const result = run({});
    if (!result.ok) throw new Error(result.error);
    expect(result.plans[0]).toEqual({
      periods: [
        {
          start: '2027-08-02',
          end: '2027-08-12',
          daysSpent: 11,
          offStart: '2027-07-31',
          offEnd: '2027-08-15',
          daysOff: 16,
          credit: false,
        },
      ],
      daysOff: 16,
      daysSpent: 11,
      creditDays: 0,
      extraDays: 5,
    });
  });

  it('lists the default holidays inside the window', () => {
    const result = run({ earliestStart: '2027-11-01', deadline: '2027-11-30', leaveDays: [] });
    if (!result.ok) throw new Error(result.error);
    expect(result.holidays.map((h) => h.date)).toEqual(['2027-11-02', '2027-11-15', '2027-11-20']);
  });

  it("adds the chosen state's holidays", () => {
    const window = { earliestStart: '2027-07-01', deadline: '2027-07-31', leaveDays: [] };
    const none = run(window);
    const sp = run({ ...window, state: 'SP' });
    if (!none.ok || !sp.ok) throw new Error('unexpected error');
    expect(none.holidays).toEqual([]);
    expect(sp.holidays).toEqual([{ date: '2027-07-09', name: 'Revolução Constitucionalista' }]);
  });

  it("adds the chosen city's holidays", () => {
    const window = { earliestStart: '2027-01-04', deadline: '2027-01-31', leaveDays: [] };
    const city = [{ month: 1, day: 25, name: 'Aniversário da Cidade' }];
    const result = run({ ...window, state: 'SP', city });
    if (!result.ok) throw new Error(result.error);
    expect(result.holidays).toEqual([{ date: '2027-01-25', name: 'Aniversário da Cidade' }]);
  });

  it('ignores removed holidays and counts extra days off', () => {
    const window = { earliestStart: '2027-11-08', deadline: '2027-11-30', leaveDays: [] };
    const withHoliday = run({ ...window, mode: 'pj', days: 1 });
    const removed = run({ ...window, mode: 'pj', days: 1, removedHolidays: ['2027-11-15'] });
    if (!withHoliday.ok || !removed.ok) throw new Error('unexpected error');
    expect(withHoliday.plans[0].daysOff).toBe(4); // Fri 12 bridges to Mon 15
    expect(removed.plans[0].daysOff).toBe(3);
  });

  it('spends two thirds when a third is sold', () => {
    const result = run({ days: 30, sellThird: true, maxPeriods: 3, deadline: '2027-12-31' });
    if (!result.ok) throw new Error(result.error);
    expect(result.plans[0].daysSpent).toBe(20);
  });

  it('places credit days, counted apart and in the days spent', () => {
    const result = run({ creditDays: 2 });
    if (!result.ok) throw new Error(result.error);
    for (const plan of result.plans) {
      const credit = plan.periods.filter((p) => p.credit);
      expect(credit.reduce((sum, p) => sum + p.daysSpent, 0)).toBe(2);
      expect([plan.daysSpent, plan.creditDays]).toEqual([13, 2]);
      expect(plan.extraDays).toBe(plan.daysOff - 13);
      // Back-to-back credit days are one row.
      for (let i = 1; i < credit.length; i++)
        expect(credit[i].start > credit[i - 1].offEnd).toBe(true);
    }
    const run5 = run({ creditDays: 5, deadline: '2027-08-20' });
    if (!run5.ok) throw new Error(run5.error);
    expect(run5.plans.some((p) => p.periods.some((q) => q.credit && q.daysSpent > 1))).toBe(true);
    const inRow = run({ creditDays: 2, creditInRow: true });
    if (!inRow.ok) throw new Error(inRow.error);
    expect(inRow.plans[0].periods.filter((p) => p.credit).map((p) => p.daysSpent)).toEqual([2]);
  });

  it('rejects invalid input', () => {
    const cases: [Partial<SuggestInput>, string][] = [
      [{ earliestStart: '2027-02-30' }, 'invalid-date'],
      [{ leaveDays: ['x'] }, 'invalid-date'],
      [{ deadline: '2027-08-01' }, 'deadline-before-start'],
      [{ deadline: '2029-01-01' }, 'window-too-long'],
      [{ days: 31 }, 'invalid-days'],
      [{ days: 2.5 }, 'invalid-days'],
      [{ days: 4 }, 'invalid-days'],
      [{ days: 6, sellThird: true }, 'invalid-days'],
      [{ mode: 'pj', days: 31 }, 'invalid-days'],
      [{ maxPeriods: 4 }, 'invalid-periods'],
      [{ mode: 'pj', maxPeriods: 11 }, 'invalid-periods'],
      [{ workWeek: [] }, 'invalid-work-week'],
      [{ workWeek: [7] }, 'invalid-work-week'],
      [{ limit: 0 }, 'invalid-limit'],
      [{ limit: 21 }, 'invalid-limit'],
      [{ state: 'XX' as SuggestInput['state'] }, 'invalid-state'],
      [{ state: 'SP', city: [{ month: 13, day: 1, name: 'x' }] }, 'invalid-city'],
      [{ state: 'SP', city: [{ easter: 0.5, name: 'x' }] }, 'invalid-city'],
      [{ city: [] }, 'invalid-city'],
      [{ creditDays: 16 }, 'invalid-credit'],
      [{ creditDays: -1 }, 'invalid-credit'],
      [{ creditDays: 1.5 }, 'invalid-credit'],
      [{ mode: 'pj', creditDays: 1 }, 'invalid-credit'],
    ];
    for (const [change, error] of cases) {
      expect(run(change)).toEqual({ ok: false, error });
    }
  });

  it('returns no plans when nothing fits the window', () => {
    expect(run({ days: 30, deadline: '2027-08-30' })).toEqual(
      expect.objectContaining({ ok: true, plans: [] }),
    );
  });
});

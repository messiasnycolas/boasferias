import { defaultInput } from './defaults';
import { planCalendar } from './plan-calendar';
import { PlanView, SuggestInput, suggestPlans } from './suggest-plans';

const clt: SuggestInput = {
  ...defaultInput('clt', '2027-01-10'),
  leaveDays: ['2027-02-08', '2027-02-09'],
};

const plan = (start: string, end: string, offStart: string, offEnd: string): PlanView => ({
  periods: [{ start, end, daysSpent: 0, offStart, offEnd, daysOff: 0, credit: false }],
  daysOff: 0,
  daysSpent: 0,
  creditDays: 0,
  extraDays: 0,
});

const kinds = (input: SuggestInput, view: PlanView, month: number) =>
  planCalendar(input, view)
    .find((m) => m.month === month)
    ?.days.filter((day) => day !== null)
    .map((day) => `${day.day}${day.kind[0]}`)
    .join(' ');

describe('defaultInput', () => {
  it('gives CLT 30 days, 30 days of notice and a 12-month window', () => {
    expect(defaultInput('clt', '2027-01-10')).toEqual({
      mode: 'clt',
      days: 30,
      sellThird: false,
      maxPeriods: 3,
      earliestStart: '2027-02-09',
      deadline: '2028-01-09',
      workWeek: [1, 2, 3, 4, 5],
      state: null,
      city: null,
      removedHolidays: [],
      leaveDays: [],
      creditDays: 0,
      creditInRow: false,
      limit: 3,
    });
  });

  it('starts PJ a week ahead with 20 workdays', () => {
    const input = defaultInput('pj', '2027-01-10');
    expect([input.days, input.earliestStart]).toEqual([20, '2027-01-17']);
  });

  it('is always valid', () => {
    expect(suggestPlans(defaultInput('clt', '2027-01-10')).ok).toBe(true);
    expect(suggestPlans(defaultInput('pj', '2028-02-29')).ok).toBe(true);
  });
});

describe('planCalendar', () => {
  it('marks vacation, days off and holidays, month by month', () => {
    const view = plan('2027-02-01', '2027-02-05', '2027-01-30', '2027-02-09');
    const months = planCalendar(clt, view);
    expect(months.map((m) => `${m.year}-${m.month}`)).toEqual(['2027-1', '2027-2']);
    expect(months[1].days[0]).toBeNull(); // February 2027 starts on a Monday
    expect(kinds(clt, view, 2)?.startsWith('1v 2v 3v 4v 5v 6o 7o 8o 9o 10n')).toBe(true);
    expect(months[1].days.find((d) => d?.day === 8)?.holiday).toBe('Dia já marcado');
  });

  it('flags days the CLT counts as vacation even though they are off', () => {
    const view = plan('2027-03-29', '2027-04-03', '2027-03-26', '2027-04-04');
    expect(kinds(clt, view, 4)?.startsWith('1v 2v 3c 4o')).toBe(true);
    expect(planCalendar(clt, view)[0].days.find((d) => d?.day === 26)?.holiday).toBe(
      'Sexta-feira Santa',
    );
  });

  it('skips months without days off between periods', () => {
    const view: PlanView = {
      ...plan('2027-02-01', '2027-02-05', '2027-01-30', '2027-02-09'),
      periods: [
        ...plan('2027-02-01', '2027-02-05', '2027-01-30', '2027-02-09').periods,
        ...plan('2027-05-03', '2027-05-07', '2027-05-01', '2027-05-09').periods,
      ],
    };
    expect(planCalendar(clt, view).map((m) => m.month)).toEqual([1, 2, 5]);
  });

  it('marks credit days apart from vacation', () => {
    const input: SuggestInput = { ...clt, creditDays: 1, deadline: '2027-03-31' };
    const result = suggestPlans(input);
    if (!result.ok) throw new Error(result.error);
    const view = result.plans[0];
    const credit = view.periods.find((p) => p.credit);
    if (!credit) throw new Error('no credit day placed');
    const day = planCalendar(input, view)
      .flatMap((m) => m.days)
      .find((d) => d?.iso === credit.start);
    expect(day?.kind).toBe('credit');
  });

  it('keeps PJ holidays inside a period free', () => {
    const pj: SuggestInput = { ...defaultInput('pj', '2027-01-10'), leaveDays: ['2027-08-11'] };
    const view = plan('2027-08-09', '2027-08-13', '2027-08-07', '2027-08-15');
    expect(kinds(pj, view, 8)?.includes('10v 11o 12v')).toBe(true);
  });
});

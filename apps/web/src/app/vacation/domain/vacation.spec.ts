import { DayNumber, parseIsoDate, toIsoDate } from '../../calendar/domain/calendar-date';
import { holidays } from '../../calendar/domain/holidays';
import { canStartClt, cltCandidates, cltEarliestStart, enjoyedDays } from './clt';
import { DaysOff, MON_FRI, MON_SAT } from './days-off';
import { pjCandidates } from './pj';
import { Plan, rankPlans } from './planner';

const d = (iso: string): DayNumber => parseIsoDate(iso) as DayNumber;
// August 2027: Mondays are 2, 9, 16, 23, 30.
const FROM = d('2027-08-02');
const TO = d('2027-08-31');

const show = (plan: Plan) =>
  plan.periods.map((p) => `${toIsoDate(p.start)}..${toIsoDate(p.end)}`).join(' + ');

function clt(daysOff: DaysOff, days: number, maxPeriods: number, limit = 10, from = FROM, to = TO) {
  const candidates = cltCandidates(daysOff, from, to, days, maxPeriods);
  return rankPlans({ units: days, maxPeriods, splitNeedsLong: true, candidates, limit });
}

function pj(daysOff: DaysOff, days: number, maxPeriods: number, limit = 10) {
  const candidates = pjCandidates(daysOff, FROM, TO, days);
  return rankPlans({ units: days, maxPeriods, splitNeedsLong: false, candidates, limit });
}

describe('CLT rules', () => {
  it('sells a third of the days', () => {
    expect([30, 24, 18, 12].map((days) => enjoyedDays(days, true))).toEqual([20, 16, 12, 8]);
    expect(enjoyedDays(30, false)).toBe(30);
  });

  it('starts at least 30 days after notice', () => {
    expect(toIsoDate(cltEarliestStart(d('2027-01-10')))).toBe('2027-02-09');
  });

  it('never starts in the 2 days before Sunday or a holiday', () => {
    const daysOff = new DaysOff(MON_FRI, [d('2027-08-13')]);
    const allowed = (iso: string) => canStartClt(d(iso), daysOff);
    expect(allowed('2027-08-05')).toBe(true); // Thursday
    expect(allowed('2027-08-06')).toBe(false); // Friday, Sunday ahead
    expect(allowed('2027-08-11')).toBe(false); // Wednesday, holiday on Friday
    expect(allowed('2027-08-07')).toBe(false); // Saturday is not a workday
  });

  it('treats every non-work day as rest when Sundays are worked', () => {
    const daysOff = new DaysOff([0, 1, 2, 4, 5, 6], []); // off on Wednesdays only
    expect(canStartClt(d('2027-08-02'), daysOff)).toBe(false); // Monday
    expect(canStartClt(d('2027-08-05'), daysOff)).toBe(true); // Thursday
  });
});

describe('plan ranking', () => {
  it('CLT surrounds: Monday to Thursday before a Friday holiday gives 16 days off for 11', () => {
    const [best] = clt(new DaysOff(MON_FRI, [d('2027-08-13')]), 11, 1);
    expect(show(best)).toBe('2027-08-02..2027-08-12');
    expect(best.daysOff).toBe(16);
    expect(best.daysSpent).toBe(11);
  });

  it('CLT spends holidays inside the vacation', () => {
    const plans = clt(new DaysOff(MON_FRI, [d('2027-08-13')]), 11, 1, 100);
    expect(plans.find((p) => show(p) === '2027-08-03..2027-08-13')?.daysOff).toBe(13);
  });

  it('CLT splits respect the 14/5 sizes, the maximum count and the deadline', () => {
    const daysOff = new DaysOff(MON_FRI, []);
    const to = d('2027-10-31');
    const plans = clt(daysOff, 20, 2, 50, FROM, to);
    expect(plans.some((p) => p.periods.length === 2)).toBe(true);
    for (const plan of plans) {
      const sizes = plan.periods.map((p) => p.end - p.start + 1);
      expect(sizes.length).toBeLessThanOrEqual(2);
      expect(sizes.reduce((a, b) => a + b)).toBe(20);
      if (sizes.length === 2) {
        expect(Math.max(...sizes)).toBeGreaterThanOrEqual(14);
        expect(Math.min(...sizes)).toBeGreaterThanOrEqual(5);
      }
      for (const p of plan.periods) {
        expect(canStartClt(p.start, daysOff)).toBe(true);
        expect(p.end).toBeLessThanOrEqual(to);
      }
    }
  });

  it('CLT finds the best year and offers the 5-day Carnaval bridge (Folga Extra 19+5+6 case)', () => {
    const years = [2026, 2027, 2028].flatMap((year) => holidays(year).map((h) => h.date));
    const carnival = [d('2027-02-08'), d('2027-02-09')];
    const daysOff = new DaysOff(MON_FRI, [...years, ...carnival]);
    const top = clt(daysOff, 30, 3, 6, d('2027-01-04'), d('2027-12-31'));
    expect(top.every((plan) => plan.daysOff === 45)).toBe(true);
    expect(top.some((plan) => show(plan).includes('2027-02-01..2027-02-05'))).toBe(true);
  });

  it('returns nothing when the window is too short', () => {
    expect(clt(new DaysOff(MON_FRI, []), 30, 1, 10, FROM, d('2027-08-20'))).toEqual([]);
  });

  it('PJ bridges: one workday after a Thursday holiday gives 4 days off', () => {
    const [best] = pj(new DaysOff(MON_FRI, [d('2027-08-12')]), 1, 1);
    expect(show(best)).toBe('2027-08-13..2027-08-13');
    expect(best.daysOff).toBe(4);
  });

  it('PJ does not spend holidays inside the range', () => {
    const [best] = pj(new DaysOff(MON_FRI, [d('2027-08-11')]), 4, 1);
    expect(show(best)).toBe('2027-08-09..2027-08-13');
    expect(best.daysSpent).toBe(4);
    expect(best.daysOff).toBe(9);
  });

  it('PJ uses up to the maximum number of periods', () => {
    const daysOff = new DaysOff(MON_FRI, [d('2027-08-05'), d('2027-08-26')]);
    const [best] = pj(daysOff, 2, 2);
    expect(show(best)).toBe('2027-08-06..2027-08-06 + 2027-08-27..2027-08-27');
    expect(best.daysOff).toBe(8);
    expect(pj(daysOff, 4, 2).every((p) => p.periods.length <= 2)).toBe(true);
  });

  it('Mon-Sat counts Saturday as a workday', () => {
    const [best] = pj(new DaysOff(MON_SAT, [d('2027-08-12')]), 1, 1);
    expect(best.daysOff).toBe(2);
  });

  it('a custom week uses exactly the chosen days', () => {
    const [best] = pj(new DaysOff([2, 3, 4, 5, 6], []), 1, 1); // Tuesday to Saturday
    expect(show(best)).toBe('2027-08-03..2027-08-03');
    expect(best.daysOff).toBe(3);
  });

  it('breaks ties by earliest start and merges plans with the same days off', () => {
    const plans = pj(new DaysOff(MON_FRI, []), 1, 1, 3);
    expect(plans.map(show)).toEqual([
      '2027-08-02..2027-08-02',
      '2027-08-06..2027-08-06',
      '2027-08-09..2027-08-09',
    ]);
    const blocks = plans.map((p) => p.periods.map((x) => `${x.offStart}-${x.offEnd}`).join());
    expect(new Set(blocks).size).toBe(blocks.length);
  });
});

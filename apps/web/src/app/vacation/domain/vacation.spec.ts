import { DayNumber, parseIsoDate, toIsoDate } from '../../calendar/domain/calendar-date';
import { holidays } from '../../calendar/domain/holidays';
import { canStartClt, cltCandidates, cltEarliestStart, enjoyedDays } from './clt';
import { creditCandidates } from './credit';
import { DaysOff, MON_FRI, MON_SAT } from './days-off';
import { pjCandidates } from './pj';
import { Period, Plan, rankPlans } from './planner';

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

function withCredit(
  daysOff: DaysOff,
  days: number,
  maxPeriods: number,
  credit: number,
  { inRow = false, from = FROM, to = TO } = {},
) {
  const candidates = cltCandidates(daysOff, from, to, days, maxPeriods);
  const credits = creditCandidates(daysOff, from, to, credit, inRow);
  return rankPlans({
    units: days,
    maxPeriods,
    splitNeedsLong: true,
    candidates,
    limit: 10,
    credit: { units: credit, candidates: credits },
  });
}

const showAll = (plan: Plan) =>
  plan.periods
    .map((p) => `${p.credit ? 'credit ' : ''}${toIsoDate(p.start)}..${toIsoDate(p.end)}`)
    .join(' + ');

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

describe('leave (days already scheduled)', () => {
  // Leave Monday 9 to Wednesday 11 August.
  const leave = [d('2027-08-09'), d('2027-08-10'), d('2027-08-11')];
  const daysOff = new DaysOff(MON_FRI, [], leave);

  it('is never covered by vacation, which may end the day before or start the day after', () => {
    const candidates = cltCandidates(daysOff, FROM, TO, 5, 3);
    expect(candidates.some((c) => c.start <= leave[2] && c.end >= leave[0])).toBe(false);
    expect(candidates.some((c) => toIsoDate(c.end) === '2027-08-08')).toBe(true);
    expect(candidates.some((c) => toIsoDate(c.start) === '2027-08-12')).toBe(true);
  });

  it('does not block CLT starts the way a holiday does', () => {
    expect(canStartClt(d('2027-08-05'), daysOff)).toBe(true); // Thursday, leave ahead
    expect(canStartClt(d('2027-08-05'), new DaysOff(MON_FRI, leave))).toBe(true);
    expect(canStartClt(d('2027-08-12'), new DaysOff(MON_FRI, [], [d('2027-08-13')]))).toBe(true);
    expect(canStartClt(d('2027-08-12'), new DaysOff(MON_FRI, [d('2027-08-13')]))).toBe(false);
  });

  it('joins the block of days off next to it', () => {
    const [best] = clt(daysOff, 5, 1);
    expect(show(best)).toBe('2027-08-02..2027-08-06');
    expect(best.daysOff).toBe(12); // Saturday 31 July to Wednesday 11 August
  });
});

describe('credit days', () => {
  // A credit day next to a weekend already gives 3 days off, so tight windows force the joins.
  it('continue a period before it: Friday credit, Monday start', () => {
    const window = { from: d('2027-08-06'), to: d('2027-08-15') };
    const [best] = withCredit(new DaysOff(MON_FRI, []), 5, 1, 1, window);
    expect(showAll(best)).toBe('credit 2027-08-06..2027-08-06 + 2027-08-09..2027-08-13');
    expect(best.daysOff).toBe(10); // Friday 6 to Sunday 15
    expect(best.daysSpent).toBe(6);
  });

  it('continue a period after it', () => {
    const window = { to: d('2027-08-09') };
    const [best] = withCredit(new DaysOff(MON_FRI, []), 5, 1, 1, window);
    expect(showAll(best)).toBe('2027-08-02..2027-08-06 + credit 2027-08-09..2027-08-09');
    expect(best.daysOff).toBe(10); // Saturday 31 July to Monday 9
  });

  it('bridge a holiday to the weekend', () => {
    const [best] = withCredit(new DaysOff(MON_FRI, [d('2027-08-12')]), 5, 1, 1);
    expect(showAll(best)).toBe('2027-08-02..2027-08-06 + credit 2027-08-13..2027-08-13');
    expect(best.daysOff).toBe(13); // 9 around the period, Thursday 12 to Sunday 15
  });

  it('go where they rest most, or in one run when asked', () => {
    const daysOff = new DaysOff(MON_FRI, [d('2027-08-12'), d('2027-08-26')]);
    const [free] = withCredit(daysOff, 5, 1, 2);
    expect(free.daysOff).toBe(17); // two Friday bridges of 4
    expect(free.periods.filter((p) => p.credit)).toHaveLength(2);
    const [inRow] = withCredit(daysOff, 5, 1, 2, { inRow: true });
    expect(inRow.daysOff).toBe(14);
    expect(inRow.periods.filter((p) => p.credit).map((p) => p.cost)).toEqual([2]);
  });

  it('are spent exactly, and vacation periods still never touch', () => {
    const plans = withCredit(new DaysOff(MON_FRI, [d('2027-08-12')]), 20, 3, 3);
    expect(plans.length).toBeGreaterThan(0);
    for (const plan of plans) {
      const credit = plan.periods.filter((p) => p.credit);
      expect(credit.reduce((sum, p) => sum + p.cost, 0)).toBe(3);
      expect(plan.daysSpent).toBe(23);
      const vacation = plan.periods.filter((p) => !p.credit);
      for (let i = 1; i < vacation.length; i++)
        expect(vacation[i].start).toBeGreaterThan(vacation[i - 1].offEnd + 1);
    }
  });

  it('change nothing when there are none', () => {
    const daysOff = new DaysOff(MON_FRI, [d('2027-08-13')]);
    expect(withCredit(daysOff, 11, 2, 0)).toEqual(clt(daysOff, 11, 2));
    expect(creditCandidates(daysOff, FROM, TO, 0, false)).toEqual([]);
  });

  // The planner skips partial plans that cannot reach the best; a full search must agree with it.
  it('rank like a search of every plan', () => {
    let seed = 7;
    const random = (n: number) => {
      seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31;
      return seed % n;
    };
    let found = 0;
    for (let round = 0; round < 40; round++) {
      const from = d('2027-08-02') + random(7);
      const to = from + 16 + random(8);
      const holidayList = Array.from({ length: random(3) }, () => from + random(to - from));
      const daysOff = new DaysOff(MON_FRI, holidayList);
      const days = 5 + random(6);
      const maxPeriods = 1 + random(2);
      const credit = 1 + random(3);
      const inRow = random(2) === 1;
      const limit = 1 + random(4);
      const candidates = cltCandidates(daysOff, from, to, days, maxPeriods);
      const credits = creditCandidates(daysOff, from, to, credit, inRow);
      const plans = rankPlans({
        units: days,
        maxPeriods,
        splitNeedsLong: true,
        candidates,
        limit,
        credit: { units: credit, candidates: credits },
      });
      const all = everyPlan([...candidates, ...credits], days, maxPeriods, credit);
      const case_ = { round, days, maxPeriods, credit, inRow, limit };
      expect({ ...case_, scores: plans.map((p) => p.daysOff) }).toEqual({
        ...case_,
        scores: all.slice(0, limit),
      });
      for (const plan of plans) expect(plan.daysOff).toBe(daysOffOf(plan.periods));
      if (plans.length) found++;
    }
    expect(found).toBeGreaterThan(30); // the cases are not trivially empty
  });
});

/** Days off in the union of the plan's blocks. */
function daysOffOf(periods: readonly Period[]): number {
  const off = new Set<number>();
  for (const p of periods) for (let day = p.offStart; day <= p.offEnd; day++) off.add(day);
  return off.size;
}

/** Scores of every valid plan, distinct days off, best first: the planner's rules, by brute force. */
function everyPlan(all: readonly Period[], units: number, maxPeriods: number, credit: number) {
  const byDays = new Map<string, number>();
  const walk = (chosen: Period[], used: number, count: number, spent: number, long: boolean) => {
    if (used === units && spent === credit && (count < 2 || long)) {
      const off = new Set<number>();
      for (const p of chosen) for (let day = p.offStart; day <= p.offEnd; day++) off.add(day);
      byDays.set([...off].sort((a, b) => a - b).join(), off.size);
    }
    const last = chosen.at(-1);
    for (const c of all) {
      // Credit may touch the block before it, and a period may touch credit before it.
      if (last && c.start < last.offEnd + (last.credit || c.credit ? 1 : 2)) continue;
      if (c.credit ? spent + c.cost > credit : count === maxPeriods || used + c.cost > units)
        continue;
      if (c.credit) walk([...chosen, c], used, count, spent + c.cost, long);
      else walk([...chosen, c], used + c.cost, count + 1, spent, long || c.long);
    }
  };
  walk([], 0, 0, 0, false);
  return [...byDays.values()].sort((a, b) => b - a);
}

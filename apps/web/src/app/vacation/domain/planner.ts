import { DayNumber } from '../../calendar/domain/calendar-date';

/** One possible vacation period and the block of consecutive days off around it. */
export interface Period {
  start: DayNumber;
  end: DayNumber;
  /** Days spent: calendar days (CLT) or workdays (PJ). */
  cost: number;
  offStart: DayNumber;
  offEnd: DayNumber;
  /** Satisfies the CLT long-period minimum. */
  long: boolean;
  /** Credit days (banco de horas): spent from the credit budget, outside the period count. */
  credit?: boolean;
}

export interface Plan {
  periods: Period[];
  daysOff: number;
  daysSpent: number;
}

export interface PlanSearch {
  /** Exact total cost to spend. */
  units: number;
  maxPeriods: number;
  /** Plans with two or more periods need a long one (CLT). */
  splitNeedsLong: boolean;
  candidates: readonly Period[];
  limit: number;
  /** Credit days to spend exactly, and where they may go. */
  credit?: { units: number; candidates: readonly Period[] };
}

interface Chain {
  period: Period;
  prev: Chain | null;
}

interface Entry {
  score: number;
  first: DayNumber;
  chain: Chain | null;
  /** Hash of the blocks of days off: equal score and key means the same days off. */
  key: number;
}

type Slots = (Entry[] | undefined)[];

// The day after a block is a workday, so a gap of one keeps blocks from touching.
const BLOCK_GAP = 2;
const HASH_PRIME = 1_000_003;
const HASH_SPREAD = 131;
// Below this many days under the bound, a pass costs about as much as one without a floor.
const MAX_DROP = 12;

const better = (a: Entry, b: Entry) => b.score - a.score || a.first - b.first;

/** Inserts in order, skipping same-days-off duplicates; false when `entry` cannot make the list. */
function insert(slots: Slots, state: number, entry: Entry, capacity: number): boolean {
  const list = (slots[state] ??= []);
  if (list.length === capacity && better(entry, list[capacity - 1]) >= 0) return false;
  if (list.some((other) => other.score === entry.score && other.key === entry.key)) return true;
  let i = list.length;
  while (i > 0 && better(entry, list[i - 1]) < 0) i--;
  list.splice(i, 0, entry);
  if (list.length > capacity) list.pop();
  return true;
}

/**
 * Best plans by total consecutive days off, ties broken by earliest start. Dynamic programming over
 * candidate periods in date order: a state is (cost spent, periods used, credit spent, has a long
 * period). Blocks of days off never touch, except where credit is involved: credit may continue a
 * block (before or after a period, or other credit) and the two count as one.
 *
 * With credit the states multiply, so the search runs with a floor: partial plans that cannot reach
 * it, even with the best vacation and the best credit left counted apart, are dropped. The floor
 * starts at the best such bound and comes down until `limit` plans reach it, so the result is exact.
 */
export function rankPlans(search: PlanSearch): Plan[] {
  const { units, maxPeriods, splitNeedsLong, candidates, limit } = search;
  const creditUnits = search.credit?.units ?? 0;
  const all = [...candidates, ...(search.credit?.candidates ?? [])];
  if (all.length === 0) return [];

  const counts = maxPeriods + 1;
  const credits = creditUnits + 1;
  const stateOf = (cost: number, count: number, spent: number, long: boolean) =>
    (((cost * counts + count) * credits + spent) << 1) | +long;
  const origin = Math.min(...all.map((c) => c.start));
  const days = Math.max(...all.map((c) => c.offEnd)) - origin + BLOCK_GAP + 1;

  // Candidates by start day, cheapest first, so a budget check can end the loop.
  const vacationAt: Period[][] = Array.from({ length: days }, () => []);
  const creditAt: Period[][] = Array.from({ length: days }, () => []);
  for (const c of all) (c.credit ? creditAt : vacationAt)[c.start - origin].push(c);
  for (const list of [...vacationAt, ...creditAt]) list.sort((x, y) => x.cost - y.cost);

  const bound = creditUnits
    ? upperBounds(vacationAt, creditAt, origin, days, units, maxPeriods, creditUnits)
    : null;
  if (!bound) return plansFrom(pass(-Infinity));
  // Most days off from day t on with r cost, n periods and q credit left; never below a real plan.
  const best = (t: number, r: number, n: number, q: number) =>
    bound.vacation[t][n][r] + bound.credit[t][q];
  const top = best(0, units, maxPeriods, creditUnits);
  // Each pass costs several times the one before, so the floor comes down a day at a time.
  for (let drop = 0; drop <= MAX_DROP; drop++) {
    const plans = plansFrom(pass(top - drop));
    if (plans.length === limit) return plans;
  }
  return plansFrom(pass(-Infinity));

  function pass(floor: number): Entry[] {
    // arrivals[t]: partial plans whose next period may start on day t; available: all arrived so far.
    const arrivals: Slots[] = Array.from({ length: days + 1 }, () => []);
    const available: Slots = [];
    const live: number[] = []; // the states of available that hold entries
    const admit = (state: number, entry: Entry) => {
      if (!available[state]) live.push(state);
      insert(available, state, entry, limit);
    };
    admit(stateOf(0, 0, 0, false), {
      score: 0,
      first: Number.MAX_SAFE_INTEGER,
      chain: null,
      key: 0,
    });
    // after*[t]: partial plans whose last block ends on day t - 1, so a start on t continues it.
    const afterCredit: Slots[] = Array.from({ length: days + 1 }, () => []);
    const afterVacation: Slots[] = Array.from({ length: days + 1 }, () => []);

    // A full list keeps only entries better than its last one.
    const fails = (full: Entry[] | undefined, score: number, first: number) => {
      if (full?.length !== limit) return false;
      const last = full[limit - 1];
      return score < last.score || (score === last.score && first >= last.first);
    };
    const decode = (state: number) => {
      const rest = state >> 1;
      return {
        spent: rest % credits,
        count: Math.floor(rest / credits) % counts,
        used: Math.floor(rest / credits / counts),
        long: (state & 1) === 1,
      };
    };
    // Whether the best entry of `list` at day t can still reach the floor.
    const hopeful = (list: Entry[], state: number, t: number) => {
      if (!bound) return true;
      const { spent, count, used } = decode(state);
      return (
        list[0].score + best(t, units - used, maxPeriods - count, creditUnits - spent) >= floor
      );
    };

    const extend = (
      list: Entry[],
      state: number,
      starting: readonly Period[],
      touching: boolean,
    ) => {
      const { spent, count, used, long } = decode(state);
      for (const c of starting) {
        let next: number;
        let left: number;
        if (c.credit) {
          if (spent + c.cost > creditUnits) break;
          next = stateOf(used, count, spent + c.cost, long);
          left = bound
            ? best(
                c.offEnd - origin + 1,
                units - used,
                maxPeriods - count,
                creditUnits - spent - c.cost,
              )
            : 0;
        } else {
          if (count === maxPeriods || used + c.cost > units) break;
          next = stateOf(used + c.cost, count + 1, spent, long || c.long);
          left = bound
            ? best(
                c.offEnd - origin + 1,
                units - used - c.cost,
                maxPeriods - count - 1,
                creditUnits - spent,
              )
            : 0;
        }
        const end = c.offEnd - origin;
        const target = arrivals[Math.min(end + BLOCK_GAP, days)];
        const touch = creditUnits ? (c.credit ? afterCredit : afterVacation)[end + 1] : undefined;
        // Continuing a block: only the days from the start on are new, and the block's end moves.
        const gain = c.offEnd - (touching ? c.start : c.offStart) + 1;
        // Entries are sorted and all gain the same, so the first rejected one ends the loop.
        for (const entry of list) {
          const score = entry.score + gain;
          if (score + left < floor) break;
          const first = Math.min(entry.first, c.start);
          if (fails(target[next], score, first) && (!touch || fails(touch[next], score, first)))
            break;
          const key = touching
            ? (entry.key - (c.start - 1) + c.offEnd) | 0
            : (Math.imul(entry.key, HASH_PRIME) + c.offStart * HASH_SPREAD + c.offEnd) | 0;
          const made: Entry = {
            score,
            first,
            chain: { period: c, prev: entry.chain },
            key,
          };
          insert(target, next, made, limit);
          if (touch) insert(touch, next, made, limit);
        }
      }
    };

    for (let t = 0; t <= days; t++) {
      arrivals[t].forEach((list, state) => list?.forEach((e) => admit(state, e)));
      if (t === days) break;
      for (const state of live) {
        const list = available[state]!;
        if (!hopeful(list, state, t)) continue;
        extend(list, state, vacationAt[t], false);
        extend(list, state, creditAt[t], false);
      }
      afterCredit[t].forEach((list, state) => {
        if (!list?.length || !hopeful(list, state, t)) return;
        extend(list, state, vacationAt[t], true);
        extend(list, state, creditAt[t], true);
      });
      afterVacation[t].forEach((list, state) => {
        if (list?.length && hopeful(list, state, t)) extend(list, state, creditAt[t], true);
      });
    }

    const finals: Entry[] = [];
    for (let count = 1; count <= maxPeriods; count++) {
      for (const long of [false, true]) {
        if (splitNeedsLong && count > 1 && !long) continue;
        finals.push(...(available[stateOf(units, count, creditUnits, long)] ?? []));
      }
    }
    return finals.sort(better);
  }

  function plansFrom(finals: Entry[]): Plan[] {
    const seen = new Set<number>();
    const plans: Plan[] = [];
    for (const entry of finals) {
      if (seen.has(entry.key)) continue;
      seen.add(entry.key);
      const periods: Period[] = [];
      for (let chain = entry.chain; chain; chain = chain.prev) periods.unshift(chain.period);
      plans.push({ periods, daysOff: entry.score, daysSpent: units + creditUnits });
      if (plans.length === limit) break;
    }
    return plans;
  }
}

/**
 * Upper bounds on the days off still to gain from day t on: vacation[t][n][r] with n periods and r
 * cost left, and credit[t][q] with q credit left, each placed alone. Together they bound any plan: next to each
 * other, vacation and credit gain no more than apart.
 */
function upperBounds(
  vacationAt: readonly Period[][],
  creditAt: readonly Period[][],
  origin: number,
  days: number,
  units: number,
  maxPeriods: number,
  creditUnits: number,
) {
  const table = (size: number) =>
    Array.from({ length: days + 2 }, () => new Array<number>(size + 1).fill(0));
  // vacation[t][n][r]: at most n periods.
  const vacation = Array.from({ length: days + 2 }, () =>
    Array.from({ length: maxPeriods + 1 }, () => new Array<number>(units + 1).fill(0)),
  );
  for (let t = days - 1; t >= 0; t--) {
    for (let n = 1; n <= maxPeriods; n++) {
      for (let r = 0; r <= units; r++) {
        let most = vacation[t + 1][n][r];
        for (const c of vacationAt[t]) {
          if (c.cost > r) break;
          const after = vacation[Math.min(c.offEnd - origin + BLOCK_GAP, days)][n - 1][r - c.cost];
          most = Math.max(most, c.offEnd - c.offStart + 1 + after);
        }
        vacation[t][n][r] = most;
      }
    }
  }
  // free[t]: credit starting on day t or later; after[t]: the same, but a block ends on day t - 1.
  const free = table(creditUnits);
  const after = table(creditUnits);
  for (let t = days - 1; t >= 0; t--) {
    for (let q = 0; q <= creditUnits; q++) {
      let alone = free[t + 1][q];
      let touching = free[t + 1][q];
      for (const c of creditAt[t]) {
        if (c.cost > q) break;
        const rest = after[Math.min(c.offEnd - origin + 1, days)][q - c.cost];
        alone = Math.max(alone, c.offEnd - c.offStart + 1 + rest);
        touching = Math.max(touching, c.offEnd - c.start + 1 + rest);
      }
      free[t][q] = alone;
      after[t][q] = touching;
    }
  }
  return { vacation, credit: free };
}

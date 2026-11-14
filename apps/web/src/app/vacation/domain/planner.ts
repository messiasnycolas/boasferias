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
 * candidate periods in date order: a state is (cost spent, periods used, has a long period).
 */
export function rankPlans(search: PlanSearch): Plan[] {
  const { units, maxPeriods, splitNeedsLong, candidates, limit } = search;
  if (candidates.length === 0) return [];

  const counts = maxPeriods + 1;
  const stateOf = (cost: number, count: number, long: boolean) =>
    ((cost * counts + count) << 1) | +long;
  const origin = Math.min(...candidates.map((c) => c.start));
  const days = Math.max(...candidates.map((c) => c.offEnd)) - origin + BLOCK_GAP + 1;

  const byStart: Period[][] = Array.from({ length: days }, () => []);
  for (const c of candidates) byStart[c.start - origin].push(c);

  // arrivals[t]: partial plans whose next period may start on day t; available: all arrived so far.
  const arrivals: Slots[] = Array.from({ length: days + 1 }, () => []);
  const available: Slots = [];
  available[stateOf(0, 0, false)] = [
    { score: 0, first: Number.MAX_SAFE_INTEGER, chain: null, key: 0 },
  ];

  for (let t = 0; t <= days; t++) {
    arrivals[t].forEach((list, state) => list?.forEach((e) => insert(available, state, e, limit)));
    if (t === days) break;
    available.forEach((list, state) => {
      if (!list) return;
      const used = Math.floor((state >> 1) / counts);
      const count = (state >> 1) % counts;
      if (count === maxPeriods) return;
      for (const c of byStart[t]) {
        if (used + c.cost > units) continue;
        const target = arrivals[Math.min(c.offEnd - origin + BLOCK_GAP, days)];
        const nextState = stateOf(used + c.cost, count + 1, (state & 1) === 1 || c.long);
        const blockDays = c.offEnd - c.offStart + 1;
        // Entries are sorted and all gain the same, so the first rejected one ends the loop.
        for (const entry of list) {
          const score = entry.score + blockDays;
          const first = Math.min(entry.first, c.start);
          const full = target[nextState];
          if (full?.length === limit) {
            const last = full[limit - 1];
            if (score < last.score || (score === last.score && first >= last.first)) break;
          }
          const key = (Math.imul(entry.key, HASH_PRIME) + c.offStart * HASH_SPREAD + c.offEnd) | 0;
          insert(
            target,
            nextState,
            { score, first, chain: { period: c, prev: entry.chain }, key },
            limit,
          );
        }
      }
    });
  }

  const finals: Entry[] = [];
  for (let count = 1; count <= maxPeriods; count++) {
    for (const long of [false, true]) {
      if (splitNeedsLong && count > 1 && !long) continue;
      finals.push(...(available[stateOf(units, count, long)] ?? []));
    }
  }
  finals.sort(better);

  const seen = new Set<number>();
  const plans: Plan[] = [];
  for (const entry of finals) {
    if (seen.has(entry.key)) continue;
    seen.add(entry.key);
    const periods: Period[] = [];
    for (let chain = entry.chain; chain; chain = chain.prev) periods.unshift(chain.period);
    plans.push({ periods, daysOff: entry.score, daysSpent: units });
    if (plans.length === limit) break;
  }
  return plans;
}

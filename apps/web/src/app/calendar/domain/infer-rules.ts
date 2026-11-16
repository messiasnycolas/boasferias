import { DayNumber, addDays, dayOf, toIsoDate } from './calendar-date';
import { Holiday, HolidayRule, easter } from './holiday-rules';

const GENERIC = 'Feriado Municipal';

/**
 * Yearly rules from a source that lists dated holidays per year (the latest two years are read).
 * A day becomes a rule when both years have it on the same date (fixed) or at the same distance
 * from Easter; anything else, or a day only one year has, is left out.
 */
export function inferRules(byYear: Record<number, readonly Holiday[]>): HolidayRule[] {
  const [previous, latest] = Object.keys(byYear).map(Number).sort().slice(-2);
  if (previous === undefined || latest === undefined) return [];
  const before = new Set(byYear[previous].map((h) => h.date));
  const rules = new Map<string, HolidayRule>();
  for (const { date, name } of byYear[latest]) {
    const rule = fixedRule(date, previous, before) ?? easterRule(date, latest, previous, before);
    if (!rule) continue;
    rules.set(JSON.stringify(rule), {
      ...rule,
      name: name === GENERIC ? 'Feriado municipal' : name,
    });
  }
  return [...rules.values()];
}

function fixedRule(date: DayNumber, previous: number, before: Set<DayNumber>) {
  const [, month, day] = toIsoDate(date).split('-').map(Number);
  return before.has(dayOf(previous, month, day)) ? { month, day } : null;
}

function easterRule(date: DayNumber, latest: number, previous: number, before: Set<DayNumber>) {
  const offset = date - easter(latest);
  return before.has(addDays(easter(previous), offset)) ? { easter: offset } : null;
}

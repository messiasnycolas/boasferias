import { CORPUS_CHRISTI, HolidayRule, Holiday, holidaysOf } from './holiday-rules';
import { NATIONAL } from './national-holidays';
import { Uf, stateHolidays } from './state-holidays';

export { easter } from './holiday-rules';
export type { Holiday, HolidayRule } from './holiday-rules';

/** City holidays in practice across the target capitals (see docs/business/clt-vacation.md). */
const GOOD_FRIDAY: HolidayRule = { easter: -2, name: 'Sexta-feira Santa' };

/**
 * Holidays for a year: national ones plus Good Friday, the state's when one is chosen, and the
 * city's when one is chosen. Corpus Christi, a city holiday in practice across the target
 * capitals, is assumed until a city is chosen; then only the city's list says. A day already
 * listed is not listed again.
 */
export function holidays(year: number, state?: Uf, city?: readonly HolidayRule[]): Holiday[] {
  const list = holidaysOf([...NATIONAL, GOOD_FRIDAY, ...(city ? [] : [CORPUS_CHRISTI])], year);
  const taken = new Set(list.map((h) => h.date));
  const local = [...(state ? stateHolidays(state, year) : []), ...holidaysOf(city ?? [], year)];
  for (const h of local)
    if (!taken.has(h.date)) {
      taken.add(h.date);
      list.push(h);
    }
  return list.sort((x, y) => x.date - y.date);
}

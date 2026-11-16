import { HolidayRule, Holiday, holidaysOf } from './holiday-rules';
import { NATIONAL } from './national-holidays';
import { Uf, stateHolidays } from './state-holidays';

export { easter } from './holiday-rules';
export type { Holiday } from './holiday-rules';

/** City holidays in practice across the target capitals (see docs/business/clt-vacation.md). */
const GOOD_FRIDAY: HolidayRule = { easter: -2, name: 'Sexta-feira Santa' };
const CORPUS_CHRISTI: HolidayRule = { easter: 60, name: 'Corpus Christi' };

/**
 * Holidays for a year: national ones plus Good Friday and Corpus Christi, which are city holidays
 * in practice across the target capitals, plus the state's when one is chosen. A state day that is
 * already a national holiday is listed once.
 */
export function holidays(year: number, state?: Uf): Holiday[] {
  const list = holidaysOf([...NATIONAL, GOOD_FRIDAY, CORPUS_CHRISTI], year);
  const taken = new Set(list.map((h) => h.date));
  if (state) list.push(...stateHolidays(state, year).filter((h) => !taken.has(h.date)));
  return list.sort((x, y) => x.date - y.date);
}

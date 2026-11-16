import { Holiday, HolidayRule, holidaysOf } from './holiday-rules';

export const NATIONAL: readonly HolidayRule[] = [
  { month: 1, day: 1, name: 'Confraternização Universal' },
  { month: 4, day: 21, name: 'Tiradentes' },
  { month: 5, day: 1, name: 'Dia do Trabalho' },
  { month: 9, day: 7, name: 'Independência do Brasil' },
  { month: 10, day: 12, name: 'Nossa Senhora Aparecida' },
  { month: 11, day: 2, name: 'Finados' },
  { month: 11, day: 15, name: 'Proclamação da República' },
  { month: 11, day: 20, name: 'Consciência Negra', since: 2024 },
  { month: 12, day: 25, name: 'Natal' },
];

/** National holidays: the days every Brazilian worker has off. */
export function nationalHolidays(year: number): Holiday[] {
  return holidaysOf(NATIONAL, year);
}

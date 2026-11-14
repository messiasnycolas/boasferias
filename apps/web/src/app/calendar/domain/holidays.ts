import { DayNumber, addDays, dayOf } from './calendar-date';

export interface Holiday {
  date: DayNumber;
  name: string;
}

const FIXED: readonly [month: number, day: number, name: string, since?: number][] = [
  [1, 1, 'Confraternização Universal'],
  [4, 21, 'Tiradentes'],
  [5, 1, 'Dia do Trabalho'],
  [9, 7, 'Independência do Brasil'],
  [10, 12, 'Nossa Senhora Aparecida'],
  [11, 2, 'Finados'],
  [11, 15, 'Proclamação da República'],
  [11, 20, 'Consciência Negra', 2024],
  [12, 25, 'Natal'],
];
const GOOD_FRIDAY_OFFSET = -2;
const CORPUS_CHRISTI_OFFSET = 60;

/** Easter Sunday, anonymous Gregorian algorithm. */
export function easter(year: number): DayNumber {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return dayOf(year, month, day);
}

/**
 * Default holidays: national ones plus Good Friday and Corpus Christi, which are city holidays
 * in practice across the target capitals (see docs/business/clt-vacation.md).
 */
export function holidays(year: number): Holiday[] {
  const easterSunday = easter(year);
  const list: Holiday[] = FIXED.filter(([, , , since]) => !since || year >= since).map(
    ([month, day, name]) => ({ date: dayOf(year, month, day), name }),
  );
  list.push(
    { date: addDays(easterSunday, GOOD_FRIDAY_OFFSET), name: 'Sexta-feira Santa' },
    { date: addDays(easterSunday, CORPUS_CHRISTI_OFFSET), name: 'Corpus Christi' },
  );
  return list.sort((x, y) => x.date - y.date);
}

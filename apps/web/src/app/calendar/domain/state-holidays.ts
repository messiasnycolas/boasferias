import { addDays, weekday } from './calendar-date';
import { Holiday, HolidayRule, holidaysOf } from './holiday-rules';
import { nationalHolidays } from './national-holidays';

export const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const; // prettier-ignore

export type Uf = (typeof STATES)[number];

/**
 * State holidays that a state law gives every worker. Left out: days only for public servants,
 * pontos facultativos, and days a law moves to a Sunday. Sources per day in
 * docs/business/holidays.md.
 */
const RULES: Record<Uf, readonly HolidayRule[]> = {
  AC: [
    { month: 1, day: 20, name: 'Dia do Católico', since: 2016 }, // Lei 3.137/2016
    { month: 1, day: 23, name: 'Dia do Evangélico' }, // Lei 1.538/2004
    { month: 3, day: 8, name: 'Dia Internacional da Mulher' }, // Lei 1.411/2001
    { month: 6, day: 15, name: 'Aniversário do Acre' }, // Lei 14/1964
    { month: 9, day: 5, name: 'Dia da Amazônia' }, // Lei 243/1968
    { month: 11, day: 17, name: 'Tratado de Petrópolis' }, // Lei 57/1965
  ],
  AL: [
    { month: 6, day: 24, name: 'São João' }, // Lei 5.508/1993
    { month: 6, day: 29, name: 'São Pedro' }, // Lei 5.509/1993
    { month: 9, day: 16, name: 'Emancipação Política de Alagoas' }, // Data magna
    { month: 11, day: 30, name: 'Dia do Evangélico' }, // State calendar
  ],
  AP: [
    { month: 3, day: 19, name: 'São José' }, // Lei 667/2002
    { month: 5, day: 15, name: 'Dia de Cabralzinho' }, // State calendar
    { month: 9, day: 13, name: 'Criação do Território do Amapá' }, // Constituição, art. 355
  ],
  AM: [{ month: 9, day: 5, name: 'Elevação do Amazonas a Província' }], // Lei 25/1977
  BA: [{ month: 7, day: 2, name: 'Independência da Bahia' }], // Constituição, art. 6º §3º
  CE: [{ month: 3, day: 25, name: 'Data Magna do Ceará' }], // Constituição, art. 18
  DF: [{ month: 11, day: 30, name: 'Dia do Evangélico' }], // Lei distrital 963/1995
  ES: [{ easter: 8, name: 'Nossa Senhora da Penha', since: 2019 }], // Lei 11.010/2019
  GO: [],
  MA: [{ month: 7, day: 28, name: 'Adesão do Maranhão à Independência' }], // Lei 2.457/1964
  MT: [],
  MS: [{ month: 10, day: 11, name: 'Criação do Estado' }], // Lei 10/1979
  MG: [],
  PA: [{ month: 8, day: 15, name: 'Adesão do Pará à Independência' }], // Lei 5.999/1996
  PB: [{ month: 8, day: 5, name: 'Fundação da Paraíba' }], // Lei 3.489/1967
  PR: [],
  PE: [{ month: 3, day: 6, name: 'Revolução Pernambucana' }], // Lei 13.835/2009
  PI: [{ month: 10, day: 19, name: 'Dia do Piauí' }], // Lei 176/1937
  RJ: [
    { easter: -47, name: 'Carnaval' }, // Lei 5.243/2008
    { month: 4, day: 23, name: 'São Jorge' }, // Lei 5.198/2008
  ],
  RN: [
    { month: 8, day: 7, name: 'Dia do Rio Grande do Norte' }, // Lei 7.831/2000
    { month: 10, day: 3, name: 'Mártires de Cunhaú e Uruaçu' }, // Lei 8.913/2006
  ],
  RS: [{ month: 9, day: 20, name: 'Revolução Farroupilha' }], // Constituição, art. 6º
  RO: [
    { month: 1, day: 4, name: 'Criação do Estado' }, // Lei 2.291/2010
    { month: 6, day: 18, name: 'Dia do Evangélico' }, // Lei 1.026/2001
  ],
  RR: [{ month: 10, day: 5, name: 'Criação do Estado' }], // Constituição, art. 9º
  SC: [], // 11 Aug and 25 Nov move to the following Sunday (Lei 12.906/2004, Lei 10.306/1996).
  SP: [{ month: 7, day: 9, name: 'Revolução Constitucionalista' }], // Lei 9.497/1997
  SE: [{ month: 7, day: 8, name: 'Emancipação Política de Sergipe' }], // Constituição, art. 269
  TO: [
    { month: 9, day: 8, name: 'Nossa Senhora da Natividade' }, // Lei 627/1993
    { month: 10, day: 5, name: 'Criação do Estado' }, // Lei 98/1989
  ],
};

const TUESDAY = 2;
const THURSDAY = 4;
const FRIDAY = 5;
const ACRE_FIXED = 'Aniversário do Acre';

/** The state's holidays in a year, in date order, on the day they are actually off. */
export function stateHolidays(uf: Uf, year: number): Holiday[] {
  const list = holidaysOf(RULES[uf], year);
  return uf === 'AC' ? moveToWeekEnd(list, year) : list;
}

/**
 * Acre (Lei 2.126/2009, as amended by Lei 2.247/2009): a state holiday on Tuesday to Thursday is
 * kept on that week's Friday, except the state anniversary; several in one week take consecutive
 * days ending on Friday, skipping days already off.
 */
function moveToWeekEnd(list: Holiday[], year: number): Holiday[] {
  const moving = (h: Holiday) =>
    h.name !== ACRE_FIXED && weekday(h.date) >= TUESDAY && weekday(h.date) <= THURSDAY;
  const taken = new Set([
    ...nationalHolidays(year).map((h) => h.date),
    ...list.filter((h) => !moving(h)).map((h) => h.date),
  ]);
  // Latest first: it takes the Friday, earlier ones the free days before it.
  const moved = list
    .filter(moving)
    .reverse()
    .map((h) => {
      let date = addDays(h.date, FRIDAY - weekday(h.date));
      while (taken.has(date) && date > h.date) date = addDays(date, -1);
      taken.add(date);
      return { ...h, date };
    });
  return [...list.filter((h) => !moving(h)), ...moved].sort((x, y) => x.date - y.date);
}

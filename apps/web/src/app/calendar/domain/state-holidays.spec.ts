import { toIsoDate } from './calendar-date';
import { STATES, stateHolidays } from './state-holidays';

const list = (uf: (typeof STATES)[number], year: number) =>
  stateHolidays(uf, year).map((h) => `${toIsoDate(h.date)} ${h.name}`);

describe('state holidays', () => {
  it('covers the 26 states and the Federal District', () => {
    expect(STATES.length).toBe(27);
  });

  it('gives each state its own days, from its laws', () => {
    expect(list('SP', 2027)).toEqual(['2027-07-09 Revolução Constitucionalista']);
    expect(list('BA', 2027)).toEqual(['2027-07-02 Independência da Bahia']);
    expect(list('RS', 2027)).toEqual(['2027-09-20 Revolução Farroupilha']);
    expect(list('DF', 2027)).toEqual(['2027-11-30 Dia do Evangélico']);
    expect(list('RN', 2027)).toEqual([
      '2027-08-07 Dia do Rio Grande do Norte',
      '2027-10-03 Mártires de Cunhaú e Uruaçu',
    ]);
  });

  it('has none where no state law gives everyone a day off', () => {
    for (const uf of ['GO', 'MG', 'MT', 'PR', 'SC'] as const) expect(list(uf, 2027)).toEqual([]);
  });

  it('follows Easter where the law does', () => {
    // RJ: Carnaval Tuesday (Lei 5.243/2008). ES: Monday 8 days after Easter (Lei 11.010/2019).
    expect(list('RJ', 2027)).toContain('2027-02-09 Carnaval');
    expect(list('ES', 2026)).toEqual(['2026-04-13 Nossa Senhora da Penha']);
    expect(list('ES', 2027)).toEqual(['2027-04-05 Nossa Senhora da Penha']);
  });

  it('starts a holiday in the year its law created it', () => {
    expect(list('ES', 2018)).toEqual([]);
    expect(list('AC', 2015).some((h) => h.includes('Dia do Católico'))).toBe(false);
  });

  it('moves Acre holidays from Tuesday-Thursday to the end of that week (Lei 2.126/2009)', () => {
    // 2026: Católico Tue 20 Jan goes to Thu 22 (Evangélico holds Fri 23); Tratado Tue 17 Nov goes
    // to Thu 19 (Fri 20 is national); the state anniversary never moves.
    expect(list('AC', 2026)).toEqual([
      '2026-01-22 Dia do Católico',
      '2026-01-23 Dia do Evangélico',
      '2026-03-08 Dia Internacional da Mulher',
      '2026-06-15 Aniversário do Acre',
      '2026-09-05 Dia da Amazônia',
      '2026-11-19 Tratado de Petrópolis',
    ]);
    // 2024: Amazônia Thu 5 Sep goes to Fri 6.
    expect(list('AC', 2024)).toContain('2024-09-06 Dia da Amazônia');
    // 2027: anniversary on a Tuesday stays.
    expect(list('AC', 2027)).toContain('2027-06-15 Aniversário do Acre');
  });
});

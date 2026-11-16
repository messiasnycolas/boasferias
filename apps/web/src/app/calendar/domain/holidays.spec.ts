import { toIsoDate } from './calendar-date';
import { easter, holidays } from './holidays';

const iso = (year: number) => holidays(year).map((h) => `${toIsoDate(h.date)} ${h.name}`);

describe('holidays', () => {
  it('computes Easter Sunday', () => {
    const expected: Record<number, string> = {
      2024: '2024-03-31',
      2025: '2025-04-20',
      2026: '2026-04-05',
      2027: '2027-03-28',
      2028: '2028-04-16',
      2029: '2029-04-01',
      2030: '2030-04-21',
    };
    for (const [year, date] of Object.entries(expected)) {
      expect(toIsoDate(easter(Number(year)))).toBe(date);
    }
  });

  it('lists the 2027 default holidays in date order', () => {
    expect(iso(2027)).toEqual([
      '2027-01-01 Confraternização Universal',
      '2027-03-26 Sexta-feira Santa',
      '2027-04-21 Tiradentes',
      '2027-05-01 Dia do Trabalho',
      '2027-05-27 Corpus Christi',
      '2027-09-07 Independência do Brasil',
      '2027-10-12 Nossa Senhora Aparecida',
      '2027-11-02 Finados',
      '2027-11-15 Proclamação da República',
      '2027-11-20 Consciência Negra',
      '2027-12-25 Natal',
    ]);
  });

  it('includes Consciência Negra only from 2024 (Lei 14.759/2023)', () => {
    expect(iso(2023).some((h) => h.includes('Consciência Negra'))).toBe(false);
    expect(iso(2024).some((h) => h.includes('Consciência Negra'))).toBe(true);
  });

  it("adds the chosen state's holidays to the defaults", () => {
    const sp = holidays(2027, 'SP').map((h) => `${toIsoDate(h.date)} ${h.name}`);
    expect(sp).toContain('2027-07-09 Revolução Constitucionalista');
    expect(sp).toContain('2027-05-27 Corpus Christi');
    expect(sp.length).toBe(iso(2027).length + 1);
  });

  it('lists a day once when a state holiday falls on a national one', () => {
    // 2025: Easter on 20 Apr puts Nossa Senhora da Penha (ES) on Monday 21 Apr, Tiradentes.
    const es = holidays(2025, 'ES').filter((h) => toIsoDate(h.date) === '2025-04-21');
    expect(es.map((h) => h.name)).toEqual(['Tiradentes']);
  });

  it('with a city: its holidays, Good Friday, and Corpus Christi only if the city has it', () => {
    const anniversary = { month: 1, day: 25, name: 'Aniversário da Cidade' };
    const list = (city: Parameters<typeof holidays>[2]) =>
      holidays(2027, 'SP', city).map((h) => `${toIsoDate(h.date)} ${h.name}`);
    const without = list([anniversary]);
    expect(without).toContain('2027-01-25 Aniversário da Cidade');
    expect(without).toContain('2027-03-26 Sexta-feira Santa');
    expect(without).toContain('2027-07-09 Revolução Constitucionalista');
    expect(without.some((h) => h.includes('Corpus Christi'))).toBe(false);
    expect(list([anniversary, { easter: 60, name: 'Corpus Christi' }])).toContain(
      '2027-05-27 Corpus Christi',
    );
  });
});

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
});

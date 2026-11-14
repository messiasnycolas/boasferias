import { maskBrDate, parseBrDate, planLetter, tieNote, toBrDate } from './format';

describe('Brazilian dates', () => {
  it('shows ISO dates as dd/mm/aaaa', () => {
    expect(toBrDate('2026-11-17')).toBe('17/11/2026');
    expect(toBrDate('')).toBe('');
  });

  it('masks typing into dd/mm/aaaa', () => {
    expect(maskBrDate('1')).toBe('1');
    expect(maskBrDate('1711')).toBe('17/11');
    expect(maskBrDate('17112026999')).toBe('17/11/2026');
    expect(maskBrDate('17/1a1-2026')).toBe('17/11/2026');
  });

  it('parses only complete, real days', () => {
    expect(parseBrDate('17/11/2026')).toBe('2026-11-17');
    expect(parseBrDate('29/02/2028')).toBe('2028-02-29');
    expect(parseBrDate('29/02/2027')).toBeNull();
    expect(parseBrDate('31/04/2027')).toBeNull();
    expect(parseBrDate('17/11/26')).toBeNull();
  });
});

describe('plan names', () => {
  it('names plans by letter', () => {
    expect([0, 1, 19].map(planLetter)).toEqual(['A', 'B', 'T']);
  });

  it('lists tied plans, joining runs of three or more', () => {
    expect(tieNote([5])).toBe('Empatado com o plano F');
    expect(tieNote([1, 2])).toBe('Empatado com os planos B e C');
    expect(tieNote([0, 2, 3, 4, 5, 6, 7, 9])).toBe('Empatado com os planos A, C a H e J');
  });
});

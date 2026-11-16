import { dayOf } from './calendar-date';
import { inferRules } from './infer-rules';

const on = (year: number, month: number, day: number, name: string) => ({
  date: dayOf(year, month, day),
  name,
});

describe('inferRules', () => {
  it('keeps a day that falls on the same date both years as a fixed rule', () => {
    const rules = inferRules({
      2025: [on(2025, 3, 19, 'São José')],
      2026: [on(2026, 3, 19, 'São José')],
    });
    expect(rules).toEqual([{ month: 3, day: 19, name: 'São José' }]);
  });

  it('keeps a day at the same distance from Easter as an Easter rule', () => {
    // Corpus Christi: Easter + 60 (2025-06-19, 2026-06-04).
    const rules = inferRules({
      2025: [on(2025, 6, 19, 'Corpus Christi')],
      2026: [on(2026, 6, 4, 'Corpus Christi')],
    });
    expect(rules).toEqual([{ easter: 60, name: 'Corpus Christi' }]);
  });

  it('drops a day whose date follows no rule, or that only one year has', () => {
    const rules = inferRules({
      2025: [on(2025, 8, 10, 'Aniversário'), on(2025, 5, 1, 'Só antes')],
      2026: [on(2026, 8, 14, 'Aniversário'), on(2026, 10, 2, 'Novo')],
    });
    expect(rules).toEqual([]);
  });

  it('names it as the latest year does, without a shouting generic name', () => {
    const rules = inferRules({
      2025: [on(2025, 1, 23, 'Feriado Municipal')],
      2026: [on(2026, 1, 23, 'Feriado Municipal')],
    });
    expect(rules).toEqual([{ month: 1, day: 23, name: 'Feriado municipal' }]);
  });

  it('lists a date once', () => {
    const rules = inferRules({
      2025: [on(2025, 7, 16, 'Padroeira'), on(2025, 7, 16, 'Padroeira')],
      2026: [on(2026, 7, 16, 'Padroeira'), on(2026, 7, 16, 'Padroeira')],
    });
    expect(rules).toHaveLength(1);
  });

  it('needs two years to tell a rule', () => {
    expect(inferRules({ 2026: [on(2026, 3, 19, 'São José')] })).toEqual([]);
  });
});

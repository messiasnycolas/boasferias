import { homeTitle } from './faq';

describe('home title', () => {
  it('names this year and the next', () => {
    expect(homeTitle('2026-11-25')).toBe(
      'Boas Férias | Melhores datas para tirar férias em 2026 e 2027 (CLT e PJ)',
    );
    expect(homeTitle('2027-01-01')).toContain('em 2027 e 2028');
  });
});

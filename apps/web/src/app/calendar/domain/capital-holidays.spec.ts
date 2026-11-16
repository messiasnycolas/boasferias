import { readFileSync } from 'node:fs';
import { toIsoDate } from './calendar-date';
import { CAPITALS } from './capital-holidays';
import { holidays } from './holidays';
import { holidaysOf } from './holiday-rules';
import { STATES, Uf } from './state-holidays';

const own = (uf: Uf, year: number) =>
  holidaysOf(CAPITALS[uf].rules, year).map((h) => `${toIsoDate(h.date)} ${h.name}`);
const all = (uf: Uf, year: number) =>
  holidays(year, uf, CAPITALS[uf].rules).map((h) => `${toIsoDate(h.date)} ${h.name}`);

describe('capital holidays', () => {
  it('matches what the page serves (rerun npm run holidays:cities after a change)', () => {
    for (const uf of STATES) {
      const file = JSON.parse(readFileSync(`public/holidays/${uf.toLowerCase()}.json`, 'utf8'));
      const served = file.cities.find((c: { id: number }) => c.id === CAPITALS[uf].id);
      expect(served, uf).toEqual({
        ...CAPITALS[uf],
        rules: [...CAPITALS[uf].rules],
        verified: true,
      });
    }
  });

  it('has the 27 capitals, one per state', () => {
    expect(Object.keys(CAPITALS).sort()).toEqual([...STATES].sort());
    expect(new Set(STATES.map((uf) => CAPITALS[uf].id)).size).toBe(27);
  });

  it('gives each capital its own days, from city law', () => {
    const expected: Record<Uf, string[]> = {
      AC: ['2027-12-28 Aniversário de Rio Branco'],
      AL: [
        '2027-05-27 Corpus Christi',
        '2027-08-27 Nossa Senhora dos Prazeres',
        '2027-12-08 Nossa Senhora da Conceição',
      ],
      AP: ['2027-02-04 Aniversário de Macapá', '2027-05-27 Corpus Christi'],
      AM: [
        '2027-02-09 Carnaval',
        '2027-05-27 Corpus Christi',
        '2027-10-24 Aniversário de Manaus',
        '2027-12-08 Nossa Senhora da Conceição',
      ],
      BA: [
        '2027-05-27 Corpus Christi',
        '2027-06-24 São João',
        '2027-12-08 Nossa Senhora da Conceição da Praia',
      ],
      CE: [
        '2027-03-19 São José',
        '2027-05-27 Corpus Christi',
        '2027-08-15 Nossa Senhora da Assunção',
      ],
      DF: [],
      ES: ['2027-05-27 Corpus Christi', '2027-09-08 Nossa Senhora da Vitória'],
      GO: [
        '2027-05-24 Nossa Senhora Auxiliadora',
        '2027-05-27 Corpus Christi',
        '2027-10-24 Aniversário de Goiânia',
      ],
      MA: [
        '2027-06-29 São Pedro',
        '2027-09-08 Aniversário de São Luís',
        '2027-12-08 Nossa Senhora da Conceição',
      ],
      MT: [
        '2027-04-08 Aniversário de Cuiabá',
        '2027-05-27 Corpus Christi',
        '2027-12-08 Nossa Senhora da Conceição',
      ],
      MS: ['2027-06-13 Santo Antônio', '2027-08-26 Aniversário de Campo Grande'],
      MG: [
        '2027-05-27 Corpus Christi',
        '2027-08-15 Assunção de Nossa Senhora',
        '2027-12-08 Imaculada Conceição',
      ],
      PA: ['2027-05-27 Corpus Christi', '2027-12-08 Nossa Senhora da Conceição'],
      PB: ['2027-06-24 São João', '2027-12-08 Nossa Senhora da Conceição'],
      PR: ['2027-05-27 Corpus Christi', '2027-09-08 Nossa Senhora da Luz dos Pinhais'],
      PE: [
        '2027-06-24 São João',
        '2027-07-16 Nossa Senhora do Carmo',
        '2027-12-08 Nossa Senhora da Conceição',
      ],
      PI: [
        '2027-05-27 Corpus Christi',
        '2027-08-16 Aniversário de Teresina',
        '2027-12-08 Nossa Senhora da Conceição',
      ],
      RJ: ['2027-01-20 São Sebastião'],
      RN: [
        '2027-01-06 Santos Reis',
        '2027-05-27 Corpus Christi',
        '2027-11-21 Nossa Senhora da Apresentação',
      ],
      RS: ['2027-02-02 Nossa Senhora dos Navegantes', '2027-05-27 Corpus Christi'],
      RO: [
        '2027-01-24 Instalação do Município',
        '2027-05-24 Nossa Senhora Auxiliadora',
        '2027-10-02 Criação do Município',
      ],
      RR: [
        '2027-01-20 São Sebastião',
        '2027-05-27 Corpus Christi',
        '2027-06-29 São Pedro',
        '2027-07-09 Aniversário de Boa Vista',
        '2027-12-08 Nossa Senhora da Conceição',
      ],
      SC: ['2027-03-23 Aniversário de Florianópolis', '2027-05-27 Corpus Christi'],
      SP: ['2027-01-25 Aniversário de São Paulo', '2027-05-27 Corpus Christi'],
      SE: ['2027-03-17 Aniversário de Aracaju', '2027-05-27 Corpus Christi', '2027-06-24 São João'],
      TO: ['2027-03-19 São José', '2027-05-20 Aniversário de Palmas'],
    };
    for (const uf of STATES) expect(own(uf, 2027), uf).toEqual(expected[uf]);
  });

  it('keeps Corpus Christi off where the capital does not declare it', () => {
    for (const uf of ['AC', 'DF', 'MA', 'MS', 'PB', 'PE', 'RO', 'TO'] as const)
      expect(
        all(uf, 2027).some((h) => h.endsWith('Corpus Christi')),
        uf,
      ).toBe(false);
  });

  it('takes Corpus Christi in Rio de Janeiro from the state law from 2026', () => {
    expect(all('RJ', 2027)).toContain('2027-05-27 Corpus Christi');
    expect(all('RJ', 2025).some((h) => h.endsWith('Corpus Christi'))).toBe(false);
  });

  it('adds Good Friday and the state days on top of the city', () => {
    expect(all('SP', 2027)).toEqual(
      expect.arrayContaining([
        '2027-03-26 Sexta-feira Santa',
        '2027-07-09 Revolução Constitucionalista',
        '2027-01-25 Aniversário de São Paulo',
      ]),
    );
  });
});

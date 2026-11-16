import { CORPUS_CHRISTI, HolidayRule } from './holiday-rules';
import { Uf } from './state-holidays';

export interface Capital {
  /** IBGE city code, as in the city dataset. */
  id: number;
  name: string;
  rules: readonly HolidayRule[];
}

const CONCEICAO: HolidayRule = { month: 12, day: 8, name: 'Nossa Senhora da Conceição' };
const SAO_JOAO: HolidayRule = { month: 6, day: 24, name: 'São João' };

/**
 * Each capital's own holidays, checked against city law, decree or court calendar; they replace
 * the dataset's entry. Left out: Good Friday and days already national or state. Sources per city
 * in docs/business/holidays.md.
 */
export const CAPITALS: Record<Uf, Capital> = {
  AC: {
    id: 1200401,
    name: 'Rio Branco',
    rules: [{ month: 12, day: 28, name: 'Aniversário de Rio Branco' }], // Lei 330
  },
  AL: {
    id: 2704302,
    name: 'Maceió',
    rules: [CORPUS_CHRISTI, { month: 8, day: 27, name: 'Nossa Senhora dos Prazeres' }, CONCEICAO], // Lei 1.391/1967
  },
  AP: {
    id: 1600303,
    name: 'Macapá',
    rules: [{ month: 2, day: 4, name: 'Aniversário de Macapá' }, CORPUS_CHRISTI],
  },
  AM: {
    id: 1302603,
    name: 'Manaus',
    rules: [
      { easter: -47, name: 'Carnaval' }, // Lei 448/1998
      CORPUS_CHRISTI, // Lei 970/2006
      { month: 10, day: 24, name: 'Aniversário de Manaus' }, // Lei Orgânica, art. 437
      CONCEICAO, // Lei 496/1999
    ],
  },
  BA: {
    id: 2927408,
    name: 'Salvador',
    rules: [
      CORPUS_CHRISTI,
      SAO_JOAO,
      { month: 12, day: 8, name: 'Nossa Senhora da Conceição da Praia' },
    ], // Lei 1.997/1967
  },
  CE: {
    id: 2304400,
    name: 'Fortaleza',
    rules: [
      { month: 3, day: 19, name: 'São José' },
      CORPUS_CHRISTI,
      { month: 8, day: 15, name: 'Nossa Senhora da Assunção' },
    ], // Lei 8.796/2003
  },
  DF: { id: 5300108, name: 'Brasília', rules: [] }, // The Federal District has no city tier.
  ES: {
    id: 3205309,
    name: 'Vitória',
    rules: [CORPUS_CHRISTI, { month: 9, day: 8, name: 'Nossa Senhora da Vitória' }], // Lei 1.732/1967
  },
  GO: {
    id: 5208707,
    name: 'Goiânia',
    rules: [
      { month: 5, day: 24, name: 'Nossa Senhora Auxiliadora' },
      CORPUS_CHRISTI, // Lei 100/1951
      { month: 10, day: 24, name: 'Aniversário de Goiânia' },
    ],
  },
  MA: {
    id: 2111300,
    name: 'São Luís',
    rules: [
      { month: 6, day: 29, name: 'São Pedro' },
      { month: 9, day: 8, name: 'Aniversário de São Luís' },
      CONCEICAO,
    ],
  },
  MT: {
    id: 5103403,
    name: 'Cuiabá',
    rules: [{ month: 4, day: 8, name: 'Aniversário de Cuiabá' }, CORPUS_CHRISTI, CONCEICAO], // Decreto 11.585/2025
  },
  MS: {
    id: 5002704,
    name: 'Campo Grande',
    rules: [
      { month: 6, day: 13, name: 'Santo Antônio' }, // Lei 3.901/2001
      { month: 8, day: 26, name: 'Aniversário de Campo Grande' },
    ],
  },
  MG: {
    id: 3106200,
    name: 'Belo Horizonte',
    rules: [
      CORPUS_CHRISTI,
      { month: 8, day: 15, name: 'Assunção de Nossa Senhora' },
      { month: 12, day: 8, name: 'Imaculada Conceição' },
    ], // Lei 11.397/2022, Anexo V
  },
  PA: { id: 1501402, name: 'Belém', rules: [CORPUS_CHRISTI, CONCEICAO] }, // Lei 6.306/1967
  PB: { id: 2507507, name: 'João Pessoa', rules: [SAO_JOAO, CONCEICAO] }, // Lei 13.768/2019
  PR: {
    id: 4106902,
    name: 'Curitiba',
    rules: [CORPUS_CHRISTI, { month: 9, day: 8, name: 'Nossa Senhora da Luz dos Pinhais' }], // Lei 3.015/1967
  },
  PE: {
    id: 2611606,
    name: 'Recife',
    rules: [SAO_JOAO, { month: 7, day: 16, name: 'Nossa Senhora do Carmo' }, CONCEICAO], // Lei 9.777/1967
  },
  PI: {
    id: 2211001,
    name: 'Teresina',
    rules: [CORPUS_CHRISTI, { month: 8, day: 16, name: 'Aniversário de Teresina' }, CONCEICAO], // Lei 2.275/1994
  },
  RJ: {
    id: 3304557,
    name: 'Rio de Janeiro',
    rules: [{ month: 1, day: 20, name: 'São Sebastião' }], // Lei 1.271/1988
  },
  RN: {
    id: 2408102,
    name: 'Natal',
    rules: [
      { month: 1, day: 6, name: 'Santos Reis' },
      CORPUS_CHRISTI,
      { month: 11, day: 21, name: 'Nossa Senhora da Apresentação' },
    ],
  },
  RS: {
    id: 4314902,
    name: 'Porto Alegre',
    rules: [{ month: 2, day: 2, name: 'Nossa Senhora dos Navegantes' }, CORPUS_CHRISTI], // Lei 3.033/1967
  },
  RO: {
    id: 1100205,
    name: 'Porto Velho',
    rules: [
      { month: 1, day: 24, name: 'Instalação do Município' },
      { month: 5, day: 24, name: 'Nossa Senhora Auxiliadora' },
      { month: 10, day: 2, name: 'Criação do Município' },
    ], // Lei 190/1980
  },
  RR: {
    id: 1400100,
    name: 'Boa Vista',
    rules: [
      { month: 1, day: 20, name: 'São Sebastião' },
      CORPUS_CHRISTI,
      { month: 6, day: 29, name: 'São Pedro' },
      { month: 7, day: 9, name: 'Aniversário de Boa Vista' },
      CONCEICAO,
    ], // Decreto 123/E/2025
  },
  SC: {
    id: 4205407,
    name: 'Florianópolis',
    rules: [{ month: 3, day: 23, name: 'Aniversário de Florianópolis' }, CORPUS_CHRISTI], // Lei 832/1967
  },
  SP: {
    id: 3550308,
    name: 'São Paulo',
    rules: [{ month: 1, day: 25, name: 'Aniversário de São Paulo' }, CORPUS_CHRISTI], // Lei 14.485/2007, art. 10
  },
  SE: {
    id: 2800308,
    name: 'Aracaju',
    rules: [{ month: 3, day: 17, name: 'Aniversário de Aracaju' }, CORPUS_CHRISTI, SAO_JOAO], // Lei 3.805/2009
  },
  TO: {
    id: 1721000,
    name: 'Palmas',
    rules: [
      { month: 3, day: 19, name: 'São José' },
      { month: 5, day: 20, name: 'Aniversário de Palmas' },
    ], // Lei 577/1996
  },
};

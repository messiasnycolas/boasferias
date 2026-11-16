/**
 * Writes public/holidays/<uf>.json: each state's cities and their holidays as yearly rules, from
 * the open dataset joaopbini/feriados-brasil (MIT), pinned below. Run: npm run holidays:cities
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dayOf } from '../src/app/calendar/domain/calendar-date';
import { Holiday } from '../src/app/calendar/domain/holiday-rules';
import { inferRules } from '../src/app/calendar/domain/infer-rules';
import { STATES } from '../src/app/calendar/domain/state-holidays';

const COMMIT = 'f89f5bd7eac7397b477beb0dd5ce26d5d2449919';
const BASE = `https://raw.githubusercontent.com/joaopbini/feriados-brasil/${COMMIT}/dados`;
const YEARS = [2025, 2026];
const OUT = 'public/holidays';

interface City {
  codigo_ibge: number;
  nome: string;
  codigo_uf: number;
}
interface State {
  codigo_uf: number;
  uf: string;
}
interface Row {
  data: string; // dd/mm/aaaa
  nome: string;
  codigo_ibge: number;
}

const get = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${BASE}/${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return (await response.json()) as T;
};

const toHoliday = ({ data, nome }: Row): Holiday => {
  const [day, month, year] = data.split('/').map(Number);
  return { date: dayOf(year, month, day), name: nome };
};

const cities = await get<City[]>('localizacao/municipios/municipios.json');
const states = await get<State[]>('localizacao/estados/estados.json');
const ufOf = new Map(states.map((s) => [s.codigo_uf, s.uf]));

// City code -> year -> holidays.
const byCity = new Map<number, Record<number, Holiday[]>>();
for (const year of YEARS)
  for (const row of await get<Row[]>(`feriados/municipal/json/${year}.json`)) {
    const years = byCity.get(row.codigo_ibge) ?? {};
    (years[year] ??= []).push(toHoliday(row));
    byCity.set(row.codigo_ibge, years);
  }

mkdirSync(OUT, { recursive: true });
for (const uf of STATES) {
  const list = cities
    .filter((c) => ufOf.get(c.codigo_uf) === uf)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((c) => ({
      id: c.codigo_ibge,
      name: c.nome,
      rules: inferRules(byCity.get(c.codigo_ibge) ?? {}),
    }));
  const file = { source: `joaopbini/feriados-brasil@${COMMIT.slice(0, 7)} (MIT)`, cities: list };
  writeFileSync(`${OUT}/${uf.toLowerCase()}.json`, JSON.stringify(file));
}
console.log(`${cities.length} cities, ${byCity.size} with holidays, written to ${OUT}`);

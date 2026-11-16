import { HolidayRule } from '../../calendar/domain/holidays';
import { Uf } from '../../calendar/domain/state-holidays';

/** A city and its holidays, from public/holidays/<uf>.json. */
export interface City {
  id: number;
  name: string;
  rules: HolidayRule[];
  /** Checked against city law; otherwise from the community dataset. */
  verified?: boolean;
}

const files = new Map<Uf, Promise<City[]>>();

/** The state's cities, fetched once per state. */
export function loadCities(uf: Uf): Promise<City[]> {
  let file = files.get(uf);
  if (!file) {
    file = fetch(`/holidays/${uf.toLowerCase()}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ cities: City[] }>;
      })
      .then((data) => data.cities);
    file.catch(() => files.delete(uf));
    files.set(uf, file);
  }
  return file;
}

/** Lowercase, no accents: "São Paulo" matches "sao paulo". */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/** Cities whose name starts with the query first, then those containing it. */
export function searchCities(cities: readonly City[], query: string, max: number): City[] {
  const q = fold(query);
  if (!q) return [];
  const starts: City[] = [];
  const contains: City[] = [];
  for (const city of cities) {
    const name = fold(city.name);
    if (name.startsWith(q)) starts.push(city);
    else if (name.includes(q)) contains.push(city);
  }
  return [...starts, ...contains].slice(0, max);
}

const KEY = 'boas-ferias:cidade';

export function savedCity(): number | null {
  try {
    const value = Number(localStorage.getItem(KEY));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function saveCity(id: number | null): void {
  try {
    if (id) localStorage.setItem(KEY, String(id));
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode or blocked storage: the choice lasts until the page closes.
  }
}

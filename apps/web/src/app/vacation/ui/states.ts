import { Uf } from '../../calendar/domain/state-holidays';

const NAMES: Record<Uf, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

/** The states for the form, by name. */
export const STATE_OPTIONS = (Object.entries(NAMES) as [Uf, string][])
  .map(([uf, name]) => ({ uf, name }))
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

const KEY = 'boas-ferias:estado';

/** The state chosen on this device, if storage works and holds a known one. */
export function savedState(): Uf | null {
  try {
    const value = localStorage.getItem(KEY);
    return value && value in NAMES ? (value as Uf) : null;
  } catch {
    return null;
  }
}

export function saveState(uf: Uf | null): void {
  try {
    if (uf) localStorage.setItem(KEY, uf);
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode or blocked storage: the choice lasts until the page closes.
  }
}

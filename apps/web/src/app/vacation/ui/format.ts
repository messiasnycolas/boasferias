import { SuggestError } from '../application/suggest-plans';

const TIME_ZONE = 'America/Sao_Paulo';
const MONTH = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });
const MONTH_LONG = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' });
const FULL = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' });

/** Today as YYYY-MM-DD in Brazil, whatever the device clock's zone. */
export function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date());
}

const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const month = (iso: string) => MONTH.format(asDate(iso)).replace('.', '');

/** "1–5 fev", "29 mar–17 abr", "30 dez 2027–3 jan 2028". */
export function formatRange(start: string, end: string): string {
  const [sy, , sd] = start.split('-').map(Number);
  const [ey, , ed] = end.split('-').map(Number);
  if (sy !== ey) return `${sd} ${month(start)} ${sy}–${ed} ${month(end)} ${ey}`;
  if (start.slice(0, 7) === end.slice(0, 7)) return `${sd}–${ed} ${month(end)}`;
  return `${sd} ${month(start)}–${ed} ${month(end)}`;
}

/** "8 fev". */
export function formatDay(iso: string): string {
  return `${Number(iso.slice(8))} ${month(iso)}`;
}

export function formatDate(iso: string): string {
  return FULL.format(asDate(iso));
}

export function monthName(year: number, monthNumber: number): string {
  const name = MONTH_LONG.format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  return `${name[0].toUpperCase()}${name.slice(1)} ${year}`;
}

/** "2026-11-17" -> "17/11/2026"; "" stays "". */
export function toBrDate(iso: string): string {
  return iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '';
}

/** Keeps digits and inserts the slashes while typing: "1711" -> "17/11". */
export function maskBrDate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}

/** "17/11/2026" -> "2026-11-17"; null when incomplete or not a real day (31/02). */
export function parseBrDate(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(Date.UTC(+y, +m - 1, +d));
  const real = date.getUTCDate() === +d && date.getUTCMonth() === +m - 1;
  return real ? `${y}-${m}-${d}` : null;
}

/** "A", "B" … "T": plans are named by letter so the page shows fewer numbers. */
export function planLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/** "Empatado com o plano F", "Empatado com os planos B e C", "… os planos A, C a H e J". */
export function tieNote(indexes: readonly number[]): string {
  const runs: string[] = [];
  for (let i = 0; i < indexes.length;) {
    let j = i;
    while (j + 1 < indexes.length && indexes[j + 1] === indexes[j] + 1) j++;
    const [first, last] = [planLetter(indexes[i]), planLetter(indexes[j])];
    if (j - i >= 2) runs.push(`${first} a ${last}`);
    else runs.push(...indexes.slice(i, j + 1).map(planLetter));
    i = j + 1;
  }
  const list = runs.length > 1 ? `${runs.slice(0, -1).join(', ')} e ${runs.at(-1)}` : runs[0];
  return indexes.length === 1 ? `Empatado com o plano ${list}` : `Empatado com os planos ${list}`;
}

export const ERROR_MESSAGES: Record<SuggestError, string> = {
  'invalid-date': 'Alguma data está incompleta. Confira as datas em "Mais filtros".',
  'deadline-before-start': 'O prazo final vem antes do início. Ajuste as datas.',
  'window-too-long': 'Escolha um intervalo de até 13 meses entre o início e o prazo.',
  'invalid-days':
    'Na CLT, use de 5 a 30 dias (pelo menos 5 depois de vender 1/3). No PJ, de 1 a 30.',
  'invalid-periods': 'Na CLT, divida em até 3 períodos. No PJ, em até 10.',
  'invalid-work-week': 'Marque pelo menos um dia de trabalho na semana.',
  'invalid-limit': 'Não foi possível calcular. Recarregue a página.',
};

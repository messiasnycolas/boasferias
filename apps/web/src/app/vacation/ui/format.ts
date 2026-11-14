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

export const ERROR_MESSAGES: Record<SuggestError, string> = {
  'invalid-date': 'Alguma data está incompleta. Confira as datas em "Mais opções".',
  'deadline-before-start': 'O prazo final vem antes do início. Ajuste as datas.',
  'window-too-long': 'Escolha um intervalo de até 13 meses entre o início e o prazo.',
  'invalid-days':
    'Na CLT, use de 5 a 30 dias (pelo menos 5 depois de vender 1/3). No PJ, de 1 a 30.',
  'invalid-periods': 'Na CLT, divida em até 3 períodos. No PJ, em até 10.',
  'invalid-work-week': 'Marque pelo menos um dia de trabalho na semana.',
  'invalid-limit': 'Não foi possível calcular. Recarregue a página.',
};

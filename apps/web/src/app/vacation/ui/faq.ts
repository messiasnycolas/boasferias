import { Faq } from '../../site/ui/page-meta';

/** A home question can point to the guide that explains it in full. */
export interface HomeFaq extends Faq {
  guide?: string;
}

/** Shown on the page and sent to search engines as FAQPage data: one list, so they never drift. */
export const FAQS: readonly HomeFaq[] = [
  {
    question: 'Como aproveitar melhor as férias?',
    answer:
      'Encoste o começo e o fim das férias em fins de semana e feriados. Na CLT, datas bem escolhidas rendem vários dias a mais de descanso com os mesmos 30 dias. A calculadora de férias do Boas Férias, um planejador de férias gratuito, testa todas as datas e mostra os planos que rendem mais.',
  },
  {
    question: 'Quantos dias de férias tenho na CLT?',
    answer:
      '30 dias corridos a cada 12 meses de trabalho, se você faltou até 5 vezes sem justificativa. Com mais faltas, o total diminui (art. 130).',
    guide: '/guias/ferias-clt',
  },
  {
    question: 'Posso dividir as férias?',
    answer:
      'Sim, em até 3 períodos, se você concordar. Um precisa ter pelo menos 14 dias corridos e os outros pelo menos 5 (art. 134, §1º).',
    guide: '/guias/dividir-ferias',
  },
  {
    question: 'As férias podem começar em qualquer dia?',
    answer:
      'Não podem começar nos 2 dias antes de um feriado ou do descanso semanal (art. 134, §3º). O Boas Férias já evita essas datas.',
    guide: '/guias/dividir-ferias',
  },
  {
    question: 'Posso vender parte das férias?',
    answer:
      'Até 1/3, ou seja, 10 de 30 dias (abono pecuniário, art. 143). O pedido é feito até 15 dias antes de completar o período aquisitivo. Os 20 dias restantes seguem as mesmas regras de divisão.',
    guide: '/guias/vender-ferias',
  },
  {
    question: 'Quem escolhe a data?',
    answer:
      'A empresa (art. 136). Ela avisa com 30 dias de antecedência (art. 135) e precisa conceder as férias nos 12 meses seguintes (art. 134). Se atrasar, paga em dobro (art. 137). Use os planos para negociar.',
    guide: '/guias/prazo-ferias',
  },
  {
    question: 'Feriado no meio das férias conta?',
    answer:
      'Na CLT, sim, porque a contagem é em dias corridos. O ganho está nos feriados e fins de semana colados no começo e no fim, e é isso que o Boas Férias procura.',
  },
  {
    question: 'E se eu for PJ?',
    answer:
      'Depende do contrato com a empresa. A CLT não vale para PJ: algumas empresas pagam dias de descanso, outras não, e cada uma tem as suas regras. Escolha "PJ" e informe quantos dias úteis você pode parar e em quantas partes. O Boas Férias segue essas regras e encaixa os dias entre fins de semana e feriados.',
  },
];

export const FAQ_UPDATED = '25/11/2026';

export const HOME_DESCRIPTION =
  'Tenha mais dias de descanso do que você esperava. Com feriados nacionais, estaduais e municipais. Seja CLT ou PJ.';

/** This year and the next: the ones people plan for. Prerendered on each deploy. */
export function homeTitle(todayIso: string): string {
  const year = Number(todayIso.slice(0, 4));
  return `Boas Férias | Melhores datas para tirar férias em ${year} e ${year + 1} (CLT e PJ)`;
}

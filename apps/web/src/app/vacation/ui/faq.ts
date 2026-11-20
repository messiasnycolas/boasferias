export interface Faq {
  question: string;
  answer: string;
}

/** Shown on the page and sent to search engines as FAQPage data: one list, so they never drift. */
export const FAQS: readonly Faq[] = [
  {
    question: 'Quantos dias de férias tenho na CLT?',
    answer:
      '30 dias corridos a cada 12 meses de trabalho, se você faltou até 5 vezes sem justificativa. Com mais faltas, o total diminui (art. 130).',
  },
  {
    question: 'Posso dividir as férias?',
    answer:
      'Sim, em até 3 períodos, se você concordar. Um precisa ter pelo menos 14 dias corridos e os outros pelo menos 5 (art. 134, §1º).',
  },
  {
    question: 'As férias podem começar em qualquer dia?',
    answer:
      'Não podem começar nos 2 dias antes de um feriado ou do descanso semanal (art. 134, §3º). O Boas Férias já evita essas datas.',
  },
  {
    question: 'Posso vender parte das férias?',
    answer:
      'Até 1/3, ou seja, 10 de 30 dias (abono pecuniário, art. 143). O pedido é feito até 15 dias antes de completar o período aquisitivo. Os 20 dias restantes seguem as mesmas regras de divisão.',
  },
  {
    question: 'Quem escolhe a data?',
    answer:
      'A empresa (art. 136). Ela avisa com 30 dias de antecedência (art. 135) e precisa conceder as férias nos 12 meses seguintes (art. 134). Se atrasar, paga em dobro (art. 137). Use os planos para negociar.',
  },
  {
    question: 'Feriado no meio das férias conta?',
    answer:
      'Na CLT, sim, porque a contagem é em dias corridos. O ganho está nos feriados e fins de semana colados no começo e no fim, e é isso que o Boas Férias procura.',
  },
  {
    question: 'E se eu for PJ?',
    answer:
      'Não há regra da CLT: você escolhe quantos dias úteis parar. O Boas Férias encaixa esses dias entre fins de semana e feriados.',
  },
];

export const FAQ_UPDATED = '20/11/2026';

const JSON_LD_ID = 'faq-json-ld';

export function faqJsonLd(faqs: readonly Faq[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  });
}

/**
 * Templates drop <script>, so the data goes into <head> directly. The prerendered page keeps it;
 * the browser run finds it there and adds no second copy.
 */
export function addFaqJsonLd(document: Document): void {
  if (document.getElementById(JSON_LD_ID)) return;
  const script = document.createElement('script');
  script.id = JSON_LD_ID;
  script.type = 'application/ld+json';
  script.textContent = faqJsonLd(FAQS);
  document.head.appendChild(script);
}

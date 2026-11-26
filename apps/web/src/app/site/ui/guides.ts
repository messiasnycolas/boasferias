import { Faq } from './page-meta';

export interface Guide {
  /** Under /guias/. */
  slug: string;
  title: string;
  description: string;
  heading: string;
  /** The direct answer, first on the page. */
  answer: string;
  /** Text may hold links written as [text](/path). */
  sections: readonly { heading: string; text: string }[];
  faqs: readonly Faq[];
}

export const GUIDES_UPDATED = '25/11/2026';

export const GUIDES: readonly Guide[] = [
  {
    slug: 'ferias-clt',
    title: 'Férias CLT: como funcionam, quantos dias e quando pagar | Boas Férias',
    description:
      'Quantos dias de férias você tem na CLT, quando a empresa precisa conceder, como as faltas reduzem o total e quando o pagamento cai. Com os artigos da lei.',
    heading: 'Como funcionam as férias na CLT',
    answer:
      'Quem trabalha com carteira assinada tem 30 dias corridos de férias a cada 12 meses de trabalho. A empresa escolhe a data, avisa com 30 dias de antecedência e paga o salário das férias com 1/3 a mais até 2 dias antes do início.',
    sections: [
      {
        heading: 'Quando você ganha o direito',
        text: 'Os 12 meses que dão direito às férias se chamam período aquisitivo. Ele começa no dia da contratação e se renova a cada ano. Ao completar um período, você passa a ter direito a férias, e a empresa tem os 12 meses seguintes, o período concessivo, para concedê-las (art. 134).',
      },
      {
        heading: 'Quantos dias: o efeito das faltas',
        text: 'O total depende das faltas sem justificativa no período aquisitivo (art. 130): até 5 faltas, 30 dias; de 6 a 14, 24 dias; de 15 a 23, 18 dias; de 24 a 32, 12 dias. Acima de 32 faltas, você perde as férias daquele período. As faltas que a lei considera justificadas (art. 131), como licenças e doença comprovada, não entram nessa conta. A empresa também não pode descontar faltas dos dias de férias (art. 130, §1º).',
      },
      {
        heading: 'Quando você perde o direito',
        text: 'Você perde as férias de um período se, durante ele: sair da empresa e não for readmitido em 60 dias; tiver licença remunerada por mais de 30 dias; ficar mais de 30 dias sem trabalhar, recebendo salário, porque a empresa parou; ou receber auxílio do INSS por acidente ou doença por mais de 6 meses, mesmo em períodos separados (art. 133). Um novo período aquisitivo começa quando você volta ao trabalho.',
      },
      {
        heading: 'Quem escolhe a data',
        text: 'A empresa decide a época das férias, pensando no que funciona melhor para o negócio (art. 136). Ela precisa avisar por escrito com pelo menos 30 dias de antecedência (art. 135). Há duas exceções: pessoas da mesma família que trabalham na mesma empresa podem tirar férias juntas, se isso não prejudicar o serviço, e estudantes menores de 18 anos podem fazer as férias coincidirem com as da escola (art. 136, §1º e §2º). Na prática, muitas empresas aceitam sugestões, e chegar com datas bem escolhidas ajuda na conversa.',
      },
      {
        heading: 'Quanto e quando você recebe',
        text: 'Nas férias você recebe o salário normal mais 1/3 dele, o chamado terço constitucional (Constituição, art. 7º, XVII). O pagamento precisa sair até 2 dias antes do início das férias (art. 145). Se você vender parte das férias, recebe também o abono pecuniário: veja o [guia sobre vender férias](/guias/vender-ferias).',
      },
      {
        heading: 'Como aproveitar melhor as férias',
        text: 'Como a CLT conta dias corridos, um feriado no meio das férias é um dia de férias como outro qualquer. O que muda o resultado é o que fica colado nas pontas: um fim de semana antes, um feriado logo depois. Escolher bem o começo e o fim rende vários dias a mais de descanso com os mesmos 30 dias. É isso que a [calculadora de férias](/) do Boas Férias faz: testa todas as datas possíveis no seu período e mostra os planos com mais dias de descanso.',
      },
    ],
    faqs: [
      {
        question: 'Férias de 30 dias incluem fins de semana?',
        answer:
          'Sim. Na CLT as férias são contadas em dias corridos, então sábados, domingos e feriados dentro do período contam como dias de férias.',
      },
      {
        question: 'A empresa pode marcar minhas férias sem me consultar?',
        answer:
          'Pode. Quem escolhe a data é a empresa (art. 136), desde que avise por escrito com 30 dias de antecedência (art. 135) e conceda as férias dentro do período concessivo.',
      },
      {
        question: 'Se eu sair da empresa, recebo as férias?',
        answer:
          'Sim. Você recebe as férias já adquiridas e as proporcionais, com 1/3 a mais (art. 146). Só quem é demitido por justa causa perde as proporcionais.',
      },
    ],
  },
  {
    slug: 'vender-ferias',
    title: 'Vender 1/3 das férias: como funciona o abono pecuniário | Boas Férias',
    description:
      'Quantos dias de férias você pode vender, até quando pedir, como recebe e por que dividir 16 + 4 não funciona. Com os artigos da CLT.',
    heading: 'Vender férias: como funciona o abono de 1/3',
    answer:
      'Na CLT você pode vender até 1/3 das férias, ou seja, 10 de 30 dias. Isso se chama abono pecuniário (art. 143). O pedido é seu, feito até 15 dias antes de completar o período aquisitivo, e os 20 dias que sobram seguem as regras normais de divisão.',
    sections: [
      {
        heading: 'Quantos dias dá para vender',
        text: 'O limite é 1/3 dos dias a que você tem direito. Com 30 dias, são 10. Se as faltas reduziram suas férias, o terço diminui junto: com 24 dias, por exemplo, são 8. Vender é escolha sua: a empresa não pode obrigar e, se você pedir no prazo, também não pode recusar.',
      },
      {
        heading: 'Até quando pedir',
        text: 'O pedido deve ser feito por escrito até 15 dias antes do fim do período aquisitivo (art. 143, §1º). Exemplo: se você foi contratado em 10 de março, o período aquisitivo termina em 9 de março do ano seguinte, e o prazo para pedir vai até 22 de fevereiro. Depois disso, a venda depende de a empresa concordar.',
      },
      {
        heading: 'Como você recebe',
        text: 'Os dias vendidos são pagos à parte, no valor de dias de férias com 1/3, junto com o pagamento das férias, até 2 dias antes do início (art. 145). Nesses 10 dias você trabalha normalmente e recebe também o salário deles.',
      },
      {
        heading: 'A armadilha do 16 + 4',
        text: 'Vendendo 10 dias, sobram 20. Eles cabem em até 2 períodos, porque um precisa ter pelo menos 14 dias e os outros pelo menos 5 (art. 134, §1º), e 14 + 5 + 5 já passa de 20. As divisões possíveis são 20, 15 + 5 e 14 + 6. Se o primeiro período tiver 16 dias, sobram 4, que não formam um período válido. O mesmo acontece com 17, 18 e 19 dias. Por isso, decida os dois períodos juntos antes de marcar o primeiro.',
      },
      {
        heading: 'Vale a pena vender?',
        text: 'Depende do que você precisa: vender dá dinheiro na mão, mas reduz o descanso. Se vender, escolha bem as datas dos 20 dias restantes. Começando numa segunda, 20 dias de férias já rendem 23 dias de descanso, contando os fins de semana das pontas, e um feriado colado rende mais. O [planejador de férias](/) do Boas Férias mostra quanto rende cada opção, com ou sem a venda.',
      },
    ],
    faqs: [
      {
        question: 'Posso vender mais de 10 dias?',
        answer:
          'Não. O limite é 1/3 dos dias de férias (art. 143). Com 30 dias, isso dá no máximo 10.',
      },
      {
        question: 'A empresa pode me obrigar a vender férias?',
        answer:
          'Não. Vender é escolha sua, e a empresa não pode recusar se você pedir até 15 dias antes do fim do período aquisitivo.',
      },
      {
        question: 'Posso vender dias nas férias coletivas?',
        answer: 'Só se um acordo coletivo com o sindicato permitir (art. 143, §2º).',
      },
    ],
  },
  {
    slug: 'dividir-ferias',
    title: 'Dividir férias em 3 períodos: regras da CLT | Boas Férias',
    description:
      'Como dividir as férias em até 3 partes, o mínimo de 14 e de 5 dias, em que dias as férias não podem começar e como escolher as datas que rendem mais.',
    heading: 'Como dividir as férias em até 3 períodos',
    answer:
      'Desde a reforma trabalhista de 2017, as férias podem ser divididas em até 3 períodos, se você concordar. Um deles precisa ter pelo menos 14 dias corridos e os outros, pelo menos 5 (art. 134, §1º). Nenhum período pode começar nos 2 dias antes de um feriado ou do descanso semanal (art. 134, §3º).',
    sections: [
      {
        heading: 'A regra do 14 e do 5',
        text: 'Com 30 dias, estas divisões valem: 30; 15 + 15; 20 + 10; 14 + 11 + 5; 20 + 5 + 5. Estas não valem: 10 + 10 + 10, porque nenhum período chega a 14, e 26 + 4, porque o segundo tem menos de 5. A ordem não importa: o período de 14 dias ou mais pode ser o primeiro, o segundo ou o último.',
      },
      {
        heading: 'Quem decide a divisão',
        text: 'A divisão precisa da sua concordância: a empresa não pode dividir as férias sozinha. As datas de cada período continuam sendo escolha da empresa (art. 136), avisadas com 30 dias de antecedência (art. 135). Todos os períodos precisam caber no período concessivo, e os dias que passarem do prazo são pagos em dobro (art. 137 e Súmula 81 do TST).',
      },
      {
        heading: 'Em que dias as férias não podem começar',
        text: 'As férias não podem começar nos 2 dias antes de um feriado ou do descanso semanal remunerado (art. 134, §3º). Para quem trabalha de segunda a sexta e descansa no domingo, isso exclui sexta e sábado, e sobra de segunda a quinta. Numa semana com feriado, saem também os 2 dias antes dele: com feriado na quarta, segunda e terça ficam de fora.',
      },
      {
        heading: 'Como dividir para aproveitar melhor',
        text: 'O que fica colado nas pontas de cada período conta: um período que começa na segunda ganha o fim de semana anterior, e um que termina na sexta ganha o seguinte. Com mais períodos, há mais pontas para encostar em fins de semana e feriados, por isso dividir costuma render mais dias de descanso do que tirar 30 dias seguidos. Só não esqueça: pelo menos um período de 14 dias continua obrigatório.',
      },
      {
        heading: 'Planejar com a calculadora',
        text: 'Testar as combinações à mão é cansativo: com 3 períodos em um ano, são milhões de opções. A [calculadora de férias](/) do Boas Férias testa todas, respeita as regras acima e mostra os planos com mais dias de descanso, com os feriados do seu estado e da sua cidade.',
      },
    ],
    faqs: [
      {
        question: 'Posso dividir as férias em 4 períodos?',
        answer: 'Não. Na CLT o limite é 3 períodos (art. 134, §1º).',
      },
      {
        question: 'A empresa pode dividir minhas férias sem eu concordar?',
        answer: 'Não. A divisão precisa da concordância do empregado (art. 134, §1º).',
      },
      {
        question: 'Depois de vender 10 dias, posso dividir os 20 restantes?',
        answer:
          'Sim, em até 2 períodos: 15 + 5 ou 14 + 6. Três períodos não cabem, porque 14 + 5 + 5 passa de 20.',
      },
    ],
  },
  {
    slug: 'prazo-ferias',
    title: 'Prazo das férias: período concessivo e férias vencidas | Boas Férias',
    description:
      'Até quando a empresa precisa conceder suas férias, o que são férias vencidas, quando elas são pagas em dobro e o que acontece quando você sai da empresa.',
    heading: 'Prazo das férias: até quando a empresa precisa conceder',
    answer:
      'A empresa tem 12 meses, contados do fim de cada período aquisitivo, para conceder as férias: é o período concessivo (art. 134). Os dias de férias que passarem desse prazo são pagos em dobro (art. 137).',
    sections: [
      {
        heading: 'Período aquisitivo e período concessivo',
        text: 'Período aquisitivo são os 12 meses de trabalho que dão direito às férias. Período concessivo são os 12 meses seguintes, em que as férias precisam ser tiradas. Exemplo: quem foi contratado em 10/03/2025 completa o primeiro período aquisitivo em 09/03/2026 e precisa terminar essas férias até 09/03/2027.',
      },
      {
        heading: 'Férias vencidas',
        text: 'No dia a dia, férias vencidas são as de um período aquisitivo já completo que você ainda não tirou. Enquanto o período concessivo não termina, está tudo dentro da lei. O problema é deixar o prazo passar.',
      },
      {
        heading: 'Pagamento em dobro',
        text: 'Se as férias forem concedidas depois do período concessivo, a empresa paga em dobro (art. 137). Quando só parte do período passa do prazo, apenas os dias que passaram são pagos em dobro (Súmula 81 do TST). Você também pode pedir à Justiça do Trabalho que marque as férias (art. 137, §1º).',
      },
      {
        heading: 'Pagamento atrasado',
        text: 'A lei manda pagar as férias até 2 dias antes do início (art. 145). Por anos o TST mandou pagar em dobro quando esse prazo não era cumprido (Súmula 450), mas o STF derrubou esse entendimento em 2022 (ADPF 501). Hoje o atraso no pagamento, sozinho, não gera a dobra, mas continua sendo uma infração sujeita a multa (art. 153).',
      },
      {
        heading: 'Quando você sai da empresa',
        text: 'Ao sair, por qualquer motivo, você recebe as férias já adquiridas, simples ou em dobro, com 1/3 a mais (art. 146). As férias proporcionais do período em curso, 1/12 por mês trabalhado, também são pagas, exceto na demissão por justa causa (art. 146, parágrafo único, e Súmula 171 do TST).',
      },
      {
        heading: 'Planeje antes do prazo',
        text: 'Quanto mais perto do fim do período concessivo, menos datas sobram para escolher. Planejar com antecedência permite encaixar as férias nos feriados certos. No [planejador de férias](/), informe o último dia do seu período concessivo em "Terminar até", dentro de "Mais filtros", e veja os melhores planos dentro do prazo.',
      },
    ],
    faqs: [
      {
        question: 'O que são férias vencidas?',
        answer:
          'São férias de um período aquisitivo já completo que ainda não foram tiradas. Elas são pagas em dobro só se o período concessivo terminar antes de você tirá-las.',
      },
      {
        question: 'A empresa pode adiar minhas férias para o ano seguinte?',
        answer:
          'Só dentro do período concessivo. Os dias de férias que passarem dele são pagos em dobro (art. 137).',
      },
      {
        question: 'Recebo férias vencidas na demissão?',
        answer: 'Sim, sempre, com 1/3 a mais, qualquer que seja o motivo da saída (art. 146).',
      },
    ],
  },
];

/** A route without its text is a bug: fail the build instead of prerendering another guide. */
export function guideBySlug(slug: string): Guide {
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) throw new Error(`No guide text for "${slug}"`);
  return guide;
}

export interface TextPart {
  text: string;
  path?: string;
}

/** Splits "see [the guide](/guias/x)" into plain text and links. */
export function textParts(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const m of text.matchAll(/\[([^\]]+)\]\((\/[^)]*)\)/g)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[1], path: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

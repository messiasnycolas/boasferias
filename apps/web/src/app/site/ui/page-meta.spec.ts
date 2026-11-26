import { faqPageData, setPageMeta } from './page-meta';

const FAQS = [
  { question: 'Pergunta 1?', answer: 'Resposta 1.' },
  { question: 'Pergunta 2?', answer: 'Resposta 2.' },
];

function head(html: string): Document {
  document.head.innerHTML = html;
  return document;
}

describe('page meta', () => {
  afterEach(() => (document.head.innerHTML = ''));

  it('sends search engines the same questions and answers the page shows', () => {
    const data = faqPageData(FAQS) as {
      '@type': string;
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(data['@type']).toBe('FAQPage');
    expect(
      data.mainEntity.map((q) => ({ question: q.name, answer: q.acceptedAnswer.text })),
    ).toEqual(FAQS);
  });

  it('fills the title, description, link preview and canonical address', () => {
    const doc = head(
      '<meta name="description" content=""><meta property="og:title" content="">' +
        '<meta property="og:description" content=""><meta property="og:url" content="">' +
        '<link rel="canonical" href="">',
    );
    setPageMeta(doc, { title: 'T', description: 'D', path: '/guias/x' });
    expect(doc.title).toBe('T');
    expect(doc.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('D');
    expect(doc.head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('T');
    expect(doc.head.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://boasferias.app.br/guias/x',
    );
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://boasferias.app.br/guias/x',
    );
  });

  it('keeps one FAQ block, replaced on each page and removed where there is none', () => {
    const doc = head('');
    const blocks = () => doc.head.querySelectorAll('script[type="application/ld+json"]');
    setPageMeta(doc, { title: 'A', description: '', path: '/', faqs: FAQS });
    setPageMeta(doc, { title: 'A', description: '', path: '/', faqs: FAQS.slice(1) });
    expect(blocks()).toHaveLength(1);
    expect(JSON.parse(blocks()[0].textContent ?? '').mainEntity).toHaveLength(1);
    setPageMeta(doc, { title: 'B', description: '', path: '/sobre' });
    expect(blocks()).toHaveLength(0);
  });
});

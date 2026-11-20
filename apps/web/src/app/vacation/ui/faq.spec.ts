import { FAQS, addFaqJsonLd, faqJsonLd } from './faq';

describe('FAQ data', () => {
  it('sends search engines the same questions and answers the page shows', () => {
    const data = JSON.parse(faqJsonLd(FAQS));
    expect(data['@type']).toBe('FAQPage');
    expect(
      data.mainEntity.map((q: { name: string; acceptedAnswer: { text: string } }) => ({
        question: q.name,
        answer: q.acceptedAnswer.text,
      })),
    ).toEqual(FAQS);
  });

  it('adds the data to <head> once', () => {
    addFaqJsonLd(document);
    addFaqJsonLd(document);
    const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent ?? '').mainEntity).toHaveLength(FAQS.length);
    scripts[0].remove();
  });
});

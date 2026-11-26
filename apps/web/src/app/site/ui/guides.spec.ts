import { FAQS } from '../../vacation/ui/faq';
import { GUIDE_LINKS } from './guide-links';
import { GUIDES, guideBySlug, textParts } from './guides';

const PAGES = ['/', ...GUIDE_LINKS.map((g) => `/guias/${g.slug}`)];

describe('guides', () => {
  it('has a text for every guide address, and an address for every text', () => {
    expect(GUIDES.map((g) => g.slug)).toEqual(GUIDE_LINKS.map((g) => g.slug));
    expect(() => guideBySlug('nao-existe')).toThrow();
  });

  it('splits links out of a text', () => {
    expect(textParts('veja o [guia](/guias/x). Fim')).toEqual([
      { text: 'veja o ' },
      { text: 'guia', path: '/guias/x' },
      { text: '. Fim' },
    ]);
    expect(textParts('sem links')).toEqual([{ text: 'sem links' }]);
  });

  it('links only to pages that exist', () => {
    const paths = [
      ...GUIDES.flatMap((g) => g.sections.flatMap((s) => textParts(s.text))).map((p) => p.path),
      ...FAQS.map((f) => f.guide),
    ].filter((p) => p !== undefined);
    expect(paths.length).toBeGreaterThan(5);
    for (const path of paths) expect(PAGES).toContain(path);
  });
});

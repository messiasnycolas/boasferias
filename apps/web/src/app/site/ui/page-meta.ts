export const SITE_URL = 'https://boasferias.app.br';
export const CONTACT_EMAIL = 'contato@messias.software';

export interface Faq {
  question: string;
  answer: string;
}

export interface PageMeta {
  title: string;
  description: string;
  /** Path from the site root, e.g. '/' or '/guias/vender-ferias'. */
  path: string;
  /** Questions shown on the page, sent to search engines as FAQPage data. */
  faqs?: readonly Faq[];
}

const JSON_LD_ID = 'page-json-ld';

export function faqPageData(faqs: readonly Faq[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/**
 * Fills the tags index.html already has, so the prerendered page carries them. Templates drop
 * <script>, so the FAQ data goes into <head> directly, replaced on each page.
 */
export function setPageMeta(document: Document, meta: PageMeta): void {
  const url = SITE_URL + meta.path;
  document.title = meta.title;
  const set = (selector: string, attr: string, value: string) =>
    document.head.querySelector(selector)?.setAttribute(attr, value);
  set('meta[name="description"]', 'content', meta.description);
  set('meta[property="og:title"]', 'content', meta.title);
  set('meta[property="og:description"]', 'content', meta.description);
  set('meta[property="og:url"]', 'content', url);
  set('link[rel="canonical"]', 'href', url);

  document.getElementById(JSON_LD_ID)?.remove();
  if (!meta.faqs) return;
  const script = document.createElement('script');
  script.id = JSON_LD_ID;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(faqPageData(meta.faqs));
  document.head.appendChild(script);
}

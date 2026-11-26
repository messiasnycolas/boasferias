# site

The pages around the calculator: guides, about, privacy, contact, and the parts every page shares.

- `ui/page-meta.ts`: title, description, link preview, canonical URL and FAQPage data for each page.
- `ui/content-page.ts`: the reading layout (sky with the name, one card, footer); `ui/article.css` styles its card.
- `ui/guides.ts`: the guide texts. A link inside a text is written `[text](/path)`. `ui/guide-links.ts` keeps names and addresses apart, so the routes and the footer load without the texts.
- `ui/logo.ts`, `ui/site-footer.ts`: shared by the home page too.

Glossary: guia (guide) is a page that explains one CLT vacation rule and links to the calculator.

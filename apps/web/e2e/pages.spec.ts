import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const GUIDES = [
  ['/guias/ferias-clt', 'Como funcionam as férias na CLT'],
  ['/guias/vender-ferias', 'Vender férias'],
  ['/guias/dividir-ferias', 'Dividir férias em até 3 períodos'],
  ['/guias/prazo-ferias', 'Prazo das férias'],
];
const SITE_PAGES = [
  ['/sobre', 'Sobre', 'Sobre o Boas Férias'],
  ['/privacidade', 'Privacidade', 'Política de privacidade'],
  ['/contato', 'Contato', 'Contato'],
];

/** JSON-LD types in a page's HTML. */
const dataTypes = (html: string) =>
  [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1])['@type'])
    .sort();

const canonical = (html: string) => html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];

test('the home title names this year and the next', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-01-10T12:00:00-03:00'));
  await page.goto('/');
  await expect(page).toHaveTitle(/em 2027 e 2028/);
});

for (const [path, name] of GUIDES) {
  test(`guide ${path} ships its own address and FAQ data, opens from the footer, fits 320 px`, async ({
    page,
    request,
  }) => {
    const html = await (await request.get(path)).text();
    expect(canonical(html)).toBe(`https://boasferias.app.br${path}`);
    expect(dataTypes(html)).toEqual(['FAQPage', 'WebApplication']);

    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/');
    await page.locator('app-site-footer').getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}

test('a home question links to its guide, and the guide back to the calculator', async ({
  page,
}) => {
  await page.goto('/');
  const faq = page.getByRole('region', { name: 'Perguntas frequentes' });
  await faq.getByText('Posso vender parte das férias?').click();
  await faq.getByRole('link', { name: 'Saiba mais' }).click();
  await expect(page).toHaveTitle(/abono pecuniário/);
  await page.getByRole('link', { name: 'Calcular minhas férias' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Ver melhores datas' })).toBeVisible();
});

for (const [path, link, heading] of SITE_PAGES) {
  test(`${path} opens from the footer with its own address`, async ({ page, request }) => {
    const html = await (await request.get(path)).text();
    expect(canonical(html)).toBe(`https://boasferias.app.br${path}`);
    expect(dataTypes(html)).toEqual(['WebApplication']);

    await page.goto('/');
    await page.locator('app-site-footer').getByRole('link', { name: link }).click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}

test('the contact email opens the mail app', async ({ page }) => {
  await page.goto('/contato');
  await expect(page.getByRole('link', { name: 'contato@messias.software' })).toHaveAttribute(
    'href',
    'mailto:contato@messias.software',
  );
});

test('the sitemap and llms.txt list every page', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const llms = await (await request.get('/llms.txt')).text();
  for (const [path] of [...GUIDES, ...SITE_PAGES]) {
    expect(sitemap).toContain(`<loc>https://boasferias.app.br${path}</loc>`);
    expect(llms).toContain(`https://boasferias.app.br${path}`);
  }
});

test('"Pague um café" gives a Pix code to copy and a QR code', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/sobre');
  const footer = page.locator('app-site-footer');
  await footer.getByRole('button', { name: 'Pague um café via Pix' }).click();
  // The radios are drawn as chips: tap the label, like a person would.
  await footer.locator('label', { hasText: '20' }).click();
  await expect(footer.getByRole('radio', { name: /20/ })).toBeChecked();
  await expect(footer.getByRole('img', { name: 'QR code do Pix' })).toBeVisible();
  await footer.getByRole('button', { name: 'Copiar código Pix' }).click();
  await expect(footer.getByText('Código copiado')).toBeVisible();
  const code = await page.evaluate(() => navigator.clipboard.readText());
  expect(code).toMatch(
    /^000201.*contato@messias\.software.*540520\.00.*BOASFERIAS6304[0-9A-F]{4}$/,
  );
  const { violations } = await new AxeBuilder({ page }).include('app-site-footer').analyze();
  expect(violations).toEqual([]);
});

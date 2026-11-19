import { Page, expect, test } from '@playwright/test';
import { showPlans } from './helpers';

/** Checks one page state for sideways scroll, cut-off text and overlapping controls. */
const expectSaneLayout = async (page: Page, label: string) => {
  const width = page.viewportSize()!.width;
  const problems = await page.evaluate((width) => {
    const found: string[] = [];
    const visible = (e: Element) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
    };
    const name = (e: Element) =>
      `<${e.tagName.toLowerCase()}> "${
        e.getAttribute('aria-label') ?? (e as HTMLElement).innerText?.trim().slice(0, 40) ?? ''
      }"`;

    // Phone emulation widens innerWidth to fit overflowing content, so compare to the set width.
    if (document.documentElement.scrollWidth > width)
      found.push(
        `sideways scroll: page is ${document.documentElement.scrollWidth}px wide, screen ${width}px`,
      );

    const texts = 'button, label, a, .chip, [role=option]';
    for (const e of [...document.querySelectorAll<HTMLElement>(texts)].filter(visible)) {
      // Width only: buttons clip decorative effects taller than themselves.
      if (e.scrollWidth > e.clientWidth + 1) found.push(`cut-off text: ${name(e)}`);
    }

    // Left out: hidden helpers, closed sections (laid out, not shown), and sticky or fixed bars
    // (they float over what scrolls beneath).
    const floats = (e: Element) => {
      for (let p: Element | null = e; p; p = p.parentElement)
        if (['sticky', 'fixed'].includes(getComputedStyle(p).position)) return true;
      return false;
    };
    const controls = [...document.querySelectorAll('input, select, textarea, button')].filter(
      (e) => visible(e) && !e.closest('[aria-hidden=true], details:not([open])') && !floats(e),
    );
    controls.forEach((a, i) =>
      controls.slice(i + 1).forEach((b) => {
        if (a.contains(b) || b.contains(a)) return;
        if ((a.closest('form') ?? document.body) !== (b.closest('form') ?? document.body)) return;
        const x = a.getBoundingClientRect();
        const y = b.getBoundingClientRect();
        // One wholly inside the other is by design: an icon button over its input (calendar, clear).
        const inside = (p: DOMRect, q: DOMRect) =>
          p.left >= q.left - 1 &&
          p.right <= q.right + 1 &&
          p.top >= q.top - 1 &&
          p.bottom <= q.bottom + 1;
        if (inside(x, y) || inside(y, x)) return;
        const overlaps =
          Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 &&
          Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1;
        if (overlaps) found.push(`overlap: ${name(a)} and ${name(b)}`);
      }),
    );
    return found;
  }, width);
  expect(problems, `layout at ${width}px, state "${label}"`).toEqual([]);
};

const states: [string, (page: Page) => Promise<void>][] = [
  ['first screen', async () => {}],
  ['plans shown', showPlans],
  [
    'more filters, workdays "Outra"',
    async (page) => {
      await page.getByText('Mais filtros').click();
      await page.getByRole('radio', { name: 'Outra' }).click();
      await expect(page.locator('.chip')).toHaveCount(7);
    },
  ],
  [
    'more filters with banco de horas and a credit plan',
    async (page) => {
      await page.getByText('Mais filtros').click();
      await page.getByRole('button', { name: 'Mais um dia de banco de horas' }).click();
      await page.getByRole('button', { name: 'Mais um dia de banco de horas' }).click();
      await page.getByRole('button', { name: 'Mais um dia de banco de horas' }).click();
      await page.getByLabel('Primeiro dia').fill('09/02/2027');
      await page.getByLabel('Último dia (opcional)').fill('12/02/2027');
      await page.getByRole('button', { name: 'Adicionar' }).click();
      await page.getByRole('button', { name: 'Ver melhores datas' }).click();
      await expect(page.locator('.legend')).toContainText('Banco de horas');
    },
  ],
  [
    'holiday list open',
    async (page) => {
      await page.getByText('Mais filtros').click();
      await page.getByText('Feriados no período').click();
    },
  ],
  [
    'city chosen',
    async (page) => {
      await page.getByLabel('Estado').selectOption('SP');
      const city = page.getByRole('combobox', { name: 'Cidade' });
      await city.fill('são paulo');
      await page.getByRole('listbox', { name: 'Cidades' }).getByRole('option').first().click();
      await expect(city).toHaveValue('São Paulo');
    },
  ],
];

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-01-10T12:00:00-03:00'));
  await page.goto('/');
});

for (const width of [320, 360, 412, 768, 1280]) {
  for (const [label, open] of states) {
    test(`${label} at ${width} px has a sane layout`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await open(page);
      await expectSaneLayout(page, label);
    });
  }
}

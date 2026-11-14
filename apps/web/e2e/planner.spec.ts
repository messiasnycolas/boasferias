import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';
import { inflateSync } from 'node:zlib';

const firstPlan = (page: Page) => page.locator('.plan').first();

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-01-10T12:00:00-03:00'));
  await page.goto('/');
});

const showPlans = async (page: Page) => {
  await page.getByRole('button', { name: 'Ver melhores datas' }).click();
  await expect(page.getByRole('heading', { name: 'Plano A', exact: true })).toBeVisible();
};

/** Rightmost edge of anything on the page; phone emulation widens innerWidth, so compare to the real screen. */
const widest = (page: Page) =>
  page.evaluate(() =>
    Math.max(
      ...[...document.querySelectorAll('body *')].map((e) => e.getBoundingClientRect().right),
    ),
  );

/** RGB of a 1x1 PNG screenshot (no image library needed). */
const rgbOf = (png: Buffer) => {
  const chunks: Buffer[] = [];
  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at);
    if (png.toString('ascii', at + 4, at + 8) === 'IDAT')
      chunks.push(png.subarray(at + 8, at + 8 + length));
    at += length + 12;
  }
  const row = inflateSync(Buffer.concat(chunks));
  return [row[1], row[2], row[3]];
};

/** Any tone of our sea, from the light horizon to the deep bottom. */
const isSea = ([r, g, b]: number[]) => r <= 25 && g >= 35 && g <= 95 && b >= 60 && b <= 140;

test.describe('before the first click', () => {
  test('raised buttons are filled with coconut shell, so the trunk never shows through', async ({
    page,
  }) => {
    const fill = await page
      .getByRole('button', { name: 'Ver melhores datas' })
      .evaluate((button) => getComputedStyle(button).backgroundColor);
    expect(fill).toBe('rgb(58, 36, 22)');
  });

  test('taps show no blue browser highlight', async ({ page }) => {
    const color = await page.evaluate(
      () => getComputedStyle(document.querySelector('button')!).webkitTapHighlightColor,
    );
    expect(color).toBe('rgba(0, 0, 0, 0)');
  });

  test('is only as tall as its content on a phone', async ({ page }) => {
    const formBottom = await page
      .locator('form')
      .evaluate((form) => form.getBoundingClientRect().bottom + scrollY);
    // The body, not the document: a document is never shorter than the window.
    const height = await page.evaluate(() => document.body.getBoundingClientRect().height);
    expect(height - formBottom).toBeLessThanOrEqual(24); // the layout's bottom padding
  });

  for (const size of [
    { width: 1920, height: 1080 },
    { width: 3840, height: 2160 },
  ]) {
    test(`fills a ${size.width}x${size.height} screen with sea, no gap`, async ({ page }) => {
      await page.setViewportSize(size);
      const bottom: number[][] = [];
      for (const x of [0, size.width / 2, size.width - 1]) {
        const pixel = await page.screenshot({
          clip: { x, y: size.height - 1, width: 1, height: 1 },
          scale: 'css',
        });
        bottom.push(rgbOf(pixel));
      }
      for (const rgb of bottom) expect(isSea(rgb), `bottom pixel ${rgb}`).toBe(true);
      // Browsers dither gradients, so neighbours may differ by a shade or two.
      for (const rgb of bottom) {
        rgb.forEach((c, i) =>
          expect(Math.abs(c - bottom[0][i]), 'even along the bottom').toBeLessThanOrEqual(2),
        );
      }
    });
  }

  test('hides the plans until asked, then shows and focuses them', async ({ page }) => {
    await page.waitForTimeout(600); // the background computation has finished
    await expect(page.getByRole('heading', { name: 'Melhores planos' })).toHaveCount(0);
    await expect(page.locator('.plan')).toHaveCount(0);

    await showPlans(page);
    await expect(page.locator('.results')).toBeFocused();
  });

  test('open sections leave space before the next divider', async ({ page }) => {
    await page.getByText('Mais filtros').click();
    await page.getByText('Feriados no período').click();
    const gaps = await page.locator('details.more[open]').evaluateAll((sections) =>
      sections.map((section) => {
        const last = section.lastElementChild!.getBoundingClientRect();
        return section.getBoundingClientRect().bottom - last.bottom;
      }),
    );
    expect(gaps).toHaveLength(2);
    for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(16);
  });

  test('shared links describe the page with descanso, never folga', async ({ page }) => {
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) {
      const text = await page.locator(selector).getAttribute('content');
      expect(text, selector).toContain('descanso');
      expect(text, selector).not.toMatch(/folga/i);
    }
  });

  test('removing a holiday turns its × into a + by rotating the icon', async ({ page }) => {
    await page.getByText('Feriados no período').click();
    const remove = page.getByRole('button', { name: 'Remover Tiradentes' });
    await remove.click();
    const restore = page.getByRole('button', { name: 'Considerar Tiradentes' });
    await expect(restore).toBeVisible();
    await expect
      .poll(() => restore.locator('svg').evaluate((svg) => getComputedStyle(svg).transform))
      .toBe('matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)');
    await restore.click();
    await expect(page.getByRole('button', { name: 'Remover Tiradentes' })).toBeVisible();
  });

  test('lists the holidays in their own closed section', async ({ page }) => {
    const section = page.locator('details', { hasText: 'Feriados no período' });
    await expect(section).not.toHaveAttribute('open');
    await expect(page.locator('details', { hasText: 'Mais filtros' })).not.toContainText(
      'Sexta-feira Santa',
    );
    await page.getByText('Feriados no período').click();
    await expect(section.locator('.holidays li').first()).toBeVisible();
  });

  test('centres the form on desktop, then shows form and plans side by side', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const form = (await page.locator('form').boundingBox())!;
    expect(Math.abs(form.x + form.width / 2 - 640)).toBeLessThan(2);

    await showPlans(page);
    const after = (await page.locator('form').boundingBox())!;
    const results = (await page.locator('.results').boundingBox())!;
    expect(results.x).toBeGreaterThan(after.x + after.width);
  });
});

test.describe('with the plans shown', () => {
  test.beforeEach(async ({ page }) => showPlans(page));

  test('updates the plans live as the form changes', async ({ page }) => {
    const before = await firstPlan(page).innerText();
    await page.getByRole('button', { name: 'Menos um dia' }).click();
    await expect(firstPlan(page)).not.toHaveText(before);
  });

  test('ranks CLT plans with the defaults and shows the first on a calendar', async ({ page }) => {
    await expect(firstPlan(page)).toContainText('43 dias de descanso');
    await expect(firstPlan(page)).toContainText('+13 extras');
    const days = page.locator('.plan.selected').locator('.day.vacation, .day.counted');
    await expect(days).toHaveCount(30);
  });

  test('groups ties and labels days the CLT counts as vacation', async ({ page }) => {
    await expect(firstPlan(page)).toContainText('Empatado com os planos B e C');
    await expect(page.locator('.plan').nth(1)).toContainText('Empatado com os planos A e C');
    await expect(page.getByText('Contado como férias pela CLT')).toBeVisible();
  });

  test('calculates 5 more plans at a time, up to 20, and back to 3 on any change', async ({
    page,
  }) => {
    const plans = page.locator('.plan');
    await expect(plans).toHaveCount(3);
    for (const count of [8, 13, 18]) {
      await page.getByRole('button', { name: 'Calcular mais 5 planos' }).click();
      await expect(plans).toHaveCount(count);
    }
    await page.getByRole('button', { name: 'Calcular mais 2 planos' }).click();
    await expect(plans).toHaveCount(20);
    await expect(plans.last().getByRole('heading')).toHaveText('Plano T');
    await expect(page.getByRole('button', { name: /Calcular mais/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'Menos um dia' }).click();
    await expect(plans).toHaveCount(3);
  });

  test('never says folga', async ({ page }) => {
    await page.getByText('Mais filtros').click();
    await page.getByText('Feriados no período').click();
    await expect(page.locator('body')).not.toContainText(/folga/i);
  });

  test('removing a holiday or adding a leave day changes the results', async ({ page }) => {
    await page.getByText('Feriados no período').click();
    const before = await firstPlan(page).innerText();
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Sexta-feira Santa' })
      .getByRole('button', { name: 'Remover' })
      .click();
    await expect(firstPlan(page)).not.toHaveText(before);

    const afterRemoval = await firstPlan(page).innerText();
    await page.getByText('Mais filtros').click();
    await page.getByLabel('Primeiro dia').fill('09/02/2027');
    await page.getByRole('button', { name: 'Adicionar' }).click();
    await expect(firstPlan(page)).not.toHaveText(afterRemoval);
  });

  test('shows an error for invalid input and an empty state for an impossible window', async ({
    page,
  }) => {
    await page.getByLabel('Dias de férias').fill('3');
    await expect(page.getByText('Na CLT, use de 5 a 30 dias')).toBeVisible();

    await page.getByLabel('Dias de férias').fill('30');
    await page.getByText('Mais filtros').click();
    await page.getByLabel('Terminar até').fill('20/02/2027');
    await expect(page.getByText('Nenhum plano cabe')).toBeVisible();
  });

  test('computes off the main thread', async ({ page }) => {
    expect(page.workers().length).toBeGreaterThan(0);
    await page.getByRole('radio', { name: 'PJ' }).click();
    await expect(firstPlan(page)).toContainText('dias úteis');
  });

  test('shows and takes dates as dd/mm/aaaa, whatever the phone language', async ({ page }) => {
    await page.getByText('Mais filtros').click();
    await expect(page.getByLabel('Começar a partir de')).toHaveValue('09/02/2027');
    await page.getByRole('radio', { name: 'PJ' }).click();
    await expect(page.getByLabel('Começar a partir de')).toHaveValue('17/01/2027'); // a week ahead

    const before = await firstPlan(page).innerText();
    await page.getByLabel('Começar a partir de').fill('01032027');
    await expect(page.getByLabel('Começar a partir de')).toHaveValue('01/03/2027');
    await expect(firstPlan(page)).not.toHaveText(before);
  });

  test('adds a leave range like a flight search: first day required, last day optional', async ({
    page,
  }) => {
    await page.getByText('Mais filtros').click();
    const add = page.getByRole('button', { name: 'Adicionar' });
    await expect(add).toBeDisabled();

    await page.getByLabel('Primeiro dia').fill('12/02/2027');
    await page.getByLabel('Último dia (opcional)').fill('09/02/2027');
    await expect(page.getByRole('alert')).toHaveText('O último dia vem antes do primeiro.');
    await expect(add).toBeDisabled();

    const before = await firstPlan(page).innerText();
    await page.getByLabel('Primeiro dia').fill('09/02/2027');
    await page.getByLabel('Último dia (opcional)').fill('12/02/2027');
    await add.click();
    const leave = page
      .locator('fieldset', { hasText: 'Licença ou banco de horas' })
      .getByRole('listitem');
    await expect(leave).toHaveCount(1);
    await expect(leave).toContainText('9 até 12 Fev');
    await expect(firstPlan(page)).not.toHaveText(before);
    await expect(page.getByLabel('Primeiro dia')).toHaveValue('');

    await leave.getByRole('button', { name: 'Remover' }).click();
    await expect(leave).toHaveCount(0);
  });

  test('opening another plan on the calendar scrolls to that calendar', async ({ page }) => {
    const planB = page.locator('.plan').nth(1);
    await planB.getByRole('button', { name: 'Ver no calendário' }).click();
    const calendar = planB.locator('app-plan-months');
    await expect(calendar).toBeVisible();
    await expect
      .poll(() => calendar.evaluate((el) => Math.round(el.getBoundingClientRect().top)))
      .toBeGreaterThanOrEqual(0);
    await expect
      .poll(() => calendar.evaluate((el) => Math.round(el.getBoundingClientRect().top)))
      .toBeLessThanOrEqual(40);
  });

  test('a volleyball takes you back to the top', async ({ page }) => {
    const ball = page.getByRole('button', { name: 'Voltar ao topo' });
    await expect(ball).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await ball.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole('heading', { name: 'Suas férias' })).toBeFocused();
    await expect(ball).toHaveCount(0);
  });

  test('lays the legend out all in one row or all in one column, never mixed', async ({ page }) => {
    const layout = async () => {
      const boxes = await page
        .locator('.legend li')
        .evaluateAll((items) => items.map((li) => li.getBoundingClientRect()));
      if (boxes.every((b) => Math.abs(b.y - boxes[0].y) < 1)) return 'row';
      if (boxes.every((b) => Math.abs(b.x - boxes[0].x) < 1)) return 'column';
      return 'mixed';
    };
    await expect(page.locator('.legend li')).toHaveCount(4);
    expect(await layout()).toBe('column');

    await page.setViewportSize({ width: 1280, height: 800 });
    expect(await layout()).toBe('row');

    await page.getByRole('radio', { name: 'PJ' }).click();
    await expect(page.locator('.legend li')).toHaveCount(3);
    expect(await layout()).toBe('row');

    await page.setViewportSize({ width: 360, height: 800 });
    expect(await layout()).toBe('column');
  });

  test('choosing the mode already selected keeps the input and does not recompute', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Menos um dia' }).click();
    await expect(page.locator('#days')).toHaveValue('29');
    await page.waitForTimeout(400); // let the debounced recompute for 29 days start
    await expect(page.locator('.results')).toHaveAttribute('aria-busy', 'false');

    await page.evaluate(() => {
      const results = document.querySelector('.results')!;
      new MutationObserver(() => {
        if (results.getAttribute('aria-busy') === 'true')
          document.body.dataset['recomputed'] = 'yes';
      }).observe(results, { attributes: true });
    });
    await page.getByRole('radio', { name: 'CLT' }).click();
    await page.waitForTimeout(600);

    await expect(page.locator('#days')).toHaveValue('29');
    expect(await page.evaluate(() => document.body.dataset['recomputed'])).toBeUndefined();
  });

  for (const width of [320, 344, 360, 384, 412, 673]) {
    test.describe(`on a ${width} px phone`, () => {
      // 344 x 882: Galaxy Z Fold cover screen (narrow and tall); 673: Fold unfolded.
      test.use({ viewport: { width, height: width === 344 ? 882 : 800 } });

      test('every option fits the screen, is accessible and easy to tap', async ({ page }) => {
        await page.getByText('Mais filtros').click();
        await page.getByText('Feriados no período').click();
        await page.getByRole('radio', { name: 'Outra' }).click();
        await expect(page.locator('.chip')).toHaveCount(7);

        expect(await widest(page)).toBeLessThanOrEqual(width);
        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
        for (const button of await page.locator('button:visible, summary').all()) {
          const box = await button.boundingBox();
          expect(box?.height, await button.innerText()).toBeGreaterThanOrEqual(44);
        }
      });

      test('wrapped holiday names keep their row padding', async ({ page }) => {
        await page.getByText('Feriados no período').click();
        const gaps = await page.locator('.holidays li').evaluateAll((items) =>
          items.map((li) => {
            const row = li.getBoundingClientRect();
            const text = li.querySelector('span')!.getBoundingClientRect();
            return Math.min(text.top - row.top, row.bottom - text.bottom);
          }),
        );
        expect(gaps.length).toBeGreaterThan(0);
        for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(8);
      });
    });
  }
});

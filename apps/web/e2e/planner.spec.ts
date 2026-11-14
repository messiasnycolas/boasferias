import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';

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

test.describe('before the first click', () => {
  test('hides the plans until asked, then shows and focuses them', async ({ page }) => {
    await page.waitForTimeout(600); // the background computation has finished
    await expect(page.getByRole('heading', { name: 'Melhores planos' })).toHaveCount(0);
    await expect(page.locator('.plan')).toHaveCount(0);

    await showPlans(page);
    await expect(page.locator('.results')).toBeFocused();
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
    await page.getByLabel('Data da licença ou banco de horas').fill('2027-02-09');
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
    await page.getByLabel('Terminar até').fill('2027-02-20');
    await expect(page.getByText('Nenhum plano cabe')).toBeVisible();
  });

  test('computes off the main thread', async ({ page }) => {
    expect(page.workers().length).toBeGreaterThan(0);
    await page.getByRole('radio', { name: 'PJ' }).click();
    await expect(firstPlan(page)).toContainText('dias úteis');
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

  for (const width of [320, 360]) {
    test.describe(`on a ${width} px phone`, () => {
      test.use({ viewport: { width, height: 800 } });

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

      test('date pickers have room for their content', async ({ page }) => {
        await page.getByText('Mais filtros').click();
        for (const id of ['#start', '#deadline', '#dayoff']) {
          const input = page.locator(id);
          const needed = await input.evaluate((el) => {
            const style = (el as HTMLElement).style;
            style.width = 'min-content';
            const width = el.getBoundingClientRect().width;
            style.width = '';
            return width;
          });
          expect(needed, id).toBeLessThanOrEqual((await input.boundingBox())!.width);
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

import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';
import { inflateSync } from 'node:zlib';
import { settled, showPlans } from './helpers';

const firstPlan = (page: Page) => page.locator('.plan').first();

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-01-10T12:00:00-03:00'));
  await page.goto('/');
});

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

/** Width and height of a JPEG, read from its start-of-frame marker. */
const jpegSize = (jpeg: Buffer) => {
  for (let at = 2; at < jpeg.length;) {
    const marker = jpeg[at + 1];
    if (marker >= 0xc0 && marker <= 0xc3)
      return [jpeg.readUInt16BE(at + 7), jpeg.readUInt16BE(at + 5)];
    at += 2 + jpeg.readUInt16BE(at + 2);
  }
  return null;
};

/** Any tone of our sea, from the light horizon to the deep bottom. */
const isSea = ([r, g, b]: number[]) => r <= 25 && g >= 35 && g <= 95 && b >= 60 && b <= 140;

test.describe('before the first click', () => {
  test('raised buttons are filled a step lighter than the trunk, so they float off it', async ({
    page,
  }) => {
    const fill = await page
      .getByRole('button', { name: 'Ver melhores datas' })
      .evaluate((button) => getComputedStyle(button).backgroundColor);
    expect(fill).toBe('rgb(101, 70, 47)');
  });

  test('taps show no blue browser highlight', async ({ page }) => {
    const color = await page.evaluate(
      () => getComputedStyle(document.querySelector('button')!).webkitTapHighlightColor,
    );
    expect(color).toBe('rgba(0, 0, 0, 0)');
  });

  test('is only as tall as its content on a phone', async ({ page }) => {
    const faqBottom = await page
      .locator('.faq .card')
      .evaluate((card) => card.getBoundingClientRect().bottom + scrollY);
    // The body, not the document: a document is never shorter than the window.
    const height = await page.evaluate(() => document.body.getBoundingClientRect().height);
    expect(height - faqBottom).toBeLessThanOrEqual(32); // the FAQ's bottom padding
  });

  for (const size of [
    { width: 1920, height: 1080 },
    { width: 3840, height: 2160 },
  ]) {
    test(`fills a ${size.width}x${size.height} screen with sea, no gap`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
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

  test('a phone in landscape keeps the form width when the plans appear', async ({ page }) => {
    await page.setViewportSize({ width: 833, height: 384 });
    const width = () => page.locator('form').evaluate((form) => form.getBoundingClientRect().width);
    const before = await width();
    await showPlans(page);
    expect(await width()).toBe(before);
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

  for (const [width, height] of [
    [1024, 768],
    [1440, 900],
    [1920, 1080],
  ]) {
    test(`on a ${width} px desktop the form keeps its width and the header stays aligned with it`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      const edges = () =>
        page.evaluate(() => {
          const form = document.querySelector('form')!.getBoundingClientRect();
          const title = document.querySelector('h1')!.getBoundingClientRect();
          return { width: form.width, formX: form.x, titleX: title.x };
        });
      const before = await edges();
      await showPlans(page);
      const after = await edges();
      expect(after.width).toBe(before.width);
      expect(Math.abs(before.titleX - before.formX)).toBeLessThan(1);
      expect(Math.abs(after.titleX - after.formX)).toBeLessThan(1);
    });
  }

  const countTransitions = (page: Page) =>
    page.addInitScript(() => {
      const start = document.startViewTransition?.bind(document);
      Object.assign(window, { transitions: 0 });
      if (start)
        document.startViewTransition = ((update: () => void) => {
          (window as unknown as { transitions: number }).transitions++;
          return start(update);
        }) as typeof document.startViewTransition;
    });

  test('the first click animates the plans in, once', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await countTransitions(page);
    await page.reload();
    await showPlans(page);
    await expect(page.locator('.results')).toBeFocused();
    await page.getByRole('button', { name: 'Ver melhores datas' }).click();
    expect(
      await page.evaluate(() => (window as unknown as { transitions: number }).transitions),
    ).toBe(1);
  });

  test('the first reveal morphs with the page still, then scrolls to the plans', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    // Scroll position when the morph starts and when it ends.
    await page.addInitScript(() => {
      const start = document.startViewTransition.bind(document);
      document.startViewTransition = ((update: () => Promise<void>) => {
        const transition = start(update);
        const log = ((window as unknown as { scrolls: number[] }).scrolls = []);
        transition.ready.then(() => log.push(scrollY));
        transition.finished.then(() => log.push(scrollY));
        return transition;
      }) as typeof document.startViewTransition;
    });
    await page.reload();
    await page.getByText('Mais filtros').click();
    await page.getByRole('button', { name: 'Ver melhores datas' }).click();
    await expect(page.locator('.results')).toBeFocused();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { scrolls: number[] }).scrolls))
      .toHaveLength(2);
    const [atStart, atEnd] = await page.evaluate(
      () => (window as unknown as { scrolls: number[] }).scrolls,
    );
    expect(atEnd).toBe(atStart);
    // Then the page glides to the plans, which line up with the top of the sticky form.
    await expect
      .poll(() =>
        page.locator('.results').evaluate((el) => Math.round(el.getBoundingClientRect().top)),
      )
      .toBe(16);
    // The form keeps showing its end, where the button was clicked, so it slides unchanged.
    await expect(page.getByRole('button', { name: 'Ver melhores datas' })).toBeInViewport();
    expect(
      await page
        .locator('.form > .card-body')
        .evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 1),
    ).toBe(true);
  });

  test('on a phone nothing slides: no transition, the page glides to the plans at once', async ({
    page,
  }) => {
    await countTransitions(page);
    await page.reload();
    await page.getByRole('button', { name: 'Ver melhores datas' }).click();
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 300 }).toBeGreaterThan(0);
    await expect
      .poll(() =>
        page.locator('.results').evaluate((el) => Math.round(el.getBoundingClientRect().top)),
      )
      .toBe(16);
    await expect(page.locator('.results')).toBeFocused();
    expect(
      await page.evaluate(() => (window as unknown as { transitions: number }).transitions),
    ).toBe(0);
  });

  test('with reduced motion the plans appear at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await countTransitions(page);
    await page.reload();
    await showPlans(page);
    expect(
      await page.evaluate(() => (window as unknown as { transitions: number }).transitions),
    ).toBe(0);
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
    await expect(firstPlan(page)).toContainText('+13 dias');
    await expect(page.locator('main')).not.toContainText('extra');
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
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await expect(firstPlan(page)).not.toHaveText(afterRemoval);
  });

  test('adds a missing holiday, lists it as added and removes it', async ({ page }) => {
    await page.getByText('Feriados no período').click();
    const add = page.getByRole('button', { name: 'Adicionar feriado', exact: true });
    await expect(add).toBeDisabled();
    // Erased text means no date, not the last one typed.
    await page.getByLabel('Adicionar feriado', { exact: true }).fill('12/05/2027');
    await expect(add).toBeEnabled();
    await page.getByLabel('Adicionar feriado', { exact: true }).fill('12/05');
    await expect(add).toBeDisabled();
    await page.getByLabel('Adicionar feriado', { exact: true }).fill('12/05/2027');
    await add.click();
    const item = page.locator('.holidays li', { hasText: 'Feriado adicionado' });
    await expect(item).toHaveCount(1);
    await expect(item).toContainText('12 Mai');
    await expect(page.getByLabel('Adicionar feriado', { exact: true })).toHaveValue('');

    await item.getByRole('button', { name: /^Remover Feriado adicionado de/ }).click();
    await expect(item).toHaveCount(0);
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
    const add = page.getByRole('button', { name: 'Adicionar', exact: true });
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

  test('counts the marked days out of 10 and stops adding at 10', async ({ page }) => {
    await page.getByText('Mais filtros').click();
    const group = page.locator('fieldset', { hasText: 'Dias já marcados' });
    await expect(group).toContainText('(0/10)');
    const add = page.getByRole('button', { name: 'Adicionar', exact: true });
    // Every other day, so each one is its own entry.
    for (let i = 0; i < 10; i++) {
      await page.getByLabel('Primeiro dia').fill(`${String(2 + 2 * i).padStart(2, '0')}/03/2027`);
      await add.click();
      await expect(group).toContainText(`(${i + 1}/10)`);
    }
    await expect(group.getByText('10 de 10 entradas')).toBeAttached();
    await page.getByLabel('Primeiro dia').fill('25/04/2027');
    await expect(add).toBeDisabled();
    await page.getByLabel('Primeiro dia').fill('03/03/2027'); // joins two entries
    await expect(add).toBeEnabled();
    await group
      .getByRole('button', { name: /^Remover/ })
      .first()
      .click();
    await expect(group).toContainText('(9/10)');
    await expect(add).toBeEnabled();
  });

  test('banco de horas days show as their own row and legend item', async ({ page }) => {
    await page.getByText('Mais filtros').click();
    await page
      .getByRole('button', { name: 'Mais um dia de banco de horas' })
      .click({ clickCount: 3 });
    await expect(page.getByLabel('Dias de banco de horas')).toHaveValue('3');
    await expect(page.getByText('Tirar todos seguidos')).toBeVisible();
    await expect(
      firstPlan(page).locator('.periods li', { hasText: 'banco de horas' }).first(),
    ).toContainText(/\d+ dias? de banco de horas/);
    await expect(page.locator('.legend')).toContainText('Banco de horas');
    await expect(page.locator('.legend')).toContainText('Feriado ou dia já marcado');
  });

  test('the banco de horas balance is for CLT only', async ({ page }) => {
    await page.getByText('Mais filtros').click();
    await expect(page.getByText('Saldo para encaixar')).toBeVisible();
    await page.getByRole('radio', { name: 'PJ' }).click();
    await expect(page.getByText('Saldo para encaixar')).toHaveCount(0);
    await expect(page.getByLabel('Dias de banco de horas')).toHaveCount(0);
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
        await page.getByRole('button', { name: 'Mais um dia de banco de horas' }).click();
        // The recomputed calendar fades in; axe must not read colours mid-fade.
        await expect(
          page.locator('.periods li', { hasText: 'banco de horas' }).first(),
        ).toBeVisible();
        await settled(page);
        // Equal options still fit a 360 px phone, each on one line.
        for (const radio of await page
          .getByRole('radiogroup', { name: 'Semana de trabalho' })
          .getByRole('radio')
          .all()) {
          expect((await radio.boundingBox())!.height).toBe(44);
        }
        await expect(page.locator('.chip')).toHaveCount(7);

        expect(await widest(page)).toBeLessThanOrEqual(width);
        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
        for (const button of await page.locator('button:visible, summary').all()) {
          const box = await button.boundingBox();
          expect(box?.height, await button.innerText()).toBeGreaterThanOrEqual(44);
        }
      });

      test('plans fit, with Compartilhar on the same row as the days count', async ({ page }) => {
        await showPlans(page);
        expect(await widest(page)).toBeLessThanOrEqual(width);
        const days = await firstPlan(page).locator('.days-off').boundingBox();
        const button = await firstPlan(page)
          .getByRole('button', { name: 'Compartilhar' })
          .boundingBox();
        expect(button!.height).toBeGreaterThanOrEqual(44);
        expect(button!.y).toBeLessThan(days!.y + days!.height);
        expect(button!.y + button!.height).toBeGreaterThan(days!.y);
        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
      });

      test('date fields are as wide as a date and its calendar button, not the column', async ({
        page,
      }) => {
        await page.getByText('Mais filtros').click();
        await page.getByText('Feriados no período').click();
        const fields = page.locator('app-date-field');
        for (const field of await fields.all()) {
          const box = (await field.boundingBox())!;
          expect(box.width).toBeLessThanOrEqual(170);
          const input = field.locator('input[type="text"]');
          await input.fill('28022027');
          expect(await input.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
        }
        expect(await widest(page)).toBeLessThanOrEqual(width);
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

test.describe('desktop form beside the plans', () => {
  test.use({ hasTouch: false, isMobile: false, viewport: { width: 1920, height: 1080 } });

  test('never grows past the screen: only its middle scrolls, title and button stay', async ({
    page,
  }) => {
    await showPlans(page);
    await page.getByText('Mais filtros').click();
    await page.getByText('Feriados no período').click();
    await page.getByRole('radio', { name: 'Outra' }).click();
    const form = page.locator('form.form');
    const body = form.locator('.card-body');
    await page.evaluate(() => window.scrollTo(0, 600));
    const box = (await form.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(1080);
    await expect(page.getByRole('heading', { name: 'Suas férias' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Ver melhores datas' })).toBeInViewport();

    await body.hover();
    await page.mouse.wheel(0, 5000);
    await expect
      .poll(() => body.evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 1))
      .toBe(true);
    await expect(page.locator('.holidays li').last()).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Ver melhores datas' })).toBeInViewport();
    expect(await page.evaluate(() => window.scrollY)).toBe(600);
  });
});

test('both switches slide one indicator under the chosen option', async ({ page }) => {
  await page.goto('/');
  // Where the indicator ends, relative to its group, and how long it takes to get there.
  const indicator = (group: string) =>
    page.getByRole('radiogroup', { name: group }).evaluate((el) => {
      const s = getComputedStyle(el, '::before');
      return { x: new DOMMatrix(s.transform).m41, duration: s.transitionDuration };
    });
  const offset = (name: string) =>
    page.getByRole('radio', { name }).evaluate((el) => (el as HTMLElement).offsetLeft - 3);

  await page.getByRole('radio', { name: 'PJ' }).click();
  expect((await indicator('Regime de trabalho')).duration).toBe('0.25s');
  await expect
    .poll(async () => Math.abs((await indicator('Regime de trabalho')).x - (await offset('PJ'))))
    .toBeLessThan(1);

  await page.getByText('Mais filtros').click();
  await page.getByRole('radio', { name: 'Outra' }).click();
  await expect
    .poll(async () => Math.abs((await indicator('Semana de trabalho')).x - (await offset('Outra'))))
    .toBeLessThan(1);

  // Equal options still fit a 360 px phone, each on one line.
  const week = page.getByRole('radiogroup', { name: 'Semana de trabalho' });
  for (const radio of await week.getByRole('radio').all()) {
    expect((await radio.boundingBox())!.height).toBe(44);
  }
});

test('search engines see one address: boasferias.app.br', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://boasferias.app.br/',
  );
  expect(await (await request.get('/robots.txt')).text()).toContain(
    'Sitemap: https://boasferias.app.br/sitemap.xml',
  );
  expect(await (await request.get('/sitemap.xml')).text()).toContain(
    '<loc>https://boasferias.app.br/</loc>',
  );
});

test('the chosen state adds its holidays and is remembered on this device', async ({ page }) => {
  await page.goto('/');
  const state = page.getByLabel('Estado');
  await expect(state).toHaveValue('');
  await showPlans(page);
  const holidays = page.locator('.holidays');
  await page.getByText('Feriados no período').click();
  await expect(holidays).not.toContainText('Revolução Constitucionalista');

  await state.selectOption({ label: 'São Paulo' });
  await expect(holidays).toContainText('Revolução Constitucionalista');

  await page.reload();
  await expect(page.getByLabel('Estado')).toHaveValue('SP');
});

test.describe('city', () => {
  const city = (page: Page) => page.getByRole('combobox', { name: 'Cidade' });

  test('appears once a state is chosen and offers only its cities', async ({ page }) => {
    await page.goto('/');
    await expect(city(page)).toHaveCount(0);
    await page.getByLabel('Estado').selectOption('SP');
    await city(page).fill('campi');
    const options = page.getByRole('listbox', { name: 'Cidades' }).getByRole('option');
    await expect(options.getByText('Campinas', { exact: true })).toBeVisible();
    await expect(options.filter({ hasText: 'Campina Grande' })).toHaveCount(0); // PB
  });

  test('picking one adds its holidays, drops the assumed Corpus Christi, and is remembered', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByLabel('Estado').selectOption('SP');
    await city(page).fill('santos');
    await city(page).press('ArrowDown');
    await city(page).press('Enter');
    await expect(city(page)).toHaveValue('Santos');
    await expect(page.getByText('base aberta')).toBeVisible();
    await showPlans(page);
    await page.getByText('Feriados no período').click();
    const holidays = page.locator('.holidays');
    await expect(holidays).toContainText('Monte Serrat'); // 8 Sep, Santos
    await expect(holidays).toContainText('Revolução Constitucionalista');
    await expect(holidays).toContainText('Sexta-feira Santa');
    await expect(holidays).not.toContainText('Corpus Christi');

    await page.reload();
    await expect(city(page)).toHaveValue('Santos');

    await page.getByLabel('Estado').selectOption('RJ');
    await expect(city(page)).toHaveValue('');
  });

  test('a capital is checked against city law: no community-source hint', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Estado').selectOption('RR');
    await city(page).fill('boa vista');
    await page
      .getByRole('listbox', { name: 'Cidades' })
      .getByText('Boa Vista', { exact: true })
      .click();
    await expect(city(page)).toHaveValue('Boa Vista');
    await expect(page.getByText('base aberta')).toHaveCount(0);
    await showPlans(page);
    await page.getByText('Feriados no período').click();
    // Only the checked rules have it; the community dataset missed it.
    await expect(page.locator('.holidays')).toContainText('Aniversário de Boa Vista');
  });

  test('Brasília has no city holidays and no hint asking for them', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Estado').selectOption('DF');
    await city(page).fill('brasília');
    await page
      .getByRole('listbox', { name: 'Cidades' })
      .getByText('Brasília', { exact: true })
      .click();
    await expect(city(page)).toHaveValue('Brasília');
    await expect(page.getByText(/Não temos os feriados|base aberta/)).toHaveCount(0);
  });

  test('works by keyboard and passes axe', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Estado').selectOption('SP');
    await city(page).fill('santo');
    await expect(city(page)).toHaveAttribute('aria-expanded', 'true');
    await city(page).press('Escape');
    await expect(city(page)).toHaveAttribute('aria-expanded', 'false');
    const results = await new AxeBuilder({ page }).include('.form').analyze();
    expect(results.violations).toEqual([]);
  });

  test('if the cities fail to load, the state still counts and plans still work', async ({
    page,
  }) => {
    await page.route('**/holidays/*.json', (route) => route.abort());
    await page.goto('/');
    await page.getByLabel('Estado').selectOption('SP');
    await expect(page.getByText('Não foi possível carregar as cidades')).toBeVisible();
    await showPlans(page);
    await page.getByText('Feriados no período').click();
    await expect(page.locator('.holidays')).toContainText('Revolução Constitucionalista');
  });
});

for (const width of [320, 360, 412]) {
  test(`at ${width} px the whole "Compartilhar" label shows`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await showPlans(page);
    const share = firstPlan(page).getByRole('button', { name: 'Compartilhar' });
    expect(await share.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });
}

test.describe('sharing on desktop', () => {
  test.use({ hasTouch: false, isMobile: false, viewport: { width: 1280, height: 800 } });
  test.beforeEach(async ({ page }) => showPlans(page));

  test('floating buttons keep their colour on hover; Compartilhar floats on the sand', async ({
    page,
  }) => {
    const fillOf = (name: string) =>
      page
        .getByRole('button', { name })
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);
    const before = await fillOf('Ver no calendário');
    await page.getByRole('button', { name: 'Ver no calendário' }).first().hover();
    expect(await fillOf('Ver no calendário')).toBe(before);

    const share = firstPlan(page).getByRole('button', { name: 'Compartilhar' });
    const style = await share.evaluate((el) => {
      const s = getComputedStyle(el);
      return { fill: s.backgroundColor, image: s.backgroundImage, shadow: s.boxShadow };
    });
    expect(style.fill).toBe('rgb(249, 238, 216)');
    expect(style.image).toBe('none');
    expect(style.shadow).toContain('-4px 3px 0px');
  });

  test('hover sweeps a band of light across a floating button', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Ver no calendário' }).first();
    const band = () => button.evaluate((el) => getComputedStyle(el, '::after').transform);
    const parked = await band();
    await button.hover();
    await expect.poll(band).not.toBe(parked);
    const light = firstPlan(page).getByRole('button', { name: 'Compartilhar' });
    expect(await light.evaluate((el) => getComputedStyle(el, '::after').backgroundImage)).toContain(
      'rgb(255, 255, 255)',
    );
  });

  test('reduced motion shows no band of light', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const button = page.getByRole('button', { name: 'Ver no calendário' }).first();
    expect(await button.evaluate((el) => getComputedStyle(el, '::after').display)).toBe('none');
  });

  test('on desktop, Compartilhar downloads the plan as a 1080x1350 JPEG', async ({ page }) => {
    const download = page.waitForEvent('download');
    await firstPlan(page).getByRole('button', { name: 'Compartilhar' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('boas-ferias-plano-a.jpg');
    const { readFileSync } = await import('node:fs');
    expect(jpegSize(readFileSync(await file.path()))).toEqual([1080, 1350]);
  });
});

test.describe('sharing on a phone', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 412, height: 915 } });

  const stubShare = (page: Page, outcome: 'ok' | 'cancel') =>
    page.addInitScript((outcome) => {
      const shared: { files: { name: string; type: string }[]; text?: string; url?: string }[] = [];
      Object.assign(window, { shared });
      navigator.canShare = () => true;
      navigator.share = async (data?: ShareData) => {
        shared.push({
          ...data,
          files: (data?.files ?? []).map((f) => ({ name: f.name, type: f.type })),
        });
        if (outcome === 'cancel') throw new DOMException('Share canceled', 'AbortError');
      };
    }, outcome);

  test('Compartilhar opens the share sheet with the image only', async ({ page }) => {
    await stubShare(page, 'ok');
    await page.reload();
    await showPlans(page);
    await firstPlan(page).getByRole('button', { name: 'Compartilhar' }).click();
    await expect.poll(() => page.evaluate(() => (window as any).shared.length)).toBe(1);
    const [shared] = await page.evaluate(() => (window as any).shared);
    expect(shared.files).toEqual([{ name: 'boas-ferias-plano-a.jpg', type: 'image/jpeg' }]);
    expect(shared.text).toBeUndefined();
    expect(shared.url).toBeUndefined();
  });

  test('closing the share sheet shows no error', async ({ page }) => {
    await stubShare(page, 'cancel');
    await page.reload();
    await showPlans(page);
    await firstPlan(page).getByRole('button', { name: 'Compartilhar' }).click();
    await expect.poll(() => page.evaluate(() => (window as any).shared.length)).toBe(1);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

test.describe('FAQ', () => {
  test('ships in the page HTML with its search data, and opens on tap', async ({
    page,
    request,
  }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain('Quantos dias de férias tenho na CLT?');
    const types = [
      ...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g),
    ].map((m) => JSON.parse(m[1])['@type']);
    expect(types.sort()).toEqual(['FAQPage', 'WebApplication']);

    const faq = page.getByRole('region', { name: 'Perguntas frequentes' });
    const answer = faq.getByText(/art\. 134, §1º/);
    await expect(answer).toBeHidden();
    await faq.getByText('Posso dividir as férias?').click();
    await expect(answer).toBeVisible();
    await faq.getByText('Posso dividir as férias?').click();
    await expect(answer).toBeHidden();
    const { violations } = await new AxeBuilder({ page }).include('.faq').analyze();
    expect(violations).toEqual([]);
  });

  test('llms.txt tells AI tools what the site does', async ({ request }) => {
    const response = await request.get('/llms.txt');
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain('# Boas Férias');
  });
});

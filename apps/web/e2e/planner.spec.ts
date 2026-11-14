import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';

const firstPlan = (page: Page) => page.locator('.plan').first();

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-01-10T12:00:00-03:00'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Plano 1', exact: true })).toBeVisible();
});

test('ranks CLT plans with the defaults and shows the first on a calendar', async ({ page }) => {
  await expect(firstPlan(page)).toContainText('43 dias de folga');
  await expect(firstPlan(page)).toContainText('+13 extras');
  const days = page.locator('.plan.selected').locator('.day.vacation, .day.counted');
  await expect(days).toHaveCount(30);
});

test('groups ties and labels days the CLT counts as vacation', async ({ page }) => {
  await expect(firstPlan(page)).toContainText('Mais 9 planos empatam com este');
  await expect(page.getByText('Contado como férias pela CLT')).toBeVisible();
  await expect(page.locator('.plan')).toHaveCount(3);
  await page.getByRole('button', { name: 'Ver mais 7 planos' }).click();
  await expect(page.locator('.plan')).toHaveCount(10);
});

test('removing a holiday or adding a day off changes the results', async ({ page }) => {
  await page.getByText('Mais opções').click();
  const before = await firstPlan(page).innerText();
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Sexta-feira Santa' })
    .getByRole('button', { name: 'Remover' })
    .click();
  await expect(firstPlan(page)).not.toHaveText(before);

  const afterRemoval = await firstPlan(page).innerText();
  await page.getByLabel('Data da folga').fill('2027-02-09');
  await page.getByRole('button', { name: 'Adicionar' }).click();
  await expect(firstPlan(page)).not.toHaveText(afterRemoval);
});

test('shows an error for invalid input and an empty state for an impossible window', async ({
  page,
}) => {
  await page.getByLabel('Dias de férias').fill('3');
  await expect(page.getByText('Na CLT, use de 5 a 30 dias')).toBeVisible();

  await page.getByLabel('Dias de férias').fill('30');
  await page.getByText('Mais opções').click();
  await page.getByLabel('Terminar até').fill('2027-02-20');
  await expect(page.getByText('Nenhum plano cabe')).toBeVisible();
});

test('computes off the main thread', async ({ page }) => {
  expect(page.workers().length).toBeGreaterThan(0);
  await page.getByRole('radio', { name: 'PJ' }).click();
  await expect(firstPlan(page)).toContainText('dias úteis');
});

test('is accessible and fits a 360 px screen', async ({ page }) => {
  await page.getByText('Mais opções').click();
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  for (const button of await page.locator('button:visible, summary').all()) {
    const box = await button.boundingBox();
    expect(box?.height, await button.innerText()).toBeGreaterThanOrEqual(44);
  }
});

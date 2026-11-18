import { Page, expect } from '@playwright/test';

export const showPlans = async (page: Page) => {
  await page.getByRole('button', { name: 'Ver melhores datas' }).click();
  await expect(page.getByRole('heading', { name: 'Plano A', exact: true })).toBeVisible();
  await settled(page);
};

/** The first reveal slides, then scrolls to the plans: wait for both to end. */
export const settled = async (page: Page) => {
  await page.waitForFunction(() => document.getAnimations().length === 0);
  await page.waitForFunction(
    () =>
      new Promise<boolean>((still) => {
        const y = scrollY;
        const frames = (n: number): unknown =>
          n ? requestAnimationFrame(() => frames(n - 1)) : still(scrollY === y);
        frames(4);
      }),
  );
};

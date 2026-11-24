import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing shows hero and CTA above the fold', async ({ page }) => {
  await page.goto('/');
  const cta = page.getByRole('link', { name: 'Try the demo' });
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  await expect(cta).toBeInViewport();
});

test('landing has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

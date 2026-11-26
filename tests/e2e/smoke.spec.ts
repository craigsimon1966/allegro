import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing hero and CTA are above the fold at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('main').getByRole('link', { name: /Try the demo/ })).toBeInViewport({
    ratio: 1,
  });
});

for (const path of ['/', '/styleguide', '/about-demo', '/pathway']) {
  test(`${path} has no accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
    ).toEqual([]);
  });
}

test('no white text on sage anywhere on the landing page', async ({ page }) => {
  await page.goto('/');
  const offenders = await page.evaluate(() => {
    const sage = 'rgb(128, 168, 128)';
    const bgOf = (el: Element | null): string => {
      while (el) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg !== 'rgba(0, 0, 0, 0)') return bg;
        el = el.parentElement;
      }
      return '';
    };
    return [...document.querySelectorAll('body *')]
      .filter(
        (el) =>
          el.childNodes.length &&
          [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()),
      )
      .filter((el) => getComputedStyle(el).color === 'rgb(255, 255, 255)' && bgOf(el) === sage)
      .map((el) => el.textContent?.trim());
  });
  expect(offenders).toEqual([]);
});

test('the Allegro logo heads app screens on phones as well as laptops', async ({ page }) => {
  await page.route('**/api/**', (r) => r.abort());
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await page.goto('/pathway');
  const logos = page.getByRole('link', { name: 'Allegro Learning home' });
  await expect(logos.filter({ visible: true })).toHaveCount(1);
});

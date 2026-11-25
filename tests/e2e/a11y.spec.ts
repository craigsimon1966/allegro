import { expect, test, type Page } from '@playwright/test';

// Automated parts of docs/a11y-checklist.md. A person still does the screen reader rows.

const SCREENS = [
  '/',
  '/demo',
  '/about-demo',
  '/pathway',
  '/needs',
  '/growth',
  '/plan',
  '/help',
  '/me',
];

async function asTammy(page: Page) {
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await expect(page).toHaveURL(/\/needs$/);
  await page.getByRole('button', { name: /Build my week/ }).click();
  await expect(page).toHaveURL(/\/pathway$/);
}

test('the first Tab on every screen is a skip link that moves focus into the main content', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'laptop', 'keyboard check runs on the laptop size');
  await asTammy(page);
  for (const path of SCREENS) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip, path).toBeFocused();
    await expect(skip, path).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main'), path).toBeFocused();
    // The next Tab lands on something inside main, not back in the sidebar.
    await page.keyboard.press('Tab');
    const inMain = await page.evaluate(
      () => !!document.activeElement && !!document.activeElement.closest('main'),
    );
    expect(inMain, path).toBe(true);
  }
});

test('keyboard focus is always visible on This week', async ({ page }, info) => {
  test.skip(info.project.name !== 'laptop', 'keyboard check runs on the laptop size');
  await asTammy(page);
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const visible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return true;
      const cs = getComputedStyle(el);
      return cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px';
    });
    expect(visible, `Tab ${i + 1}`).toBe(true);
  }
});

for (const size of [
  { name: '320px wide (200% zoom on a 640px window)', width: 320, height: 640 },
  { name: 'Chromebook 1366 x 768', width: 1366, height: 768 },
]) {
  test(`no sideways scrolling at ${size.name}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'laptop', 'sizes are set here, so run once');
    await page.setViewportSize({ width: size.width, height: size.height });
    await asTammy(page);
    for (const path of SCREENS) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });
}

test('with reduced motion, the loading mark does not animate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/styleguide');
  const circle = page.locator('.allegro-mark-loading circle').first();
  await expect(circle).toHaveCount(1);
  expect(await circle.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});

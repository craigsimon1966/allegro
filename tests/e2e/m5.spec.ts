import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// M5: leader preview and pilot feedback.

async function axeClean(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
  ).toEqual([]);
}

test('leader preview is clearly fictional and shows no teacher names', async ({ page }) => {
  await page.goto('/leader');
  await expect(page.getByText(/Preview with fictional data/)).toBeVisible();
  await expect(page.getByText(/fictional/).first()).toBeVisible();
  for (const name of ['Tammy', 'Sam', 'Priya']) await expect(page.getByText(name)).toHaveCount(0);
  await axeClean(page);
});

test('thumbs and the survey send anonymous feedback', async ({ page }) => {
  const bodies: Record<string, unknown>[] = [];
  await page.route('**/api/feedback', async (r) => {
    bodies.push(r.request().postDataJSON() as Record<string, unknown>);
    await r.fulfill({ status: 204 });
  });
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await page.getByRole('button', { name: /Build my week/ }).click();
  await page.getByRole('button', { name: 'Helpful' }).click();
  await page.getByLabel(/Anything to add/).fill('Fits my Tuesday off.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Thanks for the feedback.')).toBeVisible();
  expect(bodies.map((b) => b.target)).toEqual(['pathway', 'pathway']);
  expect(bodies[1]).toMatchObject({ thumbs: 1, comment: 'Fits my Tuesday off.' });

  await page.goto('/survey');
  await axeClean(page);
  await page
    .getByRole('group', { name: /needs identified/ })
    .getByText('Agree', { exact: true })
    .click();
  await page.getByLabel(/more useful/).fill('More units on graphs.');
  await page.getByRole('button', { name: 'Send my answers' }).click();
  await expect(page.getByText(/Thank you/)).toBeVisible();
  expect(bodies.at(-1)).toMatchObject({ target: 'survey', scores: { q1: 4 } });
  for (const b of bodies) expect(Object.keys(b)).not.toContain('userId');
});

test('about page covers SPEC 7.12 and lets a demo user clear their data', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await page.goto('/about-demo');
  for (const h of [
    'What this demo does, and does not do',
    'How AI is used',
    'Your data',
    'Who to contact',
    'Delete your account and data',
  ])
    await expect(page.getByText(h, { exact: true })).toBeVisible();
  await axeClean(page);
  await page.getByRole('button', { name: 'Clear demo data from this browser' }).click();
  await expect(page).toHaveURL(/\/$/);
  const mode = await page.evaluate(() => localStorage.getItem('allegro-demo'));
  expect(mode ?? '').not.toContain('"mode":"demo"');
});

test('admin feedback sends anyone not signed in home', async ({ page }) => {
  await page.goto('/admin/feedback');
  await expect(page).toHaveURL(/\/$/);
});

import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// M2: Tammy goes from her needs to her week and finishes a micro-unit.

async function axeClean(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
  ).toEqual([]);
}

test("Tammy's week and a full micro-unit", async ({ page }) => {
  await page.route('**/api/**', (r) => r.abort());
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await expect(page).toHaveURL(/\/needs$/);
  await page.getByRole('button', { name: /Build my week/ }).click();

  await expect(page).toHaveURL(/\/pathway$/);
  await expect(page.getByRole('heading', { level: 1, name: 'This week' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Before Monday, Year 8/ })).toBeVisible();
  await expect(page.getByText(/Mon, Wed and Thu are teaching days/)).toBeVisible();
  await axeClean(page);

  await page.getByRole('button', { name: 'Why this?' }).first().click();
  await expect(page.getByText(/You told us/).first()).toBeVisible();
  await page.getByRole('button', { name: /down$/ }).first().click();

  await page.getByRole('link', { name: /^Start:/ }).click();
  await expect(page).toHaveURL(/\/learn\//);
  await expect(page.getByRole('heading', { level: 1, name: 'Why it matters' })).toBeVisible();
  await expect(page.getByText('Draft content, not yet reviewed')).toBeVisible();
  await axeClean(page);

  while (!(await page.getByRole('heading', { level: 1, name: 'Quick check' }).isVisible())) {
    await page.getByRole('button', { name: /Next/ }).click();
  }
  await axeClean(page);
  const radio = page.getByRole('radio').first();
  if (await radio.isVisible()) await radio.check();
  else await page.getByLabel('Your answer').first().fill('1');
  await page.getByRole('button', { name: 'Check my answer' }).first().click();
  await expect(page.getByText(/Correct\.|Not quite\./).first()).toBeVisible();

  await page.getByRole('button', { name: /Next/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Try it tomorrow' })).toBeVisible();
  await page.getByRole('button', { name: 'Add to my lesson' }).click();
  await expect(page.getByRole('button', { name: 'Added to my lesson' })).toBeDisabled();

  await page.getByRole('button', { name: /Next/ }).click();
  await page.getByRole('textbox').fill('Testing their own rule seems powerful.');
  await axeClean(page);
  await page.getByRole('button', { name: 'Finish and back to my week' }).click();

  await expect(page).toHaveURL(/\/pathway$/);
  await expect(page.getByLabel('Done')).toHaveCount(1);
  await expect(page.getByRole('link', { name: /^Continue:/ })).toBeVisible();

  // The unit's one-line note appears in the growth view (SPEC 7.6).
  await page.goto('/growth');
  await expect(page.getByText('Testing their own rule seems powerful.')).toBeVisible();
});

test('Explain this differently shows a labelled AI answer', async ({ page }) => {
  await page.route('**/api/explain', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: 'Start where $x = 0$, then add the same amount each step.',
    }),
  );
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await page.goto('/learn/lin-02-table-to-rule');
  await page.getByRole('button', { name: /Next/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'The core idea' })).toBeVisible();
  await page.getByRole('button', { name: 'Explain this differently' }).click();
  await page.getByRole('button', { name: 'More simply' }).click();
  await expect(page.getByText('Drafted by Allegro AI. Please check before using.')).toBeVisible();
  await expect(page.getByText(/then add the same amount/)).toBeVisible();
  await axeClean(page);
});

test('Explain this differently says so when the AI is down', async ({ page }) => {
  await page.route('**/api/explain', (r) => r.abort());
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await page.goto('/learn/lin-02-table-to-rule');
  await page.getByRole('button', { name: /Next/ }).click();
  await page.getByRole('button', { name: 'Explain this differently' }).click();
  await page.getByRole('button', { name: 'With a different example' }).click();
  await expect(page.getByText(/couldn't reach Allegro/)).toBeVisible();
});

test('tapping the middle of an unrated concern slider records 3 of 5', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /Sam/ }).click();
  await expect(page).toHaveURL(/\/needs$/);
  const slider = page.getByRole('slider').first();
  await expect(
    page.getByText(/How much of a concern is this for you\? Not rated/).first(),
  ).toBeVisible();
  await slider.click();
  await expect(slider).toHaveAttribute('aria-valuetext', '3 of 5');
});

test('on a laptop, units can be dragged into a new order', async ({ page }, info) => {
  test.skip(info.project.name !== 'laptop');
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await page.goto('/pathway');
  const rows = page.locator('li[draggable="true"]');
  const titles = async () =>
    (await rows.allInnerTexts()).map((t) => t.split('\n').find((l) => l.trim().length > 3));
  await expect(rows.first()).toBeVisible();
  const before = await titles();
  // Grab by the margin number, away from the row's links, buttons and day picker.
  await rows.nth(0).dragTo(rows.nth(2), {
    sourcePosition: { x: 20, y: 20 },
    targetPosition: { x: 20, y: 20 },
  });
  await expect.poll(titles).not.toEqual(before);
  const after = await titles();
  expect(after[2]).toBe(before[0]);
  expect(after[0]).toBe(before[1]);
});

test('This week has optional further reading from approved sources only', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /Priya/ }).click();
  await page.goto('/pathway');
  await page.getByText('Further reading (optional)').click();
  const reSolve = page.getByRole('link', { name: /reSolve Maths/ });
  await expect(reSolve).toHaveAttribute('href', 'https://resolve.edu.au/');
  await expect(reSolve).toHaveAttribute('target', '_blank');
  // Priya teaches Year 1, so the 7 to 10 syllabus page is left out.
  await expect(page.getByRole('link', { name: /7–10 syllabus/ })).toHaveCount(0);
});

test('a unit can be moved to another day, and the choice is kept', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await page.goto('/pathway');
  const day = page.getByRole('combobox', { name: /^Day for / }).first();
  await expect(day).toBeVisible();
  // Tammy teaches Mon, Wed and Thu, so those days are marked.
  await expect(day.locator('option', { hasText: '(teaching)' })).toHaveCount(3);
  const monday = await day.locator('option').first().getAttribute('value');
  await day.selectOption(monday!);
  await page.reload();
  await expect(page.getByRole('combobox', { name: /^Day for / }).first()).toHaveValue(monday!);
  await axeClean(page);
});

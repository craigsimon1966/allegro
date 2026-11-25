import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Quick checks that adapt: an incremental question is not moved on after a wrong answer.

async function axeClean(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
  ).toEqual([]);
}

async function toQuickCheck(page: Page, unitId: string) {
  await page.route('**/api/**', (r) => r.abort());
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await expect(page).toHaveURL(/\/needs$/);
  await page.goto(`/learn/${unitId}`);
  while (!(await page.getByRole('heading', { level: 1, name: 'Quick check' }).isVisible())) {
    await page.getByRole('button', { name: /Next/ }).click();
  }
}

const pick = (page: Page, value: string) =>
  page.locator(`input[type="radio"][value="${value}"]`).check();
const check = (page: Page) => page.getByRole('button', { name: 'Check my answer' });

test('a wrong answer gets targeted feedback and a parallel item before question 2', async ({
  page,
}) => {
  await toQuickCheck(page, 'lin-02-table-to-rule');
  await expect(page.getByText('Question 1 of 2')).toBeVisible();
  await expect(page.getByText('Question 2 of 2')).toHaveCount(0);
  await expect(page.getByText(/Question 2 builds on this one/)).toBeVisible();

  await pick(page, '$y = x + 4$');
  await check(page).click();
  await expect(page.getByText('Not quite.')).toBeVisible();
  await expect(page.getByText(/tells you the number in front of/)).toBeVisible();
  await expect(page.getByText(/try one like it first/)).toBeVisible();
  await axeClean(page);
  await page.getByRole('button', { name: 'Try one like it' }).click();

  await expect(page.getByText(/follow-up 1 of 2/)).toBeVisible();
  await pick(page, '$y = 3x + 2$');
  await check(page).click();
  await expect(page.getByText('You used the feedback. On to the next question.')).toBeVisible();
  await expect(page.getByText('Question 2 of 2')).toBeVisible();
  await axeClean(page);
});

test('wrong twice shows a worked solution, and moving on flags it as a need', async ({ page }) => {
  await toQuickCheck(page, 'lin-02-table-to-rule');
  await pick(page, '$y = 5x + 4$');
  await check(page).click();
  await page.getByRole('button', { name: 'Try one like it' }).click();
  await pick(page, '$y = x + 3$');
  await check(page).click();

  await expect(page.getByRole('heading', { name: 'Worked solution' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try one more' })).toBeVisible();
  await axeClean(page);
  await page.getByRole('button', { name: 'Move on for now' }).click();
  await expect(page.getByText(/We've noted this skill/)).toBeVisible();
  await expect(page.getByText('Question 2 of 2')).toBeVisible();

  await page.goto('/needs');
  await expect(page.getByText('From your quick checks')).toBeVisible();
  await expect(page.getByText('Worth another look')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go over it again' })).toBeVisible();
  await expect(page.getByText('Already in your needs')).toBeVisible();
  await axeClean(page);
});

test('questions that do not build on each other still move on', async ({ page }) => {
  await toQuickCheck(page, 'lin-04-graphing-errors');
  await expect(page.getByText('Question 2 of 2')).toBeVisible();
  await pick(page, 'Uneven scale');
  await check(page).first().click();
  await expect(page.getByText('Not quite.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try one like it' })).toHaveCount(0);
});

import { expect, test } from '@playwright/test';

// Curriculum codes are shown only after they pass the official-list and year checks, and the
// teacher's own year and state shape what they see.

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (r) => r.abort());
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
});

test('the week says who it is built for and shows checked codes for each unit', async ({
  page,
}) => {
  await page.goto('/pathway');
  await expect(page.getByTestId('built-for').first()).toContainText(
    'Year 8, NSW Stage 4, teaching out of field',
  );
  const codes = page.getByTestId('curriculum-codes').first();
  await expect(codes).toBeVisible();
  await expect(page.locator('body')).not.toContainText('TODO');
  // Year 9 codes on a Year 8 and 9 unit stay hidden for a Year 8 teacher.
  await expect(page.locator('body')).not.toContainText('AC9M9');
});

test('plan a lesson: year first, topics for that year, codes with their official wording', async ({
  page,
}) => {
  await page.goto('/plan');
  const year = page.getByLabel('Year level');
  const topic = page.getByLabel(/^Topic for/);
  await expect(year).toHaveValue('8');
  const yearBox = await year.boundingBox();
  const topicBox = await topic.boundingBox();
  expect(yearBox!.y).toBeLessThan(topicBox!.y);

  await year.selectOption('1');
  await expect(topic.locator('option')).toHaveText([
    'Early number (counting, subitising, part-part-whole)',
    'Patterns, skip counting and equal groups',
    'Measuring length, mass, capacity and time',
    'Shapes, objects and position',
    'Collecting, sorting and showing data',
  ]);
  await year.selectOption('4');
  await expect(topic.locator('option')).toHaveCount(5);
  await expect(
    topic.locator('option', { hasText: 'Fractions, decimals and percentages' }),
  ).toHaveCount(1);

  await year.selectOption('8');
  await topic.selectOption('algebra.linear');
  await page.getByRole('button', { name: /Draft my lesson/ }).click();
  await expect(page.getByTestId('built-for')).toContainText('Year 8, NSW Stage 4');
  const code = page.getByText('AC9M8A02', { exact: true });
  await code.click();
  await expect(
    page.getByText(/Year 8: graph linear relations on the Cartesian plane/),
  ).toBeVisible();
  await expect(page.getByText('MA4-LIN-C-01', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('TODO');
});

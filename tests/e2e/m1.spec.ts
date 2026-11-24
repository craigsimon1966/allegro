import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import personas from '../../content/personas.json' with { type: 'json' };

// M1 paths with the AI mocked (TECH_SPEC 14, M1 done-when).

const tammyDiagnosis = personas.personas[0]!.cachedDiagnosis;

async function axeClean(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
  ).toEqual([]);
}

test("Tammy's demo path reaches her needs and finishes Check yourself", async ({ page }) => {
  let aiCalls = 0;
  await page.route('**/api/diagnose', (r) => {
    aiCalls++;
    return r.abort();
  });
  await page.goto('/demo');
  await axeClean(page);
  await page.getByRole('button', { name: /Tammy/ }).click();

  await expect(page).toHaveURL(/\/needs$/);
  await expect(page.getByRole('heading', { level: 1, name: "Here's what we heard" })).toBeVisible();
  await expect(page.getByText('Drafted by Allegro AI. Please check before using.')).toBeVisible();
  await axeClean(page);

  await page.getByRole('button', { name: 'Check yourself · 2 min' }).first().click();
  for (let q = 0; q < 4; q++) {
    const radio = page.getByRole('radio').first();
    if (await radio.isVisible()) await radio.check();
    else await page.getByLabel('Your answer').fill('2');
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await page.getByRole('button', { name: /Next question|See how I went/ }).click();
  }
  await expect(page.getByText(/Solid|Worth a refresh|Start here/).first()).toBeVisible();
  await expect(page.getByText(/out of 100|%/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Back to my needs' }).click();

  await page.getByRole('button', { name: /Build my week/ }).click();
  await expect(page).toHaveURL(/\/pathway$/);
  expect(aiCalls).toBe(0);
});

async function startOwn(page: Page) {
  await page.goto('/demo');
  await page.getByRole('button', { name: /own situation/ }).click();
  await expect(page).toHaveURL(/\/start$/);
}

test('own situation with the AI mocked goes to needs', async ({ page }) => {
  await page.route('**/api/diagnose', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(tammyDiagnosis),
    }),
  );
  await startOwn(page);
  await axeClean(page);
  await page
    .getByLabel('Your situation')
    .fill('I teach PE and now have a Year 8 maths class doing linear relationships.');
  await page.getByRole('button', { name: /Show me what I need/ }).click();
  await expect(page).toHaveURL(/\/needs$/);
  await expect(page.getByText(tammyDiagnosis.summary)).toBeVisible();
});

test('invalid AI output falls back to the guided questions', async ({ page }) => {
  await page.route('**/api/diagnose', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"summary": 42}' }),
  );
  await startOwn(page);
  await page.getByLabel('Your situation').fill('Year 8 maths, linear relationships next week.');
  await page.getByRole('button', { name: /Show me what I need/ }).click();
  await expect(page.getByRole('alert')).toContainText("couldn't make sense");
  await page.getByRole('button', { name: 'Use the guided questions instead' }).click();
  await page.getByLabel('Your role').selectOption('out_of_field');
  await page.getByRole('button', { name: 'Skip the AI, use my answers' }).click();
  await expect(page).toHaveURL(/\/needs$/);
  await expect(page.getByText(/couldn't reach Allegro's AI/)).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 3, name: /^Linear relationships/ }),
  ).toBeVisible();
});

test('a student name blocks sending', async ({ page }) => {
  let aiCalls = 0;
  await page.route('**/api/diagnose', (r) => {
    aiCalls++;
    return r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(tammyDiagnosis),
    });
  });
  await startOwn(page);
  await page
    .getByLabel('Your situation')
    .fill('One student, Jack Smith, finds algebra really hard.');
  await page.getByRole('button', { name: /Show me what I need/ }).click();
  await expect(page.getByRole('alert')).toContainText('Jack Smith');
  await expect(page).toHaveURL(/\/start$/);
  expect(aiCalls).toBe(0);
});

test('sign-in page is accessible', async ({ page }) => {
  await page.goto('/signin');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await axeClean(page);
});

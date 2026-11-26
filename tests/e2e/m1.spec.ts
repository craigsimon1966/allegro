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
    .getByLabel('Tell us more about your situation')
    .fill('I teach PE and now have a Year 8 maths class doing linear relationships.');
  await page.getByRole('button', { name: /Show me what I need/ }).click();
  await expect(page).toHaveURL(/\/needs$/);
  await expect(page.getByText(tammyDiagnosis.summary)).toBeVisible();
});

test('situation choices and days a week go to the AI as fixed facts', async ({ page }) => {
  let sent: { situationText?: string; guided?: Record<string, unknown> } = {};
  await page.route('**/api/diagnose', (r) => {
    sent = r.request().postDataJSON();
    return r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(tammyDiagnosis),
    });
  });
  await startOwn(page);
  await page.getByLabel('Your role').selectOption('classroom');
  await page.getByText('Confident in maths, new to this year level or stage').click();
  const newTo = page.getByRole('group', { name: /^New to/ });
  await newTo.getByText('Yr 5').click();
  await page
    .getByRole('group', { name: /^Confident teaching/ })
    .getByText('Yr 2')
    .click();
  await page.getByText('More details (optional)').click();
  await page.getByLabel('How many days a week do you teach?').selectOption('3');
  await axeClean(page);
  // No writing needed once a situation is chosen.
  await page.getByRole('button', { name: /Show me what I need/ }).click();
  await expect(page).toHaveURL(/\/needs$/);
  expect(sent.situationText).toMatch(/new to this year level or stage/);
  expect(sent.guided).toMatchObject({
    role: 'classroom',
    situations: ['new_stage'],
    newToYears: ['5'],
    confidentYears: ['2'],
    teachingDaysPerWeek: 3,
  });
});

test('the situation ticks follow the role, and year levels sit beside the state', async ({
  page,
}) => {
  await startOwn(page);
  await expect(
    page.getByText('Experienced and confident, looking to sharpen my practice'),
  ).toBeVisible();
  await page.getByText('In my first few years of teaching').click();
  await page.getByLabel('Your role').selectOption('hod');
  await expect(page.getByText('New to leading a maths team')).toBeVisible();
  await expect(page.getByText('In my first few years of teaching')).toHaveCount(0);
  await page.getByText('Still teaching my own classes').click();
  await expect(page.getByText('In my first few years of teaching')).toBeVisible();
  // The first tick was dropped when the role changed, so it isn't ticked now.
  await expect(page.getByLabel('In my first few years of teaching')).not.toBeChecked();
  const state = await page.getByLabel('State or territory').boundingBox();
  const years = await page.getByRole('group', { name: 'Year levels you teach' }).boundingBox();
  const role = await page.getByLabel('Your role').boundingBox();
  expect(years!.y).toBeLessThan(role!.y);
  if ((page.viewportSize()?.width ?? 0) >= 1024)
    expect(Math.abs(years!.y - state!.y)).toBeLessThan(40);
  await axeClean(page);
});

test('invalid AI output falls back to the guided questions', async ({ page }) => {
  await page.route('**/api/diagnose', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"summary": 42}' }),
  );
  await startOwn(page);
  await page
    .getByLabel('Tell us more about your situation')
    .fill('Year 8 maths, linear relationships next week.');
  await page.getByRole('button', { name: /Show me what I need/ }).click();
  await expect(page.getByRole('alert')).toContainText("couldn't make sense");
  await page.getByRole('button', { name: 'Use the guided questions instead' }).click();
  await page.getByLabel('Your role').selectOption('classroom');
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
    .getByLabel('Tell us more about your situation')
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

test("own situation: This week uses the AI's checked choices, or rules if the AI is down", async ({
  page,
}) => {
  await page.route('**/api/diagnose', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(tammyDiagnosis),
    }),
  );
  const need = tammyDiagnosis.needs[0]!;
  let pathwayCalls = 0;
  await page.route('**/api/pathway', (r) => {
    pathwayCalls++;
    return r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            unitId: 'lin-02-table-to-rule',
            needId: need.id,
            reason: 'You said tables make sense, so this turns one into a rule.',
            scheduledFor: '2026-11-24',
            sortOrder: 0,
          },
        ],
        external: [{ sourceId: 'resolve', reason: 'Has ready tasks on tables and rules.' }],
        source: 'ai',
      }),
    });
  });
  await startOwn(page);
  await page
    .getByLabel('Tell us more about your situation')
    .fill('Year 8 maths, linear relationships next week.');
  await page.getByRole('button', { name: /Show me what I need/ }).click();
  await expect(page).toHaveURL(/\/needs$/);
  await page.getByRole('button', { name: /Build my week/ }).click();
  await expect(page).toHaveURL(/\/pathway$/);
  await page.getByRole('button', { name: 'Why this?' }).first().click();
  await expect(page.getByText(/so this turns one into a rule/)).toBeVisible();
  expect(pathwayCalls).toBe(1);
  await page.getByText('Further reading (optional)').click();
  await expect(page.getByText('1 suggested for you')).toBeVisible();
  await expect(page.getByText('Has ready tasks on tables and rules.')).toBeVisible();
  // The AI's pick comes first, and its link still comes from the approved list.
  await expect(page.locator('details li a').first()).toHaveAttribute(
    'href',
    'https://resolve.edu.au/',
  );

  // With the AI down, a changed need still gives a week, built by rules.
  await page.unroute('**/api/pathway');
  await page.route('**/api/pathway', (r) => r.abort());
  await page.goto('/needs');
  await page
    .getByRole('button', { name: /Remove/ })
    .first()
    .click();
  await page.getByRole('button', { name: /Build my week/ }).click();
  await expect(page.getByRole('link', { name: /^Start:/ })).toBeVisible();
});

test('a Victorian teacher gets the Victorian Curriculum, and no NSW-only links', async ({
  page,
}) => {
  await page.route('**/api/diagnose', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(tammyDiagnosis),
    }),
  );
  let sentState = '';
  await page.route('**/api/pathway', async (r) => {
    sentState = (r.request().postDataJSON() as { state?: string }).state ?? '';
    await r.abort();
  });
  await startOwn(page);
  await page.getByLabel('State or territory').selectOption('VIC');
  await expect(page.getByText(/We'll use the Victorian Curriculum/)).toBeVisible();
  await page
    .getByLabel('Tell us more about your situation')
    .fill('Year 8 maths, linear relationships next week.');
  await page.getByRole('button', { name: /Show me what I need/ }).click();
  await expect(page).toHaveURL(/\/needs$/);
  await page.getByRole('button', { name: /Build my week/ }).click();
  await expect(page).toHaveURL(/\/pathway$/);
  await page.getByText('Further reading (optional)').click();
  await expect(page.locator('details li a').first()).toBeVisible();
  await expect(page.locator('a[href*="curriculum.nsw.edu.au"]')).toHaveCount(0);
  await expect(page.locator('a[href*="education.nsw.gov.au"]')).toHaveCount(0);
  expect(sentState).toBe('VIC');
});

test('while the AI builds the week, the screen shows progress and time left', async ({ page }) => {
  await page.route('**/api/diagnose', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(tammyDiagnosis),
    }),
  );
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/pathway', async (r) => {
    await held;
    await r.abort();
  });
  await startOwn(page);
  await page
    .getByLabel('Tell us more about your situation')
    .fill('Year 8 maths, linear relationships next week.');
  await page.getByRole('button', { name: /Show me what I need/ }).click();
  await page.getByRole('button', { name: /Build my week/ }).click();
  await expect(page.getByText('Building your week')).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Building your week' })).toBeVisible();
  await expect(page.getByText(/seconds left/)).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(/Reading your needs|Choosing units/);
  release();
  // The AI failed, so the rules week appears.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveCount(0);
});

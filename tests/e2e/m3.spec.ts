import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// M3: Lesson Builder with Tammy's ready-made lesson (no AI) and with the AI mocked.

async function axeClean(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
  ).toEqual([]);
}

async function tammyLesson(page: Page) {
  await page.route('**/api/**', (r) => r.abort());
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await page.goto('/plan');
  await expect(page.getByRole('heading', { level: 1, name: 'Plan a lesson' })).toBeVisible();
  await axeClean(page);
  await page.getByRole('button', { name: /Draft my lesson/ }).click();
  await expect(page).toHaveURL(/\/plan\/demo-/);
  await expect(page.getByRole('heading', { level: 1, name: 'From table to rule' })).toBeVisible();
}

test("Tammy's lesson: check the maths, edit, reorder, misconceptions from the bank", async ({
  page,
}) => {
  await tammyLesson(page);
  await axeClean(page);
  await expect(page.getByText(/blocks still to check/)).toBeVisible();
  await expect(
    page.getByText('It goes up by 2, so the rule is y = x + 2.', { exact: false }),
  ).toBeVisible();

  const boxes = page.getByRole('checkbox', { name: 'Check this for accuracy' });
  const n = await boxes.count();
  for (let i = 0; i < n; i++)
    await page.getByRole('checkbox', { name: 'Check this for accuracy' }).first().check();
  await expect(page.getByText(/checked the maths in every block/)).toBeVisible();

  await page.getByRole('button', { name: /^Edit Retrieval starter/ }).click();
  await page.getByLabel('Edit Retrieval starter (5 minutes)').fill('Four quick questions.');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Four quick questions.')).toBeVisible();

  await page.getByRole('button', { name: 'Move Key vocabulary up' }).click();
  const titles = await page.getByRole('heading', { level: 2 }).allTextContents();
  expect(titles.indexOf('Key vocabulary')).toBeLessThan(
    titles.indexOf('Retrieval starter (5 minutes)'),
  );
});

test('redoing one block leaves the others unchanged', async ({ page }) => {
  await tammyLesson(page);
  const before = await page.locator('.lesson-block').allInnerTexts();
  await page.unroute('**/api/**');
  await page.route('**/api/lesson-block', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'b7',
        type: 'check_for_understanding',
        title: 'Hinge question',
        content_md: 'Which rule fits $x$: 0, 1, 2 and $y$: 5, 7, 9? **Answer:** $y = 2x + 5$',
        rationale: 'Quick and diagnostic.',
        source: 'ai_draft',
        needs_maths_check: true,
      }),
    }),
  );
  await page.getByRole('button', { name: 'Redo this block: Hinge question' }).click();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(
    page.getByRole('main').locator('.lesson-block').getByText('Quick and diagnostic.'),
  ).toBeVisible();
  const after = await page.locator('.lesson-block').allInnerTexts();
  const changed = after.filter((t, i) => t !== before[i]);
  expect(changed).toHaveLength(1);
});

test('a 60-minute lesson prints on 2 A4 pages or fewer', async ({ page, browserName }, info) => {
  test.skip(info.project.name !== 'laptop' || browserName !== 'chromium');
  await tammyLesson(page);
  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  expect(pages).toBeGreaterThan(0);
  expect(pages).toBeLessThanOrEqual(2);
});

test('AI lesson for another topic, with the AI mocked', async ({ page }) => {
  await page.route('**/api/lesson', async (r) => {
    const body = r.request().postDataJSON() as { topicTag: string };
    expect(body.topicTag).toBe('number.proportional');
    await r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        lesson_id: 'ai-1',
        title: 'Unit rates',
        year_level: '8',
        duration_minutes: 60,
        curriculum_refs: { ac9: ['AC9-TODO'], nsw: ['NSW-TODO'] },
        blocks: [
          {
            id: 'b1',
            type: 'intention',
            title: 'Learning intention',
            content_md: 'We are learning to find a unit rate.',
            rationale: 'Clarity.',
            source: 'ai_draft',
            needs_maths_check: true,
          },
          {
            id: 'misconceptions',
            type: 'misconceptions',
            title: 'Common misconceptions to watch for',
            content_md: 'From the bank.',
            rationale: 'r',
            source: 'seeded',
            needs_maths_check: false,
          },
        ],
      }),
    });
  });
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await page.goto('/plan');
  await page.getByLabel('Topic').selectOption('number.proportional');
  await page.getByRole('button', { name: /Draft my lesson/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Unit rates' })).toBeVisible();
  await page.goto('/plan');
  await expect(page.getByRole('link', { name: 'Unit rates' })).toBeVisible();
});

test('on a laptop, "Why this block works" follows the block the teacher is in', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await tammyLesson(page);
  const why = page.getByRole('complementary', { name: 'Why this works' });
  await expect(why).toBeVisible();
  await expect(why.getByRole('link', { name: /min$/ }).first()).toBeVisible();
  const blocks = page.locator('[data-block-id]');
  const last = blocks.last();
  const title = await last.getByRole('heading', { level: 2 }).innerText();
  await last.getByRole('button', { name: /^Edit / }).focus();
  await expect(why.getByText(title, { exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/claude-0/why.png' });
  await axeClean(page);
});

async function downloadOf(page: Page, name: string | RegExp) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name }).click(),
  ]);
  const bytes = Buffer.concat(await (await download.createReadStream()).toArray());
  return { name: download.suggestedFilename(), bytes };
}

test("Tammy's lesson downloads as a pack: guide, worksheets and slides", async ({ page }) => {
  await tammyLesson(page);
  await expect(page.getByRole('heading', { name: 'Download for your class' })).toBeVisible();
  await axeClean(page);

  // The whole pack is one zip. Word, PowerPoint and zip files all start with "PK".
  const zip = await downloadOf(page, /Download lesson pack/);
  expect(zip.name).toBe('from-table-to-rule-year-8-lesson-pack.zip');
  expect(zip.bytes.subarray(0, 2).toString()).toBe('PK');
  for (const f of [
    'teacher-guide.docx',
    'worksheet-start-here.docx',
    'worksheet-core.docx',
    'worksheet-stretch.docx',
    'exit-tickets.docx',
    'slides.pptx',
  ])
    expect(zip.bytes.includes(`from-table-to-rule-year-8-${f}`)).toBe(true);

  const guide = await downloadOf(page, 'Teacher guide');
  expect(guide.name).toBe('from-table-to-rule-year-8-teacher-guide.docx');
  // The demo lesson's graph is drawn into the guide as a picture.
  expect(guide.bytes.includes('word/media/')).toBe(true);
  const slides = await downloadOf(page, 'Smart board slides');
  expect(slides.name).toBe('from-table-to-rule-year-8-slides.pptx');
  expect(slides.bytes.subarray(0, 2).toString()).toBe('PK');
  // So is the "I do" slide's graph.
  expect(slides.bytes.includes('ppt/media/')).toBe(true);
  const sheets = await downloadOf(page, 'Student worksheets');
  expect(sheets.name).toBe('from-table-to-rule-year-8-worksheets.zip');
});

test('an edited lesson asks the AI for its pack, and falls back to a plainer pack', async ({
  page,
}) => {
  await tammyLesson(page);
  await page.getByRole('button', { name: /^Edit Retrieval starter/ }).click();
  await page.getByLabel('Edit Retrieval starter (5 minutes)').fill('1. Work out $2 + 2$.');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  let asked = 0;
  await page.unroute('**/api/**');
  await page.route('**/api/lesson-pack', (r) => {
    asked++;
    return r.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'ai_unavailable', message: 'down' } }),
    });
  });
  const slides = await downloadOf(page, 'Smart board slides');
  expect(slides.name).toMatch(/slides\.pptx$/);
  expect(asked).toBe(1);
  await expect(page.getByText(/built straight from the lesson plan/)).toBeVisible();
});

test('a number check appears when an edit gives two letters the same value', async ({ page }) => {
  await tammyLesson(page);
  await expect(page.locator('.number-check')).toHaveCount(0);
  await page.getByRole('button', { name: /^Edit Retrieval starter/ }).click();
  await page.getByLabel('Edit Retrieval starter (5 minutes)').fill('When $x = 1$, $y = 1$.');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.number-check')).toContainText('x and y are both 1');
  await axeClean(page);
});

test('the equation editor inserts a fraction into the success criteria', async ({ page }) => {
  await tammyLesson(page);
  await page.getByRole('button', { name: /^Edit Learning intention/ }).click();
  const box = page.getByLabel(/^Edit Learning intention/);
  await box.click();
  await box.press('Control+End');
  await box.pressSequentially('\n- I can write a rule such as');
  await page.getByRole('button', { name: /Insert maths/ }).click();
  await expect(page.getByRole('dialog', { name: 'Insert maths' })).toBeVisible();
  await expect(page.locator('math-field')).toBeFocused();
  await page.keyboard.type('y=');
  await page.getByRole('button', { name: 'Fraction' }).click();
  await page.keyboard.type('3');
  await page.keyboard.press('Tab');
  await page.keyboard.type('4');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('x-5');
  await page.getByRole('button', { name: 'Insert equation' }).click();
  await expect(box).toHaveValue(/such as \$y=\\frac\{3\}\{4\}x-5\$$/);
  await expect(page.locator('.math-preview .katex')).not.toHaveCount(0);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await axeClean(page);
});

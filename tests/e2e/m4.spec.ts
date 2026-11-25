import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// M4: Quick Help, Reflect and Growth with the AI mocked.

async function axeClean(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
  ).toEqual([]);
}

async function tammy(page: Page) {
  await page.goto('/demo');
  await page.getByRole('button', { name: /Tammy/ }).click();
  await expect(page).toHaveURL(/\/needs$/);
}

test('Quick Help: short answer, more detail, related unit', async ({ page }) => {
  await page.route('**/api/help', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        answer: 'Use numbers. Ask: if $x = 5$, is $2x$ equal to 7 or 10?',
        tryTomorrow: 'A two-row table of $2x$ and $x + 2$ as a starter.',
        detail: 'They only match when $x = 2$, which is a good discussion point.',
        unitId: 'mc-02-pronumerals',
      }),
    }),
  );
  await tammy(page);
  await page.goto('/help');
  await axeClean(page);
  await page.getByRole('button', { name: /2x means 2 \+ x/ }).click();
  await expect(page.getByText(/is.*equal to 7 or 10/)).toBeVisible();
  await expect(page.getByText(/only match when/)).toHaveCount(0);
  await page.getByRole('button', { name: 'More detail' }).click();
  await expect(page.getByText(/only match when/)).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Related unit: When letters stand for objects/ }),
  ).toBeVisible();
  await axeClean(page);
});

test('Reflect saves, shows the observation, and growth reflects it', async ({ page }) => {
  await page.route('**/api/reflect', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        observation: 'Asking students to test their rule gave you clear evidence of who was ready.',
        suggestedUnitId: 'mc-01-goes-up-by',
      }),
    }),
  );
  await tammy(page);
  await page.goto('/reflect');
  await axeClean(page);
  await page.getByLabel('In a sentence or two').fill('Table to rule with a hinge question.');
  await page.getByLabel('About half got it').check();
  await page.getByLabel(/Anything to remember/).fill('Several wrote y = x + 2 on the exit ticket.');
  await page.getByLabel('What will you keep or change?').fill('More testing of rules.');
  await page.getByRole('radio', { name: '4 of 5' }).first().check({ force: true });
  await page.getByRole('button', { name: /Save and see/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: /saved/ })).toBeVisible();
  await expect(page.getByText(/clear evidence of who was ready/)).toBeVisible();
  await axeClean(page);

  await page.getByRole('link', { name: 'See your growth' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /How you're going/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /confidence .*4 of 5/ })).toBeVisible();
  await page.getByText('Show as a table').click();
  await expect(page.getByRole('cell', { name: '4 of 5' })).toBeVisible();
  await expect(page.getByText('Tried: Table to rule with a hinge question.')).toBeVisible();
  await axeClean(page);
});

test('Reflect still saves when the AI is down', async ({ page }) => {
  await page.route('**/api/**', (r) => r.abort());
  await tammy(page);
  await page.goto('/reflect');
  await page.getByLabel('What will you keep or change?').fill('Slow down the worked example.');
  await page.getByRole('button', { name: /Save and see/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: /saved/ })).toBeVisible();
});

test('Quick Help slides over the current screen on a phone and keeps the teacher in place', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/help', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        answer: 'Use numbers. Ask: if $x = 5$, is $2x$ equal to 7 or 10?',
        tryTomorrow: 'A two-row table of $2x$ and $x + 2$ as a starter.',
        detail: 'They only match when $x = 2$.',
        unitId: 'mc-02-pronumerals',
      }),
    }),
  );
  await tammy(page);
  await page.goto('/pathway');
  await page.getByRole('button', { name: 'Ask a question' }).click();
  const panel = page.getByRole('dialog', { name: 'Quick Help' });
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: /2x means 2 \+ x/ }).click();
  await expect(panel.getByText(/is.*equal to 7 or 10/)).toBeVisible();
  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(page).toHaveURL(/\/pathway$/);
  await expect(page.getByRole('button', { name: 'Ask a question' })).toBeFocused();
  // Following the related unit closes the panel and opens the unit.
  await page.getByRole('button', { name: 'Ask a question' }).click();
  await panel.getByRole('button', { name: /2x means 2 \+ x/ }).click();
  await panel.getByRole('link', { name: /Related unit/ }).click();
  await expect(page).toHaveURL(/\/learn\/mc-02-pronumerals$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('on a laptop, Quick Help docks on the right of This week', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.route('**/api/help', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ answer: 'Use numbers. Is $2x$ equal to 7 or 10 when $x = 5$?' }),
    }),
  );
  await tammy(page);
  await page.goto('/pathway');
  const dock = page.getByRole('complementary', { name: 'Quick Help' });
  await expect(dock).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ask a question' })).toBeHidden();
  await dock.getByRole('button', { name: /2x means 2 \+ x/ }).click();
  await expect(dock.getByText(/equal to 7 or 10/)).toBeVisible();
  await axeClean(page);
});

test('Quick Help takes a spoken question where the browser supports it', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRecognition {
      lang = '';
      continuous = false;
      interimResults = false;
      onresult: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      start() {
        setTimeout(() => {
          const alt = Object.assign([{ transcript: 'How do I explain gradient' }], {
            isFinal: true,
          });
          this.onresult?.({ results: [alt] });
          this.onend?.();
        }, 50);
      }
      stop() {
        this.onend?.();
      }
    }
    // Chromium has its own SpeechRecognition, which is tried first, so replace both.
    const w = window as unknown as Record<string, unknown>;
    w.SpeechRecognition = FakeRecognition;
    w.webkitSpeechRecognition = FakeRecognition;
  });
  await tammy(page);
  await page.goto('/help');
  await page.getByRole('button', { name: 'Speak instead of typing' }).click();
  await expect(page.getByLabel('Your question')).toHaveValue('How do I explain gradient');
});

/**
 * The shared test contract for Chai To-Do (article #14). The SAME tests run
 * against the reference apps, the 7 build-along stages, and your own two apps.
 *
 * The selector contract both apps must follow:
 *   #todo-form                  the form
 *   #todo-input                 the text input
 *   form button[type=submit]    the Add button
 *   #todo-list                  the <ul>
 *   .todo                       each task (with class "done" when done)
 *   .todo .toggle               its checkbox
 *   .todo .text                 its text
 *   .todo .delete               its delete button
 *   #count                      "3 tasks left" / "1 task left"
 *   [data-filter="all|active|done"]  filter buttons, with aria-pressed
 *   #clear-done                 "Clear done" (hidden when nothing is done)
 *   #empty                      the empty message (hidden when there are tasks)
 *
 * Each test is tagged with the stage that introduces its feature (@stage3…).
 */
import { test as base, expect, type Page } from '@playwright/test';

export interface TodoOptions {
  appPath: string;
}

const test = base.extend<TodoOptions & { app: Page }>({
  appPath: ['', { option: true }],
  // The app, opened fresh, failing the test if the page ever throws.
  app: async ({ page, appPath }, provide) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(appPath);
    await provide(page); // Playwright calls this "use"; renamed so the React hooks lint rule doesn't mistake it for a hook
    expect(errors, 'no page errors').toEqual([]);
  },
});

async function add(page: Page, ...texts: string[]) {
  for (const t of texts) {
    await page.fill('#todo-input', t);
    await page.press('#todo-input', 'Enter');
  }
}
const rows = (page: Page) => page.locator('.todo');

test('shows the empty message at the start @stage1', async ({ app }) => {
  await expect(app.locator('#empty')).toBeVisible();
});

test('hides "Clear done" at the start @stage7', async ({ app }) => {
  await expect(app.locator('#clear-done')).toBeHidden();
});

test('adds a task with Enter, and clears the input @stage3', async ({ app }) => {
  await add(app, 'Buy milk');
  await expect(rows(app)).toHaveCount(1);
  await expect(app.locator('#todo-input')).toHaveValue('');
});

test('adds a task with the Add button @stage3', async ({ app }) => {
  await app.fill('#todo-input', 'Buy milk');
  await app.click('form button[type=submit]');
  await expect(rows(app)).toHaveCount(1);
});

test('ignores blank tasks and trims the text @stage3', async ({ app }) => {
  await add(app, 'Buy milk', '  Make chai  ');
  await app.fill('#todo-input', '   ');
  await app.click('form button[type=submit]');
  await expect(rows(app)).toHaveCount(2);
  await expect(app.locator('.todo:nth-child(2) .text')).toHaveText('Make chai');
});

test('shows HTML typed in as plain text (no <b> element) @stage3', async ({ app }) => {
  await add(app, '<b>Code</b>');
  await expect(app.locator('.todo .text')).toHaveText('<b>Code</b>');
  await expect(app.locator('.todo b')).toHaveCount(0);
});

test('counts the tasks left @stage5', async ({ app }) => {
  await add(app, 'Buy milk', 'Make chai', 'Code');
  await expect(app.locator('#count')).toHaveText(/^\s*3 tasks left\s*$/);
});

test('says "1 task left" (singular) @stage5', async ({ app }) => {
  await add(app, 'Buy milk');
  await expect(app.locator('#count')).toHaveText(/^\s*1 task left\s*$/);
});

test('ticking a task marks it done @stage4', async ({ app }) => {
  await add(app, 'Buy milk', 'Make chai');
  await app.click('.todo:nth-child(1) .toggle');
  await expect(app.locator('.todo:nth-child(1)')).toHaveClass(/\bdone\b/);
  await expect(app.locator('.todo:nth-child(2)')).not.toHaveClass(/\bdone\b/);
});

test('ticking a task updates the counter @stage5', async ({ app }) => {
  await add(app, 'Buy milk', 'Make chai', 'Code');
  await app.click('.todo:nth-child(1) .toggle');
  await expect(app.locator('#count')).toHaveText(/^\s*2 tasks left\s*$/);
});

test('shows "Clear done" once something is done @stage7', async ({ app }) => {
  await add(app, 'Buy milk');
  await app.click('.todo .toggle');
  await expect(app.locator('#clear-done')).toBeVisible();
});

test('filters show the right tasks and set aria-pressed @stage5', async ({ app }) => {
  await add(app, 'Buy milk', 'Make chai', 'Code');
  await app.click('.todo:nth-child(1) .toggle');
  await app.click('[data-filter=active]');
  await expect(rows(app)).toHaveCount(2);
  await expect(app.locator('[data-filter=active]')).toHaveAttribute('aria-pressed', 'true');
  await expect(app.locator('[data-filter=all]')).toHaveAttribute('aria-pressed', 'false');
  await app.click('[data-filter=done]');
  await expect(rows(app)).toHaveCount(1);
  await app.click('[data-filter=all]');
  await expect(rows(app)).toHaveCount(3);
});

test('deletes a task @stage4', async ({ app }) => {
  await add(app, 'Buy milk', 'Make chai', 'Code');
  await app.click('.todo:nth-child(2) .delete');
  await expect(rows(app)).toHaveCount(2);
  await expect(app.locator('.todo .text')).toHaveText(['Buy milk', 'Code']);
});

test('remembers tasks after a reload @stage6', async ({ app }) => {
  await add(app, 'Buy milk', 'Make chai');
  await app.click('.todo:nth-child(1) .toggle');
  await app.reload();
  await expect(rows(app)).toHaveCount(2);
  await expect(app.locator('.todo:nth-child(1)')).toHaveClass(/\bdone\b/);
});

test('"Clear done" removes done tasks, then hides itself @stage7', async ({ app }) => {
  await add(app, 'Buy milk', 'Make chai');
  await app.click('.todo:nth-child(1) .toggle');
  await app.click('#clear-done');
  await expect(rows(app)).toHaveCount(1);
  await expect(app.locator('#count')).toHaveText(/^\s*1 task left\s*$/);
  await expect(app.locator('#clear-done')).toBeHidden();
});

test('the empty message hides with tasks and comes back when all are deleted @stage5', async ({
  app,
}) => {
  await add(app, 'Buy milk');
  await expect(app.locator('#empty')).toBeHidden();
  await app.click('.todo .delete');
  await expect(app.locator('#empty')).toBeVisible();
});

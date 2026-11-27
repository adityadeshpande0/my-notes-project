/**
 * Article #14's "Same actions, two apps" visual: the DOM-change meter must
 * reproduce the measured numbers. With 5 tasks, ticking task 3:
 * - plain JS rebuilds every row (5 removed + 5 added), no attribute changes;
 * - React rebuilds nothing and makes exactly 1 real attribute change (the
 *   ticked <li>'s class), with its no-op attribute writes filtered out.
 */
import { expect, test } from '@playwright/test';

test('the DOM-change meter shows 5/5 for plain JS vs 0/0 + 1 for React', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/javascript/todo-project');
  const viz = page.locator('.td-vs');
  await viz.scrollIntoViewIfNeeded();
  const robot = (name: string) => viz.getByRole('button', { name, exact: true });
  await expect(robot('Add 5 tasks')).toBeEnabled({ timeout: 20_000 });
  await robot('Add 5 tasks').click();
  await expect(viz.locator('.td-badge')).toHaveText('✓ data matches', { timeout: 10_000 });
  await expect(robot('Tick task 3')).toBeEnabled();
  await robot('Tick task 3').click();
  const meters = viz.locator('.td-meter');
  await expect(meters.nth(0)).toContainText('Rows rebuilt: 5 (−5 / +5)', { timeout: 10_000 });
  await expect(meters.nth(0)).toContainText('Attributes changed: 0');
  await expect(meters.nth(1)).toContainText('Rows rebuilt: 0 (−0 / +0)');
  await expect(meters.nth(1)).toContainText('Rows kept: 5');
  await expect(meters.nth(1)).toContainText('Attributes changed: 1');
  await expect(meters.nth(1)).toContainText('li class: "todo" → "todo done"');
  await expect(viz.locator('.td-badge')).toHaveText('✓ data matches');
  expect(errors).toEqual([]);
});

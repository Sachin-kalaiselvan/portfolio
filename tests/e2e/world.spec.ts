import { expect, test, type Page } from '@playwright/test';

/** Collect real problems; software-GL driver chatter is not one. */
function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => {
    if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver Message|GPU stall/.test(m.text())) problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

/** Count AudioContexts created, before any app code runs. */
async function countAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __audioContexts: number; AudioContext: typeof AudioContext };
    w.__audioContexts = 0;
    const Real = w.AudioContext;
    w.AudioContext = class extends Real {
      constructor(...a: ConstructorParameters<typeof AudioContext>) {
        super(...a);
        w.__audioContexts++;
      }
    } as typeof AudioContext;
  });
}

const mode = (page: Page) => page.locator('.world').getAttribute('data-mode');

test('boots over the home page with Skip and View as page from the start', async ({ page }) => {
  const problems = watchConsole(page);
  await countAudio(page);
  await page.goto('/');
  // "View as page" is there before the engine has loaded.
  await expect(page.locator('.world__page-link, .w-loading')).not.toHaveCount(0);
  await expect(page.getByRole('button', { name: 'View as page' }).first()).toBeVisible();
  await expect(page.locator('.world')).toHaveAttribute('data-mode', 'intro');
  // The page underneath can't be reached while the world covers it.
  await expect(page.locator('.stage')).toHaveAttribute('inert', '');
  await page.getByRole('button', { name: /Skip intro/ }).click();
  await expect(page.locator('.world')).toHaveAttribute('data-mode', 'controls');
  await page.getByRole('button', { name: 'Start driving' }).click();
  await expect(page.locator('.world')).toHaveAttribute('data-mode', 'driving');
  // No sound until the visitor turns it on.
  expect(await page.evaluate(() => (window as unknown as { __audioContexts: number }).__audioContexts)).toBe(0);
  expect(problems).toEqual([]);
});

test('View as page disposes the world and is remembered', async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto('/');
  await expect(page.locator('.world')).toHaveAttribute('data-mode', /intro|booting/);
  await page.getByRole('button', { name: 'View as page' }).first().click();
  await expect(page.locator('.world')).toHaveCount(0);
  await expect(page.locator('.world-canvas')).toHaveCount(0);
  await expect(page.locator('.stage')).not.toHaveAttribute('inert', '');
  expect(await page.evaluate(() => document.documentElement.classList.contains('world-locked'))).toBe(false);
  await page.reload();
  await page.waitForTimeout(1500);
  await expect(page.locator('.world')).toHaveCount(0);
  // And it can be entered again from the page.
  const enter = page.getByRole('button', { name: 'Enter the world' });
  if (await enter.first().isVisible()) {
    await enter.first().click();
  } else {
    await page.getByRole('button', { name: /menu/i }).first().click();
    await page.locator('.menu__world').click();
  }
  await expect(page.locator('.world')).toHaveAttribute('data-mode', /intro/);
  expect(problems).toEqual([]);
});

test('reduced motion: no flight, straight to a still view', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const problems = watchConsole(page);
  await page.goto('/');
  await expect(page.locator('.world')).toHaveAttribute('data-mode', 'intro');
  await expect(page.locator('.w-intro')).toHaveAttribute('data-step', 'identity');
  await expect(page.locator('.world')).toHaveAttribute('data-mode', 'controls');
  expect(problems).toEqual([]);
  await ctx.close();
});

test('opens real content from a discovery point and comes back', async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto('/work/sentra');
  await page.getByRole('button', { name: 'View in the world' }).click();
  await expect(page.locator('.world')).toHaveAttribute('data-mode', 'controls');
  await page.getByRole('button', { name: 'Start driving' }).click();
  const prompt = page.locator('.w-prompt');
  await expect(prompt).toContainText('Sentra');
  await prompt.click();
  await expect(page).toHaveURL(/\/work\/sentra$/);
  await expect(page.locator('.world')).toHaveAttribute('data-mode', 'panel');
  await expect(page.locator('.stage')).not.toHaveAttribute('inert', '');
  await page.getByRole('button', { name: 'Back to the world' }).click();
  await expect(page.locator('.world')).toHaveAttribute('data-mode', 'driving');
  expect(problems).toEqual([]);
});

test('touch controls appear on touch devices', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'touch only');
  await page.goto('/');
  await page.getByRole('button', { name: /Skip intro/ }).click();
  await expect(page.getByRole('button', { name: 'Accelerate' })).toBeVisible();
  const box = await page.getByRole('button', { name: 'Accelerate' }).boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(48);
  expect(box!.height).toBeGreaterThanOrEqual(48);
  await expect(page.getByRole('slider', { name: 'Steering' })).toBeVisible();
});

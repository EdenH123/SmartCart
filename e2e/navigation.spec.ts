import { test, expect } from '@playwright/test';

test.describe('General navigation', () => {
  test('homepage loads with hero section', async ({ page }) => {
    await page.goto('/');

    // Check hero heading
    await expect(page.getByRole('heading', { name: /השוו את סל הקניות/ })).toBeVisible();

    // Check subtitle text
    await expect(page.getByText('בנו את הסל, השוו מחירים בין סופרמרקטים')).toBeVisible();

    // Check CTA buttons
    await expect(page.getByRole('link', { name: 'התחילו לבנות סל' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'טענו סל לדוגמה' })).toBeVisible();

    // Check "How it works" section
    await expect(page.getByRole('heading', { name: 'איך זה עובד' })).toBeVisible();
  });

  test('navigation to basket page via header link', async ({ page }) => {
    await page.goto('/');

    // Click basket link in header
    await page.getByRole('link', { name: 'הסל שלי' }).click();
    await expect(page).toHaveURL('/basket');
    await expect(page.getByRole('heading', { name: 'הסל שלי' })).toBeVisible();
  });

  test('navigation to compare page from basket', async ({ page }) => {
    // Load demo basket
    await page.goto('/basket?demo=true');
    await expect(page).toHaveURL('/basket');
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();

    // Click compare button
    await page.getByRole('button', { name: 'השוו מחירים' }).click();
    await expect(page).toHaveURL(/\/compare\?basketId=/);
  });

  test('navigation to optimize page from basket', async ({ page }) => {
    // Load demo basket
    await page.goto('/basket?demo=true');
    await expect(page).toHaveURL('/basket');
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();

    // Click optimize button
    await page.getByRole('button', { name: 'מטבו את הסל שלי' }).click();
    await expect(page).toHaveURL(/\/optimize\?basketId=/);
  });

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/');

    // HTML element should exist with dir="rtl"
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Find and click the theme toggle button
    const themeToggle = page.getByRole('button', { name: /מצב/ }).or(
      page.locator('button').filter({ has: page.locator('svg') }).first()
    );

    // Check if dark class is NOT on html initially (default light mode)
    const hadDark = await html.evaluate((el) => el.classList.contains('dark'));

    // Click theme toggle (it is in the header nav)
    // The ThemeToggle component renders a button with a sun/moon icon
    const headerButtons = page.locator('header button');
    const toggleButton = headerButtons.first();
    await toggleButton.click();

    // Dark class should have toggled
    if (hadDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }

    // Click again to toggle back
    await toggleButton.click();
    if (hadDark) {
      await expect(html).toHaveClass(/dark/);
    } else {
      await expect(html).not.toHaveClass(/dark/);
    }
  });

  test('skip-to-content link is accessible', async ({ page }) => {
    await page.goto('/');

    // The skip link should exist in the DOM
    const skipLink = page.getByRole('link', { name: 'דלג לתוכן הראשי' });
    await expect(skipLink).toBeAttached();

    // It should point to #main-content
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    // The main content target should exist
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('PWA manifest is served at /manifest.json', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const contentType = response!.headers()['content-type'];
    expect(contentType).toMatch(/json/);
  });

  test('page has correct language and direction attributes', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'he');
    await expect(html).toHaveAttribute('dir', 'rtl');
  });

  test('logo link navigates to homepage', async ({ page }) => {
    await page.goto('/basket');

    // Click the logo / brand link in header
    await page.getByRole('link', { name: /סל חכם/ }).click();
    await expect(page).toHaveURL('/');
  });
});

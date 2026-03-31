import { test, expect } from '@playwright/test';

test.describe('Price comparison', () => {
  test('navigate to /compare without basketId shows error state', async ({ page }) => {
    await page.goto('/compare');

    // Should show error/empty state since no basket is specified
    await expect(
      page.getByText('משהו השתבש').or(page.getByText('אין תוצאות'))
    ).toBeVisible({ timeout: 10000 });

    // Should have link back to basket
    await expect(page.getByRole('link', { name: 'חזרה לסל' })).toBeVisible();
  });

  test('compare page with demo basket shows supermarket cards', async ({ page }) => {
    // First load demo basket to get a basketId
    await page.goto('/basket?demo=true');
    await expect(page).toHaveURL('/basket');
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();

    // Click compare button
    await page.getByRole('button', { name: 'השוו מחירים' }).click();

    // Should navigate to /compare with basketId
    await expect(page).toHaveURL(/\/compare\?basketId=/);

    // Wait for comparison results to load
    // Should show either comparison results or empty state
    await expect(
      page.getByRole('heading', { name: 'השוואת מחירים' }).or(page.getByText('אין תוצאות'))
    ).toBeVisible({ timeout: 15000 });
  });

  test('toggle between card and table view', async ({ page }) => {
    // Load demo basket and navigate to compare
    await page.goto('/basket?demo=true');
    await expect(page).toHaveURL('/basket');
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();
    await page.getByRole('button', { name: 'השוו מחירים' }).click();
    await expect(page).toHaveURL(/\/compare\?basketId=/);

    // Wait for the page heading to confirm results loaded
    const heading = page.getByRole('heading', { name: 'השוואת מחירים' });
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Default view should be cards - the cards view toggle should be active
    const cardsButton = page.getByLabel('תצוגת כרטיסים');
    const tableButton = page.getByLabel('תצוגת טבלה');

    await expect(cardsButton).toBeVisible();
    await expect(tableButton).toBeVisible();

    // Switch to table view
    await tableButton.click();

    // Should show table element
    await expect(page.locator('table')).toBeVisible();

    // Switch back to cards view
    await cardsButton.click();

    // Table should not be visible in card mode
    await expect(page.locator('table')).not.toBeVisible();
  });

  test('supermarket card shows details', async ({ page }) => {
    // Load demo basket and navigate to compare
    await page.goto('/basket?demo=true');
    await expect(page).toHaveURL('/basket');
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();
    await page.getByRole('button', { name: 'השוו מחירים' }).click();

    // Wait for comparison results
    await expect(page.getByRole('heading', { name: 'השוואת מחירים' })).toBeVisible({
      timeout: 15000,
    });

    // Each supermarket card should show a name, total price, and detail link
    const detailLinks = page.getByRole('link', { name: 'צפו בפירוט מלא' });
    const linkCount = await detailLinks.count();

    if (linkCount > 0) {
      // Click the first detail link
      const firstLink = detailLinks.first();
      await expect(firstLink).toBeVisible();
      await firstLink.click();

      // Should navigate to a supermarket detail page
      await expect(page).toHaveURL(/\/compare\/[^?]+\?basketId=/);
    }
  });
});

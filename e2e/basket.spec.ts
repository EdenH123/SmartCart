import { test, expect } from '@playwright/test';

test.describe('Basket management', () => {
  test('homepage CTA navigates to /basket', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'התחילו לבנות סל' }).click();
    await expect(page).toHaveURL('/basket');
    await expect(page.getByRole('heading', { name: 'הסל שלי' })).toBeVisible();
  });

  test('load demo basket via ?demo=true shows items', async ({ page }) => {
    await page.goto('/basket?demo=true');

    // Wait for demo items to load (URL should be cleaned to /basket)
    await expect(page).toHaveURL('/basket');

    // Should show items, not the empty state message
    await expect(page.getByText('הסל שלכם ריק')).not.toBeVisible();
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();
  });

  test('open add product modal and search', async ({ page }) => {
    await page.goto('/basket');

    // Click "הוסף מוצר" button
    await page.getByRole('button', { name: 'הוסף מוצר' }).first().click();

    // Modal should appear with search input
    const dialog = page.getByRole('dialog', { name: 'חיפוש והוספת מוצר' });
    await expect(dialog).toBeVisible();

    // Type in search field
    const searchInput = dialog.getByLabel('חיפוש מוצר');
    await searchInput.fill('חלב');

    // Wait for search results to appear (category buttons)
    await expect(dialog.getByRole('button').filter({ hasText: /חלב/ }).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('add product via search modal flow', async ({ page }) => {
    await page.goto('/basket');

    // Open modal
    await page.getByRole('button', { name: 'הוסף מוצר' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Search for a product
    await dialog.getByLabel('חיפוש מוצר').fill('חלב');

    // Select a category from results
    const categoryButton = dialog.getByRole('button').filter({ hasText: /חלב/ }).first();
    await categoryButton.click();

    // Should move to configure step - click review
    await expect(dialog.getByRole('button', { name: 'סקירה' })).toBeVisible({ timeout: 5000 });
    await dialog.getByRole('button', { name: 'סקירה' }).click();

    // Should show preview step with add button
    await expect(dialog.getByRole('button', { name: 'הוסף לסל' })).toBeVisible();
    await dialog.getByRole('button', { name: 'הוסף לסל' }).click();

    // Modal should close and item should appear
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(/1 פריטים/)).toBeVisible({ timeout: 5000 });
  });

  test('update quantity with +/- buttons', async ({ page }) => {
    await page.goto('/basket?demo=true');
    await expect(page).toHaveURL('/basket');
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();

    // Find first item's quantity display (should be "1" initially)
    const firstItem = page.locator('.card').first();
    const quantityDisplay = firstItem.locator('.tabular-nums').first();
    const initialQty = await quantityDisplay.textContent();

    // Click the increase button
    await firstItem.getByLabel('הוסף כמות').click();

    // Quantity should increase by 1
    const expectedQty = String(Number(initialQty) + 1);
    await expect(quantityDisplay).toHaveText(expectedQty, { timeout: 5000 });
  });

  test('remove item from basket', async ({ page }) => {
    await page.goto('/basket?demo=true');
    await expect(page).toHaveURL('/basket');

    // Wait for items to load
    const itemCountLocator = page.getByText(/(\d+) פריטים/);
    await expect(itemCountLocator).toBeVisible();
    const countText = await itemCountLocator.textContent();
    const initialCount = Number(countText?.match(/(\d+)/)?.[1]);

    // Click remove button on first item
    await page.getByLabel('הסר מהסל').first().click();

    // Item count should decrease
    if (initialCount > 1) {
      await expect(page.getByText(`${initialCount - 1} פריטים`)).toBeVisible({ timeout: 5000 });
    } else {
      await expect(page.getByText('הסל שלכם ריק')).toBeVisible({ timeout: 5000 });
    }
  });

  test('clear basket removes all items', async ({ page }) => {
    await page.goto('/basket?demo=true');
    await expect(page).toHaveURL('/basket');
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();

    // Click "נקה הכל"
    await page.getByRole('button', { name: 'נקה הכל' }).click();

    // Should show empty state
    await expect(page.getByText('הסל שלכם ריק')).toBeVisible({ timeout: 5000 });
  });

  test('share basket button triggers clipboard copy', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/basket?demo=true');
    await expect(page).toHaveURL('/basket');
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();

    // Click share button
    await page.getByRole('button', { name: 'שתף' }).click();

    // Should show success toast
    await expect(page.getByText('הקישור הועתק!')).toBeVisible({ timeout: 5000 });
  });
});

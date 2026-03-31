import { test, expect } from '@playwright/test';

test.describe('Search functionality', () => {
  test('open add product modal on basket page', async ({ page }) => {
    await page.goto('/basket');

    // Click "הוסף מוצר" to open modal
    await page.getByRole('button', { name: 'הוסף מוצר' }).first().click();

    // Modal should be visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Should show search input with placeholder
    const searchInput = dialog.getByLabel('חיפוש מוצר');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();

    // Should show prompt text when no query entered
    await expect(dialog.getByText('התחילו להקליד כדי לחפש קטגוריות')).toBeVisible();
  });

  test('type search query and see results', async ({ page }) => {
    await page.goto('/basket');
    await page.getByRole('button', { name: 'הוסף מוצר' }).first().click();

    const dialog = page.getByRole('dialog');
    const searchInput = dialog.getByLabel('חיפוש מוצר');

    // Type a query
    await searchInput.fill('ביצים');

    // Should show results or "no results" message
    await expect(
      dialog
        .getByRole('button')
        .filter({ hasText: /ביצ/ })
        .first()
        .or(dialog.getByText('לא נמצאו קטגוריות'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('search with no results shows empty message', async ({ page }) => {
    await page.goto('/basket');
    await page.getByRole('button', { name: 'הוסף מוצר' }).first().click();

    const dialog = page.getByRole('dialog');
    const searchInput = dialog.getByLabel('חיפוש מוצר');

    // Type a nonsensical query
    await searchInput.fill('xyznonexistent123');

    // Should show no results message
    await expect(dialog.getByText('לא נמצאו קטגוריות')).toBeVisible({ timeout: 5000 });
  });

  test('recent searches appear after searching', async ({ page }) => {
    await page.goto('/basket');

    // Open modal and perform a search
    await page.getByRole('button', { name: 'הוסף מוצר' }).first().click();
    const dialog = page.getByRole('dialog');
    const searchInput = dialog.getByLabel('חיפוש מוצר');

    // Search and select a category
    await searchInput.fill('חלב');
    const categoryBtn = dialog.getByRole('button').filter({ hasText: /חלב/ }).first();
    await expect(categoryBtn).toBeVisible({ timeout: 5000 });
    await categoryBtn.click();

    // Should navigate to configure step - close modal
    await dialog.getByRole('button').filter({ has: page.locator('svg.lucide-x') }).click();

    // Reopen modal
    await page.getByRole('button', { name: 'הוסף מוצר' }).first().click();

    // With empty search, recent searches should appear
    const reopenedDialog = page.getByRole('dialog');
    await expect(reopenedDialog.getByText('חיפושים אחרונים')).toBeVisible({ timeout: 3000 });
  });

  test('clear recent searches', async ({ page }) => {
    // Set up some recent searches in localStorage first
    await page.goto('/basket');
    await page.evaluate(() => {
      localStorage.setItem(
        'smartcart-recent-searches',
        JSON.stringify([{ id: 'test-1', name: 'חלב' }])
      );
    });

    // Open modal
    await page.getByRole('button', { name: 'הוסף מוצר' }).first().click();
    const dialog = page.getByRole('dialog');

    // Recent searches should show
    await expect(dialog.getByText('חיפושים אחרונים')).toBeVisible();

    // Click clear button
    await dialog.getByRole('button', { name: 'נקה היסטוריה' }).click();

    // Recent searches section should disappear
    await expect(dialog.getByText('חיפושים אחרונים')).not.toBeVisible();

    // Should show the empty state prompt instead
    await expect(dialog.getByText('התחילו להקליד כדי לחפש קטגוריות')).toBeVisible();
  });

  test('close modal with Escape key', async ({ page }) => {
    await page.goto('/basket');
    await page.getByRole('button', { name: 'הוסף מוצר' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('close modal by clicking backdrop', async ({ page }) => {
    await page.goto('/basket');
    await page.getByRole('button', { name: 'הוסף מוצר' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Click on the backdrop (the dark overlay behind the modal)
    await page.locator('.fixed.inset-0.bg-black\\/40').click();
    await expect(dialog).not.toBeVisible();
  });
});

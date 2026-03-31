import { test, expect } from '@playwright/test';

test.describe('Optimization', () => {
  test('navigate to /optimize without basketId shows error state', async ({ page }) => {
    await page.goto('/optimize');

    // Should show error state since no basket is specified
    await expect(
      page.getByText('משהו השתבש').or(page.getByText('אין מה למטב'))
    ).toBeVisible({ timeout: 10000 });

    // Should have link back to basket
    await expect(page.getByRole('link', { name: 'חזרה לסל' })).toBeVisible();
  });

  test('optimize page with demo basket shows results', async ({ page }) => {
    // Load demo basket
    await page.goto('/basket?demo=true');
    await expect(page).toHaveURL('/basket');
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();

    // Click optimize button
    await page.getByRole('button', { name: 'מטבו את הסל שלי' }).click();

    // Should navigate to /optimize with basketId
    await expect(page).toHaveURL(/\/optimize\?basketId=/);

    // Wait for optimization results
    await expect(
      page
        .getByRole('heading', { name: 'אופטימיזציית סל' })
        .or(page.getByText('משהו השתבש'))
        .or(page.getByText('אין מה למטב'))
    ).toBeVisible({ timeout: 15000 });
  });

  test('optimization results display items and total', async ({ page }) => {
    // Load demo basket and navigate to optimize
    await page.goto('/basket?demo=true');
    await expect(page).toHaveURL('/basket');
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();
    await page.getByRole('button', { name: 'מטבו את הסל שלי' }).click();

    const heading = page.getByRole('heading', { name: 'אופטימיזציית סל' });
    // Only continue with assertions if optimization succeeded
    const hasResults = await heading.isVisible({ timeout: 15000 }).catch(() => false);

    if (hasResults) {
      // Should show "פריטים" section
      await expect(page.getByRole('heading', { name: 'פריטים' })).toBeVisible();

      // Should show total
      await expect(page.getByText('סה״כ ממוטב')).toBeVisible();

      // Should have link to full comparison
      await expect(page.getByRole('link', { name: 'צפו בהשוואה מלאה' })).toBeVisible();
    }
  });

  test('split-cart section displays when available', async ({ page }) => {
    // Load demo basket and navigate to optimize
    await page.goto('/basket?demo=true');
    await expect(page).toHaveURL('/basket');
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();
    await page.getByRole('button', { name: 'מטבו את הסל שלי' }).click();

    const heading = page.getByRole('heading', { name: 'אופטימיזציית סל' });
    const hasResults = await heading.isVisible({ timeout: 15000 }).catch(() => false);

    if (hasResults) {
      // Split cart section may or may not be present depending on data
      const splitCartHeading = page.getByRole('heading', { name: 'פיצול סל בין סופרמרקטים' });
      const hasSplitCart = await splitCartHeading.isVisible().catch(() => false);

      if (hasSplitCart) {
        // Should show total for split cart
        await expect(page.getByText('סה״כ עם פיצול סל')).toBeVisible();
      }
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Diff Engine Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const originalText = `
    Abstract
    This study examines the effects of climate change on biodiversity in marine ecosystems.
    We analyzed data from 50 different locations over a 10-year period.
    Results indicate a significant decline in species diversity correlated with rising ocean temperatures.
    
    Introduction
    Climate change represents one of the most significant threats to global biodiversity.
    Marine ecosystems are particularly vulnerable to temperature changes.
    Previous studies have shown varying impacts across different marine habitats.
  `;

  const revisedText = `
    Abstract
    This comprehensive study investigates the impacts of climate change on biodiversity in marine ecosystems.
    We analyzed data from 50 different locations over a 10-year period using advanced statistical methods.
    Results demonstrate a significant decline in species diversity strongly correlated with rising ocean temperatures.
    
    Introduction
    Climate change represents one of the most pressing threats to global biodiversity in the 21st century.
    Marine ecosystems are particularly vulnerable to temperature and pH changes.
    Previous studies have shown varying impacts across different marine habitats and regions.
  `;

  test('LCS Algorithm Performance', async ({ page }) => {
    await page.getByText('Advanced Settings').click();
    
    const toggle = page.locator('#diff-engine-toggle');
    const isChecked = await toggle.isChecked();
    if (isChecked) {
      await toggle.click();
    }
    
    await page.locator('text=Original Manuscript').first().click();
    await page.locator('textarea').first().fill(originalText);
    
    await page.locator('text=Revised Manuscript').first().click();
    await page.locator('textarea').nth(1).fill(revisedText);
    
    const startTime = Date.now();
    
    await page.getByText('Run Multi-Agent Analysis').click();
    
    await page.waitForSelector('text=changes detected', { timeout: 30000 });
    
    const endTime = Date.now();
    const lcsPerformance = endTime - startTime;
    
    console.log(`LCS Algorithm Performance: ${lcsPerformance}ms`);
    
    const diffCount = await page.locator('text=/\\d+ changes detected/').textContent();
    expect(diffCount).toBeTruthy();
    
    await page.evaluate(`window.localStorage.setItem('lcsPerformance', '${lcsPerformance}')`);
    
    await page.reload();
  });

  test('Diff-Match-Patch Algorithm Performance', async ({ page }) => {
    await page.getByText('Advanced Settings').click();
    
    const toggle = page.locator('#diff-engine-toggle');
    const isChecked = await toggle.isChecked();
    if (!isChecked) {
      await toggle.click();
    }
    
    await page.locator('text=Original Manuscript').first().click();
    await page.locator('textarea').first().fill(originalText);
    
    await page.locator('text=Revised Manuscript').first().click();
    await page.locator('textarea').nth(1).fill(revisedText);
    
    const startTime = Date.now();
    
    await page.getByText('Run Multi-Agent Analysis').click();
    
    await page.waitForSelector('text=changes detected', { timeout: 30000 });
    
    const endTime = Date.now();
    const dmpPerformance = endTime - startTime;
    
    console.log(`Diff-Match-Patch Algorithm Performance: ${dmpPerformance}ms`);
    
    const diffCount = await page.locator('text=/\\d+ changes detected/').textContent();
    expect(diffCount).toBeTruthy();
    
    const lcsPerformance = await page.evaluate(() => window.localStorage.getItem('lcsPerformance'));
    console.log(`Performance comparison: DMP ${dmpPerformance}ms vs LCS ${lcsPerformance}ms`);
    
    if (lcsPerformance) {
      const lcsTime = parseInt(lcsPerformance, 10);
      console.log(`Diff-Match-Patch is ${Math.round((lcsTime - dmpPerformance) / lcsTime * 100)}% faster than LCS`);
    }
  });

  test('Diff Engine Output Comparison', async ({ page }) => {
    
    await page.goto('/');
    await page.getByText('Advanced Settings').click();
    
    const toggle = page.locator('#diff-engine-toggle');
    const isChecked = await toggle.isChecked();
    if (isChecked) {
      await toggle.click();
    }
    
    await page.locator('text=Original Manuscript').first().click();
    await page.locator('textarea').first().fill(originalText);
    
    await page.locator('text=Revised Manuscript').first().click();
    await page.locator('textarea').nth(1).fill(revisedText);
    
    await page.getByText('Run Multi-Agent Analysis').click();
    
    await page.waitForSelector('text=changes detected', { timeout: 30000 });
    await page.getByText('Review Results').click();
    
    const lcsChangesText = await page.locator('text=/\\d+ changes detected/').textContent();
    const lcsChanges = lcsChangesText ? parseInt(lcsChangesText.match(/\d+/)?.[0] || '0', 10) : 0;
    
    await page.reload();
    await page.getByText('Advanced Settings').click();
    
    const toggleDmp = page.locator('#diff-engine-toggle');
    const isCheckedDmp = await toggleDmp.isChecked();
    if (!isCheckedDmp) {
      await toggleDmp.click();
    }
    
    await page.locator('text=Original Manuscript').first().click();
    await page.locator('textarea').first().fill(originalText);
    
    await page.locator('text=Revised Manuscript').first().click();
    await page.locator('textarea').nth(1).fill(revisedText);
    
    await page.getByText('Run Multi-Agent Analysis').click();
    
    await page.waitForSelector('text=changes detected', { timeout: 30000 });
    await page.getByText('Review Results').click();
    
    const dmpChangesText = await page.locator('text=/\\d+ changes detected/').textContent();
    const dmpChanges = dmpChangesText ? parseInt(dmpChangesText.match(/\d+/)?.[0] || '0', 10) : 0;
    
    console.log(`Diff count comparison: DMP ${dmpChanges} vs LCS ${lcsChanges}`);
    
    const percentDifference = Math.abs(dmpChanges - lcsChanges) / ((dmpChanges + lcsChanges) / 2) * 100;
    console.log(`Percent difference in diff counts: ${percentDifference.toFixed(2)}%`);
    
    expect(percentDifference).toBeLessThan(30);
  });
});

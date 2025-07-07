import { test, expect } from '@playwright/test';

test.describe('Diff Engine Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  const testCases = [
    {
      name: 'basic text changes',
      original: 'This is a test sentence. Another sentence follows.',
      revised: 'This is a modified test sentence. Another sentence follows.',
      expectedDiffs: 2
    },
    {
      name: 'sentence moves',
      original: 'First sentence here. Second sentence there.',
      revised: 'Second sentence there. First sentence here.',
      expectedDiffs: 2
    },
    {
      name: 'word additions',
      original: 'The quick fox jumps.',
      revised: 'The quick brown fox jumps high.',
      expectedDiffs: 2
    },
    {
      name: 'paragraph restructuring',
      original: 'Introduction paragraph. Methods section follows. Results are presented. Discussion concludes.',
      revised: 'Introduction paragraph. Results are presented first. Methods section follows. Discussion concludes.',
      expectedDiffs: 3
    }
  ];

  for (const engine of ['LCS', 'DMP']) {
    test.describe(`${engine} Engine Tests`, () => {
      for (const { name, original, revised, expectedDiffs } of testCases) {
        test(`${engine}: ${name}`, async ({ page }) => {
          await page.click('text=Upload Documents');
          
          if (engine === 'DMP') {
            await page.check('input[type="checkbox"]:near(:text("Use diff-match-patch Engine"))');
          } else {
            await page.uncheck('input[type="checkbox"]:near(:text("Use diff-match-patch Engine"))');
          }
          
          await page.fill('textarea:near(:text("Original Manuscript"))', original);
          
          await page.fill('textarea:near(:text("Revised Manuscript"))', revised);
          
          await page.click('text=Run Multi-Agent Analysis');
          
          await page.waitForSelector('text=Multi-Agent Analysis', { timeout: 30000 });
          
          await page.click('text=Review Results');
          
          const diffElements = page.locator('[data-testid="diff-item"], .diff-item, .bg-red-50, .bg-green-50');
          await expect(diffElements.first()).toBeVisible({ timeout: 10000 });
          
          const diffCount = await diffElements.count();
          expect(diffCount).toBeGreaterThan(0);
          
          console.log(`${engine} engine processed "${name}" with ${diffCount} diff elements`);
        });
      }
      
      test(`${engine}: performance benchmark`, async ({ page }) => {
        const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);
        const modifiedLongText = longText.replace('Lorem ipsum', 'Modified lorem ipsum').replace('consectetur', 'updated consectetur');
        
        if (engine === 'DMP') {
          await page.check('input[type="checkbox"]:near(:text("Use diff-match-patch Engine"))');
        } else {
          await page.uncheck('input[type="checkbox"]:near(:text("Use diff-match-patch Engine"))');
        }
        
        await page.fill('textarea:near(:text("Original Manuscript"))', longText);
        await page.fill('textarea:near(:text("Revised Manuscript"))', modifiedLongText);
        
        const startTime = Date.now();
        await page.click('text=Run Multi-Agent Analysis');
        await page.waitForSelector('text=Multi-Agent Analysis', { timeout: 60000 });
        const endTime = Date.now();
        
        const analysisTime = endTime - startTime;
        console.log(`${engine} engine performance: ${analysisTime}ms for large text`);
        
        await page.click('text=Review Results');
        const diffElements = page.locator('[data-testid="diff-item"], .diff-item, .bg-red-50, .bg-green-50');
        await expect(diffElements.first()).toBeVisible({ timeout: 10000 });
      });
    });
  }
  
  test('Engine toggle functionality', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]:near(:text("Use diff-match-patch Engine"))');
    
    await expect(checkbox).not.toBeChecked();
    
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });
  
  test('Advanced Settings visibility', async ({ page }) => {
    await expect(page.locator('text=Advanced Settings')).toBeVisible();
    await expect(page.locator('text=Use diff-match-patch Engine')).toBeVisible();
    await expect(page.locator('text=Enhanced diff algorithm with better performance and semantic cleanup')).toBeVisible();
  });
});

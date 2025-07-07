import { test, expect } from '@playwright/test';

test.describe('Manuscript Diff Analyzer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page with correct title and elements', async ({ page }) => {
    // Check page title (Next.js default title until we update it)
    await expect(page).toHaveTitle(/Create Next App|Manuscript Diff Analyzer/i);

    // Check main header
    await expect(page.getByRole('heading', { name: /Manuscript Diff Analyzer/i })).toBeVisible();

    // Check navigation tabs (target navigation area specifically)
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('button', { name: 'Upload Documents' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Multi-Agent Analysis' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Review Results' })).toBeVisible();

    // Check file upload areas
    await expect(page.getByText(/Original Manuscript/i)).toBeVisible();
    await expect(page.getByText(/Revised Manuscript/i)).toBeVisible();

    // Check reviewer requests section
    await expect(page.getByText(/Reviewer Revision Requests/i)).toBeVisible();
  });

  test('should allow text input in manuscript fields', async ({ page }) => {
    const originalText =
      'This is the original manuscript text. It contains several sentences that will be analyzed.';
    const revisedText =
      'This is the revised manuscript text. It contains several updated sentences that will be analyzed for changes.';

    // Fill original manuscript
    const originalTextarea = page.locator('textarea').nth(0);
    await originalTextarea.fill(originalText);
    await expect(originalTextarea).toHaveValue(originalText);

    // Fill revised manuscript
    const revisedTextarea = page.locator('textarea').nth(1);
    await revisedTextarea.fill(revisedText);
    await expect(revisedTextarea).toHaveValue(revisedText);

    // Check character count displays (be more specific)
    await expect(page.getByText(/\d+ characters/).first()).toBeVisible();
  });

  test('should allow input in reviewer requests field', async ({ page }) => {
    const reviewerRequests =
      'Please clarify the methodology section and add more details about the statistical analysis.';

    // Fill reviewer requests
    const reviewerTextarea = page.getByPlaceholder(/Paste reviewer revision requests here/i);
    await reviewerTextarea.fill(reviewerRequests);
    await expect(reviewerTextarea).toHaveValue(reviewerRequests);
  });

  test('should enable analysis button when both manuscripts are provided', async ({ page }) => {
    const analysisButton = page.getByRole('button', { name: /Run Multi-Agent Analysis/i });

    // Initially disabled
    await expect(analysisButton).toBeDisabled();

    // Fill both manuscripts
    await page.locator('textarea').nth(0).fill('Original manuscript content');
    await page.locator('textarea').nth(1).fill('Revised manuscript content');

    // Should now be enabled
    await expect(analysisButton).toBeEnabled();
  });

  test('should navigate between tabs', async ({ page }) => {
    const nav = page.getByRole('navigation');

    // Start on Upload tab
    await expect(nav.getByRole('button', { name: 'Upload Documents' })).toHaveClass(
      /text-blue-600/
    );

    // Click Analysis tab
    await nav.getByRole('button', { name: 'Multi-Agent Analysis' }).click();
    await expect(nav.getByRole('button', { name: 'Multi-Agent Analysis' })).toHaveClass(
      /text-blue-600/
    );

    // Click Review tab
    await nav.getByRole('button', { name: 'Review Results' }).click();
    await expect(nav.getByRole('button', { name: 'Review Results' })).toHaveClass(/text-blue-600/);

    // Go back to Upload tab
    await nav.getByRole('button', { name: 'Upload Documents' }).click();
    await expect(nav.getByRole('button', { name: 'Upload Documents' })).toHaveClass(
      /text-blue-600/
    );
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    // Try with very short text
    await page.locator('textarea').nth(0).fill('Too short');
    await page.locator('textarea').nth(1).fill('Also short');

    // Look for warning indicators (the app shows warnings, not errors)
    await expect(page.getByText(/Warnings/i).first()).toBeVisible();
    await expect(page.getByText(/text is very short/i).first()).toBeVisible();
  });

  test('should toggle configuration options', async ({ page }) => {
    // Find Claude AI checkbox
    const claudeCheckbox = page.getByRole('checkbox', { name: /Claude AI Analysis/i });
    await expect(claudeCheckbox).toBeVisible();

    // Test checking/unchecking
    const isInitiallyChecked = await claudeCheckbox.isChecked();
    await claudeCheckbox.click();
    await expect(claudeCheckbox).toBeChecked({ checked: !isInitiallyChecked });

    const diffEngineCheckbox = page.getByRole('checkbox', {
      name: /Use Google Diff-Match-Patch Engine/i,
    });
    await expect(diffEngineCheckbox).toBeVisible();

    // Test checking/unchecking diff engine
    const isDiffEngineInitiallyChecked = await diffEngineCheckbox.isChecked();
    await diffEngineCheckbox.click();
    await expect(diffEngineCheckbox).toBeChecked({ checked: !isDiffEngineInitiallyChecked });

    // Find granularity dropdown
    const granularitySelect = page.getByRole('combobox');
    await expect(granularitySelect).toBeVisible();

    // Test changing granularity
    await granularitySelect.selectOption('word');
    await expect(granularitySelect).toHaveValue('word');

    await granularitySelect.selectOption('sentence');
    await expect(granularitySelect).toHaveValue('sentence');
  });

  test('should handle analysis workflow with mock data', async ({ page }) => {
    const originalText = `
    Introduction

    This study examines the effects of machine learning algorithms on data processing efficiency. 
    Our research methodology involved collecting data from various sources and applying statistical analysis.
    The results demonstrate significant improvements in processing speed and accuracy.
    We conclude that machine learning approaches offer substantial benefits for data processing tasks.
    `;

    const revisedText = `
    Introduction

    This comprehensive study examines the effects of advanced machine learning algorithms on data processing efficiency. 
    Our rigorous research methodology involved collecting extensive data from various validated sources and applying robust statistical analysis.
    The experimental results demonstrate highly significant improvements in processing speed, accuracy, and reliability.
    We conclude that modern machine learning approaches offer substantial and measurable benefits for complex data processing tasks.
    `;

    const reviewerRequests =
      'Please provide more details about the methodology and strengthen the conclusions with additional evidence.';

    // Fill in the manuscripts
    await page.locator('textarea').nth(0).fill(originalText);
    await page.locator('textarea').nth(1).fill(revisedText);
    await page.getByPlaceholder(/Paste reviewer revision requests here/i).fill(reviewerRequests);

    // Enable Claude AI for more comprehensive analysis (if available)
    const claudeCheckbox = page.getByRole('checkbox', { name: /Claude AI Analysis/i });
    if (!(await claudeCheckbox.isChecked())) {
      await claudeCheckbox.click();
    }

    // Start analysis
    const analysisButton = page.getByRole('button', { name: /Run Multi-Agent Analysis/i });
    await expect(analysisButton).toBeEnabled();
    await analysisButton.click();

    // Should show analyzing state
    await expect(page.getByText(/Analyzing/i)).toBeVisible();

    // Wait for analysis to complete (with timeout)
    await expect(page.getByText(/Analyzing/i)).not.toBeVisible({ timeout: 30000 });

    // Should automatically navigate to analysis tab
    await expect(page.getByRole('button', { name: /Multi-Agent Analysis/i })).toHaveClass(
      /text-blue-600/
    );

    // Check for analysis results
    await expect(page.getByText(/Analysis Summary/i)).toBeVisible();
  });

  test('should display analysis results properly', async ({ page }) => {
    // This test would require either mock data or a working backend
    // For now, we'll test the UI structure when analysis results are available

    // Navigate to analysis tab
    await page
      .getByRole('navigation')
      .getByRole('button', { name: 'Multi-Agent Analysis' })
      .click();

    // Check for the status indicator component
    await expect(page.getByText(/Multi-Agent Analysis Status/i)).toBeVisible();

    // Check for no results message
    await expect(page.getByText(/No Analysis Results/i)).toBeVisible();
  });

  test('should handle error boundaries gracefully', async ({ page }) => {
    // Monitor for any unhandled errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Navigate through the application
    const nav = page.getByRole('navigation');
    await nav.getByRole('button', { name: 'Multi-Agent Analysis' }).click();
    await nav.getByRole('button', { name: 'Review Results' }).click();
    await nav.getByRole('button', { name: 'Upload Documents' }).click();

    // Should not have any unhandled errors
    expect(errors).toHaveLength(0);
  });

  test('should be responsive on mobile viewports', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that main elements are still visible and usable
    await expect(page.getByRole('heading', { name: /Manuscript Diff Analyzer/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Upload Documents/i })).toBeVisible();

    // Check that textareas are properly sized
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { name: /Manuscript Diff Analyzer/i })).toBeVisible();
  });

  test('should preserve user input during navigation', async ({ page }) => {
    const testText = 'This is some test content that should persist.';

    // Enter text in original manuscript
    await page.locator('textarea').nth(0).fill(testText);

    // Navigate to another tab
    const nav = page.getByRole('navigation');
    await nav.getByRole('button', { name: 'Multi-Agent Analysis' }).click();

    // Navigate back to upload
    await nav.getByRole('button', { name: 'Upload Documents' }).click();

    // Text should still be there
    await expect(page.locator('textarea').nth(0)).toHaveValue(testText);
  });

  test('should test AdvancedSettings component functionality', async ({ page }) => {
    // Check that Advanced Settings section is visible
    await expect(page.getByText(/Advanced Settings/i)).toBeVisible();

    const diffEngineCheckbox = page.getByRole('checkbox', {
      name: /Use Google Diff-Match-Patch Engine/i,
    });
    await expect(diffEngineCheckbox).toBeVisible();

    await expect(diffEngineCheckbox).not.toBeChecked();

    await diffEngineCheckbox.click();
    await expect(diffEngineCheckbox).toBeChecked();

    await diffEngineCheckbox.click();
    await expect(diffEngineCheckbox).not.toBeChecked();

    await diffEngineCheckbox.click();
    await expect(diffEngineCheckbox).toBeChecked();

    // Navigate to another tab and back
    const nav = page.getByRole('navigation');
    await nav.getByRole('button', { name: 'Multi-Agent Analysis' }).click();
    await nav.getByRole('button', { name: 'Upload Documents' }).click();

    await expect(diffEngineCheckbox).toBeChecked();
  });

  test('should compare both diff engines with same input', async ({ page }) => {
    const originalText = `
    Introduction
    This study examines machine learning algorithms for data processing.
    Our methodology involved statistical analysis of collected data.
    Results show significant improvements in processing efficiency.
    `;

    const revisedText = `
    Introduction
    This comprehensive study examines advanced machine learning algorithms for efficient data processing.
    Our rigorous methodology involved detailed statistical analysis of extensively collected data.
    Experimental results demonstrate highly significant improvements in processing efficiency and accuracy.
    `;

    await page.locator('textarea').nth(0).fill(originalText);
    await page.locator('textarea').nth(1).fill(revisedText);

    const diffEngineCheckbox = page.getByRole('checkbox', {
      name: /Use Google Diff-Match-Patch Engine/i,
    });
    if (await diffEngineCheckbox.isChecked()) {
      await diffEngineCheckbox.click();
    }
    await expect(diffEngineCheckbox).not.toBeChecked();

    const analysisButton = page.getByRole('button', { name: /Run Multi-Agent Analysis/i });
    await expect(analysisButton).toBeEnabled();
    await analysisButton.click();

    // Wait for analysis to complete
    await expect(page.getByText(/Analyzing/i)).toBeVisible();
    await expect(page.getByText(/Analyzing/i)).not.toBeVisible({ timeout: 30000 });

    await expect(page.getByText(/Analysis Summary/i)).toBeVisible();

    await page.getByRole('navigation').getByRole('button', { name: 'Upload Documents' }).click();

    await page.locator('textarea').nth(0).clear();
    await page.locator('textarea').nth(1).clear();
    await page.locator('textarea').nth(0).fill(originalText);
    await page.locator('textarea').nth(1).fill(revisedText);

    await diffEngineCheckbox.click();
    await expect(diffEngineCheckbox).toBeChecked();

    await expect(analysisButton).toBeEnabled();
    await analysisButton.click();

    // Wait for analysis to complete
    await expect(page.getByText(/Analyzing/i)).toBeVisible();
    await expect(page.getByText(/Analyzing/i)).not.toBeVisible({ timeout: 30000 });

    await expect(page.getByText(/Analysis Summary/i)).toBeVisible();

    // Both engines should produce analysis results
  });

  test('should handle engine switching during analysis workflow', async ({ page }) => {
    const shortOriginal = 'Original text for testing.';
    const shortRevised = 'Revised text for comprehensive testing.';

    // Fill manuscripts
    await page.locator('textarea').nth(0).fill(shortOriginal);
    await page.locator('textarea').nth(1).fill(shortRevised);

    const diffEngineCheckbox = page.getByRole('checkbox', {
      name: /Use Google Diff-Match-Patch Engine/i,
    });
    const analysisButton = page.getByRole('button', { name: /Run Multi-Agent Analysis/i });

    await page.getByRole('combobox').selectOption('word');
    await expect(diffEngineCheckbox).not.toBeChecked();
    await expect(analysisButton).toBeEnabled();

    await page.getByRole('combobox').selectOption('sentence');
    await diffEngineCheckbox.click();
    await expect(diffEngineCheckbox).toBeChecked();
    await expect(analysisButton).toBeEnabled();

    await analysisButton.click();
    await expect(page.getByText(/Analyzing/i)).toBeVisible();
    await expect(page.getByText(/Analyzing/i)).not.toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Analysis Summary/i)).toBeVisible();
  });
});

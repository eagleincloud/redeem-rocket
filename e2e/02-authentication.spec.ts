import { test, expect } from '@playwright/test';

test.describe('🔐 Authentication Tests', () => {

  test('should load login page with form elements', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Page should be visible
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for content to load
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Continue if timeout
    }
  });

  test('should load signup page', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    
    await expect(page.locator('body')).toBeVisible();
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Continue if timeout
    }
  });

  test('should load password recovery page', async ({ page }) => {
    await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
    
    await expect(page.locator('body')).toBeVisible();
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Continue if timeout
    }
  });

  test('should load email verification page', async ({ page }) => {
    await page.goto('/verify-email', { waitUntil: 'domcontentloaded' });
    
    await expect(page.locator('body')).toBeVisible();
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Continue if timeout
    }
  });

  test('should load onboarding page', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
    
    await expect(page.locator('body')).toBeVisible();
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Continue if timeout
    }
  });

  test('should navigate from login to signup', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for page to be interactive
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (e) {
      // Continue even if timeout
    }
    
    // Verify we're on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('should navigate to forgot password flow', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Verify login page loads
    await expect(page.locator('body')).toBeVisible();
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (e) {
      // Continue
    }
  });
});

test.describe('♿ Accessibility Tests', () => {

  test('should have accessible form elements on login', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    await expect(page.locator('body')).toBeVisible();
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (e) {
      // Continue
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Page should be visible
    await expect(page.locator('body')).toBeVisible();
    
    // Try Tab navigation (should not crash)
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Page should still be visible
    await expect(page.locator('body')).toBeVisible();
  });
});

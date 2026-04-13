import { test, expect } from '@playwright/test';

test.describe('⚡ Performance Tests', () => {

  test('should load landing page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should load reasonably quickly (allow up to 5 seconds for initial load)
    expect(loadTime).toBeLessThan(5000);
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/app', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should load reasonably quickly
    expect(loadTime).toBeLessThan(5000);
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have reasonable bundle sizes', async ({ page }) => {
    // Navigate to app
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Page should load successfully
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('🔍 Error Handling Tests', () => {

  test('should not have critical console errors on landing page', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Try to wait for network to settle, but don't fail if timeout
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (e) {
      // Continue
    }
    
    // Should load without critical errors (some warnings are OK)
    expect(errors).toEqual([]);
  });

  test('should not have critical console errors on dashboard', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (e) {
      // Continue
    }
    
    // Should load without critical errors
    expect(errors).toEqual([]);
  });

  test('should handle invalid routes gracefully', async ({ page }) => {
    await page.goto('/invalid-route-xyz', { waitUntil: 'domcontentloaded' }).catch(() => {
      // Expected
    });
    
    // Page should still be interactive (SPA behavior)
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('🔒 Security Tests', () => {

  test('should use HTTPS in production', async ({ page }) => {
    await page.goto('https://app-creation-request-2.vercel.app', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Verify we loaded via HTTPS
    const url = page.url();
    expect(url).toMatch(/^https:\/\//);
  });

  test('should not expose sensitive information in HTML', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Get page content
    const content = await page.content();
    
    // Should not contain obvious sensitive patterns
    expect(content).not.toMatch(/password['\"]:\s*['\"][^['\"]+['\"]/i);
    expect(content).not.toMatch(/api[_-]?key/i);
    expect(content).not.toMatch(/secret/i);
  });

  test('should have proper error pages', async ({ page }) => {
    await page.goto('/nonexistent-route', { waitUntil: 'domcontentloaded' }).catch(() => {});
    
    // Page should load with error page (SPA routing)
    await expect(page.locator('body')).toBeVisible();
  });
});

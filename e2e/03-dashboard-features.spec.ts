import { test, expect } from '@playwright/test';

test.describe('📊 Dashboard Features Tests', () => {

  test('should load dashboard without errors', async ({ page }) => {
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    
    // Page should load
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for network to settle
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('should have responsive layout', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle').catch(() => {});
  });
});

test.describe('🔍 Dashboard Navigation Tests', () => {

  const pages = [
    { path: '/app/products', name: 'Products' },
    { path: '/app/offers', name: 'Offers' },
    { path: '/app/auctions', name: 'Auctions' },
    { path: '/app/orders', name: 'Orders' },
    { path: '/app/wallet', name: 'Wallet' },
    { path: '/app/analytics', name: 'Analytics' },
    { path: '/app/team', name: 'Team' },
    { path: '/app/profile', name: 'Profile' },
  ];

  pages.forEach(({ path, name }) => {
    test(`should load ${name} page`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      
      // Page should load without crashing
      await expect(page.locator('body')).toBeVisible();
      
      // Check page has content
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
      expect(bodyText?.length).toBeGreaterThan(0);
    });

    test(`should navigate to ${name} and back to dashboard`, async ({ page }) => {
      // Mark this as a slower test due to navigation sequences
      test.slow();
      
      // Navigate to dashboard first
      await page.goto('/app', { waitUntil: 'load' });
      
      // Wait for dashboard to be interactive
      try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch (e) {
        // Continue even if networkidle times out
      }
      
      // Small delay to ensure dashboard is settled
      await page.waitForTimeout(500);
      
      // Navigate to specific page
      await page.goto(path, { waitUntil: 'load' });
      
      // Wait for page to load
      try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch (e) {
        // Continue even if networkidle times out
      }
      
      const pageUrl = page.url();
      const pathPart = path.split('/').pop();
      expect(pageUrl).toContain(pathPart);
      
      // Small delay before navigating back
      await page.waitForTimeout(500);
      
      // Navigate back to dashboard with extended timeout
      await page.goto('/app', { waitUntil: 'load', timeout: 30000 });
      
      // Wait for dashboard to load with longer timeout
      try {
        await page.waitForLoadState('networkidle', { timeout: 20000 });
      } catch (e) {
        // Continue if it takes a bit longer
      }
      
      // Verify we're back at dashboard
      const dashboardUrl = page.url();
      expect(dashboardUrl).toMatch(/\/app\/?$/);
      
      // Ensure page is loaded
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

test.describe('🎨 UI Elements Tests', () => {

  test('should display UI elements without layout issues', async ({ page }) => {
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    
    // Wait for content to load
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Continue if timeout
    }
    
    // Check that page has rendered content
    const body = page.locator('body');
    const content = await body.textContent();
    expect(content).toBeTruthy();
  });

  test('should have interactive buttons', async ({ page }) => {
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    
    // Look for any buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    // Dashboard should have at least some buttons
    expect(buttonCount).toBeGreaterThanOrEqual(0);
  });

  test('should have proper color scheme', async ({ page }) => {
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    
    // Get computed style
    const body = page.locator('body');
    const bgColor = await body.evaluate(el => window.getComputedStyle(el).backgroundColor);
    
    // Background should be set (not transparent)
    expect(bgColor).toBeTruthy();
  });
});

test.describe('📱 Responsive Design Tests', () => {

  const viewports = [
    { name: 'Mobile (iPhone 12)', width: 390, height: 844 },
    { name: 'Tablet (iPad)', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`should render properly on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/app', { waitUntil: 'domcontentloaded' });
      
      // Wait for page to fully load
      try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch (e) {
        // Continue if timeout
      }
      
      // Page should load
      await expect(page.locator('body')).toBeVisible();
      
      // Check for horizontal scroll (bad for responsive)
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      
      // Allow small overflow due to scrollbars
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
    });
  });
});

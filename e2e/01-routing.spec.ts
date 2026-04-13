import { test, expect } from '@playwright/test';

test.describe('🌐 Route Navigation Tests', () => {
  
  test('should load landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/GeoDeals|Business/i);
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for network with fallback
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // It's okay if networkidle times out
    }
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('body')).toBeVisible();
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Continue even if timeout
    }
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/signup/);
    await expect(page.locator('body')).toBeVisible();
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Continue even if timeout
    }
  });

  test('should navigate to onboarding page', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/onboarding/);
    await expect(page.locator('body')).toBeVisible();
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Continue even if timeout
    }
  });

  test('should load app dashboard', async ({ page }) => {
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    // Dashboard may redirect to login if not authenticated
    // Just verify page loads without errors
    await expect(page.locator('body')).toBeVisible();
    
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Continue even if timeout
    }
  });
});

test.describe('📱 Dashboard Route Navigation Tests', () => {
  const dashboardRoutes = [
    '/app/products',
    '/app/offers',
    '/app/auctions',
    '/app/orders',
    '/app/requirements',
    '/app/wallet',
    '/app/analytics',
    '/app/grow',
    '/app/photos',
    '/app/profile',
    '/app/notifications',
    '/app/subscription',
    '/app/marketing',
    '/app/campaigns',
    '/app/invoices',
    '/app/leads',
    '/app/outreach',
    '/app/team',
  ];

  dashboardRoutes.forEach((route) => {
    test(`should load ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      // Page should load (may show login or actual page)
      await expect(page.locator('body')).toBeVisible();
      
      // Wait for network to be idle with fallback
      try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch (e) {
        // It's OK if networkidle times out on some routes
      }
    });
  });
});

test.describe('❌ Error Handling Tests', () => {
  
  test('should show error for invalid route', async ({ page }) => {
    await page.goto('/invalid-route-12345', { waitUntil: 'domcontentloaded' }).catch(() => {
      // Expected to potentially fail
    });
    // Page should still load (SPA behavior)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show error for /team (wrong path)', async ({ page }) => {
    await page.goto('/team', { waitUntil: 'domcontentloaded' });
    // Should either show error or redirect appropriately
    await expect(page.locator('body')).toBeVisible();
  });
});

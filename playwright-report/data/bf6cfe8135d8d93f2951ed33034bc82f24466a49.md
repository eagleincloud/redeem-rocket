# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-dashboard-features.spec.ts >> 🔍 Dashboard Navigation Tests >> should navigate to Wallet and back to dashboard
- Location: e2e/03-dashboard-features.spec.ts:53:5

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "wallet"
Received string:    "https://app-creation-request-2.vercel.app/login"
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "🏪" [level=1] [ref=e7]
    - heading "Business Login" [level=4] [ref=e8]
    - paragraph [ref=e9]: Sign in to your business account
  - generic [ref=e11]:
    - tablist [ref=e12]:
      - tab "Password" [selected] [ref=e13]
      - tab "OTP" [ref=e14]
    - tabpanel "Password" [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: Email
          - textbox "you@business.com" [ref=e19]
        - generic [ref=e20]:
          - generic [ref=e21]: Password
          - generic [ref=e22]:
            - textbox "••••••••" [ref=e23]
            - button [ref=e24]:
              - img [ref=e25]
        - button "Login" [ref=e28]
        - link "Forgot password?" [ref=e30] [cursor=pointer]:
          - /url: /forgot-password
      - generic [ref=e35]: or continue with
      - button "Google" [ref=e36]
      - generic [ref=e37]:
        - text: Don't have an account?
        - link "Sign up" [ref=e38] [cursor=pointer]:
          - /url: /signup
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('📊 Dashboard Features Tests', () => {
  4   | 
  5   |   test('should load dashboard without errors', async ({ page }) => {
  6   |     await page.goto('/app');
  7   |     
  8   |     // Page should load
  9   |     await expect(page.locator('body')).toBeVisible();
  10  |   });
  11  | 
  12  |   test('should have responsive layout', async ({ page }) => {
  13  |     // Test desktop view
  14  |     await page.setViewportSize({ width: 1920, height: 1080 });
  15  |     await page.goto('/app');
  16  |     await expect(page.locator('body')).toBeVisible();
  17  |   });
  18  | 
  19  |   test('should work on mobile viewport', async ({ page }) => {
  20  |     // Test mobile view
  21  |     await page.setViewportSize({ width: 375, height: 667 });
  22  |     await page.goto('/app');
  23  |     await expect(page.locator('body')).toBeVisible();
  24  |   });
  25  | });
  26  | 
  27  | test.describe('🔍 Dashboard Navigation Tests', () => {
  28  | 
  29  |   const pages = [
  30  |     { path: '/app/products', name: 'Products' },
  31  |     { path: '/app/offers', name: 'Offers' },
  32  |     { path: '/app/auctions', name: 'Auctions' },
  33  |     { path: '/app/orders', name: 'Orders' },
  34  |     { path: '/app/wallet', name: 'Wallet' },
  35  |     { path: '/app/analytics', name: 'Analytics' },
  36  |     { path: '/app/team', name: 'Team' },
  37  |     { path: '/app/profile', name: 'Profile' },
  38  |   ];
  39  | 
  40  |   pages.forEach(({ path, name }) => {
  41  |     test(`should load ${name} page`, async ({ page }) => {
  42  |       await page.goto(path);
  43  |       
  44  |       // Page should load without crashing
  45  |       await expect(page.locator('body')).toBeVisible();
  46  |       
  47  |       // Check page isn't showing error
  48  |       const body = page.locator('body');
  49  |       const hasContent = (await body.textContent()).length > 0;
  50  |       expect(hasContent).toBeTruthy();
  51  |     });
  52  | 
  53  |     test(`should navigate to ${name} and back to dashboard`, async ({ page }) => {
  54  |       await page.goto('/app');
  55  |       const initialUrl = page.url();
  56  |       
  57  |       await page.goto(path);
> 58  |       expect(page.url()).toContain(path.split('/').pop());
      |                          ^ Error: expect(received).toContain(expected) // indexOf
  59  |       
  60  |       // Navigate back to dashboard
  61  |       await page.goto('/app');
  62  |       expect(page.url()).toContain('/app');
  63  |     });
  64  |   });
  65  | });
  66  | 
  67  | test.describe('🎨 UI Elements Tests', () => {
  68  | 
  69  |   test('should display UI elements without layout issues', async ({ page }) => {
  70  |     await page.goto('/app');
  71  |     
  72  |     // Wait for content to load
  73  |     await page.waitForLoadState('networkidle');
  74  |     
  75  |     // Check that page has rendered content
  76  |     const body = page.locator('body');
  77  |     const content = await body.textContent();
  78  |     expect(content).toBeTruthy();
  79  |   });
  80  | 
  81  |   test('should have interactive buttons', async ({ page }) => {
  82  |     await page.goto('/app');
  83  |     
  84  |     // Look for any buttons
  85  |     const buttons = page.locator('button');
  86  |     const buttonCount = await buttons.count();
  87  |     
  88  |     // Dashboard should have at least some buttons
  89  |     expect(buttonCount).toBeGreaterThanOrEqual(0);
  90  |   });
  91  | 
  92  |   test('should have proper color scheme', async ({ page }) => {
  93  |     await page.goto('/app');
  94  |     
  95  |     // Get computed style
  96  |     const body = page.locator('body');
  97  |     const bgColor = await body.evaluate(el => window.getComputedStyle(el).backgroundColor);
  98  |     
  99  |     // Background should be set (not transparent)
  100 |     expect(bgColor).toBeTruthy();
  101 |   });
  102 | });
  103 | 
  104 | test.describe('📱 Responsive Design Tests', () => {
  105 | 
  106 |   const viewports = [
  107 |     { name: 'Mobile (iPhone 12)', width: 390, height: 844 },
  108 |     { name: 'Tablet (iPad)', width: 768, height: 1024 },
  109 |     { name: 'Desktop', width: 1920, height: 1080 },
  110 |   ];
  111 | 
  112 |   viewports.forEach(({ name, width, height }) => {
  113 |     test(`should render properly on ${name}`, async ({ page }) => {
  114 |       await page.setViewportSize({ width, height });
  115 |       await page.goto('/app');
  116 |       
  117 |       // Page should load
  118 |       await expect(page.locator('body')).toBeVisible();
  119 |       
  120 |       // Check for horizontal scroll (bad for responsive)
  121 |       const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  122 |       const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  123 |       
  124 |       // Allow small overflow due to scrollbars
  125 |       expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  126 |     });
  127 |   });
  128 | });
  129 | 
```
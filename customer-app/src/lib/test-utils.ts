/**
 * Test utilities and helpers for comprehensive testing
 * Used across all feature testing scenarios
 */

// Mock localStorage for testing
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; }
  };
};

// Validation test helpers
export const testValidation = {
  email: (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone: string): boolean => /^\d{10,}$/.test(phone.replace(/\D/g, '')),
  required: (value: string): boolean => value.trim().length > 0,
  number: (value: string): boolean => !isNaN(Number(value)) && Number(value) >= 0,
  minLength: (value: string, min: number): boolean => value.trim().length >= min,
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

// Data generation for testing
export const generateTestData = {
  lead: () => ({
    id: Math.random(),
    name: 'Test Lead',
    email: 'test@example.com',
    phone: '1234567890',
    company: 'Test Co',
    stage: 'new',
    priority: 'high',
    source: 'website'
  }),
  campaign: () => ({
    id: Math.random(),
    name: 'Test Campaign',
    message: 'Test message',
    channel: 'email',
    status: 'draft'
  }),
  product: () => ({
    id: Math.random(),
    name: 'Test Product',
    sku: 'TST001',
    price: 999,
    stock: 10,
    category: 'Hair Care',
    description: 'Test product description'
  }),
  rule: () => ({
    id: Math.random(),
    name: 'Test Rule',
    trigger: 'lead_added',
    action: 'send_email',
    is_active: true
  }),
  teamMember: () => ({
    id: Math.random(),
    name: 'Test Member',
    email: 'member@example.com',
    phone: '1234567890',
    role: 'Staff',
    status: 'Active'
  })
};

// Assertion helpers
export const assertions = {
  arrayContains: (arr: any[], item: any): boolean =>
    arr.some(a => JSON.stringify(a) === JSON.stringify(item)),
  localStorageHas: (key: string): boolean =>
    typeof window !== 'undefined' && localStorage.getItem(key) !== null,
  localStorageValue: (key: string): any => {
    if (typeof window === 'undefined') return null;
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  localStorageEmpty: (): boolean =>
    typeof window === 'undefined' || localStorage.length === 0,
  consoleHasErrors: (logs: any[]): boolean =>
    logs.some(log => log.level === 'error' || log.level === 'warn')
};

// Test data cleanup
export const cleanupTestData = () => {
  if (typeof window !== 'undefined') {
    // Clear localStorage
    localStorage.clear();
    // Clear any test-specific items
    Object.keys(localStorage).forEach(key => {
      if (key.includes('test') || key.includes('mock')) {
        localStorage.removeItem(key);
      }
    });
  }
};

// Async helpers
export const wait = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const waitFor = async (
  condition: () => boolean,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> => {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`waitFor timeout after ${timeoutMs}ms`);
    }
    await wait(intervalMs);
  }
};

// Error boundary testing
export const captureError = (fn: () => void): Error | null => {
  try {
    fn();
    return null;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
};

// Performance testing
export const measurePerformance = async (
  name: string,
  fn: () => Promise<void>
): Promise<number> => {
  const start = performance.now();
  try {
    await fn();
  } finally {
    const end = performance.now();
    const duration = end - start;
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }
};

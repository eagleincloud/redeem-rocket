import '@testing-library/jest-dom';

// ── localStorage polyfill for jsdom ──────────────────────────────────────────
// jsdom v29+ may have localStorage issues in some configurations; provide a
// robust in-memory implementation so all tests can rely on it.

const localStorageStore: Record<string, string> = {};

const localStorageMock: Storage = {
  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(localStorageStore, key)
      ? localStorageStore[key]
      : null;
  },
  setItem(key: string, value: string): void {
    localStorageStore[key] = String(value);
  },
  removeItem(key: string): void {
    delete localStorageStore[key];
  },
  clear(): void {
    Object.keys(localStorageStore).forEach(k => { delete localStorageStore[k]; });
  },
  get length(): number {
    return Object.keys(localStorageStore).length;
  },
  key(index: number): string | null {
    return Object.keys(localStorageStore)[index] ?? null;
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// ── sessionStorage polyfill ───────────────────────────────────────────────────
const sessionStore: Record<string, string> = {};
const sessionStorageMock: Storage = {
  getItem: (k) => sessionStore[k] ?? null,
  setItem: (k, v) => { sessionStore[k] = String(v); },
  removeItem: (k) => { delete sessionStore[k]; },
  clear: () => { Object.keys(sessionStore).forEach(k => { delete sessionStore[k]; }); },
  get length() { return Object.keys(sessionStore).length; },
  key: (i) => Object.keys(sessionStore)[i] ?? null,
};

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true,
});

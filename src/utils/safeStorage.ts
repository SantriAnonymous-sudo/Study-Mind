/**
 * Safe Browser Storage Utility with In-Memory fallback
 * Prevents DOMExceptions in sandboxed iframes or browsers blocking third-party storage.
 */

const inMemoryDb: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      const val = localStorage.getItem(key);
      if (val === 'null' || val === 'undefined') return null;
      return val;
    } catch (e) {
      const val = inMemoryDb[key];
      if (val === 'null' || val === 'undefined') return null;
      return val || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      inMemoryDb[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete inMemoryDb[key];
    }
  }
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      const val = sessionStorage.getItem(key);
      if (val === 'null' || val === 'undefined') return null;
      return val;
    } catch (e) {
      const val = inMemoryDb[key];
      if (val === 'null' || val === 'undefined') return null;
      return val || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      inMemoryDb[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      delete inMemoryDb[key];
    }
  }
};

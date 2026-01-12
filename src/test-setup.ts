import { vi } from 'vitest';

const localStorageMock = {
  getItem: vi.fn((key: string) => null),
  setItem: vi.fn((key: string, value: string) => {}),
  removeItem: vi.fn((key: string) => {}),
  clear: vi.fn(() => {}),
};

// Mock localStorage on the global object
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Also mock on window for completeness
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

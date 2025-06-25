/**
 * Jest Setup File
 * Configure test environment and global mocks
 */

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock;

// Setup localStorage for test environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
}

// Suppress console output during tests
console.error = jest.fn();
console.warn = jest.fn();
console.log = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.resetAllMocks();
}); 
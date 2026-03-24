/**
 * Jest setup file for Chrome extension testing
 * Initializes test environment and global mocks
 */

// Setup jsdom environment
global.chrome = require('../mocks/chromeMock.js');

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Add custom matchers if needed
expect.extend({
  toBeValidPrompt(received) {
    const pass = typeof received === 'string' && received.length > 0 && received.length <= 50000;
    return {
      pass,
      message: () => `expected ${received} to be a valid prompt string`
    };
  }
});
